const {
    PRODUCT_IMPORT_MODES,
    PRODUCT_TYPES,
    PRODUCT_STATUSES,
    CHANNEL_PUBLISH_STATUSES,
    WEIGHT_UNITS,
    DIMENSION_UNITS,
    COLUMN_PREFIX,

    MEDIA_IMPORT_MODES,
    IMPORTABLE_IMAGE_ROLES,
} = require("../productImport.constants");
  
  const {
    clean,
    cleanUpper,
    normalizeBoolean,
    normalizeNumber,
    normalizeArray,
    slugify,
    validateHeaders: validateRequiredHeaders,
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
  | Constants
  |--------------------------------------------------------------------------
  */
  
  const REQUIRED_PRODUCT_FIELDS = [
    "parentSku",
    "name",
    "productType",
    "status",
    "primaryCategorySlug",
  ];
  
  const PRODUCT_CONSISTENCY_FIELDS = [
    "name",
    "slug",
    "productType",
    "status",
    "brandCode",
    "primaryCategorySlug",
    "categorySlugs",
    "collectionSlugs",
    "shortDescription",
    "description",
    "features",
    "whatsInTheBox",
    "warrantyText",
    "taxCode",
    "taxPercent",
    "sortOrder",
    "isFeatured",
    "isSearchable",
    "erpId",
    "isDirectDelivery",
    "expressDeliveryEnabled",
    "variantOverrideDeliverySettings",
    "variantExpressDeliveryEnabled",
    "directDeliverySupplierCode",
    "directDeliveryLeadTimeDays",
    "expressDeliveryHours",
    "deliveryMinDays",
    "deliveryMaxDays",
    "variantExpressDeliveryHours",
    "variantDeliveryMinDays",
    "variantDeliveryMaxDays",
    "directDeliveryNote",
    "expressDeliveryEnabled",
    "expressDeliveryHours",
    "deliveryMinDays",
    "deliveryMaxDays",
    "deliveryNote",
    "websiteVisible",
    "websitePublishStatus",
    "kioskVisible",
    "kioskPublishStatus",
    "metaTitle",
    "metaDescription",
    "metaKeywords",
    "canonicalUrl",
    "mediaImportMode",
    "primaryMediaAssetId",
    "primaryImageTitle",
    "primaryImageAltText",
    "galleryMediaAssetIds",
  ];
  
  const BOOLEAN_FIELDS = [
    "isDefault",
    "isFeatured",
    "isSearchable",
    "isDirectDelivery",
    "websiteVisible",
    "kioskVisible",
  ];
  
  const NUMERIC_FIELDS = [
    "taxPercent",
    "sortOrder",
    "directDeliveryLeadTimeDays",
    "weight",
    "length",
    "width",
    "height",
    "variantSortOrder",
  ];
  
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
  
  const createResult = () => ({
    errors: [],
    warnings: [],
  });
  
  const addUnique = (
    target,
    message
  ) => {
    if (
      message &&
      !target.includes(message)
    ) {
      target.push(message);
    }
  };
  
  const mergeResult = (
    target,
    source
  ) => {
    for (
      const error of
      source.errors || []
    ) {
      addUnique(
        target.errors,
        error
      );
    }
  
    for (
      const warning of
      source.warnings || []
    ) {
      addUnique(
        target.warnings,
        warning
      );
    }
  
    return target;
  };
  
  const getRowNumber = (
    row,
    fallbackIndex
  ) =>
    Number(
      row?.rowNumber ||
      fallbackIndex + 2
    );
  
  const getNormalizedHeaders = (
    rows
  ) =>
    unique(
      rows.flatMap(
        (row) =>
          Object.keys(
            row || {}
          )
      )
    );
  
  const valuesEqual = (
    first,
    second
  ) =>
    clean(first) ===
    clean(second);
  
  const getDynamicAttributeCode = (
    header,
    prefix
  ) =>
    cleanUpper(
      header.substring(
        prefix.length
      )
    );
  
  const isNonNegativeNumber = (
    value
  ) =>
    Number.isFinite(value) &&
    value >= 0;
  
  /*
  |--------------------------------------------------------------------------
  | Import Mode Validation
  |--------------------------------------------------------------------------
  */
  
  const validateImportMode = (
    importMode
  ) => {
    const result =
      createResult();
  
    const normalized =
      cleanUpper(
        importMode ||
        "CREATE_OR_UPDATE"
      );
  
    if (
      !PRODUCT_IMPORT_MODES.includes(
        normalized
      )
    ) {
      result.errors.push(
        `Import mode must be one of: ${PRODUCT_IMPORT_MODES.join(", ")}.`
      );
    }
  
    return {
      ...result,
      value:
        normalized,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Header Validation
  |--------------------------------------------------------------------------
  */
  
  const validateDynamicHeader = ({
    header,
    prefix,
    label,
    seenCodes,
    result,
  }) => {
    const code =
      getDynamicAttributeCode(
        header,
        prefix
      );
  
    if (!code) {
      result.errors.push(
        `Dynamic column "${header}" must contain a ${label} code after "${prefix}".`
      );
  
      return;
    }
  
    const duplicateKey =
      `${prefix.toLowerCase()}${code}`;
  
    if (
      seenCodes.has(
        duplicateKey
      )
    ) {
      result.errors.push(
        `Dynamic column for ${label} "${code}" appears more than once.`
      );
  
      return;
    }
  
    seenCodes.add(
      duplicateKey
    );
  };
  
  const validateHeaders = (
    headers
  ) => {
    const result =
      createResult();
  
    if (
      !Array.isArray(headers) ||
      headers.length === 0
    ) {
      result.errors.push(
        "The CSV does not contain any headers."
      );
  
      return result;
    }
  
    const requiredErrors =
      validateRequiredHeaders(
        headers
      );
  
    for (
      const error of
      requiredErrors
    ) {
      addUnique(
        result.errors,
        error
      );
    }
  
    const duplicateHeaders =
      new Set();
  
    const seenHeaders =
      new Set();
  
    for (
      const header of
      headers
    ) {
      const key =
        clean(header)
          .toLowerCase();
  
      if (
        seenHeaders.has(key)
      ) {
        duplicateHeaders.add(
          header
        );
      }
  
      seenHeaders.add(key);
    }
  
    for (
      const header of
      duplicateHeaders
    ) {
      result.errors.push(
        `CSV column "${header}" appears more than once.`
      );
    }
  
    const seenDynamicCodes =
      new Set();
  
    for (
      const header of
      extractVariantColumns(
        headers
      )
    ) {
      validateDynamicHeader({
        header,
        prefix:
          COLUMN_PREFIX
            .VARIANT_ATTRIBUTE,
        label:
          "variant attribute",
        seenCodes:
          seenDynamicCodes,
        result,
      });
    }
  
    for (
      const header of
      extractSpecificationColumns(
        headers
      )
    ) {
      validateDynamicHeader({
        header,
        prefix:
          COLUMN_PREFIX
            .SPECIFICATION,
        label:
          "specification attribute",
        seenCodes:
          seenDynamicCodes,
        result,
      });
    }
  
    const pricingDefinitions = [
      {
        headers:
          extractRegularPriceColumns(
            headers
          ),
        prefix:
          COLUMN_PREFIX
            .REGULAR_PRICE,
        label:
          "regular price",
      },
      {
        headers:
          extractSellingPriceColumns(
            headers
          ),
        prefix:
          COLUMN_PREFIX
            .SELLING_PRICE,
        label:
          "selling price",
      },
      {
        headers:
          extractCompareAtPriceColumns(
            headers
          ),
        prefix:
          COLUMN_PREFIX
            .COMPARE_AT_PRICE,
        label:
          "compare-at price",
      },
      {
        headers:
          extractCostPriceColumns(
            headers
          ),
        prefix:
          COLUMN_PREFIX
            .COST_PRICE,
        label:
          "cost price",
      },
    ];
  
    for (
      const definition of
      pricingDefinitions
    ) {
      for (
        const header of
        definition.headers
      ) {
        validateDynamicHeader({
          header,
          prefix:
            definition.prefix,
          label:
            definition.label,
          seenCodes:
            seenDynamicCodes,
          result,
        });
      }
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Row Shape Validation
  |--------------------------------------------------------------------------
  */
  
  const validateRequiredRowFields = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    for (
      const field of
      REQUIRED_PRODUCT_FIELDS
    ) {
      if (
        !hasValue(
          row[field]
        )
      ) {
        result.errors.push(
          `Row ${rowNumber}: ${field} is required.`
        );
      }
    }
  
    const productType =
      cleanUpper(
        row.productType
      );
  
    const variantSkuRequired =
      productType ===
        "VARIABLE" ||
      hasValue(
        row.variantSku
      );
  
    if (
      variantSkuRequired &&
      !hasValue(
        row.variantSku
      )
    ) {
      result.errors.push(
        `Row ${rowNumber}: variantSku is required.`
      );
    }
  
    return result;
  };
  
  const validateBooleanFields = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    for (
      const field of
      BOOLEAN_FIELDS
    ) {
      if (
        !hasValue(
          row[field]
        )
      ) {
        continue;
      }
  
      if (
        normalizeBoolean(
          row[field]
        ) === null
      ) {
        result.errors.push(
          `Row ${rowNumber}: ${field} must be TRUE or FALSE.`
        );
      }
    }
  
    return result;
  };
  
  const validateNumericFields = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    for (
      const field of
      NUMERIC_FIELDS
    ) {
      if (
        !hasValue(
          row[field]
        )
      ) {
        continue;
      }
  
      const value =
        normalizeNumber(
          row[field]
        );
  
      if (
        value === null
      ) {
        result.errors.push(
          `Row ${rowNumber}: ${field} must be numeric.`
        );
  
        continue;
      }
  
      if (
        value < 0
      ) {
        result.errors.push(
          `Row ${rowNumber}: ${field} cannot be negative.`
        );
      }
    }
  
    return result;
  };
  
  const validateRowEnums = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    const productType =
      cleanUpper(
        row.productType
      );
  
    if (
      productType &&
      !PRODUCT_TYPES.includes(
        productType
      )
    ) {
      result.errors.push(
        `Row ${rowNumber}: productType must be one of: ${PRODUCT_TYPES.join(", ")}.`
      );
    }
  
    const productStatus =
      cleanUpper(
        row.status
      );
  
    if (
      productStatus &&
      !PRODUCT_STATUSES.includes(
        productStatus
      )
    ) {
      result.errors.push(
        `Row ${rowNumber}: status must be one of: ${PRODUCT_STATUSES.join(", ")}.`
      );
    }
  
    const variantStatus =
      cleanUpper(
        row.variantStatus
      );
  
    if (
      variantStatus &&
      !PRODUCT_STATUSES.includes(
        variantStatus
      )
    ) {
      result.errors.push(
        `Row ${rowNumber}: variantStatus must be one of: ${PRODUCT_STATUSES.join(", ")}.`
      );
    }
  
    const weightUnit =
      cleanUpper(
        row.weightUnit
      );
  
    if (
      weightUnit &&
      !WEIGHT_UNITS.includes(
        weightUnit
      )
    ) {
      result.errors.push(
        `Row ${rowNumber}: weightUnit must be one of: ${WEIGHT_UNITS.join(", ")}.`
      );
    }
  
    const dimensionUnit =
      cleanUpper(
        row.dimensionUnit
      );
  
    if (
      dimensionUnit &&
      !DIMENSION_UNITS.includes(
        dimensionUnit
      )
    ) {
      result.errors.push(
        `Row ${rowNumber}: dimensionUnit must be one of: ${DIMENSION_UNITS.join(", ")}.`
      );
    }
  
    for (
      const field of [
        "websitePublishStatus",
        "kioskPublishStatus",
      ]
    ) {
      const value =
        cleanUpper(
          row[field]
        );
  
      if (
        value &&
        !CHANNEL_PUBLISH_STATUSES.includes(
          value
        )
      ) {
        result.errors.push(
          `Row ${rowNumber}: ${field} must be one of: ${CHANNEL_PUBLISH_STATUSES.join(", ")}.`
        );
      }
    }
  
    return result;
  };
  
  const validatePhysicalMeasurements = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    const weight =
      normalizeNumber(
        row.weight
      );
  
    const weightUnit =
      cleanUpper(
        row.weightUnit
      );
  
    if (
      weight !== null &&
      !weightUnit
    ) {
      result.errors.push(
        `Row ${rowNumber}: weightUnit is required when weight is provided.`
      );
    }
  
    if (
      weightUnit &&
      weight === null
    ) {
      result.warnings.push(
        `Row ${rowNumber}: weightUnit is provided without a weight value.`
      );
    }
  
    const dimensions = [
      normalizeNumber(
        row.length
      ),
      normalizeNumber(
        row.width
      ),
      normalizeNumber(
        row.height
      ),
    ];
  
    const hasDimension =
      dimensions.some(
        (value) =>
          value !== null
      );
  
    const dimensionUnit =
      cleanUpper(
        row.dimensionUnit
      );
  
    if (
      hasDimension &&
      !dimensionUnit
    ) {
      result.errors.push(
        `Row ${rowNumber}: dimensionUnit is required when any dimension is provided.`
      );
    }
  
    if (
      dimensionUnit &&
      !hasDimension
    ) {
      result.warnings.push(
        `Row ${rowNumber}: dimensionUnit is provided without length, width or height.`
      );
    }
  
    return result;
  };
  
  const validateTax = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    if (
      !hasValue(
        row.taxPercent
      )
    ) {
      return result;
    }
  
    const taxPercent =
      normalizeNumber(
        row.taxPercent
      );
  
    if (
      taxPercent === null
    ) {
      result.errors.push(
        `Row ${rowNumber}: taxPercent must be numeric.`
      );
  
      return result;
    }
  
    if (
      taxPercent < 0 ||
      taxPercent > 100
    ) {
      result.errors.push(
        `Row ${rowNumber}: taxPercent must be between 0 and 100.`
      );
    }
  
    return result;
  };
  
  const validateCanonicalUrl = ({
    row,
    rowNumber,
  }) => {
    const result =
      createResult();
  
    if (
      !hasValue(
        row.canonicalUrl
      )
    ) {
      return result;
    }
  
    try {
      new URL(
        clean(
          row.canonicalUrl
        )
      );
    } catch {
      result.errors.push(
        `Row ${rowNumber}: canonicalUrl must contain a valid absolute URL.`
      );
    }
  
    return result;
  };
  /*
  |--------------------------------------------------------------------------
  | ERP / Direct Delivery Validation
  |--------------------------------------------------------------------------
  */

  const validateDirectDelivery = ({
    firstRow,
    lookups,
  }) => {
    const result =
      createResult();

    const isDirectDelivery =
      hasValue(
        firstRow.isDirectDelivery
      )
        ? normalizeBoolean(
            firstRow.isDirectDelivery
          )
        : false;

    const supplierCode =
      cleanUpper(
        firstRow.directDeliverySupplierCode
      );

    const leadTime =
      hasValue(
        firstRow.directDeliveryLeadTimeDays
      )
        ? normalizeNumber(
            firstRow.directDeliveryLeadTimeDays
          )
        : null;

    if (
      isDirectDelivery ===
      true
    ) {
      if (!supplierCode) {
        result.errors.push(
          "Direct-delivery products require directDeliverySupplierCode."
        );
      } else {
        const supplier =
          lookups?.maps
            ?.supplierByCode
            ?.get(
              supplierCode
            );

        if (!supplier) {
          result.errors.push(
            `Direct-delivery supplier "${supplierCode}" was not found.`
          );
        } else if (
          supplier.isActive ===
          false
        ) {
          result.errors.push(
            `Direct-delivery supplier "${supplierCode}" is inactive.`
          );
        }
      }

      if (
        leadTime !== null &&
        (
          !Number.isInteger(
            leadTime
          ) ||
          leadTime < 0
        )
      ) {
        result.errors.push(
          "directDeliveryLeadTimeDays must be a non-negative whole number."
        );
      }
    } else if (
      supplierCode ||
      hasValue(
        firstRow.directDeliveryLeadTimeDays
      ) ||
      hasValue(
        firstRow.directDeliveryNote
      )
    ) {
      result.warnings.push(
        "Direct-delivery supplier, lead time and note will be ignored because isDirectDelivery is FALSE."
      );
    }

    if (
      clean(
        firstRow.erpId
      ).length >
      180
    ) {
      result.errors.push(
        "erpId cannot exceed 180 characters."
      );
    }

    if (
      clean(
        firstRow.directDeliveryNote
      ).length >
      500
    ) {
      result.errors.push(
        "directDeliveryNote cannot exceed 500 characters."
      );
    }

    return result;
  };




  const validateMediaFields = ({
    row,
    rowNumber,
  }) => {
    const result = createResult();

    const productMediaMode = cleanUpper(
      row.mediaImportMode || "MERGE"
    );

    if (!MEDIA_IMPORT_MODES.includes(productMediaMode)) {
      result.errors.push(
        `Row ${rowNumber}: mediaImportMode must be one of: ${MEDIA_IMPORT_MODES.join(", ")}.`
      );
    }

    const variantMediaMode = cleanUpper(
      row.variantMediaImportMode ||
      productMediaMode ||
      "MERGE"
    );

    if (!MEDIA_IMPORT_MODES.includes(variantMediaMode)) {
      result.errors.push(
        `Row ${rowNumber}: variantMediaImportMode must be one of: ${MEDIA_IMPORT_MODES.join(", ")}.`
      );
    }

    const imageRole = cleanUpper(
      row.variantImageRole || "PRIMARY"
    );

    if (
      imageRole &&
      !IMPORTABLE_IMAGE_ROLES.includes(imageRole)
    ) {
      result.errors.push(
        `Row ${rowNumber}: variantImageRole must be one of: ${IMPORTABLE_IMAGE_ROLES.join(", ")}.`
      );
    }

    return result;
  };

  const validateRows = (
    rows
  ) => {
    const result =
      createResult();
  
    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      result.errors.push(
        "At least one product import row is required."
      );
  
      return result;
    }
  
    rows.forEach(
      (
        row,
        index
      ) => {
        const rowNumber =
          getRowNumber(
            row,
            index
          );
  
        if (
          !hasValue(
            row.parentSku
          )
        ) {
          result.errors.push(
            `Row ${rowNumber}: parentSku is required.`
          );
        }
  
        mergeResult(
          result,
          validateBooleanFields({
            row,
            rowNumber,
          })
        );
  
        mergeResult(
          result,
          validateNumericFields({
            row,
            rowNumber,
          })
        );
  
        mergeResult(
          result,
          validateRowEnums({
            row,
            rowNumber,
          })
        );
  
        mergeResult(
          result,
          validatePhysicalMeasurements({
            row,
            rowNumber,
          })
        );
  
        mergeResult(
          result,
          validateTax({
            row,
            rowNumber,
          })
        );
  
        mergeResult(
          result,
          validateCanonicalUrl({
            row,
            rowNumber,
          })
        );

        mergeResult(
            result,
            validateMediaFields({
                row,
                rowNumber,
            })
        );
      }
    );
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | File-Level Duplicate Validation
  |--------------------------------------------------------------------------
  */
  
  const validateFileDuplicates = (
    rows
  ) => {
    const result =
      createResult();
  
    const skuOwners =
      new Map();
  
    const barcodeOwners =
      new Map();
  
    rows.forEach(
      (
        row,
        index
      ) => {
        const rowNumber =
          getRowNumber(
            row,
            index
          );
  
        const parentSku =
          cleanUpper(
            row.parentSku
          );
  
        const variantSku =
          cleanUpper(
            row.variantSku
          );
  
        const barcode =
          clean(
            row.barcode
          );
  
        if (variantSku) {
          if (
            skuOwners.has(
              variantSku
            )
          ) {
            const existing =
              skuOwners.get(
                variantSku
              );
  
            result.errors.push(
              `Rows ${existing.rowNumber} and ${rowNumber}: Variant SKU "${variantSku}" is duplicated in the import file.`
            );
          } else {
            skuOwners.set(
              variantSku,
              {
                rowNumber,
                parentSku,
              }
            );
          }
        }
  
        if (barcode) {
          if (
            barcodeOwners.has(
              barcode
            )
          ) {
            const existing =
              barcodeOwners.get(
                barcode
              );
  
            result.errors.push(
              `Rows ${existing.rowNumber} and ${rowNumber}: Barcode "${barcode}" is duplicated in the import file.`
            );
          } else {
            barcodeOwners.set(
              barcode,
              {
                rowNumber,
                variantSku,
              }
            );
          }
        }
      }
    );
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Group Consistency
  |--------------------------------------------------------------------------
  */
  
  const validateGroupConsistency = (
    productRows
  ) => {
    const result =
      createResult();
  
    if (
      !Array.isArray(
        productRows
      ) ||
      productRows.length === 0
    ) {
      result.errors.push(
        "Product group does not contain any rows."
      );
  
      return result;
    }
  
    const firstRow =
      productRows[0];
  
    for (
      const field of
      PRODUCT_CONSISTENCY_FIELDS
    ) {
      const firstValue =
        clean(
          firstRow[field]
        );
  
      const inconsistentRows =
        productRows.filter(
          (row) =>
            !valuesEqual(
              row[field],
              firstValue
            )
        );
  
      if (
        inconsistentRows.length
      ) {
        result.errors.push(
          `Product "${clean(firstRow.parentSku) || "Unknown"}": Column "${field}" must have the same value on every variant row.`
        );
      }
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Reference Validation
  |--------------------------------------------------------------------------
  */
  
  const validateBrandReference = ({
    firstRow,
    lookups,
  }) => {
    const result =
      createResult();
  
    const brandCode =
      cleanUpper(
        firstRow.brandCode
      );
  
    if (!brandCode) {
      return result;
    }
  
    const brand =
      lookups.maps
        .brandByCode
        .get(
          brandCode
        );
  
    if (!brand) {
      result.errors.push(
        `Brand "${brandCode}" was not found.`
      );
  
      return result;
    }
  
    if (
      brand.isActive ===
      false
    ) {
      result.warnings.push(
        `Brand "${brandCode}" is inactive.`
      );
    }
  
    return result;
  };
  
  const validateCategoryReferences = ({
    firstRow,
    lookups,
  }) => {
    const result =
      createResult();
  
    const primarySlug =
      slugify(
        firstRow
          .primaryCategorySlug
      );
  
    if (!primarySlug) {
      result.errors.push(
        "Primary category slug is required."
      );
    } else {
      const primaryCategory =
        lookups.maps
          .categoryBySlug
          .get(
            primarySlug
          );
  
      if (!primaryCategory) {
        result.errors.push(
          `Primary category "${primarySlug}" was not found.`
        );
      } else if (
        primaryCategory
          .isActive ===
        false
      ) {
        result.warnings.push(
          `Primary category "${primarySlug}" is inactive.`
        );
      }
    }
  
    const categorySlugs =
      unique(
        normalizeArray(
          firstRow
            .categorySlugs
        )
          .map(
            slugify
          )
          .filter(Boolean)
      );
  
    for (
      const categorySlug of
      categorySlugs
    ) {
      const category =
        lookups.maps
          .categoryBySlug
          .get(
            categorySlug
          );
  
      if (!category) {
        result.errors.push(
          `Category "${categorySlug}" was not found.`
        );
  
        continue;
      }
  
      if (
        category.isActive ===
        false
      ) {
        result.warnings.push(
          `Category "${categorySlug}" is inactive.`
        );
      }
    }
  
    return result;
  };
  
  const validateCollectionReferences = ({
    firstRow,
    lookups,
  }) => {
    const result =
      createResult();
  
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
  
    for (
      const collectionSlug of
      collectionSlugs
    ) {
      const collection =
        lookups.maps
          .collectionBySlug
          .get(
            collectionSlug
          );
  
      if (!collection) {
        result.errors.push(
          `Collection "${collectionSlug}" was not found.`
        );
  
        continue;
      }
  
      if (
        collection.isActive ===
        false
      ) {
        result.warnings.push(
          `Collection "${collectionSlug}" is inactive.`
        );
      }
    }
  
    return result;
  };

  const validateMediaAsset = ({
    assetReference,
    label,
    rowNumber,
    lookups,
  }) => {
    const result = createResult();
    const normalizedReference = clean(
      assetReference
    );

    if (!normalizedReference) {
      return result;
    }

    const fileNameKey =
      normalizedReference.toLowerCase();

    if (
      lookups?.maps
        ?.duplicateMediaOriginalFileNames
        ?.has(fileNameKey)
    ) {
      result.errors.push(
        `Row ${rowNumber}: ${label} "${normalizedReference}" matches more than one Media Library asset. Use the MediaAsset UUID instead.`
      );
      return result;
    }

    const asset =
      resolveMediaAssetReference(
        normalizedReference,
        lookups?.maps
      );

    if (!asset) {
      result.errors.push(
        `Row ${rowNumber}: ${label} "${normalizedReference}" was not found in the Media Library.`
      );
      return result;
    }

    if (
      cleanUpper(asset.assetType) !==
      "IMAGE"
    ) {
      result.errors.push(
        `Row ${rowNumber}: ${label} "${normalizedReference}" must reference an IMAGE asset.`
      );
    }

    if (
      cleanUpper(asset.status) !==
      "READY"
    ) {
      result.errors.push(
        `Row ${rowNumber}: ${label} "${normalizedReference}" must have READY status.`
      );
    }

    if (asset.isActive === false) {
      result.errors.push(
        `Row ${rowNumber}: ${label} "${normalizedReference}" is inactive.`
      );
    }

    return result;
  };

  const getVariantMediaGroupCode = (
  row
) =>
  cleanUpper(
    row?.variantMediaGroup
  );

const getVariantMediaReferences = (
  row
) => [
  {
    value:
      row.variantPrimaryMediaAssetId,

    label:
      "variantPrimaryMediaAssetId",
  },

  {
    value:
      row.variantSwatchMediaAssetId,

    label:
      "variantSwatchMediaAssetId",
  },

  {
    value:
      row.variantMediaAssetId,

    label:
      "variantMediaAssetId",
  },

  ...normalizeArray(
    row.variantGalleryMediaAssetIds
  )
    .map(clean)
    .filter(Boolean)
    .map(
      (value) => ({
        value,

        label:
          "variantGalleryMediaAssetIds",
      })
    ),
];

const getVariantMediaSignature = (
  row
) =>
  JSON.stringify({
    mode:
      cleanUpper(
        row.variantMediaImportMode ||
        "MERGE"
      ),

    primary:
      clean(
        row.variantPrimaryMediaAssetId
      ).toLowerCase(),

    gallery:
      normalizeArray(
        row.variantGalleryMediaAssetIds
      )
        .map(
          (value) =>
            clean(value)
              .toLowerCase()
        )
        .filter(Boolean),

    swatch:
      clean(
        row.variantSwatchMediaAssetId
      ).toLowerCase(),

    legacyAsset:
      clean(
        row.variantMediaAssetId
      ).toLowerCase(),

    legacyRole:
      cleanUpper(
        row.variantImageRole ||
        "PRIMARY"
      ),
  });

const validateMediaReferences = ({
    productRows,
    lookups,
  }) => {
    const result = createResult();

    if (
      !Array.isArray(productRows) ||
      productRows.length === 0
    ) {
      return result;
    }

    const firstRow = productRows[0];
    const firstRowNumber =
      getRowNumber(firstRow, 0);
    const productAssetIds = new Set();

    const mediaGroupDefinitions =
      new Map();

    for (
      let index = 0;
      index < productRows.length;
      index += 1
    ) {
      const row =
        productRows[index];

      const groupCode =
        getVariantMediaGroupCode(
          row
        );

      if (!groupCode) {
        continue;
      }

      const references =
        getVariantMediaReferences(
          row
        );

      const hasDefinition =
        references.some(
          (reference) =>
            Boolean(
              clean(
                reference.value
              )
            )
        );

      if (!hasDefinition) {
        continue;
      }

      const signature =
        getVariantMediaSignature(
          row
        );

      if (
        mediaGroupDefinitions.has(
          groupCode
        ) &&
        mediaGroupDefinitions.get(
          groupCode
        ).signature !==
          signature
      ) {
        const firstDefinition =
          mediaGroupDefinitions.get(
            groupCode
          );

        result.errors.push(
          `Rows ${firstDefinition.rowNumber} and ${getRowNumber(row, index)}: Variant media group "${groupCode}" contains conflicting media definitions. Define the group media once, or use exactly the same values.`
        );
      } else if (
        !mediaGroupDefinitions.has(
          groupCode
        )
      ) {
        mediaGroupDefinitions.set(
          groupCode,
          {
            rowNumber:
              getRowNumber(
                row,
                index
              ),

            signature,
          }
        );
      }
    }

    productRows.forEach(
      (
        row,
        index
      ) => {
        const groupCode =
          getVariantMediaGroupCode(
            row
          );

        if (
          groupCode &&
          !mediaGroupDefinitions.has(
            groupCode
          )
        ) {
          result.errors.push(
            `Row ${getRowNumber(row, index)}: Variant media group "${groupCode}" does not contain a media definition. Add primary, gallery, swatch or legacy variant media on at least one row using this group.`
          );
        }
      }
    );


    const validateAndTrackProductAsset = ({
      reference,
      label,
    }) => {
      const normalizedReference = clean(
        reference
      );

      if (!normalizedReference) {
        return;
      }

      mergeResult(
        result,
        validateMediaAsset({
          assetReference:
            normalizedReference,
          label,
          rowNumber:
            firstRowNumber,
          lookups,
        })
      );

      const asset =
        resolveMediaAssetReference(
          normalizedReference,
          lookups?.maps
        );
      const identity = asset?.id ||
        normalizedReference.toLowerCase();

      if (productAssetIds.has(identity)) {
        result.errors.push(
          `Row ${firstRowNumber}: Media asset "${normalizedReference}" is assigned more than once at product level.`
        );
        return;
      }

      productAssetIds.add(identity);
    };

    validateAndTrackProductAsset({
      reference:
        firstRow.primaryMediaAssetId,
      label:
        "primaryMediaAssetId",
    });

    for (const reference of unique(
      normalizeArray(
        firstRow.galleryMediaAssetIds
      )
        .map(clean)
        .filter(Boolean)
    )) {
      validateAndTrackProductAsset({
        reference,
        label:
          "galleryMediaAssetIds",
      });
    }

    productRows.forEach((row, index) => {
      const rowNumber = getRowNumber(row, index);

      const references =
        getVariantMediaReferences(
          row
        );

      const identities = new Set();

      for (const reference of references) {
        const normalizedReference = clean(reference.value);

        if (!normalizedReference) {
          continue;
        }

        mergeResult(
          result,
          validateMediaAsset({
            assetReference: normalizedReference,
            label: reference.label,
            rowNumber,
            lookups,
          })
        );

        const asset = resolveMediaAssetReference(
          normalizedReference,
          lookups?.maps
        );

        const identity =
          asset?.id ||
          normalizedReference.toLowerCase();

        if (identities.has(identity)) {
          result.errors.push(
            `Row ${rowNumber}: Media asset "${normalizedReference}" is assigned more than once to the same variant.`
          );
        } else {
          identities.add(identity);
        }
      }

      const hasVariantMedia = references.some(
        (reference) => Boolean(clean(reference.value))
      );

      if (
        !hasVariantMedia &&
        (
          hasValue(row.variantImageRole) ||
          hasValue(row.variantImageTitle) ||
          hasValue(row.variantImageAltText)
        )
      ) {
        result.warnings.push(
          `Row ${rowNumber}: Variant image metadata is provided without variant media.`
        );
      }
    });

    return result;
  };


  /*
  |--------------------------------------------------------------------------
  | Specification Validation
  |--------------------------------------------------------------------------
  */
  
  const validateSpecificationValue = ({
    attribute,
    rawValue,
    attributeCode,
    lookups,
  }) => {
    const result =
      createResult();
  
    const value =
      clean(rawValue);
  
    if (!value) {
      if (
        attribute.isRequired ===
        true
      ) {
        result.errors.push(
          `Specification "${attributeCode}" is required.`
        );
      }
  
      return result;
    }
  
    if (
      attribute.isActive ===
      false
    ) {
      result.errors.push(
        `Specification attribute "${attributeCode}" is inactive.`
      );
    }
  
    if (
      attribute
        .isVariantDefining ===
      true
    ) {
      result.errors.push(
        `Attribute "${attributeCode}" is variant-defining and must use a variant:${attributeCode} column.`
      );
  
      return result;
    }
  
    if (
      [
        "SINGLE_SELECT",
        "COLOR_SWATCH",
      ].includes(
        attribute.inputType
      )
    ) {
      const option =
        lookups.maps
          .optionByAttributeAndValue
          .get(
            `${attributeCode}:${cleanUpper(value)}`
          ) ||
        lookups.maps
          .optionByAttributeAndLabel
          .get(
            `${attributeCode}:${cleanUpper(value)}`
          );
  
      if (!option) {
        result.errors.push(
          `Specification "${attributeCode}" does not contain option "${value}".`
        );
      } else if (
        option.isActive ===
        false
      ) {
        result.errors.push(
          `Specification option "${value}" for "${attributeCode}" is inactive.`
        );
      }
  
      return result;
    }
  
    switch (
      attribute.dataType
    ) {
      case "NUMBER": {
        if (
          normalizeNumber(
            value
          ) === null
        ) {
          result.errors.push(
            `Specification "${attributeCode}" must be numeric.`
          );
        }
  
        break;
      }
  
      case "BOOLEAN": {
        if (
          normalizeBoolean(
            value
          ) === null
        ) {
          result.errors.push(
            `Specification "${attributeCode}" must be TRUE or FALSE.`
          );
        }
  
        break;
      }
  
      case "DATE": {
        const date =
          new Date(value);
  
        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          result.errors.push(
            `Specification "${attributeCode}" must contain a valid date.`
          );
        }
  
        break;
      }
  
      case "JSON": {
        try {
          JSON.parse(value);
        } catch {
          result.errors.push(
            `Specification "${attributeCode}" must contain valid JSON.`
          );
        }
  
        break;
      }
  
      default:
        break;
    }
  
    return result;
  };
  
  const validateSpecifications = ({
    firstRow,
    headers,
    lookups,
  }) => {
    const result =
      createResult();
  
    const specificationHeaders =
      extractSpecificationColumns(
        headers
      );
  
    for (
      const header of
      specificationHeaders
    ) {
      const attributeCode =
        getDynamicAttributeCode(
          header,
          COLUMN_PREFIX
            .SPECIFICATION
        );
  
      const attribute =
        lookups.maps
          .attributeByCode
          .get(
            attributeCode
          );
  
      if (!attribute) {
        result.errors.push(
          `Specification attribute "${attributeCode}" was not found.`
        );
  
        continue;
      }
  
      mergeResult(
        result,
        validateSpecificationValue({
          attribute,
          rawValue:
            firstRow[header],
          attributeCode,
          lookups,
        })
      );
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Attribute Validation
  |--------------------------------------------------------------------------
  */
  
  const validateVariantAttributes = ({
    row,
    rowNumber,
    headers,
    lookups,
    productType,
  }) => {
    const result =
      createResult();
  
    const variantHeaders =
      extractVariantColumns(
        headers
      );
  
    let suppliedCount =
      0;
  
    for (
      const header of
      variantHeaders
    ) {
      const attributeCode =
        getDynamicAttributeCode(
          header,
          COLUMN_PREFIX
            .VARIANT_ATTRIBUTE
        );
  
      const rawValue =
        clean(
          row[header]
        );
  
      const attribute =
        lookups.maps
          .attributeByCode
          .get(
            attributeCode
          );
  
      if (!attribute) {
        result.errors.push(
          `Row ${rowNumber}: Variant attribute "${attributeCode}" was not found.`
        );
  
        continue;
      }
  
      if (
        attribute.isActive ===
        false
      ) {
        result.errors.push(
          `Row ${rowNumber}: Variant attribute "${attributeCode}" is inactive.`
        );
      }
  
      if (
        attribute
          .isVariantDefining !==
        true
      ) {
        result.errors.push(
          `Row ${rowNumber}: Attribute "${attributeCode}" is not configured as variant-defining.`
        );
  
        continue;
      }
  
      if (!rawValue) {
        if (
            productType === "VARIABLE"
        ) {
            result.errors.push(
                `Row ${rowNumber}: Variant attribute "${attributeCode}" requires a value.`
            );
        }
    
        continue;
    }
      suppliedCount +=
        1;
  
      const option =
        lookups.maps
          .optionByAttributeAndValue
          .get(
            `${attributeCode}:${cleanUpper(rawValue)}`
          ) ||
        lookups.maps
          .optionByAttributeAndLabel
          .get(
            `${attributeCode}:${cleanUpper(rawValue)}`
          );
  
      if (!option) {
        result.errors.push(
          `Row ${rowNumber}: Variant attribute "${attributeCode}" does not contain option "${rawValue}".`
        );
  
        continue;
      }
  
      if (
        option.isActive ===
        false
      ) {
        result.errors.push(
          `Row ${rowNumber}: Variant option "${rawValue}" for "${attributeCode}" is inactive.`
        );
      }
    }
  
    if (
      productType ===
        "VARIABLE" &&
      variantHeaders.length ===
        0
    ) {
      result.errors.push(
        `Row ${rowNumber}: VARIABLE products require at least one variant:* column.`
      );
    }
  
    if (
      productType ===
        "VARIABLE" &&
      suppliedCount ===
        0
    ) {
      result.errors.push(
        `Row ${rowNumber}: VARIABLE product variant requires at least one attribute option.`
      );
    }
  
    return result;
  };
  
  const buildVariantCombinationKey = ({
    row,
    headers,
  }) => {
    const values =
      extractVariantColumns(
        headers
      )
        .map(
          (header) => {
            const attributeCode =
              getDynamicAttributeCode(
                header,
                COLUMN_PREFIX
                  .VARIANT_ATTRIBUTE
              );
  
            const optionValue =
              cleanUpper(
                row[header]
              );
  
            return optionValue
              ? `${attributeCode}:${optionValue}`
              : "";
          }
        )
        .filter(Boolean)
        .sort();
  
    return values.length
      ? values.join("|")
      : "DEFAULT";
  };
  
  /*
  |--------------------------------------------------------------------------
  | Pricing Validation
  |--------------------------------------------------------------------------
  */
  
  const getPricingColumnMap = (
    headers
  ) => {
    const result =
      new Map();
  
    const definitions = [
      {
        prefix:
          COLUMN_PREFIX
            .REGULAR_PRICE,
        field:
          "regularPrice",
        headers:
          extractRegularPriceColumns(
            headers
          ),
      },
      {
        prefix:
          COLUMN_PREFIX
            .SELLING_PRICE,
        field:
          "sellingPrice",
        headers:
          extractSellingPriceColumns(
            headers
          ),
      },
      {
        prefix:
          COLUMN_PREFIX
            .COMPARE_AT_PRICE,
        field:
          "compareAtPrice",
        headers:
          extractCompareAtPriceColumns(
            headers
          ),
      },
      {
        prefix:
          COLUMN_PREFIX
            .COST_PRICE,
        field:
          "costPrice",
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
          !result.has(
            priceListCode
          )
        ) {
          result.set(
            priceListCode,
            {}
          );
        }
  
        result.get(
          priceListCode
        )[
          definition.field
        ] = header;
      }
    }
  
    return result;
  };
  
  const validatePrices = ({
    row,
    rowNumber,
    headers,
    lookups,
  }) => {
    const result =
      createResult();
  
    const pricingColumns =
      getPricingColumnMap(
        headers
      );
  
    for (
      const [
        priceListCode,
        columns,
      ] of pricingColumns
    ) {
      const priceList =
        lookups.maps
          .priceListByCode
          .get(
            priceListCode
          );
  
      if (!priceList) {
        result.errors.push(
          `Row ${rowNumber}: Price list "${priceListCode}" was not found.`
        );
  
        continue;
      }
  
      if (
        priceList.isActive ===
        false
      ) {
        result.warnings.push(
          `Row ${rowNumber}: Price list "${priceListCode}" is inactive.`
        );
      }
  
      const rawValues = {
        regularPrice:
          columns.regularPrice
            ? row[
                columns.regularPrice
              ]
            : undefined,
  
        sellingPrice:
          columns.sellingPrice
            ? row[
                columns.sellingPrice
              ]
            : undefined,
  
        compareAtPrice:
          columns.compareAtPrice
            ? row[
                columns.compareAtPrice
              ]
            : undefined,
  
        costPrice:
          columns.costPrice
            ? row[
                columns.costPrice
              ]
            : undefined,
      };
  
      const hasAnyPrice =
        Object.values(
          rawValues
        ).some(
          hasValue
        );
  
      if (!hasAnyPrice) {
        continue;
      }
  
      if (
        !hasValue(
          rawValues.regularPrice
        )
      ) {
        result.errors.push(
          `Row ${rowNumber}: regularPrice:${priceListCode} is required when importing pricing.`
        );
      }
  
      if (
        !hasValue(
          rawValues.sellingPrice
        )
      ) {
        result.errors.push(
          `Row ${rowNumber}: sellingPrice:${priceListCode} is required when importing pricing.`
        );
      }
  
      const normalized = {};
  
      for (
        const [
          field,
          rawValue,
        ] of Object.entries(
          rawValues
        )
      ) {
        if (
          !hasValue(
            rawValue
          )
        ) {
          normalized[field] =
            null;
  
          continue;
        }
  
        const value =
          normalizeNumber(
            rawValue
          );
  
        normalized[field] =
          value;
  
        if (
          value === null
        ) {
          result.errors.push(
            `Row ${rowNumber}: ${field}:${priceListCode} must be numeric.`
          );
  
          continue;
        }
  
        if (
          !isNonNegativeNumber(
            value
          )
        ) {
          result.errors.push(
            `Row ${rowNumber}: ${field}:${priceListCode} cannot be negative.`
          );
        }
      }
  
      if (
        normalized.regularPrice !==
          null &&
        normalized.sellingPrice !==
          null &&
        normalized.regularPrice <
          normalized.sellingPrice
      ) {
        result.warnings.push(
          `Row ${rowNumber}: regularPrice:${priceListCode} is lower than sellingPrice:${priceListCode}.`
        );
      }
  
      if (
        normalized.compareAtPrice !==
          null &&
        normalized.sellingPrice !==
          null &&
        normalized.compareAtPrice <
          normalized.sellingPrice
      ) {
        result.warnings.push(
          `Row ${rowNumber}: compareAtPrice:${priceListCode} is lower than the selling price.`
        );
      }
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Existing Record Validation
  |--------------------------------------------------------------------------
  */
  
  const validateExistingVariantOwnership = ({
    row,
    rowNumber,
    parentSku,
    existingProduct,
    lookups,
  }) => {
    const result =
      createResult();
  
    const variantSku =
      cleanUpper(
        row.variantSku
      );
  
    const barcode =
      clean(
        row.barcode
      );
  
    if (variantSku) {
      const existingVariant =
        lookups.maps
          .variantBySku
          .get(
            variantSku
          );
  
      if (
        existingVariant &&
        (
          !existingProduct ||
          existingVariant
            .productId !==
            existingProduct.id
        )
      ) {
        result.errors.push(
          `Row ${rowNumber}: Variant SKU "${variantSku}" already belongs to product "${existingVariant.product?.parentSku || existingVariant.productId}".`
        );
      }
    }
  
    if (barcode) {
      const existingVariant =
        lookups.maps
          .variantByBarcode
          .get(
            barcode
          );
  
      if (
        existingVariant &&
        (
          !existingProduct ||
          existingVariant
            .productId !==
            existingProduct.id
        )
      ) {
        result.errors.push(
          `Row ${rowNumber}: Barcode "${barcode}" already belongs to another product.`
        );
      }
    }
  
    if (
      existingProduct &&
      cleanUpper(
        existingProduct.parentSku
      ) !== parentSku
    ) {
      result.errors.push(
        `Row ${rowNumber}: Existing product does not match parent SKU "${parentSku}".`
      );
    }
  
    return result;
  };
  
  const validateModeForProduct = ({
    importMode,
    existingProduct,
    parentSku,
  }) => {
    const result =
      createResult();
  
    if (
      importMode ===
        "CREATE_ONLY" &&
      existingProduct
    ) {
      result.errors.push(
        `Product "${parentSku}" already exists and cannot be updated in CREATE_ONLY mode.`
      );
    }
  
    if (
      importMode ===
        "UPDATE_ONLY" &&
      !existingProduct
    ) {
      result.errors.push(
        `Product "${parentSku}" does not exist and cannot be created in UPDATE_ONLY mode.`
      );
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Group Validation
  |--------------------------------------------------------------------------
  */
  
  const validateVariants = ({
    productRows,
    headers,
    lookups,
    productType,
    parentSku,
    existingProduct,
  }) => {
    const result =
      createResult();
  
    if (
      productType ===
        "SIMPLE" &&
      productRows.length >
        1
    ) {
      result.errors.push(
        `SIMPLE product "${parentSku}" may contain only one CSV row.`
      );
    }
  
    let defaultCount =
      0;
  
    const combinationOwners =
      new Map();
  
    productRows.forEach(
      (
        row,
        index
      ) => {
        const rowNumber =
          getRowNumber(
            row,
            index
          );
  
        const isDefault =
          hasValue(
            row.isDefault
          )
            ? normalizeBoolean(
                row.isDefault
              )
            : index === 0;
  
        if (
          isDefault === true
        ) {
          defaultCount +=
            1;
        }
  
        mergeResult(
          result,
          validateVariantAttributes({
            row,
            rowNumber,
            headers,
            lookups,
            productType,
          })
        );
  
        mergeResult(
          result,
          validatePrices({
            row,
            rowNumber,
            headers,
            lookups,
          })
        );
  
        mergeResult(
          result,
          validateExistingVariantOwnership({
            row,
            rowNumber,
            parentSku,
            existingProduct,
            lookups,
          })
        );
  
        const combinationKey =
          buildVariantCombinationKey({
            row,
            headers,
          });
  
        if (
          combinationOwners.has(
            combinationKey
          )
        ) {
          result.errors.push(
            `Rows ${combinationOwners.get(combinationKey)} and ${rowNumber}: Duplicate variant attribute combination for product "${parentSku}".`
          );
        } else {
          combinationOwners.set(
            combinationKey,
            rowNumber
          );
        }
      }
    );
  
    if (
      defaultCount >
      1
    ) {
      result.errors.push(
        `Product "${parentSku}" contains more than one default variant.`
      );
    }
  
    if (
      defaultCount ===
        0 &&
      productRows.length >
        0
    ) {
      result.warnings.push(
        `Product "${parentSku}" does not explicitly define a default variant. The first variant will be used.`
      );
    }
  
    return result;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Validate One Product Group
  |--------------------------------------------------------------------------
  */
  
  const validateProduct = ({
    productRows,
    headers,
    lookups,
    importMode =
      "CREATE_OR_UPDATE",
  }) => {
    const result =
      createResult();
  
    if (
      !Array.isArray(
        productRows
      ) ||
      productRows.length ===
        0
    ) {
      result.errors.push(
        "Product group contains no rows."
      );
  
      return {
        ...result,
        action:
          "SKIP",
        parentSku:
          "",
        existingProduct:
          null,
      };
    }
  
    const firstRow =
      productRows[0];
  
    const parentSku =
      cleanUpper(
        firstRow.parentSku
      );
  
      const productType =
      cleanUpper(
        firstRow.productType ||
        "SIMPLE"
      );
      
    const existingProduct =
      parentSku
        ? lookups.maps
            .productByParentSku
            .get(
              parentSku
            ) ||
          null
        : null;
  
    if (
      !existingProduct
    ) {
      productRows.forEach(
        (
          row,
          index
        ) => {
          mergeResult(
            result,
            validateRequiredRowFields({
              row,
              rowNumber:
                getRowNumber(
                  row,
                  index
                ),
            })
          );
        }
      );
    }

    mergeResult(
      result,
      validateGroupConsistency(
        productRows
      )
    );
  
    mergeResult(
      result,
      validateBrandReference({
        firstRow,
        lookups,
      })
    );
  
    mergeResult(
      result,
      validateCategoryReferences({
        firstRow,
        lookups,
      })
    );
  
    mergeResult(
        result,
        validateCollectionReferences({
          firstRow,
          lookups,
        })
      );
      mergeResult(
        result,
        validateDirectDelivery({
          firstRow,
          lookups,
        })
      );

      
      mergeResult(
        result,
        validateMediaReferences({
          productRows,
          lookups,
        })
      );
      
      mergeResult(
        result,
        validateSpecifications({
          firstRow,
          headers,
          lookups,
        })
      );
  
    mergeResult(
      result,
      validateVariants({
        productRows,
        headers,
        lookups,
        productType,
        parentSku,
        existingProduct,
      })
    );
  
    const deliveryMinDays =
      hasValue(
        firstRow.deliveryMinDays
      )
        ? normalizeNumber(
            firstRow.deliveryMinDays
          )
        : null;

    const deliveryMaxDays =
      hasValue(
        firstRow.deliveryMaxDays
      )
        ? normalizeNumber(
            firstRow.deliveryMaxDays
          )
        : null;

    if (
      deliveryMinDays !== null &&
      deliveryMaxDays !== null &&
      deliveryMaxDays <
        deliveryMinDays
    ) {
      result.errors.push(
        "deliveryMaxDays cannot be less than deliveryMinDays."
      );
    }

    productRows.forEach(
      (
        row,
        index
      ) => {
        const variantMin =
          hasValue(
            row.variantDeliveryMinDays
          )
            ? normalizeNumber(
                row.variantDeliveryMinDays
              )
            : null;

        const variantMax =
          hasValue(
            row.variantDeliveryMaxDays
          )
            ? normalizeNumber(
                row.variantDeliveryMaxDays
              )
            : null;

        if (
          variantMin !== null &&
          variantMax !== null &&
          variantMax <
            variantMin
        ) {
          result.errors.push(
            `Row ${getRowNumber(row, index)}: variantDeliveryMaxDays cannot be less than variantDeliveryMinDays.`
          );
        }
      }
    );

    mergeResult(
      result,
      validateModeForProduct({
        importMode,
        existingProduct,
        parentSku,
      })
    );
  
    let action;
  
    if (
      result.errors.length >
      0
    ) {
      action =
        "SKIP";
    } else if (
      existingProduct
    ) {
      action =
        "UPDATE";
    } else {
      action =
        "CREATE";
    }
  
    return {
      ...result,
  
      action,
  
      parentSku,
  
      productType,
  
      existingProduct,
  
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
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Validate Grouped Products
  |--------------------------------------------------------------------------
  */
  
  const validateGroupedProducts = ({
    groupedProducts,
    headers,
    lookups,
    importMode =
      "CREATE_OR_UPDATE",
  }) => {
    if (
      !Array.isArray(
        groupedProducts
      )
    ) {
      return [];
    }
  
    return groupedProducts.map(
      (productRows) =>
        validateProduct({
          productRows,
          headers,
          lookups,
          importMode,
        })
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Full Import Validation
  |--------------------------------------------------------------------------
  */
  
  const validateImport = ({
    rows,
    groupedProducts,
    headers,
    lookups,
    importMode =
      "CREATE_OR_UPDATE",
  }) => {
    const result =
      createResult();
  
    const modeResult =
      validateImportMode(
        importMode
      );
  
    mergeResult(
      result,
      modeResult
    );
  
    mergeResult(
      result,
      validateHeaders(
        headers ||
        getNormalizedHeaders(
          rows || []
        )
      )
    );
  
    mergeResult(
      result,
      validateRows(
        rows || []
      )
    );
  
    mergeResult(
      result,
      validateFileDuplicates(
        rows || []
      )
    );
  
    const productResults =
      result.errors.length >
        0 &&
      !lookups
        ? []
        : validateGroupedProducts({
            groupedProducts:
              groupedProducts ||
              [],
            headers:
              headers ||
              getNormalizedHeaders(
                rows || []
              ),
            lookups,
            importMode:
              modeResult.value,
          });
  
    return {
      errors:
        result.errors,
  
      warnings:
        result.warnings,
  
      products:
        productResults,
  
      summary:
        productResults.reduce(
          (
            summary,
            product
          ) => {
            summary.total +=
              1;
  
            if (
              product.action ===
              "CREATE"
            ) {
              summary.create +=
                1;
            } else if (
              product.action ===
              "UPDATE"
            ) {
              summary.update +=
                1;
            } else {
              summary.skip +=
                1;
            }
  
            if (
              product.errors.length >
              0
            ) {
              summary.invalid +=
                1;
            } else {
              summary.valid +=
                1;
            }
  
            if (
              product.warnings.length >
              0
            ) {
              summary.warningProducts +=
                1;
            }
  
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
            skip:
              0,
            warningProducts:
              0,
          }
        ),
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    validateHeaders,
    validateRows,
    validateFileDuplicates,
    validateGroupedProducts,
    validateProduct,
    validateVariants,
    validateVariantAttributes,
    validateSpecifications,
    validatePrices,
    validateImportMode,
    validateDirectDelivery,


    validateMediaFields,
    validateMediaReferences,
    validateMediaAsset,


    validateImport,

  };