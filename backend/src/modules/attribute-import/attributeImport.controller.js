const {
    importAttributes,
  } = require(
    "./attributeImport.service"
  );
  
  const {
    ATTRIBUTE_IMPORT_HEADERS,
  } = require(
    "./attributeImport.constants"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Boolean Helper
  |--------------------------------------------------------------------------
  */
  
  const parseBoolean = (
    value,
    fallback
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return fallback;
    }
  
    return [
      true,
      "true",
      "TRUE",
      "1",
      "yes",
      "YES",
    ].includes(
      value
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Error Response
  |--------------------------------------------------------------------------
  */
  
  const sendError = (
    res,
    error
  ) => {
    console.error(
      "Attribute import error:",
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
  
        error: {
          code:
            error.code ||
            "ATTRIBUTE_IMPORT_ERROR",
  
          message:
            error.message ||
            "Attribute import failed.",
  
          details:
            error.details ||
            [],
        },
      });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Template
  |--------------------------------------------------------------------------
  */
  
  const getTemplate =
    async (
      req,
      res
    ) => {
      return res
        .status(
          200
        )
        .json({
          success:
            true,
  
          data: {
            fileName:
              "attribute-import-template.csv",
  
            headers:
              ATTRIBUTE_IMPORT_HEADERS,
  
            optionFormat: {
              separator:
                "|",
  
              fieldSeparator:
                "::",
  
              examples: [
                "128 GB|256 GB|512 GB",
  
                "Black::black::#000000|White::white::#FFFFFF",
              ],
  
              description:
                "Option format is label, label::value or label::value::swatchValue. Multiple options are separated using |.",
            },
  
            categoryFormat: {
              separator:
                "|",
  
              example:
                "mobile-phones|tablets|laptops",
  
              description:
                "Use active category slugs separated by |.",
            },
  
            example: {
              name:
                "Storage",
  
              code:
                "STORAGE",
  
              description:
                "Device storage capacity",
  
              inputType:
                "SINGLE_SELECT",
  
              dataType:
                "STRING",
  
              unit:
                "GB",
  
              isVariantDefining:
                true,
  
              isFilterable:
                true,
  
              isSearchable:
                true,
  
              isComparable:
                true,
  
              isRequired:
                true,
  
              displayOrder:
                20,
  
              isActive:
                true,
  
              options:
                "128 GB|256 GB|512 GB|1 TB",
  
              categorySlugs:
                "mobile-phones|tablets",
            },
          },
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Import
  |--------------------------------------------------------------------------
  */
  
  const importCsv =
    async (
      req,
      res
    ) => {
      try {
        if (
          !req.file
        ) {
          const error =
            new Error(
              "Please upload an attribute CSV file."
            );
  
          error.statusCode =
            400;
  
          error.code =
            "ATTRIBUTE_IMPORT_FILE_REQUIRED";
  
          throw error;
        }
  
        const companyId =
          req.user
            ?.companyId ||
          req.context
            ?.companyId;
  
        const userId =
          req.user
            ?.id ||
          req.context
            ?.userId;
  
        if (
          !companyId
        ) {
          const error =
            new Error(
              "Company context is required."
            );
  
          error.statusCode =
            400;
  
          error.code =
            "COMPANY_CONTEXT_REQUIRED";
  
          throw error;
        }
  
        if (
          !userId
        ) {
          const error =
            new Error(
              "Authenticated user context is required."
            );
  
          error.statusCode =
            400;
  
          error.code =
            "USER_CONTEXT_REQUIRED";
  
          throw error;
        }
  
        const result =
          await importAttributes({
            companyId,
  
            userId,
  
            buffer:
              req.file.buffer,
  
            importMode:
              req.body
                ?.importMode ||
              req.query
                ?.importMode ||
              "CREATE_OR_UPDATE",
  
            continueOnError:
              parseBoolean(
                req.body
                  ?.continueOnError ??
                req.query
                  ?.continueOnError,
  
                true
              ),
          });
  
        const statusCode =
          result.summary.failed >
            0 &&
          result.summary.created ===
            0 &&
          result.summary.updated ===
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
                ? "Attribute CSV imported successfully."
                : result.partiallySuccessful
                  ? "Attribute CSV import completed with some failures."
                  : "Attribute CSV import failed.",
  
            file: {
              originalName:
                req.file
                  .originalname,
  
              mimeType:
                req.file
                  .mimetype,
  
              size:
                req.file
                  .size,
            },
  
            data:
              result,
          });
      } catch (
        error
      ) {
        return sendError(
          res,
          error
        );
      }
    };
  
  module.exports = {
    getTemplate,
    importCsv,
  };