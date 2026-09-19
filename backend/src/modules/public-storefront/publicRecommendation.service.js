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
  
  const publicAvailabilityService =
    require(
      "./publicAvailability.service"
    );

const giftVoucherPromotionService =
    require(
      "../gift-voucher-promotions/giftVoucherPromotion.service"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Recommendation Weights
  |--------------------------------------------------------------------------
  */
  
  const ACTIVITY_WEIGHTS = {
    PURCHASE:
      10,
  
    ADD_TO_CART:
      7,
  
    ADD_TO_WISHLIST:
      5,
  
    SEARCH:
      4,
  
    VIEW_PRODUCT:
      3,
  
    VIEW_CATEGORY:
      2,
  
    VIEW_BRAND:
      2,
  
    VIEW_COLLECTION:
      2,
  };
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const toPlain = (
    value
  ) =>
    value &&
    typeof value.get ===
      "function"
      ? value.get({
          plain:
            true,
        })
      : value;
  
  const toNumber = (
    value
  ) => {
    const number =
      Number(
        value
      );
  
    return Number.isFinite(
      number
    )
      ? number
      : 0;
  };
  
  const absoluteUrl = (
    value,
    apiBaseUrl
  ) => {
    if (!value) {
      return null;
    }
  
    const url =
      String(
        value
      ).trim();
  
    if (!url) {
      return null;
    }
  
    if (
      /^https?:\/\//i.test(
        url
      )
    ) {
      return url;
    }
  
    const base =
      String(
        apiBaseUrl ||
          ""
      ).replace(
        /\/+$/,
        ""
      );
  
    const path =
      url.startsWith(
        "/"
      )
        ? url
        : `/${url}`;
  
    return base
      ? `${base}${path}`
      : path;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Recency Weight
  |--------------------------------------------------------------------------
  */
  
  const getRecencyMultiplier = (
    createdAt
  ) => {
    const created =
      new Date(
        createdAt
      );
  
    if (
      Number.isNaN(
        created.getTime()
      )
    ) {
      return 1;
    }
  
    const ageMilliseconds =
      Date.now() -
      created.getTime();
  
    const ageHours =
      ageMilliseconds /
      (
        1000 *
        60 *
        60
      );
  
    if (
      ageHours <=
      24
    ) {
      return 1.5;
    }
  
    if (
      ageHours <=
      24 * 7
    ) {
      return 1.25;
    }
  
    if (
      ageHours <=
      24 * 30
    ) {
      return 1.1;
    }
  
    return 1;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Score Map Helper
  |--------------------------------------------------------------------------
  */
  
  const addScore = (
    map,
    key,
    score
  ) => {
    if (!key) {
      return;
    }
  
    map.set(
      key,
      (
        map.get(
          key
        ) ||
        0
      ) +
        score
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Company
  |--------------------------------------------------------------------------
  */
  
  const getCompany =
    async (
      companyCode
    ) => {
      const code =
        String(
          companyCode ||
            ""
        )
          .trim()
          .toUpperCase();
  
      if (!code) {
        throw new AppError(
          "Company code is required.",
          400,
          "COMPANY_CODE_REQUIRED"
        );
      }
  
      const company =
        await db.Company.findOne({
          where: {
            code,
  
            isActive:
              true,
          },
        });
  
      if (!company) {
        throw new AppError(
          "Storefront company was not found.",
          404,
          "STOREFRONT_COMPANY_NOT_FOUND"
        );
      }
  
      return company;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Price List
  |--------------------------------------------------------------------------
  */
  
  const validityWindow = (
    now
  ) => ({
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
                now,
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
                now,
            },
          },
        ],
      },
    ],
  });
  
  const findPriceList =
    async ({
      companyId,
      channel,
      now,
    }) => {
      const lists =
        await db.PriceList.findAll({
          where: {
            companyId,
  
            isActive:
              true,
  
            channelCode: {
              [Op.in]: [
                channel,
                "ALL",
              ],
            },
  
            ...validityWindow(
              now
            ),
          },
  
          order: [
            [
              "priority",
              "ASC",
            ],
  
            [
              "isDefault",
              "DESC",
            ],
  
            [
              "createdAt",
              "ASC",
            ],
          ],
        });
  
      return (
        lists.find(
          (
            list
          ) =>
            String(
              list.channelCode ||
                ""
            ).toUpperCase() ===
            channel
        ) ||
        lists[0] ||
        null
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Media
  |--------------------------------------------------------------------------
  */
  
  const publicMedia = (
    asset,
    apiBaseUrl
  ) => {
    if (!asset) {
      return null;
    }
  
    const item =
      toPlain(
        asset
      );
  
    return {
      id:
        item.id,
  
      title:
        item.title ||
        null,
  
      altText:
        item.altText ||
        null,
  
      caption:
        item.caption ||
        null,
  
      assetType:
        item.assetType,
  
      classification:
        item.classification,
  
      mimeType:
        item.mimeType,
  
      width:
        item.width,
  
      height:
        item.height,
  
      orientation:
        item.orientation,
  
      dominantColor:
        item.dominantColor,
  
      publicUrl:
        absoluteUrl(
          item.publicUrl ||
            item.storagePath,
          apiBaseUrl
        ),
  
      thumbnailUrl:
        absoluteUrl(
          item.thumbnailPath
            ? `/media/${item.thumbnailPath}`
            : null,
          apiBaseUrl
        ),
  
      previewUrl:
        absoluteUrl(
          item.previewPath
            ? `/media/${item.previewPath}`
            : null,
          apiBaseUrl
        ),
  
      variants:
        (
          item.variants ||
          []
        )
          .filter(
            (
              variant
            ) =>
              variant.isActive ===
              true
          )
          .map(
            (
              variant
            ) => ({
              id:
                variant.id,
  
              variantType:
                variant.variantType,
  
              format:
                variant.format,
  
              mimeType:
                variant.mimeType,
  
              width:
                variant.width,
  
              height:
                variant.height,
  
              isPrimary:
                variant.isPrimary ===
                true,
  
              publicUrl:
                absoluteUrl(
                  variant.publicUrl ||
                    variant.storagePath,
                  apiBaseUrl
                ),
            })
          )
          .filter(
            (
              variant
            ) =>
              Boolean(
                variant.publicUrl
              )
          ),
    };
  };
  
  const mediaInclude = (
    companyId,
    as
  ) => ({
    model:
      db.MediaAsset,
  
    as,
  
    required:
      false,
  
    where: {
      companyId,
  
      status:
        "READY",
  
      isPublic:
        true,
  
      isActive:
        true,
    },
  
    include: [
      {
        model:
          db.MediaAssetVariant,
  
        as:
          "variants",
  
        required:
          false,
  
        where: {
          companyId,
  
          isActive:
            true,
        },
      },
    ],
  });
  
  /*
  |--------------------------------------------------------------------------
  | Product Includes
  |--------------------------------------------------------------------------
  */
  
  const productIncludes = ({
    companyId,
    channel,
    priceListId,
    now,
  }) => [
    {
      model:
        db.ProductChannel,
  
      as:
        "channels",
  
      required:
        true,
  
      where: {
        companyId,
  
        channelCode:
          channel,
  
        isVisible:
          true,
  
        publishStatus:
          "PUBLISHED",
      },
  
      attributes: [
        "channelCode",
        "channelTitle",
        "channelDescription",
      ],
    },
  
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
        "slug",
      ],
    },
  
    {
      model:
        db.Category,
  
      as:
        "primaryCategory",
  
      required:
        false,
  
      attributes: [
        "id",
        "name",
        "slug",
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
        companyId,
  
        isActive:
          true,
      },
  
      include: [
        mediaInclude(
          companyId,
          "mediaAsset"
        ),
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
        companyId,
  
        status:
          "ACTIVE",
      },
  
      include: [
        {
          model:
            db.ProductVariantPrice,
  
          as:
            "prices",
  
          required:
            false,
  
          where: {
            companyId,
  
            isActive:
              true,
  
            ...(priceListId
              ? {
                  priceListId,
                }
              : {}),
  
            ...validityWindow(
              now
            ),
          },
  
          include: [
            {
              model:
                db.PriceList,
  
              as:
                "priceList",
  
              required:
                false,
  
              attributes: [
                "id",
                "code",
                "name",
                "currencyCode",
                "isTaxInclusive",
                "channelCode",
              ],
            },
          ],
        },
      ],
    },
  ];

  /*
|--------------------------------------------------------------------------
| Cart Recommendation Product Includes
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Cart recommendation cards need only ONE selected product image.
|
| Product images are intentionally excluded from this main query because
| joining ProductImage -> MediaAsset -> MediaAssetVariant can create a very
| large Sequelize result graph.
|
| Images are loaded separately after the candidate products are hydrated.
|--------------------------------------------------------------------------
*/

const cartRecommendationProductIncludes =
({
  companyId,
  channel,
  priceListId,
  now,
}) => [
  {
    model:
      db.ProductChannel,

    as:
      "channels",

    required:
      true,

    where: {
      companyId,

      channelCode:
        channel,

      isVisible:
        true,

      publishStatus:
        "PUBLISHED",
    },

    attributes: [
      "channelCode",
      "channelTitle",
      "channelDescription",
    ],
  },

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
      "slug",
    ],
  },

  {
    model:
      db.Category,

    as:
      "primaryCategory",

    required:
      false,

    attributes: [
      "id",
      "name",
      "slug",
    ],
  },

  /*
   * ProductImage deliberately NOT included here.
   */

  {
    model:
      db.ProductVariant,

    as:
      "variants",

    required:
      true,

    where: {
      companyId,

      status:
        "ACTIVE",
    },

    include: [
      {
        model:
          db.ProductVariantPrice,

        as:
          "prices",

        required:
          false,

        where: {
          companyId,

          isActive:
            true,

          ...(priceListId
            ? {
                priceListId,
              }
            : {}),

          ...validityWindow(
            now
          ),
        },

        include: [
          {
            model:
              db.PriceList,

            as:
              "priceList",

            required:
              false,

            attributes: [
              "id",
              "code",
              "name",
              "currencyCode",
              "isTaxInclusive",
              "channelCode",
            ],
          },
        ],
      },
    ],
  },
];
  
  /*
  |--------------------------------------------------------------------------
  | Product Image
  |--------------------------------------------------------------------------
  */
  
  const productImage = (
    product,
    apiBaseUrl
  ) => {
    const images =
      Array.isArray(
        product.images
      )
        ? [
            ...product.images,
          ]
        : [];
  
    images.sort(
      (
        first,
        second
      ) => {
        const primary =
          (
            first.imageRole ===
            "PRIMARY"
              ? 0
              : 1
          ) -
          (
            second.imageRole ===
            "PRIMARY"
              ? 0
              : 1
          );
  
        return (
          primary ||
          Number(
            first.displayOrder ||
              0
          ) -
            Number(
              second.displayOrder ||
                0
            )
        );
      }
    );
  
    const selected =
      images.find(
        (
          image
        ) =>
          image.mediaAsset
      );
  
    if (!selected) {
      return null;
    }
  
    return {
      id:
        selected.id,
  
      imageRole:
        selected.imageRole,
  
      altText:
        selected.altText ||
        selected.mediaAsset
          ?.altText ||
        product.name,
  
      title:
        selected.title ||
        selected.mediaAsset
          ?.title ||
        null,
  
      mediaAsset:
        publicMedia(
          selected.mediaAsset,
          apiBaseUrl
        ),
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Default Variant
  |--------------------------------------------------------------------------
  */
  
  const defaultVariant = (
    product
  ) => {
    const variants =
      Array.isArray(
        product.variants
      )
        ? [
            ...product.variants,
          ]
        : [];
  
    variants.sort(
      (
        first,
        second
      ) => {
        const preferred =
          (
            first.isDefault
              ? 0
              : 1
          ) -
          (
            second.isDefault
              ? 0
              : 1
          );
  
        return (
          preferred ||
          Number(
            first.sortOrder ||
              0
          ) -
            Number(
              second.sortOrder ||
                0
            )
        );
      }
    );
  
    return (
      variants[0] ||
      null
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Price
  |--------------------------------------------------------------------------
  */
  
  const variantPrice = (
    variant
  ) => {
    const prices =
      Array.isArray(
        variant?.prices
      )
        ? [
            ...variant.prices,
          ]
        : [];
  
    prices.sort(
      (
        first,
        second
      ) =>
        Number(
          first.priority ||
            0
        ) -
        Number(
          second.priority ||
            0
        )
    );
  
    const price =
      prices[0];
  
    if (!price) {
      return null;
    }
  
    const number = (
      value
    ) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }
  
      const result =
        Number(
          value
        );
  
      return Number.isFinite(
        result
      )
        ? result
        : null;
    };
  
    return {
      id:
        price.id,
  
      priceListId:
        price.priceListId,
  
      currencyCode:
        price.priceList
          ?.currencyCode ||
        "AED",
  
      isTaxInclusive:
        price.priceList
          ?.isTaxInclusive !==
        false,
  
      sellingPrice:
        number(
          price.sellingPrice
        ),
  
      regularPrice:
        number(
          price.regularPrice
        ),
  
      compareAtPrice:
        number(
          price.compareAtPrice
        ),
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Apply Gift Voucher Discount To Public Price
  |--------------------------------------------------------------------------
  */

  const applyGiftVoucherToPrice = (
    price,
    giftVoucher
  ) => {
    if (!price) {
      return null;
    }

    const regularPrice =
      Number(
        price.regularPrice ||
          0
      );

    const baseSellingPrice =
      Number(
        price.sellingPrice ||
          0
      );

    const priceDiscountAmount =
      Math.max(
        0,
        regularPrice -
          baseSellingPrice
      );

    const giftVoucherDiscountAmount =
      giftVoucher
        ? Number(
            giftVoucher.unitDiscount ||
              0
          )
        : 0;

    const sellingPrice =
      Math.max(
        0,
        baseSellingPrice -
          giftVoucherDiscountAmount
      );

    const totalDiscountAmount =
      Math.max(
        0,
        regularPrice -
          sellingPrice
      );

    const totalDiscountPercent =
      regularPrice > 0
        ? (
            totalDiscountAmount /
            regularPrice
          ) * 100
        : 0;

    return {
      ...price,

      regularPrice:
        Number(
          regularPrice.toFixed(
            4
          )
        ),

      baseSellingPrice:
        Number(
          baseSellingPrice.toFixed(
            4
          )
        ),

      priceDiscountAmount:
        Number(
          priceDiscountAmount.toFixed(
            4
          )
        ),

      giftVoucherDiscountAmount:
        Number(
          giftVoucherDiscountAmount.toFixed(
            4
          )
        ),

      sellingPrice:
        Number(
          sellingPrice.toFixed(
            4
          )
        ),

      totalDiscountAmount:
        Number(
          totalDiscountAmount.toFixed(
            4
          )
        ),

      totalDiscountPercent:
        Number(
          totalDiscountPercent.toFixed(
            4
          )
        ),

      giftVoucher:
        giftVoucher
          ? {
              promotionId:
                giftVoucher.id,

              code:
                giftVoucher.code,

              name:
                giftVoucher.name,

              discountType:
                giftVoucher.discountType,

              discountValue:
                giftVoucher.discountValue,

              discountAmount:
                Number(
                  giftVoucherDiscountAmount.toFixed(
                    4
                  )
                ),

              validFrom:
                giftVoucher.validFrom,

              validUntil:
                giftVoucher.validUntil,
            }
          : null,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Public Product
  |--------------------------------------------------------------------------
  */
  
  const publicProduct = (
    productModel,
    apiBaseUrl,
    availabilityByVariant
  ) => {
    const product =
      toPlain(
        productModel
      );
  
    const variant =
      defaultVariant(
        product
      );
  
    const channel =
      Array.isArray(
        product.channels
      )
        ? product.channels[0]
        : null;
  
    return {
      id:
        product.id,
  
      name:
        channel?.channelTitle ||
        product.name,
  
      slug:
        product.slug,
  
      productType:
        product.productType,
  
      parentSku:
        product.parentSku ||
        null,
  
      shortDescription:
        channel?.channelDescription ||
        product.shortDescription ||
        null,
  
      isFeatured:
        product.isFeatured ===
        true,
  
      isDirectDelivery:
        product.isDirectDelivery ===
        true,
  
      taxPercent:
        Number(
          product.taxPercent ||
            0
        ),
  
      brand:
        product.brand
          ? {
              id:
                product.brand.id,
  
              name:
                product.brand.name,
  
              slug:
                product.brand.slug ||
                null,
            }
          : null,
  
      primaryCategory:
        product.primaryCategory
          ? {
              id:
                product.primaryCategory.id,
  
              name:
                product.primaryCategory
                  .name,
  
              slug:
                product.primaryCategory
                  .slug ||
                null,
            }
          : null,
  
      image:
        productImage(
          product,
          apiBaseUrl
        ),
  
      defaultVariant:
        variant
          ? {
              id:
                variant.id,
  
              sku:
                variant.sku,
  
              barcode:
                variant.barcode ||
                null,
  
              name:
                variant.name,
  
              isDefault:
                variant.isDefault ===
                true,
            }
          : null,
  
      price:
        variantPrice(
          variant
        ),
  
      availability:
        publicAvailabilityService
          .getAvailabilityForProduct({
            product,
  
            availabilityByVariant,
          }),
  
      productUrl:
        `/products/${product.slug}`,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Main Recommendation Service
  |--------------------------------------------------------------------------
  */
  
  const getPublicRecommendations =
    async ({
      companyCode,
      visitorId,
      customerId = null,
      channel =
        "WEBSITE",
      limit =
        18,
      apiBaseUrl,
    }) => {
      const now =
        new Date();
  
      const normalizedChannel =
        String(
          channel ||
            "WEBSITE"
        )
          .trim()
          .toUpperCase();
  
      if (
        ![
          "WEBSITE",
          "KIOSK",
        ].includes(
          normalizedChannel
        )
      ) {
        throw new AppError(
          "Channel must be WEBSITE or KIOSK.",
          400,
          "INVALID_STOREFRONT_CHANNEL"
        );
      }
  
      const company =
        await getCompany(
          companyCode
        );
  
      const normalizedVisitorId =
        visitorId
          ? String(
              visitorId
            )
              .trim()
              .slice(
                0,
                120
              )
          : null;
  
      if (
        !customerId &&
        !normalizedVisitorId
      ) {
        throw new AppError(
          "visitorId or customerId is required.",
          400,
          "RECOMMENDATION_IDENTITY_REQUIRED"
        );
      }
  
      const requestedLimit =
        Math.min(
          Math.max(
            Number(
              limit ||
                18
            ),
            1
          ),
          48
        );
  
      /*
      |--------------------------------------------------------------------------
      | Load Activity
      |--------------------------------------------------------------------------
      */
  
      const activityWhere = {
        companyId:
          company.id,
      };
  
      if (
        customerId
      ) {
        activityWhere.customerId =
          customerId;
      } else {
        activityWhere.visitorId =
          normalizedVisitorId;
      }
  
      const activityModels =
        await db.StorefrontActivity.findAll({
          where:
            activityWhere,
  
          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
  
          limit:
            300,
        });
  
      const activities =
        activityModels.map(
          toPlain
        );
  
      /*
      |--------------------------------------------------------------------------
      | Preference Scores
      |--------------------------------------------------------------------------
      */
  
      const productScores =
        new Map();
  
      const brandScores =
        new Map();
  
      const categoryScores =
        new Map();
  
      const collectionScores =
        new Map();
  
      const searchScores =
        new Map();
  
      for (
        const activity of
        activities
      ) {
        const activityWeight =
          ACTIVITY_WEIGHTS[
            activity.activityType
          ] ||
          1;
  
        const recencyMultiplier =
          getRecencyMultiplier(
            activity.createdAt
          );
  
        const score =
          activityWeight *
          recencyMultiplier;
  
        addScore(
          productScores,
          activity.productId,
          score
        );
  
        addScore(
          brandScores,
          activity.brandId,
          score
        );
  
        addScore(
          categoryScores,
          activity.categoryId,
          score
        );
  
        addScore(
          collectionScores,
          activity.collectionId,
          score
        );
  
        if (
          activity.activityType ===
            "SEARCH" &&
          activity.searchQuery
        ) {
          const search =
            String(
              activity.searchQuery
            )
              .trim()
              .toLowerCase();
  
          if (search) {
            addScore(
              searchScores,
              search,
              score
            );
          }
        }
      }
  
      /*
      |--------------------------------------------------------------------------
      | Collection → Product Preference
      |--------------------------------------------------------------------------
      */
  
      const collectionIds =
        Array.from(
          collectionScores.keys()
        );
  
      const collectionProductScores =
        new Map();
  
      if (
        collectionIds.length &&
        db.ProductCollection
      ) {
        const assignments =
          await db.ProductCollection.findAll({
            where: {
              companyId:
                company.id,
  
              collectionId: {
                [Op.in]:
                  collectionIds,
              },
            },
  
            attributes: [
              "productId",
              "collectionId",
            ],
  
            raw:
              true,
          });
  
        for (
          const assignment of
          assignments
        ) {
          const score =
            collectionScores.get(
              assignment.collectionId
            ) ||
            0;
  
          addScore(
            collectionProductScores,
            assignment.productId,
            score
          );
        }
      }
  
      /*
      |--------------------------------------------------------------------------
      | Resolve Price List
      |--------------------------------------------------------------------------
      */
  
      const priceListModel =
        await findPriceList({
          companyId:
            company.id,
  
          channel:
            normalizedChannel,
  
          now,
        });
  
      const priceList =
        priceListModel
          ? toPlain(
              priceListModel
            )
          : null;
  
      /*
      |--------------------------------------------------------------------------
      | Build Candidate Query
      |--------------------------------------------------------------------------
      */
  
      const preferredProductIds =
        Array.from(
          productScores.keys()
        );
  
      const preferredBrandIds =
        Array.from(
          brandScores.keys()
        );
  
      const preferredCategoryIds =
        Array.from(
          categoryScores.keys()
        );
  
      const collectionProductIds =
        Array.from(
          collectionProductScores.keys()
        );
  
      const topSearchQueries =
        Array.from(
          searchScores.entries()
        )
          .sort(
            (
              first,
              second
            ) =>
              second[1] -
              first[1]
          )
          .slice(
            0,
            8
          )
          .map(
            (
              [
                query,
              ]
            ) =>
              query
          );
  
      const recommendationConditions =
        [];
  
      if (
        preferredProductIds.length
      ) {
        recommendationConditions.push({
          id: {
            [Op.in]:
              preferredProductIds,
          },
        });
      }
  
      if (
        preferredBrandIds.length
      ) {
        recommendationConditions.push({
          brandId: {
            [Op.in]:
              preferredBrandIds,
          },
        });
      }
  
      if (
        preferredCategoryIds.length
      ) {
        recommendationConditions.push({
          primaryCategoryId: {
            [Op.in]:
              preferredCategoryIds,
          },
        });
      }
  
      if (
        collectionProductIds.length
      ) {
        recommendationConditions.push({
          id: {
            [Op.in]:
              collectionProductIds,
          },
        });
      }
  
      for (
        const searchQuery of
        topSearchQueries
      ) {
        recommendationConditions.push({
          [Op.or]: [
            {
              name: {
                [Op.iLike]:
                  `%${searchQuery}%`,
              },
            },
  
            {
              parentSku: {
                [Op.iLike]:
                  `%${searchQuery}%`,
              },
            },
  
            {
              shortDescription: {
                [Op.iLike]:
                  `%${searchQuery}%`,
              },
            },
          ],
        });
      }
  
      const productWhere = {
        companyId:
          company.id,
  
        status:
          "ACTIVE",
  
        isSearchable:
          true,
  
        ...(recommendationConditions.length
          ? {
              [Op.or]:
                recommendationConditions,
            }
          : {}),
      };
  
      /*
      |--------------------------------------------------------------------------
      | Candidate Products
      |--------------------------------------------------------------------------
      */
  
      let productModels =
        await db.Product.findAll({
          where:
            productWhere,
  
          include:
            cartRecommendationProductIncludes({
              companyId:
                company.id,
  
              channel:
                normalizedChannel,
  
              priceListId:
                priceList?.id ||
                null,
  
              now,
            }),
  
          order: [
            [
              "isFeatured",
              "DESC",
            ],
  
            [
              "createdAt",
              "DESC",
            ],
  
            [
              {
                model:
                  db.ProductVariant,
  
                as:
                  "variants",
              },
  
              "sortOrder",
              "ASC",
            ],
          ],
  
          limit:
            48,
  
          distinct:
            true,
        });
  
      /*
      |--------------------------------------------------------------------------
      | Fallback
      |--------------------------------------------------------------------------
      |
      | New visitors may not yet have useful history.
      |
      |--------------------------------------------------------------------------
      */
  
      if (
        !productModels.length
      ) {
        productModels =
          await db.Product.findAll({
            where: {
              companyId:
                company.id,
  
              status:
                "ACTIVE",
  
              isSearchable:
                true,
            },
  
            include:
              cartRecommendationProductIncludes({
                companyId:
                  company.id,
  
                channel:
                  normalizedChannel,
  
                priceListId:
                  priceList?.id ||
                  null,
  
                now,
              }),
  
            order: [
              [
                "isFeatured",
                "DESC",
              ],
  
              [
                "createdAt",
                "DESC",
              ],
  
              [
                {
                  model:
                    db.ProductVariant,
  
                  as:
                    "variants",
                },
  
                "sortOrder",
                "ASC",
              ],
            ],
  
            limit:
              48,
  
            distinct:
              true,
          });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Availability
      |--------------------------------------------------------------------------
      */
  
      const recommendationProductIds =
  productModels.map(
    (model) =>
      model.id
  );

const recommendationImageRows =
  recommendationProductIds.length
    ? await db.ProductImage.findAll({
        where: {
          companyId:
            company.id,

          productId: {
            [Op.in]:
              recommendationProductIds,
          },

          isActive:
            true,
        },

        attributes: [
          "id",
          "productId",
          "mediaAssetId",
          "imageRole",
          "displayOrder",
          "altText",
          "title",
        ],

        order: [
          [
            "productId",
            "ASC",
          ],
          [
            "displayOrder",
            "ASC",
          ],
        ],

        raw:
          true,
      })
    : [];

/*
 * Select one image per product.
 * PRIMARY wins; otherwise the lowest displayOrder wins.
 */
const selectedImageByProduct =
  new Map();

for (
  const image of
  recommendationImageRows
) {
  const productId =
    String(
      image.productId
    );

  const existing =
    selectedImageByProduct.get(
      productId
    );

  if (!existing) {
    selectedImageByProduct.set(
      productId,
      image
    );
    continue;
  }

  const existingPrimary =
    existing.imageRole ===
    "PRIMARY";

  const imagePrimary =
    image.imageRole ===
    "PRIMARY";

  if (
    imagePrimary &&
    !existingPrimary
  ) {
    selectedImageByProduct.set(
      productId,
      image
    );
    continue;
  }

  if (
    imagePrimary ===
      existingPrimary &&
    Number(
      image.displayOrder ||
        0
    ) <
      Number(
        existing.displayOrder ||
          0
      )
  ) {
    selectedImageByProduct.set(
      productId,
      image
    );
  }
}

const selectedMediaAssetIds =
  Array.from(
    new Set(
      Array.from(
        selectedImageByProduct.values()
      )
        .map(
          (image) =>
            image.mediaAssetId
        )
        .filter(
          Boolean
        )
    )
  );

/*
 * Load only the selected MediaAsset rows.
 * Do not join MediaAssetVariant here.
 */
const selectedMediaAssets =
  selectedMediaAssetIds.length
    ? await db.MediaAsset.findAll({
        where: {
          companyId:
            company.id,

          id: {
            [Op.in]:
              selectedMediaAssetIds,
          },

          status:
            "READY",

          isPublic:
            true,

          isActive:
            true,
        },

        raw:
          true,
      })
    : [];

/*
 * Load variants separately as plain rows, then group by MediaAsset.
 */
const selectedMediaVariantRows =
  selectedMediaAssetIds.length
    ? await db.MediaAssetVariant.findAll({
        where: {
          companyId:
            company.id,

          mediaAssetId: {
            [Op.in]:
              selectedMediaAssetIds,
          },

          isActive:
            true,
        },

        raw:
          true,
      })
    : [];

const mediaVariantsByAsset =
  new Map();

for (
  const variant of
  selectedMediaVariantRows
) {
  const assetId =
    String(
      variant.mediaAssetId
    );

  if (
    !mediaVariantsByAsset.has(
      assetId
    )
  ) {
    mediaVariantsByAsset.set(
      assetId,
      []
    );
  }

  mediaVariantsByAsset.get(
    assetId
  ).push(
    variant
  );
}

const selectedMediaMap =
  new Map(
    selectedMediaAssets.map(
      (asset) => [
        String(
          asset.id
        ),
        {
          ...asset,
          variants:
            mediaVariantsByAsset.get(
              String(
                asset.id
              )
            ) ||
            [],
        },
      ]
    )
  );

/*
 * Attach exactly one image to each Sequelize Product model so the existing
 * publicProduct() -> productImage() pipeline remains unchanged.
 */
for (
  const candidateModel of
  productModels
) {
  const image =
    selectedImageByProduct.get(
      String(
        candidateModel.id
      )
    );

  if (!image) {
    candidateModel.setDataValue(
      "images",
      []
    );
    continue;
  }

  const mediaAsset =
    image.mediaAssetId
      ? selectedMediaMap.get(
          String(
            image.mediaAssetId
          )
        ) ||
        null
      : null;

  candidateModel.setDataValue(
    "images",
    [
      {
        ...image,
        mediaAsset,
      },
    ]
  );
}

      const availabilityByVariant =
        await publicAvailabilityService
          .getVariantAvailabilityMap({
            companyId:
              company.id,
  
            products:
              productModels,
          });
  
      let publicProducts =
        publicAvailabilityService
          .filterAvailablePublicProducts(
            productModels.map(
              (
                model
              ) =>
                publicProduct(
                  model,
                  apiBaseUrl,
                  availabilityByVariant
                )
            )
          );

      /*
      |--------------------------------------------------------------------------
      | Gift Voucher Pricing
      |--------------------------------------------------------------------------
      */

      const giftVoucherItems =
        publicProducts
          .filter(
            (product) =>
              product.defaultVariant?.id &&
              product.price?.sellingPrice !== null &&
              product.price?.sellingPrice !== undefined
          )
          .map(
            (product) => ({
              productId:
                product.id,

              productVariantId:
                product.defaultVariant.id,

              sellingPrice:
                product.price.sellingPrice,

              quantity:
                1,
            })
          );

      const giftVoucherMap =
        await giftVoucherPromotionService
          .resolveApplicablePromotionsBatch({
            companyId:
              company.id,

            items:
              giftVoucherItems,

            channelCode:
              normalizedChannel,

            effectiveDate:
              now,
          });

      publicProducts =
        publicProducts.map(
          (product) => {
            if (
              !product.defaultVariant?.id ||
              !product.price
            ) {
              return product;
            }

            const key =
              `${product.id}:${product.defaultVariant.id}`;

            const giftVoucher =
              giftVoucherMap.get(
                key
              ) ||
              null;

            return {
              ...product,

              price:
                applyGiftVoucherToPrice(
                  product.price,
                  giftVoucher
                ),
            };
          }
        );
  
      /*
      |--------------------------------------------------------------------------
      | Score Candidates
      |--------------------------------------------------------------------------
      */
  
      const scoredProducts =
        publicProducts.map(
          (
            product
          ) => {
            let score =
              0;
  
            /*
             * Exact product interest.
             * Strongest signal.
             */
            score +=
              (
                productScores.get(
                  product.id
                ) ||
                0
              ) *
              3;
  
            /*
             * Brand preference.
             */
            if (
              product.brand?.id
            ) {
              score +=
                brandScores.get(
                  product.brand.id
                ) ||
                0;
            }
  
            /*
             * Category preference.
             */
            if (
              product.primaryCategory
                ?.id
            ) {
              score +=
                categoryScores.get(
                  product
                    .primaryCategory
                    .id
                ) ||
                0;
            }
  
            /*
             * Collection preference.
             */
            score +=
              collectionProductScores.get(
                product.id
              ) ||
              0;
  
            /*
             * Search intent.
             */
            const searchableText =
              [
                product.name,
                product.parentSku,
                product.shortDescription,
                product.brand?.name,
                product.primaryCategory
                  ?.name,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase();
  
            for (
              const [
                searchQuery,
                searchScore,
              ] of
              searchScores.entries()
            ) {
              if (
                searchableText.includes(
                  searchQuery
                )
              ) {
                score +=
                  searchScore *
                  1.5;
              }
            }
  
            /*
             * Small featured boost.
             */
            if (
              product.isFeatured
            ) {
              score +=
                0.5;
            }
  
            return {
              product,
  
              score,
            };
          }
        );
  
      scoredProducts.sort(
        (
          first,
          second
        ) =>
          second.score -
          first.score
      );
  
      const recommendedProducts =
        scoredProducts
          .slice(
            0,
            requestedLimit
          )
          .map(
            (
              item
            ) =>
              item.product
          );
  
      /*
      |--------------------------------------------------------------------------
      | Top Preference Summary
      |--------------------------------------------------------------------------
      */
  
      const topBrands =
        Array.from(
          brandScores.entries()
        )
          .sort(
            (
              first,
              second
            ) =>
              second[1] -
              first[1]
          )
          .slice(
            0,
            5
          )
          .map(
            (
              [
                id,
                score,
              ]
            ) => ({
              id,
              score:
                Number(
                  score.toFixed(
                    2
                  )
                ),
            })
          );
  
      const topCategories =
        Array.from(
          categoryScores.entries()
        )
          .sort(
            (
              first,
              second
            ) =>
              second[1] -
              first[1]
          )
          .slice(
            0,
            5
          )
          .map(
            (
              [
                id,
                score,
              ]
            ) => ({
              id,
              score:
                Number(
                  score.toFixed(
                    2
                  )
                ),
            })
          );
  
      const topSearches =
        Array.from(
          searchScores.entries()
        )
          .sort(
            (
              first,
              second
            ) =>
              second[1] -
              first[1]
          )
          .slice(
            0,
            5
          )
          .map(
            (
              [
                query,
                score,
              ]
            ) => ({
              query,
              score:
                Number(
                  score.toFixed(
                    2
                  )
                ),
            })
          );
  
      return {
        products:
          recommendedProducts,
  
        personalization: {
          hasHistory:
            activities.length >
            0,
  
          activityCount:
            activities.length,
  
          topBrands,
  
          topCategories,
  
          topSearches,
        },
  
        meta: {
          channel:
            normalizedChannel,
  
          visitorId:
            normalizedVisitorId,
  
          customerId:
            customerId ||
            null,
  
          generatedAt:
            new Date()
              .toISOString(),
        },
      };
    };
  

  /*
  |--------------------------------------------------------------------------
  | Automatic Cart Recommendations
  |--------------------------------------------------------------------------
  |
  | No manual product mapping is required.
  |
  | Ranking:
  | - same category: strongest signal
  | - same brand
  | - express delivery
  | - discount
  | - featured
  |
  | Products already in the cart and unavailable products are excluded.
  |--------------------------------------------------------------------------
  */

  //here
  const getCartRecommendations =
    async ({
      companyCode,
      productIds = [],
      channel = "WEBSITE",
      limit = 12,
      apiBaseUrl,
    }) => {
      const now =
        new Date();

      const normalizedChannel =
        String(
          channel ||
            "WEBSITE"
        )
          .trim()
          .toUpperCase();

      if (
        ![
          "WEBSITE",
          "KIOSK",
        ].includes(
          normalizedChannel
        )
      ) {
        throw new AppError(
          "Channel must be WEBSITE or KIOSK.",
          400,
          "INVALID_STOREFRONT_CHANNEL"
        );
      }

      const normalizedProductIds =
        Array.from(
          new Set(
            (
              Array.isArray(
                productIds
              )
                ? productIds
                : []
            )
              .map(
                (value) =>
                  String(
                    value ||
                      ""
                  ).trim()
              )
              .filter(
                Boolean
              )
          )
        ).slice(
          0,
          50
        );

      if (
        !normalizedProductIds
          .length
      ) {
        return {
          suggestions:
            [],
          meta: {
            source:
              "AUTOMATIC_CART",
            candidateCount:
              0,
          },
        };
      }

      const company =
        await getCompany(
          companyCode
        );

      const requestedLimit =
        Math.min(
          Math.max(
            Number(
              limit ||
                12
            ),
            1
          ),
          24
        );

      const priceList =
        await findPriceList({
          companyId:
            company.id,
          channel:
            normalizedChannel,
          now,
        });

      /*
       * Load only the cart context needed for scoring.
       */
      const cartProducts =
        await db.Product.findAll({
          where: {
            companyId:
              company.id,
            id: {
              [Op.in]:
                normalizedProductIds,
            },
          },

          attributes: [
            "id",
            "brandId",
            "primaryCategoryId",
          ],
        });

      const cartBrandIds =
        new Set(
          cartProducts
            .map(
              (product) =>
                product.brandId
            )
            .filter(
              Boolean
            )
        );

      const cartCategoryIds =
        new Set(
          cartProducts
            .map(
              (product) =>
                product
                  .primaryCategoryId
            )
            .filter(
              Boolean
            )
        );

      const relevanceConditions =
        [];

      if (
        cartCategoryIds.size
      ) {
        relevanceConditions.push({
          primaryCategoryId: {
            [Op.in]:
              Array.from(
                cartCategoryIds
              ),
          },
        });
      }

      if (
        cartBrandIds.size
      ) {
        relevanceConditions.push({
          brandId: {
            [Op.in]:
              Array.from(
                cartBrandIds
              ),
          },
        });
      }

      const candidateWhere = {
        companyId:
          company.id,

        status:
          "ACTIVE",

        isSearchable:
          true,

        id: {
          [Op.notIn]:
            normalizedProductIds,
        },

        ...(relevanceConditions.length
          ? {
              [Op.or]:
                relevanceConditions,
            }
          : {}),
      };

      /*
|--------------------------------------------------------------------------
| Phase 1 — Lightweight Cart Recommendation Candidates
|--------------------------------------------------------------------------
|
| Do NOT fully hydrate images/media/variants/prices for the complete
| candidate pool.
|
| At this stage we only need enough information to rank likely candidates.
|--------------------------------------------------------------------------
*/

const lightweightCandidateLimit =
Math.min(
  Math.max(
    requestedLimit * 8,
    30
  ),
  60
);

let lightweightCandidates =
await db.Product.findAll({
  where:
    candidateWhere,

  attributes: [
    "id",
    "brandId",
    "primaryCategoryId",
    "isFeatured",
    "expressDeliveryEnabled",
    "createdAt",
  ],

  order: [
    [
      "isFeatured",
      "DESC",
    ],
    [
      "createdAt",
      "DESC",
    ],
  ],

  limit:
    lightweightCandidateLimit,

  raw:
    true,
});

/*
* If category/brand matching is too narrow,
* supplement using lightweight catalogue rows.
*/

if (
lightweightCandidates.length <
requestedLimit
) {
const fallbackRows =
  await db.Product.findAll({
    where: {
      companyId:
        company.id,

      status:
        "ACTIVE",

      isSearchable:
        true,

      id: {
        [Op.notIn]:
          normalizedProductIds,
      },
    },

    attributes: [
      "id",
      "brandId",
      "primaryCategoryId",
      "isFeatured",
      "expressDeliveryEnabled",
      "createdAt",
    ],

    order: [
      [
        "isFeatured",
        "DESC",
      ],
      [
        "createdAt",
        "DESC",
      ],
    ],

    limit:
      lightweightCandidateLimit,

    raw:
      true,
  });

const merged =
  new Map();

for (
  const candidate of
  [
    ...lightweightCandidates,
    ...fallbackRows,
  ]
) {
  merged.set(
    String(
      candidate.id
    ),
    candidate
  );
}

lightweightCandidates =
  Array.from(
    merged.values()
  );
}

/*
|--------------------------------------------------------------------------
| Lightweight Ranking
|--------------------------------------------------------------------------
|
| Rank using information that does not require product-card hydration.
|
| Category and brand matching carry the majority of the existing score.
| Featured and express-delivery status are also available directly on
| Product.
|--------------------------------------------------------------------------
*/

const lightweightScored =
lightweightCandidates
  .map(
    (
      candidate
    ) => {
      let score =
        0;

      if (
        candidate.primaryCategoryId &&
        cartCategoryIds.has(
          candidate.primaryCategoryId
        )
      ) {
        score +=
          70;
      }

      if (
        candidate.brandId &&
        cartBrandIds.has(
          candidate.brandId
        )
      ) {
        score +=
          25;
      }

      if (
        candidate.isFeatured ===
        true
      ) {
        score +=
          10;
      }

      if (
        candidate.expressDeliveryEnabled ===
        true
      ) {
        score +=
          20;
      }

      return {
        id:
          candidate.id,

        score,

        createdAt:
          candidate.createdAt,
      };
    }
  )
  .sort(
    (
      first,
      second
    ) => {
      const scoreDifference =
        second.score -
        first.score;

      if (
        scoreDifference !==
        0
      ) {
        return scoreDifference;
      }

      return (
        new Date(
          second.createdAt ||
            0
        ).getTime() -
        new Date(
          first.createdAt ||
            0
        ).getTime()
      );
    }
  );

/*
* Hydrate a small pool rather than the complete catalogue candidate set.
*
* Keep more than requestedLimit because some candidates can disappear
* after channel-publication, pricing or availability checks.
*/

const hydrationBatchSize =
Math.min(
  Math.max(
    requestedLimit * 2,
    12
  ),
  20
);

const hydrationIds =
lightweightScored
  .map(
    (
      item
    ) =>
      item.id
  );

/*
|--------------------------------------------------------------------------
| Phase 2 — Hydrate Ranked Candidates In Small Batches
|--------------------------------------------------------------------------
|
| Walk the ranked lightweight candidates in small batches. This avoids
| hydrating the whole candidate pool at once while still allowing the service
| to continue past out-of-stock candidates until enough sellable products
| have been collected.
|--------------------------------------------------------------------------
*/

let publicProducts =
  [];

for (
  let offset = 0;
  offset < hydrationIds.length &&
  publicProducts.length < requestedLimit;
  offset += hydrationBatchSize
) {
  const batchIds =
    hydrationIds.slice(
      offset,
      offset +
        hydrationBatchSize
    );

  if (!batchIds.length) {
    break;
  }

  let batchModels =
    await db.Product.findAll({
      where: {
        companyId:
          company.id,

        id: {
          [Op.in]:
            batchIds,
        },

        status:
          "ACTIVE",

        isSearchable:
          true,
      },

      include:
        cartRecommendationProductIncludes({
          companyId:
            company.id,

          channel:
            normalizedChannel,

          priceListId:
            priceList?.id ||
            null,

          now,
        }),

      distinct:
        true,
    });

  /*
   * Restore the lightweight ranking order after Sequelize hydration.
   */

  const batchOrder =
    new Map(
      batchIds.map(
        (
          id,
          index
        ) => [
          String(
            id
          ),
          index,
        ]
      )
    );

  batchModels.sort(
    (
      first,
      second
    ) =>
      (
        batchOrder.get(
          String(
            first.id
          )
        ) ??
        Number.MAX_SAFE_INTEGER
      ) -
      (
        batchOrder.get(
          String(
            second.id
          )
        ) ??
        Number.MAX_SAFE_INTEGER
      )
  );

  /*
   * Load one selected image per hydrated product.
   */

  const batchProductIds =
    batchModels.map(
      (model) =>
        model.id
    );

  const batchImageRows =
    batchProductIds.length
      ? await db.ProductImage.findAll({
          where: {
            companyId:
              company.id,

            productId: {
              [Op.in]:
                batchProductIds,
            },

            isActive:
              true,
          },

          attributes: [
            "id",
            "productId",
            "mediaAssetId",
            "imageRole",
            "displayOrder",
            "altText",
            "title",
          ],

          order: [
            [
              "productId",
              "ASC",
            ],
            [
              "displayOrder",
              "ASC",
            ],
          ],

          raw:
            true,
        })
      : [];

  const selectedImageByProduct =
    new Map();

  for (
    const image of
    batchImageRows
  ) {
    const productId =
      String(
        image.productId
      );

    const existing =
      selectedImageByProduct.get(
        productId
      );

    if (!existing) {
      selectedImageByProduct.set(
        productId,
        image
      );
      continue;
    }

    const existingPrimary =
      existing.imageRole ===
      "PRIMARY";

    const imagePrimary =
      image.imageRole ===
      "PRIMARY";

    if (
      imagePrimary &&
      !existingPrimary
    ) {
      selectedImageByProduct.set(
        productId,
        image
      );
      continue;
    }

    if (
      imagePrimary ===
        existingPrimary &&
      Number(
        image.displayOrder ||
          0
      ) <
        Number(
          existing.displayOrder ||
            0
        )
    ) {
      selectedImageByProduct.set(
        productId,
        image
      );
    }
  }

  const selectedMediaAssetIds =
    Array.from(
      new Set(
        Array.from(
          selectedImageByProduct.values()
        )
          .map(
            (image) =>
              image.mediaAssetId
          )
          .filter(
            Boolean
          )
      )
    );

  const selectedMediaAssets =
    selectedMediaAssetIds.length
      ? await db.MediaAsset.findAll({
          where: {
            companyId:
              company.id,

            id: {
              [Op.in]:
                selectedMediaAssetIds,
            },

            status:
              "READY",

            isPublic:
              true,

            isActive:
              true,
          },

          raw:
            true,
        })
      : [];

  const selectedMediaVariantRows =
    selectedMediaAssetIds.length
      ? await db.MediaAssetVariant.findAll({
          where: {
            companyId:
              company.id,

            mediaAssetId: {
              [Op.in]:
                selectedMediaAssetIds,
            },

            isActive:
              true,
          },

          raw:
            true,
        })
      : [];

  const mediaVariantsByAsset =
    new Map();

  for (
    const variant of
    selectedMediaVariantRows
  ) {
    const assetId =
      String(
        variant.mediaAssetId
      );

    if (
      !mediaVariantsByAsset.has(
        assetId
      )
    ) {
      mediaVariantsByAsset.set(
        assetId,
        []
      );
    }

    mediaVariantsByAsset.get(
      assetId
    ).push(
      variant
    );
  }

  const selectedMediaMap =
    new Map(
      selectedMediaAssets.map(
        (asset) => [
          String(
            asset.id
          ),
          {
            ...asset,

            variants:
              mediaVariantsByAsset.get(
                String(
                  asset.id
                )
              ) ||
              [],
          },
        ]
      )
    );

  for (
    const batchModel of
    batchModels
  ) {
    const image =
      selectedImageByProduct.get(
        String(
          batchModel.id
        )
      );

    if (!image) {
      batchModel.setDataValue(
        "images",
        []
      );
      continue;
    }

    const mediaAsset =
      image.mediaAssetId
        ? selectedMediaMap.get(
            String(
              image.mediaAssetId
            )
          ) ||
          null
        : null;

    batchModel.setDataValue(
      "images",
      [
        {
          ...image,
          mediaAsset,
        },
      ]
    );
  }

  const availabilityByVariant =
    await publicAvailabilityService
      .getVariantAvailabilityMap({
        companyId:
          company.id,

        products:
          batchModels,
      });

  const mappedBatchProducts =
    batchModels.map(
      (model) =>
        publicProduct(
          model,
          apiBaseUrl,
          availabilityByVariant
        )
    );

  const sellableBatchProducts =
    publicAvailabilityService
      .filterAvailablePublicProducts(
        mappedBatchProducts
      )
      .filter(
        (product) => {
          const availability =
            product.availability;

          return (
            availability?.status ===
              "AVAILABLE" &&
            (
              Number(
                availability?.quantity ||
                  0
              ) > 0 ||
              availability
                ?.alwaysAvailableForSale ===
                true
            )
          );
        }
      );

  publicProducts.push(
    ...sellableBatchProducts
  );
}

/*
 * Keep only the number requested. Ranking is preserved because batches and
 * products within each batch follow the Phase-1 lightweight score order.
 */

publicProducts =
  publicProducts.slice(
    0,
    requestedLimit
  );

      /*
      |--------------------------------------------------------------------------
      | Gift Voucher Pricing
      |--------------------------------------------------------------------------
      */

      const cartGiftVoucherItems =
        publicProducts
          .filter(
            (product) =>
              product.defaultVariant?.id &&
              product.price?.sellingPrice !== null &&
              product.price?.sellingPrice !== undefined
          )
          .map(
            (product) => ({
              productId:
                product.id,

              productVariantId:
                product.defaultVariant.id,

              sellingPrice:
                product.price.sellingPrice,

              quantity:
                1,
            })
          );

      const cartGiftVoucherMap =
        await giftVoucherPromotionService
          .resolveApplicablePromotionsBatch({
            companyId:
              company.id,

            items:
              cartGiftVoucherItems,

            channelCode:
              normalizedChannel,

            effectiveDate:
              now,
          });

      publicProducts =
        publicProducts.map(
          (product) => {
            if (
              !product.defaultVariant?.id ||
              !product.price
            ) {
              return product;
            }

            const key =
              `${product.id}:${product.defaultVariant.id}`;

            const giftVoucher =
              cartGiftVoucherMap.get(
                key
              ) ||
              null;

            return {
              ...product,

              price:
                applyGiftVoucherToPrice(
                  product.price,
                  giftVoucher
                ),
            };
          }
        );

      const scored =
        publicProducts
          .filter(
            (product) =>
              product
                .defaultVariant
                ?.id &&
              product.price
                ?.sellingPrice !=
                null
          )
          .map(
            (product) => {
              let score =
                0;

              if (
                product
                  .primaryCategory
                  ?.id &&
                cartCategoryIds.has(
                  product
                    .primaryCategory
                    .id
                )
              ) {
                score +=
                  70;
              }

              if (
                product.brand
                  ?.id &&
                cartBrandIds.has(
                  product.brand.id
                )
              ) {
                score +=
                  25;
              }

              if (
                product.isFeatured
              ) {
                score +=
                  10;
              }

              const sellingPrice =
                toNumber(
                  product.price
                    ?.sellingPrice
                );

              const compareAtPrice =
                toNumber(
                  product.price
                    ?.compareAtPrice
                );

              if (
                compareAtPrice >
                sellingPrice &&
                sellingPrice >
                0
              ) {
                score +=
                  15;
              }

              /*
               * Product fields are available on the original model even
               * though the compact public product object does not expose
               * every fulfillment field.
               */
              const sourceCandidate =
                lightweightCandidates.find(
                  (candidate) =>
                    String(
                      candidate.id
                    ) ===
                    String(
                      product.id
                    )
                );

              if (
                sourceCandidate
                  ?.expressDeliveryEnabled ===
                true
              ) {
                score +=
                  20;
              }

              return {
                product,
                score,
              };
            }
          )
          .sort(
            (
              first,
              second
            ) =>
              second.score -
              first.score
          )
          .slice(
            0,
            requestedLimit
          );

      const suggestions =
        scored.map(
          (
            item,
            index
          ) => ({
            ruleId:
              `AUTO_CART_${item.product.id}`,

            attachmentProductId:
              item.product.id,

            source:
              "AUTO",

            relationshipType:
              "CROSS_SELL",

            priority:
              100 -
              Math.min(
                item.score,
                99
              ),

            sortOrder:
              index,

            minimumQuantity:
              1,

            maximumQuantity:
              null,

            product: {
              ...item.product,

              /*
               * CartRecommendations already consumes the attachment
               * product shape where the selected variant is `variant`.
               */
              variant:
                item.product
                  .defaultVariant,
            },

            recommendationScore:
              item.score,
          })
        );

      return {
        suggestions,

        meta: {
          source:
            "AUTOMATIC_CART",

          cartProductCount:
            normalizedProductIds.length,

          candidateCount:
            publicProducts.length,

          returnedCount:
            suggestions.length,
        },
      };
    };

  module.exports = {
    getPublicRecommendations,
    getCartRecommendations,
  };