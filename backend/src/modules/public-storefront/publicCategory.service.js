const { Op } = require("sequelize");

const db = require("../../models");

const publicAvailabilityService =
  require(
    "./publicAvailability.service"
  );

  const giftVoucherPromotionService =
  require(
    "../gift-voucher-promotions/giftVoucherPromotion.service"
  );


const AppError = require("../../utils/AppError");

const toPlain = (value) =>
  value && typeof value.get === "function"
    ? value.get({ plain: true })
    : value;

const absoluteUrl = (value, apiBaseUrl) => {
  if (!value) return null;
  const url = String(value).trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(apiBaseUrl || "").replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return base ? `${base}${path}` : path;
};

const publicMedia = (asset, apiBaseUrl) => {
  if (!asset) return null;
  const item = toPlain(asset);

  return {
    id: item.id,
    title: item.title || null,
    altText: item.altText || null,
    caption: item.caption || null,
    assetType: item.assetType,
    classification: item.classification,
    mimeType: item.mimeType,
    width: item.width,
    height: item.height,
    orientation: item.orientation,
    dominantColor: item.dominantColor,
    publicUrl: absoluteUrl(item.publicUrl || item.storagePath, apiBaseUrl),
    thumbnailUrl: absoluteUrl(
      item.thumbnailPath ? `/media/${item.thumbnailPath}` : null,
      apiBaseUrl
    ),
    previewUrl: absoluteUrl(
      item.previewPath ? `/media/${item.previewPath}` : null,
      apiBaseUrl
    ),
    variants: (item.variants || [])
      .filter((variant) => variant.isActive === true)
      .map((variant) => ({
        id: variant.id,
        variantType: variant.variantType,
        format: variant.format,
        mimeType: variant.mimeType,
        width: variant.width,
        height: variant.height,
        isPrimary: variant.isPrimary === true,
        publicUrl: absoluteUrl(
          variant.publicUrl || variant.storagePath,
          apiBaseUrl
        ),
      }))
      .filter((variant) => variant.publicUrl),
  };
};

/*
|--------------------------------------------------------------------------
| Product Card Media Include
|--------------------------------------------------------------------------
|
| Category / brand listing cards display one product image and do not need
| the complete DAM variant collection.
|
| Keep only:
|
| - THUMBNAIL AVIF
| - SMALL AVIF
| - MEDIUM AVIF
|
| MEDIUM is retained so larger desktop product cards still have a
| high-quality source.
|--------------------------------------------------------------------------
*/

const productCardMediaInclude = (
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

      separate:
        true,

      where: {
        companyId,

        isActive:
          true,

        variantType: {
          [Op.in]: [
            "THUMBNAIL",
            "SMALL",
            "MEDIUM",
          ],
        },

        format: {
          [Op.in]: [
            "avif",
          ],
        },
      },

      order: [
        [
          "variantType",
          "ASC",
        ],

        [
          "createdAt",
          "ASC",
        ],
      ],
    },
  ],
});

const mediaInclude = (companyId, as) => ({
  model: db.MediaAsset,
  as,
  required: false,
  where: {
    companyId,
    status: "READY",
    isPublic: true,
    isActive: true,
  },
  include: [
    {
      model: db.MediaAssetVariant,
      as: "variants",
      required: false,
      where: { companyId, isActive: true },
    },
  ],
});

const publicCategory = (categoryModel, apiBaseUrl) => {
  const category = toPlain(categoryModel);
  const thumbnailAsset = publicMedia(category.thumbnailAsset, apiBaseUrl);
  const imageAsset = publicMedia(category.imageAsset, apiBaseUrl);
  const bannerAsset = publicMedia(category.bannerAsset, apiBaseUrl);

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentCategoryId: category.parentCategoryId || null,
    description: category.description || null,
    shortDescription: category.shortDescription || null,
    categoryPath: category.categoryPath || null,
    categoryPathIds: Array.isArray(category.categoryPathIds)
      ? category.categoryPathIds
      : [],
    level: Number(category.level || 0),
    sortOrder: Number(category.sortOrder || 0),
    iconName: category.iconName || null,
    iconUrl: absoluteUrl(category.iconUrl, apiBaseUrl),
    metaTitle: category.metaTitle || null,
    metaDescription: category.metaDescription || null,
    metaKeywords: category.metaKeywords || null,
    canonicalUrl: category.canonicalUrl || null,
    robotsIndex: category.robotsIndex !== false,
    robotsFollow: category.robotsFollow !== false,
    thumbnailAsset,
    imageAsset,
    bannerAsset,
    image: thumbnailAsset || imageAsset || bannerAsset || null,
  };
};

/*
|--------------------------------------------------------------------------
| Compact Public Category Media
|--------------------------------------------------------------------------
|
| Category listing/navigation responses do not need the complete DAM
| representation for thumbnailAsset, imageAsset and bannerAsset.
|
| Keep one compact image source with only the small AVIF variants required
| by category navigation cards.
|--------------------------------------------------------------------------
*/

const compactCategoryMedia = (
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

  const variants =
    Array.isArray(
      item.variants
    )
      ? item.variants
          .filter(
            (variant) =>
              variant &&
              variant.isActive ===
                true &&
              [
                "THUMBNAIL",
                "SMALL",
              ].includes(
                String(
                  variant.variantType ||
                    ""
                ).toUpperCase()
              ) &&
              String(
                variant.format ||
                  ""
              ).toLowerCase() ===
                "avif"
          )
          .map(
            (variant) => ({
              id:
                variant.id,

              variantType:
                variant.variantType,

              format:
                variant.format,

              width:
                variant.width ??
                null,

              height:
                variant.height ??
                null,

              publicUrl:
                absoluteUrl(
                  variant.publicUrl ||
                    variant.storagePath,
                  apiBaseUrl
                ),
            })
          )
          .filter(
            (variant) =>
              Boolean(
                variant.publicUrl
              )
          )
      : [];

  const thumbnail =
    variants.find(
      (variant) =>
        variant.variantType ===
        "THUMBNAIL"
    );

  const small =
    variants.find(
      (variant) =>
        variant.variantType ===
        "SMALL"
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

    publicUrl:
      absoluteUrl(
        item.publicUrl ||
          item.storagePath,
        apiBaseUrl
      ),

    thumbnailUrl:
      thumbnail
        ?.publicUrl ||
      absoluteUrl(
        item.thumbnailPath
          ? `/media/${item.thumbnailPath}`
          : null,
        apiBaseUrl
      ),

    previewUrl:
      small
        ?.publicUrl ||
      absoluteUrl(
        item.previewPath
          ? `/media/${item.previewPath}`
          : null,
        apiBaseUrl
      ),

    variants,
  };
};

/*
|--------------------------------------------------------------------------
| Compact Category Navigation Object
|--------------------------------------------------------------------------
|
| Used for the main category and child-category navigation information.
|--------------------------------------------------------------------------
*/

const compactPublicCategory = (
  categoryModel,
  apiBaseUrl
) => {
  if (!categoryModel) {
    return null;
  }

  const category =
    toPlain(
      categoryModel
    );

  const sourceAsset =
    category.thumbnailAsset ||
    category.imageAsset ||
    category.bannerAsset ||
    null;

  const image =
    compactCategoryMedia(
      sourceAsset,
      apiBaseUrl
    );

  return {
    id:
      category.id,

    name:
      category.name,

    slug:
      category.slug,

    parentCategoryId:
      category.parentCategoryId ||
      null,

    shortDescription:
      category.shortDescription ||
      null,

    categoryPath:
      category.categoryPath ||
      null,

    level:
      Number(
        category.level ||
          0
      ),

    sortOrder:
      Number(
        category.sortOrder ||
          0
      ),

    iconName:
      category.iconName ||
      null,

    iconUrl:
      absoluteUrl(
        category.iconUrl,
        apiBaseUrl
      ),

    /*
     * Preserve the existing frontend-compatible image properties while
     * avoiding three complete DAM objects.
     */
    thumbnailAsset:
      image,

    image:
      image,
  };
};

const getCompany = async (companyCode) => {
  const code = String(companyCode || "").trim().toUpperCase();
  if (!code) {
    throw new AppError(
      "Company code is required.",
      400,
      "COMPANY_CODE_REQUIRED"
    );
  }

  const company = await db.Company.findOne({
    where: { code, isActive: true },
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

const validityWindow = (now) => ({
  [Op.and]: [
    {
      [Op.or]: [
        { validFrom: null },
        { validFrom: { [Op.lte]: now } },
      ],
    },
    {
      [Op.or]: [
        { validUntil: null },
        { validUntil: { [Op.gte]: now } },
      ],
    },
  ],
});

const findPriceList = async ({ companyId, channel, now }) => {
  const lists = await db.PriceList.findAll({
    where: {
      companyId,
      isActive: true,
      channelCode: { [Op.in]: [channel, "ALL"] },
      ...validityWindow(now),
    },
    order: [
      ["priority", "ASC"],
      ["isDefault", "DESC"],
      ["createdAt", "ASC"],
    ],
  });

  return (
    lists.find(
      (list) =>
        String(list.channelCode || "").toUpperCase() === channel
    ) ||
    lists[0] ||
    null
  );
};

const descendantCategoryIds = async ({ companyId, rootCategoryId }) => {
  const result = new Set([rootCategoryId]);
  let parentIds = [rootCategoryId];

  while (parentIds.length) {
    const rows = await db.Category.findAll({
      where: {
        companyId,
        isActive: true,
        parentCategoryId: { [Op.in]: parentIds },
      },
      attributes: ["id"],
      raw: true,
    });

    parentIds = rows
      .map((row) => row.id)
      .filter((id) => !result.has(id));

    parentIds.forEach((id) => result.add(id));
  }

  return Array.from(result);
};

const categoryProductIds = async ({ companyId, categoryIds }) => {
  const [primaryRows, assignmentRows] = await Promise.all([
    db.Product.findAll({
      where: {
        companyId,
        primaryCategoryId: { [Op.in]: categoryIds },
      },
      attributes: ["id"],
      raw: true,
    }),
    db.ProductCategory.findAll({
      where: {
        companyId,
        categoryId: { [Op.in]: categoryIds },
      },
      attributes: ["productId"],
      raw: true,
    }),
  ]);

  return Array.from(
    new Set([
      ...primaryRows.map((row) => row.id),
      ...assignmentRows.map((row) => row.productId),
    ])
  );
};

const csv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const selectedAttributeFilters = (query) => {
  const rawTokens = Array.from(
    new Set([
      ...csv(query.attributeOptionIds || query.attributeOptions),

      ...Object.entries(query)
        .filter(([key]) => key.startsWith("attributes["))
        .flatMap(([, value]) => csv(value)),
    ])
  );

  const optionIds = [];
  const textSelections = new Map();

  rawTokens.forEach((token) => {
    if (!String(token).startsWith("text:")) {
      optionIds.push(token);
      return;
    }

    const parts = String(token).split(":");

    if (parts.length < 3) {
      return;
    }

    const attributeId = parts[1];
    const encodedValue = parts.slice(2).join(":");

    let value = encodedValue;

    try {
      value = decodeURIComponent(encodedValue);
    } catch {
      value = encodedValue;
    }

    if (!textSelections.has(attributeId)) {
      textSelections.set(attributeId, new Set());
    }

    textSelections.get(attributeId).add(value);
  });

  const numberRanges = new Map();

  Object.entries(query).forEach(([key, rawValue]) => {
    const match = key.match(
      /^attribute(Min|Max)\[([^\]]+)\]$/
    );

    if (!match) {
      return;
    }

    const boundary = match[1].toLowerCase();
    const attributeId = match[2];
    const numericValue = Number(
      Array.isArray(rawValue)
        ? rawValue[0]
        : rawValue
    );

    if (!Number.isFinite(numericValue)) {
      return;
    }

    const current =
      numberRanges.get(attributeId) || {};

    current[boundary] = numericValue;

    numberRanges.set(attributeId, current);
  });

  return {
    optionIds,
    textSelections,
    numberRanges,
    rawTokens,
  };
};

const intersectProductIds = (
  currentIds,
  matchingIds
) => {
  const matchingSet = new Set(matchingIds);

  return currentIds.filter((id) =>
    matchingSet.has(id)
  );
};

/*
 * Attribute filter semantics:
 *
 * - Multiple values selected inside the same attribute are OR.
 * - Different attributes are combined with AND.
 *
 * Example:
 * Colour = Blue OR Green
 * AND
 * Storage = 128 GB OR 256 GB
 */
const filterIdsByAttributes = async ({
  companyId,
  productIds,
  selected,
}) => {
  if (!productIds.length) {
    return [];
  }

  let result = [...productIds];

  /*
   * Option-backed values:
   * SINGLE_SELECT, MULTI_SELECT and COLOR_SWATCH.
   */
  if (selected.optionIds.length) {
    const optionModels = await db.AttributeOption.findAll({
      where: {
        companyId,
        id: {
          [Op.in]: selected.optionIds,
        },
        isActive: true,
      },
      attributes: [
        "id",
        "attributeId",
      ],
      raw: true,
    });

    const optionsByAttribute = new Map();

    optionModels.forEach((option) => {
      if (!optionsByAttribute.has(option.attributeId)) {
        optionsByAttribute.set(option.attributeId, []);
      }

      optionsByAttribute
        .get(option.attributeId)
        .push(option.id);
    });

    for (const [, optionIds] of optionsByAttribute) {
      if (!result.length) {
        break;
      }

      const [productValues, variantValues] = await Promise.all([
        db.ProductAttributeValue.findAll({
          where: {
            companyId,
            productId: {
              [Op.in]: result,
            },
            optionId: {
              [Op.in]: optionIds,
            },
          },
          attributes: [
            "productId",
          ],
          raw: true,
        }),

        db.ProductVariantAttributeValue.findAll({
          where: {
            companyId,
            optionId: {
              [Op.in]: optionIds,
            },
          },
          include: [
            {
              model: db.ProductVariant,
              as: "variant",
              required: true,
              attributes: [
                "productId",
              ],
              where: {
                companyId,
                productId: {
                  [Op.in]: result,
                },
              },
            },
          ],
        }),
      ]);

      const matches = new Set(
        productValues.map((row) => row.productId)
      );

      variantValues.forEach((rowModel) => {
        const row = toPlain(rowModel);

        if (row.variant?.productId) {
          matches.add(row.variant.productId);
        }
      });

      result = intersectProductIds(
        result,
        Array.from(matches)
      );
    }
  }

  /*
   * Free-text specification values.
   *
   * Values are compared case-insensitively against
   * displayValue first and textValue second.
   */
  for (const [
    attributeId,
    selectedValues,
  ] of selected.textSelections.entries()) {
    if (!result.length) {
      break;
    }

    const normalizedSelections = new Set(
      Array.from(selectedValues).map((value) =>
        String(value).trim().toLowerCase()
      )
    );

    const rows = await db.ProductAttributeValue.findAll({
      where: {
        companyId,
        productId: {
          [Op.in]: result,
        },
        attributeId,
      },
      attributes: [
        "productId",
        "textValue",
        "displayValue",
      ],
      raw: true,
    });

    const matches = new Set();

    rows.forEach((row) => {
      const value = String(
        row.displayValue ||
          row.textValue ||
          ""
      )
        .trim()
        .toLowerCase();

      if (normalizedSelections.has(value)) {
        matches.add(row.productId);
      }
    });

    result = intersectProductIds(
      result,
      Array.from(matches)
    );
  }

  /*
   * Numeric product-level specification ranges.
   */
  for (const [
    attributeId,
    range,
  ] of selected.numberRanges.entries()) {
    if (!result.length) {
      break;
    }

    const rows = await db.ProductAttributeValue.findAll({
      where: {
        companyId,
        productId: {
          [Op.in]: result,
        },
        attributeId,
        numberValue: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "productId",
        "numberValue",
      ],
      raw: true,
    });

    const matches = new Set();

    rows.forEach((row) => {
      const value = Number(row.numberValue);

      if (!Number.isFinite(value)) {
        return;
      }

      if (
        Number.isFinite(range.min) &&
        value < range.min
      ) {
        return;
      }

      if (
        Number.isFinite(range.max) &&
        value > range.max
      ) {
        return;
      }

      matches.add(row.productId);
    });

    result = intersectProductIds(
      result,
      Array.from(matches)
    );
  }

  return result;
};


/*
|--------------------------------------------------------------------------
| Full Product Includes
|--------------------------------------------------------------------------
|
| Used only AFTER category pagination, so the heavier storefront card
| relationships are loaded for the current page only.
|
|--------------------------------------------------------------------------
*/

const productIncludes = ({
  companyId,
  channel,
  priceListId,
  now,
}) => [
  {
    model: db.ProductChannel,
    as: "channels",
    required: true,
    where: {
      companyId,
      channelCode: channel,
      isVisible: true,
      publishStatus: "PUBLISHED",
    },
    attributes: [
      "channelCode",
      "channelTitle",
      "channelDescription",
    ],
  },
  {
    model: db.Brand,
    as: "brand",
    required: false,
    attributes: ["id", "name", "slug"],
  },
  {
    model: db.Category,
    as: "primaryCategory",
    required: false,
    attributes: ["id", "name", "slug"],
  },
  {
    model: db.ProductImage,
    as: "images",
    required: false,
    separate: true,
    order: [
      ["displayOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
    where: {
      companyId,
      isActive: true,
    },
    include: [
      productCardMediaInclude(
        companyId,
        "mediaAsset"
      ),
    ],
  },
  {
    model: db.ProductVariant,
    as: "variants",
    required: true,
    separate: true,
    order: [
      ["sortOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
    where: {
      companyId,
      status: "ACTIVE",
    },
    include: [
      {
        model: db.ProductVariantPrice,
        as: "prices",
        required: false,
        where: {
          companyId,
          isActive: true,
          ...(priceListId
            ? { priceListId }
            : {}),
          ...validityWindow(now),
        },
        include: [
          {
            model: db.PriceList,
            as: "priceList",
            required: false,
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

/*
|--------------------------------------------------------------------------
| Lightweight Category Product Query
|--------------------------------------------------------------------------
|
| Used BEFORE pagination.
|
| Deliberately excludes:
|
| - product images
| - media assets
| - media variants
| - variant attribute summaries
|
| We only load enough information to:
|
| - verify publication
| - determine brand
| - determine default variant
| - resolve price
| - calculate availability
| - apply filters
| - sort
|
|--------------------------------------------------------------------------
*/

const categoryEligibilityIncludes = ({
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
      db.ProductVariant,

    as:
      "variants",

    required:
      true,

    separate:
      true,

    attributes: [
      "id",
      "productId",
      "sku",
      "barcode",
      "name",
      "isDefault",
      "sortOrder",
      "status",
    ],

    where: {
      companyId,
      status:
        "ACTIVE",
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

    include: [
      {
        model:
          db.ProductVariantPrice,

        as:
          "prices",

        required:
          false,

        separate:
          true,

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

        order: [
          [
            "priority",
            "ASC",
          ],
          [
            "createdAt",
            "ASC",
          ],
        ],

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

const productImage = (product, apiBaseUrl) => {
  const images = Array.isArray(product.images) ? [...product.images] : [];
  images.sort((a, b) => {
    const primary = (a.imageRole === "PRIMARY" ? 0 : 1) -
      (b.imageRole === "PRIMARY" ? 0 : 1);
    return primary || Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
  });

  const selected = images.find((image) => image.mediaAsset);
  if (!selected) return null;

  return {
    id: selected.id,
    imageRole: selected.imageRole,
    altText: selected.altText || selected.mediaAsset?.altText || product.name,
    title: selected.title || selected.mediaAsset?.title || null,
    mediaAsset: publicMedia(selected.mediaAsset, apiBaseUrl),
  };
};

const defaultVariant = (product) => {
  const variants = Array.isArray(product.variants) ? [...product.variants] : [];
  variants.sort((a, b) => {
    const preferred = (a.isDefault ? 0 : 1) - (b.isDefault ? 0 : 1);
    return preferred || Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
  });
  return variants[0] || null;
};

const variantPrice = (variant) => {
  const prices = Array.isArray(variant?.prices) ? [...variant.prices] : [];
  prices.sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));
  const price = prices[0];
  if (!price) return null;

  const number = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
  };

  return {
    id: price.id,
    priceListId: price.priceListId,
    currencyCode: price.priceList?.currencyCode || "AED",
    isTaxInclusive: price.priceList?.isTaxInclusive !== false,
    sellingPrice: number(price.sellingPrice),
    regularPrice: number(price.regularPrice),
    compareAtPrice: number(price.compareAtPrice),
  };
};


/*
|--------------------------------------------------------------------------
| Lightweight Category Product Mapper
|--------------------------------------------------------------------------
|
| Used only for availability, price filtering, dynamic filters, sorting
| and pagination. Heavy image/media/variant-summary data is intentionally
| excluded here.
|
|--------------------------------------------------------------------------
*/

const categoryEligibilityProduct = (
  productModel,
  availabilityByVariant
) => {
  const product =
    toPlain(productModel);

  const variant =
    defaultVariant(product);

  const channel =
    Array.isArray(product.channels)
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
      product.parentSku || null,

    shortDescription:
      channel?.channelDescription ||
      product.shortDescription ||
      null,

    isFeatured:
      product.isFeatured === true,

    sortOrder:
      Number(product.sortOrder || 0),

    createdAt:
      product.createdAt,

    brand:
      product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug:
              product.brand.slug || null,
          }
        : null,

    defaultVariant:
      variant
        ? {
            id: variant.id,
            sku: variant.sku,
            barcode:
              variant.barcode || null,
            name: variant.name,
            isDefault:
              variant.isDefault === true,
          }
        : null,

    price:
      variantPrice(variant),

    availability:
      publicAvailabilityService
        .getAvailabilityForProduct({
          product,
          availabilityByVariant,
        }),
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
    | Gift Voucher Discount
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
    | Actual Customer Price
    |--------------------------------------------------------------------------
    */

    sellingPrice:
      Number(
        sellingPrice.toFixed(
          4
        )
      ),

    /*
    |--------------------------------------------------------------------------
    | Combined Discount
    |--------------------------------------------------------------------------
    */

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
    | Public Promotion Information
    |--------------------------------------------------------------------------
    |
    | Don't expose internal/external accounting information
    | to storefront customers.
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
  const product = toPlain(productModel);
  const variant = defaultVariant(product);
  const channel = Array.isArray(product.channels) ? product.channels[0] : null;

  return {
    id: product.id,
    name: channel?.channelTitle || product.name,
    slug: product.slug,
    productType: product.productType,
    parentSku: product.parentSku || null,
    shortDescription:
      channel?.channelDescription || product.shortDescription || null,
    isFeatured: product.isFeatured === true,


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

    taxPercent: Number(product.taxPercent || 0),
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug || null,
        }
      : null,
    primaryCategory: product.primaryCategory
      ? {
          id: product.primaryCategory.id,
          name: product.primaryCategory.name,
          slug: product.primaryCategory.slug || null,
        }
      : null,
    image: productImage(product, apiBaseUrl),
    defaultVariant: variant
      ? {
          id: variant.id,
          sku: variant.sku,
          barcode: variant.barcode || null,
          name: variant.name,
          isDefault: variant.isDefault === true,
        }
      : null,
    variantSummary:
      buildVariantSummary(
        product
      ),

    price: variantPrice(variant),

    availability:
  publicAvailabilityService
    .getAvailabilityForProduct({
      product,

      availabilityByVariant,
    }),

    productUrl: `/products/${product.slug}`,
  };
};

const breadcrumbs = async ({ companyId, category }) => {
  const ids = Array.isArray(category.categoryPathIds)
    ? category.categoryPathIds
    : [];

  const ancestors = ids.length
    ? await db.Category.findAll({
        where: {
          companyId,
          id: { [Op.in]: ids },
          isActive: true,
        },
        attributes: ["id", "name", "slug", "level"],
        raw: true,
      })
    : [];

  const map = new Map(ancestors.map((item) => [item.id, item]));
  return [
    ...ids.map((id) => map.get(id)).filter(Boolean),
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
      level: category.level,
    },
  ];
};

const dynamicFilters = async ({
  companyId,
  categoryIds,
  products,
}) => {
  const brandMap = new Map();

  products.forEach((product) => {
    if (!product.brand) {
      return;
    }

    const value =
      brandMap.get(product.brand.id) || {
        id: product.brand.id,
        label: product.brand.name,
        slug: product.brand.slug,
        count: 0,
      };

    value.count += 1;

    brandMap.set(product.brand.id, value);
  });

  const prices = products
    .map((product) =>
      Number(product.price?.sellingPrice)
    )
    .filter(Number.isFinite);

  const assignments =
    await db.CategoryAttribute.findAll({
      where: {
        companyId,
        categoryId: {
          [Op.in]: categoryIds,
        },
        isActive: true,
        isFilterable: true,
      },
      include: [
        {
          model: db.Attribute,
          as: "attribute",
          required: true,
          where: {
            companyId,
            isActive: true,
            isFilterable: true,
          },
          include: [
            {
              model: db.AttributeOption,
              as: "options",
              required: false,
              where: {
                companyId,
                isActive: true,
              },
            },
          ],
        },
      ],
      order: [
        [
          "displayOrder",
          "ASC",
        ],
        [
          {
            model: db.Attribute,
            as: "attribute",
          },
          "displayOrder",
          "ASC",
        ],
      ],
    });

  const definitions = new Map();

  assignments.forEach((assignmentModel) => {
    const assignment = toPlain(assignmentModel);

    if (
      assignment.attribute &&
      !definitions.has(assignment.attribute.id)
    ) {
      definitions.set(assignment.attribute.id, {
        displayOrder: Number(
          assignment.displayOrder || 0
        ),
        attribute: assignment.attribute,
      });
    }
  });

  const productIds = products.map(
    (product) => product.id
  );

  if (!productIds.length || !definitions.size) {
    return [
      {
        code: "BRAND",
        label: "Brand",
        type: "MULTI_SELECT",
        options: Array.from(
          brandMap.values()
        ).sort((a, b) =>
          a.label.localeCompare(b.label)
        ),
      },
      {
        code: "PRICE",
        label: "Price",
        type: "RANGE",
        minimum: prices.length
          ? Math.min(...prices)
          : null,
        maximum: prices.length
          ? Math.max(...prices)
          : null,
        currencyCode:
          products.find(
            (product) =>
              product.price?.currencyCode
          )?.price?.currencyCode ||
          "AED",
      },
    ];
  }

  const attributeIds = Array.from(
    definitions.keys()
  );

  const [
    productValues,
    variantValues,
  ] = await Promise.all([
    db.ProductAttributeValue.findAll({
      where: {
        companyId,
        productId: {
          [Op.in]: productIds,
        },
        attributeId: {
          [Op.in]: attributeIds,
        },
      },
      attributes: [
        "productId",
        "attributeId",
        "optionId",
        "textValue",
        "numberValue",
        "booleanValue",
        "dateValue",
        "displayValue",
      ],
      raw: true,
    }),

    db.ProductVariantAttributeValue.findAll({
      where: {
        companyId,
        attributeId: {
          [Op.in]: attributeIds,
        },
      },
      include: [
        {
          model: db.ProductVariant,
          as: "variant",
          required: true,
          attributes: [
            "productId",
          ],
          where: {
            companyId,
            productId: {
              [Op.in]: productIds,
            },
          },
        },
      ],
    }),
  ]);

  const optionCounts = new Map();
  const optionSeen = new Set();

  const textValues = new Map();
  const numberValues = new Map();
  const booleanValues = new Map();

  const addOptionCount = ({
    attributeId,
    optionId,
    productId,
  }) => {
    if (!attributeId || !optionId || !productId) {
      return;
    }

    const unique =
      `${attributeId}:${optionId}:${productId}`;

    if (optionSeen.has(unique)) {
      return;
    }

    optionSeen.add(unique);

    const key =
      `${attributeId}:${optionId}`;

    optionCounts.set(
      key,
      (optionCounts.get(key) || 0) + 1
    );
  };

  const addTextValue = ({
    attributeId,
    productId,
    value,
  }) => {
    const normalized = String(value || "").trim();

    if (!attributeId || !productId || !normalized) {
      return;
    }

    if (!textValues.has(attributeId)) {
      textValues.set(attributeId, new Map());
    }

    const map = textValues.get(attributeId);
    const key = normalized.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        label: normalized,
        productIds: new Set(),
      });
    }

    map.get(key).productIds.add(productId);
  };

  const addNumberValue = ({
    attributeId,
    value,
  }) => {
    const number = Number(value);

    if (!attributeId || !Number.isFinite(number)) {
      return;
    }

    if (!numberValues.has(attributeId)) {
      numberValues.set(attributeId, []);
    }

    numberValues.get(attributeId).push(number);
  };

  const addBooleanValue = ({
    attributeId,
    productId,
    value,
  }) => {
    if (
      !attributeId ||
      !productId ||
      typeof value !== "boolean"
    ) {
      return;
    }

    if (!booleanValues.has(attributeId)) {
      booleanValues.set(attributeId, {
        true: new Set(),
        false: new Set(),
      });
    }

    booleanValues
      .get(attributeId)[String(value)]
      .add(productId);
  };

  productValues.forEach((row) => {
    if (row.optionId) {
      addOptionCount({
        attributeId: row.attributeId,
        optionId: row.optionId,
        productId: row.productId,
      });
    }

    addTextValue({
      attributeId: row.attributeId,
      productId: row.productId,
      value:
        row.displayValue ||
        row.textValue,
    });

    addNumberValue({
      attributeId: row.attributeId,
      value: row.numberValue,
    });

    addBooleanValue({
      attributeId: row.attributeId,
      productId: row.productId,
      value: row.booleanValue,
    });
  });

  variantValues.forEach((rowModel) => {
    const row = toPlain(rowModel);

    addOptionCount({
      attributeId: row.attributeId,
      optionId: row.optionId,
      productId: row.variant?.productId,
    });
  });

  const attributeFilters = Array.from(
    definitions.values()
  )
    .map(({
      displayOrder,
      attribute,
    }) => {
      const inputType = String(
        attribute.inputType || ""
      ).toUpperCase();

      const dataType = String(
        attribute.dataType || ""
      ).toUpperCase();

      /*
       * Numeric range filter.
       */
      if (
        inputType === "NUMBER" ||
        dataType === "NUMBER"
      ) {
        const values =
          numberValues.get(attribute.id) || [];

        if (!values.length) {
          return null;
        }

        return {
          id: attribute.id,
          code: attribute.code,
          label: attribute.name,
          type: "NUMBER_RANGE",
          inputType: attribute.inputType,
          dataType: attribute.dataType,
          unit: attribute.unit || null,
          displayOrder,
          minimum: Math.min(...values),
          maximum: Math.max(...values),
        };
      }

      /*
       * Option-backed filter.
       */
      const configuredOptions =
        (attribute.options || [])
          .map((option) => ({
            id: option.id,
            label: option.label,
            value: option.value,
            swatchValue:
              option.swatchValue || null,
            displayOrder: Number(
              option.displayOrder || 0
            ),
            count:
              optionCounts.get(
                `${attribute.id}:${option.id}`
              ) || 0,
          }))
          .filter((option) => option.count > 0)
          .sort(
            (a, b) =>
              a.displayOrder -
                b.displayOrder ||
              a.label.localeCompare(b.label)
          );

      if (configuredOptions.length) {
        return {
          id: attribute.id,
          code: attribute.code,
          label: attribute.name,
          type: inputType || "MULTI_SELECT",
          inputType: attribute.inputType,
          dataType: attribute.dataType,
          unit: attribute.unit || null,
          displayOrder,
          options: configuredOptions,
        };
      }

      /*
       * Boolean fallback.
       */
      const booleanMap =
        booleanValues.get(attribute.id);

      if (booleanMap) {
        const options = [
          {
            value: true,
            label: "Yes",
            count: booleanMap.true.size,
          },
          {
            value: false,
            label: "No",
            count: booleanMap.false.size,
          },
        ]
          .filter((option) => option.count > 0)
          .map((option) => ({
            id:
              `text:${attribute.id}:${encodeURIComponent(
                String(option.value)
              )}`,
            label: option.label,
            value: String(option.value),
            count: option.count,
          }));

        if (options.length) {
          return {
            id: attribute.id,
            code: attribute.code,
            label: attribute.name,
            type: "TEXT_MULTI_SELECT",
            inputType: attribute.inputType,
            dataType: attribute.dataType,
            unit: attribute.unit || null,
            displayOrder,
            options,
          };
        }
      }

      /*
       * Free-text fallback.
       *
       * This supports specifications currently saved in
       * textValue/displayValue, such as Processor.
       */
      const distinctValues =
        textValues.get(attribute.id);

      if (!distinctValues?.size) {
        return null;
      }

      const options = Array.from(
        distinctValues.values()
      )
        .map((value) => ({
          id:
            `text:${attribute.id}:${encodeURIComponent(
              value.label
            )}`,
          label: value.label,
          value: value.label,
          count: value.productIds.size,
        }))
        .sort((a, b) =>
          a.label.localeCompare(b.label)
        );

      return {
        id: attribute.id,
        code: attribute.code,
        label: attribute.name,
        type: "TEXT_MULTI_SELECT",
        inputType: attribute.inputType,
        dataType: attribute.dataType,
        unit: attribute.unit || null,
        displayOrder,
        options,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.displayOrder -
        b.displayOrder
    );

  return [
    {
      code: "BRAND",
      label: "Brand",
      type: "MULTI_SELECT",
      options: Array.from(
        brandMap.values()
      ).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    },

    {
      code: "PRICE",
      label: "Price",
      type: "RANGE",
      minimum: prices.length
        ? Math.min(...prices)
        : null,
      maximum: prices.length
        ? Math.max(...prices)
        : null,
      currencyCode:
        products.find(
          (product) =>
            product.price?.currencyCode
        )?.price?.currencyCode ||
        "AED",
    },

    ...attributeFilters,
  ];
};

const sortProducts = (products, sort) => {
  const result = [...products];
  const price = (product) => {
    const amount = Number(product.price?.sellingPrice);
    return Number.isFinite(amount) ? amount : Number.POSITIVE_INFINITY;
  };

  switch (sort) {
    case "PRICE_LOW_TO_HIGH":
    case "PRICE_ASC":
      result.sort((a, b) => price(a) - price(b));
      break;
    case "PRICE_HIGH_TO_LOW":
    case "PRICE_DESC":
      result.sort((a, b) => price(b) - price(a));
      break;
    case "NEWEST":
      result.sort((a, b) => {
        const first = new Date(a.createdAt || 0).getTime();
        const second = new Date(b.createdAt || 0).getTime();
        return second - first;
      });
      break;
    case "NAME_ASC":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "NAME_DESC":
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "FEATURED":
    default:
      result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
      break;
  }

  return result;
};

const getPublicCategories = async ({
  companyCode,
  channel = "WEBSITE",
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

  const categoryModels =
    await db.Category.findAll({
      where: {
        companyId:
          company.id,

        parentCategoryId:
          null,

        isActive:
          true,

        isSearchable:
          true,
      },

      include: [
        mediaInclude(
          company.id,
          "thumbnailAsset"
        ),

        mediaInclude(
          company.id,
          "imageAsset"
        ),

        mediaInclude(
          company.id,
          "bannerAsset"
        ),
      ],

      order: [
        [
          "sortOrder",
          "ASC",
        ],

        [
          "name",
          "ASC",
        ],
      ],
    });

  const categories =
    categoryModels.map(
      (category) =>
        publicCategory(
          category,
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

    categories,

    meta: {
      channel:
        normalizedChannel,

      total:
        categories.length,

      generatedAt:
        new Date()
          .toISOString(),
    },
  };
};


const getPublicCategory = async ({
  companyCode,
  slug,
  channel = "WEBSITE",
  query = {},
  apiBaseUrl,
}) => {
  const now = new Date();



  const normalizedChannel = String(channel || "WEBSITE")
    .trim()
    .toUpperCase();

  if (!["WEBSITE", "KIOSK"].includes(normalizedChannel)) {
    throw new AppError(
      "Channel must be WEBSITE or KIOSK.",
      400,
      "INVALID_STOREFRONT_CHANNEL"
    );
  }

  const company = await getCompany(companyCode);






    /*
  |--------------------------------------------------------------------------
  | Main Category — Optimized Media Loading
  |--------------------------------------------------------------------------
  |
  | Do not join thumbnailAsset/imageAsset/bannerAsset and all of their
  | MediaAssetVariant rows directly into the Category query.
  |
  | The same MediaAsset may be reused for multiple category media roles.
  | Loading the assets separately avoids SQL row multiplication and large
  | Sequelize object graphs.
  |--------------------------------------------------------------------------
  */

  const categoryModel =
    await db.Category.findOne({
      where: {
        companyId:
          company.id,

        slug:
          String(
            slug || ""
          )
            .trim()
            .toLowerCase(),

        isActive:
          true,

        isSearchable:
          true,
      },
    });

  if (
    !categoryModel
  ) {
    throw new AppError(
      "Category was not found.",
      404,
      "PUBLIC_CATEGORY_NOT_FOUND"
    );
  }

  /*
   * Convert to a plain object before manually attaching media.
   */

  const categoryPlain =
    toPlain(
      categoryModel
    );

  /*
   * A category can use the same MediaAsset for multiple roles.
   * De-duplicate the IDs before querying.
   */

  const categoryMediaAssetIds =
    Array.from(
      new Set(
        [
          categoryPlain
            .thumbnailAssetId,

          categoryPlain
            .imageAssetId,

          categoryPlain
            .bannerAssetId,
        ].filter(
          Boolean
        )
      )
    );

  /*
   * Load each referenced MediaAsset once.
   *
   * MediaAssetVariant is loaded separately so variants do not multiply
   * MediaAsset rows in the main SQL query.
   */

  const categoryMediaAssets =
    categoryMediaAssetIds.length
      ? await db.MediaAsset.findAll({
          where: {
            id: {
              [Op.in]:
                categoryMediaAssetIds,
            },

            companyId:
              company.id,

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

              separate:
                true,

                where: {
                  companyId:
                    company.id,
                
                  isActive:
                    true,
                
                  variantType: {
                    [Op.in]: [
                      "THUMBNAIL",
                      "SMALL",
                    ],
                  },
                
                  format: {
                    [Op.in]: [
                      "avif",
                    ],
                  },
                },
            },
          ],
        })
      : [];

  const categoryMediaMap =
    new Map(
      categoryMediaAssets.map(
        (assetModel) => {
          const asset =
            toPlain(
              assetModel
            );

          return [
            String(
              asset.id
            ),
            asset,
          ];
        }
      )
    );

  /*
   * Restore the exact relationship shape expected by publicCategory().
   */

  const category = {
    ...categoryPlain,

    thumbnailAsset:
      categoryPlain
        .thumbnailAssetId
        ? categoryMediaMap.get(
            String(
              categoryPlain
                .thumbnailAssetId
            )
          ) ||
          null
        : null,

    imageAsset:
      categoryPlain
        .imageAssetId
        ? categoryMediaMap.get(
            String(
              categoryPlain
                .imageAssetId
            )
          ) ||
          null
        : null,

    bannerAsset:
      categoryPlain
        .bannerAssetId
        ? categoryMediaMap.get(
            String(
              categoryPlain
                .bannerAssetId
            )
          ) ||
          null
        : null,
  };


  const categoryIds = await descendantCategoryIds({
    companyId: company.id,
    rootCategoryId: category.id,
  });


    /*
  |--------------------------------------------------------------------------
  | Child Categories — Optimized Media Loading
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Do NOT join thumbnailAsset/imageAsset/bannerAsset and all of their
  | MediaAssetVariant rows into the Category query.
  |
  | A category may reuse the same MediaAsset for multiple roles and many
  | categories may share the same banner. Joining three hasMany variant
  | relationships causes a large SQL row multiplication.
  |
  | Instead:
  |
  | 1. Load child categories only.
  | 2. Collect unique media asset IDs.
  | 3. Load each MediaAsset once.
  | 4. Load its variants separately.
  | 5. Attach the assets back to each child category.
  |--------------------------------------------------------------------------
  */

  const childRows =
    await db.Category.findAll({
      where: {
        companyId:
          company.id,

        parentCategoryId:
          category.id,

        isActive:
          true,
      },

      order: [
        [
          "sortOrder",
          "ASC",
        ],

        [
          "name",
          "ASC",
        ],
      ],
    });

  /*
   * Convert child Sequelize models to plain objects before attaching
   * manually loaded media relationships.
   */

  const childPlainRows =
    childRows.map(
      (child) =>
        toPlain(child)
    );

  /*
   * Collect each referenced asset only once.
   */

  const childMediaAssetIds =
    Array.from(
      new Set(
        childPlainRows
          .flatMap(
            (child) => [
              child.thumbnailAssetId,
              child.imageAssetId,
              child.bannerAssetId,
            ]
          )
          .filter(Boolean)
      )
    );

  /*
   * Load only the media assets actually referenced by these children.
   *
   * `separate: true` prevents MediaAssetVariant rows from multiplying
   * the MediaAsset result set.
   */

  const childMediaAssets =
    childMediaAssetIds.length
      ? await db.MediaAsset.findAll({
          where: {
            id: {
              [Op.in]:
                childMediaAssetIds,
            },

            companyId:
              company.id,

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

              separate:
                true,

                where: {
                  companyId:
                    company.id,
                
                  isActive:
                    true,
                
                  variantType: {
                    [Op.in]: [
                      "THUMBNAIL",
                      "SMALL",
                    ],
                  },
                
                  format: {
                    [Op.in]: [
                      "avif",
                    ],
                  },
                },
            },
          ],
        })
      : [];

  /*
   * Build a lookup map.
   */

  const childMediaMap =
    new Map(
      childMediaAssets.map(
        (assetModel) => {
          const asset =
            toPlain(
              assetModel
            );

          return [
            String(
              asset.id
            ),
            asset,
          ];
        }
      )
    );

  /*
   * Restore the same object shape expected by publicCategory().
   */

  const children =
    childPlainRows.map(
      (child) => ({
        ...child,

        thumbnailAsset:
          child.thumbnailAssetId
            ? childMediaMap.get(
                String(
                  child.thumbnailAssetId
                )
              ) ||
              null
            : null,

        imageAsset:
          child.imageAssetId
            ? childMediaMap.get(
                String(
                  child.imageAssetId
                )
              ) ||
              null
            : null,

        bannerAsset:
          child.bannerAssetId
            ? childMediaMap.get(
                String(
                  child.bannerAssetId
                )
              ) ||
              null
            : null,
      })
    );


  let productIds = await categoryProductIds({
    companyId: company.id,
    categoryIds,
  });


  const brandIds = csv(query.brandIds || query.brands);
  if (brandIds.length && productIds.length) {
    const rows = await db.Product.findAll({
      where: {
        companyId: company.id,
        id: { [Op.in]: productIds },
        brandId: { [Op.in]: brandIds },
      },
      attributes: ["id"],
      raw: true,
    });
    productIds = rows.map((row) => row.id);
  }


  const selectedAttributes =
    selectedAttributeFilters(query);

  productIds =
    await filterIdsByAttributes({
      companyId: company.id,
      productIds,
      selected:
        selectedAttributes,
    });


  const priceListModel = await findPriceList({
    companyId: company.id,
    channel: normalizedChannel,
    now,
  });


  const priceList = priceListModel ? toPlain(priceListModel) : null;
  const search = String(query.search || "").trim();

  /*
  |--------------------------------------------------------------------------
  | Category Products
  |--------------------------------------------------------------------------
  |
  | Product availability MUST be calculated before pagination.
  |
  | Otherwise unavailable products are counted in totalItems and can occupy
  | entire pages, producing empty pages even though later pages contain
  | available products.
  |--------------------------------------------------------------------------
  */

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

  const sort =
    String(
      query.sort ||
        "FEATURED"
    )
      .trim()
      .toUpperCase();

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

  /*
  |--------------------------------------------------------------------------
  | Phase 1 — Lightweight Eligible Products
  |--------------------------------------------------------------------------
  |
  | Load only the fields needed for publication, availability, pricing,
  | filters and sorting. Images/media/variant summary data are intentionally
  | deferred until AFTER pagination.
  |
  |--------------------------------------------------------------------------
  */

  const eligibilityModels =
  productIds.length
    ? await db.Product.findAll({
        where: {
          companyId:
            company.id,

          id: {
            [Op.in]:
              productIds,
          },

          status:
            "ACTIVE",

          isSearchable:
            true,

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

        /*
        |--------------------------------------------------------------------------
        | Lightweight Phase-1 Product Columns
        |--------------------------------------------------------------------------
        |
        | Phase 1 runs BEFORE pagination and can contain hundreds of products.
        |
        | Only load fields required for:
        |
        | - publication
        | - availability
        | - pricing
        | - filters
        | - sorting
        | - pagination
        |
        | Images/media/full product relationships remain deferred until
        | Phase 2, after pagination.
        |--------------------------------------------------------------------------
        */

        attributes: [
          "id",
          "companyId",
          "brandId",
          "name",
          "slug",
          "productType",
          "parentSku",
          "shortDescription",
          "isFeatured",
          "sortOrder",
          "isDirectDelivery",
          "createdAt",
        ],

        include:
          categoryEligibilityIncludes({
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
        ],

        distinct:
          true,
      })
    : [];


  /*
  |--------------------------------------------------------------------------
  | Availability — All Lightweight Candidates
  |--------------------------------------------------------------------------
  */

  const eligibilityAvailabilityByVariant =
    await publicAvailabilityService
      .getVariantAvailabilityMap({
        companyId:
          company.id,

        products:
          eligibilityModels,
      });


  let eligibleProducts =
    publicAvailabilityService
      .filterAvailablePublicProducts(
        eligibilityModels.map(
          (model) =>
            categoryEligibilityProduct(
              model,
              eligibilityAvailabilityByVariant
            )
        )
      );


  /*
  |--------------------------------------------------------------------------
  | Gift Voucher Pricing — Before Price Filters / Sort / Pagination
  |--------------------------------------------------------------------------
  */

  const eligibilityGiftVoucherItems =
    eligibleProducts
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

  const eligibilityGiftVoucherMap =
    await giftVoucherPromotionService
      .resolveApplicablePromotionsBatch({
        companyId:
          company.id,

        items:
          eligibilityGiftVoucherItems,

        channelCode:
          normalizedChannel,

        effectiveDate:
          now,
      });

  eligibleProducts =
    eligibleProducts.map(
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
          eligibilityGiftVoucherMap.get(
            key
          ) || null;

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
  | Price Filters
  |--------------------------------------------------------------------------
  */

  if (
    Number.isFinite(
      minPrice
    )
  ) {
    eligibleProducts =
      eligibleProducts.filter(
        (product) =>
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
    eligibleProducts =
      eligibleProducts.filter(
        (product) =>
          Number(
            product.price
              ?.sellingPrice
          ) <= maxPrice
      );
  }

  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Filters
  |--------------------------------------------------------------------------
  |
  | dynamicFilters() already loads specification values using targeted
  | ProductAttributeValue / ProductVariantAttributeValue queries, so the
  | full storefront product graph is not required here.
  |
  |--------------------------------------------------------------------------
  */

  const filters =
    await dynamicFilters({
      companyId:
        company.id,

      categoryIds,

      products:
        eligibleProducts,
    });


  /*
  |--------------------------------------------------------------------------
  | Sort Lightweight Products
  |--------------------------------------------------------------------------
  */

  eligibleProducts =
    sortProducts(
      eligibleProducts,
      sort
    );

  /*
  |--------------------------------------------------------------------------
  | Pagination BEFORE Full Hydration
  |--------------------------------------------------------------------------
  */

  const totalItems =
    eligibleProducts.length;

  const totalPages =
    Math.ceil(
      totalItems /
        pageSize
    );

  const pageProducts =
    eligibleProducts.slice(
      (page - 1) *
        pageSize,

      page *
        pageSize
    );

  const pageProductIds =
    pageProducts.map(
      (product) =>
        product.id
    );


  /*
  |--------------------------------------------------------------------------
  | Phase 2 — Fully Hydrate Current Page Only
  |--------------------------------------------------------------------------
  */

  const pageProductModels =
    pageProductIds.length
      ? await db.Product.findAll({
          where: {
            companyId:
              company.id,

            id: {
              [Op.in]:
                pageProductIds,
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

          distinct:
            true,
        })
      : [];


  const pageAvailabilityByVariant =
    await publicAvailabilityService
      .getVariantAvailabilityMap({
        companyId:
          company.id,

        products:
          pageProductModels,
      });


  let listedProducts =
    pageProductModels.map(
      (model) =>
        publicProduct(
          model,
          apiBaseUrl,
          pageAvailabilityByVariant
        )
    );

  /*
  |--------------------------------------------------------------------------
  | Reapply Already-Resolved Gift Voucher Pricing
  |--------------------------------------------------------------------------
  |
  | Do not execute the promotion resolver a second time.
  |
  |--------------------------------------------------------------------------
  */

  listedProducts =
    listedProducts.map(
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
          eligibilityGiftVoucherMap.get(
            key
          ) || null;

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
  | Preserve Lightweight Sort / Pagination Order
  |--------------------------------------------------------------------------
  |
  | SQL IN (...) does not guarantee input order.
  |
  |--------------------------------------------------------------------------
  */

  const pageOrder =
    new Map(
      pageProductIds.map(
        (
          productId,
          index
        ) => [
          String(
            productId
          ),
          index,
        ]
      )
    );

  listedProducts.sort(
    (
      first,
      second
    ) =>
      (
        pageOrder.get(
          String(
            first.id
          )
        ) ??
        Number.MAX_SAFE_INTEGER
      ) -
      (
        pageOrder.get(
          String(
            second.id
          )
        ) ??
        Number.MAX_SAFE_INTEGER
      )
  );


  const resolvedBreadcrumbs =
    await breadcrumbs({
      companyId:
        company.id,

      category,
    });


  return {
    company: {
      id: company.id,
      name: company.name,
      code: company.code,
      currency: company.currency,
    },
    category:
      publicCategory(
        category,
        apiBaseUrl
      ),

breadcrumbs:
  resolvedBreadcrumbs,

children:
  children.map(
    (child) =>
      compactPublicCategory(
        child,
        apiBaseUrl
      )
  ),
    products: listedProducts,
    filters,
    sortOptions: [
      { value: "FEATURED", label: "Featured" },
      { value: "NEWEST", label: "Newest" },
      { value: "PRICE_LOW_TO_HIGH", label: "Price: Low to High" },
      { value: "PRICE_HIGH_TO_LOW", label: "Price: High to Low" },
      { value: "NAME_ASC", label: "Name: A to Z" },
    ],
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
    appliedFilters: {
      search: search || null,
      brandIds,
      optionIds:
        selectedAttributes.rawTokens,

      attributeRanges:
        Object.fromEntries(
          selectedAttributes.numberRanges
        ),

      minPrice: Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
      sort,
    },
    resolvedPriceList: priceList
      ? {
          id: priceList.id,
          code: priceList.code,
          name: priceList.name,
          currencyCode: priceList.currencyCode,
          isTaxInclusive: priceList.isTaxInclusive,
        }
      : null,
    meta: {
      channel: normalizedChannel,
      includesDescendants: true,
      categoryIds,
      generatedAt: new Date().toISOString(),
    },
  };
};


/*
|--------------------------------------------------------------------------
| Express Delivery Products
|--------------------------------------------------------------------------
|
| This collection is driven ONLY by live inventory.
|
| DXB_SHJ:
|   DXB_WAREHOUSE + DXB_WAFI + DXB_DEIRA_CC
|
| AUH:
|   AUH_SAJ
|
| Available stock:
|   quantityOnHand - quantityReserved
|
| The legacy Product.expressDeliveryEnabled flag is intentionally NOT used.
|--------------------------------------------------------------------------
*/

const EXPRESS_DELIVERY_REGIONS = {
  DXB_SHJ: {
    code: "DXB_SHJ",
    label: "Dubai / Sharjah",
    deliveryLabel: "2-Hour Delivery — Dubai / Sharjah",
    hours: 2,
    locationCodes: [
      "DXB_WAREHOUSE",
      "DXB_WAFI",
      "DXB_DEIRA_CC",
    ],
  },

  AUH: {
    code: "AUH",
    label: "Abu Dhabi",
    deliveryLabel: "1-Hour Delivery — Abu Dhabi",
    hours: 1,
    locationCodes: [
      "AUH_SAJ",
    ],
  },
};

const normalizeExpressRegion = (
  value
) => {
  const normalized =
    String(
      value ||
      "DXB_SHJ"
    )
      .trim()
      .toUpperCase();

  if (
    [
      "DXB_SHJ",
      "DUBAI_SHARJAH",
      "DUBAI_SHJ",
      "DXB-SHJ",
    ].includes(
      normalized
    )
  ) {
    return "DXB_SHJ";
  }

  if (
    [
      "AUH",
      "ABU_DHABI",
      "ABUDHABI",
      "ABU-DHABI",
    ].includes(
      normalized
    )
  ) {
    return "AUH";
  }

  throw new AppError(
    "Express delivery region must be DXB_SHJ or AUH.",
    400,
    "INVALID_EXPRESS_DELIVERY_REGION"
  );
};

const getExpressEligibleVariantMap =
  async ({
    companyId,
    region,
  }) => {
    const config =
      EXPRESS_DELIVERY_REGIONS[
        region
      ];

    const locations =
      await db.InventoryLocation.findAll({
        where: {
          companyId,

          code: {
            [Op.in]:
              config.locationCodes,
          },

          isActive:
            true,

          isDeliveryEnabled:
            true,
        },

        attributes: [
          "id",
          "code",
          "name",
        ],

        raw:
          true,
      });

    if (
      !locations.length
    ) {
      return {
        eligibleVariantIds:
          [],

        availableByVariant:
          new Map(),
      };
    }

    const locationIds =
      locations.map(
        (location) =>
          location.id
      );

    const balances =
      await db.InventoryBalance.findAll({
        where: {
          companyId,

          inventoryLocationId: {
            [Op.in]:
              locationIds,
          },
        },

        attributes: [
          "productVariantId",
          "inventoryLocationId",
          "quantityOnHand",
          "quantityReserved",
        ],

        raw:
          true,
      });

    const availableByVariant =
      new Map();

    for (
      const balance of
      balances
    ) {
      const onHand =
        Number(
          balance.quantityOnHand ||
          0
        );

      const reserved =
        Number(
          balance.quantityReserved ||
          0
        );

      const available =
        Math.max(
          0,
          onHand -
            reserved
        );

      if (
        available <=
        0
      ) {
        continue;
      }

      const current =
        Number(
          availableByVariant.get(
            balance.productVariantId
          ) ||
          0
        );

      availableByVariant.set(
        balance.productVariantId,
        current +
          available
      );
    }

    return {
      eligibleVariantIds:
        Array.from(
          availableByVariant.keys()
        ),

      availableByVariant,
    };
  };

const getExpressDeliveryProducts =
  async ({
    companyCode,
    region =
      "DXB_SHJ",
    channel =
      "WEBSITE",
    query =
      {},
    apiBaseUrl,
  }) => {
    const now =
      new Date();

    const normalizedRegion =
      normalizeExpressRegion(
        region ||
        query.region
      );

    const regionConfig =
      EXPRESS_DELIVERY_REGIONS[
        normalizedRegion
      ];

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

    const {
      eligibleVariantIds,
      availableByVariant,
    } =
      await getExpressEligibleVariantMap({
        companyId:
          company.id,

        region:
          normalizedRegion,
      });

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

    const sort =
      String(
        query.sort ||
        "FEATURED"
      )
        .trim()
        .toUpperCase();

    const search =
      String(
        query.search ||
        ""
      ).trim();

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

    const minPrice =
      query.minPrice !==
        undefined &&
      query.minPrice !==
        ""
        ? Number(
            query.minPrice
          )
        : null;

    const maxPrice =
      query.maxPrice !==
        undefined &&
      query.maxPrice !==
        ""
        ? Number(
            query.maxPrice
          )
        : null;

    if (
      !eligibleVariantIds.length
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

        region: {
          ...regionConfig,
        },

        products:
          [],

        filters: {
          categories:
            [],
          brands:
            [],
          price: {
            minimum:
              null,
            maximum:
              null,
            currencyCode:
              "AED",
          },
        },

        sortOptions: [
          {
            value:
              "FEATURED",
            label:
              "Featured",
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
          totalItems:
            0,
          totalPages:
            0,
          hasPreviousPage:
            false,
          hasNextPage:
            false,
        },

        meta: {
          channel:
            normalizedChannel,

          generatedAt:
            new Date()
              .toISOString(),
        },
      };
    }

    const eligibleVariantRows =
      await db.ProductVariant.findAll({
        where: {
          companyId:
            company.id,

          id: {
            [Op.in]:
              eligibleVariantIds,
          },

          status:
            "ACTIVE",
        },

        attributes: [
          "id",
          "productId",
        ],

        raw:
          true,
      });

    const productIds =
      Array.from(
        new Set(
          eligibleVariantRows.map(
            (row) =>
              row.productId
          )
        )
      );

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

    const productModels =
      productIds.length
        ? await db.Product.findAll({
            where: {
              companyId:
                company.id,

              id: {
                [Op.in]:
                  productIds,
              },

              status:
                "ACTIVE",

              isSearchable:
                true,

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
            ],

            distinct:
              true,
          })
        : [];

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
            (model) =>
              publicProduct(
                model,
                apiBaseUrl,
                availabilityByVariant
              )
          )
        );

    /*
    |--------------------------------------------------------------------------
    | Keep Product Card and Collection Eligibility Aligned
    |--------------------------------------------------------------------------
    |
    | StorefrontProductCard currently checks express eligibility using the
    | default variant. To make the collection and its badge always agree,
    | only products whose default variant is express-eligible are listed.
    |--------------------------------------------------------------------------
    */

    const eligibleVariantSet =
      new Set(
        eligibleVariantIds
      );

    products =
      products.filter(
        (product) =>
          product.defaultVariant
            ?.id &&
          eligibleVariantSet.has(
            product.defaultVariant
              .id
          )
      );

    products =
      products.map(
        (product) => ({
          ...product,

          expressDelivery: {
            region:
              normalizedRegion,

            regionLabel:
              regionConfig.label,

            deliveryLabel:
              regionConfig
                .deliveryLabel,

            hours:
              regionConfig.hours,

            availableQuantity:
              Number(
                availableByVariant.get(
                  product
                    .defaultVariant
                    ?.id
                ) ||
                0
              ),

            locationCodes: [
              ...regionConfig
                .locationCodes,
            ],
          },
        })
      );


    /*
    |--------------------------------------------------------------------------
    | Dynamic Express Filters
    |--------------------------------------------------------------------------
    |
    | Build counts BEFORE the currently selected category/brand/price filters
    | are applied so the sidebar remains useful.
    |--------------------------------------------------------------------------
    */

    const categoryFilterMap =
      new Map();

    const brandFilterMap =
      new Map();

    const allPrices =
      [];

    for (
      const product of
      products
    ) {
      if (
        product.primaryCategory
          ?.id
      ) {
        const current =
          categoryFilterMap.get(
            product.primaryCategory.id
          ) || {
            id:
              product.primaryCategory.id,

            label:
              product.primaryCategory.name,

            slug:
              product.primaryCategory.slug ||
              null,

            count:
              0,
          };

        current.count +=
          1;

        categoryFilterMap.set(
          product.primaryCategory.id,
          current
        );
      }

      if (
        product.brand
          ?.id
      ) {
        const current =
          brandFilterMap.get(
            product.brand.id
          ) || {
            id:
              product.brand.id,

            label:
              product.brand.name,

            slug:
              product.brand.slug ||
              null,

            count:
              0,
          };

        current.count +=
          1;

        brandFilterMap.set(
          product.brand.id,
          current
        );
      }

      const numericPrice =
        Number(
          product.price
            ?.sellingPrice
        );

      if (
        Number.isFinite(
          numericPrice
        )
      ) {
        allPrices.push(
          numericPrice
        );
      }
    }

    if (
      categoryIds.length
    ) {
      const allowed =
        new Set(
          categoryIds
        );

      products =
        products.filter(
          (product) =>
            product.primaryCategory
              ?.id &&
            allowed.has(
              product.primaryCategory.id
            )
        );
    }

    if (
      brandIds.length
    ) {
      const allowed =
        new Set(
          brandIds
        );

      products =
        products.filter(
          (product) =>
            product.brand
              ?.id &&
            allowed.has(
              product.brand.id
            )
        );
    }

    if (
      Number.isFinite(
        minPrice
      )
    ) {
      products =
        products.filter(
          (product) =>
            Number(
              product.price
                ?.sellingPrice
            ) >=
            minPrice
        );
    }

    if (
      Number.isFinite(
        maxPrice
      )
    ) {
      products =
        products.filter(
          (product) =>
            Number(
              product.price
                ?.sellingPrice
            ) <=
            maxPrice
        );
    }

    const filters = {
      categories:
        Array.from(
          categoryFilterMap.values()
        ).sort(
          (a, b) =>
            a.label.localeCompare(
              b.label
            )
        ),

      brands:
        Array.from(
          brandFilterMap.values()
        ).sort(
          (a, b) =>
            a.label.localeCompare(
              b.label
            )
        ),

      price: {
        minimum:
          allPrices.length
            ? Math.min(
                ...allPrices
              )
            : null,

        maximum:
          allPrices.length
            ? Math.max(
                ...allPrices
              )
            : null,

        currencyCode:
          products.find(
            (product) =>
              product.price
                ?.currencyCode
          )?.price
            ?.currencyCode ||
          "AED",
      },
    };

    products =
      sortProducts(
        products,
        sort
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
        (page -
          1) *
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

      region: {
        ...regionConfig,
      },

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
        search:
          search ||
          null,

        categoryIds,

        brandIds,

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
                priceList
                  .currencyCode,

              isTaxInclusive:
                priceList
                  .isTaxInclusive,
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
    getPublicCategories,
    getPublicCategory,
    getExpressDeliveryProducts,
  };