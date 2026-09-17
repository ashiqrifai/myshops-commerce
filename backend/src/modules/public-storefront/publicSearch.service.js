const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../../models"
    );

const publicAvailabilityService =
  require(
    "./publicAvailability.service"
  );

const giftVoucherPromotionService =
  require(
    "../gift-voucher-promotions/giftVoucherPromotion.service"
  );


  
  const AppError =
    require(
      "../../utils/AppError"
    );
  
  const toPlain = (
    value
  ) =>
    value &&
    typeof value.get ===
      "function"
      ? value.get({
          plain: true,
        })
      : value;
  
  const absoluteUrl = (
    value,
    apiBaseUrl
  ) => {
    if (!value) {
      return null;
    }
  
    const url =
      String(value).trim();
  
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
      url.startsWith("/")
        ? url
        : `/${url}`;
  
    return base
      ? `${base}${path}`
      : path;
  };
  
  const publicMedia = (
    asset,
    apiBaseUrl
  ) => {
    if (!asset) {
      return null;
    }
  
    const item =
      toPlain(asset);
  
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
          isActive: true,
        },
      },
    ],
  });
  
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
            isActive: true,
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
        isActive: true,
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
        status: "ACTIVE",
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
        Number(value);
  
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
  if (
    !price
  ) {
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
        ) *
        100
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
        channel
          ?.channelTitle ||
        product.name,
  
      slug:
        product.slug,
  
      productType:
        product.productType,
  
      parentSku:
        product.parentSku ||
        null,
  
      shortDescription:
        channel
          ?.channelDescription ||
        product.shortDescription ||
        null,
  
      isFeatured:
        product.isFeatured ===
        true,
  


    delivery: {
      expressDeliveryEnabled:
        product.expressDeliveryEnabled ===
        true,

      expressDeliveryHours:
        product.expressDeliveryHours !==
          null &&
        product.expressDeliveryHours !==
          undefined
          ? Number(
              product.expressDeliveryHours
            )
          : null,

      deliveryMinDays:
        product.deliveryMinDays !==
          null &&
        product.deliveryMinDays !==
          undefined
          ? Number(
              product.deliveryMinDays
            )
          : null,

      deliveryMaxDays:
        product.deliveryMaxDays !==
          null &&
        product.deliveryMaxDays !==
          undefined
          ? Number(
              product.deliveryMaxDays
            )
          : null,

      deliveryNote:
        product.deliveryNote ||
        null,
    },

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
  
  const csv = (
    value
  ) =>
    String(
      value ||
        ""
    )
      .split(",")
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  
  const findMatchingProductIds =
    async ({
      companyId,
      search,
    }) => {
      if (!search) {
        return null;
      }
  
      const like =
        `%${search}%`;
  
      const [
        directProducts,
        variantRows,
        brands,
        categories,
      ] =
        await Promise.all([
          db.Product.findAll({
            where: {
              companyId,
  
              [Op.or]: [
                {
                  name: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  parentSku: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  shortDescription: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  description: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  slug: {
                    [Op.iLike]:
                      like,
                  },
                },
              ],
            },
  
            attributes: [
              "id",
            ],
  
            raw: true,
          }),
  
          db.ProductVariant.findAll({
            where: {
              companyId,
  
              [Op.or]: [
                {
                  sku: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  barcode: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  name: {
                    [Op.iLike]:
                      like,
                  },
                },
              ],
            },
  
            attributes: [
              "productId",
            ],
  
            raw: true,
          }),
  
          db.Brand.findAll({
            where: {
              companyId,
  
              [Op.or]: [
                {
                  name: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  code: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  slug: {
                    [Op.iLike]:
                      like,
                  },
                },
              ],
            },
  
            attributes: [
              "id",
            ],
  
            raw: true,
          }),
  
          db.Category.findAll({
            where: {
              companyId,
  
              [Op.or]: [
                {
                  name: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  slug: {
                    [Op.iLike]:
                      like,
                  },
                },
  
                {
                  categoryPath: {
                    [Op.iLike]:
                      like,
                  },
                },
              ],
            },
  
            attributes: [
              "id",
            ],
  
            raw: true,
          }),
        ]);
  
      const ids =
        new Set([
          ...directProducts.map(
            (
              row
            ) =>
              row.id
          ),
  
          ...variantRows.map(
            (
              row
            ) =>
              row.productId
          ),
        ]);
  
      const brandIds =
        brands.map(
          (
            brand
          ) =>
            brand.id
        );
  
      const categoryIds =
        categories.map(
          (
            category
          ) =>
            category.id
        );
      
  
      if (
        brandIds.length ||
        categoryIds.length
      ) {
        const relatedProducts =
          await db.Product.findAll({
            where: {
              companyId,
  
              [Op.or]: [
                ...(brandIds.length
                  ? [
                      {
                        brandId: {
                          [Op.in]:
                            brandIds,
                        },
                      },
                    ]
                  : []),
  
                ...(categoryIds.length
                  ? [
                      {
                        primaryCategoryId: {
                          [Op.in]:
                            categoryIds,
                        },
                      },
                    ]
                  : []),
              ],
            },
  
            attributes: [
              "id",
            ],
  
            raw: true,
          });
  
        relatedProducts.forEach(
          (
            row
          ) =>
            ids.add(
              row.id
            )
        );
  
        if (
          categoryIds.length &&
          db.ProductCategory
        ) {
          const assignments =
            await db.ProductCategory.findAll({
              where: {
                companyId,
  
                categoryId: {
                  [Op.in]:
                    categoryIds,
                },
              },
  
              attributes: [
                "productId",
              ],
  
              raw: true,
            });
  
          assignments.forEach(
            (
              row
            ) =>
              ids.add(
                row.productId
              )
          );
        }
      }
  
      return Array.from(
        ids
      );
    };
  
  const buildFilters = (
    products
  ) => {
    const brandMap =
      new Map();
  
    const categoryMap =
      new Map();
  
    products.forEach(
      (
        product
      ) => {
        if (
          product.brand
        ) {
          const current =
            brandMap.get(
              product.brand.id
            ) || {
              id:
                product.brand.id,
  
              label:
                product.brand.name,
  
              slug:
                product.brand.slug,
  
              count:
                0,
            };
  
          current.count +=
            1;
  
          brandMap.set(
            product.brand.id,
            current
          );
        }
  
        if (
          product.primaryCategory
        ) {
          const current =
            categoryMap.get(
              product.primaryCategory.id
            ) || {
              id:
                product.primaryCategory.id,
  
              label:
                product.primaryCategory.name,
  
              slug:
                product.primaryCategory.slug,
  
              count:
                0,
            };
  
          current.count +=
            1;
  
          categoryMap.set(
            product.primaryCategory.id,
            current
          );
        }
      }
    );
  
    const prices =
      products
        .map(
          (
            product
          ) =>
            Number(
              product.price
                ?.sellingPrice
            )
        )
        .filter(
          Number.isFinite
        );
  
    return [
      {
        code:
          "BRAND",
  
        label:
          "Brand",
  
        type:
          "MULTI_SELECT",
  
        options:
          Array.from(
            brandMap.values()
          ).sort(
            (
              first,
              second
            ) =>
              first.label.localeCompare(
                second.label
              )
          ),
      },
  
      {
        code:
          "CATEGORY",
  
        label:
          "Category",
  
        type:
          "MULTI_SELECT",
  
        options:
          Array.from(
            categoryMap.values()
          ).sort(
            (
              first,
              second
            ) =>
              first.label.localeCompare(
                second.label
              )
          ),
      },
  
      {
        code:
          "PRICE",
  
        label:
          "Price",
  
        type:
          "RANGE",
  
        minimum:
          prices.length
            ? Math.min(
                ...prices
              )
            : null,
  
        maximum:
          prices.length
            ? Math.max(
                ...prices
              )
            : null,
  
        currencyCode:
          products.find(
            (
              product
            ) =>
              product.price
                ?.currencyCode
          )?.price
            ?.currencyCode ||
          "AED",
      },
    ];
  };
  
  const relevanceScore = (
    product,
    search
  ) => {
    if (!search) {
      return 0;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Normalize Search
    |--------------------------------------------------------------------------
    */
  
    const normalized =
      String(search)
        .trim()
        .toLowerCase();
  
    const name =
      String(
        product.name ||
          ""
      )
        .trim()
        .toLowerCase();
  
    const sku =
      String(
        product.parentSku ||
          product.defaultVariant
            ?.sku ||
          ""
      )
        .trim()
        .toLowerCase();
  
    const barcode =
      String(
        product.defaultVariant
          ?.barcode ||
          ""
      )
        .trim()
        .toLowerCase();
  
    const brand =
      String(
        product.brand?.name ||
          ""
      )
        .trim()
        .toLowerCase();
  
    const category =
      String(
        product.primaryCategory
          ?.name ||
          ""
      )
        .trim()
        .toLowerCase();
  
    let score =
      0;
  
    /*
    |--------------------------------------------------------------------------
    | Accessory Intent
    |--------------------------------------------------------------------------
    |
    | If the CUSTOMER explicitly searches for an accessory, accessories should
    | rank first.
    |
    | Examples:
    |
    | iphone case
    | iphone cover
    | samsung charger
    | usb cable
    | screen protector
    |
    |--------------------------------------------------------------------------
    */
  
    const accessoryKeywords = [
      "accessory",
      "accessories",
  
      "case",
      "cover",
      "bumper",
  
      "protector",
      "screen protector",
      "tempered glass",
      "glass",
  
      "charger",
      "charging",
      "adapter",
      "adaptor",
  
      "cable",
      "usb",
      "type c",
      "type-c",
  
      "power bank",
      "powerbank",
  
      "magsafe",
  
      "holder",
      "mount",
      "stand",
  
      "sleeve",
      "pouch",
      "bag",
  
      "strap",
      "band",
  
      "earphone",
      "earphones",
  
      "headphone",
      "headphones",
    ];
  
    const hasAccessoryIntent =
      accessoryKeywords.some(
        (
          keyword
        ) =>
          normalized.includes(
            keyword
          )
      );
  
    /*
    |--------------------------------------------------------------------------
    | Determine Product Type
    |--------------------------------------------------------------------------
    */
  
    const accessoryCategoryKeywords = [
      "accessories",
      "accessory",
    ];
  
    const productLooksLikeAccessory =
      accessoryCategoryKeywords.some(
        (
          keyword
        ) =>
          category.includes(
            keyword
          )
      ) ||
      accessoryKeywords.some(
        (
          keyword
        ) =>
          name.includes(
            keyword
          )
      );
  
    /*
    |--------------------------------------------------------------------------
    | Device Categories
    |--------------------------------------------------------------------------
    |
    | These should rank above accessories when the customer is performing
    | a general product/device search.
    |--------------------------------------------------------------------------
    */
  
    const deviceCategoryKeywords = [
      "mobile",
      "mobiles",
      "phone",
      "phones",
      "smartphone",
  
      "laptop",
      "laptops",
  
      "tablet",
      "tablets",
  
      "wearable",
      "wearables",
  
      "smartwatch",
      "watch",
  
      "television",
      "tv",
  
      "gaming",
  
      "camera",
      "photo",
      "video",
  
      "audio",
  
      "small appliances",
      "large appliances",
      "appliances",
  
      "personal care",
    ];
  
    const productLooksLikeMainProduct =
      !productLooksLikeAccessory &&
      deviceCategoryKeywords.some(
        (
          keyword
        ) =>
          category.includes(
            keyword
          )
      );
  
    /*
    |--------------------------------------------------------------------------
    | Exact SKU / Barcode
    |--------------------------------------------------------------------------
    |
    | Exact SKU or barcode should always be extremely strong.
    |--------------------------------------------------------------------------
    */
  
    if (
      sku &&
      sku === normalized
    ) {
      score +=
        500;
    } else if (
      sku &&
      sku.includes(
        normalized
      )
    ) {
      score +=
        100;
    }
  
    if (
      barcode &&
      barcode === normalized
    ) {
      score +=
        500;
    } else if (
      barcode &&
      barcode.includes(
        normalized
      )
    ) {
      score +=
        100;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Product Name
    |--------------------------------------------------------------------------
    */
  
    if (
      name === normalized
    ) {
      score +=
        220;
    } else if (
      name.startsWith(
        `${normalized} `
      )
    ) {
      score +=
        150;
    } else if (
      name.includes(
        normalized
      )
    ) {
      score +=
        120;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Word Match
    |--------------------------------------------------------------------------
    |
    | Give products containing all search words an additional boost.
    |--------------------------------------------------------------------------
    */
  
    const searchWords =
      normalized
        .split(/\s+/)
        .filter(Boolean);
  
    const matchingWords =
      searchWords.filter(
        (
          word
        ) =>
          name.includes(
            word
          )
      ).length;
  
    if (
      searchWords.length >
        0 &&
      matchingWords ===
        searchWords.length
    ) {
      score +=
        40;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Brand
    |--------------------------------------------------------------------------
    */
  
    if (
      brand === normalized
    ) {
      score +=
        80;
    } else if (
      brand.includes(
        normalized
      ) ||
      normalized.includes(
        brand
      )
    ) {
      score +=
        40;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */
  
    if (
      category ===
      normalized
    ) {
      score +=
        60;
    } else if (
      category.includes(
        normalized
      )
    ) {
      score +=
        30;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Main Product / Device Priority
    |--------------------------------------------------------------------------
    |
    | Generic searches:
    |
    | iphone
    | samsung
    | macbook
    | ipad
    |
    | should show the actual devices BEFORE compatible accessories.
    |--------------------------------------------------------------------------
    */
  
    if (
      !hasAccessoryIntent
    ) {
      if (
        productLooksLikeMainProduct
      ) {
        score +=
          150;
      }
  
      if (
        productLooksLikeAccessory
      ) {
        score -=
          140;
      }
    }
  
    /*
    |--------------------------------------------------------------------------
    | Explicit Accessory Searches
    |--------------------------------------------------------------------------
    |
    | If customer searches:
    |
    | iphone case
    | samsung charger
    | ipad cover
    |
    | reverse the behaviour and promote accessories.
    |--------------------------------------------------------------------------
    */
  
    if (
      hasAccessoryIntent &&
      productLooksLikeAccessory
    ) {
      score +=
        180;
    }
  
    /*
    |--------------------------------------------------------------------------
    | Featured
    |--------------------------------------------------------------------------
    |
    | Featured is only a small tie-breaker.
    |--------------------------------------------------------------------------
    */
  
    if (
      product.isFeatured
    ) {
      score +=
        5;
    }
  
    return score;
  };
  
  const sortProducts = (
    products,
    sort,
    search
  ) => {
    const result = [
      ...products,
    ];
  
    const price = (
      product
    ) => {
      const amount =
        Number(
          product.price
            ?.sellingPrice
        );
  
      return Number.isFinite(
        amount
      )
        ? amount
        : Number
            .POSITIVE_INFINITY;
    };
  
    switch (sort) {
      case "PRICE_LOW_TO_HIGH":
      case "PRICE_ASC":
        result.sort(
          (
            first,
            second
          ) =>
            price(first) -
            price(second)
        );
  
        break;
  
      case "PRICE_HIGH_TO_LOW":
      case "PRICE_DESC":
        result.sort(
          (
            first,
            second
          ) =>
            price(second) -
            price(first)
        );
  
        break;
  
      case "NAME_ASC":
        result.sort(
          (
            first,
            second
          ) =>
            first.name.localeCompare(
              second.name
            )
        );
  
        break;
  
      case "NAME_DESC":
        result.sort(
          (
            first,
            second
          ) =>
            second.name.localeCompare(
              first.name
            )
        );
  
        break;
  
      case "FEATURED":
        result.sort(
          (
            first,
            second
          ) =>
            Number(
              second.isFeatured
            ) -
            Number(
              first.isFeatured
            )
        );
  
        break;
  
      case "NEWEST":
        /*
         * Products are initially
         * loaded newest first.
         */
        break;
  
      case "RELEVANCE":
      default:
        result.sort(
          (
            first,
            second
          ) =>
            relevanceScore(
              second,
              search
            ) -
              relevanceScore(
                first,
                search
              ) ||
            Number(
              second.isFeatured
            ) -
              Number(
                first.isFeatured
              )
        );
    }
  
    return result;
  };
  
  const searchProducts =
    async ({
      companyCode,
      channel =
        "WEBSITE",
      query = {},
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
  
      const search =
        String(
          query.q ||
            ""
        ).trim();
      
        const quickSearch =
        String(
          query.quick ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "true";
      
      const quickLimit =
        Math.min(
          Math.max(
            Number(
              query.pageSize ||
                5
            ),
            1
          ),
          10
        );
  
      const brandIds =
        csv(
          query.brandIds ||
            query.brands
        );
  
      const categoryIds =
        csv(
          query.categoryIds ||
            query.categories
        );

        const featuredOnly =
        String(
          query.featured ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "true";
  
      const matchingProductIds =
        await findMatchingProductIds({
          companyId:
            company.id,
  
          search,
        });
  
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
| Header Quick Search
|--------------------------------------------------------------------------
|
| The header only needs a few suggestions.
|
| IMPORTANT:
| Do not hydrate every matching product and then slice to 5.
| Limit the candidate IDs first, then hydrate only those products.
|
| Normal search-page behaviour below remains unchanged.
|--------------------------------------------------------------------------
*/

if (
  quickSearch &&
  search &&
  Array.isArray(
    matchingProductIds
  )
) {
  if (
    !matchingProductIds.length
  ) {
    return {
      company: {
        id:
          company.id,

        name:
          company.name,

        code:
          company.code,

        currency:
          company.currency,
      },

      query:
        search,

      products:
        [],

      filters:
        [],

      sortOptions:
        [],

      pagination: {
        page:
          1,

        pageSize:
          quickLimit,

        totalItems:
          0,

        totalPages:
          0,

        hasPreviousPage:
          false,

        hasNextPage:
          false,
      },

      appliedFilters: {
        q:
          search,
      },

      resolvedPriceList:
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

              isTaxInclusive:
                priceList.isTaxInclusive,
            }
          : null,

      meta: {
        channel:
          normalizedChannel,

        quickSearch:
          true,

        generatedAt:
          new Date()
            .toISOString(),
      },
    };
  }

  /*
   * Keep a small candidate pool.
   *
   * We request more than the final limit because some products can later
   * disappear because of channel publication or stock availability.
   */

  const candidateLimit =
    Math.min(
      Math.max(
        quickLimit *
          3,
        quickLimit
      ),
      30
    );

  const quickCandidateIds =
    matchingProductIds.slice(
      0,
      candidateLimit
    );

  const quickProductModels =
    await db.Product.findAll({
      where: {
        companyId:
          company.id,

        id: {
          [Op.in]:
            quickCandidateIds,
        },

        status:
          "ACTIVE",

        isSearchable:
          true,
      },

      include:
        productIncludes({
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
          "createdAt",
          "DESC",
        ],
      ],

      distinct:
        true,
    });

  const quickAvailabilityByVariant =
    await publicAvailabilityService
      .getVariantAvailabilityMap({
        companyId:
          company.id,

        products:
          quickProductModels,
      });

  let quickProducts =
    publicAvailabilityService
      .filterAvailablePublicProducts(
        quickProductModels.map(
          (
            model
          ) =>
            publicProduct(
              model,
              apiBaseUrl,
              quickAvailabilityByVariant
            )
        )
      );

  /*
   * Preserve the same search relevance sorting used by the full search.
   */

  quickProducts =
    sortProducts(
      quickProducts,
      "RELEVANCE",
      search
    );

  /*
   * Apply Gift Voucher pricing only to the products that can actually
   * appear in the quick-search dropdown.
   */

  quickProducts =
    quickProducts.slice(
      0,
      quickLimit
    );

  const quickGiftVoucherItems =
    quickProducts
      .filter(
        (
          product
        ) =>
          product.defaultVariant
            ?.id &&
          product.price
            ?.sellingPrice !==
            null &&
          product.price
            ?.sellingPrice !==
            undefined
      )
      .map(
        (
          product
        ) => ({
          productId:
            product.id,

          productVariantId:
            product
              .defaultVariant
              .id,

          sellingPrice:
            product.price
              .sellingPrice,

          quantity:
            1,
        })
      );

  const quickGiftVoucherMap =
    await giftVoucherPromotionService
      .resolveApplicablePromotionsBatch({
        companyId:
          company.id,

        items:
          quickGiftVoucherItems,

        channelCode:
          normalizedChannel,

        effectiveDate:
          now,
      });

  quickProducts =
    quickProducts.map(
      (
        product
      ) => {
        if (
          !product
            .defaultVariant
            ?.id ||
          !product.price
        ) {
          return product;
        }

        const key =
          `${product.id}:${product.defaultVariant.id}`;

        const giftVoucher =
          quickGiftVoucherMap.get(
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

  return {
    company: {
      id:
        company.id,

      name:
        company.name,

      code:
        company.code,

      currency:
        company.currency,
    },

    query:
      search,

    products:
      quickProducts,

    filters:
      [],

    sortOptions:
      [],

    pagination: {
      page:
        1,

      pageSize:
        quickLimit,

      /*
       * Header autocomplete does not require an exact total.
       * Avoid doing additional heavy work merely for a dropdown.
       */
      totalItems:
        quickProducts.length,

      totalPages:
        quickProducts.length
          ? 1
          : 0,

      hasPreviousPage:
        false,

      hasNextPage:
        false,
    },

    appliedFilters: {
      q:
        search,
    },

    resolvedPriceList:
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

            isTaxInclusive:
              priceList.isTaxInclusive,
          }
        : null,

    meta: {
      channel:
        normalizedChannel,

      quickSearch:
        true,

      generatedAt:
        new Date()
          .toISOString(),
    },
  };
}
  
          const where = {
            companyId:
              company.id,
          
            status:
              "ACTIVE",
          
            isSearchable:
              true,
          
            ...(featuredOnly
              ? {
                  isFeatured:
                    true,
                }
              : {}),
          
            ...(matchingProductIds
              ? {
                  id: {
                    [Op.in]:
                      matchingProductIds,
                  },
                }
              : {}),
          
            ...(brandIds.length
              ? {
                  brandId: {
                    [Op.in]:
                      brandIds,
                  },
                }
              : {}),
          
            ...(categoryIds.length
              ? {
                  primaryCategoryId: {
                    [Op.in]:
                      categoryIds,
                  },
                }
              : {}),
          };
  
      const productModels =
        matchingProductIds &&
        !matchingProductIds.length
          ? []
          : await db.Product.findAll({
              where,
  
              include:
                productIncludes({
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
                  "createdAt",
                  "DESC",
                ],
  
                [
                  {
                    model:
                      db.ProductImage,
  
                    as:
                      "images",
                  },
  
                  "displayOrder",
                  "ASC",
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
  
              distinct:
                true,
            });
  
      const availabilityByVariant =
        await publicAvailabilityService
          .getVariantAvailabilityMap({
            companyId:
              company.id,

            products:
              productModels,
          });

          let products =
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
      |
      | Resolve all applicable Gift Voucher promotions in ONE batch and apply
      | them before price filtering, dynamic filters, sorting and pagination.
      |--------------------------------------------------------------------------
      */

      const giftVoucherItems =
        products
          .filter(
            (
              product
            ) =>
              product.defaultVariant?.id &&
              product.price?.sellingPrice !==
                null &&
              product.price?.sellingPrice !==
                undefined
          )
          .map(
            (
              product
            ) => ({
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

      products =
        products.map(
          (
            product
          ) => {
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


      const minPrice =
        query.minPrice !==
        undefined
          ? Number(
              query.minPrice
            )
          : null;
  
      const maxPrice =
        query.maxPrice !==
        undefined
          ? Number(
              query.maxPrice
            )
          : null;
  
      if (
        Number.isFinite(
          minPrice
        )
      ) {
        products =
          products.filter(
            (
              product
            ) =>
              Number(
                product.price
                  ?.sellingPrice
              ) >= minPrice
          );
      }
  
      if (
        Number.isFinite(
          maxPrice
        )
      ) {
        products =
          products.filter(
            (
              product
            ) =>
              Number(
                product.price
                  ?.sellingPrice
              ) <= maxPrice
          );
      }
  
      const filters =
        buildFilters(
          products
        );
  
      const sort =
        String(
          query.sort ||
            "RELEVANCE"
        )
          .trim()
          .toUpperCase();
  
      products =
        sortProducts(
          products,
          sort,
          search
        );
  
      const page =
        Math.max(
          Number(
            query.page ||
              1
          ),
          1
        );
  
      const pageSize =
        Math.min(
          Math.max(
            Number(
              query.pageSize ||
                24
            ),
            1
          ),
          100
        );
  
      const totalItems =
        products.length;
  
      const totalPages =
        Math.ceil(
          totalItems /
            pageSize
        );
  
      const listedProducts =
        products.slice(
          (page - 1) *
            pageSize,
  
          page *
            pageSize
        );
  
      return {
        company: {
          id:
            company.id,
  
          name:
            company.name,
  
          code:
            company.code,
  
          currency:
            company.currency,
        },
  
        query:
          search,
  
        products:
          listedProducts,
  
        filters,
  
        sortOptions: [
          {
            value:
              "RELEVANCE",
  
            label:
              "Most relevant",
          },
  
          {
            value:
              "FEATURED",
  
            label:
              "Featured",
          },
  
          {
            value:
              "NEWEST",
  
            label:
              "Newest",
          },
  
          {
            value:
              "PRICE_LOW_TO_HIGH",
  
            label:
              "Price: Low to High",
          },
  
          {
            value:
              "PRICE_HIGH_TO_LOW",
  
            label:
              "Price: High to Low",
          },
  
          {
            value:
              "NAME_ASC",
  
            label:
              "Name: A to Z",
          },
        ],
  
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
  
          hasPreviousPage:
            page >
            1,
  
          hasNextPage:
            page <
            totalPages,
        },
  
        appliedFilters: {
          q:
            search ||
            null,
          
          featured:
            featuredOnly,
  
          brandIds,
          categoryIds,
  
          minPrice:
            Number.isFinite(
              minPrice
            )
              ? minPrice
              : null,
  
          maxPrice:
            Number.isFinite(
              maxPrice
            )
              ? maxPrice
              : null,
  
          sort,
        },
  
        resolvedPriceList:
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
  
                isTaxInclusive:
                  priceList.isTaxInclusive,
              }
            : null,
  
        meta: {
          channel:
            normalizedChannel,
  
          generatedAt:
            new Date()
              .toISOString(),
        },
      };
    };
  
  module.exports = {
    searchProducts,
  };