const {
    importCategories,
  } = require(
    "./categoryImport.service"
  );
  
  const {
    CATEGORY_IMPORT_HEADERS,
  } = require(
    "./categoryImport.constants"
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
      "Category import error:",
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
            "CATEGORY_IMPORT_ERROR",
  
          message:
            error.message ||
            "Category import failed.",
  
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
            "category-import-template.csv",
  
          headers:
            CATEGORY_IMPORT_HEADERS,
  
          example: {
            name:
              "Mobiles",
  
            slug:
              "mobiles",
  
            parentSlug:
              "",
  
            description:
              "Mobile phones and smartphones",
  
            shortDescription:
              "",
  
            sortOrder:
              1,
  
            iconName:
              "",
  
            iconUrl:
              "",
  
            isActive:
              true,
  
            showInMenu:
              true,
  
            showOnHome:
              true,
  
            isFeatured:
              true,
  
            isSearchable:
              true,
  
            metaTitle:
              "Mobiles",
  
            metaDescription:
              "Shop mobile phones",
  
            metaKeywords:
              "phones smartphones",
  
            canonicalUrl:
              "",
  
            robotsIndex:
              true,
  
            robotsFollow:
              true,
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
            "Please upload a category CSV file."
          );
  
        error.statusCode =
          400;
  
        error.code =
          "CATEGORY_IMPORT_FILE_REQUIRED";
  
        throw error;
      }
  
      const companyId =
        req.context
          ?.companyId ||
        req.user
          ?.companyId;
  
      const userId =
        req.context
          ?.userId ||
        req.user
          ?.id;
  
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
        await importCategories({
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
              ? "Category CSV imported successfully."
              : result.partiallySuccessful
                ? "Category CSV import completed with some failures."
                : "Category CSV import failed.",
  
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