const {
  Op,
} = require("sequelize");

const db = require(
  "../../models"
);

const asPlain = (
  model
) => {
  if (!model) {
    return null;
  }

  return typeof model.get ===
    "function"
    ? model.get({
        plain: true,
      })
    : model;
};

const normalizeSlug = (
  value
) =>
  String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

const absoluteUrl = (
  value,
  apiBaseUrl
) => {
  if (!value) {
    return null;
  }

  const url = String(value);

  if (
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  return `${apiBaseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

const buildMedia = (
  mediaAsset,
  apiBaseUrl
) => {
  const asset =
    asPlain(mediaAsset);

  if (!asset) {
    return null;
  }



  const variants =
    Array.isArray(
      asset.variants
    )
      ? asset.variants  
          .filter(
            (variant) =>
              variant &&
              variant.publicUrl
          )
          .map((variant) => ({
            id: variant.id,
            variantType:
              variant.variantType,
            format:
              variant.format,
            mimeType:
              variant.mimeType,
            width:
              variant.width ?? null,
            height:
              variant.height ?? null,
            fileSize:
              variant.fileSize,
            publicUrl:
              absoluteUrl(
                variant.publicUrl,
                apiBaseUrl
              ),
            isPrimary:
              variant.isPrimary ===
              true,
          }))
      : [];

  return {
    id: asset.id,
    assetType:
      asset.assetType,
    classification:
      asset.classification,
    title:
      asset.title || null,
    altText:
      asset.altText || null,
    caption:
      asset.caption || null,
    description:
      asset.description || null,
    mimeType:
      asset.mimeType || null,
    extension:
      asset.extension || null,
    width:
      asset.width ?? null,
    height:
      asset.height ?? null,
    orientation:
      asset.orientation || null,
    dominantColor:
      asset.dominantColor || null,
    hasTransparency:
      asset.hasTransparency ?? null,
    publicUrl:
      absoluteUrl(
        asset.publicUrl,
        apiBaseUrl
      ),
    thumbnailUrl:
      absoluteUrl(
        asset.thumbnailUrl ||
          asset.thumbnailPath
            ? asset.thumbnailUrl ||
              `/media/${asset.thumbnailPath}`
            : null,
        apiBaseUrl
      ),
    previewUrl:
      absoluteUrl(
        asset.previewUrl ||
          asset.previewPath
            ? asset.previewUrl ||
              `/media/${asset.previewPath}`
            : null,
        apiBaseUrl
      ),
    variants,
  };
};

const getCurrentPrice = (
  prices,
  channel,
  now
) => {
  const currentTime =
    now.getTime();

  const candidates =
    (prices || [])
      .map(asPlain)
      .filter((price) => {
        if (
          price.isActive !== true ||
          !price.priceList ||
          price.priceList
            .isActive !== true
        ) {
          return false;
        }

        const priceListChannel =
          price.priceList
            .channelCode;

        if (
          ![
            channel,
            "ALL",
          ].includes(
            priceListChannel
          )
        ) {
          return false;
        }

        const validFrom =
          price.validFrom
            ? new Date(
                price.validFrom
              ).getTime()
            : null;

        const validUntil =
          price.validUntil
            ? new Date(
                price.validUntil
              ).getTime()
            : null;

        const listValidFrom =
          price.priceList
            .validFrom
            ? new Date(
                price.priceList
                  .validFrom
              ).getTime()
            : null;

        const listValidUntil =
          price.priceList
            .validUntil
            ? new Date(
                price.priceList
                  .validUntil
              ).getTime()
            : null;

        return !(
          (validFrom &&
            validFrom >
              currentTime) ||
          (validUntil &&
            validUntil <
              currentTime) ||
          (listValidFrom &&
            listValidFrom >
              currentTime) ||
          (listValidUntil &&
            listValidUntil <
              currentTime)
        );
      })
      .sort((first, second) => {
        const firstChannel =
          first.priceList
            .channelCode ===
          channel
            ? 0
            : 1;

        const secondChannel =
          second.priceList
            .channelCode ===
          channel
            ? 0
            : 1;

        return (
          firstChannel -
            secondChannel ||
          Number(
            first.priceList
              .priority || 100
          ) -
            Number(
              second.priceList
                .priority || 100
            ) ||
          Number(
            first.priority || 100
          ) -
            Number(
              second.priority || 100
            )
        );
      });

  const selected =
    candidates[0];

  if (!selected) {
    return null;
  }

  return {
    id: selected.id,
    priceListId:
      selected.priceListId,
    priceListCode:
      selected.priceList.code,
    priceListName:
      selected.priceList.name,
    currencyCode:
      selected.priceList
        .currencyCode ||
      "AED",
    isTaxInclusive:
      selected.priceList
        .isTaxInclusive !== false,
    regularPrice:
      Number(
        selected.regularPrice
      ),
    sellingPrice:
      Number(
        selected.sellingPrice
      ),
    compareAtPrice:
      selected.compareAtPrice ===
        null ||
      selected.compareAtPrice ===
        undefined
        ? null
        : Number(
            selected.compareAtPrice
          ),
    minimumQuantity:
      Number(
        selected.minimumQuantity ||
          1
      ),
    maximumQuantity:
      selected.maximumQuantity ===
        null ||
      selected.maximumQuantity ===
        undefined
        ? null
        : Number(
            selected.maximumQuantity
          ),
  };
};

const buildImage = (
  image,
  apiBaseUrl
) => {
  const row =
    asPlain(image);

  return {
    id: row.id,
    variantId:
      row.variantId || null,
    imageRole:
      row.imageRole,
    altText:
      row.altText || null,
    title:
      row.title || null,
    displayOrder:
      Number(
        row.displayOrder || 0
      ),
    mediaAsset:
      buildMedia(
        row.mediaAsset,
        apiBaseUrl
      ),
  };
};

const buildAttributeValue = (
  value
) => {
  const row =
    asPlain(value);

  const displayValue =
    row.displayValue ||
    row.option?.label ||
    row.textValue ||
    (row.numberValue !==
      null &&
    row.numberValue !==
      undefined
      ? `${row.numberValue}${
          row.attribute?.unit
            ? ` ${row.attribute.unit}`
            : ""
        }`
      : null) ||
    (typeof row.booleanValue ===
    "boolean"
      ? row.booleanValue
        ? "Yes"
        : "No"
      : null) ||
    row.dateValue ||
    null;

  return {
    id: row.id,
    attributeId:
      row.attributeId,
    optionId:
      row.optionId || null,
    displayValue,
    textValue:
      row.textValue || null,
    numberValue:
      row.numberValue ===
        null ||
      row.numberValue ===
        undefined
        ? null
        : Number(
            row.numberValue
          ),
    booleanValue:
      row.booleanValue ?? null,
    dateValue:
      row.dateValue || null,
    attribute:
      row.attribute
        ? {
            id:
              row.attribute.id,
            name:
              row.attribute.name,
            code:
              row.attribute.code,
            inputType:
              row.attribute
                .inputType,
            dataType:
              row.attribute
                .dataType,
            unit:
              row.attribute.unit ||
              null,
            isVariantDefining:
              row.attribute
                .isVariantDefining ===
              true,
            isComparable:
              row.attribute
                .isComparable ===
              true,
            displayOrder:
              Number(
                row.attribute
                  .displayOrder || 0
              ),
          }
        : null,
    option:
      row.option
        ? {
            id:
              row.option.id,
            label:
              row.option.label,
            value:
              row.option.value,
            swatchValue:
              row.option
                .swatchValue ||
              null,
            displayOrder:
              Number(
                row.option
                  .displayOrder || 0
              ),
          }
        : null,
  };
};

const isVariantVisible = (
  variant,
  channel
) =>
  variant.status === "ACTIVE" &&
  (variant.channels || []).some(
    (entry) =>
      entry.channelCode ===
        channel &&
      entry.isVisible === true
  );

const buildVariant = ({
  variant,
  channel,
  apiBaseUrl,
  now,
}) => {
  const row =
    asPlain(variant);

  const images =
    (row.images || [])
      .filter(
        (image) =>
          image.isActive === true &&
          image.mediaAsset
      )
      .map((image) =>
        buildImage(
          image,
          apiBaseUrl
        )
      )
      .sort(
        (first, second) =>
          first.displayOrder -
          second.displayOrder
      );

  return {
    id: row.id,
    sku: row.sku,
    barcode:
      row.barcode || null,
    name: row.name,
    variantKey:
      row.variantKey,
    isDefault:
      row.isDefault === true,
    status: row.status,
    sortOrder:
      Number(
        row.sortOrder || 0
      ),
    dimensions: {
      weight:
        row.weight === null
          ? null
          : Number(row.weight),
      weightUnit:
        row.weightUnit || null,
      length:
        row.length === null
          ? null
          : Number(row.length),
      width:
        row.width === null
          ? null
          : Number(row.width),
      height:
        row.height === null
          ? null
          : Number(row.height),
      dimensionUnit:
        row.dimensionUnit || null,
    },
    attributes:
      (row.attributeValues || [])
        .map(
          buildAttributeValue
        )
        .sort(
          (first, second) =>
            (first.attribute
              ?.displayOrder ||
              0) -
              (second.attribute
                ?.displayOrder ||
                0) ||
            (first.option
              ?.displayOrder ||
              0) -
              (second.option
                ?.displayOrder ||
                0)
        ),
    price:
      getCurrentPrice(
        row.prices,
        channel,
        now
      ),
    images,
    availability: {
      status: "AVAILABLE",
      quantity: null,
      trackQuantity: false,
      message:
        "Available to order",
    },
  };
};

const buildVariantSelectors = (
  variants
) => {
  const map =
    new Map();

  variants.forEach(
    (variant) => {
      variant.attributes.forEach(
        (value) => {
          const attribute =
            value.attribute;

          if (
            !attribute ||
            !attribute
              .isVariantDefining
          ) {
            return;
          }

          if (
            !map.has(
              attribute.id
            )
          ) {
            map.set(
              attribute.id,
              {
                id: attribute.id,
                name:
                  attribute.name,
                code:
                  attribute.code,
                inputType:
                  attribute.inputType,
                displayOrder:
                  attribute.displayOrder,
                options:
                  new Map(),
              }
            );
          }

          const selector =
            map.get(
              attribute.id
            );

          const optionId =
            value.option?.id ||
            value.optionId ||
            value.displayValue;

          if (
            !selector.options.has(
              optionId
            )
          ) {
            selector.options.set(
              optionId,
              {
                id: optionId,
                label:
                  value.option
                    ?.label ||
                  value.displayValue,
                value:
                  value.option
                    ?.value ||
                  value.displayValue,
                swatchValue:
                  value.option
                    ?.swatchValue ||
                  null,
                displayOrder:
                  value.option
                    ?.displayOrder ||
                  0,
                variantIds: [],
              }
            );
          }

          selector.options
            .get(optionId)
            .variantIds.push(
              variant.id
            );
        }
      );
    }
  );

  return Array.from(
    map.values()
  )
    .sort(
      (first, second) =>
        first.displayOrder -
        second.displayOrder
    )
    .map((selector) => ({
      ...selector,
      options: Array.from(
        selector.options.values()
      ).sort(
        (first, second) =>
          first.displayOrder -
            second.displayOrder ||
          first.label.localeCompare(
            second.label
          )
      ),
    }));
};

const buildBreadcrumbs = (
  product
) => {
  const category =
    product.primaryCategory;

  const breadcrumbs = [
    {
      label: "Home",
      url: "/",
    },
  ];

  if (category) {
    breadcrumbs.push({
      label:
        category.name,
      url:
        `/category/${category.slug}`,
    });
  }

  breadcrumbs.push({
    label: product.name,
    url:
      `/products/${product.slug}`,
  });

  return breadcrumbs;
};

const findCompany = async (
  companyCode
) => {
  const company =
    await db.Company.findOne({
      where: {
        code:
          String(
            companyCode || ""
          )
            .trim()
            .toUpperCase(),
      },
    });

  if (!company) {
    const error =
      new Error(
        "Company not found."
      );

    error.statusCode = 404;
    error.code =
      "COMPANY_NOT_FOUND";

    throw error;
  }

  return company;
};


const groupByKey = (
  records,
  keyName
) => {
  const grouped =
    new Map();

  for (const record of records) {
    const row =
      asPlain(record);

    if (!row) {
      continue;
    }

    const key =
      row[keyName];

    if (!key) {
      continue;
    }

    if (!grouped.has(key)) {
      grouped.set(
        key,
        []
      );
    }

    grouped
      .get(key)
      .push(row);
  }

  return grouped;
};

const loadMediaAssetInclude = ({
  companyId,
}) => ({
  model:
    db.MediaAsset,

  as:
    "mediaAsset",

  required:
    true,

  where: {
    companyId,
    isActive: true,
    isPublic: true,
    status: "READY",
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
      },
    },
  ],
});

const getRelatedProducts = async ({
  companyId,
  productId,
  categoryId,
  brandId,
  channel,
  apiBaseUrl,
  now,
}) => {
  if (
    !categoryId &&
    !brandId
  ) {
    return [];
  }

  const where = {
    companyId,
    status: "ACTIVE",
    isSearchable: true,

    id: {
      [Op.ne]:
        productId,
    },

    [Op.or]: [
      ...(categoryId
        ? [
            {
              primaryCategoryId:
                categoryId,
            },
          ]
        : []),

      ...(brandId
        ? [
            {
              brandId,
            },
          ]
        : []),
    ],
  };

  /*
   * Load only the base products first.
   * This avoids a large joined result for
   * related products.
   */
  const productModels =
    await db.Product.findAll({
      where,

      include: [
        {
          model:
            db.Brand,

          as:
            "brand",

          required:
            false,
        },

        {
          model:
            db.Category,

          as:
            "primaryCategory",

          required:
            false,
        },
      ],

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
          "name",
          "ASC",
        ],
      ],

      limit: 8,
    });

  if (!productModels.length) {
    return [];
  }

  const productIds =
    productModels.map(
      (product) =>
        product.id
    );

  const [
    productChannels,
    productImages,
    variants,
  ] =
    await Promise.all([
      db.ProductChannel.findAll({
        where: {
          companyId,

          productId: {
            [Op.in]:
              productIds,
          },

          channelCode:
            channel,

          isVisible:
            true,

          publishStatus:
            "PUBLISHED",
        },
      }),

      db.ProductImage.findAll({
        where: {
          companyId,

          productId: {
            [Op.in]:
              productIds,
          },

          variantId:
            null,

          isActive:
            true,
        },

        include: [
          loadMediaAssetInclude({
            companyId,
          }),
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
      }),

      db.ProductVariant.findAll({
        where: {
          companyId,

          productId: {
            [Op.in]:
              productIds,
          },

          status:
            "ACTIVE",
        },

        order: [
          [
            "productId",
            "ASC",
          ],
          [
            "isDefault",
            "DESC",
          ],
          [
            "sortOrder",
            "ASC",
          ],
        ],
      }),
    ]);

  const publishedProductIds =
    new Set(
      productChannels.map(
        (entry) =>
          entry.productId
      )
    );

  const variantIds =
    variants.map(
      (variant) =>
        variant.id
    );

  let variantChannels =
    [];

  let variantPrices =
    [];

  let variantImages =
    [];

  if (variantIds.length) {
    [
      variantChannels,
      variantPrices,
      variantImages,
    ] =
      await Promise.all([
        db.ProductVariantChannel
          .findAll({
            where: {
              companyId,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },

              channelCode:
                channel,

              isVisible:
                true,
            },
          }),

        db.ProductVariantPrice
          .findAll({
            where: {
              companyId,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },

              isActive:
                true,
            },

            include: [
              {
                model:
                  db.PriceList,

                as:
                  "priceList",

                required:
                  true,

                where: {
                  companyId,
                  isActive: true,

                  channelCode: {
                    [Op.in]: [
                      channel,
                      "ALL",
                    ],
                  },
                },
              },
            ],
          }),

        db.ProductImage.findAll({
          where: {
            companyId,

            variantId: {
              [Op.in]:
                variantIds,
            },

            isActive:
              true,
          },

          include: [
            loadMediaAssetInclude({
              companyId,
            }),
          ],

          order: [
            [
              "variantId",
              "ASC",
            ],
            [
              "displayOrder",
              "ASC",
            ],
          ],
        }),
      ]);
  }

  const imagesByProduct =
    groupByKey(
      productImages,
      "productId"
    );

  const variantsByProduct =
    groupByKey(
      variants,
      "productId"
    );

  const channelsByVariant =
    groupByKey(
      variantChannels,
      "productVariantId"
    );

  const pricesByVariant =
    groupByKey(
      variantPrices,
      "productVariantId"
    );

  const imagesByVariant =
    groupByKey(
      variantImages,
      "variantId"
    );

  return productModels
    .map(asPlain)
    .filter(
      (product) =>
        publishedProductIds.has(
          product.id
        )
    )
    .map((product) => {
      const productVariants =
        (
          variantsByProduct.get(
            product.id
          ) || []
        )
          .map((variant) => ({
            ...variant,

            channels:
              channelsByVariant.get(
                variant.id
              ) || [],

            prices:
              pricesByVariant.get(
                variant.id
              ) || [],

            images:
              imagesByVariant.get(
                variant.id
              ) || [],
          }))
          .filter(
            (variant) =>
              isVariantVisible(
                variant,
                channel
              )
          );

      const selectedVariant =
        productVariants.find(
          (variant) =>
            variant.isDefault
        ) ||
        productVariants[0];

      if (!selectedVariant) {
        return null;
      }

      const sharedImage =
        (
          imagesByProduct.get(
            product.id
          ) || []
        )[0] ||
        null;

      const variantImage =
        (
          selectedVariant.images ||
          []
        )[0] ||
        null;

      const productImage =
        sharedImage
          ? buildImage(
              sharedImage,
              apiBaseUrl
            )
          : variantImage
            ? buildImage(
                variantImage,
                apiBaseUrl
              )
            : null;

      return {
        id:
          product.id,

        name:
          product.name,

        slug:
          product.slug,

        productType:
          product.productType,

        shortDescription:
          product.shortDescription ||
          null,

        isFeatured:
          product.isFeatured ===
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
                  product.brand.slug,
              }
            : null,

        primaryCategory:
          product.primaryCategory
            ? {
                id:
                  product
                    .primaryCategory
                    .id,

                name:
                  product
                    .primaryCategory
                    .name,

                slug:
                  product
                    .primaryCategory
                    .slug,
              }
            : null,

        image:
          productImage,

        defaultVariant: {
          id:
            selectedVariant.id,

          sku:
            selectedVariant.sku,

          barcode:
            selectedVariant.barcode ||
            null,

          name:
            selectedVariant.name,

          isDefault:
            selectedVariant
              .isDefault ===
            true,
        },

        price:
          getCurrentPrice(
            selectedVariant.prices,
            channel,
            now
          ),

        productUrl:
          `/products/${product.slug}`,
      };
    })
    .filter(Boolean);
};

exports.getPublicProduct = async ({
  companyCode,
  slug,
  channel = "WEBSITE",
  apiBaseUrl,
}) => {
  const normalizedSlug =
    normalizeSlug(slug);

  if (!normalizedSlug) {
    const error =
      new Error(
        "Product slug is required."
      );

    error.statusCode = 400;
    error.code =
      "PRODUCT_SLUG_REQUIRED";

    throw error;
  }

  const company =
    await findCompany(
      companyCode
    );

  /*
   * Load only belongsTo associations in the
   * base product query.
   */
  const productModel =
    await db.Product.findOne({
      where: {
        companyId:
          company.id,

        slug:
          normalizedSlug,

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

          where: {
            companyId:
              company.id,

            isActive:
              true,
          },
        },

        {
          model:
            db.Category,

          as:
            "primaryCategory",

          required:
            false,

          where: {
            companyId:
              company.id,

            isActive:
              true,
          },
        },
      ],
    });

  if (!productModel) {
    const error =
      new Error(
        "Product not found."
      );

    error.statusCode = 404;
    error.code =
      "PRODUCT_NOT_FOUND";

    throw error;
  }

  const productChannel =
    await db.ProductChannel.findOne({
      where: {
        companyId:
          company.id,

        productId:
          productModel.id,

        channelCode:
          channel,

        isVisible:
          true,

        publishStatus:
          "PUBLISHED",
      },
    });

  if (!productChannel) {
    const error =
      new Error(
        "Product is not published for this channel."
      );

    error.statusCode = 404;
    error.code =
      "PRODUCT_CHANNEL_UNAVAILABLE";

    throw error;
  }

  const [
    categoryAssignmentModels,
    productImageModels,
    productAttributeValueModels,
    productVariantModels,
  ] =
    await Promise.all([
      db.ProductCategory.findAll({
        where: {
          companyId:
            company.id,

          productId:
            productModel.id,
        },

        include: [
          {
            model:
              db.Category,

            as:
              "category",

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

        order: [
          [
            "isPrimary",
            "DESC",
          ],
          [
            "displayOrder",
            "ASC",
          ],
          [
            "createdAt",
            "ASC",
          ],
        ],
      }),

      db.ProductImage.findAll({
        where: {
          companyId:
            company.id,

          productId:
            productModel.id,

          variantId:
            null,

          isActive:
            true,
        },

        include: [
          loadMediaAssetInclude({
            companyId:
              company.id,
          }),
        ],

        order: [
          [
            "displayOrder",
            "ASC",
          ],
          [
            "createdAt",
            "ASC",
          ],
        ],
      }),

      db.ProductAttributeValue
        .findAll({
          where: {
            companyId:
              company.id,

            productId:
              productModel.id,
          },

          include: [
            {
              model:
                db.Attribute,

              as:
                "attribute",

              required:
                true,

              where: {
                companyId:
                  company.id,

                isActive:
                  true,
              },
            },

            {
              model:
                db.AttributeOption,

              as:
                "option",

              required:
                false,

              where: {
                companyId:
                  company.id,

                isActive:
                  true,
              },
            },
          ],
        }),

      db.ProductVariant.findAll({
        where: {
          companyId:
            company.id,

          productId:
            productModel.id,

          status:
            "ACTIVE",
        },

        order: [
          [
            "isDefault",
            "DESC",
          ],
          [
            "sortOrder",
            "ASC",
          ],
          [
            "createdAt",
            "ASC",
          ],
        ],
      }),
    ]);

  const variantIds =
    productVariantModels.map(
      (variant) =>
        variant.id
    );

  let variantChannelModels =
    [];

  let variantAttributeValueModels =
    [];

  let variantPriceModels =
    [];

  let variantImageModels =
    [];

  if (variantIds.length) {
    [
      variantChannelModels,
      variantAttributeValueModels,
      variantPriceModels,
      variantImageModels,
    ] =
      await Promise.all([
        db.ProductVariantChannel
          .findAll({
            where: {
              companyId:
                company.id,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },

              channelCode:
                channel,

              isVisible:
                true,
            },
          }),

        db.ProductVariantAttributeValue
          .findAll({
            where: {
              companyId:
                company.id,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },
            },

            include: [
              {
                model:
                  db.Attribute,

                as:
                  "attribute",

                required:
                  true,

                where: {
                  companyId:
                    company.id,

                  isActive:
                    true,
                },
              },

              {
                model:
                  db.AttributeOption,

                as:
                  "option",

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

            order: [
              [
                "productVariantId",
                "ASC",
              ],
              [
                "sortOrder",
                "ASC",
              ],
              [
                "createdAt",
                "ASC",
              ],
            ],
          }),

        db.ProductVariantPrice
          .findAll({
            where: {
              companyId:
                company.id,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },

              isActive:
                true,
            },

            include: [
              {
                model:
                  db.PriceList,

                as:
                  "priceList",

                required:
                  true,

                where: {
                  companyId:
                    company.id,

                  isActive:
                    true,

                  channelCode: {
                    [Op.in]: [
                      channel,
                      "ALL",
                    ],
                  },
                },
              },
            ],
          }),

        db.ProductImage.findAll({
          where: {
            companyId:
              company.id,

            productId:
              productModel.id,

            variantId: {
              [Op.in]:
                variantIds,
            },

            isActive:
              true,
          },

          include: [
            loadMediaAssetInclude({
              companyId:
                company.id,
            }),
          ],

          order: [
            [
              "variantId",
              "ASC",
            ],
            [
              "displayOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }),
      ]);
  }

  const channelsByVariant =
    groupByKey(
      variantChannelModels,
      "productVariantId"
    );

  const attributesByVariant =
    groupByKey(
      variantAttributeValueModels,
      "productVariantId"
    );

  const pricesByVariant =
    groupByKey(
      variantPriceModels,
      "productVariantId"
    );

  const imagesByVariant =
    groupByKey(
      variantImageModels,
      "variantId"
    );

  const now =
    new Date();

  const product =
    asPlain(
      productModel
    );

  product.categoryAssignments =
    categoryAssignmentModels.map(
      asPlain
    );

  product.images =
    productImageModels.map(
      asPlain
    );

  product.attributeValues =
    productAttributeValueModels.map(
      asPlain
    );

  product.variants =
    productVariantModels.map(
      (variantModel) => {
        const variant =
          asPlain(
            variantModel
          );

        return {
          ...variant,

          channels:
            channelsByVariant.get(
              variant.id
            ) || [],

          attributeValues:
            attributesByVariant.get(
              variant.id
            ) || [],

          prices:
            pricesByVariant.get(
              variant.id
            ) || [],

          images:
            imagesByVariant.get(
              variant.id
            ) || [],
        };
      }
    );

  const variants =
    product.variants
      .filter((variant) =>
        isVariantVisible(
          variant,
          channel
        )
      )
      .map((variant) =>
        buildVariant({
          variant,
          channel,
          apiBaseUrl,
          now,
        })
      )
      .sort(
        (first, second) =>
          Number(
            second.isDefault
          ) -
            Number(
              first.isDefault
            ) ||
          first.sortOrder -
            second.sortOrder
      );

  if (!variants.length) {
    const error =
      new Error(
        "This product has no active variants available for this channel."
      );

    error.statusCode = 404;
    error.code =
      "PRODUCT_VARIANTS_UNAVAILABLE";

    throw error;
  }

  const defaultVariant =
    variants.find(
      (variant) =>
        variant.isDefault &&
        variant.price
    ) ||
    variants.find(
      (variant) =>
        Boolean(
          variant.price
        )
    ) ||
    variants[0];

  /*
   * Shared product gallery only.
   * Variant media stays inside variant.images.
   */
  const productImages =
    product.images
      .filter(
        (image) =>
          image.isActive ===
            true &&
          !image.variantId &&
          image.mediaAsset
      )
      .map((image) =>
        buildImage(
          image,
          apiBaseUrl
        )
      )
      .sort(
        (first, second) =>
          first.displayOrder -
          second.displayOrder
      );

  const specifications =
    product.attributeValues
      .map(
        buildAttributeValue
      )
      .filter(
        (value) =>
          value.attribute &&
          value.displayValue
      )
      .sort(
        (first, second) =>
          (
            first.attribute
              ?.displayOrder ||
            0
          ) -
          (
            second.attribute
              ?.displayOrder ||
            0
          )
      );

  const categories =
    product.categoryAssignments
      .filter(
        (assignment) =>
          assignment.category
      )
      .sort(
        (first, second) =>
          Number(
            second.isPrimary
          ) -
            Number(
              first.isPrimary
            ) ||
          Number(
            first.displayOrder ||
            0
          ) -
            Number(
              second.displayOrder ||
              0
            )
      )
      .map(
        (assignment) => ({
          id:
            assignment
              .category
              .id,

          name:
            assignment
              .category
              .name,

          slug:
            assignment
              .category
              .slug,

          isPrimary:
            assignment
              .isPrimary ===
            true,
        })
      );

  const relatedProducts =
    await getRelatedProducts({
      companyId:
        company.id,

      productId:
        product.id,

      categoryId:
        product.primaryCategoryId,

      brandId:
        product.brandId,

      channel,
      apiBaseUrl,
      now,
    });

  return {
    company: {
      id:
        company.id,

      name:
        company.name,

      code:
        company.code,

      currency:
        company.currency ||
        "AED",
    },

    product: {
      id:
        product.id,

      name:
        product.name,

      slug:
        product.slug,

      productType:
        product.productType,

      parentSku:
        product.parentSku ||
        null,

      shortDescription:
        product.shortDescription ||
        null,

      description:
        product.description ||
        null,

      features:
        Array.isArray(
          product.features
        )
          ? product.features
          : [],

      whatsInTheBox:
        Array.isArray(
          product.whatsInTheBox
        )
          ? product.whatsInTheBox
          : [],

      warrantyText:
        product.warrantyText ||
        null,

      taxCode:
        product.taxCode ||
        null,

      taxPercent:
        Number(
          product.taxPercent ||
          0
        ),

      isFeatured:
        product.isFeatured ===
        true,

      brand:
        product.brand
          ? {
              id:
                product.brand.id,

              name:
                product.brand.name,

              code:
                product.brand.code,

              slug:
                product.brand.slug,

              description:
                product.brand
                  .description ||
                null,
            }
          : null,

      primaryCategory:
        product.primaryCategory
          ? {
              id:
                product
                  .primaryCategory
                  .id,

              name:
                product
                  .primaryCategory
                  .name,

              slug:
                product
                  .primaryCategory
                  .slug,
            }
          : null,

      categories,

      seo: {
        title:
          product.metaTitle ||
          product.name,

        description:
          product.metaDescription ||
          product.shortDescription ||
          product.description ||
          null,

        keywords:
          String(
            product.metaKeywords ||
            ""
          )
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(
              Boolean
            ),

        canonicalUrl:
          product.canonicalUrl ||
          `/products/${product.slug}`,
      },

      gallery:
        productImages,

      specifications,

      variants,

      variantSelectors:
        buildVariantSelectors(
          variants
        ),

      defaultVariantId:
        defaultVariant.id,

      availability:
        defaultVariant
          .availability,

      productUrl:
        `/products/${product.slug}`,
    },

    breadcrumbs:
      buildBreadcrumbs(
        product
      ),

    relatedProducts,

    meta: {
      channel,

      generatedAt:
        now.toISOString(),
    },
  };
};
