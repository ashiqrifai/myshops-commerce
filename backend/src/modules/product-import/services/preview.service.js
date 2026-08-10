const {
    PRODUCT_IMPORT_MODES,
  } = require(
    "../productImport.constants"
  );
  
  const {
    clean,
    cleanUpper,
    groupRowsByParentSku,
  } = require(
    "../productImport.utils"
  );
  
  const {
    loadImportLookups,
  } = require(
    "./lookup.service"
  );
  
  const {
    validateImport,
    validateImportMode,
  } = require(
    "./validation.service"
  );
  
  const {
    buildImportPayload,
  } = require(
    "./payloadBuilder.service"
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
  
  const createEmptySummary = () => ({
    totalRows: 0,
  
    totalProducts: 0,
  
    validProducts: 0,
  
    invalidProducts: 0,
  
    createProducts: 0,
  
    updateProducts: 0,
  
    noChangeProducts: 0,
  
    skippedProducts: 0,
  
    executableProducts: 0,
  
    totalVariants: 0,
  
    totalPrices: 0,
  
    totalErrors: 0,
  
    totalWarnings: 0,
  });
  
  /*
  |--------------------------------------------------------------------------
  | Header Preparation
  |--------------------------------------------------------------------------
  */
  
  const getHeadersFromRows = (
    rows
  ) =>
    unique(
      (rows || []).flatMap(
        (row) =>
          Object.keys(
            row || {}
          ).filter(
            (key) =>
              key !==
              "rowNumber"
          )
      )
    );
  
  const normalizeHeaders = ({
    rows,
    headers,
  }) => {
    if (
      Array.isArray(headers) &&
      headers.length
    ) {
      return headers
        .map(clean)
        .filter(Boolean);
    }
  
    return getHeadersFromRows(
      rows
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Row Preparation
  |--------------------------------------------------------------------------
  */
  
  const isCompletelyEmptyRow = (
    row,
    headers
  ) => {
    if (
      !row ||
      typeof row !==
        "object"
    ) {
      return true;
    }
  
    return !headers.some(
      (header) =>
        hasValue(
          row[header]
        )
    );
  };
  
  const normalizeRows = ({
    rows,
    headers,
    removeEmptyRows = true,
  }) => {
    if (
      !Array.isArray(rows)
    ) {
      return [];
    }
  
    const normalized = rows.map(
      (
        row,
        index
      ) => ({
        ...(row || {}),
  
        rowNumber:
          Number(
            row?.rowNumber
          ) ||
          index + 2,
      })
    );
  
    if (!removeEmptyRows) {
      return normalized;
    }
  
    return normalized.filter(
      (row) =>
        !isCompletelyEmptyRow(
          row,
          headers
        )
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Validation Result Sanitization
  |--------------------------------------------------------------------------
  */
  
  const sanitizeExistingProduct = (
    existingProduct
  ) => {
    if (!existingProduct) {
      return null;
    }
  
    return {
      id:
        existingProduct.id,
  
      parentSku:
        existingProduct.parentSku,
  
      name:
        existingProduct.name,
  
      slug:
        existingProduct.slug,
  
      productType:
        existingProduct.productType,
  
      status:
        existingProduct.status,
  
      updatedAt:
        existingProduct.updatedAt,
    };
  };
  
  const sanitizeValidationProduct = (
    product
  ) => ({
    parentSku:
      product.parentSku,
  
    productType:
      product.productType,
  
    action:
      product.action,
  
    rowNumbers:
      product.rowNumbers || [],
  
    valid:
      (
        product.errors
          ?.length || 0
      ) === 0,
  
    errors:
      product.errors || [],
  
    warnings:
      product.warnings || [],
  
    existingProduct:
      sanitizeExistingProduct(
        product.existingProduct
      ),
  });
  
  const sanitizeValidation = (
    validation
  ) => ({
    errors:
      validation.errors || [],
  
    warnings:
      validation.warnings || [],
  
    products:
      (
        validation.products || []
      ).map(
        sanitizeValidationProduct
      ),
  
    summary:
      validation.summary || {
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
      },
  });
  
  /*
  |--------------------------------------------------------------------------
  | Product Preview Records
  |--------------------------------------------------------------------------
  */
  
  const buildProductPreview = (
    product
  ) => ({
    parentSku:
      product.parentSku,
  
    productType:
      product.productType,
  
    action:
      product.action,
  
    valid:
      product.valid,
  
    executable:
      product.valid === true &&
      [
        "CREATE",
        "UPDATE",
      ].includes(
        product.action
      ),
  
    rowNumbers:
      product.rowNumbers || [],
  
    existingProductId:
      product.existingProductId,
  
    summary:
      product.summary,
  
    resolved:
      product.resolved,
  
    validation:
      product.validation,
  
    payload:
      product.valid
        ? (
            product.action ===
            "UPDATE"
              ? product.updatePayload
              : product.createPayload
          )
        : null,
  
    createPayload:
      product.createPayload,
  
    updatePayload:
      product.updatePayload,
  
    associations:
      product.associations,
  
    pricing:
      product.pricing,
  
    source:
      product.source,
  });
  
  /*
  |--------------------------------------------------------------------------
  | Preview Summary
  |--------------------------------------------------------------------------
  */
  
  const buildPreviewSummary = ({
    rows,
    products,
    globalErrors,
    globalWarnings,
  }) =>
    products.reduce(
      (
        summary,
        product
      ) => {
        summary.totalProducts +=
          1;
  
        summary.totalVariants +=
          product.summary
            ?.count || 0;
  
        summary.totalPrices +=
          product.pricing
            ?.count || 0;
  
        summary.totalErrors +=
          product.validation
            ?.errors
            ?.length || 0;
  
        summary.totalWarnings +=
          product.validation
            ?.warnings
            ?.length || 0;
  
        if (product.valid) {
          summary.validProducts +=
            1;
        } else {
          summary.invalidProducts +=
            1;
        }
  
        switch (
          product.action
        ) {
          case "CREATE":
            summary.createProducts +=
              1;
            break;
  
          case "UPDATE":
            summary.updateProducts +=
              1;
            break;
  
          case "NO_CHANGE":
            summary.noChangeProducts +=
              1;
            break;
  
          default:
            summary.skippedProducts +=
              1;
            break;
        }
  
        if (
          product.valid &&
          [
            "CREATE",
            "UPDATE",
          ].includes(
            product.action
          )
        ) {
          summary.executableProducts +=
            1;
        }
  
        return summary;
      },
      {
        ...createEmptySummary(),
  
        totalRows:
          rows.length,
  
        totalErrors:
          globalErrors.length,
  
        totalWarnings:
          globalWarnings.length,
      }
    );
  
  /*
  |--------------------------------------------------------------------------
  | Lookup Summary
  |--------------------------------------------------------------------------
  */
  
  const buildLookupSummary = (
    lookups
  ) => ({
    requested: {
      brandCodes:
        lookups.requested
          ?.brandCodes || [],
  
      categorySlugs:
        lookups.requested
          ?.categorySlugs || [],
  
      collectionSlugs:
        lookups.requested
          ?.collectionSlugs || [],
  
      attributeCodes:
        lookups.requested
          ?.attributeCodes || [],
  
      priceListCodes:
        lookups.requested
          ?.priceListCodes || [],
  
      parentSkus:
        lookups.requested
          ?.parentSkus || [],
  
      variantSkus:
        lookups.requested
          ?.variantSkus || [],
  
      barcodes:
        lookups.requested
          ?.barcodes || [],
    },
  
    loaded: {
      brands:
        lookups.rows
          ?.brands
          ?.length || 0,
  
      categories:
        lookups.rows
          ?.categories
          ?.length || 0,
  
      collections:
        lookups.rows
          ?.collections
          ?.length || 0,
  
      attributes:
        lookups.rows
          ?.attributes
          ?.length || 0,
  
      priceLists:
        lookups.rows
          ?.priceLists
          ?.length || 0,
  
      existingProducts:
        lookups.rows
          ?.existingProducts
          ?.length || 0,
  
      existingVariants:
        lookups.rows
          ?.existingVariants
          ?.length || 0,
    },
  });
  
  /*
  |--------------------------------------------------------------------------
  | Preview Preconditions
  |--------------------------------------------------------------------------
  */
  
  const validatePreviewArguments = ({
    companyId,
    rows,
    importMode,
  }) => {
    const errors = [];
  
    if (!companyId) {
      errors.push(
        "companyId is required."
      );
    }
  
    if (
      !Array.isArray(rows)
    ) {
      errors.push(
        "Product import rows must be an array."
      );
    }
  
    const modeResult =
      validateImportMode(
        importMode
      );
  
    errors.push(
      ...modeResult.errors
    );
  
    return {
      errors,
  
      importMode:
        modeResult.value,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Main Preview Service
  |--------------------------------------------------------------------------
  */
  
  const previewProductImport =
    async ({
      companyId,
  
      rows,
  
      headers = null,
  
      importMode =
        "CREATE_OR_UPDATE",
  
      removeEmptyRows =
        true,
  
      transaction =
        null,
    }) => {
      const preconditions =
        validatePreviewArguments({
          companyId,
          rows,
          importMode,
        });
  
      /*
       * Invalid service arguments are programming/request
       * errors rather than CSV product errors.
       */
      if (
        preconditions.errors.length
      ) {
        const error =
          new Error(
            preconditions.errors.join(
              " "
            )
          );
  
        error.statusCode =
          400;
  
        error.code =
          "INVALID_PRODUCT_IMPORT_PREVIEW_REQUEST";
  
        error.details =
          preconditions.errors;
  
        throw error;
      }
  
      const normalizedHeaders =
        normalizeHeaders({
          rows,
          headers,
        });
  
      const normalizedRows =
        normalizeRows({
          rows,
          headers:
            normalizedHeaders,
          removeEmptyRows,
        });
  
      const groupedProducts =
        groupRowsByParentSku(
          normalizedRows
        );
  
      /*
       * Lookup loading is read-only. The optional Sequelize
       * transaction allows the controller/executor to provide
       * a consistent database snapshot when required.
       */
      const lookups =
        await loadImportLookups({
          companyId,
          rows:
            normalizedRows,
          headers:
            normalizedHeaders,
          transaction,
        });
  
      const validation =
        validateImport({
          rows:
            normalizedRows,
  
          groupedProducts,
  
          headers:
            normalizedHeaders,
  
          lookups,
  
          importMode:
            preconditions
              .importMode,
        });
  
      /*
       * Invalid products are intentionally converted into safe
       * SKIP payloads so every CSV product remains visible.
       */
      const builtPayload =
        buildImportPayload({
          groupedProducts,
  
          headers:
            normalizedHeaders,
  
          lookups,
  
          validationResults:
            validation.products,
        });
  
      const products =
        builtPayload.products.map(
          buildProductPreview
        );
  
      const summary =
        buildPreviewSummary({
          rows:
            normalizedRows,
  
          products,
  
          globalErrors:
            validation.errors ||
            [],
  
          globalWarnings:
            validation.warnings ||
            [],
        });
  
      const hasGlobalErrors =
        (
          validation.errors
            ?.length || 0
        ) > 0;
  
      const hasProductErrors =
        summary.invalidProducts >
        0;
  
      const canExecute =
        !hasGlobalErrors &&
        summary.executableProducts >
          0;
  
      return {
        success:
          true,
  
        preview:
          true,
  
        importMode:
          preconditions
            .importMode,
  
        canExecute,
  
        hasErrors:
          hasGlobalErrors ||
          hasProductErrors,
  
        hasWarnings:
          summary.totalWarnings >
          0,
  
        companyId,
  
        headers:
          normalizedHeaders,
  
        summary,
  
        validation:
          sanitizeValidation(
            validation
          ),
  
        lookups:
          buildLookupSummary(
            lookups
          ),
  
        products,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    previewProductImport,
  
    normalizeHeaders,
  
    normalizeRows,
  
    isCompletelyEmptyRow,
  
    sanitizeExistingProduct,
  
    sanitizeValidationProduct,
  
    sanitizeValidation,
  
    buildProductPreview,
  
    buildPreviewSummary,
  
    buildLookupSummary,
  
    validatePreviewArguments,
  };