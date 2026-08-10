const {
    importBrands,
  } = require(
    "./brandImport.service"
  );
  
  const {
    BRAND_IMPORT_HEADERS,
  } = require(
    "./brandImport.constants"
  );
  
  const parseBoolean =
  (
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
  
  const sendError =
  (
    res,
    error
  ) => {
    console.error(
      "Brand import error:",
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
            "BRAND_IMPORT_ERROR",
  
          message:
            error.message ||
            "Brand import failed.",
  
          details:
            error.details ||
            [],
        },
      });
  };
  
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
            "brand-import-template.csv",
  
          headers:
            BRAND_IMPORT_HEADERS,
  
          example: {
            name:
              "Apple",
  
            code:
              "APPLE",
  
            slug:
              "apple",
  
            description:
              "Apple products",
  
            websiteUrl:
              "https://www.apple.com",
  
            countryOfOrigin:
              "USA",
  
            isActive:
              true,
  
            isFeatured:
              true,
  
            sortOrder:
              1,
  
            metaTitle:
              "Apple",
  
            metaDescription:
              "Shop Apple products",
  
            metaKeywords:
              "apple iphone mac",
          },
        },
      });
  };
  
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
            "Please upload a brand CSV file."
          );
  
        error.statusCode =
          400;
  
        error.code =
          "BRAND_IMPORT_FILE_REQUIRED";
  
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
        await importBrands({
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
              ? "Brand CSV imported successfully."
              : result.partiallySuccessful
                ? "Brand CSV import completed with some failures."
                : "Brand CSV import failed.",
  
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