const {
    Op,
    literal,
  } = require("sequelize");
  
  const db = require(
    "../../models"
  );
  
  const AppError = require(
    "../../utils/AppError"
  );
  
  const {
    calculateDiscount,
    normalizeQuantity,
    normalizeDate,
  } = require(
    "./variantPrice.utils"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const buildEffectiveDateFilter = (
    effectiveDate
  ) => {
    return [
      {
        [Op.or]: [
          {
            validFrom: null,
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
            validUntil: null,
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
  
  const buildQuantityFilter = (
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
  
  const validateVariant = async ({
    companyId,
    productVariantId,
    includeInactive,
    transaction,
  }) => {
    const where = {
      id:
        productVariantId,
  
      companyId,
    };
  
    if (!includeInactive) {
      where.status =
        "ACTIVE";
    }
  
    const variant =
      await db.ProductVariant.findOne({
        where,
  
        include: [
          {
            model:
              db.Product,
  
            as:
              "product",
  
            required:
              true,
  
            where:
              includeInactive
                ? {
                    companyId,
                  }
                : {
                    companyId,
                    status:
                      "ACTIVE",
                  },
  
            attributes: [
              "id",
              "name",
              "slug",
              "status",
              "productType",
              "taxCode",
              "taxPercent",
            ],
          },
        ],
  
        transaction,
      });
  
    if (!variant) {
      throw new AppError(
        includeInactive
          ? "Product variant not found."
          : "An active product variant was not found.",
        404,
        "PRICE_RESOLVER_VARIANT_NOT_FOUND"
      );
    }
  
    return variant;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Price List
  |--------------------------------------------------------------------------
  */
  
  const resolvePriceList = async ({
    companyId,
    priceListId,
    channelCode,
    currencyCode,
    effectiveDate,
    includeInactive,
    transaction,
  }) => {
    const baseWhere = {
      companyId,
    };
  
    if (!includeInactive) {
      baseWhere.isActive =
        true;
    }
  
    if (currencyCode) {
      baseWhere.currencyCode =
        String(
          currencyCode
        )
          .trim()
          .toUpperCase();
    }
  
    baseWhere[Op.and] =
      buildEffectiveDateFilter(
        effectiveDate
      );
  
    /*
     * Explicit price-list selection always takes precedence.
     */
  
    if (priceListId) {
      const priceList =
        await db.PriceList.findOne({
          where: {
            ...baseWhere,
  
            id:
              priceListId,
          },
  
          transaction,
        });
  
      if (!priceList) {
        throw new AppError(
          "The selected price list was not found or is not currently active.",
          404,
          "PRICE_RESOLVER_PRICE_LIST_NOT_FOUND"
        );
      }
  
      return priceList;
    }
  
    /*
     * Resolve using the sales channel.
     *
     * Exact channel match has priority over ALL.
     */
  
    if (channelCode) {
      const normalizedChannel =
        String(channelCode)
          .trim()
          .toUpperCase();
  
      const priceList =
        await db.PriceList.findOne({
          where: {
            ...baseWhere,
  
            channelCode: {
              [Op.in]: [
                normalizedChannel,
                "ALL",
              ],
            },
          },
  
          order: [
            [
              literal(
                `CASE
                  WHEN "PriceList"."channelCode" = '${normalizedChannel.replace(
                    /'/g,
                    "''"
                  )}'
                  THEN 0
                  ELSE 1
                END`
              ),
              "ASC",
            ],
  
            [
              "isDefault",
              "DESC",
            ],
  
            [
              "priority",
              "ASC",
            ],
  
            [
              "createdAt",
              "ASC",
            ],
          ],
  
          transaction,
        });
  
      if (priceList) {
        return priceList;
      }
    }
  
    /*
     * Fall back to the company's active default price list.
     */
  
    const defaultPriceList =
      await db.PriceList.findOne({
        where: {
          ...baseWhere,
  
          isDefault:
            true,
        },
  
        order: [
          [
            "priority",
            "ASC",
          ],
        ],
  
        transaction,
      });
  
    if (!defaultPriceList) {
      throw new AppError(
        "No active default price list is configured for this company.",
        409,
        "PRICE_RESOLVER_DEFAULT_PRICE_LIST_MISSING"
      );
    }
  
    return defaultPriceList;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Find Applicable Variant Price
  |--------------------------------------------------------------------------
  */
  
  const findApplicableVariantPrice =
    async ({
      companyId,
      productVariantId,
      priceListId,
      quantity,
      effectiveDate,
      includeInactive,
      transaction,
    }) => {
      const where = {
        companyId,
  
        productVariantId,
  
        priceListId,
  
        [Op.and]: [
          ...buildEffectiveDateFilter(
            effectiveDate
          ),
  
          ...buildQuantityFilter(
            quantity
          ),
        ],
      };
  
      if (!includeInactive) {
        where.isActive =
          true;
      }
  
      return db.ProductVariantPrice.findOne({
        where,
  
        order: [
          /*
           * Lower priority number wins.
           */
          [
            "priority",
            "ASC",
          ],
  
          /*
           * For quantity pricing, the most specific applicable
           * minimum quantity wins.
           *
           * Example:
           * 1+ units
           * 5+ units
           * 10+ units
           *
           * Quantity 12 should select the 10+ tier.
           */
          [
            "minimumQuantity",
            "DESC",
          ],
  
          /*
           * When scheduled prices exist, prefer the most recently
           * started applicable price.
           */
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
    };
  
  /*
  |--------------------------------------------------------------------------
  | Response Formatting
  |--------------------------------------------------------------------------
  */
  
  const serializeResolvedPrice = ({
    variant,
    priceList,
    variantPrice,
    quantity,
    effectiveDate,
  }) => {
    const regularPrice =
      Number(
        variantPrice.regularPrice
      );
  
    const sellingPrice =
      Number(
        variantPrice.sellingPrice
      );
  
    const compareAtPrice =
      variantPrice.compareAtPrice ===
      null
        ? null
        : Number(
            variantPrice.compareAtPrice
          );
  
    const costPrice =
      variantPrice.costPrice ===
      null
        ? null
        : Number(
            variantPrice.costPrice
          );
  
    const discount =
      calculateDiscount({
        regularPrice,
        sellingPrice,
      });
  
    return {
      productId:
        variant.productId,
  
      productVariantId:
        variant.id,
  
      variantSku:
        variant.sku,
  
      variantName:
        variant.name,
  
      priceListId:
        priceList.id,
  
      priceListCode:
        priceList.code,
  
      priceListName:
        priceList.name,
  
      priceListType:
        priceList.priceListType,
  
      channelCode:
        priceList.channelCode,
  
      currencyCode:
        priceList.currencyCode,
  
      isTaxInclusive:
        priceList.isTaxInclusive,
  
      taxCode:
        variant.product?.taxCode ||
        null,
  
      taxPercent:
        Number(
          variant.product
            ?.taxPercent ||
            0
        ),
  
      regularPrice,
  
      sellingPrice,
  
      compareAtPrice,
  
      costPrice,
  
      discountAmount:
        discount.discountAmount,
  
      discountPercent:
        discount.discountPercent,
  
      quantity,
  
      lineAmount:
        Number(
          (
            sellingPrice *
            quantity
          ).toFixed(4)
        ),
  
      minimumQuantity:
        Number(
          variantPrice
            .minimumQuantity
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
  
      effectiveDate,
  
      priority:
        variantPrice.priority,
  
      source: {
        type:
          "PRODUCT_VARIANT_PRICE",
  
        id:
          variantPrice.id,
  
        priceListId:
          priceList.id,
  
        priceListCode:
          priceList.code,
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve One Variant Price
  |--------------------------------------------------------------------------
  */
  
  const resolvePrice = async ({
    companyId,
    productVariantId,
    priceListId,
    channelCode,
    currencyCode,
    quantity = 1,
    effectiveDate = new Date(),
    includeInactive = false,
    transaction,
  }) => {
    const normalizedQuantity =
      normalizeQuantity(
        quantity,
        {
          fieldName:
            "Quantity",
  
          allowNull:
            false,
  
          minimum:
            1,
        }
      );
  
    const normalizedDate =
      normalizeDate(
        effectiveDate,
        {
          fieldName:
            "Effective date",
  
          allowNull:
            false,
        }
      );
  
    const variant =
      await validateVariant({
        companyId,
  
        productVariantId,
  
        includeInactive,
  
        transaction,
      });
  
    const priceList =
      await resolvePriceList({
        companyId,
  
        priceListId,
  
        channelCode,
  
        currencyCode,
  
        effectiveDate:
          normalizedDate,
  
        includeInactive,
  
        transaction,
      });
  
    const variantPrice =
      await findApplicableVariantPrice({
        companyId,
  
        productVariantId:
          variant.id,
  
        priceListId:
          priceList.id,
  
        quantity:
          normalizedQuantity,
  
        effectiveDate:
          normalizedDate,
  
        includeInactive,
  
        transaction,
      });
  
    if (!variantPrice) {
      throw new AppError(
        `No applicable price was found for variant "${variant.sku}" in price list "${priceList.code}".`,
        404,
        "PRICE_RESOLVER_PRICE_NOT_FOUND"
      );
    }
  
    return serializeResolvedPrice({
      variant,
  
      priceList,
  
      variantPrice,
  
      quantity:
        normalizedQuantity,
  
      effectiveDate:
        normalizedDate,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Prices for Multiple Variants
  |--------------------------------------------------------------------------
  */
  
  const resolvePrices = async ({
    companyId,
    items,
    priceListId,
    channelCode,
    currencyCode,
    effectiveDate = new Date(),
    includeInactive = false,
    transaction,
  }) => {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      throw new AppError(
        "At least one pricing item is required.",
        400,
        "PRICE_RESOLVER_ITEMS_REQUIRED"
      );
    }
  
    const normalizedDate =
      normalizeDate(
        effectiveDate,
        {
          fieldName:
            "Effective date",
  
          allowNull:
            false,
        }
      );
  
    const resolvedItems = [];
  
    for (
      const item of
      items
    ) {
      const resolvedPrice =
        await resolvePrice({
          companyId,
  
          productVariantId:
            item.productVariantId,
  
          priceListId:
            item.priceListId ||
            priceListId,
  
          channelCode:
            item.channelCode ||
            channelCode,
  
          currencyCode:
            item.currencyCode ||
            currencyCode,
  
          quantity:
            item.quantity ||
            1,
  
          effectiveDate:
            item.effectiveDate ||
            normalizedDate,
  
          includeInactive,
  
          transaction,
        });
  
      resolvedItems.push(
        resolvedPrice
      );
    }
  
    const subtotal =
      resolvedItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.lineAmount
          ),
        0
      );
  
    const totalDiscount =
      resolvedItems.reduce(
        (
          total,
          item
        ) =>
          total +
          (
            Number(
              item.discountAmount
            ) *
            Number(
              item.quantity
            )
          ),
        0
      );
  
    return {
      items:
        resolvedItems,
  
      summary: {
        itemCount:
          resolvedItems.length,
  
        totalQuantity:
          resolvedItems.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.quantity
              ),
            0
          ),
  
        subtotal:
          Number(
            subtotal.toFixed(
              4
            )
          ),
  
        totalDiscount:
          Number(
            totalDiscount.toFixed(
              4
            )
          ),
  
        currencyCode:
          resolvedItems[0]
            ?.currencyCode ||
          currencyCode ||
          null,
  
        effectiveDate:
          normalizedDate,
      },
    };
  };
  
  module.exports = {
    resolvePriceList,
    resolvePrice,
    resolvePrices,
  };