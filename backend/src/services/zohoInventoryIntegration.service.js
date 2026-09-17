const { Op } = require("sequelize");
const db = require("../models");
const AppError = require("../utils/AppError");

const toNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new AppError(
      "Quantity must be numeric.",
      400,
      "INVALID_QUANTITY"
    );
  }

  return number;
};

const text = (value) => String(value ?? "").trim();

const getCompanyByCode = async (
  companyCode,
  transaction = null
) => {
  const code = text(companyCode).toUpperCase();

  if (!code) {
    throw new AppError(
      "companyCode is required.",
      400,
      "COMPANY_CODE_REQUIRED"
    );
  }

  const company = await db.Company.findOne({
    where: {
      code,
      isActive: true,
    },
    transaction,
  });

  if (!company) {
    throw new AppError(
      "Company was not found.",
      404,
      "COMPANY_NOT_FOUND"
    );
  }

  return company;
};

const getVariantBySku = async ({
  companyId,
  sku,
  transaction,
}) => {
  const normalizedSku = text(sku);

  if (!normalizedSku) {
    throw new AppError(
      "SKU is required.",
      400,
      "SKU_REQUIRED"
    );
  }

  const variant = await db.ProductVariant.findOne({
    where: {
      companyId,
      sku: normalizedSku,
      status: {
        [Op.ne]: "ARCHIVED",
      },
    },
    transaction,
  });

  if (!variant) {
    throw new AppError(
      `Product variant was not found for SKU ${normalizedSku}.`,
      404,
      "PRODUCT_VARIANT_NOT_FOUND"
    );
  }

  return variant;
};

const getMappedLocation = async ({
  companyId,
  zohoLocationId,
  transaction,
}) => {
  const externalId = text(zohoLocationId);

  if (!externalId) {
    throw new AppError(
      "zohoLocationId is required.",
      400,
      "ZOHO_LOCATION_ID_REQUIRED"
    );
  }

  const mapping = await db.ZohoLocationMapping.findOne({
    where: {
      companyId,
      zohoLocationId: externalId,
      isActive: true,
    },

    include: [
      {
        model: db.InventoryLocation,
        as: "inventoryLocation",
        required: true,
        where: {
          companyId,
          isActive: true,
        },
      },
    ],

    transaction,
  });

  if (!mapping) {
    throw new AppError(
      `Zoho location ${externalId} is not mapped.`,
      400,
      "ZOHO_LOCATION_NOT_MAPPED"
    );
  }

  return mapping;
};

const getOrCreateBalance = async ({
  companyId,
  inventoryLocationId,
  productVariantId,
  transaction,
}) => {
  let balance = await db.InventoryBalance.findOne({
    where: {
      companyId,
      inventoryLocationId,
      productVariantId,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!balance) {
    balance = await db.InventoryBalance.create(
      {
        companyId,
        inventoryLocationId,
        productVariantId,
        quantityOnHand: 0,
        quantityReserved: 0,
      },
      {
        transaction,
      }
    );
  }

  return balance;
};

const assertReservedQuantity = ({
  balance,
  newOnHand,
  sku,
  locationName,
}) => {
  const reserved = Number(
    balance.quantityReserved || 0
  );

  if (newOnHand < reserved) {
    throw new AppError(
      `ERP stock for SKU ${sku} at ${locationName} would fall below reserved quantity ${reserved}.`,
      409,
      "ERP_STOCK_BELOW_RESERVED_QUANTITY"
    );
  }
};

const upsertLocationMapping = async ({
  companyCode,
  zohoLocationId,
  zohoLocationCode = null,
  zohoLocationName = null,
  inventoryLocationCode,
}) => {
  const company = await getCompanyByCode(companyCode);

  const inventoryLocation = await db.InventoryLocation.findOne({
    where: {
      companyId: company.id,
      code: text(inventoryLocationCode),
      isActive: true,
    },
  });

  if (!inventoryLocation) {
    throw new AppError(
      "Inventory location was not found.",
      404,
      "INVENTORY_LOCATION_NOT_FOUND"
    );
  }

  const externalId = text(zohoLocationId);

  if (!externalId) {
    throw new AppError(
      "zohoLocationId is required.",
      400,
      "ZOHO_LOCATION_ID_REQUIRED"
    );
  }

  const [mapping] = await db.ZohoLocationMapping.findOrCreate({
    where: {
      companyId: company.id,
      zohoLocationId: externalId,
    },

    defaults: {
      companyId: company.id,
      zohoLocationId: externalId,
      zohoLocationCode: text(zohoLocationCode) || null,
      zohoLocationName: text(zohoLocationName) || null,
      inventoryLocationId: inventoryLocation.id,
      isActive: true,
    },
  });

  await mapping.update({
    zohoLocationCode:
      text(zohoLocationCode) ||
      mapping.zohoLocationCode,

    zohoLocationName:
      text(zohoLocationName) ||
      mapping.zohoLocationName,

    inventoryLocationId:
      inventoryLocation.id,

    isActive: true,
  });

  return {
    mapping,
    inventoryLocation,
  };
};

const listLocationMappings = async ({
  companyCode,
}) => {
  const company = await getCompanyByCode(companyCode);

  return db.ZohoLocationMapping.findAll({
    where: {
      companyId: company.id,
    },

    include: [
      {
        model: db.InventoryLocation,
        as: "inventoryLocation",
      },
    ],

    order: [
      ["zohoLocationName", "ASC"],
    ],
  });
};

exports.applyStockSnapshot =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.applyStockSnapshot(
          req.body ||
            {}
        );

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Zoho stock snapshot processed successfully.",

        data:
          result,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

  const applyStockSnapshot =
  async ({
    companyCode,
    snapshotId,
    items,
  }) => {
    if (
      !Array.isArray(
        items
      ) ||
      !items.length
    ) {
      throw new AppError(
        "At least one stock item is required.",
        400,
        "STOCK_ITEMS_REQUIRED"
      );
    }

    const company =
      await getCompanyByCode(
        companyCode
      );

    const processedRows =
      [];

    const ignoredRows =
      [];

    const skippedRows =
      [];

    for (
      let index = 0;
      index <
      items.length;
      index += 1
    ) {
      const item =
        items[index] ||
        {};

      const sku =
        text(
          item.sku
        );

      const zohoLocationId =
        text(
          item.zohoLocationId
        );

      /*
      |--------------------------------------------------------------------------
      | Basic validation
      |--------------------------------------------------------------------------
      */

      if (!sku) {
        skippedRows.push({
          row:
            index +
            1,

          sku:
            null,

          zohoLocationId:
            zohoLocationId ||
            null,

          quantityOnHand:
            item.quantityOnHand,

          code:
            "SKU_REQUIRED",

          message:
            "SKU is required.",

          status:
            "SKIPPED",
        });

        continue;
      }

      let quantityOnHand;

      try {
        quantityOnHand =
          toNumber(
            item.quantityOnHand
          );
      } catch (
        error
      ) {
        skippedRows.push({
          row:
            index +
            1,

          sku,

          zohoLocationId:
            zohoLocationId ||
            null,

          quantityOnHand:
            item.quantityOnHand,

          code:
            error?.code ||
            "INVALID_QUANTITY",

          message:
            error?.message ||
            "Invalid quantity.",

          status:
            "SKIPPED",
        });

        continue;
      }

      if (
        quantityOnHand <
        0
      ) {
        skippedRows.push({
          row:
            index +
            1,

          sku,

          zohoLocationId:
            zohoLocationId ||
            null,

          quantityOnHand,

          code:
            "NEGATIVE_STOCK_NOT_ALLOWED",

          message:
            `quantityOnHand cannot be negative for SKU ${sku}.`,

          status:
            "SKIPPED",
        });

        continue;
      }

      try {
        const rowResult =
          await db.sequelize.transaction(
            async (
              transaction
            ) => {
              /*
              |--------------------------------------------------------------------------
              | Variant + Product
              |--------------------------------------------------------------------------
              */

              const variant =
                await db.ProductVariant.findOne({
                  where: {
                    companyId:
                      company.id,

                    sku,

                    status: {
                      [Op.ne]:
                        "ARCHIVED",
                    },
                  },

                  include: [
                    {
                      model:
                        db.Product,

                      as:
                        "product",

                      required:
                        true,

                      attributes: [
                        "id",
                        "name",
                        "isDirectDelivery",
                      ],
                    },
                  ],

                  transaction,
                });

              /*
              |--------------------------------------------------------------------------
              | SKU Not Found
              |--------------------------------------------------------------------------
              */

              if (
                !variant
              ) {
                return {
                  type:
                    "SKIPPED",

                  data: {
                    row:
                      index +
                      1,

                    sku,

                    zohoLocationId:
                      zohoLocationId ||
                      null,

                    quantityOnHand,

                    code:
                      "PRODUCT_VARIANT_NOT_FOUND",

                    message:
                      `Product variant was not found for SKU ${sku}.`,

                    status:
                      "SKIPPED",
                  },
                };
              }

              /*
              |--------------------------------------------------------------------------
              | Direct Delivery
              |--------------------------------------------------------------------------
              */

              if (
                variant.product
                  ?.isDirectDelivery ===
                true
              ) {
                return {
                  type:
                    "IGNORED",

                  data: {
                    row:
                      index +
                      1,

                    sku,

                    productVariantId:
                      variant.id,

                    productName:
                      variant.product
                        ?.name ||
                      null,

                    zohoLocationId:
                      zohoLocationId ||
                      null,

                    quantityOnHand,

                    reason:
                      "DIRECT_DELIVERY",

                    status:
                      "IGNORED",
                  },
                };
              }

              /*
              |--------------------------------------------------------------------------
              | Location Mapping
              |--------------------------------------------------------------------------
              */

              const mapping =
                await db.ZohoLocationMapping.findOne({
                  where: {
                    companyId:
                      company.id,

                    zohoLocationId,

                    isActive:
                      true,
                  },

                  include: [
                    {
                      model:
                        db.InventoryLocation,

                      as:
                        "inventoryLocation",

                      required:
                        true,

                      where: {
                        companyId:
                          company.id,

                        isActive:
                          true,
                      },
                    },
                  ],

                  transaction,
                });

              if (
                !mapping
              ) {
                return {
                  type:
                    "SKIPPED",

                  data: {
                    row:
                      index +
                      1,

                    sku,

                    zohoLocationId:
                      zohoLocationId ||
                      null,

                    quantityOnHand,

                    code:
                      "ZOHO_LOCATION_NOT_MAPPED",

                    message:
                      `Zoho location ${zohoLocationId} is not mapped.`,

                    status:
                      "SKIPPED",
                  },
                };
              }

              /*
              |--------------------------------------------------------------------------
              | Balance
              |--------------------------------------------------------------------------
              */

              let balance =
                await db.InventoryBalance.findOne({
                  where: {
                    companyId:
                      company.id,

                    inventoryLocationId:
                      mapping
                        .inventoryLocationId,

                    productVariantId:
                      variant.id,
                  },

                  transaction,

                  lock:
                    true,
                });

              if (
                !balance
              ) {
                balance =
                  await db.InventoryBalance.create(
                    {
                      companyId:
                        company.id,

                      inventoryLocationId:
                        mapping
                          .inventoryLocationId,

                      productVariantId:
                        variant.id,

                      quantityOnHand:
                        0,

                      quantityReserved:
                        0,
                    },
                    {
                      transaction,
                    }
                  );
              }

              const quantityBefore =
                Number(
                  balance
                    .quantityOnHand ||
                    0
                );

              const quantityReserved =
                Number(
                  balance
                    .quantityReserved ||
                    0
                );

              /*
              |--------------------------------------------------------------------------
              | Reservation Protection
              |--------------------------------------------------------------------------
              */

              if (
                quantityOnHand <
                quantityReserved
              ) {
                return {
                  type:
                    "SKIPPED",

                  data: {
                    row:
                      index +
                      1,

                    sku,

                    zohoLocationId,

                    quantityOnHand,

                    quantityReserved,

                    code:
                      "ERP_STOCK_BELOW_RESERVED_QUANTITY",

                    message:
                      `ERP stock ${quantityOnHand} is below reserved quantity ${quantityReserved} for SKU ${sku}.`,

                    status:
                      "SKIPPED",
                  },
                };
              }

              /*
              |--------------------------------------------------------------------------
              | Update Stock
              |--------------------------------------------------------------------------
              */

              await balance.update(
                {
                  quantityOnHand,
                },
                {
                  transaction,
                }
              );

              const quantityChange =
                quantityOnHand -
                quantityBefore;

              /*
              |--------------------------------------------------------------------------
              | Movement
              |--------------------------------------------------------------------------
              */

              if (
                quantityChange !==
                0
              ) {
                await db.InventoryMovement.create(
                  {
                    companyId:
                      company.id,

                    productVariantId:
                      variant.id,

                    inventoryLocationId:
                      mapping
                        .inventoryLocationId,

                    movementType:
                      "SNAPSHOT_ADJUSTMENT",

                    quantityChange,

                    quantityBefore,

                    quantityAfter:
                      quantityOnHand,

                    sourceSystem:
                      "ZOHO",

                    sourceEventId:
                      text(
                        snapshotId
                      ) ||
                      `SNAPSHOT-${Date.now()}`,

                    lineKey:
                      [
                        "SNAPSHOT",
                        index,
                        variant.id,
                        mapping
                          .inventoryLocationId,
                      ].join(
                        ":"
                      ),

                    referenceType:
                      "STOCK_SNAPSHOT",

                    referenceId:
                      text(
                        snapshotId
                      ) ||
                      null,

                    payload:
                      item,
                  },
                  {
                    transaction,
                  }
                );
              }

              return {
                type:
                  "PROCESSED",

                data: {
                  row:
                    index +
                    1,

                  sku,

                  productVariantId:
                    variant.id,

                  zohoLocationId:
                    mapping
                      .zohoLocationId,

                  inventoryLocationCode:
                    mapping
                      .inventoryLocation
                      .code,

                  inventoryLocationName:
                    mapping
                      .inventoryLocation
                      .name,

                  quantityBefore,

                  quantityOnHand,

                  quantityReserved,

                  quantityChange,

                  status:
                    "PROCESSED",
                },
              };
            }
          );

        if (
          rowResult.type ===
          "PROCESSED"
        ) {
          processedRows.push(
            rowResult.data
          );

          continue;
        }

        if (
          rowResult.type ===
          "IGNORED"
        ) {
          ignoredRows.push(
            rowResult.data
          );

          continue;
        }

        skippedRows.push(
          rowResult.data
        );
      } catch (
        error
      ) {
        console.error(
          "[ZOHO INVENTORY SNAPSHOT] Row failed:",
          {
            row:
              index +
              1,

            sku,

            zohoLocationId,

            error:
              error?.message,
          }
        );

        skippedRows.push({
          row:
            index +
            1,

          sku,

          zohoLocationId:
            zohoLocationId ||
            null,

          quantityOnHand:
            item.quantityOnHand,

          code:
            error?.code ||
            error?.name ||
            "ROW_PROCESSING_ERROR",

          message:
            error?.message ||
            "Unable to process stock row.",

          status:
            "SKIPPED",
        });
      }
    }

    return {
      snapshotId:
        text(
          snapshotId
        ) ||
        null,

      received:
        items.length,

      processed:
        processedRows.length,

      ignored:
        ignoredRows.length,

      skipped:
        skippedRows.length,

      rows:
        processedRows,

      ignoredRows,

      errors:
        skippedRows,
    };
  };

const processTransactionEvent = async ({
  companyCode,
  eventId,
  transactionType,
  transactionId = null,
  transactionNumber = null,
  transactionDate = null,
  lines,
}) => {
  const sourceEventId = text(eventId);
  const type = text(transactionType).toUpperCase();

  if (!sourceEventId) {
    throw new AppError(
      "eventId is required for idempotency.",
      400,
      "EVENT_ID_REQUIRED"
    );
  }

  if (!["SALE", "RETURN", "TRANSFER"].includes(type)) {
    throw new AppError(
      "transactionType must be SALE, RETURN or TRANSFER.",
      400,
      "INVALID_TRANSACTION_TYPE"
    );
  }

  if (!Array.isArray(lines) || !lines.length) {
    throw new AppError(
      "At least one transaction line is required.",
      400,
      "TRANSACTION_LINES_REQUIRED"
    );
  }

  return db.sequelize.transaction(async (transaction) => {
    const company = await getCompanyByCode(
      companyCode,
      transaction
    );

    const previousEvent = await db.InventoryMovement.findOne({
      where: {
        companyId: company.id,
        sourceSystem: "ZOHO",
        sourceEventId,
      },
      transaction,
    });

    if (previousEvent) {
      return {
        alreadyProcessed: true,
        eventId: sourceEventId,
        transactionType: type,
      };
    }

    let movementCount = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] || {};

      const variant = await getVariantBySku({
        companyId: company.id,
        sku: line.sku,
        transaction,
      });

      const quantity = toNumber(line.quantity);

      if (quantity <= 0) {
        throw new AppError(
          `Quantity must be greater than zero for SKU ${variant.sku}.`,
          400,
          "INVALID_TRANSACTION_QUANTITY"
        );
      }

      if (type === "SALE" || type === "RETURN") {
        const mapping = await getMappedLocation({
          companyId: company.id,
          zohoLocationId: line.zohoLocationId,
          transaction,
        });

        await applyMovement({
          companyId: company.id,
          variant,
          mapping,
          quantityChange:
            type === "SALE"
              ? -quantity
              : quantity,
          movementType: type,
          sourceEventId,
          lineKey: `${index}:${type}`,
          referenceType: type,
          referenceId:
            text(transactionId) || null,
          referenceNumber:
            text(transactionNumber) || null,
          transactionDate,
          payload: line,
          transaction,
        });

        movementCount += 1;
        continue;
      }

      const fromMapping = await getMappedLocation({
        companyId: company.id,
        zohoLocationId:
          line.fromZohoLocationId,
        transaction,
      });

      const toMapping = await getMappedLocation({
        companyId: company.id,
        zohoLocationId:
          line.toZohoLocationId,
        transaction,
      });

      if (
        fromMapping.inventoryLocationId ===
        toMapping.inventoryLocationId
      ) {
        throw new AppError(
          "Transfer source and destination cannot be the same.",
          400,
          "TRANSFER_LOCATION_SAME"
        );
      }

      await applyMovement({
        companyId: company.id,
        variant,
        mapping: fromMapping,
        quantityChange: -quantity,
        movementType: "TRANSFER_OUT",
        sourceEventId,
        lineKey: `${index}:TRANSFER_OUT`,
        referenceType: "TRANSFER",
        referenceId:
          text(transactionId) || null,
        referenceNumber:
          text(transactionNumber) || null,
        transactionDate,
        payload: line,
        transaction,
      });

      await applyMovement({
        companyId: company.id,
        variant,
        mapping: toMapping,
        quantityChange: quantity,
        movementType: "TRANSFER_IN",
        sourceEventId,
        lineKey: `${index}:TRANSFER_IN`,
        referenceType: "TRANSFER",
        referenceId:
          text(transactionId) || null,
        referenceNumber:
          text(transactionNumber) || null,
        transactionDate,
        payload: line,
        transaction,
      });

      movementCount += 2;
    }

    return {
      alreadyProcessed: false,
      eventId: sourceEventId,
      transactionType: type,
      movementCount,
    };
  });
};

module.exports = {
  upsertLocationMapping,
  listLocationMappings,
  applyStockSnapshot,
  processTransactionEvent,
};
