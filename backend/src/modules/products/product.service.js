const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const {
  slugify,
  normalizeNullable,
  normalizeStringArray,
  buildVariantKey,
  cartesianProduct,
  generateVariantSku,
} = require("./product.utils");

const PRODUCT_INCLUDE = [
  {
    model: db.Brand,
    as: "brand",
    required: false,
  },
  {
    model: db.Category,
    as: "primaryCategory",
    required: false,
  },
  {
    model: db.ProductCategory,
    as: "categoryAssignments",
    required: false,
    include: [
      {
        model: db.Category,
        as: "category",
        required: false,
      },
    ],
  },
  {
    model: db.ProductImage,
    as: "images",
    required: false,
    include: [
      {
        model: db.MediaAsset,
        as: "mediaAsset",
        required: false,
      },
    ],
  },
  {
    model: db.ProductChannel,
    as: "channels",
    required: false,
  },
  {
    model: db.ProductAttributeValue,
    as: "attributeValues",
    required: false,
    include: [
      {
        model: db.Attribute,
        as: "attribute",
        required: false,
      },
      {
        model: db.AttributeOption,
        as: "option",
        required: false,
      },
    ],
  },
  {
    model: db.ProductVariant,
    as: "variants",
    required: false,
    include: [
      {
        model:
          db.ProductVariantAttributeValue,
        as: "attributeValues",
        required: false,
        include: [
          {
            model: db.Attribute,
            as: "attribute",
            required: false,
          },
          {
            model:
              db.AttributeOption,
            as: "option",
            required: false,
          },
        ],
      },
  
      {
        model:
          db.ProductVariantChannel,
        as: "channels",
        required: false,
      },
  
      {
        model:
          db.ProductVariantPrice,
        as: "prices",
        required: false,
        include: [
          {
            model: db.PriceList,
            as: "priceList",
            required: false,
          },
        ],
      },
  
      {
        model: db.ProductImage,
        as: "images",
        required: false,
        include: [
          {
            model: db.MediaAsset,
            as: "mediaAsset",
            required: false,
          },
        ],
      },
    ],
  },
];

const ensureUniqueProductFields = async ({
  companyId,
  slug,
  parentSku,
  excludeId,
  transaction,
}) => {
  const clauses = [{ slug }];

  if (parentSku) {
    clauses.push({ parentSku });
  }

  const where = {
    companyId,
    [Op.or]: clauses,
  };

  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }

  const existing = await db.Product.findOne({
    where,
    transaction,
  });

  if (!existing) {
    return;
  }

  if (existing.slug === slug) {
    throw new AppError(
      "A product with this slug already exists.",
      409,
      "PRODUCT_SLUG_EXISTS"
    );
  }

  throw new AppError(
    "A product with this parent SKU already exists.",
    409,
    "PRODUCT_PARENT_SKU_EXISTS"
  );
};

const ensureBrandAndCategories = async ({
  companyId,
  brandId,
  primaryCategoryId,
  categoryIds,
  transaction,
}) => {
  if (brandId) {
    const brand = await db.Brand.findOne({
      where: {
        id: brandId,
        companyId,
      },
      transaction,
    });

    if (!brand) {
      throw new AppError(
        "Selected brand was not found.",
        400,
        "PRODUCT_BRAND_INVALID"
      );
    }
  }

  const ids = [
    ...new Set(
      [
        primaryCategoryId,
        ...(categoryIds || []),
      ].filter(Boolean)
    ),
  ];

  if (!ids.length) {
    return;
  }

  const categories = await db.Category.findAll({
    where: {
      companyId,
      id: {
        [Op.in]: ids,
      },
    },
    attributes: ["id"],
    transaction,
  });

  if (categories.length !== ids.length) {
    throw new AppError(
      "One or more selected categories were not found.",
      400,
      "PRODUCT_CATEGORY_INVALID"
    );
  }
};


const ensureDirectDeliverySupplier = async ({
  companyId,
  isDirectDelivery,
  supplierId,
  transaction,
}) => {
  if (!isDirectDelivery) {
    return;
  }

  if (!supplierId) {
    throw new AppError(
      "A supplier is required for a direct-delivery product.",
      400,
      "PRODUCT_DIRECT_DELIVERY_SUPPLIER_REQUIRED"
    );
  }

  const supplier =
    await db.Supplier.findOne({
      where: {
        id: supplierId,
        companyId,
        isActive: true,
      },
      attributes: [
        "id",
      ],
      transaction,
    });

  if (!supplier) {
    throw new AppError(
      "The selected direct-delivery supplier was not found or is inactive.",
      400,
      "PRODUCT_DIRECT_DELIVERY_SUPPLIER_INVALID"
    );
  }
};

const replaceCategories = async ({
  companyId,
  product,
  primaryCategoryId,
  categoryIds,
  transaction,
}) => {
  const ids = [
    ...new Set(
      [
        primaryCategoryId,
        ...(categoryIds || []),
      ].filter(Boolean)
    ),
  ];

  await db.ProductCategory.destroy({
    where: {
      companyId,
      productId: product.id,
    },
    transaction,
  });

  if (!ids.length) {
    await product.update(
      {
        primaryCategoryId: null,
      },
      { transaction }
    );

    return;
  }

  await db.ProductCategory.bulkCreate(
    ids.map((categoryId, index) => ({
      companyId,
      productId: product.id,
      categoryId,
      isPrimary:
        categoryId === primaryCategoryId,
      displayOrder: index,
    })),
    { transaction }
  );

  await product.update(
    {
      primaryCategoryId:
        primaryCategoryId || ids[0],
    },
    { transaction }
  );
};

const replaceChannels = async ({
  companyId,
  product,
  channels,
  transaction,
}) => {
  if (!Array.isArray(channels)) {
    return;
  }

  await db.ProductChannel.destroy({
    where: {
      companyId,
      productId: product.id,
    },
    transaction,
  });

  if (!channels.length) {
    return;
  }

  await db.ProductChannel.bulkCreate(
    channels.map((channel) => ({
      companyId,
      productId: product.id,
      channelCode: channel.channelCode,
      isVisible: channel.isVisible !== false,
      publishStatus:
        channel.publishStatus || "DRAFT",
      publishedAt:
        channel.publishStatus === "PUBLISHED"
          ? new Date()
          : null,
      channelTitle:
        normalizeNullable(channel.channelTitle),
      channelDescription:
        normalizeNullable(
          channel.channelDescription
        ),
    })),
    { transaction }
  );
};

const replaceImages = async ({
  companyId,
  product,
  images,
  transaction,
}) => {
  if (!Array.isArray(images)) {
    return;
  }

  const mediaIds = [
    ...new Set(
      images
        .map((image) => image.mediaAssetId)
        .filter(Boolean)
    ),
  ];

  if (mediaIds.length) {
    const mediaAssets =
      await db.MediaAsset.findAll({
        where: {
          companyId,
          id: {
            [Op.in]: mediaIds,
          },
        },
        attributes: ["id"],
        transaction,
      });

    if (mediaAssets.length !== mediaIds.length) {
      throw new AppError(
        "One or more media assets were not found.",
        400,
        "PRODUCT_MEDIA_INVALID"
      );
    }
  }

  await db.ProductImage.destroy({
    where: {
      companyId,
      productId: product.id,
      variantId: null,
    },
    transaction,
  });

  if (!images.length) {
    return;
  }

  await db.ProductImage.bulkCreate(
    images.map((image, index) => ({
      companyId,
      productId: product.id,
      variantId: null,
      mediaAssetId: image.mediaAssetId,
      imageRole: image.imageRole || "GALLERY",
      altText: normalizeNullable(image.altText),
      title: normalizeNullable(image.title),
      displayOrder: Number(
        image.displayOrder ?? index
      ),
      isActive: image.isActive !== false,
    })),
    { transaction }
  );
};

const replaceVariantImages =
  async ({
    companyId,
    product,
    variant,
    images,
    transaction,
  }) => {
    if (!Array.isArray(images)) {
      return;
    }

    const mediaIds = [
      ...new Set(
        images
          .map(
            (image) =>
              image.mediaAssetId
          )
          .filter(Boolean)
      ),
    ];

    if (mediaIds.length) {
      const mediaAssets =
        await db.MediaAsset
          .findAll({
            where: {
              companyId,

              id: {
                [Op.in]:
                  mediaIds,
              },
            },

            attributes: [
              "id",
            ],

            transaction,
          });

      if (
        mediaAssets.length !==
        mediaIds.length
      ) {
        throw new AppError(
          "One or more variant media assets were not found.",
          400,
          "PRODUCT_VARIANT_MEDIA_INVALID"
        );
      }
    }

    await db.ProductImage
      .destroy({
        where: {
          companyId,
          productId:
            product.id,
          variantId:
            variant.id,
        },

        transaction,
      });

    if (!images.length) {
      return;
    }

    let primaryAssigned =
      false;

    const normalizedImages =
      images.map(
        (image, index) => {
          const requestedRole =
            image.imageRole ||
            "GALLERY";

          const isVideo =
            requestedRole ===
            "VIDEO";

          let imageRole =
            requestedRole;

          if (!isVideo) {
            if (
              requestedRole ===
                "PRIMARY" &&
              !primaryAssigned
            ) {
              primaryAssigned =
                true;
            } else if (
              requestedRole ===
              "PRIMARY"
            ) {
              imageRole =
                "GALLERY";
            }
          }

          return {
            companyId,
            productId:
              product.id,
            variantId:
              variant.id,
            mediaAssetId:
              image.mediaAssetId,
            imageRole,
            altText:
              normalizeNullable(
                image.altText
              ),
            title:
              normalizeNullable(
                image.title
              ),
            displayOrder:
              Number(
                image.displayOrder ??
                index
              ),
            isActive:
              image.isActive !==
              false,
          };
        }
      );

    /*
     * If the variant has images but
     * none is PRIMARY, make the first
     * non-video image PRIMARY.
     */
    if (!primaryAssigned) {
      const firstImageIndex =
        normalizedImages
          .findIndex(
            (image) =>
              image.imageRole !==
              "VIDEO"
          );

      if (
        firstImageIndex >= 0
      ) {
        normalizedImages[
          firstImageIndex
        ].imageRole =
          "PRIMARY";
      }
    }

    await db.ProductImage
      .bulkCreate(
        normalizedImages,
        {
          transaction,
        }
      );
  };

const serializeAttributeValue = ({
  attribute,
  value,
}) => {
  const result = {
    optionId: value.optionId || null,
    textValue: null,
    numberValue: null,
    booleanValue: null,
    dateValue: null,
    jsonValue: null,
    displayValue:
      normalizeNullable(value.displayValue),
  };

  switch (attribute.dataType) {
    case "NUMBER":
      result.numberValue =
        value.numberValue ??
        value.value ??
        null;
      break;

    case "BOOLEAN":
      result.booleanValue =
        value.booleanValue ??
        value.value ??
        null;
      break;

    case "DATE":
      result.dateValue =
        value.dateValue ??
        value.value ??
        null;
      break;

    case "JSON":
      result.jsonValue =
        value.jsonValue ??
        value.value ??
        null;
      break;

    default:
      result.textValue =
        normalizeNullable(
          value.textValue ?? value.value
        );
  }

  return result;
};

const replaceProductAttributeValues = async ({
  companyId,
  product,
  attributeValues,
  transaction,
}) => {
  if (!Array.isArray(attributeValues)) {
    return;
  }

  const attributeIds = [
    ...new Set(
      attributeValues.map(
        (item) => item.attributeId
      )
    ),
  ];

  const attributes = await db.Attribute.findAll({
    where: {
      companyId,
      id: {
        [Op.in]: attributeIds,
      },
    },
    transaction,
  });

  if (attributes.length !== attributeIds.length) {
    throw new AppError(
      "One or more product attributes were not found.",
      400,
      "PRODUCT_ATTRIBUTE_INVALID"
    );
  }

  const attributeMap = new Map(
    attributes.map((attribute) => [
      attribute.id,
      attribute,
    ])
  );

  await db.ProductAttributeValue.destroy({
    where: {
      companyId,
      productId: product.id,
    },
    transaction,
  });

  if (!attributeValues.length) {
    return;
  }

  await db.ProductAttributeValue.bulkCreate(
    attributeValues.map((value) => {
      const attribute = attributeMap.get(
        value.attributeId
      );

      return {
        companyId,
        productId: product.id,
        attributeId: value.attributeId,
        ...serializeAttributeValue({
          attribute,
          value,
        }),
      };
    }),
    { transaction }
  );
};

const ensureUniqueVariantFields = async ({
  companyId,
  sku,
  barcode,
  excludeId,
  transaction,
}) => {
  const clauses = [{ sku }];

  if (barcode) {
    clauses.push({ barcode });
  }

  const where = {
    companyId,
    [Op.or]: clauses,
  };

  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }

  const existing =
    await db.ProductVariant.findOne({
      where,
      transaction,
    });

  if (!existing) {
    return;
  }

  if (existing.sku === sku) {
    throw new AppError(
      `Variant SKU "${sku}" already exists.`,
      409,
      "PRODUCT_VARIANT_SKU_EXISTS"
    );
  }

  throw new AppError(
    `Variant barcode "${barcode}" already exists.`,
    409,
    "PRODUCT_VARIANT_BARCODE_EXISTS"
  );
};

const replaceVariants = async ({
  companyId,
  product,
  variants,
  userId,
  transaction,
}) => {
  if (!Array.isArray(variants)) {
    return;
  }

  const existingVariants =
    await db.ProductVariant.findAll({
      where: {
        companyId,
        productId: product.id,
      },
      transaction,
    });

  const existingMap = new Map(
    existingVariants.map((variant) => [
      variant.id,
      variant,
    ])
  );

  const retainedIds = new Set();

  for (let index = 0; index < variants.length; index += 1) {
    const payload = variants[index];

    const attributeValues =
      payload.attributeValues || [];

    const variantKey =
      payload.variantKey ||
      (
        attributeValues.length
          ? buildVariantKey(attributeValues)
          : "DEFAULT"
      );

    await ensureUniqueVariantFields({
      companyId,
      sku: payload.sku,
      barcode:
        normalizeNullable(payload.barcode),
      excludeId: payload.id || null,
      transaction,
    });

    let variant;

    if (
      payload.id &&
      existingMap.has(payload.id)
    ) {
      variant = existingMap.get(payload.id);

      await variant.update(
        {
          sku: payload.sku.trim(),
          barcode:
            normalizeNullable(payload.barcode),
          name: payload.name.trim(),
          variantKey,
          isDefault:
            payload.isDefault === true,
          status: payload.status || "DRAFT",
          weight:
            payload.weight ?? null,
          weightUnit:
            payload.weightUnit || null,
          length:
            payload.length ?? null,
          width:
            payload.width ?? null,
          height:
            payload.height ?? null,
          dimensionUnit:
            payload.dimensionUnit || null,

          overrideDeliverySettings:
            payload.overrideDeliverySettings === true,

          expressDeliveryEnabled:
            payload.overrideDeliverySettings === true
              ? payload.expressDeliveryEnabled === true
              : null,

          expressDeliveryHours:
            payload.overrideDeliverySettings === true &&
            payload.expressDeliveryHours != null
              ? Number(payload.expressDeliveryHours)
              : null,

          deliveryMinDays:
            payload.overrideDeliverySettings === true &&
            payload.deliveryMinDays != null
              ? Number(payload.deliveryMinDays)
              : null,

          deliveryMaxDays:
            payload.overrideDeliverySettings === true &&
            payload.deliveryMaxDays != null
              ? Number(payload.deliveryMaxDays)
              : null,

          deliveryNote:
            payload.overrideDeliverySettings === true
              ? normalizeNullable(payload.deliveryNote)
              : null,

          sortOrder:
            Number(payload.sortOrder ?? index),
          updatedBy: userId,
        },
        { transaction }
      );
    } else {
      variant = await db.ProductVariant.create(
        {
          companyId,
          productId: product.id,
          sku: payload.sku.trim(),
          barcode:
            normalizeNullable(payload.barcode),
          name: payload.name.trim(),
          variantKey,
          isDefault:
            payload.isDefault === true,
          status: payload.status || "DRAFT",
          weight:
            payload.weight ?? null,
          weightUnit:
            payload.weightUnit || null,
          length:
            payload.length ?? null,
          width:
            payload.width ?? null,
          height:
            payload.height ?? null,
          dimensionUnit:
            payload.dimensionUnit || null,

          overrideDeliverySettings:
            payload.overrideDeliverySettings === true,

          expressDeliveryEnabled:
            payload.overrideDeliverySettings === true
              ? payload.expressDeliveryEnabled === true
              : null,

          expressDeliveryHours:
            payload.overrideDeliverySettings === true &&
            payload.expressDeliveryHours != null
              ? Number(payload.expressDeliveryHours)
              : null,

          deliveryMinDays:
            payload.overrideDeliverySettings === true &&
            payload.deliveryMinDays != null
              ? Number(payload.deliveryMinDays)
              : null,

          deliveryMaxDays:
            payload.overrideDeliverySettings === true &&
            payload.deliveryMaxDays != null
              ? Number(payload.deliveryMaxDays)
              : null,

          deliveryNote:
            payload.overrideDeliverySettings === true
              ? normalizeNullable(payload.deliveryNote)
              : null,

          sortOrder:
            Number(payload.sortOrder ?? index),
          createdBy: userId,
          updatedBy: userId,
        },
        { transaction }
      );
    }

    retainedIds.add(variant.id);

    await db.ProductVariantAttributeValue.destroy({
      where: {
        companyId,
        productVariantId: variant.id,
      },
      transaction,
    });

    if (attributeValues.length) {
      const optionIds = attributeValues.map(
        (item) => item.optionId
      );

      const options =
        await db.AttributeOption.findAll({
          where: {
            companyId,
            id: {
              [Op.in]: optionIds,
            },
          },
          include: [
            {
              model: db.Attribute,
              as: "attribute",
              required: true,
              where: {
                isVariantDefining: true,
              },
            },
          ],
          transaction,
        });

      if (options.length !== optionIds.length) {
        throw new AppError(
          "One or more variant options are invalid.",
          400,
          "PRODUCT_VARIANT_OPTION_INVALID"
        );
      }

      const optionMap = new Map(
        options.map((option) => [
          option.id,
          option,
        ])
      );

      await db.ProductVariantAttributeValue.bulkCreate(
        attributeValues.map((item, itemIndex) => {
          const option = optionMap.get(
            item.optionId
          );

          return {
            companyId,
            productVariantId: variant.id,
            attributeId:
              item.attributeId ||
              option.attributeId,
            optionId: option.id,
            displayValue:
              item.displayValue ||
              option.label,
            sortOrder: Number(
              item.sortOrder ?? itemIndex
            ),
          };
        }),
        { transaction }
      );
    }

    await db.ProductVariantChannel.destroy({
      where: {
        companyId,
        productVariantId: variant.id,
      },
      transaction,
    });

    if (Array.isArray(payload.channels)) {
      await db.ProductVariantChannel.bulkCreate(
        payload.channels.map((channel) => ({
          companyId,
          productVariantId: variant.id,
          channelCode: channel.channelCode,
          isVisible: channel.isVisible !== false,
        })),
        { transaction }
      );
    }

    await replaceVariantImages({
      companyId,
      product,
      variant,
      images: Array.isArray(payload.images)
        ? payload.images
        : [],
      transaction,
    });
  }

  const removeIds = existingVariants
    .filter(
      (variant) =>
        !retainedIds.has(variant.id)
    )
    .map((variant) => variant.id);

  if (removeIds.length) {
    await db.ProductVariant.destroy({
      where: {
        id: {
          [Op.in]: removeIds,
        },
      },
      transaction,
    });
  }
};

const getProductById = async ({
  companyId,
  productId,
  transaction,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Product Master
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Do not use PRODUCT_INCLUDE here.
  |
  | PRODUCT_INCLUDE contains multiple hasMany relationships. Joining all of
  | them into one Product query creates a very large Cartesian result set.
  |
  | Load the product and its single-record relations first, then load
  | collections separately.
  |--------------------------------------------------------------------------
  */

  const product =
    await db.Product.findOne({
      where: {
        id: productId,
        companyId,
      },

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

      transaction,
    });

  if (!product) {
    throw new AppError(
      "Product not found.",
      404,
      "PRODUCT_NOT_FOUND"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Product-Level Collections
  |--------------------------------------------------------------------------
  |
  | These are deliberately separate queries.
  |--------------------------------------------------------------------------
  */

  const [
    categoryAssignments,
    images,
    channels,
    attributeValues,
    variants,
  ] =
    await Promise.all([
      /*
      |--------------------------------------------------------------------------
      | Categories
      |--------------------------------------------------------------------------
      */

      db.ProductCategory.findAll({
        where: {
          companyId,
          productId,
        },

        include: [
          {
            model:
              db.Category,

            as:
              "category",

            required:
              false,
          },
        ],

        order: [
          [
            "displayOrder",
            "ASC",
          ],
        ],

        transaction,
      }),

      /*
      |--------------------------------------------------------------------------
      | Product Images
      |--------------------------------------------------------------------------
      |
      | variantId = null is important.
      | Variant images are loaded separately below.
      |--------------------------------------------------------------------------
      */

      db.ProductImage.findAll({
        where: {
          companyId,
          productId,
          variantId:
            null,
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

        order: [
          [
            "displayOrder",
            "ASC",
          ],
        ],

        transaction,
      }),

      /*
      |--------------------------------------------------------------------------
      | Product Channels
      |--------------------------------------------------------------------------
      */

      db.ProductChannel.findAll({
        where: {
          companyId,
          productId,
        },

        order: [
          [
            "channelCode",
            "ASC",
          ],
        ],

        transaction,
      }),

      /*
      |--------------------------------------------------------------------------
      | Product Attribute Values
      |--------------------------------------------------------------------------
      */

      db.ProductAttributeValue.findAll({
        where: {
          companyId,
          productId,
        },

        include: [
          {
            model:
              db.Attribute,

            as:
              "attribute",

            required:
              false,
          },

          {
            model:
              db.AttributeOption,

            as:
              "option",

            required:
              false,
          },
        ],

        transaction,
      }),

      /*
      |--------------------------------------------------------------------------
      | Variants
      |--------------------------------------------------------------------------
      |
      | Load ONLY the variant master here.
      |
      | Variant attributes, channels, prices and images are loaded separately
      | afterward so they cannot multiply one another in SQL.
      |--------------------------------------------------------------------------
      */

      db.ProductVariant.findAll({
        where: {
          companyId,
          productId,
        },

        order: [
          [
            "sortOrder",
            "ASC",
          ],

          [
            "createdAt",
            "ASC",
          ],
        ],

        transaction,
      }),
    ]);

  /*
  |--------------------------------------------------------------------------
  | Variant IDs
  |--------------------------------------------------------------------------
  */

  const variantIds =
    variants.map(
      (variant) =>
        variant.id
    );

  /*
  |--------------------------------------------------------------------------
  | Variant Collections
  |--------------------------------------------------------------------------
  */

  let variantAttributeValues =
    [];

  let variantChannels =
    [];

  let variantPrices =
    [];

  let variantImages =
    [];

  if (
    variantIds.length >
    0
  ) {
    [
      variantAttributeValues,
      variantChannels,
      variantPrices,
      variantImages,
    ] =
      await Promise.all([
        /*
        |--------------------------------------------------------------------------
        | Variant Attribute Values
        |--------------------------------------------------------------------------
        */

        db.ProductVariantAttributeValue.findAll(
          {
            where: {
              companyId,

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
                  false,
              },

              {
                model:
                  db.AttributeOption,

                as:
                  "option",

                required:
                  false,
              },
            ],

            transaction,
          }
        ),

        /*
        |--------------------------------------------------------------------------
        | Variant Channels
        |--------------------------------------------------------------------------
        */

        db.ProductVariantChannel.findAll(
          {
            where: {
              companyId,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },
            },

            transaction,
          }
        ),

        /*
        |--------------------------------------------------------------------------
        | Variant Prices
        |--------------------------------------------------------------------------
        */

        db.ProductVariantPrice.findAll(
          {
            where: {
              companyId,

              productVariantId: {
                [Op.in]:
                  variantIds,
              },
            },

            include: [
              {
                model:
                  db.PriceList,

                as:
                  "priceList",

                required:
                  false,
              },
            ],

            transaction,
          }
        ),

        /*
        |--------------------------------------------------------------------------
        | Variant Images
        |--------------------------------------------------------------------------
        */

        db.ProductImage.findAll({
          where: {
            companyId,

            productId,

            variantId: {
              [Op.in]:
                variantIds,
            },
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

          order: [
            [
              "displayOrder",
              "ASC",
            ],
          ],

          transaction,
        }),
      ]);
  }

  /*
  |--------------------------------------------------------------------------
  | Group Variant Collections
  |--------------------------------------------------------------------------
  */

  const groupByVariantId =
    (
      rows,
      fieldName
    ) => {
      const map =
        new Map();

      for (
        const row of
        rows
      ) {
        const key =
          String(
            row[
              fieldName
            ] ||
              ""
          );

        if (!key) {
          continue;
        }

        if (
          !map.has(
            key
          )
        ) {
          map.set(
            key,
            []
          );
        }

        map
          .get(key)
          .push(row);
      }

      return map;
    };

  const attributesByVariant =
    groupByVariantId(
      variantAttributeValues,
      "productVariantId"
    );

  const channelsByVariant =
    groupByVariantId(
      variantChannels,
      "productVariantId"
    );

  const pricesByVariant =
    groupByVariantId(
      variantPrices,
      "productVariantId"
    );

  const imagesByVariant =
    groupByVariantId(
      variantImages,
      "variantId"
    );

  /*
  |--------------------------------------------------------------------------
  | Attach Variant Collections
  |--------------------------------------------------------------------------
  */

  for (
    const variant of
    variants
  ) {
    const variantId =
      String(
        variant.id
      );

    variant.setDataValue(
      "attributeValues",
      attributesByVariant.get(
        variantId
      ) || []
    );

    variant.setDataValue(
      "channels",
      channelsByVariant.get(
        variantId
      ) || []
    );

    variant.setDataValue(
      "prices",
      pricesByVariant.get(
        variantId
      ) || []
    );

    variant.setDataValue(
      "images",
      imagesByVariant.get(
        variantId
      ) || []
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Attach Product Collections
  |--------------------------------------------------------------------------
  |
  | Keep the exact property names expected by the existing admin frontend.
  |--------------------------------------------------------------------------
  */

  product.setDataValue(
    "categoryAssignments",
    categoryAssignments
  );

  product.setDataValue(
    "images",
    images
  );

  product.setDataValue(
    "channels",
    channels
  );

  product.setDataValue(
    "attributeValues",
    attributeValues
  );

  product.setDataValue(
    "variants",
    variants
  );

  return product;
};

const listProducts = async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  brandId,
  categoryId,
  productType,
  status,
  channelCode,
  isFeatured,
  sortBy = "createdAt",
  sortDirection = "DESC",
}) => {
  const where = {
    companyId,
  };

  if (brandId) {
    where.brandId = brandId;
  }

  if (productType) {
    where.productType = productType;
  }

  if (status) {
    where.status = status;
  }

  if (typeof isFeatured === "boolean") {
    where.isFeatured = isFeatured;
  }

  if (search) {
    where[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        slug: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        parentSku: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const include = [
    {
      model: db.Brand,
      as: "brand",
      required: false,
    },
    {
      model: db.Category,
      as: "primaryCategory",
      required: false,
    },
    {
      model: db.ProductVariant,
      as: "variants",
      required: false,
      attributes: [
        "id",
        "sku",
        "barcode",
        "name",
        "status",
        "isDefault",
      ],
    },
  ];

  if (categoryId) {
    include.push({
      model: db.ProductCategory,
      as: "categoryAssignments",
      required: true,
      where: {
        categoryId,
      },
      attributes: [],
    });
  }

  if (channelCode) {
    include.push({
      model: db.ProductChannel,
      as: "channels",
      required: true,
      where: {
        channelCode,
        isVisible: true,
      },
    });
  }

  const normalizedPage = Number(page);
  const normalizedPageSize =
    Number(pageSize);

  const result =
    await db.Product.findAndCountAll({
      where,
      include,
      distinct: true,
      limit: normalizedPageSize,
      offset:
        (normalizedPage - 1) *
        normalizedPageSize,
      order: [
        [
          sortBy,
          String(sortDirection).toUpperCase(),
        ],
        ["name", "ASC"],
      ],
    });

  return {
    rows: result.rows,
    pagination: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems: result.count,
      totalPages: Math.ceil(
        result.count / normalizedPageSize
      ),
    },
  };
};

const createProduct = async ({
  companyId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const name = payload.name.trim();

    const slug =
      slugify(payload.slug || name);

    const parentSku =
      normalizeNullable(payload.parentSku);

    await ensureUniqueProductFields({
      companyId,
      slug,
      parentSku,
      transaction,
    });

    await ensureBrandAndCategories({
      companyId,
      brandId: payload.brandId || null,
      primaryCategoryId:
        payload.primaryCategoryId || null,
      categoryIds: payload.categoryIds || [],
      transaction,
    });

    const isDirectDelivery =
      payload.isDirectDelivery === true;

    await ensureDirectDeliverySupplier({
      companyId,
      isDirectDelivery,
      supplierId:
        isDirectDelivery
          ? payload.directDeliverySupplierId ||
            null
          : null,
      transaction,
    });

    const product = await db.Product.create(
      {
        companyId,
        brandId: payload.brandId || null,
        primaryCategoryId:
          payload.primaryCategoryId || null,
        name,
        slug,
        productType:
          payload.productType || "SIMPLE",
        status: payload.status || "DRAFT",
        parentSku,

        erpId:
          normalizeNullable(
            payload.erpId
          ),

        isDirectDelivery,

        directDeliverySupplierId:
          isDirectDelivery
            ? payload.directDeliverySupplierId ||
              null
            : null,

        directDeliveryLeadTimeDays:
          isDirectDelivery &&
          payload.directDeliveryLeadTimeDays !==
            undefined &&
          payload.directDeliveryLeadTimeDays !==
            null
            ? Number(
                payload.directDeliveryLeadTimeDays
              )
            : null,

        directDeliveryNote:
          isDirectDelivery
            ? normalizeNullable(
                payload.directDeliveryNote
              )
            : null,

        expressDeliveryEnabled:
          payload.expressDeliveryEnabled === true,

        expressDeliveryHours:
          payload.expressDeliveryEnabled === true
            ? Number(
                payload.expressDeliveryHours ||
                  4
              )
            : null,

        deliveryMinDays:
          payload.deliveryMinDays !== undefined &&
          payload.deliveryMinDays !== null
            ? Number(
                payload.deliveryMinDays
              )
            : null,

        deliveryMaxDays:
          payload.deliveryMaxDays !== undefined &&
          payload.deliveryMaxDays !== null
            ? Number(
                payload.deliveryMaxDays
              )
            : null,

        deliveryNote:
          normalizeNullable(
            payload.deliveryNote
          ),

        shortDescription:
          normalizeNullable(
            payload.shortDescription
          ),
        description:
          normalizeNullable(payload.description),
        features:
          normalizeStringArray(payload.features),
        whatsInTheBox:
          normalizeStringArray(
            payload.whatsInTheBox
          ),
        warrantyText:
          normalizeNullable(
            payload.warrantyText
          ),
        taxCode:
          normalizeNullable(payload.taxCode),
        taxPercent:
          Number(payload.taxPercent || 0),
        sortOrder:
          Number(payload.sortOrder || 0),
          isFeatured:
          payload.isFeatured === true,
        
        isSearchable:
          payload.isSearchable !== false,
        
        alwaysAvailableForSale:
          payload.alwaysAvailableForSale ===
          true,
        
        metaTitle:
          normalizeNullable(
            payload.metaTitle
          ),
        metaDescription:
          normalizeNullable(
            payload.metaDescription
          ),
        metaKeywords:
          normalizeNullable(
            payload.metaKeywords
          ),
        canonicalUrl:
          normalizeNullable(
            payload.canonicalUrl
          ),
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction }
    );

    await replaceCategories({
      companyId,
      product,
      primaryCategoryId:
        payload.primaryCategoryId || null,
      categoryIds: payload.categoryIds || [],
      transaction,
    });

    await replaceChannels({
      companyId,
      product,
      channels: payload.channels || [],
      transaction,
    });

    await replaceImages({
      companyId,
      product,
      images: payload.images || [],
      transaction,
    });

    await replaceProductAttributeValues({
      companyId,
      product,
      attributeValues:
        payload.attributeValues || [],
      transaction,
    });

    if (Array.isArray(payload.variants)) {
      await replaceVariants({
        companyId,
        product,
        variants: payload.variants,
        userId,
        transaction,
      });
    } else if (
      (payload.productType || "SIMPLE") ===
      "SIMPLE"
    ) {
      const simpleSku =
        parentSku ||
        `${slug.toUpperCase()}-DEFAULT`;

      await replaceVariants({
        companyId,
        product,
        userId,
        transaction,
        variants: [
          {
            sku: simpleSku,
            barcode: payload.barcode || null,
            name,
            variantKey: "DEFAULT",
            isDefault: true,
            status: payload.status || "DRAFT",
            sortOrder: 0,
            attributeValues: [],
            channels: (
              payload.channels || []
            ).map((channel) => ({
              channelCode:
                channel.channelCode,
              isVisible:
                channel.isVisible !== false,
            })),
          },
        ],
      });
    }

    await transaction.commit();

    return getProductById({
      companyId,
      productId: product.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const updateProduct = async ({
  companyId,
  productId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const product =
      await db.Product.findOne({
        where: {
          id: productId,
          companyId,
        },
        transaction,
        lock:
          transaction.LOCK.UPDATE,
      });

    if (!product) {
      throw new AppError(
        "Product not found.",
        404,
        "PRODUCT_NOT_FOUND"
      );
    }

    const name =
      payload.name !== undefined
        ? payload.name.trim()
        : product.name;

    const slug =
      payload.slug !== undefined
        ? slugify(payload.slug || name)
        : product.slug;

    const parentSku =
      payload.parentSku !== undefined
        ? normalizeNullable(payload.parentSku)
        : product.parentSku;

    await ensureUniqueProductFields({
      companyId,
      slug,
      parentSku,
      excludeId: product.id,
      transaction,
    });

    await ensureBrandAndCategories({
      companyId,
      brandId:
        payload.brandId !== undefined
          ? payload.brandId
          : product.brandId,
      primaryCategoryId:
        payload.primaryCategoryId !== undefined
          ? payload.primaryCategoryId
          : product.primaryCategoryId,
      categoryIds: payload.categoryIds || [],
      transaction,
    });

    const effectiveIsDirectDelivery =
      Object.prototype.hasOwnProperty.call(
        payload,
        "isDirectDelivery"
      )
        ? payload.isDirectDelivery === true
        : product.isDirectDelivery === true;

    const effectiveDirectDeliverySupplierId =
      effectiveIsDirectDelivery
        ? (
            Object.prototype.hasOwnProperty.call(
              payload,
              "directDeliverySupplierId"
            )
              ? payload.directDeliverySupplierId
              : product.directDeliverySupplierId
          ) ||
          null
        : null;

    await ensureDirectDeliverySupplier({
      companyId,
      isDirectDelivery:
        effectiveIsDirectDelivery,
      supplierId:
        effectiveDirectDeliverySupplierId,
      transaction,
    });

    const updateValues = {
      name,
      slug,
      parentSku,
      updatedBy: userId,
    };

    const directFields = [
      "brandId",
      "primaryCategoryId",
      "productType",
      "status",
      "taxPercent",
      "sortOrder",
      "isFeatured",
      "isSearchable",
      "alwaysAvailableForSale",
      "isDirectDelivery",
      "expressDeliveryEnabled",
    ];

    for (const field of directFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          field
        )
      ) {
        updateValues[field] =
          payload[field];
      }
    }

    /*
     * Keep supplier-fulfillment fields consistent.
     *
     * Turning direct delivery OFF clears all supplier
     * fulfillment values. Turning it ON stores the
     * validated supplier and any optional lead-time/note.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "isDirectDelivery"
      ) ||
      Object.prototype.hasOwnProperty.call(
        payload,
        "directDeliverySupplierId"
      ) ||
      Object.prototype.hasOwnProperty.call(
        payload,
        "directDeliveryLeadTimeDays"
      ) ||
      Object.prototype.hasOwnProperty.call(
        payload,
        "directDeliveryNote"
      )
    ) {
      updateValues.isDirectDelivery =
        effectiveIsDirectDelivery;

      updateValues.directDeliverySupplierId =
        effectiveIsDirectDelivery
          ? effectiveDirectDeliverySupplierId
          : null;

      updateValues.directDeliveryLeadTimeDays =
        effectiveIsDirectDelivery &&
        payload.directDeliveryLeadTimeDays !==
          undefined &&
        payload.directDeliveryLeadTimeDays !==
          null
          ? Number(
              payload.directDeliveryLeadTimeDays
            )
          : effectiveIsDirectDelivery
            ? product.directDeliveryLeadTimeDays
            : null;

      updateValues.directDeliveryNote =
        effectiveIsDirectDelivery
          ? (
              Object.prototype.hasOwnProperty.call(
                payload,
                "directDeliveryNote"
              )
                ? normalizeNullable(
                    payload.directDeliveryNote
                  )
                : product.directDeliveryNote
            )
          : null;
    }

    /*
     * Customer-facing delivery promise.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "expressDeliveryHours"
      )
    ) {
      updateValues.expressDeliveryHours =
        payload.expressDeliveryHours != null
          ? Number(
              payload.expressDeliveryHours
            )
          : null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "deliveryMinDays"
      )
    ) {
      updateValues.deliveryMinDays =
        payload.deliveryMinDays != null
          ? Number(
              payload.deliveryMinDays
            )
          : null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "deliveryMaxDays"
      )
    ) {
      updateValues.deliveryMaxDays =
        payload.deliveryMaxDays != null
          ? Number(
              payload.deliveryMaxDays
            )
          : null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "deliveryNote"
      )
    ) {
      updateValues.deliveryNote =
        normalizeNullable(
          payload.deliveryNote
        );
    }

    /*
     * If express delivery is explicitly disabled, clear the hour promise.
     * If enabled without hours, use 4 hours.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "expressDeliveryEnabled"
      )
    ) {
      if (
        payload.expressDeliveryEnabled ===
        true
      ) {
        updateValues.expressDeliveryHours =
          payload.expressDeliveryHours != null
            ? Number(
                payload.expressDeliveryHours
              )
            : product.expressDeliveryHours ||
              4;
      } else {
        updateValues.expressDeliveryHours =
          null;
      }
    }

    const nullableFields = [
      "erpId",
      "shortDescription",
      "description",
      "warrantyText",
      "taxCode",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
      "canonicalUrl",
    ];

    for (const field of nullableFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          field
        )
      ) {
        updateValues[field] =
          normalizeNullable(payload[field]);
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "features"
      )
    ) {
      updateValues.features =
        normalizeStringArray(payload.features);
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "whatsInTheBox"
      )
    ) {
      updateValues.whatsInTheBox =
        normalizeStringArray(
          payload.whatsInTheBox
        );
    }

    await product.update(
      updateValues,
      { transaction }
    );

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "categoryIds"
      ) ||
      Object.prototype.hasOwnProperty.call(
        payload,
        "primaryCategoryId"
      )
    ) {
      await replaceCategories({
        companyId,
        product,
        primaryCategoryId:
          payload.primaryCategoryId !== undefined
            ? payload.primaryCategoryId
            : product.primaryCategoryId,
        categoryIds:
          payload.categoryIds || [],
        transaction,
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "channels"
      )
    ) {
      await replaceChannels({
        companyId,
        product,
        channels: payload.channels,
        transaction,
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "images"
      )
    ) {
      await replaceImages({
        companyId,
        product,
        images: payload.images,
        transaction,
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "attributeValues"
      )
    ) {
      await replaceProductAttributeValues({
        companyId,
        product,
        attributeValues:
          payload.attributeValues,
        transaction,
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "variants"
      )
    ) {
      await replaceVariants({
        companyId,
        product,
        variants: payload.variants,
        userId,
        transaction,
      });
    }

    await transaction.commit();

    return getProductById({
      companyId,
      productId: product.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const changeProductStatus = async ({
  companyId,
  productId,
  userId,
  status,
}) => {
  const product =
    await db.Product.findOne({
      where: {
        id: productId,
        companyId,
      },
    });

  if (!product) {
    throw new AppError(
      "Product not found.",
      404,
      "PRODUCT_NOT_FOUND"
    );
  }

  await product.update({
    status,
    updatedBy: userId,
  });

  return getProductById({
    companyId,
    productId,
  });
};

const generateVariants = async ({
  companyId,
  productId,
  userId,
  attributeSelections,
  replaceExisting = false,
  skuPrefix,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const product =
      await db.Product.findOne({
        where: {
          id: productId,
          companyId,
        },
        transaction,
        lock:
          transaction.LOCK.UPDATE,
      });

    if (!product) {
      throw new AppError(
        "Product not found.",
        404,
        "PRODUCT_NOT_FOUND"
      );
    }

    if (product.productType !== "VARIABLE") {
      throw new AppError(
        "Variant generation is only available for VARIABLE products.",
        400,
        "PRODUCT_NOT_VARIABLE"
      );
    }

    const attributeIds =
      attributeSelections.map(
        (selection) => selection.attributeId
      );

    const attributes =
      await db.Attribute.findAll({
        where: {
          companyId,
          id: {
            [Op.in]: attributeIds,
          },
          isVariantDefining: true,
          isActive: true,
        },
        transaction,
      });

    if (attributes.length !== attributeIds.length) {
      throw new AppError(
        "One or more selected attributes cannot generate variants.",
        400,
        "PRODUCT_VARIANT_ATTRIBUTE_INVALID"
      );
    }

    const allOptionIds = [
      ...new Set(
        attributeSelections.flatMap(
          (selection) => selection.optionIds
        )
      ),
    ];

    const options =
      await db.AttributeOption.findAll({
        where: {
          companyId,
          id: {
            [Op.in]: allOptionIds,
          },
          isActive: true,
        },
        transaction,
      });

    if (options.length !== allOptionIds.length) {
      throw new AppError(
        "One or more selected attribute options were not found.",
        400,
        "PRODUCT_VARIANT_OPTION_INVALID"
      );
    }

    const optionMap = new Map(
      options.map((option) => [
        option.id,
        option,
      ])
    );

    const groups =
      attributeSelections.map(
        (selection) =>
          selection.optionIds.map((optionId) => {
            const option = optionMap.get(optionId);

            if (
              option.attributeId !==
              selection.attributeId
            ) {
              throw new AppError(
                `Option "${option.label}" does not belong to the selected attribute.`,
                400,
                "PRODUCT_VARIANT_OPTION_ATTRIBUTE_MISMATCH"
              );
            }

            return {
              attributeId:
                selection.attributeId,
              optionId: option.id,
              optionLabel: option.label,
              optionValue: option.value,
            };
          })
      );

    const combinations =
      cartesianProduct(groups);

    if (combinations.length > 1000) {
      throw new AppError(
        "Variant generation would create more than 1,000 variants. Reduce the selected options.",
        400,
        "PRODUCT_VARIANT_LIMIT_EXCEEDED"
      );
    }

    const existingVariants =
      await db.ProductVariant.findAll({
        where: {
          companyId,
          productId: product.id,
        },
        transaction,
      });

    const existingKeyMap = new Map(
      existingVariants.map((variant) => [
        variant.variantKey,
        variant,
      ])
    );

    const generated = [];

    for (
      let index = 0;
      index < combinations.length;
      index += 1
    ) {
      const combination = combinations[index];

      const variantKey =
        buildVariantKey(combination);

      if (
        existingKeyMap.has(variantKey) &&
        !replaceExisting
      ) {
        generated.push(
          existingKeyMap.get(variantKey)
        );
        continue;
      }

      const name = [
        product.name,
        ...combination.map(
          (item) => item.optionLabel
        ),
      ].join(" - ");

      const sku = generateVariantSku({
        parentSku:
          skuPrefix ||
          product.parentSku ||
          product.slug,
        sequence: index + 1,
        optionCodes:
          combination.map(
            (item) => item.optionValue
          ),
      });

      await ensureUniqueVariantFields({
        companyId,
        sku,
        barcode: null,
        excludeId:
          existingKeyMap.get(variantKey)?.id ||
          null,
        transaction,
      });

      let variant =
        existingKeyMap.get(variantKey);

      if (variant) {
        await variant.update(
          {
            sku,
            name,
            status: product.status,
            sortOrder: index,
            updatedBy: userId,
          },
          { transaction }
        );

        await db.ProductVariantAttributeValue.destroy({
          where: {
            companyId,
            productVariantId: variant.id,
          },
          transaction,
        });
      } else {
        variant =
          await db.ProductVariant.create(
            {
              companyId,
              productId: product.id,
              sku,
              barcode: null,
              name,
              variantKey,
              isDefault: index === 0,
              status: product.status,
              sortOrder: index,
              createdBy: userId,
              updatedBy: userId,
            },
            { transaction }
          );
      }

      await db.ProductVariantAttributeValue.bulkCreate(
        combination.map((item, itemIndex) => ({
          companyId,
          productVariantId: variant.id,
          attributeId: item.attributeId,
          optionId: item.optionId,
          displayValue: item.optionLabel,
          sortOrder: itemIndex,
        })),
        { transaction }
      );

      const productChannels =
        await db.ProductChannel.findAll({
          where: {
            companyId,
            productId: product.id,
          },
          transaction,
        });

      await db.ProductVariantChannel.destroy({
        where: {
          companyId,
          productVariantId: variant.id,
        },
        transaction,
      });

      if (productChannels.length) {
        await db.ProductVariantChannel.bulkCreate(
          productChannels.map((channel) => ({
            companyId,
            productVariantId: variant.id,
            channelCode: channel.channelCode,
            isVisible: channel.isVisible,
          })),
          { transaction }
        );
      }

      generated.push(variant);
    }

    if (replaceExisting) {
      const generatedKeys = new Set(
        combinations.map(buildVariantKey)
      );

      const removeIds =
        existingVariants
          .filter(
            (variant) =>
              !generatedKeys.has(
                variant.variantKey
              )
          )
          .map((variant) => variant.id);

      if (removeIds.length) {
        await db.ProductVariant.destroy({
          where: {
            id: {
              [Op.in]: removeIds,
            },
          },
          transaction,
        });
      }
    }

    await transaction.commit();

    return getProductById({
      companyId,
      productId: product.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const deleteProduct = async ({
  companyId,
  productId,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const product =
      await db.Product.findOne({
        where: {
          id: productId,
          companyId,
        },
        transaction,
      });

    if (!product) {
      throw new AppError(
        "Product not found.",
        404,
        "PRODUCT_NOT_FOUND"
      );
    }

    const productVariants =
  await db.ProductVariant.findAll({
    where: {
      companyId,
      productId,
    },
    attributes: ["id"],
    transaction,
  });

const variantIds =
  productVariants.map(
    (variant) => variant.id
  );

if (variantIds.length) {
  await db.ProductVariantPrice.destroy({
    where: {
      companyId,
      productVariantId: {
        [Op.in]: variantIds,
      },
    },
    transaction,
  });
}



    await db.ProductVariant.destroy({
      where: {
        companyId,
        productId,
      },
      transaction,
    });

    await db.ProductAttributeValue.destroy({
      where: {
        companyId,
        productId,
      },
      transaction,
    });

    await db.ProductImage.destroy({
      where: {
        companyId,
        productId,
      },
      transaction,
    });

    await db.ProductChannel.destroy({
      where: {
        companyId,
        productId,
      },
      transaction,
    });

    await db.ProductCategory.destroy({
      where: {
        companyId,
        productId,
      },
      transaction,
    });

    await product.destroy({
      transaction,
    });

    await transaction.commit();

    return {
      id: productId,
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  changeProductStatus,
  generateVariants,
  deleteProduct,
};
