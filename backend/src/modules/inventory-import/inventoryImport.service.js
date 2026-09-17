const { Op } = require("sequelize");
const db = require("../../models");
const AppError = require("../../utils/AppError");

const clean = (value) =>
  value === undefined || value === null
    ? ""
    : String(value).trim();

const cleanUpper = (value) =>
  clean(value).toUpperCase();

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : NaN;
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character = line[index];

    if (character === '"') {
      if (
        inQuotes &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (
      character === "," &&
      !inQuotes
    ) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const parseCsvBuffer = (buffer) => {
  const text = buffer
    .toString("utf8")
    .replace(/^\uFEFF/, "");

  const lines = text
    .split(/\r?\n/)
    .filter(
      (line, index) =>
        index === 0 ||
        line.trim() !== ""
    );

  if (!lines.length) {
    throw new AppError(
      "CSV file is empty.",
      400,
      "INVENTORY_IMPORT_EMPTY_FILE"
    );
  }

  const headers = parseCsvLine(
    lines[0]
  ).map((value) => clean(value));

  const requiredHeaders = [
    "locationCode",
    "variantSku",
    "quantityOnHand",
    "quantityReserved",
  ];

  const missingHeaders =
    requiredHeaders.filter(
      (header) =>
        !headers.includes(header)
    );

  if (missingHeaders.length) {
    throw new AppError(
      `Missing required columns: ${missingHeaders.join(", ")}.`,
      400,
      "INVENTORY_IMPORT_INVALID_HEADERS"
    );
  }

  const rows = [];

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const values = parseCsvLine(
      lines[index]
    );

    const row = {
      rowNumber: index + 1,
    };

    headers.forEach(
      (header, columnIndex) => {
        row[header] =
          values[columnIndex] ?? "";
      }
    );

    rows.push(row);
  }

  return {
    headers,
    rows,
  };
};

const buildLookupData = async ({
  companyId,
  rows,
}) => {
  const locationCodes = [
    ...new Set(
      rows.map((row) =>
        cleanUpper(row.locationCode)
      )
    ),
  ].filter(Boolean);

  const variantSkus = [
    ...new Set(
      rows.map((row) =>
        cleanUpper(row.variantSku)
      )
    ),
  ].filter(Boolean);

  const [locations, variants] =
    await Promise.all([
      db.InventoryLocation.findAll({
        where: {
          companyId,
          code: {
            [Op.in]: locationCodes,
          },
        },
      }),

      db.ProductVariant.findAll({
        where: {
          companyId,
          sku: {
            [Op.in]: variantSkus,
          },
        },

        include: [
          {
            model: db.Product,
            as: "product",
            required: true,
            attributes: [
              "id",
              "name",
              "isDirectDelivery",
            ],
          },
        ],
      }),
    ]);

  return {
    locationsByCode: new Map(
      locations.map((location) => [
        cleanUpper(location.code),
        location,
      ])
    ),

    variantsBySku: new Map(
      variants.map((variant) => [
        cleanUpper(variant.sku),
        variant,
      ])
    ),
  };
};

const validateAndNormalizeRows =
  async ({
    companyId,
    rows,
  }) => {
    const {
      locationsByCode,
      variantsBySku,
    } = await buildLookupData({
      companyId,
      rows,
    });

    const seen = new Set();
    const normalizedRows = [];
    const errors = [];

    for (const rawRow of rows) {
      const rowNumber = Number(
        rawRow.rowNumber || 0
      );

      const locationCode =
        cleanUpper(rawRow.locationCode);

      const variantSku =
        cleanUpper(rawRow.variantSku);

      const quantityOnHand =
        toNumber(rawRow.quantityOnHand);

      const quantityReserved =
        toNumber(rawRow.quantityReserved);

      const rowErrors = [];

      if (!locationCode) {
        rowErrors.push(
          "Location code is required."
        );
      }

      if (!variantSku) {
        rowErrors.push(
          "Variant SKU is required."
        );
      }

      if (
        !Number.isFinite(
          quantityOnHand
        ) ||
        quantityOnHand < 0
      ) {
        rowErrors.push(
          "On-hand quantity must be zero or greater."
        );
      }

      if (
        !Number.isFinite(
          quantityReserved
        ) ||
        quantityReserved < 0
      ) {
        rowErrors.push(
          "Reserved quantity must be zero or greater."
        );
      }

      if (
        Number.isFinite(
          quantityOnHand
        ) &&
        Number.isFinite(
          quantityReserved
        ) &&
        quantityReserved >
          quantityOnHand
      ) {
        rowErrors.push(
          "Reserved quantity cannot exceed on-hand quantity."
        );
      }

      const location =
        locationsByCode.get(
          locationCode
        );

      if (
        locationCode &&
        !location
      ) {
        rowErrors.push(
          `Inventory location "${locationCode}" was not found.`
        );
      } else if (
        location &&
        location.isActive !== true
      ) {
        rowErrors.push(
          `Inventory location "${locationCode}" is inactive.`
        );
      }

      const variant =
        variantsBySku.get(
          variantSku
        );

      if (
        variantSku &&
        !variant
      ) {
        rowErrors.push(
          `Variant SKU "${variantSku}" was not found.`
        );
      } else if (
        variant?.product
          ?.isDirectDelivery === true
      ) {
        rowErrors.push(
          "Direct-delivery products do not use internal inventory balances."
        );
      }

      const duplicateKey =
        `${locationCode}::${variantSku}`;

      if (
        seen.has(
          duplicateKey
        )
      ) {
        rowErrors.push(
          "Duplicate locationCode + variantSku combination in this CSV."
        );
      } else {
        seen.add(
          duplicateKey
        );
      }

      if (rowErrors.length) {
        errors.push({
          rowNumber,
          locationCode,
          variantSku,
          message:
            rowErrors.join(" "),
        });

        continue;
      }

      normalizedRows.push({
        rowNumber,
        locationCode,
        variantSku,
        inventoryLocationId:
          location.id,
        productVariantId:
          variant.id,
        productName:
          variant.product
            ?.name || null,
        variantName:
          variant.name,
        quantityOnHand,
        quantityReserved,
      });
    }

    return {
      normalizedRows,
      errors,
    };
  };

const loadExistingBalances =
  async ({
    companyId,
    normalizedRows,
  }) => {
    const locationIds = [
      ...new Set(
        normalizedRows.map(
          (row) =>
            row.inventoryLocationId
        )
      ),
    ];

    const variantIds = [
      ...new Set(
        normalizedRows.map(
          (row) =>
            row.productVariantId
        )
      ),
    ];

    if (
      !locationIds.length ||
      !variantIds.length
    ) {
      return new Map();
    }

    const balances =
      await db.InventoryBalance.findAll({
        where: {
          companyId,

          inventoryLocationId: {
            [Op.in]: locationIds,
          },

          productVariantId: {
            [Op.in]: variantIds,
          },
        },
      });

    return new Map(
      balances.map((balance) => [
        `${balance.inventoryLocationId}::${balance.productVariantId}`,
        balance,
      ])
    );
  };

exports.getTemplateCsv = () =>
  [
    "locationCode,variantSku,quantityOnHand,quantityReserved",
    "DXB_HUB,1000011-256-DEEPB,10,2",
    "SHJ_HUB,1000011-256-DEEPB,15,4",
  ].join("\n");

exports.parseUploadedCsv = ({
  file,
}) => {
  if (!file?.buffer) {
    throw new AppError(
      "CSV file is required.",
      400,
      "INVENTORY_IMPORT_FILE_REQUIRED"
    );
  }

  return parseCsvBuffer(
    file.buffer
  );
};

exports.previewImport =
  async ({
    companyId,
    rows,
  }) => {
    const {
      normalizedRows,
      errors,
    } =
      await validateAndNormalizeRows({
        companyId,
        rows,
      });

    const existingByKey =
      await loadExistingBalances({
        companyId,
        normalizedRows,
      });

    const results =
      normalizedRows.map((row) => {
        const key =
          `${row.inventoryLocationId}::${row.productVariantId}`;

        const existing =
          existingByKey.get(key);

        let action = "CREATE";

        if (existing) {
          const same =
            Number(
              existing.quantityOnHand ||
                0
            ) ===
              Number(
                row.quantityOnHand
              ) &&
            Number(
              existing.quantityReserved ||
                0
            ) ===
              Number(
                row.quantityReserved
              );

          action =
            same
              ? "UNCHANGED"
              : "UPDATE";
        }

        return {
          ...row,
          action,
          currentQuantityOnHand:
            existing
              ? Number(
                  existing.quantityOnHand ||
                    0
                )
              : null,
          currentQuantityReserved:
            existing
              ? Number(
                  existing.quantityReserved ||
                    0
                )
              : null,
        };
      });

    return {
      summary: {
        total: rows.length,
        valid: results.length,
        create:
          results.filter(
            (row) =>
              row.action === "CREATE"
          ).length,
        update:
          results.filter(
            (row) =>
              row.action === "UPDATE"
          ).length,
        unchanged:
          results.filter(
            (row) =>
              row.action ===
              "UNCHANGED"
          ).length,
        failed: errors.length,
      },

      rows: results,
      errors,
    };
  };

exports.executeImport =
  async ({
    companyId,
    userId,
    rows,
  }) => {
    const preview =
      await exports.previewImport({
        companyId,
        rows,
      });

    if (preview.errors.length) {
      throw new AppError(
        "Inventory import contains validation errors. Preview and correct the CSV before executing.",
        400,
        "INVENTORY_IMPORT_HAS_ERRORS",
        preview.errors
      );
    }

    const executableRows =
      preview.rows.filter(
        (row) =>
          row.action !== "UNCHANGED"
      );

    await db.sequelize.transaction(
      async (transaction) => {
        for (const row of executableRows) {
          const existing =
            await db.InventoryBalance.findOne({
              where: {
                companyId,
                inventoryLocationId:
                  row.inventoryLocationId,
                productVariantId:
                  row.productVariantId,
              },
              transaction,
              lock:
                transaction.LOCK.UPDATE,
            });

          if (existing) {
            existing.quantityOnHand =
              row.quantityOnHand;

            existing.quantityReserved =
              row.quantityReserved;

            existing.updatedBy =
              userId || null;

            await existing.save({
              transaction,
            });

            continue;
          }

          await db.InventoryBalance.create(
            {
              companyId,
              inventoryLocationId:
                row.inventoryLocationId,
              productVariantId:
                row.productVariantId,
              quantityOnHand:
                row.quantityOnHand,
              quantityReserved:
                row.quantityReserved,
              createdBy:
                userId || null,
              updatedBy:
                userId || null,
            },
            {
              transaction,
            }
          );
        }
      }
    );

    return {
      summary: {
        total:
          preview.summary.total,
        created:
          preview.summary.create,
        updated:
          preview.summary.update,
        unchanged:
          preview.summary.unchanged,
        failed: 0,
      },

      rows:
        preview.rows,

      errors: [],
    };
  };

const escapeCsv = (value) => {
  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
};

exports.exportCsv =
  async ({
    companyId,
  }) => {
    const balances =
      await db.InventoryBalance.findAll({
        where: {
          companyId,
        },

        include: [
          {
            model:
              db.InventoryLocation,
            as: "location",
            required: true,
          },

          {
            model:
              db.ProductVariant,
            as: "variant",
            required: true,

            include: [
              {
                model: db.Product,
                as: "product",
                required: true,
                attributes: [
                  "id",
                  "name",
                  "isDirectDelivery",
                ],
              },
            ],
          },
        ],

        order: [
          [
            {
              model:
                db.InventoryLocation,
              as: "location",
            },
            "sortOrder",
            "ASC",
          ],
          [
            {
              model:
                db.ProductVariant,
              as: "variant",
            },
            "sku",
            "ASC",
          ],
        ],
      });

    const lines = [
      [
        "locationCode",
        "locationName",
        "locationType",
        "variantSku",
        "barcode",
        "productName",
        "variantName",
        "quantityOnHand",
        "quantityReserved",
        "quantityAvailable",
      ].join(","),
    ];

    for (const balance of balances) {
      const quantityOnHand =
        Number(
          balance.quantityOnHand ||
            0
        );

      const quantityReserved =
        Number(
          balance.quantityReserved ||
            0
        );

      const quantityAvailable =
        Math.max(
          0,
          quantityOnHand -
            quantityReserved
        );

      lines.push(
        [
          balance.location?.code,
          balance.location?.name,
          balance.location
            ?.locationType,
          balance.variant?.sku,
          balance.variant?.barcode,
          balance.variant
            ?.product?.name,
          balance.variant?.name,
          quantityOnHand,
          quantityReserved,
          quantityAvailable,
        ]
          .map(escapeCsv)
          .join(",")
      );
    }

    return lines.join("\n");
  };
