const { Op } = require("sequelize");

const db = require("../../models");
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

const productIncludes = ({ companyId, channel, priceListId, now }) => [
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
    attributes: ["channelCode", "channelTitle", "channelDescription"],
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
    where: { companyId, isActive: true },
    include: [mediaInclude(companyId, "mediaAsset")],
  },
  {
    model: db.ProductVariant,
    as: "variants",
    required: true,
    where: { companyId, status: "ACTIVE" },
    include: [
      {
        model: db.ProductVariantPrice,
        as: "prices",
        required: false,
        where: {
          companyId,
          isActive: true,
          ...(priceListId ? { priceListId } : {}),
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

const publicProduct = (productModel, apiBaseUrl) => {
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
    price: variantPrice(variant),
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
  const category = await db.Category.findOne({
    where: {
      companyId: company.id,
      slug: String(slug || "").trim().toLowerCase(),
      isActive: true,
      isSearchable: true,
    },
    include: [
      mediaInclude(company.id, "thumbnailAsset"),
      mediaInclude(company.id, "imageAsset"),
      mediaInclude(company.id, "bannerAsset"),
    ],
  });

  if (!category) {
    throw new AppError(
      "Category was not found.",
      404,
      "PUBLIC_CATEGORY_NOT_FOUND"
    );
  }

  const categoryIds = await descendantCategoryIds({
    companyId: company.id,
    rootCategoryId: category.id,
  });

  const children = await db.Category.findAll({
    where: {
      companyId: company.id,
      parentCategoryId: category.id,
      isActive: true,
    },
    include: [
      mediaInclude(company.id, "thumbnailAsset"),
      mediaInclude(company.id, "imageAsset"),
      mediaInclude(company.id, "bannerAsset"),
    ],
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
    ],
  });

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

  const productModels = productIds.length
    ? await db.Product.findAll({
        where: {
          companyId: company.id,
          id: { [Op.in]: productIds },
          status: "ACTIVE",
          isSearchable: true,
          ...(search
            ? {
                [Op.or]: [
                  { name: { [Op.iLike]: `%${search}%` } },
                  { parentSku: { [Op.iLike]: `%${search}%` } },
                  { shortDescription: { [Op.iLike]: `%${search}%` } },
                ],
              }
            : {}),
        },
        include: productIncludes({
          companyId: company.id,
          channel: normalizedChannel,
          priceListId: priceList?.id || null,
          now,
        }),
        order: [
          ["isFeatured", "DESC"],
          ["sortOrder", "ASC"],
          ["createdAt", "DESC"],
          [{ model: db.ProductImage, as: "images" }, "displayOrder", "ASC"],
          [{ model: db.ProductVariant, as: "variants" }, "sortOrder", "ASC"],
        ],
        distinct: true,
      })
    : [];

  let products = productModels.map((model) => publicProduct(model, apiBaseUrl));
  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;

  if (Number.isFinite(minPrice)) {
    products = products.filter(
      (product) => Number(product.price?.sellingPrice) >= minPrice
    );
  }
  if (Number.isFinite(maxPrice)) {
    products = products.filter(
      (product) => Number(product.price?.sellingPrice) <= maxPrice
    );
  }

  const filters = await dynamicFilters({
    companyId: company.id,
    categoryIds,
    products,
  });

  const sort = String(query.sort || "FEATURED").trim().toUpperCase();
  products = sortProducts(products, sort);

  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 24), 1), 100);
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const listedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  return {
    company: {
      id: company.id,
      name: company.name,
      code: company.code,
      currency: company.currency,
    },
    category: publicCategory(category, apiBaseUrl),
    breadcrumbs: await breadcrumbs({ companyId: company.id, category }),
    children: children.map((child) => publicCategory(child, apiBaseUrl)),
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

module.exports = {
  getPublicCategory,
};
