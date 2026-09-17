const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../models"
  );

const AppError =
  require(
    "../utils/AppError"
  );

const DISPLAY_LOCATIONS = [
  "PRODUCT_DETAIL",
  "ADD_TO_CART",
  "CART",
  "CHECKOUT",
];

const normalizeLocation =
  (
    value
  ) => {
    const normalized =
      String(
        value ||
          "PRODUCT_DETAIL"
      )
        .trim()
        .toUpperCase();

    if (
      !DISPLAY_LOCATIONS.includes(
        normalized
      )
    ) {
      throw new AppError(
        "Invalid attachment display location.",
        400,
        "PRODUCT_ATTACHMENT_LOCATION_INVALID"
      );
    }

    return normalized;
  };

const getProductContext =
  async ({
    companyId,
    productId,
  }) => {
    const product =
      await db.Product
        .findOne({
          where: {
            id:
              productId,

            companyId,

            status:
              "ACTIVE",
          },

          attributes: [
            "id",
            "name",
            "slug",
            "brandId",
            "primaryCategoryId",
          ],
        });

    if (
      !product
    ) {
      throw new AppError(
        "Product not found.",
        404,
        "PRODUCT_NOT_FOUND"
      );
    }

    const categoryRows =
      await db
        .ProductCategory
        .findAll({
          where: {
            companyId,

            productId,
          },

          attributes: [
            "categoryId",
          ],
        });

    return {
      product,

      categoryIds: [
        ...new Set(
          [
            product
              .primaryCategoryId,

            ...categoryRows
              .map(
                (
                  row
                ) =>
                  row.categoryId
              ),
          ]
            .filter(
              Boolean
            )
        ),
      ],
    };
  };

const getApplicableRules =
  async ({
    companyId,
    product,
    categoryIds,
    displayLocation,
  }) => {
    const now =
      new Date();

    const scopeClauses = [
      {
        scopeType:
          "PRODUCT",

        productId:
          product.id,
      },
    ];

    if (
      product.brandId
    ) {
      scopeClauses.push({
        scopeType:
          "BRAND",

        brandId:
          product.brandId,
      });
    }

    if (
      categoryIds.length
    ) {
      scopeClauses.push({
        scopeType:
          "CATEGORY",

        categoryId: {
          [Op.in]:
            categoryIds,
        },
      });
    }

    return db
      .ProductAttachmentRule
      .findAll({
        where: {
          companyId,

          isActive:
            true,

          [Op.and]: [
            {
              [Op.or]:
                scopeClauses,
            },

            {
              [Op.or]: [
                {
                  displayLocation,
                },

                {
                  displayLocation:
                    "ALL",
                },
              ],
            },

            {
              [Op.or]: [
                {
                  effectiveFrom:
                    null,
                },

                {
                  effectiveFrom: {
                    [Op.lte]:
                      now,
                  },
                },
              ],
            },

            {
              [Op.or]: [
                {
                  effectiveUntil:
                    null,
                },

                {
                  effectiveUntil: {
                    [Op.gte]:
                      now,
                  },
                },
              ],
            },
          ],
        },

        include: [
          {
            model:
              db.ProductAttachmentRuleItem,

            as:
              "items",

            required:
              false,

            where: {
              isActive:
                true,
            },
          },
        ],

        order: [
          [
            "priority",
            "ASC",
          ],

          [
            {
              model:
                db.ProductAttachmentRuleItem,

              as:
                "items",
            },

            "sortOrder",
            "ASC",
          ],
        ],
      });
  };

const sourceRank =
  (
    scopeType
  ) => {
    if (
      scopeType ===
      "PRODUCT"
    ) {
      return 1;
    }

    if (
      scopeType ===
      "BRAND"
    ) {
      return 2;
    }

    return 3;
  };

const loadSuggestedProducts =
  async ({
    companyId,
    productIds,
    channelCode,
    currencyCode,
  }) => {
    if (
      !productIds.length
    ) {
      return new Map();
    }

    const products =
      await db.Product
        .findAll({
          where: {
            companyId,

            id: {
              [Op.in]:
                productIds,
            },

            status:
              "ACTIVE",

            isSearchable:
              true,
          },

          include: [
            {
              model:
                db.Brand,

              as:
                "brand",

              required:
                false,

              attributes: [
                "id",
                "name",
                "code",
              ],
            },

            {
              model:
                db.ProductImage,

              as:
                "images",

              required:
                false,

              where: {
                isActive:
                  true,
              },

              include: [
                {
                  model:
                    db.MediaAsset,

                  as:
                    "mediaAsset",

                  required:
                    false,
                },
              ],
            },

            {
              model:
                db.ProductVariant,

              as:
                "variants",

              required:
                true,

              where: {
                status:
                  "ACTIVE",
              },

              include: [
                {
                  model:
                    db.ProductVariantChannel,

                  as:
                    "channels",

                  required:
                    true,

                  where: {
                    channelCode,

                    isVisible:
                      true,
                  },
                },

                {
                  model:
                    db.ProductVariantPrice,

                  as:
                    "prices",

                  required:
                    true,

                  where: {
                    isActive:
                      true,

                    [Op.and]: [
                      {
                        [Op.or]: [
                          {
                            validFrom:
                              null,
                          },

                          {
                            validFrom: {
                              [Op.lte]:
                                new Date(),
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
                                new Date(),
                            },
                          },
                        ],
                      },
                    ],
                  },

                  include: [
                    {
                      model:
                        db.PriceList,

                      as:
                        "priceList",

                      required:
                        true,

                      where:
                        buildPriceListWhere({
                          channelCode,
                          currencyCode,
                        }),
                    },
                  ],
                },
              ],
            },
          ],

          distinct:
            true,
        });

    const result =
      new Map();

    for (
      const product of
      products
    ) {
      const plain =
        product.get({
          plain:
            true,
        });

      const variants =
        plain.variants ||
        [];

      const preferredVariant =
        variants.find(
          (
            variant
          ) =>
            variant.isDefault ===
            true
        ) ||
        variants[0] ||
        null;

      if (
        !preferredVariant
      ) {
        continue;
      }

      const prices =
        (
          preferredVariant
            .prices ||
          []
        )
          .filter(
            (
              price
            ) =>
              Number(
                price
                  .minimumQuantity ||
                  1
              ) <=
              1
          )
          .sort(
            (
              a,
              b
            ) =>
              Number(
                a.priority ||
                  100
              ) -
              Number(
                b.priority ||
                  100
              )
          );

      const price =
        prices[0] ||
        null;

      if (
        !price
      ) {
        continue;
      }

      const images =
        plain.images ||
        [];

      const primaryImage =
        images.find(
          (
            image
          ) =>
            image.imageRole ===
            "PRIMARY"
        ) ||
        images[0] ||
        null;

      result.set(
        plain.id,
        {
          id:
            plain.id,

          name:
            plain.name,

          slug:
            plain.slug,

          brand:
            plain.brand ||
            null,

          variant: {
            id:
              preferredVariant.id,

            sku:
              preferredVariant.sku,

            name:
              preferredVariant.name,
          },

          price: {
            regularPrice:
              Number(
                price.regularPrice
              ),

            sellingPrice:
              Number(
                price.sellingPrice
              ),

            compareAtPrice:
              price.compareAtPrice ===
              null
                ? null
                : Number(
                    price.compareAtPrice
                  ),

            currencyCode:
              price.priceList
                ?.currencyCode ||
              currencyCode,

            isTaxInclusive:
              price.priceList
                ?.isTaxInclusive !==
              false,
          },

          taxPercent:
            Number(
              plain.taxPercent ||
                0
            ),

          image:
            primaryImage
              ?.mediaAsset
              ?.publicUrl ||
            null,
        }
      );
    }

    return result;
  };

const buildPriceListWhere =
  ({
    channelCode,
    currencyCode,
  }) => {
    const attributes =
      db.PriceList
        .rawAttributes ||
      {};

    const where = {};

    if (
      attributes.isActive
    ) {
      where.isActive =
        true;
    }

    if (
      attributes.currencyCode
    ) {
      where.currencyCode =
        currencyCode;
    }

    if (
      attributes.channelCode
    ) {
      where.channelCode =
        channelCode;
    } else if (
      attributes.code
    ) {
      where.code = {
        [Op.iLike]:
          `${channelCode}%${currencyCode}%`,
      };
    }

    return where;
  };

const resolveProductAttachments =
  async ({
    companyId,
    productId,
    displayLocation =
      "PRODUCT_DETAIL",
    channelCode =
      "WEBSITE",
    currencyCode =
      "AED",
    excludeProductIds =
      [],
    limit =
      8,
  }) => {
    const location =
      normalizeLocation(
        displayLocation
      );

    const {
      product,
      categoryIds,
    } =
      await getProductContext({
        companyId,
        productId,
      });

    const rules =
      await getApplicableRules({
        companyId,
        product,
        categoryIds,
        displayLocation:
          location,
      });

    const excluded =
      new Set(
        [
          productId,
          ...excludeProductIds,
        ].filter(
          Boolean
        )
      );

    const candidateMap =
      new Map();

    for (
      const rule of
      rules
    ) {
      for (
        const item of
        rule.items ||
        []
      ) {
        if (
          excluded.has(
            item
              .attachmentProductId
          )
        ) {
          continue;
        }

        const existing =
          candidateMap.get(
            item
              .attachmentProductId
          );

        const candidate = {
          attachmentProductId:
            item
              .attachmentProductId,

          ruleId:
            rule.id,

          ruleName:
            rule.name,

          relationshipType:
            rule
              .relationshipType,

          source:
            rule.scopeType,

          priority:
            Number(
              rule.priority ||
                100
            ),

          sortOrder:
            Number(
              item.sortOrder ||
                0
            ),

          minimumQuantity:
            Number(
              item.minimumQuantity ||
                1
            ),

          maximumQuantity:
            item.maximumQuantity ===
            null
              ? null
              : Number(
                  item.maximumQuantity
                ),
        };

        if (
          !existing ||
          sourceRank(
            candidate.source
          ) <
            sourceRank(
              existing.source
            ) ||
          (
            sourceRank(
              candidate.source
            ) ===
              sourceRank(
                existing.source
              ) &&
            (
              candidate.priority <
                existing.priority ||
              (
                candidate.priority ===
                  existing.priority &&
                candidate.sortOrder <
                  existing.sortOrder
              )
            )
          )
        ) {
          candidateMap.set(
            candidate
              .attachmentProductId,
            candidate
          );
        }
      }
    }

    const candidates =
      Array.from(
        candidateMap
          .values()
      )
        .sort(
          (
            a,
            b
          ) =>
            sourceRank(
              a.source
            ) -
              sourceRank(
                b.source
              ) ||
            a.priority -
              b.priority ||
            a.sortOrder -
              b.sortOrder
        );

    const productMap =
      await loadSuggestedProducts({
        companyId,

        productIds:
          candidates.map(
            (
              item
            ) =>
              item
                .attachmentProductId
          ),

        channelCode:
          String(
            channelCode
          )
            .trim()
            .toUpperCase(),

        currencyCode:
          String(
            currencyCode
          )
            .trim()
            .toUpperCase(),
      });

    const suggestions =
      [];

    for (
      const candidate of
      candidates
    ) {
      const suggestedProduct =
        productMap.get(
          candidate
            .attachmentProductId
        );

      if (
        !suggestedProduct
      ) {
        continue;
      }

      suggestions.push({
        ...candidate,

        product:
          suggestedProduct,
      });

      if (
        suggestions.length >=
        Number(
          limit ||
            8
        )
      ) {
        break;
      }
    }

    return {
      product: {
        id:
          product.id,

        name:
          product.name,

        slug:
          product.slug,
      },

      displayLocation:
        location,

      channelCode:
        String(
          channelCode
        )
          .trim()
          .toUpperCase(),

      currencyCode:
        String(
          currencyCode
        )
          .trim()
          .toUpperCase(),

      suggestions,
    };
  };

module.exports = {
  resolveProductAttachments,
};
