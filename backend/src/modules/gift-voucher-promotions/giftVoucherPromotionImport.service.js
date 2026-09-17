const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
  );

const giftVoucherPromotionService =
  require(
    "./giftVoucherPromotion.service"
  );

/*
|--------------------------------------------------------------------------
| CSV Template
|--------------------------------------------------------------------------
*/

const TEMPLATE_HEADERS = [
  "promotionCode",
  "promotionName",
  "description",
  "discountType",
  "discountValue",
  "fundingType",
  "fundingSource",
  "currencyCode",
  "channelCode",
  "validFrom",
  "validUntil",
  "priority",
  "isActive",
  "variantSku",
];

const getTemplateCsv =
  () => {
    const sampleRows = [
      [
        "APPLE_GV_300",
        "Apple MacBook Gift Voucher AED 300",
        "Apple funded MacBook promotion",
        "FIXED_AMOUNT",
        "300",
        "EXTERNAL",
        "Apple",
        "AED",
        "WEBSITE",
        "2026-09-01T00:00:00+04:00",
        "2026-09-30T23:59:59+04:00",
        "100",
        "true",
        "195949131455",
      ],
      [
        "APPLE_GV_300",
        "Apple MacBook Gift Voucher AED 300",
        "Apple funded MacBook promotion",
        "FIXED_AMOUNT",
        "300",
        "EXTERNAL",
        "Apple",
        "AED",
        "WEBSITE",
        "2026-09-01T00:00:00+04:00",
        "2026-09-30T23:59:59+04:00",
        "100",
        "true",
        "195950853438",
      ],
      [
        "SAMSUNG_GV_200",
        "Samsung Gift Voucher AED 200",
        "Samsung funded promotion",
        "FIXED_AMOUNT",
        "200",
        "EXTERNAL",
        "Samsung",
        "AED",
        "WEBSITE",
        "2026-09-05T00:00:00+04:00",
        "2026-10-05T23:59:59+04:00",
        "100",
        "true",
        "8806099999999",
      ],
    ];

    const csvEscape =
      value => {
        const text =
          String(
            value ??
            ""
          );

        if (
          /[",\r\n]/.test(
            text
          )
        ) {
          return `"${text.replace(
            /"/g,
            '""'
          )}"`;
        }

        return text;
      };

    return [
      TEMPLATE_HEADERS,
      ...sampleRows,
    ]
      .map(
        row =>
          row.map(
            csvEscape
          ).join(
            ","
          )
      )
      .join(
        "\r\n"
      ) +
      "\r\n";
  };

/*
|--------------------------------------------------------------------------
| CSV Parser
|--------------------------------------------------------------------------
|
| No external CSV dependency is required.
| Handles:
| - quoted cells
| - commas inside quoted cells
| - escaped quotes ("")
| - CRLF / LF
|--------------------------------------------------------------------------
*/

const parseCsvMatrix =
  csvText => {
    const source =
      String(
        csvText ||
        ""
      )
        .replace(
          /^\uFEFF/,
          ""
        );

    const rows =
      [];

    let row =
      [];

    let cell =
      "";

    let quoted =
      false;

    for (
      let index = 0;
      index < source.length;
      index += 1
    ) {
      const char =
        source[
          index
        ];

      const next =
        source[
          index + 1
        ];

      if (
        quoted
      ) {
        if (
          char ===
          '"'
        ) {
          if (
            next ===
            '"'
          ) {
            cell +=
              '"';

            index +=
              1;
          } else {
            quoted =
              false;
          }
        } else {
          cell +=
            char;
        }

        continue;
      }

      if (
        char ===
        '"'
      ) {
        quoted =
          true;

        continue;
      }

      if (
        char ===
        ","
      ) {
        row.push(
          cell
        );

        cell =
          "";

        continue;
      }

      if (
        char ===
        "\n"
      ) {
        row.push(
          cell
        );

        rows.push(
          row
        );

        row =
          [];

        cell =
          "";

        continue;
      }

      if (
        char ===
        "\r"
      ) {
        if (
          next ===
          "\n"
        ) {
          continue;
        }

        row.push(
          cell
        );

        rows.push(
          row
        );

        row =
          [];

        cell =
          "";

        continue;
      }

      cell +=
        char;
    }

    if (
      cell.length ||
      row.length
    ) {
      row.push(
        cell
      );

      rows.push(
        row
      );
    }

    return rows.filter(
      current =>
        current.some(
          value =>
            String(
              value ||
              ""
            ).trim() !==
            ""
        )
    );
  };

const normalizeHeader =
  value =>
    String(
      value ||
      ""
    )
      .trim()
      .replace(
        /[\s_-]+/g,
        ""
      )
      .toLowerCase();

const HEADER_ALIASES = {
  promotioncode:
    "promotionCode",

  code:
    "promotionCode",

  promotionname:
    "promotionName",

  name:
    "promotionName",

  description:
    "description",

  discounttype:
    "discountType",

  discountvalue:
    "discountValue",

  fundingtype:
    "fundingType",

  fundingsource:
    "fundingSource",

  brand:
    "fundingSource",

  vendor:
    "fundingSource",

  currencycode:
    "currencyCode",

  currency:
    "currencyCode",

  channelcode:
    "channelCode",

  channel:
    "channelCode",

  validfrom:
    "validFrom",

  startdate:
    "validFrom",

  validuntil:
    "validUntil",

  enddate:
    "validUntil",

  priority:
    "priority",

  isactive:
    "isActive",

  active:
    "isActive",

  variantsku:
    "variantSku",

  sku:
    "variantSku",
};

const REQUIRED_FIELDS = [
  "promotionCode",
  "promotionName",
  "discountType",
  "discountValue",
  "fundingType",
  "validFrom",
  "validUntil",
  "variantSku",
];

const parseCsvObjects =
  csvText => {
    const matrix =
      parseCsvMatrix(
        csvText
      );

    if (
      matrix.length <
      2
    ) {
      throw new AppError(
        "CSV must contain a header row and at least one data row.",
        400,
        "GV_IMPORT_EMPTY"
      );
    }

    const headers =
      matrix[
        0
      ].map(
        value =>
          HEADER_ALIASES[
            normalizeHeader(
              value
            )
          ] ||
          null
      );

    const missing =
      REQUIRED_FIELDS.filter(
        field =>
          !headers.includes(
            field
          )
      );

    if (
      missing.length
    ) {
      throw new AppError(
        `CSV is missing required column(s): ${missing.join(
          ", "
        )}.`,
        400,
        "GV_IMPORT_COLUMNS_MISSING"
      );
    }

    return matrix
      .slice(
        1
      )
      .map(
        (
          values,
          index
        ) => {
          const row = {
            rowNumber:
              index +
              2,
          };

          headers.forEach(
            (
              header,
              columnIndex
            ) => {
              if (
                !header
              ) {
                return;
              }

              row[
                header
              ] =
                String(
                  values[
                    columnIndex
                  ] ??
                  ""
                ).trim();
            }
          );

          return row;
        }
      );
  };

/*
|--------------------------------------------------------------------------
| Normalizers
|--------------------------------------------------------------------------
*/

const up =
  (
    value,
    fallback =
      ""
  ) =>
    String(
      value ||
      fallback ||
      ""
    )
      .trim()
      .toUpperCase();

const normalizeCode =
  value =>
    up(
      value
    )
      .replace(
        /[^A-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .replace(
        /_+/g,
        "_"
      );

const parseBoolean =
  (
    value,
    fallback =
      true
  ) => {
    const normalized =
      String(
        value ??
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !normalized
    ) {
      return fallback;
    }

    if (
      [
        "true",
        "1",
        "yes",
        "y",
        "active",
      ].includes(
        normalized
      )
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "n",
        "inactive",
      ].includes(
        normalized
      )
    ) {
      return false;
    }

    throw new Error(
      `Invalid boolean value "${value}".`
    );
  };

const normalizeRow =
  row => {
    const promotionCode =
      normalizeCode(
        row.promotionCode
      );

    const promotionName =
      String(
        row.promotionName ||
        ""
      ).trim();

    const variantSku =
      String(
        row.variantSku ||
        ""
      ).trim();

    const discountType =
      up(
        row.discountType,
        "FIXED_AMOUNT"
      );

    const fundingType =
      up(
        row.fundingType,
        "INTERNAL"
      );

    const discountValue =
      Number(
        row.discountValue
      );

    const priority =
      row.priority ===
        "" ||
      row.priority ===
        undefined
        ? 100
        : Number(
            row.priority
          );

    if (
      !promotionCode
    ) {
      throw new Error(
        "Promotion code is required."
      );
    }

    if (
      !promotionName
    ) {
      throw new Error(
        "Promotion name is required."
      );
    }

    if (
      !variantSku
    ) {
      throw new Error(
        "Variant SKU is required."
      );
    }

    if (
      ![
        "FIXED_AMOUNT",
        "PERCENTAGE",
      ].includes(
        discountType
      )
    ) {
      throw new Error(
        `Unsupported discount type "${row.discountType}".`
      );
    }

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue <=
        0
    ) {
      throw new Error(
        "Discount value must be greater than zero."
      );
    }

    if (
      discountType ===
        "PERCENTAGE" &&
      discountValue >
        100
    ) {
      throw new Error(
        "Percentage discount cannot exceed 100."
      );
    }

    if (
      ![
        "INTERNAL",
        "EXTERNAL",
      ].includes(
        fundingType
      )
    ) {
      throw new Error(
        `Unsupported funding type "${row.fundingType}".`
      );
    }

    if (
      !Number.isFinite(
        priority
      )
    ) {
      throw new Error(
        "Priority must be a number."
      );
    }

    const validFrom =
      new Date(
        row.validFrom
      );

    const validUntil =
      new Date(
        row.validUntil
      );

    if (
      Number.isNaN(
        validFrom.getTime()
      )
    ) {
      throw new Error(
        "Valid from is invalid."
      );
    }

    if (
      Number.isNaN(
        validUntil.getTime()
      )
    ) {
      throw new Error(
        "Valid until is invalid."
      );
    }

    if (
      validUntil <
      validFrom
    ) {
      throw new Error(
        "Valid until cannot be earlier than valid from."
      );
    }

    return {
      ...row,

      promotionCode,

      promotionName,

      variantSku,

      description:
        String(
          row.description ||
          ""
        ).trim() ||
        null,

      discountType,

      discountValue,

      fundingType,

      fundingSource:
        String(
          row.fundingSource ||
          ""
        ).trim() ||
        null,

      currencyCode:
        up(
          row.currencyCode,
          "AED"
        ),

      channelCode:
        up(
          row.channelCode,
          "WEBSITE"
        ),

      validFrom,

      validUntil,

      priority,

      isActive:
        parseBoolean(
          row.isActive,
          true
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| Group Validation
|--------------------------------------------------------------------------
|
| Rows with the same promotionCode must have identical promotion master data.
| Only variantSku is allowed to differ.
|--------------------------------------------------------------------------
*/

const comparableMaster =
  row => ({
    promotionName:
      row.promotionName,

    description:
      row.description,

    discountType:
      row.discountType,

    discountValue:
      Number(
        row.discountValue
      ),

    fundingType:
      row.fundingType,

    fundingSource:
      row.fundingSource,

    currencyCode:
      row.currencyCode,

    channelCode:
      row.channelCode,

    validFrom:
      row.validFrom
        .toISOString(),

    validUntil:
      row.validUntil
        .toISOString(),

    priority:
      Number(
        row.priority
      ),

    isActive:
      row.isActive ===
      true,
  });

const validateGroupConsistency =
  rows => {
    const first =
      comparableMaster(
        rows[
          0
        ]
      );

    const firstJson =
      JSON.stringify(
        first
      );

    for (
      const row of
      rows.slice(
        1
      )
    ) {
      const currentJson =
        JSON.stringify(
          comparableMaster(
            row
          )
        );

      if (
        currentJson !==
        firstJson
      ) {
        throw new Error(
          `Rows for promotion ${rows[0].promotionCode} contain different promotion settings. Keep code/name/value/funding/dates/priority/status identical for all rows in the same promotion.`
        );
      }
    }
  };

/*
|--------------------------------------------------------------------------
| Resolve Variant SKUs
|--------------------------------------------------------------------------
*/

const resolveVariantsBySku =
  async ({
    companyId,
    rows,
  }) => {
    const skuList =
      Array.from(
        new Set(
          rows.map(
            row =>
              row.variantSku
          )
        )
      );

    const variants =
      await db.ProductVariant.findAll({
        where: {
          companyId,

          sku: {
            [Op.in]:
              skuList,
          },
        },

        attributes: [
          "id",
          "productId",
          "sku",
          "name",
          "status",
        ],
      });

    const variantsBySku =
      new Map();

    for (
      const variant of
      variants
    ) {
      const key =
        String(
          variant.sku ||
          ""
        ).trim();

      if (
        !variantsBySku.has(
          key
        )
      ) {
        variantsBySku.set(
          key,
          []
        );
      }

      variantsBySku
        .get(
          key
        )
        .push(
          variant
        );
    }

    const errors =
      [];

    const resolved =
      [];

    for (
      const row of
      rows
    ) {
      const matches =
        variantsBySku.get(
          row.variantSku
        ) ||
        [];

      if (
        !matches.length
      ) {
        errors.push({
          rowNumber:
            row.rowNumber,

          promotionCode:
            row.promotionCode,

          variantSku:
            row.variantSku,

          message:
            "Product variant SKU was not found.",
        });

        continue;
      }

      if (
        matches.length >
        1
      ) {
        errors.push({
          rowNumber:
            row.rowNumber,

          promotionCode:
            row.promotionCode,

          variantSku:
            row.variantSku,

          message:
            "More than one product variant has this SKU. SKU must identify one variant.",
        });

        continue;
      }

      resolved.push({
        row,

        variant:
          matches[
            0
          ],
      });
    }

    return {
      resolved,
      errors,
    };
  };

/*
|--------------------------------------------------------------------------
| Import
|--------------------------------------------------------------------------
|
| Transaction boundary:
| Existing create/update services already use one transaction per promotion.
| Therefore one bad promotion group does not roll back the entire CSV.
|--------------------------------------------------------------------------
*/

const importGiftVoucherPromotions =
  async ({
    companyId,
    userId,
    csvText,
  }) => {
    const sourceRows =
      parseCsvObjects(
        csvText
      );

    const validationErrors =
      [];

    const normalizedRows =
      [];

    for (
      const sourceRow of
      sourceRows
    ) {
      try {
        normalizedRows.push(
          normalizeRow(
            sourceRow
          )
        );
      } catch (
        error
      ) {
        validationErrors.push({
          rowNumber:
            sourceRow.rowNumber,

          promotionCode:
            sourceRow.promotionCode ||
            null,

          variantSku:
            sourceRow.variantSku ||
            null,

          message:
            String(
              error.message ||
              error
            ),
        });
      }
    }

    const groups =
      new Map();

    for (
      const row of
      normalizedRows
    ) {
      if (
        !groups.has(
          row.promotionCode
        )
      ) {
        groups.set(
          row.promotionCode,
          []
        );
      }

      groups
        .get(
          row.promotionCode
        )
        .push(
          row
        );
    }

    let createdPromotions =
      0;

    let updatedPromotions =
      0;

    let successfulRows =
      0;

    const promotionResults =
      [];

    const importErrors = [
      ...validationErrors,
    ];

    for (
      const [
        promotionCode,
        rows,
      ] of
      groups.entries()
    ) {
      try {
        validateGroupConsistency(
          rows
        );

        const {
          resolved,
          errors,
        } =
          await resolveVariantsBySku({
            companyId,
            rows,
          });

        if (
          errors.length
        ) {
          importErrors.push(
            ...errors
          );

          promotionResults.push({
            promotionCode,

            status:
              "FAILED",

            rowCount:
              rows.length,

            message:
              "One or more SKUs could not be resolved. Promotion was not imported.",
          });

          continue;
        }

        /*
         * Deduplicate assignments while preserving a single variant-specific row.
         */
        const assignmentMap =
          new Map();

        for (
          const {
            variant,
          } of
          resolved
        ) {
          const key =
            `${variant.productId}:${variant.id}`;

          assignmentMap.set(
            key,
            {
              productId:
                variant.productId,

              productVariantId:
                variant.id,

              isActive:
                true,
            }
          );
        }

        const master =
          rows[
            0
          ];

        const payload = {
          code:
            master.promotionCode,

          name:
            master.promotionName,

          description:
            master.description,

          discountType:
            master.discountType,

          discountValue:
            master.discountValue,

          fundingType:
            master.fundingType,

          fundingSource:
            master.fundingSource,

          currencyCode:
            master.currencyCode,

          channelCode:
            master.channelCode,

          validFrom:
            master.validFrom,

          validUntil:
            master.validUntil,

          priority:
            master.priority,

          isActive:
            master.isActive,

          items:
            Array.from(
              assignmentMap.values()
            ),
        };

        const existing =
          await db.GiftVoucherPromotion.findOne({
            where: {
              companyId,

              code:
                promotionCode,
            },

            attributes: [
              "id",
              "code",
            ],
          });

        if (
          existing
        ) {
          await giftVoucherPromotionService
            .updateGiftVoucherPromotion({
              companyId,

              promotionId:
                existing.id,

              userId,

              payload,
            });

          updatedPromotions +=
            1;
        } else {
          await giftVoucherPromotionService
            .createGiftVoucherPromotion({
              companyId,

              userId,

              payload,
            });

          createdPromotions +=
            1;
        }

        successfulRows +=
          rows.length;

        promotionResults.push({
          promotionCode,

          status:
            existing
              ? "UPDATED"
              : "CREATED",

          rowCount:
            rows.length,

          assignmentCount:
            assignmentMap.size,

          message:
            existing
              ? "Promotion updated and assignments replaced from CSV."
              : "Promotion created successfully.",
        });
      } catch (
        error
      ) {
        const message =
          String(
            error.message ||
            error
          );

        for (
          const row of
          rows
        ) {
          importErrors.push({
            rowNumber:
              row.rowNumber,

            promotionCode:
              row.promotionCode,

            variantSku:
              row.variantSku,

            message,
          });
        }

        promotionResults.push({
          promotionCode,

          status:
            "FAILED",

          rowCount:
            rows.length,

          message,
        });
      }
    }

    const failedRowNumbers =
      new Set(
        importErrors
          .map(
            error =>
              error.rowNumber
          )
          .filter(
            Boolean
          )
      );

    return {
      totalRows:
        sourceRows.length,

      promotionGroups:
        groups.size,

      createdPromotions,

      updatedPromotions,

      successfulRows,

      failedRows:
        failedRowNumbers.size,

      promotionResults,

      errors:
        importErrors.slice(
          0,
          1000
        ),
    };
  };

module.exports = {
  getTemplateCsv,
  importGiftVoucherPromotions,
};
