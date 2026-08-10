const {
    COLUMN_PREFIX,
    CHANNEL_PUBLISH_STATUSES,
    PRODUCT_STATUSES,
    PRODUCT_TYPES,
    WEIGHT_UNITS,
    DIMENSION_UNITS,
  } = require(
    "../productImport.constants"
  );
  
  const {
    clean,
    cleanUpper,
    normalizeNullable,
    normalizeBoolean,
    normalizeNumber,
    normalizeArray,
    slugify,
    extractVariantColumns,
    extractSpecificationColumns,
    extractRegularPriceColumns,
    extractSellingPriceColumns,
    extractCompareAtPriceColumns,
    extractCostPriceColumns,
    getPriceListCode,
  } = require(
    "../productImport.utils"
  );

  const {
    resolveMediaAssetReference,
  } = require(
    "./lookup.service"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Generic Helpers
  |--------------------------------------------------------------------------
  */
  
  const unique = (
    values
  ) => [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
  
  const hasValue = (
    value
  ) =>
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "";
  
  const normalizeInteger = (
    value,
    fallback = 0
  ) => {
    if (
      !hasValue(value)
    ) {
      return fallback;
    }
  
    const parsed =
      Number(value);
  
    if (
      !Number.isFinite(parsed)
    ) {
      return fallback;
    }
  
    return Math.trunc(
      parsed
    );
  };
  
  const normalizeDecimal = (
    value,
    fallback = null
  ) => {
    if (
      !hasValue(value)
    ) {
      return fallback;
    }
  
    const parsed =
      Number(value);
  
    return Number.isFinite(
      parsed
    )
      ? parsed
      : fallback;
  };
  
  const normalizeBooleanWithDefault =
    (
      value,
      fallback
    ) => {
      if (
        !hasValue(value)
      ) {
        return fallback;
      }
  
      const normalized =
        normalizeBoolean(
          value
        );
  
      return normalized === null
        ? fallback
        : normalized;
    };
  
  const getRowNumber = (
    row,
    fallbackIndex = 0
  ) =>
    Number(
      row?.rowNumber ||
      fallbackIndex + 2
    );
  
  const getFirstRow = (
    productRows
  ) =>
    Array.isArray(
      productRows
    ) &&
    productRows.length
      ? productRows[0]
      : {};

      const resolveMediaAsset = ({
        assetId,
        lookups,
    }) => {
        if (!assetId) {
            return null;
        }
    
        return resolveMediaAssetReference(
            clean(assetId),
            lookups.maps
        );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Column Helpers
  |--------------------------------------------------------------------------
  */
  
  const getCodeFromHeader = (
    header,
    prefix
  ) =>
    cleanUpper(
      String(header || "")
        .substring(
          prefix.length
        )
    );
  
  const buildPricingColumnMap = (
    headers
  ) => {
    const map =
      new Map();
  
    const definitions = [
      {
        field:
          "regularPrice",
  
        prefix:
          COLUMN_PREFIX
            .REGULAR_PRICE,
  
        headers:
          extractRegularPriceColumns(
            headers
          ),
      },
  
      {
        field:
          "sellingPrice",
  
        prefix:
          COLUMN_PREFIX
            .SELLING_PRICE,
  
        headers:
          extractSellingPriceColumns(
            headers
          ),
      },
  
      {
        field:
          "compareAtPrice",
  
        prefix:
          COLUMN_PREFIX
            .COMPARE_AT_PRICE,
  
        headers:
          extractCompareAtPriceColumns(
            headers
          ),
      },
  
      {
        field:
          "costPrice",
  
        prefix:
          COLUMN_PREFIX
            .COST_PRICE,
  
        headers:
          extractCostPriceColumns(
            headers
          ),
      },
    ];
  
    for (
      const definition of
      definitions
    ) {
      for (
        const header of
        definition.headers
      ) {
        const priceListCode =
          getPriceListCode(
            header,
            definition.prefix
          );
  
        if (
          !priceListCode
        ) {
          continue;
        }
  
        if (
          !map.has(
            priceListCode
          )
        ) {
          map.set(
            priceListCode,
            {
              priceListCode,
  
              regularPrice:
                null,
  
              sellingPrice:
                null,
  
              compareAtPrice:
                null,
  
              costPrice:
                null,
            }
          );
        }
  
        map.get(
          priceListCode
        )[
          definition.field
        ] = header;
      }
    }
  
    return map;
  };
  
  const buildDynamicMetadata = (
    headers
  ) => {
    const variantAttributes =
      extractVariantColumns(
        headers
      ).map(
        (
          header,
          index
        ) => ({
          header,
  
          code:
            getCodeFromHeader(
              header,
              COLUMN_PREFIX
                .VARIANT_ATTRIBUTE
            ),
  
          sortOrder:
            index,
        })
      );
  
    const specifications =
      extractSpecificationColumns(
        headers
      ).map(
        (
          header,
          index
        ) => ({
          header,
  
          code:
            getCodeFromHeader(
              header,
              COLUMN_PREFIX
                .SPECIFICATION
            ),
  
          sortOrder:
            index,
        })
      );
  
    return {
      variantAttributes,
  
      specifications,
  
      pricing:
        buildPricingColumnMap(
          headers
        ),
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Master Reference Resolution
  |--------------------------------------------------------------------------
  */
  
  const resolveBrand = ({
    firstRow,
    lookups,
  }) => {
    const brandCode =
      cleanUpper(
        firstRow.brandCode
      );
  
    if (
      !brandCode
    ) {
      return null;
    }
  
    return (
      lookups.maps
        .brandByCode
        .get(
          brandCode
        ) ||
      null
    );
  };
  
  const resolvePrimaryCategory = ({
    firstRow,
    lookups,
  }) => {
    const categorySlug =
      slugify(
        firstRow
          .primaryCategorySlug
      );
  
    if (
      !categorySlug
    ) {
      return null;
    }
  
    return (
      lookups.maps
        .categoryBySlug
        .get(
          categorySlug
        ) ||
      null
    );
  };
  
  const resolveCategories = ({
    firstRow,
    lookups,
  }) => {
    const primarySlug =
      slugify(
        firstRow
          .primaryCategorySlug
      );
  
    const categorySlugs =
      unique([
        primarySlug,
  
        ...normalizeArray(
          firstRow
            .categorySlugs
        )
          .map(
            slugify
          )
          .filter(Boolean),
      ]);
  
    return categorySlugs
      .map(
        (categorySlug) =>
          lookups.maps
            .categoryBySlug
            .get(
              categorySlug
            ) ||
          null
      )
      .filter(Boolean);
  };
  
  const resolveCollections = ({
    firstRow,
    lookups,
  }) => {
    const collectionSlugs =
      unique(
        normalizeArray(
          firstRow
            .collectionSlugs
        )
          .map(
            slugify
          )
          .filter(Boolean)
      );
  
    return collectionSlugs
      .map(
        (collectionSlug) =>
          lookups.maps
            .collectionBySlug
            .get(
              collectionSlug
            ) ||
          null
      )
      .filter(Boolean);
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Channels
  |--------------------------------------------------------------------------
  */
  
  const buildProductChannel = ({
    row,
    channelCode,
    visibleField,
    publishStatusField,
    titleField,
    descriptionField,
  }) => {
    const isVisible =
      normalizeBooleanWithDefault(
        row[
          visibleField
        ],
        true
      );
  
    const publishStatus =
      cleanUpper(
        row[
          publishStatusField
        ] ||
        "DRAFT"
      );
  
    return {
      channelCode,
  
      isVisible,
  
      publishStatus:
        CHANNEL_PUBLISH_STATUSES
          .includes(
            publishStatus
          )
          ? publishStatus
          : "DRAFT",
  
      channelTitle:
        normalizeNullable(
          titleField
            ? row[
                titleField
              ]
            : null
        ),
  
      channelDescription:
        normalizeNullable(
          descriptionField
            ? row[
                descriptionField
              ]
            : null
        ),
    };
  };
  
  const buildProductChannels = (
    firstRow
  ) => [
    buildProductChannel({
      row:
        firstRow,
  
      channelCode:
        "WEBSITE",
  
      visibleField:
        "websiteVisible",
  
      publishStatusField:
        "websitePublishStatus",
  
      titleField:
        "websiteTitle",
  
      descriptionField:
        "websiteDescription",
    }),
  
    buildProductChannel({
      row:
        firstRow,
  
      channelCode:
        "KIOSK",
  
      visibleField:
        "kioskVisible",
  
      publishStatusField:
        "kioskPublishStatus",
  
      titleField:
        "kioskTitle",
  
      descriptionField:
        "kioskDescription",
    }),
  ];
  

  /*
|--------------------------------------------------------------------------
| Product Images
|--------------------------------------------------------------------------
*/

const buildProductImages = ({
    firstRow,
    lookups,
}) => {
    const images = [];

    const primary =
        resolveMediaAsset({
            assetId:
                firstRow.primaryMediaAssetId,
            lookups,
        });

    if (primary) {
        images.push({
            mediaAssetId:
                primary.id,

            imageRole:
                "PRIMARY",

            title:
                normalizeNullable(
                    firstRow.primaryImageTitle
                ),

            altText:
                normalizeNullable(
                    firstRow.primaryImageAltText
                ),

            displayOrder: 1,
        });
    }

    normalizeArray(
        firstRow.galleryMediaAssetIds
    )
        .map(clean)
        .filter(Boolean)
        .forEach(
            (
                assetId,
                index
            ) => {
                const asset =
                    resolveMediaAsset({
                        assetId,
                        lookups,
                    });

                if (!asset) {
                    return;
                }

                images.push({
                    mediaAssetId:
                        asset.id,

                    imageRole:
                        "GALLERY",

                    title: null,

                    altText: null,

                    displayOrder:
                        index + 2,
                });
            }
        );

    return images;
};





  /*
  |--------------------------------------------------------------------------
  | Attribute Option Resolution
  |--------------------------------------------------------------------------
  */
  
  const resolveAttributeOption = ({
    attributeCode,
    rawValue,
    lookups,
  }) => {
    const normalizedCode =
      cleanUpper(
        attributeCode
      );
  
    const normalizedValue =
      cleanUpper(
        rawValue
      );
  
    if (
      !normalizedCode ||
      !normalizedValue
    ) {
      return null;
    }
  
    return (
      lookups.maps
        .optionByAttributeAndValue
        .get(
          `${normalizedCode}:${normalizedValue}`
        ) ||
      lookups.maps
        .optionByAttributeAndLabel
        .get(
          `${normalizedCode}:${normalizedValue}`
        ) ||
      null
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Specification Serialization
  |--------------------------------------------------------------------------
  */
  
  const buildEmptySpecificationValue = (
    attribute
  ) => ({
    attributeId:
      attribute.id,
  
    optionId:
      null,
  
    textValue:
      null,
  
    numberValue:
      null,
  
    booleanValue:
      null,
  
    dateValue:
      null,
  
    jsonValue:
      null,
  
    displayValue:
      null,
  });
  
  const serializeSpecification = ({
    attribute,
    rawValue,
    lookups,
  }) => {
    const text =
      clean(
        rawValue
      );
  
    if (
      !text
    ) {
      return null;
    }
  
    const result =
      buildEmptySpecificationValue(
        attribute
      );
  
    if (
      [
        "SINGLE_SELECT",
        "COLOR_SWATCH",
      ].includes(
        attribute.inputType
      )
    ) {
      const option =
        resolveAttributeOption({
          attributeCode:
            attribute.code,
  
          rawValue:
            text,
  
          lookups,
        });
  
      if (
        !option
      ) {
        return null;
      }
  
      result.optionId =
        option.id;
  
      result.textValue =
        option.value;
  
      result.displayValue =
        option.label;
  
      return result;
    }
  
    switch (
      attribute.dataType
    ) {
      case "NUMBER": {
        result.numberValue =
          normalizeDecimal(
            text,
            null
          );
  
        result.displayValue =
          text;
  
        return result;
      }
  
      case "BOOLEAN": {
        const booleanValue =
          normalizeBoolean(
            text
          );
  
        result.booleanValue =
          booleanValue;
  
        result.displayValue =
          booleanValue === true
            ? "Yes"
            : booleanValue === false
              ? "No"
              : text;
  
        return result;
      }
  
      case "DATE": {
        result.dateValue =
          text;
  
        result.displayValue =
          text;
  
        return result;
      }
  
      case "JSON": {
        try {
          result.jsonValue =
            JSON.parse(
              text
            );
        } catch {
          result.jsonValue =
            null;
        }
  
        result.displayValue =
          text;
  
        return result;
      }
  
      default: {
        result.textValue =
          text;
  
        result.displayValue =
          text;
  
        return result;
      }
    }
  };
  
  const buildProductSpecifications = ({
    firstRow,
    dynamicMetadata,
    lookups,
  }) => {
    const values = [];
  
    for (
      const column of
      dynamicMetadata
        .specifications
    ) {
      const attribute =
        lookups.maps
          .attributeByCode
          .get(
            column.code
          );
  
      if (
        !attribute
      ) {
        continue;
      }
  
      const serialized =
        serializeSpecification({
          attribute,
  
          rawValue:
            firstRow[
              column.header
            ],
  
          lookups,
        });
  
      if (
        serialized
      ) {
        values.push(
          serialized
        );
      }
    }
  
    return values;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Content
  |--------------------------------------------------------------------------
  */
  
  const buildFeatures = (
    firstRow
  ) =>
    normalizeArray(
      firstRow.features
    );
  
  const buildWhatsInTheBox = (
    firstRow
  ) =>
    normalizeArray(
      firstRow
        .whatsInTheBox
    );
  
  /*
  |--------------------------------------------------------------------------
  | Product Core Payload
  |--------------------------------------------------------------------------
  */
  
  const buildProductCorePayload = ({
    firstRow,
    lookups,
    dynamicMetadata,
  }) => {
    const brand =
      resolveBrand({
        firstRow,
        lookups,
      });
  
    const primaryCategory =
      resolvePrimaryCategory({
        firstRow,
        lookups,
      });
  
    const categories =
      resolveCategories({
        firstRow,
        lookups,
      });
  
    const productType =
      cleanUpper(
        firstRow.productType ||
        "SIMPLE"
      );
  
    const status =
      cleanUpper(
        firstRow.status ||
        "DRAFT"
      );
  
    const name =
      clean(
        firstRow.name
      );
  
    const parentSku =
      cleanUpper(
        firstRow.parentSku
      );
  
    const payload = {
      name,
  
      slug:
        slugify(
          firstRow.slug ||
          name
        ),
  
      productType:
        PRODUCT_TYPES.includes(
          productType
        )
          ? productType
          : "SIMPLE",
  
      status:
        PRODUCT_STATUSES.includes(
          status
        )
          ? status
          : "DRAFT",
  
      parentSku,
  
      brandId:
        brand?.id ||
        null,
  
      primaryCategoryId:
        primaryCategory?.id ||
        null,
  
      categoryIds:
        unique(
          categories.map(
            (category) =>
              category.id
          )
        ),
  
      shortDescription:
        normalizeNullable(
          firstRow
            .shortDescription
        ),
  
      description:
        normalizeNullable(
          firstRow.description
        ),
  
      features:
        buildFeatures(
          firstRow
        ),
  
      whatsInTheBox:
        buildWhatsInTheBox(
          firstRow
        ),
  
      warrantyText:
        normalizeNullable(
          firstRow.warrantyText
        ),
  
      taxCode:
        normalizeNullable(
          firstRow.taxCode
        ),
  
      taxPercent:
        normalizeDecimal(
          firstRow.taxPercent,
          0
        ),
  
      sortOrder:
        normalizeInteger(
          firstRow.sortOrder,
          0
        ),
  
      isFeatured:
        normalizeBooleanWithDefault(
          firstRow.isFeatured,
          false
        ),
  
      isSearchable:
        normalizeBooleanWithDefault(
          firstRow.isSearchable,
          true
        ),
  
      metaTitle:
        normalizeNullable(
          firstRow.metaTitle
        ),
  
      metaDescription:
        normalizeNullable(
          firstRow
            .metaDescription
        ),
  
      metaKeywords:
        normalizeNullable(
          firstRow.metaKeywords
        ),
  
      canonicalUrl:
        normalizeNullable(
          firstRow.canonicalUrl
        ),
  
      channels:
        buildProductChannels(
          firstRow
        ),
  
      attributeValues:
        buildProductSpecifications({
          firstRow,
          dynamicMetadata,
          lookups,
        }),

      mediaImportMode:
        cleanUpper(
          firstRow.mediaImportMode ||
          "MERGE"
        ),

      images:
    buildProductImages({
        firstRow,
        lookups,
    }),
    };
  
    return {
      payload,
  
      resolved: {
        brand,
  
        primaryCategory,
  
        categories,
  
        collections:
          resolveCollections({
            firstRow,
            lookups,
          }),
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Preview Metadata
  |--------------------------------------------------------------------------
  */
  
  const buildResolvedReferenceSummary = (
    resolved
  ) => ({
    brand:
      resolved.brand
        ? {
            id:
              resolved.brand.id,
  
            code:
              resolved.brand.code,
  
            name:
              resolved.brand.name,
          }
        : null,
  
    primaryCategory:
      resolved.primaryCategory
        ? {
            id:
              resolved
                .primaryCategory
                .id,
  
            slug:
              resolved
                .primaryCategory
                .slug,
  
            name:
              resolved
                .primaryCategory
                .name,
          }
        : null,
  
    categories:
      resolved.categories.map(
        (category) => ({
          id:
            category.id,
  
          slug:
            category.slug,
  
          name:
            category.name,
        })
      ),
  
    collections:
      resolved.collections.map(
        (collection) => ({
          id:
            collection.id,
  
          slug:
            collection.slug,
  
          name:
            collection.name,
        })
      ),
  });
  
  /*
  |--------------------------------------------------------------------------
  | Temporary Export Surface
  |--------------------------------------------------------------------------
  |
  | Part 2 will add:
  |
  | - buildVariantAttributeValues
  | - buildVariantChannels
  | - buildVariantPrices
  | - buildVariant
  | - buildVariants
  |
  | Part 3 will add:
  |
  | - buildProductImportPayload
  | - buildGroupedProductPayloads
  | - final exports
  |--------------------------------------------------------------------------
  */
  
  
  /*
|--------------------------------------------------------------------------
| Variant Attribute Builder
|--------------------------------------------------------------------------
*/

const buildVariantAttributeValues = ({
    row,
    dynamicMetadata,
    lookups,
  }) => {
    const values = [];
  
    for (const column of dynamicMetadata.variantAttributes) {
      const rawValue = clean(
        row[column.header]
      );
  
      if (!rawValue) {
        continue;
      }
  
      const attribute =
        lookups.maps.attributeByCode.get(
          column.code
        );
  
      if (!attribute) {
        continue;
      }
  
      const option =
        resolveAttributeOption({
          attributeCode:
            column.code,
          rawValue,
          lookups,
        });
  
      if (!option) {
        continue;
      }
  
      values.push({
        attributeId:
          attribute.id,
  
        optionId:
          option.id,
  
        displayValue:
          option.label,
  
        sortOrder:
          column.sortOrder,
      });
    }
  
    return values;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Key
  |--------------------------------------------------------------------------
  */
  
  const buildVariantKey = (
    values
  ) =>
    values
      .slice()
      .sort((a, b) =>
        String(
          a.attributeId
        ).localeCompare(
          String(
            b.attributeId
          )
        )
      )
      .map(
        (item) =>
          `${item.attributeId}:${item.optionId}`
      )
      .join("|");


/*
|--------------------------------------------------------------------------
| Variant Channels
|--------------------------------------------------------------------------
*/

const buildVariantChannels =
  (
    productChannels
  ) =>
    productChannels.map(
      (
        channel
      ) => ({
        channelCode:
          channel.channelCode,

        isVisible:
          channel.isVisible,
      })
    );


    const getVariantMediaGroupCode = (
  row
) =>
  cleanUpper(
    row?.variantMediaGroup
  );

const hasVariantMediaDefinition = (
  row
) =>
  Boolean(
    clean(
      row?.variantPrimaryMediaAssetId
    ) ||
    clean(
      row?.variantGalleryMediaAssetIds
    ) ||
    clean(
      row?.variantSwatchMediaAssetId
    ) ||
    clean(
      row?.variantMediaAssetId
    )
  );

const buildVariantMediaGroupMap = (
  productRows
) => {
  const groups = new Map();

  for (const row of productRows || []) {
    const groupCode =
      getVariantMediaGroupCode(
        row
      );

    if (
      !groupCode ||
      !hasVariantMediaDefinition(
        row
      )
    ) {
      continue;
    }

    if (!groups.has(groupCode)) {
      groups.set(
        groupCode,
        row
      );
    }
  }

  return groups;
};

const getEffectiveVariantMediaRow = ({
  row,
  variantMediaGroups,
}) => {
  const groupCode =
    getVariantMediaGroupCode(
      row
    );

  if (
    !groupCode ||
    hasVariantMediaDefinition(
      row
    )
  ) {
    return row;
  }

  const groupRow =
    variantMediaGroups?.get(
      groupCode
    );

  if (!groupRow) {
    return row;
  }

  return {
    ...row,

    variantMediaImportMode:
      row.variantMediaImportMode ||
      groupRow.variantMediaImportMode,

    variantPrimaryMediaAssetId:
      groupRow
        .variantPrimaryMediaAssetId,

    variantGalleryMediaAssetIds:
      groupRow
        .variantGalleryMediaAssetIds,

    variantSwatchMediaAssetId:
      groupRow
        .variantSwatchMediaAssetId,

    variantMediaAssetId:
      groupRow
        .variantMediaAssetId,

    variantImageRole:
      groupRow.variantImageRole,

    variantImageTitle:
      groupRow.variantImageTitle,

    variantImageAltText:
      groupRow.variantImageAltText,
  };
};

const buildVariantImages = ({
    row,
    lookups,
  }) => {
    const images = [];
    const addedAssetIds = new Set();

    const addImage = ({
      reference,
      imageRole,
      title = null,
      altText = null,
      displayOrder,
    }) => {
      if (!clean(reference)) {
        return;
      }

      const asset = resolveMediaAsset({
        assetId: reference,
        lookups,
      });

      if (!asset || addedAssetIds.has(asset.id)) {
        return;
      }

      addedAssetIds.add(asset.id);

      images.push({
        mediaAssetId: asset.id,
        imageRole,
        title: normalizeNullable(title),
        altText: normalizeNullable(altText),
        displayOrder,
      });
    };

    addImage({
      reference: row.variantPrimaryMediaAssetId,
      imageRole: "PRIMARY",
      title: row.variantImageTitle,
      altText: row.variantImageAltText,
      displayOrder: 0,
    });

    normalizeArray(row.variantGalleryMediaAssetIds)
      .map(clean)
      .filter(Boolean)
      .forEach((reference, index) => {
        addImage({
          reference,
          imageRole: "GALLERY",
          displayOrder: index + 1,
        });
      });

    addImage({
      reference: row.variantSwatchMediaAssetId,
      imageRole: "SWATCH",
      displayOrder: images.length + 1,
    });

    if (
      !clean(row.variantPrimaryMediaAssetId) &&
      clean(row.variantMediaAssetId)
    ) {
      addImage({
        reference: row.variantMediaAssetId,
        imageRole: cleanUpper(
          row.variantImageRole || "PRIMARY"
        ),
        title: row.variantImageTitle,
        altText: row.variantImageAltText,
        displayOrder: images.length,
      });
    }

    return images;
  };

/*
|--------------------------------------------------------------------------
| Variant Prices
|--------------------------------------------------------------------------
*/

const buildVariantPrices =
  ({
    row,
    dynamicMetadata,
    lookups,
  }) => {
    const prices = [];

    for (const [
      priceListCode,
      pricingColumns,
    ] of dynamicMetadata.pricing) {
      const priceList =
        lookups.maps.priceListByCode.get(
          priceListCode
        );

      if (!priceList) {
        continue;
      }

      const regularPrice =
        pricingColumns.regularPrice
          ? normalizeDecimal(
              row[
                pricingColumns
                  .regularPrice
              ]
            )
          : null;

      const sellingPrice =
        pricingColumns.sellingPrice
          ? normalizeDecimal(
              row[
                pricingColumns
                  .sellingPrice
              ]
            )
          : null;

      const compareAtPrice =
        pricingColumns.compareAtPrice
          ? normalizeDecimal(
              row[
                pricingColumns
                  .compareAtPrice
              ]
            )
          : null;

      const costPrice =
        pricingColumns.costPrice
          ? normalizeDecimal(
              row[
                pricingColumns
                  .costPrice
              ]
            )
          : null;

      const hasAnyPrice =
        [
          regularPrice,
          sellingPrice,
          compareAtPrice,
          costPrice,
        ].some(
          (v) => v !== null
        );

      if (!hasAnyPrice) {
        continue;
      }

      prices.push({
        priceListId:
          priceList.id,

        regularPrice,

        sellingPrice,

        compareAtPrice,

        costPrice,

        minimumQuantity: 1,

        maximumQuantity:
          null,

        validFrom:
          null,

        validUntil:
          null,

        priority:
          100,

        isActive:
          true,
      });
    }

    return prices;
  };


  /*
|--------------------------------------------------------------------------
| Variant Builder
|--------------------------------------------------------------------------
*/

const buildVariant =
({
  row,
  index,
  productPayload,
  dynamicMetadata,
  lookups,
  variantMediaGroups,
}) => {
  const effectiveMediaRow =
    getEffectiveVariantMediaRow({
      row,
      variantMediaGroups,
    });

  const attributeValues =
    buildVariantAttributeValues({
      row,
      dynamicMetadata,
      lookups,
    });

  return {
    sku:
  cleanUpper(
    row.variantSku
  ) ||
  (
    productPayload.productType ===
    "SIMPLE"
      ? cleanUpper(
          productPayload.parentSku
        )
      : ""
  ),

    barcode:
      normalizeNullable(
        row.barcode
      ),

    name:
      clean(
        row.variantName
      ) ||
      clean(
        row.name
      ),

    variantKey:
      attributeValues.length
        ? buildVariantKey(
            attributeValues
          )
        : "DEFAULT",

    isDefault:
      normalizeBooleanWithDefault(
        row.isDefault,
        index === 0
      ),

      status: (() => {
        const variantStatus =
          cleanUpper(
            row.variantStatus ||
              row.status ||
              "DRAFT"
          );
      
        return PRODUCT_STATUSES.includes(
          variantStatus
        )
          ? variantStatus
          : "DRAFT";
      })(),

    weight:
      normalizeDecimal(
        row.weight
      ),

    weightUnit:
      cleanUpper(
        row.weightUnit
      ) || null,

    length:
      normalizeDecimal(
        row.length
      ),

    width:
      normalizeDecimal(
        row.width
      ),

    height:
      normalizeDecimal(
        row.height
      ),

    dimensionUnit:
      cleanUpper(
        row.dimensionUnit
      ) || null,

    sortOrder:
      normalizeInteger(
        row.variantSortOrder,
        index
      ),

    attributeValues,

    channels:
      buildVariantChannels(
        productPayload.channels
      ),

    prices:
      buildVariantPrices({
        row,
        dynamicMetadata,
        lookups,
      }),


      mediaImportMode:
        cleanUpper(
          effectiveMediaRow.variantMediaImportMode ||
          productPayload.mediaImportMode ||
          "MERGE"
        ),

      images:
    buildVariantImages({
      row:
        effectiveMediaRow,
      lookups,
    }),
  };

  
};

/*
|--------------------------------------------------------------------------
| Build Variants
|--------------------------------------------------------------------------
*/

const buildVariants =
  ({
    productRows,
    productPayload,
    dynamicMetadata,
    lookups,
  }) => {
    const variantMediaGroups =
      buildVariantMediaGroupMap(
        productRows
      );

    return productRows.map(
      (
        row,
        index
      ) =>
        buildVariant({
          row,
          index,
          productPayload,
          dynamicMetadata,
          lookups,
          variantMediaGroups,
        })
    );
  };

    /*
|--------------------------------------------------------------------------
| Collection Assignments
|--------------------------------------------------------------------------
*/

const buildCollectionAssignments = (
    resolvedCollections
  ) =>
    resolvedCollections.map(
      (
        collection,
        index
      ) => ({
        collectionId:
          collection.id,
  
        sortOrder:
          index,
  
        isActive:
          true,
      })
    );
  
  /*
  |--------------------------------------------------------------------------
  | Product Category Assignments
  |--------------------------------------------------------------------------
  */
  
  const buildCategoryAssignments = ({
    resolvedCategories,
    primaryCategory,
  }) =>
    resolvedCategories.map(
      (
        category,
        index
      ) => ({
        categoryId:
          category.id,
  
        isPrimary:
          primaryCategory
            ? category.id ===
              primaryCategory.id
            : index === 0,
  
        sortOrder:
          index,
      })
    );
  
  /*
  |--------------------------------------------------------------------------
  | Price Extraction
  |--------------------------------------------------------------------------
  |
  | Product creation may accept nested variant prices, while the pricing
  | module may also need a separate execution list.
  |
  | This function creates a flat price-operation array without removing
  | the nested variant prices from the product payload.
  |--------------------------------------------------------------------------
  */
  
  const buildPriceOperations = ({
    variants,
    parentSku,
  }) => {
    const operations = [];
  
    for (
      const variant of
      variants
    ) {
      for (
        const price of
        variant.prices || []
      ) {
        operations.push({
          parentSku,
  
          variantSku:
            variant.sku,
  
          priceListId:
            price.priceListId,
  
          regularPrice:
            price.regularPrice,
  
          sellingPrice:
            price.sellingPrice,
  
          compareAtPrice:
            price.compareAtPrice,
  
          costPrice:
            price.costPrice,
  
          minimumQuantity:
            price.minimumQuantity,
  
          maximumQuantity:
            price.maximumQuantity,
  
          validFrom:
            price.validFrom,
  
          validUntil:
            price.validUntil,
  
          priority:
            price.priority,
  
          isActive:
            price.isActive,
        });
      }
    }
  
    return operations;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Summary
  |--------------------------------------------------------------------------
  */
  
  const buildVariantSummary = (
    variants
  ) => ({
    count:
      variants.length,
  
    defaultSku:
      variants.find(
        (variant) =>
          variant.isDefault ===
          true
      )?.sku || null,
  
    skus:
      variants
        .map(
          (variant) =>
            variant.sku
        )
        .filter(Boolean),
  
    barcodes:
      variants
        .map(
          (variant) =>
            variant.barcode
        )
        .filter(Boolean),
  
    priceCount:
      variants.reduce(
        (
          total,
          variant
        ) =>
          total +
          (
            variant.prices
              ?.length || 0
          ),
        0
      ),
  });
  
  /*
  |--------------------------------------------------------------------------
  | Product Import Payload
  |--------------------------------------------------------------------------
  */
  
  const buildProductImportPayload = ({
    productRows,
    headers,
    lookups,
    validationResult =
      null,
  }) => {
    if (
      !Array.isArray(
        productRows
      ) ||
      productRows.length ===
        0
    ) {
      throw new Error(
        "Cannot build product import payload without product rows."
      );
    }
  
    if (
      !lookups?.maps
    ) {
      throw new Error(
        "Product import lookups are required."
      );
    }
  
    const firstRow =
      getFirstRow(
        productRows
      );
  
    const dynamicMetadata =
      buildDynamicMetadata(
        headers || []
      );
  
    const {
      payload:
        productPayload,
  
      resolved,
    } =
      buildProductCorePayload({
        firstRow,
  
        lookups,
  
        dynamicMetadata,
      });
  
    const variants =
      buildVariants({
        productRows,
  
        productPayload,
  
        dynamicMetadata,
  
        lookups,
      });
  
    const categoryAssignments =
      buildCategoryAssignments({
        resolvedCategories:
          resolved.categories,
  
        primaryCategory:
          resolved.primaryCategory,
      });
  
    const collectionAssignments =
      buildCollectionAssignments(
        resolved.collections
      );
  
    const priceOperations =
      buildPriceOperations({
        variants,
  
        parentSku:
          productPayload.parentSku,
      });
  
      const createPayload = {
        ...productPayload,
      
        categoryIds:
          categoryAssignments.map(
            (assignment) =>
              assignment.categoryId
          ),
      
        categories:
          categoryAssignments,
      
        collectionIds:
          collectionAssignments.map(
            (assignment) =>
              assignment.collectionId
          ),
      
        collections:
          collectionAssignments,
      
        variants,
      };
  
    const updatePayload = {
      ...createPayload,
    };
  
    const action =
      validationResult?.action ||
      (
        validationResult
          ?.existingProduct
          ? "UPDATE"
          : "CREATE"
      );
  
    return {
      parentSku:
        productPayload.parentSku,
  
      productType:
        productPayload.productType,
  
      action,
  
      valid:
        !validationResult ||
        (
          validationResult
            .errors
            ?.length || 0
        ) === 0,
  
      rowNumbers:
        validationResult
          ?.rowNumbers ||
        productRows.map(
          (
            row,
            index
          ) =>
            getRowNumber(
              row,
              index
            )
        ),
  
      existingProductId:
        validationResult
          ?.existingProduct
          ?.id ||
        null,
  
      createPayload,
  
      updatePayload,
  
      associations: {
        categories:
          categoryAssignments,
  
        collections:
          collectionAssignments,
      },
  
      pricing: {
        operations:
          priceOperations,
  
        count:
          priceOperations.length,
      },
  
      resolved:
        buildResolvedReferenceSummary(
          resolved
        ),
  
      summary:
        buildVariantSummary(
          variants
        ),
  
      validation: {
        errors:
          validationResult
            ?.errors || [],
  
        warnings:
          validationResult
            ?.warnings || [],
      },
  
      source: {
        rows:
          productRows,
  
        dynamicColumns: {
          variantAttributes:
            dynamicMetadata
              .variantAttributes
              .map(
                (
                  column
                ) => ({
                  header:
                    column.header,
  
                  code:
                    column.code,
                })
              ),
  
          specifications:
            dynamicMetadata
              .specifications
              .map(
                (
                  column
                ) => ({
                  header:
                    column.header,
  
                  code:
                    column.code,
                })
              ),
  
          priceLists: [
            ...dynamicMetadata
              .pricing
              .keys(),
          ],
        },
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Safe Product Payload Builder
  |--------------------------------------------------------------------------
  |
  | Used by preview.service.js.
  |
  | Invalid groups are returned as SKIP records rather than throwing,
  | allowing the preview to show every invalid product.
  |--------------------------------------------------------------------------
  */
  
  const buildSafeProductImportPayload = ({
    productRows,
    headers,
    lookups,
    validationResult,
  }) => {
    const parentSku =
      cleanUpper(
        productRows?.[0]
          ?.parentSku
      );

      if (!validationResult) {
        return {
          parentSku,
          productType: cleanUpper(
            productRows?.[0]?.productType
          ),
          action: "SKIP",
          valid: false,
          rowNumbers: productRows.map(
            (row, index) =>
              getRowNumber(row, index)
          ),
          existingProductId: null,
          createPayload: null,
          updatePayload: null,
          associations: {
            categories: [],
            collections: [],
          },
          pricing: {
            operations: [],
            count: 0,
          },
          resolved: null,
          summary: {
            count: productRows.length,
            defaultSku: null,
            skus: productRows
              .map((row) =>
                cleanUpper(row.variantSku)
              )
              .filter(Boolean),
            barcodes: productRows
              .map((row) => clean(row.barcode))
              .filter(Boolean),
            priceCount: 0,
          },
          validation: {
            errors: [
              `Validation result is missing for product "${parentSku || "Unknown"}".`,
            ],
            warnings: [],
          },
          source: {
            rows: productRows,
            dynamicColumns: null,
          },
        };
      }

  
    if (
      validationResult
        ?.errors
        ?.length
    ) {
      return {
        parentSku,
  
        productType:
          cleanUpper(
            productRows?.[0]
              ?.productType
          ),
  
        action:
          "SKIP",
  
        valid:
          false,
  
        rowNumbers:
          validationResult
            .rowNumbers ||
          productRows.map(
            (
              row,
              index
            ) =>
              getRowNumber(
                row,
                index
              )
          ),
  
        existingProductId:
          validationResult
            .existingProduct
            ?.id ||
          null,
  
        createPayload:
          null,
  
        updatePayload:
          null,
  
        associations: {
          categories:
            [],
  
          collections:
            [],
        },
  
        pricing: {
          operations:
            [],
  
          count:
            0,
        },
  
        resolved:
          null,
  
        summary: {
          count:
            productRows.length,
  
          defaultSku:
            null,
  
          skus:
            productRows
              .map(
                (row) =>
                  cleanUpper(
                    row.variantSku
                  )
              )
              .filter(Boolean),
  
          barcodes:
            productRows
              .map(
                (row) =>
                  clean(
                    row.barcode
                  )
              )
              .filter(Boolean),
  
          priceCount:
            0,
        },
  
        validation: {
          errors:
            validationResult
              .errors || [],
  
          warnings:
            validationResult
              .warnings || [],
        },
  
        source: {
          rows:
            productRows,
  
          dynamicColumns:
            null,
        },
      };
    }
  
    try {
      return buildProductImportPayload({
        productRows,
  
        headers,
  
        lookups,
  
        validationResult,
      });
    } catch (
      error
    ) {
      return {
        parentSku,
  
        productType:
          cleanUpper(
            productRows?.[0]
              ?.productType
          ),
  
        action:
          "SKIP",
  
        valid:
          false,
  
        rowNumbers:
          productRows.map(
            (
              row,
              index
            ) =>
              getRowNumber(
                row,
                index
              )
          ),
  
        existingProductId:
          validationResult
            ?.existingProduct
            ?.id ||
          null,
  
        createPayload:
          null,
  
        updatePayload:
          null,
  
        associations: {
          categories:
            [],
  
          collections:
            [],
        },
  
        pricing: {
          operations:
            [],
  
          count:
            0,
        },
  
        resolved:
          null,
  
        summary: {
          count:
            productRows.length,
  
          defaultSku:
            null,
  
          skus:
            [],
  
          barcodes:
            [],
  
          priceCount:
            0,
        },
  
        validation: {
          errors: [
            `Unable to build payload for product "${parentSku || "Unknown"}": ${error.message}`,
          ],
  
          warnings:
            validationResult
              ?.warnings || [],
        },
  
        source: {
          rows:
            productRows,
  
          dynamicColumns:
            null,
        },
      };
    }
  };
  
  /*
  |--------------------------------------------------------------------------
  | Validation Result Mapping
  |--------------------------------------------------------------------------
  */
  
  const createValidationMap = (
    validationResults
  ) => {
    const map =
      new Map();
  
    for (
      const result of
      validationResults || []
    ) {
      const parentSku =
        cleanUpper(
          result.parentSku
        );
  
      if (
        !parentSku
      ) {
        continue;
      }
  
      map.set(
        parentSku,
        result
      );
    }
  
    return map;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Build Grouped Product Payloads
  |--------------------------------------------------------------------------
  */
  
  const buildGroupedProductPayloads = ({
    groupedProducts,
    headers,
    lookups,
    validationResults = [],
  }) => {
    if (!Array.isArray(groupedProducts)) {
      return [];
    }
  
    return groupedProducts.map((productRows, index) => {
      const validationResult =
        validationResults[index] || null;
  
      return buildSafeProductImportPayload({
        productRows,
        headers,
        lookups,
        validationResult,
      });
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Payload Summary
  |--------------------------------------------------------------------------
  */
  
  const buildPayloadSummary = (
    products
  ) =>
    products.reduce(
      (
        summary,
        product
      ) => {
        summary.total +=
          1;
  
        summary.rows +=
          product.rowNumbers
            ?.length || 0;
  
        summary.variants +=
          product.summary
            ?.count || 0;
  
        summary.prices +=
          product.pricing
            ?.count || 0;
  
        if (
          product.valid
        ) {
          summary.valid +=
            1;
        } else {
          summary.invalid +=
            1;
        }
  
        switch (
          product.action
        ) {
          case "CREATE":
            summary.create +=
              1;
            break;
  
          case "UPDATE":
            summary.update +=
              1;
            break;
  
          case "NO_CHANGE":
            summary.noChange +=
              1;
            break;
  
          default:
            summary.skip +=
              1;
            break;
        }
  
        summary.errors +=
          product.validation
            ?.errors
            ?.length || 0;
  
        summary.warnings +=
          product.validation
            ?.warnings
            ?.length || 0;
  
        return summary;
      },
      {
        total:
          0,
  
        valid:
          0,
  
        invalid:
          0,
  
        create:
          0,
  
        update:
          0,
  
        noChange:
          0,
  
        skip:
          0,
  
        rows:
          0,
  
        variants:
          0,
  
        prices:
          0,
  
        errors:
          0,
  
        warnings:
          0,
      }
    );
  
  /*
  |--------------------------------------------------------------------------
  | Build Complete Import Payload
  |--------------------------------------------------------------------------
  */
  
  const buildImportPayload = ({
    groupedProducts,
    headers,
    lookups,
    validationResults =
      [],
  }) => {
    const products =
      buildGroupedProductPayloads({
        groupedProducts,
  
        headers,
  
        lookups,
  
        validationResults,
      });
  
    return {
      products,
  
      summary:
        buildPayloadSummary(
          products
        ),
    };
  };




/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | Main Public Builders
    |--------------------------------------------------------------------------
    */
  
    buildImportPayload,
  
    buildGroupedProductPayloads,
  
    buildProductImportPayload,
  
    buildSafeProductImportPayload,
  
    /*
    |--------------------------------------------------------------------------
    | Product Builders
    |--------------------------------------------------------------------------
    */
  
    buildProductCorePayload,
  
    buildProductChannels,
  
    buildProductSpecifications,
  
    serializeSpecification,
  
    buildCollectionAssignments,
  
    buildCategoryAssignments,
  
    /*
    |--------------------------------------------------------------------------
    | Variant Builders
    |--------------------------------------------------------------------------
    */
  
    buildVariants,
  
    buildVariant,
  
    buildVariantAttributeValues,
  
    buildVariantKey,
  
    buildVariantChannels,
  
    /*
    |--------------------------------------------------------------------------
    | Pricing Builders
    |--------------------------------------------------------------------------
    */
  
    buildVariantPrices,
  
    buildPriceOperations,
  
    buildPricingColumnMap,
  
    /*
    |--------------------------------------------------------------------------
    | Lookup Resolution
    |--------------------------------------------------------------------------
    */
  
    resolveBrand,
  
    resolvePrimaryCategory,
  
    resolveCategories,
  
    resolveCollections,
  
    resolveAttributeOption,
  
    /*
    |--------------------------------------------------------------------------
    | Metadata and Summaries
    |--------------------------------------------------------------------------
    */
  
    buildDynamicMetadata,
  
    buildResolvedReferenceSummary,
  
    buildVariantSummary,
  
    buildPayloadSummary,
  
    createValidationMap,
  
    /*
    |--------------------------------------------------------------------------
    | Shared Helpers
    |--------------------------------------------------------------------------
    */
  
    getFirstRow,
  
    getRowNumber,
  
    hasValue,
  
    normalizeInteger,
  
    normalizeDecimal,
  
    normalizeBooleanWithDefault,

    buildProductImages,
    buildVariantImages,
    resolveMediaAsset,
  };