const {
    Op,
  } = require("sequelize");
  
  const db = require(
    "../../../models"
  );
  
  const {
    clean,
    cleanUpper,
    slugify,
    normalizeArray,
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
  

  const resolveMediaAssetReference = (
    reference,
    lookups
  ) => {
    const value = String(
      reference || ""
    ).trim();
  
    if (!value) {
      return null;
    }
  
    const byId =
      lookups.mediaAssetById?.get(value);
  
    if (byId) {
      return byId;
    }
  
    return (
      lookups.mediaAssetByOriginalFileName?.get(
        value.toLowerCase()
      ) || null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Generic Map Helpers
  |--------------------------------------------------------------------------
  */
  
  const buildMap = (
    rows,
    keyBuilder
  ) =>
    new Map(
      rows.map((row) => [
        keyBuilder(row),
        row,
      ])
    );
  
  const uniqueValues = (
    values
  ) => [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Collect Brand Codes
  |--------------------------------------------------------------------------
  */
  
  const collectBrandCodes = (
    rows
  ) =>
    uniqueValues(
      rows
        .map((row) =>
          cleanUpper(
            row.brandCode
          )
        )
        .filter(Boolean)
    );
  
  /*
  |--------------------------------------------------------------------------
  | Collect Category Slugs
  |--------------------------------------------------------------------------
  */
  
  const collectCategorySlugs = (
    rows
  ) => {
    const values = [];
  
    for (const row of rows) {
      const primarySlug =
        slugify(
          row.primaryCategorySlug
        );
  
      if (primarySlug) {
        values.push(
          primarySlug
        );
      }
  
      const secondarySlugs =
        normalizeArray(
          row.categorySlugs
        ).map(slugify);
  
      values.push(
        ...secondarySlugs
      );
    }
  
    return uniqueValues(
      values
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Collect Collection Slugs
  |--------------------------------------------------------------------------
  */
  
  const collectCollectionSlugs = (
    rows
  ) => {
    const values = rows.flatMap(
      (row) =>
        normalizeArray(
          row.collectionSlugs
        ).map(slugify)
    );
  
    return uniqueValues(
      values
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Collect Dynamic Attribute Codes
  |--------------------------------------------------------------------------
  */
  
  const collectAttributeCodes = ({
    headers,
  }) => {
    const variantHeaders =
      extractVariantColumns(
        headers
      );
  
    const specificationHeaders =
      extractSpecificationColumns(
        headers
      );
  
    const codes = [
      ...variantHeaders.map(
        (header) =>
          cleanUpper(
            header.substring(
              "variant:".length
            )
          )
      ),
  
      ...specificationHeaders.map(
        (header) =>
          cleanUpper(
            header.substring(
              "spec:".length
            )
          )
      ),
    ];
  
    return uniqueValues(
      codes
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Collect Attribute Option Values
  |--------------------------------------------------------------------------
  */
  
  const collectAttributeOptionReferences = ({
    rows,
    headers,
  }) => {
    const variantHeaders =
      extractVariantColumns(
        headers
      );
  
    const specificationHeaders =
      extractSpecificationColumns(
        headers
      );
  
    const references = [];
  
    for (const row of rows) {
      for (
        const header of
        variantHeaders
      ) {
        const attributeCode =
          cleanUpper(
            header.substring(
              "variant:".length
            )
          );
  
        const optionValue =
          clean(row[header]);
  
        if (
          attributeCode &&
          optionValue
        ) {
          references.push({
            attributeCode,
            optionValue,
          });
        }
      }
  
      for (
        const header of
        specificationHeaders
      ) {
        const attributeCode =
          cleanUpper(
            header.substring(
              "spec:".length
            )
          );
  
        const optionValue =
          clean(row[header]);
  
        if (
          attributeCode &&
          optionValue
        ) {
          references.push({
            attributeCode,
            optionValue,
          });
        }
      }
    }
  
    const result = new Map();
  
    for (const reference of references) {
      const key =
        reference.attributeCode;
  
      if (!result.has(key)) {
        result.set(
          key,
          new Set()
        );
      }
  
      result
        .get(key)
        .add(
          reference.optionValue
            .trim()
            .toUpperCase()
        );
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Collect Price List Codes
  |--------------------------------------------------------------------------
  */
  
  const collectPriceListCodes = (
    headers
  ) => {
    const priceHeaders = [
      ...extractRegularPriceColumns(
        headers
      ),
      ...extractSellingPriceColumns(
        headers
      ),
      ...extractCompareAtPriceColumns(
        headers
      ),
      ...extractCostPriceColumns(
        headers
      ),
    ];
  
    return uniqueValues(
      priceHeaders
        .map((header) => {
          if (
            header
              .toLowerCase()
              .startsWith(
                "regularprice:"
              )
          ) {
            return getPriceListCode(
              header,
              "regularPrice:"
            );
          }
  
          if (
            header
              .toLowerCase()
              .startsWith(
                "sellingprice:"
              )
          ) {
            return getPriceListCode(
              header,
              "sellingPrice:"
            );
          }
  
          if (
            header
              .toLowerCase()
              .startsWith(
                "compareatprice:"
              )
          ) {
            return getPriceListCode(
              header,
              "compareAtPrice:"
            );
          }
  
          if (
            header
              .toLowerCase()
              .startsWith(
                "costprice:"
              )
          ) {
            return getPriceListCode(
              header,
              "costPrice:"
            );
          }
  
          return "";
        })
        .filter(Boolean)
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Collect Existing Product Keys
  |--------------------------------------------------------------------------
  */
  
  const collectParentSkus = (
    rows
  ) =>
    uniqueValues(
      rows
        .map((row) =>
          cleanUpper(
            row.parentSku
          )
        )
        .filter(Boolean)
    );
  
  const collectVariantSkus = (
    rows
  ) =>
    uniqueValues(
      rows
        .map((row) =>
          cleanUpper(
            row.variantSku
          )
        )
        .filter(Boolean)
    );
  
  const collectBarcodes = (
    rows
  ) =>
    uniqueValues(
      rows
        .map((row) =>
          clean(
            row.barcode
          )
        )
        .filter(Boolean)
    );
  
  /*
  |--------------------------------------------------------------------------
  | Collect Media Asset IDs
  |--------------------------------------------------------------------------
  */
  
  const collectMediaAssetIds = (
    rows
  ) => {
    const values = [];

    for (const row of rows || []) {
      const singleReferences = [
        row.primaryMediaAssetId,
        row.variantMediaAssetId,
        row.variantPrimaryMediaAssetId,
        row.variantSwatchMediaAssetId,
      ];

      for (const reference of singleReferences) {
        const value = clean(reference);
        if (value) {
          values.push(value);
        }
      }

      values.push(
        ...normalizeArray(row.galleryMediaAssetIds)
          .map(clean)
          .filter(Boolean)
      );

      values.push(
        ...normalizeArray(row.variantGalleryMediaAssetIds)
          .map(clean)
          .filter(Boolean)
      );
    }

    return uniqueValues(values);
  };

  /*
  |--------------------------------------------------------------------------
  | Load Brands
  |--------------------------------------------------------------------------
  */
  
  const loadBrands = async ({
    companyId,
    brandCodes,
    transaction,
  }) => {
    if (!brandCodes.length) {
      return [];
    }
  
    return db.Brand.findAll({
      where: {
        companyId,
  
        code: {
          [Op.in]:
            brandCodes,
        },
      },
  
      attributes: [
        "id",
        "code",
        "name",
        "isActive",
      ],
  
      transaction,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Categories
  |--------------------------------------------------------------------------
  */
  
  const loadCategories = async ({
    companyId,
    categorySlugs,
    transaction,
  }) => {
    if (
      !categorySlugs.length
    ) {
      return [];
    }
  
    return db.Category.findAll({
      where: {
        companyId,
  
        slug: {
          [Op.in]:
            categorySlugs,
        },
      },
  
      attributes: [
        "id",
        "name",
        "slug",
        "isActive",
        "categoryPath",
        "level",
      ],
  
      transaction,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Collections
  |--------------------------------------------------------------------------
  */
  
  const loadCollections = async ({
    companyId,
    collectionSlugs,
    transaction,
  }) => {
    if (
      !collectionSlugs.length
    ) {
      return [];
    }
  
    return db.Collection.findAll({
      where: {
        companyId,
  
        slug: {
          [Op.in]:
            collectionSlugs,
        },
      },
  
      attributes: [
        "id",
        "name",
        "slug",
        "isActive",
      ],
  
      transaction,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Attributes And Options
  |--------------------------------------------------------------------------
  */
  
  const loadAttributes = async ({
    companyId,
    attributeCodes,
    transaction,
  }) => {
    if (
      !attributeCodes.length
    ) {
      return [];
    }
  
    return db.Attribute.findAll({
      where: {
        companyId,
  
        code: {
          [Op.in]:
            attributeCodes,
        },
      },
  
      attributes: [
        "id",
        "code",
        "name",
        "inputType",
        "dataType",
        "unit",
        "isVariantDefining",
        "isRequired",
        "isActive",
      ],
  
      include: [
        {
          model:
            db.AttributeOption,
  
          as:
            "options",
  
          required:
            false,
  
          attributes: [
            "id",
            "attributeId",
            "label",
            "value",
            "swatchValue",
            "isActive",
            "displayOrder",
          ],
        },
      ],
  
      transaction,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Price Lists
  |--------------------------------------------------------------------------
  */
  
  const loadPriceLists = async ({
    companyId,
    priceListCodes,
    transaction,
  }) => {
    if (
      !priceListCodes.length
    ) {
      return [];
    }
  
    return db.PriceList.findAll({
      where: {
        companyId,
  
        code: {
          [Op.in]:
            priceListCodes,
        },
      },
  
      attributes: [
        "id",
        "code",
        "name",
        "currencyCode",
        "channelCode",
        "priceListType",
        "isTaxInclusive",
        "isDefault",
        "isActive",
      ],
  
      transaction,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Media Assets
  |--------------------------------------------------------------------------
  */
  
  const loadMediaAssets = async ({
    companyId,
    mediaAssetIds,
    transaction,
  }) => {
    if (
      !Array.isArray(mediaAssetIds) ||
      mediaAssetIds.length === 0
    ) {
      return [];
    }
  
    const references = [
      ...new Set(
        mediaAssetIds
          .map((value) =>
            String(value || "").trim()
          )
          .filter(Boolean)
      ),
    ];
  
    if (references.length === 0) {
      return [];
    }
  
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
    const assetIds = references.filter(
      (value) => uuidPattern.test(value)
    );
  
    const fileNames = references.filter(
      (value) => !uuidPattern.test(value)
    );
  
    const mediaReferenceConditions = [];
  
    if (assetIds.length > 0) {
      mediaReferenceConditions.push({
        id: {
          [Op.in]: assetIds,
        },
      });
    }
  
    for (const fileName of fileNames) {
      mediaReferenceConditions.push({
        originalFileName: {
          [Op.iLike]: fileName,
        },
      });
    }
  
    if (
      mediaReferenceConditions.length ===
      0
    ) {
      return [];
    }
  
    return db.MediaAsset.findAll({
      where: {
        companyId,
  
        [Op.or]:
          mediaReferenceConditions,
      },
  
      attributes: [
        "id",
        "companyId",
        "assetType",
        "classification",
        "status",
        "title",
        "altText",
        "originalFileName",
        "mimeType",
        "publicUrl",
        "thumbnailPath",
        "previewPath",
        "width",
        "height",
        "isPublic",
        "isActive",
      ],
  
      transaction,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Existing Products
  |--------------------------------------------------------------------------
  */
  
  const loadExistingProducts =
    async ({
      companyId,
      parentSkus,
      transaction,
    }) => {
      if (!parentSkus.length) {
        return [];
      }
  
      return db.Product.findAll({
        where: {
          companyId,
  
          parentSku: {
            [Op.in]:
              parentSkus,
          },
        },
  
        attributes: [
          "id",
          "name",
          "slug",
          "parentSku",
          "productType",
          "status",
          "brandId",
          "primaryCategoryId",
          "updatedAt",
        ],
  
        include: [
          {
            model:
              db.ProductVariant,
  
            as:
              "variants",
  
            required:
              false,
  
            attributes: [
              "id",
              "productId",
              "sku",
              "barcode",
              "name",
              "variantKey",
              "isDefault",
              "status",
              "updatedAt",
            ],
          },
        ],
  
        transaction,
      });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Load Existing Variants
  |--------------------------------------------------------------------------
  */
  
  const loadExistingVariants =
    async ({
      companyId,
      variantSkus,
      barcodes,
      transaction,
    }) => {
      const clauses = [];
  
      if (
        variantSkus.length
      ) {
        clauses.push({
          sku: {
            [Op.in]:
              variantSkus,
          },
        });
      }
  
      if (
        barcodes.length
      ) {
        clauses.push({
          barcode: {
            [Op.in]:
              barcodes,
          },
        });
      }
  
      if (!clauses.length) {
        return [];
      }
  
      return db.ProductVariant.findAll({
        where: {
          companyId,
  
          [Op.or]:
            clauses,
        },
  
        attributes: [
          "id",
          "productId",
          "sku",
          "barcode",
          "name",
          "variantKey",
          "isDefault",
          "status",
          "updatedAt",
        ],
  
        include: [
          {
            model:
              db.Product,
  
            as:
              "product",
  
            required:
              false,
  
            attributes: [
              "id",
              "name",
              "parentSku",
            ],
          },
        ],
  
        transaction,
      });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Build Attribute Maps
  |--------------------------------------------------------------------------
  */
  
  const buildAttributeMaps = (
    attributes
  ) => {
    const attributeByCode =
      buildMap(
        attributes,
        (attribute) =>
          cleanUpper(
            attribute.code
          )
      );
  
    const optionByAttributeAndValue =
      new Map();
  
    const optionByAttributeAndLabel =
      new Map();
  
    for (
      const attribute of
      attributes
    ) {
      const attributeCode =
        cleanUpper(
          attribute.code
        );
  
      for (
        const option of
        attribute.options || []
      ) {
        const valueKey =
          `${attributeCode}:${cleanUpper(
            option.value
          )}`;
  
        const labelKey =
          `${attributeCode}:${cleanUpper(
            option.label
          )}`;
  
        optionByAttributeAndValue.set(
          valueKey,
          option
        );
  
        optionByAttributeAndLabel.set(
          labelKey,
          option
        );
      }
    }
  
    return {
      attributeByCode,
      optionByAttributeAndValue,
      optionByAttributeAndLabel,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve One Attribute Option
  |--------------------------------------------------------------------------
  */
  
  const resolveAttributeOption = ({
    attributeCode,
    rawValue,
    optionByAttributeAndValue,
    optionByAttributeAndLabel,
  }) => {
    const code =
      cleanUpper(
        attributeCode
      );
  
    const value =
      cleanUpper(
        rawValue
      );
  
    if (
      !code ||
      !value
    ) {
      return null;
    }
  
    return (
      optionByAttributeAndValue.get(
        `${code}:${value}`
      ) ||
      optionByAttributeAndLabel.get(
        `${code}:${value}`
      ) ||
      null
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Load Import Lookups
  |--------------------------------------------------------------------------
  */
  
  const loadImportLookups =
    async ({
      companyId,
      rows,
      headers,
      transaction,
    }) => {
      const brandCodes =
        collectBrandCodes(
          rows
        );
  
      const categorySlugs =
        collectCategorySlugs(
          rows
        );
  
      const collectionSlugs =
        collectCollectionSlugs(
          rows
        );
  
      const attributeCodes =
        collectAttributeCodes({
          headers,
        });
  
      const priceListCodes =
        collectPriceListCodes(
          headers
        );
  
      const parentSkus =
        collectParentSkus(
          rows
        );
  
      const variantSkus =
        collectVariantSkus(
          rows
        );
  
      const barcodes =
        collectBarcodes(
          rows
        );
  
      const mediaAssetIds =
        collectMediaAssetIds(
          rows
        );
  
      const [
        brands,
        categories,
        collections,
        attributes,
        priceLists,
        existingProducts,
        existingVariants,
        mediaAssets,
      ] = await Promise.all([
        loadBrands({
          companyId,
          brandCodes,
          transaction,
        }),
  
        loadCategories({
          companyId,
          categorySlugs,
          transaction,
        }),
  
        loadCollections({
          companyId,
          collectionSlugs,
          transaction,
        }),
  
        loadAttributes({
          companyId,
          attributeCodes,
          transaction,
        }),
  
        loadPriceLists({
          companyId,
          priceListCodes,
          transaction,
        }),
  
        loadExistingProducts({
          companyId,
          parentSkus,
          transaction,
        }),
  
        loadExistingVariants({
          companyId,
          variantSkus,
          barcodes,
          transaction,
        }),
  
        loadMediaAssets({
          companyId,
          mediaAssetIds,
          transaction,
        }),

       
      ]);

      
      const mediaAssetByOriginalFileName = new Map();
      const duplicateMediaOriginalFileNames = new Set();

      for (const asset of mediaAssets) {
        const originalFileName = clean(
          asset.originalFileName
        ).toLowerCase();

        if (!originalFileName) {
          continue;
        }

        if (
          mediaAssetByOriginalFileName.has(
            originalFileName
          )
        ) {
          duplicateMediaOriginalFileNames.add(
            originalFileName
          );
          continue;
        }

        mediaAssetByOriginalFileName.set(
          originalFileName,
          asset
        );
      }

      const {
        attributeByCode,
        optionByAttributeAndValue,
        optionByAttributeAndLabel,
      } = buildAttributeMaps(
        attributes
      );
  
      return {
        requested: {
          brandCodes,
          categorySlugs,
          collectionSlugs,
          attributeCodes,
          priceListCodes,
          parentSkus,
          variantSkus,
          barcodes,
          mediaAssetIds,
  
          attributeOptionReferences:
            collectAttributeOptionReferences({
              rows,
              headers,
            }),
        },
  
        rows: {
          brands,
          categories,
          collections,
          attributes,
          priceLists,
          existingProducts,
          existingVariants,
          mediaAssets,
        },
  
        maps: {
          brandByCode:
            buildMap(
              brands,
              (brand) =>
                cleanUpper(
                  brand.code
                )
            ),
  
          categoryBySlug:
            buildMap(
              categories,
              (category) =>
                slugify(
                  category.slug
                )
            ),
  
          collectionBySlug:
            buildMap(
              collections,
              (collection) =>
                slugify(
                  collection.slug
                )
            ),
  
          attributeByCode,
  
          optionByAttributeAndValue,
  
          optionByAttributeAndLabel,
  
          priceListByCode:
            buildMap(
              priceLists,
              (priceList) =>
                cleanUpper(
                  priceList.code
                )
            ),
  
          productByParentSku:
            buildMap(
              existingProducts,
              (product) =>
                cleanUpper(
                  product.parentSku
                )
            ),
  
          variantBySku:
            buildMap(
              existingVariants,
              (variant) =>
                cleanUpper(
                  variant.sku
                )
            ),
  
          variantByBarcode:
            new Map(
              existingVariants
                .filter(
                  (variant) =>
                    Boolean(
                      clean(
                        variant.barcode
                      )
                    )
                )
                .map((variant) => [
                  clean(
                    variant.barcode
                  ),
                  variant,
                ])
            ),
  
          mediaAssetById:
            buildMap(
              mediaAssets,
              (asset) =>
                clean(
                  asset.id
                )
            ),

          mediaAssetByOriginalFileName,

          duplicateMediaOriginalFileNames,
        },
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    loadImportLookups,
  
    resolveAttributeOption,
  
    collectBrandCodes,
    collectCategorySlugs,
    collectCollectionSlugs,
    collectAttributeCodes,
    collectAttributeOptionReferences,
    collectPriceListCodes,
    collectParentSkus,
    collectVariantSkus,
    collectBarcodes,
    collectMediaAssetIds,
  
    loadMediaAssets,
  
    buildAttributeMaps,

    resolveMediaAssetReference,

  };