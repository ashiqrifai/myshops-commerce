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
  
  const priceResolverService = require(
    "./priceResolver.service"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const roundMoney = (
    value
  ) => {
    return Number(
      Number(
        value || 0
      ).toFixed(4)
    );
  };
  
  const normalizeContext = ({
    priceListId,
    channelCode,
    currencyCode,
    effectiveDate,
    includeInactive,
    customerId,
    customerGroupCode,
    couponCodes,
    metadata,
  }) => {
    return {
      priceListId:
        priceListId ||
        null,
  
      channelCode:
        channelCode
          ? String(
              channelCode
            )
              .trim()
              .toUpperCase()
          : null,
  
      currencyCode:
        currencyCode
          ? String(
              currencyCode
            )
              .trim()
              .toUpperCase()
          : null,
  
      effectiveDate:
        effectiveDate ||
        new Date(),
  
      includeInactive:
        includeInactive ===
        true,
  
      customerId:
        customerId ||
        null,
  
      customerGroupCode:
        customerGroupCode
          ? String(
              customerGroupCode
            )
              .trim()
              .toUpperCase()
          : null,
  
      couponCodes:
        Array.isArray(
          couponCodes
        )
          ? [
              ...new Set(
                couponCodes
                  .map(
                    (code) =>
                      String(
                        code
                      )
                        .trim()
                        .toUpperCase()
                  )
                  .filter(
                    Boolean
                  )
              ),
            ]
          : [],
  
      metadata:
        metadata &&
        typeof metadata ===
          "object"
          ? metadata
          : {},
    };
  };
  

  /*
|--------------------------------------------------------------------------
| Price Matrix Helpers
|--------------------------------------------------------------------------
*/

const normalizeMatrixQuantity = (
  quantity
) => {
  const parsedQuantity =
    Number(quantity ?? 1);

  if (
    !Number.isFinite(
      parsedQuantity
    ) ||
    parsedQuantity < 1
  ) {
    throw new AppError(
      "Quantity must be at least 1.",
      400,
      "PRICE_MATRIX_INVALID_QUANTITY"
    );
  }

  return parsedQuantity;
};

const normalizeMatrixDate = (
  effectiveDate
) => {
  const parsedDate =
    effectiveDate instanceof Date
      ? effectiveDate
      : new Date(
          effectiveDate ||
            new Date()
        );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    throw new AppError(
      "Effective date is invalid.",
      400,
      "PRICE_MATRIX_INVALID_EFFECTIVE_DATE"
    );
  }

  return parsedDate;
};

const buildMatrixEffectiveDateFilter = (
  effectiveDate
) => {
  return [
    {
      [Op.or]: [
        {
          validFrom:
            null,
        },
        {
          validFrom: {
            [Op.lte]:
              effectiveDate,
          },
        },
      ],
    },

    {
      [Op.or]: [
        {
          validUntil:
            null,
        },
        {
          validUntil: {
            [Op.gte]:
              effectiveDate,
          },
        },
      ],
    },
  ];
};

const buildMatrixQuantityFilter = (
  quantity
) => {
  return [
    {
      minimumQuantity: {
        [Op.lte]:
          quantity,
      },
    },

    {
      [Op.or]: [
        {
          maximumQuantity:
            null,
        },
        {
          maximumQuantity: {
            [Op.gte]:
              quantity,
          },
        },
      ],
    },
  ];
};

const serializeMatrixPrice = (
  variantPrice
) => {
  if (!variantPrice) {
    return null;
  }

  const regularPrice =
    Number(
      variantPrice.regularPrice ||
        0
    );

  const sellingPrice =
    Number(
      variantPrice.sellingPrice ||
        0
    );

  const discountAmount =
    Number(
      (
        regularPrice -
        sellingPrice
      ).toFixed(4)
    );

  const discountPercent =
    regularPrice > 0
      ? Number(
          (
            (
              discountAmount /
              regularPrice
            ) *
            100
          ).toFixed(4)
        )
      : 0;

  return {
    id:
      variantPrice.id,

    productVariantId:
      variantPrice
        .productVariantId,

    priceListId:
      variantPrice
        .priceListId,

    regularPrice,

    sellingPrice,

    compareAtPrice:
      variantPrice
        .compareAtPrice ===
      null
        ? null
        : Number(
            variantPrice
              .compareAtPrice
          ),

    costPrice:
      variantPrice
        .costPrice ===
      null
        ? null
        : Number(
            variantPrice
              .costPrice
          ),

    discountAmount,

    discountPercent,

    minimumQuantity:
      Number(
        variantPrice
          .minimumQuantity ||
          1
      ),

    maximumQuantity:
      variantPrice
        .maximumQuantity ===
      null
        ? null
        : Number(
            variantPrice
              .maximumQuantity
          ),

    validFrom:
      variantPrice.validFrom,

    validUntil:
      variantPrice.validUntil,

    priority:
      variantPrice.priority,

    isActive:
      variantPrice.isActive,

    createdAt:
      variantPrice.createdAt,

    updatedAt:
      variantPrice.updatedAt,
  };
};
  /*
  |--------------------------------------------------------------------------
  | Adjustment Extension Point
  |--------------------------------------------------------------------------
  |
  | Future modules can add:
  |
  | - automatic promotions
  | - coupon discounts
  | - BOGO rules
  | - bundle discounts
  | - customer-group pricing
  | - loyalty discounts
  | - employee discounts
  |
  | Every adjustment should return:
  |
  | {
  |   code,
  |   type,
  |   description,
  |   amount
  | }
  |--------------------------------------------------------------------------
  */
  
  const resolveItemAdjustments =
    async ({
      companyId,
      resolvedPrice,
      context,
      transaction,
    }) => {
      void companyId;
      void resolvedPrice;
      void context;
      void transaction;
  
      return [];
    };
  
  /*
  |--------------------------------------------------------------------------
  | Apply Adjustments
  |--------------------------------------------------------------------------
  */
  
  const applyAdjustments = ({
    resolvedPrice,
    adjustments,
  }) => {
    const baseLineAmount =
      roundMoney(
        resolvedPrice.lineAmount
      );
  
    const adjustmentTotal =
      roundMoney(
        adjustments.reduce(
          (
            total,
            adjustment
          ) =>
            total +
            Number(
              adjustment.amount ||
                0
            ),
          0
        )
      );
  
    const finalLineAmount =
      roundMoney(
        Math.max(
          0,
          baseLineAmount -
            adjustmentTotal
        )
      );
  
    const quantity =
      Number(
        resolvedPrice.quantity ||
          1
      );
  
    const finalUnitPrice =
      quantity > 0
        ? roundMoney(
            finalLineAmount /
              quantity
          )
        : 0;
  
    return {
      ...resolvedPrice,
  
      baseSellingPrice:
        roundMoney(
          resolvedPrice
            .sellingPrice
        ),
  
      baseLineAmount,
  
      adjustments,
  
      adjustmentTotal,
  
      finalUnitPrice,
  
      finalLineAmount,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Quote One Item
  |--------------------------------------------------------------------------
  */

  /*
|--------------------------------------------------------------------------
| Get Price Matrix
|--------------------------------------------------------------------------
*/

const getPriceMatrix = async ({
  companyId,
  productId,
  quantity = 1,
  effectiveDate = new Date(),
  currencyCode,
  channelCode,
  includeInactive = false,
  transaction,
}) => {
  const normalizedQuantity =
    normalizeMatrixQuantity(
      quantity
    );

  const normalizedDate =
    normalizeMatrixDate(
      effectiveDate
    );

  const normalizedCurrency =
    currencyCode
      ? String(
          currencyCode
        )
          .trim()
          .toUpperCase()
      : null;

  const normalizedChannel =
    channelCode
      ? String(
          channelCode
        )
          .trim()
          .toUpperCase()
      : null;

  /*
  |--------------------------------------------------------------------------
  | Product
  |--------------------------------------------------------------------------
  */

  const productWhere = {
    id:
      productId,

    companyId,
  };

  if (!includeInactive) {
    productWhere.status =
      "ACTIVE";
  }

  const product =
    await db.Product.findOne({
      where:
        productWhere,

      attributes: [
        "id",
        "name",
        "slug",
        "status",
        "productType",
        "taxCode",
        "taxPercent",
      ],

      transaction,
    });

  if (!product) {
    throw new AppError(
      includeInactive
        ? "Product not found."
        : "An active product was not found.",
      404,
      "PRICE_MATRIX_PRODUCT_NOT_FOUND"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Product Variants
  |--------------------------------------------------------------------------
  */

  const variantWhere = {
    companyId,

    productId:
      product.id,
  };

  if (!includeInactive) {
    variantWhere.status =
      "ACTIVE";
  }

  const variants =
    await db.ProductVariant.findAll({
      where:
        variantWhere,

      attributes: [
        "id",
        "productId",
        "sku",
        "name",
        "status",
      ],

      order: [
        [
          "name",
          "ASC",
        ],
        [
          "sku",
          "ASC",
        ],
        [
          "createdAt",
          "ASC",
        ],
      ],

      transaction,
    });

  /*
  |--------------------------------------------------------------------------
  | Applicable Price Lists
  |--------------------------------------------------------------------------
  */

  const priceListWhere = {
    companyId,

    [Op.and]:
      buildMatrixEffectiveDateFilter(
        normalizedDate
      ),
  };

  if (!includeInactive) {
    priceListWhere.isActive =
      true;
  }

  if (normalizedCurrency) {
    priceListWhere.currencyCode =
      normalizedCurrency;
  }

  if (normalizedChannel) {
    priceListWhere.channelCode = {
      [Op.in]: [
        normalizedChannel,
        "ALL",
      ],
    };
  }

  const priceLists =
    await db.PriceList.findAll({
      where:
        priceListWhere,

      attributes: [
        "id",
        "code",
        "name",
        "description",
        "priceListType",
        "channelCode",
        "currencyCode",
        "isTaxInclusive",
        "isDefault",
        "priority",
        "validFrom",
        "validUntil",
        "isActive",
      ],

      order: [
        [
          "priority",
          "ASC",
        ],
        [
          "name",
          "ASC",
        ],
        [
          "createdAt",
          "ASC",
        ],
      ],

      transaction,
    });

  /*
  |--------------------------------------------------------------------------
  | Applicable Variant Prices
  |--------------------------------------------------------------------------
  */

  const variantIds =
    variants.map(
      (variant) =>
        variant.id
    );

  const priceListIds =
    priceLists.map(
      (priceList) =>
        priceList.id
    );

  let variantPrices = [];

  if (
    variantIds.length > 0 &&
    priceListIds.length > 0
  ) {
    const variantPriceWhere = {
      companyId,

      productVariantId: {
        [Op.in]:
          variantIds,
      },

      priceListId: {
        [Op.in]:
          priceListIds,
      },

      [Op.and]: [
        ...buildMatrixEffectiveDateFilter(
          normalizedDate
        ),

        ...buildMatrixQuantityFilter(
          normalizedQuantity
        ),
      ],
    };

    if (!includeInactive) {
      variantPriceWhere.isActive =
        true;
    }

    variantPrices =
      await db.ProductVariantPrice.findAll({
        where:
          variantPriceWhere,

        order: [
          [
            "productVariantId",
            "ASC",
          ],

          [
            "priceListId",
            "ASC",
          ],

          /*
           * Same selection order used by
           * the price resolver.
           */
          [
            "priority",
            "ASC",
          ],

          [
            "minimumQuantity",
            "DESC",
          ],

          [
            "validFrom",
            "DESC",
          ],

          [
            "createdAt",
            "DESC",
          ],
        ],

        transaction,
      });
  }

  /*
  |--------------------------------------------------------------------------
  | Select One Applicable Record Per Matrix Cell
  |--------------------------------------------------------------------------
  |
  | The query is already ordered using the same precedence as the resolver.
  | Therefore, the first record found for a variant/price-list pair wins.
  |--------------------------------------------------------------------------
  */

  const selectedPriceMap =
    new Map();

  for (
    const variantPrice of
    variantPrices
  ) {
    const mapKey =
      `${variantPrice.productVariantId}:${variantPrice.priceListId}`;

    if (
      !selectedPriceMap.has(
        mapKey
      )
    ) {
      selectedPriceMap.set(
        mapKey,
        variantPrice
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Build Matrix Rows
  |--------------------------------------------------------------------------
  */

  const rows =
    variants.map(
      (variant) => {
        const prices = {};

        for (
          const priceList of
          priceLists
        ) {
          const mapKey =
            `${variant.id}:${priceList.id}`;

          const selectedPrice =
            selectedPriceMap.get(
              mapKey
            ) || null;

          prices[
            priceList.id
          ] =
            serializeMatrixPrice(
              selectedPrice
            );
        }

        return {
          variant: {
            id:
              variant.id,

            productId:
              variant.productId,

            sku:
              variant.sku,

            name:
              variant.name,

            status:
              variant.status,
          },

          prices,
        };
      }
    );

  const populatedCellCount =
    rows.reduce(
      (
        total,
        row
      ) => {
        return (
          total +
          Object.values(
            row.prices
          ).filter(
            Boolean
          ).length
        );
      },
      0
    );

  const totalCellCount =
    variants.length *
    priceLists.length;

  return {
    product: {
      id:
        product.id,

      name:
        product.name,

      slug:
        product.slug,

      status:
        product.status,

      productType:
        product.productType,

      taxCode:
        product.taxCode,

      taxPercent:
        Number(
          product.taxPercent ||
            0
        ),
    },

    context: {
      quantity:
        normalizedQuantity,

      effectiveDate:
        normalizedDate,

      currencyCode:
        normalizedCurrency,

      channelCode:
        normalizedChannel,

      includeInactive,
    },

    priceLists:
      priceLists.map(
        (priceList) => ({
          id:
            priceList.id,

          code:
            priceList.code,

          name:
            priceList.name,

          description:
            priceList.description,

          priceListType:
            priceList
              .priceListType,

          channelCode:
            priceList
              .channelCode,

          currencyCode:
            priceList
              .currencyCode,

          isTaxInclusive:
            priceList
              .isTaxInclusive,

          isDefault:
            priceList
              .isDefault,

          priority:
            priceList.priority,

          validFrom:
            priceList.validFrom,

          validUntil:
            priceList.validUntil,

          isActive:
            priceList.isActive,
        })
      ),

    rows,

    summary: {
      variantCount:
        variants.length,

      priceListCount:
        priceLists.length,

      totalCellCount,

      populatedCellCount,

      emptyCellCount:
        totalCellCount -
        populatedCellCount,
    },
  };
};
  
  const quoteItem = async ({
    companyId,
    productVariantId,
    quantity = 1,
    priceListId,
    channelCode,
    currencyCode,
    effectiveDate,
    includeInactive = false,
    customerId,
    customerGroupCode,
    couponCodes,
    metadata,
    transaction,
  }) => {
    const context =
      normalizeContext({
        priceListId,
        channelCode,
        currencyCode,
        effectiveDate,
        includeInactive,
        customerId,
        customerGroupCode,
        couponCodes,
        metadata,
      });
  
    const resolvedPrice =
      await priceResolverService
        .resolvePrice({
          companyId,
  
          productVariantId,
  
          quantity,
  
          priceListId:
            context.priceListId,
  
          channelCode:
            context.channelCode,
  
          currencyCode:
            context.currencyCode,
  
          effectiveDate:
            context.effectiveDate,
  
          includeInactive:
            context.includeInactive,
  
          transaction,
        });
  
    const adjustments =
      await resolveItemAdjustments({
        companyId,
  
        resolvedPrice,
  
        context,
  
        transaction,
      });
  
    return applyAdjustments({
      resolvedPrice,
      adjustments,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Quote Multiple Items
  |--------------------------------------------------------------------------
  */
  
  const quoteItems = async ({
    companyId,
    items,
    priceListId,
    channelCode,
    currencyCode,
    effectiveDate,
    includeInactive = false,
    customerId,
    customerGroupCode,
    couponCodes,
    metadata,
    transaction,
  }) => {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      throw new AppError(
        "At least one pricing item is required.",
        400,
        "PRICING_FACADE_ITEMS_REQUIRED"
      );
    }
  
    const context =
      normalizeContext({
        priceListId,
        channelCode,
        currencyCode,
        effectiveDate,
        includeInactive,
        customerId,
        customerGroupCode,
        couponCodes,
        metadata,
      });
  
    const quotedItems = [];
  
    for (
      let index = 0;
      index <
      items.length;
      index += 1
    ) {
      const item =
        items[index];
  
      if (
        !item ||
        !item.productVariantId
      ) {
        throw new AppError(
          `Product variant ID is required for pricing item ${index + 1}.`,
          400,
          "PRICING_FACADE_VARIANT_REQUIRED"
        );
      }
  
      const quotedItem =
        await quoteItem({
          companyId,
  
          productVariantId:
            item.productVariantId,
  
          quantity:
            item.quantity ??
            1,
  
          priceListId:
            item.priceListId ||
            context.priceListId,
  
          channelCode:
            item.channelCode ||
            context.channelCode,
  
          currencyCode:
            item.currencyCode ||
            context.currencyCode,
  
          effectiveDate:
            item.effectiveDate ||
            context.effectiveDate,
  
          includeInactive:
            context.includeInactive,
  
          customerId:
            item.customerId ||
            context.customerId,
  
          customerGroupCode:
            item.customerGroupCode ||
            context.customerGroupCode,
  
          couponCodes:
            item.couponCodes ||
            context.couponCodes,
  
          metadata: {
            ...context.metadata,
            ...(
              item.metadata ||
              {}
            ),
          },
  
          transaction,
        });
  
      quotedItems.push({
        lineNumber:
          index + 1,
  
        reference:
          item.reference ||
          null,
  
        ...quotedItem,
      });
    }
  
    return quotedItems;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Quote Cart
  |--------------------------------------------------------------------------
  */
  
  const quoteCart = async ({
    companyId,
    items,
    priceListId,
    channelCode,
    currencyCode,
    effectiveDate,
    includeInactive = false,
    customerId,
    customerGroupCode,
    couponCodes,
    metadata,
    transaction,
  }) => {
    const quotedItems =
      await quoteItems({
        companyId,
        items,
        priceListId,
        channelCode,
        currencyCode,
        effectiveDate,
        includeInactive,
        customerId,
        customerGroupCode,
        couponCodes,
        metadata,
        transaction,
      });
  
    const currencies = [
      ...new Set(
        quotedItems
          .map(
            (item) =>
              item.currencyCode
          )
          .filter(
            Boolean
          )
      ),
    ];
  
    if (
      currencies.length >
      1
    ) {
      throw new AppError(
        "All cart items must resolve to the same currency.",
        409,
        "PRICING_FACADE_CURRENCY_MISMATCH"
      );
    }
  
    const totalQuantity =
      quotedItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity ||
              0
          ),
        0
      );
  
    const regularSubtotal =
      roundMoney(
        quotedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              Number(
                item.regularPrice ||
                  0
              ) *
              Number(
                item.quantity ||
                  0
              )
            ),
          0
        )
      );
  
    const baseSubtotal =
      roundMoney(
        quotedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.baseLineAmount ||
                0
            ),
          0
        )
      );
  
    const priceListDiscount =
      roundMoney(
        quotedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              Number(
                item.discountAmount ||
                  0
              ) *
              Number(
                item.quantity ||
                  0
              )
            ),
          0
        )
      );
  
    const adjustmentTotal =
      roundMoney(
        quotedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.adjustmentTotal ||
                0
            ),
          0
        )
      );
  
    const subtotal =
      roundMoney(
        quotedItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.finalLineAmount ||
                0
            ),
          0
        )
      );
  
    const totalDiscount =
      roundMoney(
        priceListDiscount +
        adjustmentTotal
      );
  
    return {
      items:
        quotedItems,
  
      summary: {
        lineCount:
          quotedItems.length,
  
        totalQuantity,
  
        regularSubtotal,
  
        baseSubtotal,
  
        priceListDiscount,
  
        adjustmentTotal,
  
        totalDiscount,
  
        subtotal,
  
        currencyCode:
          currencies[0] ||
          currencyCode ||
          null,
  
        effectiveDate:
          effectiveDate ||
          new Date(),
      },
  
      context: {
        priceListId:
          priceListId ||
          null,
  
        channelCode:
          channelCode ||
          null,
  
        customerId:
          customerId ||
          null,
  
        customerGroupCode:
          customerGroupCode ||
          null,
  
        couponCodes:
          Array.isArray(
            couponCodes
          )
            ? couponCodes
            : [],
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Transactional Cart Quote
  |--------------------------------------------------------------------------
  |
  | Useful during checkout or order creation when pricing must be resolved
  | inside the same database transaction as the order.
  |--------------------------------------------------------------------------
  */
  
  const quoteCartTransactionally =
    async ({
      companyId,
      items,
      priceListId,
      channelCode,
      currencyCode,
      effectiveDate,
      includeInactive = false,
      customerId,
      customerGroupCode,
      couponCodes,
      metadata,
    }) => {
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        const result =
          await quoteCart({
            companyId,
            items,
            priceListId,
            channelCode,
            currencyCode,
            effectiveDate,
            includeInactive,
            customerId,
            customerGroupCode,
            couponCodes,
            metadata,
            transaction,
          });
  
        await transaction
          .commit();
  
        return result;
      } catch (error) {
        if (
          !transaction.finished
        ) {
          await transaction
            .rollback();
        }
  
        throw error;
      }
    };
  
    module.exports = {
      getPriceMatrix,
      quoteItem,
      quoteItems,
      quoteCart,
      quoteCartTransactionally,
    };