const {
  Op,
} = require(
  "sequelize"
);

const db = require(
  "../../models"
);

const AppError = require(
  "../../utils/AppError"
);

const pricingComparisonService = require(
  "./pricingComparison.service"
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanUpper = (
  value
) =>
  value === null ||
  value === undefined
    ? ""
    : String(value)
        .trim()
        .toUpperCase();

const cleanText = (
  value
) =>
  value === null ||
  value === undefined
    ? ""
    : String(value)
        .trim();

const toNullableNumber = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const toRequiredNumber = (
  value,
  fallback
) => {
  const number =
    toNullableNumber(
      value
    );

  return number === null
    ? fallback
    : number;
};

const normalizePreviewRow = (
  row,
  index
) => {
  return {
    rowNumber:
      Number(
        row.rowNumber ||
        index +
          2
      ),

    productSku:
      cleanUpper(
        row.productSku
      ),

    variantSku:
      cleanUpper(
        row.variantSku
      ),

    priceListCode:
      cleanUpper(
        row.priceListCode
      ),

    currencyCode:
      cleanUpper(
        row.currencyCode
      ),

    regularPrice:
      toNullableNumber(
        row.regularPrice
      ),

    sellingPrice:
      toNullableNumber(
        row.sellingPrice
      ),

    compareAtPrice:
      toNullableNumber(
        row.compareAtPrice
      ),

    costPrice:
      toNullableNumber(
        row.costPrice
      ),

    minimumQuantity:
      toRequiredNumber(
        row.minimumQuantity,
        1
      ),

    maximumQuantity:
      toNullableNumber(
        row.maximumQuantity
      ),

    validFrom:
      row.validFrom ||
      null,

    validUntil:
      row.validUntil ||
      row.validTo ||
      null,

    priority:
      Number(
        row.priority ??
        100
      ),

    status:
      cleanUpper(
        row.status ||
        "ACTIVE"
      ),
  };
};

const validateNormalizedRow = (
  row
) => {
  const errors = [];
  const warnings = [];

  if (!row.variantSku) {
    errors.push(
      "Variant SKU is required."
    );
  }

  if (!row.priceListCode) {
    errors.push(
      "Price list code is required."
    );
  }

  if (
    row.sellingPrice ===
    null
  ) {
    errors.push(
      "Selling price is required and must be numeric."
    );
  } else if (
    row.sellingPrice <
    0
  ) {
    errors.push(
      "Selling price cannot be negative."
    );
  }

  if (
    row.regularPrice ===
    null
  ) {
    errors.push(
      "Regular price is required and must be numeric."
    );
  } else if (
    row.regularPrice <
    0
  ) {
    errors.push(
      "Regular price cannot be negative."
    );
  }

  if (
    row.regularPrice !==
      null &&
    row.sellingPrice !==
      null &&
    row.regularPrice <
      row.sellingPrice
  ) {
    warnings.push(
      "Regular price is lower than selling price."
    );
  }

  if (
    row.minimumQuantity <
    1
  ) {
    errors.push(
      "Minimum quantity must be at least 1."
    );
  }

  if (
    row.maximumQuantity !==
      null &&
    row.maximumQuantity <
      row.minimumQuantity
  ) {
    errors.push(
      "Maximum quantity cannot be lower than minimum quantity."
    );
  }

  if (
    !Number.isInteger(
      row.priority
    ) ||
    row.priority <
      0
  ) {
    errors.push(
      "Priority must be a non-negative whole number."
    );
  }

  if (
    ![
      "ACTIVE",
      "INACTIVE",
    ].includes(
      row.status
    )
  ) {
    errors.push(
      "Status must be ACTIVE or INACTIVE."
    );
  }

  const validFrom =
    pricingComparisonService
      .normalizeDateOnly(
        row.validFrom
      );

  const validUntil =
    pricingComparisonService
      .normalizeDateOnly(
        row.validUntil
      );

  if (
    row.validFrom &&
    !validFrom
  ) {
    errors.push(
      "Valid From is invalid."
    );
  }

  if (
    row.validUntil &&
    !validUntil
  ) {
    errors.push(
      "Valid Until is invalid."
    );
  }

  if (
    validFrom &&
    validUntil &&
    validUntil <
      validFrom
  ) {
    errors.push(
      "Valid Until cannot be earlier than Valid From."
    );
  }

  return {
    errors,
    warnings,
  };
};

/*
|--------------------------------------------------------------------------
| Preview Import
|--------------------------------------------------------------------------
*/

const previewImport = async ({
  companyId,
  rows,
  transaction,
}) => {
  if (
    !Array.isArray(
      rows
    ) ||
    rows.length ===
      0
  ) {
    throw new AppError(
      "At least one pricing import row is required.",
      400,
      "PRICING_IMPORT_ROWS_REQUIRED"
    );
  }

  const normalizedRows =
    rows.map(
      normalizePreviewRow
    );

  const variantSkus = [
    ...new Set(
      normalizedRows
        .map(
          (
            row
          ) =>
            row.variantSku
        )
        .filter(
          Boolean
        )
    ),
  ];

  const priceListCodes = [
    ...new Set(
      normalizedRows
        .map(
          (
            row
          ) =>
            row.priceListCode
        )
        .filter(
          Boolean
        )
    ),
  ];

  const variants =
    variantSkus.length >
    0
      ? await db.ProductVariant.findAll({
          where: {
            companyId,

            sku: {
              [Op.in]:
                variantSkus,
            },
          },

          attributes: [
            "id",
            "productId",
            "sku",
            "name",
            "status",
          ],

          include: [
            {
              model:
                db.Product,

              as:
                "product",

              attributes: [
                "id",
                "name",
                "parentSku",
                "status",
              ],

              required:
                false,
            },
          ],

          transaction,
        })
      : [];

  const priceLists =
    priceListCodes.length >
    0
      ? await db.PriceList.findAll({
          where: {
            companyId,

            code: {
              [Op.in]:
                priceListCodes,
            },
          },

          attributes: [
            "id",
            "code",
            "name",
            "currencyCode",
            "channelCode",
            "isActive",
          ],

          transaction,
        })
      : [];

  const variantMap =
    new Map(
      variants.map(
        (
          variant
        ) => [
          cleanUpper(
            variant.sku
          ),
          variant,
        ]
      )
    );

  const priceListMap =
    new Map(
      priceLists.map(
        (
          priceList
        ) => [
          cleanUpper(
            priceList.code
          ),
          priceList,
        ]
      )
    );

  const variantIds =
    variants.map(
      (
        variant
      ) =>
        variant.id
    );

  const priceListIds =
    priceLists.map(
      (
        priceList
      ) =>
        priceList.id
    );

  const existingPrices =
    variantIds.length >
      0 &&
    priceListIds.length >
      0
      ? await db.ProductVariantPrice.findAll({
          where: {
            companyId,

            productVariantId: {
              [Op.in]:
                variantIds,
            },

            priceListId: {
              [Op.in]:
                priceListIds,
            },
          },

          transaction,
        })
      : [];

  const existingPriceMap =
    new Map();

  for (
    const price of
    existingPrices
  ) {
    const key =
      pricingComparisonService
        .buildScheduleKey({
          productVariantId:
            price.productVariantId,

          priceListId:
            price.priceListId,

          minimumQuantity:
            price.minimumQuantity,

          validFrom:
            price.validFrom,

          validUntil:
            price.validUntil,
        });

    existingPriceMap.set(
      key,
      price
    );
  }

  const duplicateKeys =
    new Set();

  const previewRows =
    normalizedRows.map(
      (
        row
      ) => {
        const {
          errors,
          warnings,
        } =
          validateNormalizedRow(
            row
          );

        const variant =
          variantMap.get(
            row.variantSku
          ) ||
          null;

        const priceList =
          priceListMap.get(
            row.priceListCode
          ) ||
          null;

        if (
          row.variantSku &&
          !variant
        ) {
          errors.push(
            `Variant SKU "${row.variantSku}" was not found.`
          );
        }

        if (
          row.priceListCode &&
          !priceList
        ) {
          errors.push(
            `Price list "${row.priceListCode}" was not found.`
          );
        }

        if (
          variant &&
          variant.status !==
            "ACTIVE"
        ) {
          warnings.push(
            `Variant is ${variant.status}.`
          );
        }

        if (
          priceList &&
          priceList.isActive !==
            true
        ) {
          warnings.push(
            "Price list is inactive."
          );
        }

        if (
          priceList &&
          row.currencyCode &&
          cleanUpper(
            priceList.currencyCode
          ) !==
            row.currencyCode
        ) {
          errors.push(
            `Currency ${row.currencyCode} does not match price-list currency ${priceList.currencyCode}.`
          );
        }

        if (
          variant &&
          row.productSku &&
          variant.product &&
          cleanUpper(
            variant.product
              .parentSku
          ) !==
            row.productSku
        ) {
          errors.push(
            `Product SKU "${row.productSku}" does not match the variant's product.`
          );
        }

        let scheduleKey =
          null;

        if (
          variant &&
          priceList
        ) {
          scheduleKey =
            pricingComparisonService
              .buildScheduleKey({
                productVariantId:
                  variant.id,

                priceListId:
                  priceList.id,

                minimumQuantity:
                  row.minimumQuantity,

                validFrom:
                  row.validFrom,

                validUntil:
                  row.validUntil,
              });

          if (
            duplicateKeys.has(
              scheduleKey
            )
          ) {
            errors.push(
              "Duplicate variant, price list, quantity tier and validity schedule."
            );
          } else {
            duplicateKeys.add(
              scheduleKey
            );
          }
        }

        if (
          errors.length >
          0
        ) {
          return {
            rowNumber:
              row.rowNumber,

            action:
              "SKIP",

            messages: [
              ...errors,
              ...warnings,
            ],

            variant:
              variant
                ? {
                    id:
                      variant.id,

                    sku:
                      variant.sku,

                    name:
                      variant.name,

                    status:
                      variant.status,

                    productId:
                      variant.productId,

                    productName:
                      variant.product
                        ?.name ||
                      null,

                    productSku:
                      variant.product
                        ?.parentSku ||
                      null,
                  }
                : null,

            priceList:
              priceList
                ? {
                    id:
                      priceList.id,

                    code:
                      priceList.code,

                    name:
                      priceList.name,

                    currencyCode:
                      priceList.currencyCode,

                    channelCode:
                      priceList.channelCode,

                    isActive:
                      priceList.isActive,
                  }
                : null,

            existingPrice:
              null,

            importedPrice:
              pricingComparisonService
                .normalizeImportedPrice(
                  row
                ),

            changedFields:
              [],
          };
        }

        const existingRecord =
          existingPriceMap.get(
            scheduleKey
          ) ||
          null;

        const comparison =
          pricingComparisonService
            .classifyPriceChange({
              existingRecord,
              importedRow:
                row,
            });

        return {
          rowNumber:
            row.rowNumber,

          action:
            comparison.action,

          messages:
            warnings,

          variant: {
            id:
              variant.id,

            sku:
              variant.sku,

            name:
              variant.name,

            status:
              variant.status,

            productId:
              variant.productId,

            productName:
              variant.product
                ?.name ||
              null,

            productSku:
              variant.product
                ?.parentSku ||
              null,
          },

          priceList: {
            id:
              priceList.id,

            code:
              priceList.code,

            name:
              priceList.name,

            currencyCode:
              priceList.currencyCode,

            channelCode:
              priceList.channelCode,

            isActive:
              priceList.isActive,
          },

          existingPrice:
            comparison
              .existingPrice,

          importedPrice:
            comparison
              .importedPrice,

          changedFields:
            comparison
              .changedFields,
        };
      }
    );

  const summary =
    previewRows.reduce(
      (
        result,
        row
      ) => {
        result.total +=
          1;

        const key =
          row.action
            .toLowerCase();

        result[
          key
        ] +=
          1;

        if (
          row.messages.length >
          0
        ) {
          result.warningRows +=
            row.action ===
              "SKIP"
              ? 0
              : 1;
        }

        return result;
      },
      {
        total:
          0,

        create:
          0,

        update:
          0,

        no_change:
          0,

        deactivate:
          0,

        skip:
          0,

        warningRows:
          0,

        changeCount:
          0,
      }
    );

  summary.changeCount =
    summary.create +
    summary.update +
    summary.deactivate;

  return {
    summary,

    rows:
      previewRows,
  };
};

/*
|--------------------------------------------------------------------------
| Build Database Payload
|--------------------------------------------------------------------------
*/

const buildVariantPricePayload = ({
  companyId,
  variantId,
  priceListId,
  importedPrice,
  userId,
  isCreate = false,
}) => {
  const payload = {
    companyId,

    productVariantId:
      variantId,

    priceListId,

    regularPrice:
      importedPrice.regularPrice,

    sellingPrice:
      importedPrice.sellingPrice,

    compareAtPrice:
      importedPrice.compareAtPrice,

    costPrice:
      importedPrice.costPrice,

    minimumQuantity:
      importedPrice.minimumQuantity,

    maximumQuantity:
      importedPrice.maximumQuantity,

    validFrom:
      importedPrice.validFrom,

    validUntil:
      importedPrice.validUntil,

    priority:
      importedPrice.priority,

    isActive:
      importedPrice.isActive,

    updatedBy:
      userId ||
      null,
  };

  if (isCreate) {
    payload.createdBy =
      userId ||
      null;
  }

  return payload;
};

/*
|--------------------------------------------------------------------------
| Execute Import
|--------------------------------------------------------------------------
*/

const executeImport = async ({
  companyId,
  userId,
  rows,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    /*
     * Re-run preview inside the same transaction.
     *
     * This prevents the execute endpoint from trusting
     * stale or manipulated frontend preview results.
     */
    const preview =
      await previewImport({
        companyId,
        rows,
        transaction,
      });

    const resultRows = [];

    const summary = {
      total:
        preview.rows.length,

      created:
        0,

      updated:
        0,

      deactivated:
        0,

      unchanged:
        0,

      skipped:
        0,

      applied:
        0,
    };

    for (
      const previewRow of
      preview.rows
    ) {
      /*
       * Invalid rows are intentionally skipped.
       */
      if (
        previewRow.action ===
        "SKIP"
      ) {
        summary.skipped +=
          1;

        resultRows.push({
          rowNumber:
            previewRow.rowNumber,

          action:
            "SKIP",

          success:
            false,

          recordId:
            null,

          messages:
            previewRow.messages,
        });

        continue;
      }

      /*
       * Nothing needs to be written.
       */
      if (
        previewRow.action ===
        "NO_CHANGE"
      ) {
        summary.unchanged +=
          1;

        resultRows.push({
          rowNumber:
            previewRow.rowNumber,

          action:
            "NO_CHANGE",

          success:
            true,

          recordId:
            previewRow.existingPrice
              ?.id ||
            null,

          messages: [
            "No database change was required.",
          ],
        });

        continue;
      }

      /*
       * CREATE
       */
      if (
        previewRow.action ===
        "CREATE"
      ) {
        const createdRecord =
          await db.ProductVariantPrice.create(
            buildVariantPricePayload({
              companyId,

              variantId:
                previewRow.variant.id,

              priceListId:
                previewRow.priceList.id,

              importedPrice:
                previewRow.importedPrice,

              userId,

              isCreate:
                true,
            }),
            {
              transaction,
            }
          );

        summary.created +=
          1;

        summary.applied +=
          1;

        resultRows.push({
          rowNumber:
            previewRow.rowNumber,

          action:
            "CREATE",

          success:
            true,

          recordId:
            createdRecord.id,

          messages: [
            "Price record created successfully.",
          ],
        });

        continue;
      }

      /*
       * UPDATE
       */
      if (
        previewRow.action ===
        "UPDATE"
      ) {
        const existingRecord =
          await db.ProductVariantPrice.findOne({
            where: {
              id:
                previewRow.existingPrice.id,

              companyId,
            },

            transaction,
          });

        if (!existingRecord) {
          throw new AppError(
            `The price record for CSV row ${previewRow.rowNumber} no longer exists.`,
            409,
            "PRICING_IMPORT_RECORD_CHANGED"
          );
        }

        await existingRecord.update(
          buildVariantPricePayload({
            companyId,

            variantId:
              previewRow.variant.id,

            priceListId:
              previewRow.priceList.id,

            importedPrice:
              previewRow.importedPrice,

            userId,
          }),
          {
            transaction,
          }
        );

        summary.updated +=
          1;

        summary.applied +=
          1;

        resultRows.push({
          rowNumber:
            previewRow.rowNumber,

          action:
            "UPDATE",

          success:
            true,

          recordId:
            existingRecord.id,

          changedFields:
            previewRow.changedFields,

          messages: [
            "Price record updated successfully.",
          ],
        });

        continue;
      }

      /*
       * DEACTIVATE
       */
      if (
        previewRow.action ===
        "DEACTIVATE"
      ) {
        const existingRecord =
          await db.ProductVariantPrice.findOne({
            where: {
              id:
                previewRow.existingPrice.id,

              companyId,
            },

            transaction,
          });

        if (!existingRecord) {
          throw new AppError(
            `The price record for CSV row ${previewRow.rowNumber} no longer exists.`,
            409,
            "PRICING_IMPORT_RECORD_CHANGED"
          );
        }

        await existingRecord.update(
          {
            isActive:
              false,

            updatedBy:
              userId ||
              null,
          },
          {
            transaction,
          }
        );

        summary.deactivated +=
          1;

        summary.applied +=
          1;

        resultRows.push({
          rowNumber:
            previewRow.rowNumber,

          action:
            "DEACTIVATE",

          success:
            true,

          recordId:
            existingRecord.id,

          messages: [
            "Price record deactivated successfully.",
          ],
        });
      }
    }

    await transaction.commit();

    return {
      summary,

      rows:
        resultRows,
    };
  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  previewImport,
  executeImport,
};