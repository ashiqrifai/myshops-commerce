const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../../../models"
  );

const {
  COLUMN_PREFIX,
  CSV_DELIMITERS,
} = require(
  "../productImport.constants"
);

const {
  clean,
  cleanUpper,
} = require(
  "../productImport.utils"
);

const {
  buildTemplateHeaders,
  convertRowsToCsv,
  loadTemplateReferences,
} = require(
  "./template.service"
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const asPlain = (
  value
) => {
  if (!value) {
    return value;
  }

  return typeof value.get ===
    "function"
    ? value.get({
        plain: true,
      })
    : value;
};

const groupBy = (
  rows,
  key
) => {
  const map =
    new Map();

  for (const value of rows) {
    const row =
      asPlain(value);

    const groupKey =
      row?.[key];

    if (!groupKey) {
      continue;
    }

    if (!map.has(groupKey)) {
      map.set(
        groupKey,
        []
      );
    }

    map
      .get(groupKey)
      .push(row);
  }

  return map;
};

const parseBoolean = (
  value
) => {
  if (
    value === true ||
    String(value)
      .trim()
      .toUpperCase() ===
      "TRUE"
  ) {
    return true;
  }

  if (
    value === false ||
    String(value)
      .trim()
      .toUpperCase() ===
      "FALSE"
  ) {
    return false;
  }

  return undefined;
};

const splitCsv = (
  value
) =>
  String(value || "")
    .split(",")
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);

const toCsvBoolean = (
  value
) =>
  value === true
    ? "TRUE"
    : "FALSE";

const joinList = (
  values
) =>
  [
    ...new Set(
      (values || [])
        .map(clean)
        .filter(Boolean)
    ),
  ].join(
    CSV_DELIMITERS.LIST
  );

const formatDateValue = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return clean(value);
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
};

const formatJsonValue = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return JSON.stringify(
    value
  );
};

const getAttributeDisplayValue = (
  value
) => {
  if (
    value.displayValue !==
      null &&
    value.displayValue !==
      undefined &&
    value.displayValue !==
      ""
  ) {
    return String(
      value.displayValue
    );
  }

  if (
    value.option?.label
  ) {
    return String(
      value.option.label
    );
  }

  if (
    value.textValue !==
      null &&
    value.textValue !==
      undefined
  ) {
    return String(
      value.textValue
    );
  }

  if (
    value.numberValue !==
      null &&
    value.numberValue !==
      undefined
  ) {
    return String(
      value.numberValue
    );
  }

  if (
    value.booleanValue !==
      null &&
    value.booleanValue !==
      undefined
  ) {
    return toCsvBoolean(
      value.booleanValue
    );
  }

  if (
    value.dateValue
  ) {
    return formatDateValue(
      value.dateValue
    );
  }

  if (
    value.jsonValue !==
      null &&
    value.jsonValue !==
      undefined
  ) {
    return formatJsonValue(
      value.jsonValue
    );
  }

  return "";
};

const sanitizeGroupCode = (
  value
) => {
  const result =
    cleanUpper(value)
      .replace(
        /[^A-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );

  return result ||
    "MEDIA_GROUP";
};

const createExportError = (
  message,
  statusCode,
  code
) => {
  const error =
    new Error(message);

  error.statusCode =
    statusCode;

  error.code =
    code;

  return error;
};

/*
|--------------------------------------------------------------------------
| Media References
|--------------------------------------------------------------------------
*/

const buildMediaReferenceResolver = (
  mediaAssets
) => {
  const fileNameCounts =
    new Map();

  for (
    const media of
    mediaAssets
  ) {
    const fileName =
      clean(
        media.originalFileName
      ).toLowerCase();

    if (!fileName) {
      continue;
    }

    fileNameCounts.set(
      fileName,
      (
        fileNameCounts.get(
          fileName
        ) || 0
      ) + 1
    );
  }

  return (
    media
  ) => {
    if (!media) {
      return "";
    }

    const fileName =
      clean(
        media.originalFileName
      );

    if (
      fileName &&
      fileNameCounts.get(
        fileName.toLowerCase()
      ) === 1
    ) {
      return fileName;
    }

    return media.id || "";
  };
};

const sortImages = (
  images
) =>
  [...(images || [])]
    .filter(
      (image) =>
        image.isActive !==
        false
    )
    .sort(
      (first, second) =>
        Number(
          first.displayOrder ||
          0
        ) -
          Number(
            second.displayOrder ||
            0
          ) ||
        String(
          first.id || ""
        ).localeCompare(
          String(
            second.id || ""
          )
        )
    );

const buildMediaColumns = ({
  images,
  resolveMediaReference,
}) => {
  const sorted =
    sortImages(
      images
    );

  const primary =
    sorted.find(
      (image) =>
        image.imageRole ===
        "PRIMARY"
    ) ||
    sorted.find(
      (image) =>
        image.imageRole !==
        "VIDEO"
    ) ||
    null;

  const gallery =
    sorted.filter(
      (image) =>
        image.id !==
          primary?.id &&
        image.imageRole !==
          "SWATCH" &&
        image.imageRole !==
          "VIDEO"
    );

  const swatch =
    sorted.find(
      (image) =>
        image.imageRole ===
        "SWATCH"
    ) ||
    null;

  return {
    primary:
      primary
        ? resolveMediaReference(
            primary.mediaAsset
          )
        : "",

    primaryTitle:
      clean(
        primary?.title
      ),

    primaryAltText:
      clean(
        primary?.altText
      ),

    gallery:
      joinList(
        gallery.map(
          (image) =>
            resolveMediaReference(
              image.mediaAsset
            )
        )
      ),

    swatch:
      swatch
        ? resolveMediaReference(
            swatch.mediaAsset
          )
        : "",
  };
};

const getMediaSignature = (
  images
) =>
  JSON.stringify(
    sortImages(
      images
    ).map(
      (image) => ({
        mediaAssetId:
          image.mediaAssetId,

        imageRole:
          image.imageRole,

        displayOrder:
          Number(
            image.displayOrder ||
            0
          ),
      })
    )
  );

/*
|--------------------------------------------------------------------------
| Export Data Loading
|--------------------------------------------------------------------------
*/

const resolveFilteredProductIds =
  async ({
    companyId,
    categoryId,
    channelCode,
    productIds,
  }) => {
    let resolvedIds =
      productIds?.length
        ? new Set(
            productIds
          )
        : null;

    if (categoryId) {
      const assignments =
        await db.ProductCategory
          .findAll({
            where: {
              companyId,
              categoryId,
            },

            attributes: [
              "productId",
            ],
          });

      const categoryIds =
        new Set(
          assignments.map(
            (assignment) =>
              assignment.productId
          )
        );

      resolvedIds =
        resolvedIds
          ? new Set(
              [
                ...resolvedIds,
              ].filter(
                (id) =>
                  categoryIds.has(
                    id
                  )
              )
            )
          : categoryIds;
    }

    if (channelCode) {
      const channels =
        await db.ProductChannel
          .findAll({
            where: {
              companyId,
              channelCode,
            },

            attributes: [
              "productId",
            ],
          });

      const channelIds =
        new Set(
          channels.map(
            (entry) =>
              entry.productId
          )
        );

      resolvedIds =
        resolvedIds
          ? new Set(
              [
                ...resolvedIds,
              ].filter(
                (id) =>
                  channelIds.has(
                    id
                  )
              )
            )
          : channelIds;
    }

    return resolvedIds
      ? [
          ...resolvedIds,
        ]
      : null;
  };

const loadProductsForExport =
  async ({
    companyId,
    filters,
  }) => {
    const requestedIds =
      splitCsv(
        filters.productIds
      );

    const filteredProductIds =
      await resolveFilteredProductIds({
        companyId,
        categoryId:
          clean(
            filters.categoryId
          ) || null,
        channelCode:
          cleanUpper(
            filters.channelCode
          ) || null,
        productIds:
          requestedIds,
      });

    if (
      filteredProductIds &&
      !filteredProductIds.length
    ) {
      return [];
    }

    const where = {
      companyId,
    };

    if (
      filteredProductIds
    ) {
      where.id = {
        [Op.in]:
          filteredProductIds,
      };
    }

    if (
      clean(
        filters.status
      )
    ) {
      where.status =
        cleanUpper(
          filters.status
        );
    }

    if (
      clean(
        filters.productType
      )
    ) {
      where.productType =
        cleanUpper(
          filters.productType
        );
    }

    if (
      clean(
        filters.brandId
      )
    ) {
      where.brandId =
        clean(
          filters.brandId
        );
    }

    const featured =
      parseBoolean(
        filters.isFeatured
      );

    if (
      featured !==
      undefined
    ) {
      where.isFeatured =
        featured;
    }

    if (
      clean(
        filters.search
      )
    ) {
      const search =
        clean(
          filters.search
        );

      where[Op.or] = [
        {
          name: {
            [Op.iLike]:
              `%${search}%`,
          },
        },

        {
          slug: {
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
      ];
    }

    return db.Product.findAll({
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
          "name",
          "ASC",
        ],
        [
          "createdAt",
          "ASC",
        ],
      ],
    });
  };

const loadExportChildren =
  async ({
    companyId,
    products,
  }) => {
    const productIds =
      products.map(
        (product) =>
          product.id
      );

    if (!productIds.length) {
      return {
        categoryAssignments: [],
        collectionAssignments: [],
        productChannels: [],
        productImages: [],
        productAttributes: [],
        variants: [],
        variantAttributes: [],
        variantPrices: [],
        variantImages: [],
        mediaAssets: [],
      };
    }

    const [
      categoryAssignments,
      collectionAssignments,
      productChannels,
      productImages,
      productAttributes,
      variants,
    ] =
      await Promise.all([
        db.ProductCategory.findAll({
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },
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
        }),

        db.ProductCollection.findAll({
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },
          },

          include: [
            {
              model:
                db.Collection,

              as:
                "collection",

              required:
                false,
            },
          ],
        }),

        db.ProductChannel.findAll({
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },
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
        }),

        db.ProductAttributeValue.findAll({
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
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
        }),

        db.ProductVariant.findAll({
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },
          },

          order: [
            [
              "productId",
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
      ]);

    const variantIds =
      variants.map(
        (variant) =>
          variant.id
      );

    let variantAttributes =
      [];

    let variantPrices =
      [];

    let variantImages =
      [];

    if (variantIds.length) {
      [
        variantAttributes,
        variantPrices,
        variantImages,
      ] =
        await Promise.all([
          db.ProductVariantAttributeValue
            .findAll({
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
            }),

          db.ProductVariantPrice.findAll({
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
          }),

          db.ProductImage.findAll({
            where: {
              companyId,

              productId: {
                [Op.in]:
                  productIds,
              },

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
          }),
        ]);
    }

    const allImages = [
      ...productImages,
      ...variantImages,
    ];

    const mediaAssets =
      [
        ...new Map(
          allImages
            .map(
              (image) =>
                asPlain(
                  image
                ).mediaAsset
            )
            .filter(Boolean)
            .map(
              (asset) => [
                asset.id,
                asset,
              ]
            )
        ).values(),
      ];

    return {
      categoryAssignments:
        categoryAssignments.map(
          asPlain
        ),

      collectionAssignments:
        collectionAssignments.map(
          asPlain
        ),

      productChannels:
        productChannels.map(
          asPlain
        ),

      productImages:
        productImages.map(
          asPlain
        ),

      productAttributes:
        productAttributes.map(
          asPlain
        ),

      variants:
        variants.map(
          asPlain
        ),

      variantAttributes:
        variantAttributes.map(
          asPlain
        ),

      variantPrices:
        variantPrices.map(
          asPlain
        ),

      variantImages:
        variantImages.map(
          asPlain
        ),

      mediaAssets,
    };
  };

/*
|--------------------------------------------------------------------------
| Media Group Builder
|--------------------------------------------------------------------------
*/

const buildVariantMediaGroups = ({
  variants,
  imagesByVariant,
  attributesByVariant,
}) => {
  const signatureVariants =
    new Map();

  for (const variant of variants) {
    const signature =
      getMediaSignature(
        imagesByVariant.get(
          variant.id
        ) || []
      );

    if (
      signature ===
      "[]"
    ) {
      continue;
    }

    if (
      !signatureVariants.has(
        signature
      )
    ) {
      signatureVariants.set(
        signature,
        []
      );
    }

    signatureVariants
      .get(signature)
      .push(variant);
  }

  const groupByVariantId =
    new Map();

  const definitionVariantIds =
    new Set();

  const usedCodes =
    new Set();

  let sequence = 1;

  for (
    const [
      signature,
      matchingVariants,
    ] of signatureVariants
  ) {
    if (
      matchingVariants.length <
      2
    ) {
      continue;
    }

    const firstVariant =
      matchingVariants[0];

    const colorValue =
      (
        attributesByVariant.get(
          firstVariant.id
        ) || []
      ).find(
        (value) =>
          cleanUpper(
            value.attribute?.code
          ) ===
            "COLOR" ||
          cleanUpper(
            value.attribute?.name
          ) ===
            "COLOR"
      );

    let baseCode =
      sanitizeGroupCode(
        getAttributeDisplayValue(
          colorValue || {}
        ) ||
        `MEDIA_GROUP_${sequence}`
      );

    let code =
      baseCode;

    let suffix =
      2;

    while (
      usedCodes.has(
        code
      )
    ) {
      code =
        `${baseCode}_${suffix}`;

      suffix += 1;
    }

    usedCodes.add(
      code
    );

    sequence += 1;

    for (
      const variant of
      matchingVariants
    ) {
      groupByVariantId.set(
        variant.id,
        code
      );
    }

    definitionVariantIds.add(
      firstVariant.id
    );
  }

  return {
    groupByVariantId,
    definitionVariantIds,
  };
};

/*
|--------------------------------------------------------------------------
| Row Builder
|--------------------------------------------------------------------------
*/

const buildRows = ({
  products,
  references,
  children,
}) => {
  const categoriesByProduct =
    groupBy(
      children.categoryAssignments,
      "productId"
    );

  const collectionsByProduct =
    groupBy(
      children.collectionAssignments,
      "productId"
    );

  const channelsByProduct =
    groupBy(
      children.productChannels,
      "productId"
    );

  const imagesByProduct =
    groupBy(
      children.productImages,
      "productId"
    );

  const specificationsByProduct =
    groupBy(
      children.productAttributes,
      "productId"
    );

  const variantsByProduct =
    groupBy(
      children.variants,
      "productId"
    );

  const attributesByVariant =
    groupBy(
      children.variantAttributes,
      "productVariantId"
    );

  const pricesByVariant =
    groupBy(
      children.variantPrices,
      "productVariantId"
    );

  const imagesByVariant =
    groupBy(
      children.variantImages,
      "variantId"
    );

  const resolveMediaReference =
    buildMediaReferenceResolver(
      children.mediaAssets
    );

  const rows = [];

  for (
    const productModel of
    products
  ) {
    const product =
      asPlain(
        productModel
      );

    const categoryAssignments =
      categoriesByProduct.get(
        product.id
      ) || [];

    const additionalCategorySlugs =
      categoryAssignments
        .filter(
          (assignment) =>
            assignment.category &&
            assignment.category.id !==
              product.primaryCategoryId
        )
        .sort(
          (first, second) =>
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
          (assignment) =>
            assignment.category.slug
        );

    const collectionSlugs =
      (
        collectionsByProduct.get(
          product.id
        ) || []
      )
        .map(
          (assignment) =>
            assignment.collection?.slug
        )
        .filter(Boolean);

    const channels =
      channelsByProduct.get(
        product.id
      ) || [];

    const website =
      channels.find(
        (entry) =>
          entry.channelCode ===
          "WEBSITE"
      );

    const kiosk =
      channels.find(
        (entry) =>
          entry.channelCode ===
          "KIOSK"
      );

    const productMedia =
      buildMediaColumns({
        images:
          imagesByProduct.get(
            product.id
          ) || [],

        resolveMediaReference,
      });

    const specifications =
      specificationsByProduct.get(
        product.id
      ) || [];

    let variants =
      variantsByProduct.get(
        product.id
      ) || [];

    if (!variants.length) {
      variants = [
        {
          id:
            `__EMPTY_${product.id}`,

          productId:
            product.id,

          sku:
            product.parentSku ||
            "",

          barcode:
            null,

          name:
            product.name,

          status:
            product.status,

          isDefault:
            true,

          sortOrder:
            0,
        },
      ];
    }

    const {
      groupByVariantId,
      definitionVariantIds,
    } =
      buildVariantMediaGroups({
        variants,
        imagesByVariant,
        attributesByVariant,
      });

    for (
      const variant of
      variants
    ) {
      const row = {
        parentSku:
          product.parentSku ||
          "",

        name:
          product.name,

        slug:
          product.slug,

        productType:
          product.productType,

        status:
          product.status,

        brandCode:
          product.brand?.code ||
          "",

        primaryCategorySlug:
          product.primaryCategory
            ?.slug ||
          "",

        categorySlugs:
          joinList(
            additionalCategorySlugs
          ),

        shortDescription:
          product.shortDescription ||
          "",

        description:
          product.description ||
          "",

        features:
          joinList(
            Array.isArray(
              product.features
            )
              ? product.features
              : []
          ),

        whatsInTheBox:
          joinList(
            Array.isArray(
              product.whatsInTheBox
            )
              ? product.whatsInTheBox
              : []
          ),

        warrantyText:
          product.warrantyText ||
          "",

        taxCode:
          product.taxCode ||
          "",

        taxPercent:
          product.taxPercent ??
          "",

        sortOrder:
          product.sortOrder ??
          0,

        isFeatured:
          toCsvBoolean(
            product.isFeatured
          ),

        isSearchable:
          toCsvBoolean(
            product.isSearchable !==
            false
          ),

        websiteVisible:
          toCsvBoolean(
            website?.isVisible ===
            true
          ),

        websitePublishStatus:
          website
            ?.publishStatus ||
          "DRAFT",

        websiteTitle:
          website
            ?.channelTitle ||
          "",

        websiteDescription:
          website
            ?.channelDescription ||
          "",

        kioskVisible:
          toCsvBoolean(
            kiosk?.isVisible ===
            true
          ),

        kioskPublishStatus:
          kiosk
            ?.publishStatus ||
          "DRAFT",

        kioskTitle:
          kiosk
            ?.channelTitle ||
          "",

        kioskDescription:
          kiosk
            ?.channelDescription ||
          "",

        metaTitle:
          product.metaTitle ||
          "",

        metaDescription:
          product.metaDescription ||
          "",

        metaKeywords:
          product.metaKeywords ||
          "",

        canonicalUrl:
          product.canonicalUrl ||
          "",

        collectionSlugs:
          joinList(
            collectionSlugs
          ),

        mediaImportMode:
          "REPLACE",

        primaryMediaAssetId:
          productMedia.primary,

        primaryImageTitle:
          productMedia.primaryTitle,

        primaryImageAltText:
          productMedia.primaryAltText,

        galleryMediaAssetIds:
          productMedia.gallery,

        variantSku:
          variant.sku ||
          "",

        barcode:
          variant.barcode ||
          "",

        variantName:
          variant.name ||
          "",

        variantStatus:
          variant.status ||
          product.status,

        variantSortOrder:
          variant.sortOrder ??
          0,

        isDefault:
          toCsvBoolean(
            variant.isDefault ===
            true
          ),

        weight:
          variant.weight ??
          "",

        weightUnit:
          variant.weightUnit ||
          "",

        length:
          variant.length ??
          "",

        width:
          variant.width ??
          "",

        height:
          variant.height ??
          "",

        dimensionUnit:
          variant.dimensionUnit ||
          "",

        variantMediaGroup:
          groupByVariantId.get(
            variant.id
          ) || "",

        variantMediaImportMode:
          "REPLACE",

        variantPrimaryMediaAssetId:
          "",

        variantGalleryMediaAssetIds:
          "",

        variantSwatchMediaAssetId:
          "",

        variantMediaAssetId:
          "",

        variantImageRole:
          "",

        variantImageTitle:
          "",

        variantImageAltText:
          "",
      };

      for (
        const specification of
        specifications
      ) {
        const code =
          cleanUpper(
            specification.attribute
              ?.code
          );

        if (!code) {
          continue;
        }

        row[
          `${COLUMN_PREFIX.SPECIFICATION}${code}`
        ] =
          getAttributeDisplayValue(
            specification
          );
      }

      const variantAttributes =
        attributesByVariant.get(
          variant.id
        ) || [];

      for (
        const attributeValue of
        variantAttributes
      ) {
        const code =
          cleanUpper(
            attributeValue.attribute
              ?.code
          );

        if (!code) {
          continue;
        }

        row[
          `${COLUMN_PREFIX.VARIANT_ATTRIBUTE}${code}`
        ] =
          getAttributeDisplayValue(
            attributeValue
          );
      }

      const variantPrices =
        pricesByVariant.get(
          variant.id
        ) || [];

      for (
        const price of
        variantPrices
      ) {
        const priceListCode =
          cleanUpper(
            price.priceList?.code
          );

        if (!priceListCode) {
          continue;
        }

        row[
          `${COLUMN_PREFIX.REGULAR_PRICE}${priceListCode}`
        ] =
          price.regularPrice ??
          "";

        row[
          `${COLUMN_PREFIX.SELLING_PRICE}${priceListCode}`
        ] =
          price.sellingPrice ??
          "";

        row[
          `${COLUMN_PREFIX.COMPARE_AT_PRICE}${priceListCode}`
        ] =
          price.compareAtPrice ??
          "";

        row[
          `${COLUMN_PREFIX.COST_PRICE}${priceListCode}`
        ] =
          price.costPrice ??
          "";
      }

      const mediaGroup =
        groupByVariantId.get(
          variant.id
        );

      const shouldWriteMedia =
        !mediaGroup ||
        definitionVariantIds.has(
          variant.id
        );

      if (shouldWriteMedia) {
        const variantMedia =
          buildMediaColumns({
            images:
              imagesByVariant.get(
                variant.id
              ) || [],

            resolveMediaReference,
          });

        row.variantPrimaryMediaAssetId =
          variantMedia.primary;

        row.variantGalleryMediaAssetIds =
          variantMedia.gallery;

        row.variantSwatchMediaAssetId =
          variantMedia.swatch;

        row.variantImageTitle =
          variantMedia.primaryTitle;

        row.variantImageAltText =
          variantMedia.primaryAltText;
      }

      rows.push(
        row
      );
    }
  }

  return rows;
};

/*
|--------------------------------------------------------------------------
| Main Export
|--------------------------------------------------------------------------
*/

const exportProductsToCsv =
  async ({
    companyId,
    filters = {},
    includeBom = true,
  }) => {
    if (!companyId) {
      throw createExportError(
        "companyId is required.",
        400,
        "PRODUCT_EXPORT_COMPANY_REQUIRED"
      );
    }

    const [
      references,
      products,
    ] =
      await Promise.all([
        loadTemplateReferences({
          companyId,
        }),

        loadProductsForExport({
          companyId,
          filters,
        }),
      ]);

    const headers =
      buildTemplateHeaders({
        attributes:
          references.attributes,

        priceLists:
          references.priceLists,
      });

    if (!products.length) {
      const csv =
        convertRowsToCsv({
          headers,
          rows: [],
          includeBom,
        });

      return {
        fileName:
          `product-export-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`,

        mimeType:
          "text/csv; charset=utf-8",

        headers,
        rows: [],
        csv,

        summary: {
          productCount: 0,
          variantRowCount: 0,
        },
      };
    }

    const children =
      await loadExportChildren({
        companyId,
        products,
      });

    const rows =
      buildRows({
        products,
        references,
        children,
      });

    const csv =
      convertRowsToCsv({
        headers,
        rows,
        includeBom,
      });

    return {
      fileName:
        `product-export-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,

      mimeType:
        "text/csv; charset=utf-8",

      headers,
      rows,
      csv,

      summary: {
        productCount:
          products.length,

        variantRowCount:
          rows.length,
      },
    };
  };

module.exports = {
  exportProductsToCsv,
  loadProductsForExport,
  loadExportChildren,
  buildRows,
  buildVariantMediaGroups,
  buildMediaColumns,
  getMediaSignature,
};
