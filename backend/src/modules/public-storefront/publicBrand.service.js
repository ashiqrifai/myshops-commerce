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
  
          isActive:
            true,
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
        true,
  
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
  
      separate:
        true,

      order: [
        ["displayOrder", "ASC"],
        ["createdAt", "ASC"],
      ],

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
      
      {
        model:
          db.ProductVariantAttributeValue,

        as:
          "attributeValues",

        required:
          false,

        separate:
          true,

        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],

        attributes: [
          "id",
          "productVariantId",
          "attributeId",
          "optionId",
          "displayValue",
          "sortOrder",
        ],

        include: [
          {
            model:
              db.Attribute,

            as:
              "attribute",

            required:
              false,

            where: {
              companyId,
              isActive:
                true,
            },

            attributes: [
              "id",
              "code",
              "name",
              "isVariantDefining",
              "displayOrder",
            ],
          },

          {
            model:
              db.AttributeOption,

            as:
              "option",

            required:
              false,

            where: {
              companyId,
              isActive:
                true,
            },

            attributes: [
              "id",
              "label",
              "value",
              "swatchValue",
              "displayOrder",
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

const applyGiftVoucherToPrice =
(
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
    regularPrice >
    0
      ? (
          totalDiscountAmount /
          regularPrice
        ) *
        100
      : 0;

  return {
    ...price,

    /*
    |--------------------------------------------------------------------------
    | Regular Pricing
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Gift Voucher
    |--------------------------------------------------------------------------
    */

    giftVoucherDiscountAmount:
      Number(
        giftVoucherDiscountAmount.toFixed(
          4
        )
      ),

    /*
    |--------------------------------------------------------------------------
    | Final Customer Price
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Public GV Information
    |--------------------------------------------------------------------------
    */

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
  
  const buildVariantSummary = (
  product
) => {
  const variants =
    Array.isArray(
      product?.variants
    )
      ? product.variants
      : [];

  if (
    !variants.length
  ) {
    return {
      hasVariants:
        false,

      variantCount:
        0,

      selectorCount:
        0,

      selectors:
        [],
    };
  }

  const selectorMap =
    new Map();

  for (
    const variant of
    variants
  ) {
    const attributeValues =
      Array.isArray(
        variant.attributeValues
      )
        ? variant.attributeValues
        : [];

    for (
      const value of
      attributeValues
    ) {
      const attribute =
        value.attribute;

      if (
        !attribute ||
        attribute.isVariantDefining !==
          true
      ) {
        continue;
      }

      const attributeId =
        attribute.id ||
        value.attributeId;

      if (
        !attributeId
      ) {
        continue;
      }

      if (
        !selectorMap.has(
          attributeId
        )
      ) {
        selectorMap.set(
          attributeId,
          {
            id:
              attributeId,

            code:
              String(
                attribute.code ||
                  ""
              )
                .trim()
                .toUpperCase(),

            name:
              attribute.name ||
              "Option",

            displayOrder:
              Number(
                attribute.displayOrder ||
                  0
              ),

            optionsMap:
              new Map(),
          }
        );
      }

      const selector =
        selectorMap.get(
          attributeId
        );

      const option =
        value.option;

      const optionId =
        option?.id ||
        value.optionId ||
        value.displayValue ||
        null;

      if (
        !optionId ||
        selector.optionsMap.has(
          optionId
        )
      ) {
        continue;
      }

      selector.optionsMap.set(
        optionId,
        {
          id:
            optionId,

          label:
            option?.label ||
            value.displayValue ||
            option?.value ||
            "Option",

          swatchValue:
            option?.swatchValue ||
            null,

          displayOrder:
            Number(
              option?.displayOrder ||
                value.sortOrder ||
                0
            ),
        }
      );
    }
  }

  const selectors =
    Array.from(
      selectorMap.values()
    )
      .sort(
        (
          first,
          second
        ) =>
          first.displayOrder -
          second.displayOrder
      )
      .map(
        (
          selector
        ) => {
          const options =
            Array.from(
              selector.optionsMap
                .values()
            ).sort(
              (
                first,
                second
              ) =>
                first.displayOrder -
                second.displayOrder
            );

          const normalizedName =
            String(
              selector.name ||
                ""
            )
              .trim()
              .toLowerCase();

          const isColor =
            selector.code ===
              "COLOR" ||
            normalizedName ===
              "color" ||
            normalizedName ===
              "colour";

          return {
            id:
              selector.id,

            code:
              selector.code,

            name:
              selector.name,

            optionCount:
              options.length,

            options:
              isColor
                ? options.map(
                    (
                      option
                    ) => ({
                      id:
                        option.id,

                      label:
                        option.label,

                      swatchValue:
                        option.swatchValue,
                    })
                  )
                : [],
          };
        }
      );

  return {
    hasVariants:
      variants.length >
        1 &&
      selectors.length >
        0,

    variantCount:
      variants.length,

    selectorCount:
      selectors.length,

    selectors,
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
  
      variantSummary:
        buildVariantSummary(
          product
        ),

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
  
  const publicBrand = (
    brandModel,
    apiBaseUrl
  ) => {
    const brand =
      toPlain(
        brandModel
      );
  
    const logoAsset =
      publicMedia(
        brand.logoAsset,
        apiBaseUrl
      );
  
    const bannerAsset =
      publicMedia(
        brand.bannerAsset,
        apiBaseUrl
      );
  
    return {
      id:
        brand.id,
  
      name:
        brand.name,
  
      code:
        brand.code,
  
      slug:
        brand.slug,
  
      description:
        brand.description ||
        null,
  
      websiteUrl:
        brand.websiteUrl ||
        null,
  
      countryOfOrigin:
        brand.countryOfOrigin ||
        null,
  
      isFeatured:
        brand.isFeatured ===
        true,
  
      logoAsset,
      bannerAsset,
  
      image:
        bannerAsset ||
        logoAsset ||
        null,
  
      metaTitle:
        brand.metaTitle ||
        null,
  
      metaDescription:
        brand.metaDescription ||
        null,
  
      metaKeywords:
        brand.metaKeywords ||
        null,
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
  
  const sortProducts = (
    products,
    sort
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
  
      case "NEWEST":
        break;
  
      case "FEATURED":
      default:
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
    }
  
    return result;
  };
  
  const buildFilters = (
    products
  ) => {
    const categoryMap =
      new Map();
  
    products.forEach(
      (
        product
      ) => {
        const category =
          product.primaryCategory;
  
        if (!category) {
          return;
        }
  
        const current =
          categoryMap.get(
            category.id
          ) || {
            id:
              category.id,
  
            label:
              category.name,
  
            slug:
              category.slug,
  
            count:
              0,
          };
  
        current.count +=
          1;
  
        categoryMap.set(
          category.id,
          current
        );
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
  
  const getPublicBrands =
  async ({
    companyCode,
    channel =
      "WEBSITE",
    apiBaseUrl,
  }) => {
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

    const brandModels =
      await db.Brand.findAll({
        where: {
          companyId:
            company.id,

          isActive:
            true,
        },

        include: [
          mediaInclude(
            company.id,
            "logoAsset"
          ),

          mediaInclude(
            company.id,
            "bannerAsset"
          ),
        ],

        order: [
          [
            "isFeatured",
            "DESC",
          ],

          [
            "name",
            "ASC",
          ],
        ],
      });

    const brands =
      brandModels.map(
        (
          brand
        ) =>
          publicBrand(
            brand,
            apiBaseUrl
          )
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

      brands,

      meta: {
        channel:
          normalizedChannel,

        total:
          brands.length,

        generatedAt:
          new Date()
            .toISOString(),
      },
    };
  };


  const getPublicBrand =
    async ({
      companyCode,
      slug,
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
  
      const brand =
        await db.Brand.findOne({
          where: {
            companyId:
              company.id,
  
            slug:
              String(
                slug ||
                  ""
              )
                .trim()
                .toLowerCase(),
  
            isActive:
              true,
          },
  
          include: [
            mediaInclude(
              company.id,
              "logoAsset"
            ),
  
            mediaInclude(
              company.id,
              "bannerAsset"
            ),
          ],
        });
  
      if (!brand) {
        throw new AppError(
          "Brand was not found.",
          404,
          "PUBLIC_BRAND_NOT_FOUND"
        );
      }
  
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
  
      const categoryIds =
        csv(
          query.categoryIds ||
            query.categories
        );
  
      const search =
        String(
          query.search ||
            ""
        ).trim();
  
      const productModels =
        await db.Product.findAll({
          where: {
            companyId:
              company.id,
  
            brandId:
              brand.id,
  
            status:
              "ACTIVE",
  
            isSearchable:
              true,
  
            ...(categoryIds.length
              ? {
                  primaryCategoryId: {
                    [Op.in]:
                      categoryIds,
                  },
                }
              : {}),
  
            ...(search
              ? {
                  [Op.or]: [
                    {
                      name: {
                        [Op.iLike]:
                          `%${search}%`,
                      },
                    },
  
                    {
                      parentSku: {
                        [Op.iLike]:
                          `%${search}%`,
                      },
                    },
  
                    {
                      shortDescription: {
                        [Op.iLike]:
                          `%${search}%`,
                      },
                    },
                  ],
                }
              : {}),
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
                "isFeatured",
                "DESC",
              ],
            
              [
                "sortOrder",
                "ASC",
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
      | Resolve applicable Gift Voucher promotions before filters, price
      | filtering, sorting and pagination.
      |--------------------------------------------------------------------------
      */

      const giftVoucherItems =
        products
          .filter(
            (product) =>
              product.defaultVariant?.id &&
              product.price?.sellingPrice !== null &&
              product.price?.sellingPrice !== undefined
          )
          .map(
            (product) => ({
              productId: product.id,
              productVariantId: product.defaultVariant.id,
              sellingPrice: product.price.sellingPrice,
              quantity: 1,
            })
          );

      const giftVoucherMap =
        await giftVoucherPromotionService
          .resolveApplicablePromotionsBatch({
            companyId: company.id,
            items: giftVoucherItems,
            channelCode: normalizedChannel,
            effectiveDate: now,
          });

      products =
        products.map(
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
              giftVoucherMap.get(key) || null;

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
      | Filters
      |--------------------------------------------------------------------------
      */

      const filters =
        buildFilters(
          products
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
  
      const sort =
        String(
          query.sort ||
            "FEATURED"
        )
          .trim()
          .toUpperCase();
  
      products =
        sortProducts(
          products,
          sort
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
  
        brand:
          publicBrand(
            brand,
            apiBaseUrl
          ),
  
        breadcrumbs: [
          {
            label:
              "Home",
  
            url:
              "/",
          },
  
          {
            label:
              "Brands",
  
            url:
              "/brands",
          },
  
          {
            label:
              brand.name,
  
            url:
              `/brands/${brand.slug}`,
          },
        ],
  
        products:
          listedProducts,
  
        filters,
  
        sortOptions: [
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
            page > 1,
  
          hasNextPage:
            page <
            totalPages,
        },
  
        appliedFilters: {
          search:
            search ||
            null,
  
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
      getPublicBrands,
      getPublicBrand,
    };