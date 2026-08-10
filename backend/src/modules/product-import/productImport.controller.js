const {
    parse,
  } = require(
    "csv-parse/sync"
  );
  
  const {
    previewProductImport,
  } = require(
    "./services/preview.service"
  );
  
  const {
    executeProductImportPreview,
  } = require(
    "./services/execute.service"
  );
  
  const {
    buildProductImportTemplate,
  } = require(
    "./services/template.service"
  );


  const {
    exportProductsToCsv,
  } = require(
    "./services/export.service"
  );
  
  const {
    PRODUCT_IMPORT_MODES,
  } = require(
    "./productImport.constants"
  );
  
  const {
    clean,
    cleanUpper,
    normalizeHeader,
  } = require(
    "./productImport.utils"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Generic Helpers
  |--------------------------------------------------------------------------
  */
  
  const createHttpError = (
    message,
    statusCode = 400,
    code = "PRODUCT_IMPORT_ERROR",
    details = null
  ) => {
    const error =
      new Error(message);
  
    error.statusCode =
      statusCode;
  
    error.code =
      code;
  
    error.details =
      details;
  
    return error;
  };
  
  const sendControllerError = (
    res,
    error
  ) => {
    console.error(
      "Product import error:",
      error
    );
  
    return res
      .status(
        error.statusCode ||
        500
      )
      .json({
        success:
          false,
  
        message:
          error.message ||
          "Product import operation failed.",
  
        code:
          error.code ||
          "PRODUCT_IMPORT_ERROR",
  
        details:
          error.details ||
          null,
  
        errors:
          Array.isArray(
            error.errors
          )
            ? error.errors.map(
                (item) => ({
                  message:
                    item.message,
  
                  path:
                    item.path,
  
                  value:
                    item.value,
  
                  type:
                    item.type,
                })
              )
            : [],
      });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Auth Context
  |--------------------------------------------------------------------------
  */
  
  const getCompanyId = (
    req
  ) =>
    req.user?.companyId ||
    req.auth?.companyId ||
    req.companyId ||
    req.body?.companyId ||
    null;
  
  const getUserId = (
    req
  ) =>
    req.user?.id ||
    req.auth?.userId ||
    req.userId ||
    null;
  
  /*
  |--------------------------------------------------------------------------
  | Boolean Request Parsing
  |--------------------------------------------------------------------------
  */
  
  const parseRequestBoolean = (
    value,
    fallback = false
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return fallback;
    }
  
    if (
      typeof value ===
      "boolean"
    ) {
      return value;
    }
  
    const normalized =
      cleanUpper(value);
  
    if (
      [
        "TRUE",
        "YES",
        "Y",
        "1",
      ].includes(
        normalized
      )
    ) {
      return true;
    }
  
    if (
      [
        "FALSE",
        "NO",
        "N",
        "0",
      ].includes(
        normalized
      )
    ) {
      return false;
    }
  
    return fallback;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Import Mode
  |--------------------------------------------------------------------------
  */
  
  const getImportMode = (
    req
  ) => {
    const importMode =
      cleanUpper(
        req.body?.importMode ||
        req.query?.importMode ||
        "CREATE_OR_UPDATE"
      );
  
    if (
      !PRODUCT_IMPORT_MODES.includes(
        importMode
      )
    ) {
      throw createHttpError(
        `importMode must be one of: ${PRODUCT_IMPORT_MODES.join(", ")}.`,
        400,
        "INVALID_PRODUCT_IMPORT_MODE"
      );
    }
  
    return importMode;
  };
  
  /*
  |--------------------------------------------------------------------------
  | CSV Header Mapping
  |--------------------------------------------------------------------------
  */
  
  const KNOWN_HEADERS = [
    "parentSku",
    "name",
    "slug",
    "productType",
    "status",
    "brandCode",
    "primaryCategorySlug",
    "categorySlugs",
  
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
  
    "websiteVisible",
    "websitePublishStatus",
    "websiteTitle",
    "websiteDescription",
  
    "kioskVisible",
    "kioskPublishStatus",
    "kioskTitle",
    "kioskDescription",
  
    "metaTitle",
    "metaDescription",
    "metaKeywords",
    "canonicalUrl",
    "collectionSlugs",
  
    "variantSku",
    "barcode",
    "variantName",
    "variantStatus",
    "variantSortOrder",
    "isDefault",
  
    "weight",
    "weightUnit",
    "length",
    "width",
    "height",
    "dimensionUnit",
  ];
  
  const KNOWN_HEADER_MAP =
    new Map(
      KNOWN_HEADERS.map(
        (header) => [
          normalizeHeader(
            header
          ),
          header,
        ]
      )
    );
  
  const normalizeDynamicHeader = (
    header
  ) => {
    const text =
      clean(header);
  
    const lower =
      text.toLowerCase();
  
    const dynamicPrefixes = [
      {
        normalized:
          "variant:",
  
        output:
          "variant:",
      },
      {
        normalized:
          "spec:",
  
        output:
          "spec:",
      },
      {
        normalized:
          "regularprice:",
  
        output:
          "regularPrice:",
      },
      {
        normalized:
          "sellingprice:",
  
        output:
          "sellingPrice:",
      },
      {
        normalized:
          "compareatprice:",
  
        output:
          "compareAtPrice:",
      },
      {
        normalized:
          "costprice:",
  
        output:
          "costPrice:",
      },
    ];
  
    for (
      const prefix of
      dynamicPrefixes
    ) {
      if (
        lower.startsWith(
          prefix.normalized
        )
      ) {
        const code =
          clean(
            text.substring(
              prefix.normalized.length
            )
          );
  
        return `${prefix.output}${code}`;
      }
    }
  
    return null;
  };
  
  const mapCsvHeader = (
    header
  ) => {
    const cleaned =
      clean(header)
        .replace(
          /^\uFEFF/,
          ""
        );
  
    if (!cleaned) {
      return "";
    }
  
    const dynamicHeader =
      normalizeDynamicHeader(
        cleaned
      );
  
    if (dynamicHeader) {
      return dynamicHeader;
    }
  
    return (
      KNOWN_HEADER_MAP.get(
        normalizeHeader(
          cleaned
        )
      ) ||
      cleaned
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | CSV Parsing
  |--------------------------------------------------------------------------
  */
  
  const parseCsvBuffer = ({
    buffer,
    removeEmptyRows = true,
  }) => {
    if (
      !Buffer.isBuffer(
        buffer
      )
    ) {
      throw createHttpError(
        "A valid CSV file buffer is required.",
        400,
        "CSV_FILE_BUFFER_REQUIRED"
      );
    }
  
    const csvText =
      buffer.toString(
        "utf8"
      );
  
    if (
      !clean(csvText)
    ) {
      throw createHttpError(
        "The uploaded CSV file is empty.",
        400,
        "EMPTY_PRODUCT_IMPORT_FILE"
      );
    }
  
    let rawRecords;
  
    try {
      rawRecords =
        parse(
          csvText,
          {
            bom:
              true,
  
            columns:
              false,
  
            skip_empty_lines:
              false,
  
            relax_column_count:
              false,
  
            relax_quotes:
              false,
  
            trim:
              false,
          }
        );
    } catch (
      error
    ) {
      throw createHttpError(
        `Unable to parse CSV file: ${error.message}`,
        400,
        "INVALID_PRODUCT_IMPORT_CSV"
      );
    }
  
    if (
      !Array.isArray(
        rawRecords
      ) ||
      rawRecords.length ===
        0
    ) {
      throw createHttpError(
        "The CSV file does not contain any records.",
        400,
        "EMPTY_PRODUCT_IMPORT_FILE"
      );
    }
  
    const rawHeaders =
      rawRecords[0];
  
    if (
      !Array.isArray(
        rawHeaders
      ) ||
      rawHeaders.length ===
        0
    ) {
      throw createHttpError(
        "The CSV file does not contain a header row.",
        400,
        "PRODUCT_IMPORT_HEADERS_REQUIRED"
      );
    }
  
    const headers =
      rawHeaders.map(
        mapCsvHeader
      );
  
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
  
    if (
      duplicateHeaders.size >
      0
    ) {
      throw createHttpError(
        `The CSV contains duplicate columns: ${[
          ...duplicateHeaders,
        ].join(", ")}.`,
        400,
        "DUPLICATE_PRODUCT_IMPORT_HEADERS"
      );
    }
  
    const rows = [];
  
    for (
      let index = 1;
      index <
      rawRecords.length;
      index += 1
    ) {
      const record =
        rawRecords[index];
  
      const row = {
        rowNumber:
          index + 1,
      };
  
      headers.forEach(
        (
          header,
          columnIndex
        ) => {
          if (!header) {
            return;
          }
  
          row[header] =
            record[
              columnIndex
            ] ?? "";
        }
      );
  
      const isEmpty =
        headers.every(
          (header) =>
            !clean(
              row[header]
            )
        );
  
      if (
        removeEmptyRows &&
        isEmpty
      ) {
        continue;
      }
  
      rows.push(row);
    }
  
    return {
      headers,
      rows,
  
      source: {
        totalPhysicalRows:
          rawRecords.length,
  
        dataRowCount:
          rows.length,
  
        removedEmptyRows:
          rawRecords.length -
          1 -
          rows.length,
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Uploaded File Validation
  |--------------------------------------------------------------------------
  */
  
  const validateUploadedCsv = (
    req
  ) => {
    if (!req.file) {
      throw createHttpError(
        "Please upload a CSV file.",
        400,
        "PRODUCT_IMPORT_FILE_REQUIRED"
      );
    }
  
    const originalName =
      clean(
        req.file.originalname
      );
  
    const mimeType =
      clean(
        req.file.mimetype
      ).toLowerCase();
  
    const hasCsvExtension =
      originalName
        .toLowerCase()
        .endsWith(
          ".csv"
        );
  
    const allowedMimeTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "text/plain",
      "application/octet-stream",
    ];
  
    if (
      !hasCsvExtension &&
      !allowedMimeTypes.includes(
        mimeType
      )
    ) {
      throw createHttpError(
        "Only CSV files are supported.",
        400,
        "INVALID_PRODUCT_IMPORT_FILE_TYPE"
      );
    }
  
    if (
      !req.file.buffer
    ) {
      throw createHttpError(
        "The uploaded CSV file could not be read.",
        400,
        "PRODUCT_IMPORT_FILE_BUFFER_MISSING"
      );
    }
  
    return req.file;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Get Template Metadata
  |--------------------------------------------------------------------------
  */
  
  const getProductImportTemplate =
    async (
      req,
      res
    ) => {
      try {
        const companyId =
          getCompanyId(
            req
          );
  
        if (!companyId) {
          throw createHttpError(
            "Company context is required.",
            400,
            "COMPANY_CONTEXT_REQUIRED"
          );
        }
  
        const includeExamples =
          parseRequestBoolean(
            req.query
              ?.includeExamples,
            false
          );
  
        const template =
          await buildProductImportTemplate({
            companyId,
            includeExamples,
            includeBom:
              false,
          });
  
        return res
          .status(200)
          .json({
            success:
              true,
  
            data: {
              companyId:
                template.companyId,
  
              fileName:
                template.fileName,
  
              headers:
                template.headers,
  
              rows:
                template.rows,
  
              columns:
                template.columns,
  
              references:
                template.references,
  
              summary:
                template.summary,
            },
          });
      } catch (
        error
      ) {
        return sendControllerError(
          res,
          error
        );
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Download Template
  |--------------------------------------------------------------------------
  */
  
  const downloadProductImportTemplate =
    async (
      req,
      res
    ) => {
      try {
        const companyId =
          getCompanyId(
            req
          );
  
        if (!companyId) {
          throw createHttpError(
            "Company context is required.",
            400,
            "COMPANY_CONTEXT_REQUIRED"
          );
        }
  
        const includeExamples =
          parseRequestBoolean(
            req.query
              ?.includeExamples,
            false
          );
  
        const template =
          await buildProductImportTemplate({
            companyId,
            includeExamples,
            includeBom:
              true,
          });
  
        res.setHeader(
          "Content-Type",
          template.mimeType
        );
  
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${template.fileName}"`
        );
  
        res.setHeader(
          "Cache-Control",
          "no-store"
        );
  
        return res
          .status(200)
          .send(
            template.csv
          );
      } catch (
        error
      ) {
        return sendControllerError(
          res,
          error
        );
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Preview Product Import
  |--------------------------------------------------------------------------
  */
  
  const previewProductImportCsv =
    async (
      req,
      res
    ) => {
      try {
        const companyId =
          getCompanyId(
            req
          );
  
        if (!companyId) {
          throw createHttpError(
            "Company context is required.",
            400,
            "COMPANY_CONTEXT_REQUIRED"
          );
        }
  
        const file =
          validateUploadedCsv(
            req
          );
  
        const importMode =
          getImportMode(
            req
          );
  
        const removeEmptyRows =
          parseRequestBoolean(
            req.body
              ?.removeEmptyRows,
            true
          );
  
        const parsedCsv =
          parseCsvBuffer({
            buffer:
              file.buffer,
  
            removeEmptyRows,
          });
  
        const preview =
          await previewProductImport({
            companyId,
  
            rows:
              parsedCsv.rows,
  
            headers:
              parsedCsv.headers,
  
            importMode,
  
            removeEmptyRows:
              false,
          });
  
        return res
          .status(200)
          .json({
            success:
              true,
  
            message:
              preview.hasErrors
                ? "Product import preview completed with validation errors."
                : "Product import preview completed successfully.",
  
            file: {
              originalName:
                file.originalname,
  
              mimeType:
                file.mimetype,
  
              size:
                file.size,
  
              ...parsedCsv.source,
            },
  
            data:
              preview,
          });
      } catch (
        error
      ) {
        return sendControllerError(
          res,
          error
        );
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Execute Product Import
  |--------------------------------------------------------------------------
  */
  
  const executeProductImport =
    async (
      req,
      res
    ) => {
      try {
        const companyId =
          getCompanyId(
            req
          );
  
        const userId =
          getUserId(
            req
          );
  
        if (!companyId) {
          throw createHttpError(
            "Company context is required.",
            400,
            "COMPANY_CONTEXT_REQUIRED"
          );
        }
  
        if (!userId) {
          throw createHttpError(
            "Authenticated user context is required.",
            400,
            "USER_CONTEXT_REQUIRED"
          );
        }
  
        const preview =
          req.body?.preview;
  
        if (!preview) {
          throw createHttpError(
            "The approved product import preview is required.",
            400,
            "PRODUCT_IMPORT_PREVIEW_REQUIRED"
          );
        }
  
        const continueOnError =
          parseRequestBoolean(
            req.body
              ?.continueOnError,
            true
          );
  
        const result =
          await executeProductImportPreview({
            companyId,
  
            userId,
  
            preview,
  
            continueOnError,
          });
  
        const statusCode =
          result.summary.failed >
            0 &&
          result.summary.succeeded ===
            0
            ? 422
            : 200;
  
        return res
          .status(
            statusCode
          )
          .json({
            success:
              result.success,
  
            message:
              result.success
                ? "Product import completed successfully."
                : result.partiallySuccessful
                  ? "Product import completed with some failures."
                  : "Product import failed.",
  
            data:
              result,
          });
      } catch (
        error
      ) {
        return sendControllerError(
          res,
          error
        );
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Preview and Execute Directly
  |--------------------------------------------------------------------------
  |
  | Optional endpoint for trusted admin use.
  |
  | It parses, previews and executes the CSV in one request. The normal UI should
  | still use preview first and execute only after user confirmation.
  |--------------------------------------------------------------------------
  */
  
  const importProductCsvDirectly =
    async (
      req,
      res
    ) => {
      try {
        const companyId =
          getCompanyId(
            req
          );
  
        const userId =
          getUserId(
            req
          );
  
        if (!companyId) {
          throw createHttpError(
            "Company context is required.",
            400,
            "COMPANY_CONTEXT_REQUIRED"
          );
        }
  
        if (!userId) {
          throw createHttpError(
            "Authenticated user context is required.",
            400,
            "USER_CONTEXT_REQUIRED"
          );
        }
  
        const file =
          validateUploadedCsv(
            req
          );
  
        const importMode =
          getImportMode(
            req
          );
  
        const continueOnError =
          parseRequestBoolean(
            req.body
              ?.continueOnError,
            true
          );
  
        const parsedCsv =
          parseCsvBuffer({
            buffer:
              file.buffer,
  
            removeEmptyRows:
              true,
          });
  
        const preview =
          await previewProductImport({
            companyId,
  
            rows:
              parsedCsv.rows,
  
            headers:
              parsedCsv.headers,
  
            importMode,
  
            removeEmptyRows:
              false,
          });
  
        if (
          preview.validation
            ?.errors
            ?.length
        ) {
          return res
            .status(422)
            .json({
              success:
                false,
  
              message:
                "The CSV contains global validation errors and was not executed.",
  
              file: {
                originalName:
                  file.originalname,
  
                mimeType:
                  file.mimetype,
  
                size:
                  file.size,
  
                ...parsedCsv.source,
              },
  
              data: {
                preview,
              },
            });
        }
  
        const execution =
          await executeProductImportPreview({
            companyId,
  
            userId,
  
            preview,
  
            continueOnError,
          });
  
        return res
          .status(
            execution.summary
                .failed >
              0
              ? 207
              : 200
          )
          .json({
            success:
              execution.success,
  
            message:
              execution.success
                ? "Product CSV imported successfully."
                : "Product CSV import completed with some failures.",
  
            file: {
              originalName:
                file.originalname,
  
              mimeType:
                file.mimetype,
  
              size:
                file.size,
  
              ...parsedCsv.source,
            },
  
            data: {
              preview,
  
              execution,
            },
          });
      } catch (
        error
      ) {
        return sendControllerError(
          res,
          error
        );
      }
    };
  

  /*
  |--------------------------------------------------------------------------
  | Export Products CSV
  |--------------------------------------------------------------------------
  */

  const exportProductsCsv =
    async (
      req,
      res
    ) => {
      try {
        const companyId =
          getCompanyId(
            req
          );

        const result =
          await exportProductsToCsv({
            companyId,

            filters: {
              search:
                req.query.search,

              status:
                req.query.status,

              brandId:
                req.query.brandId,

              categoryId:
                req.query.categoryId,

              productType:
                req.query.productType,

              channelCode:
                req.query.channelCode,

              isFeatured:
                req.query.isFeatured,

              productIds:
                req.query.productIds,
            },

            includeBom:
              parseRequestBoolean(
                req.query.includeBom,
                true
              ),
          });

        res.setHeader(
          "Content-Type",
          result.mimeType
        );

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${result.fileName}"`
        );

        res.setHeader(
          "Cache-Control",
          "no-store"
        );

        res.setHeader(
          "X-Product-Count",
          String(
            result.summary
              .productCount
          )
        );

        res.setHeader(
          "X-Variant-Row-Count",
          String(
            result.summary
              .variantRowCount
          )
        );

        return res
          .status(200)
          .send(
            result.csv
          );
      } catch (
        error
      ) {
        return sendControllerError(
          res,
          error
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    getProductImportTemplate,
  
    downloadProductImportTemplate,
  
    previewProductImportCsv,
  
    executeProductImport,
  
    importProductCsvDirectly,
  
    exportProductsCsv,
  
    parseCsvBuffer,
  
    validateUploadedCsv,
  
    mapCsvHeader,
  
    normalizeDynamicHeader,
  
    parseRequestBoolean,
  
    getImportMode,
  
    getCompanyId,
  
    getUserId,
  
    sendControllerError,
  };