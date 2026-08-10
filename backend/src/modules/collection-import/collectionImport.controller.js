const {
    importCollections,
  } = require(
    "./collectionImport.service"
  );
  
  const {
    COLLECTION_IMPORT_HEADERS,
  } = require(
    "./collectionImport.constants"
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
      "Collection import error:",
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
            "COLLECTION_IMPORT_ERROR",
  
          message:
            error.message ||
            "Collection import failed.",
  
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
            "collection-import-template.csv",
  
          headers:
            COLLECTION_IMPORT_HEADERS,
  
          example: {
            name:
              "Flash Deals",
  
            slug:
              "flash-deals",
  
            description:
              "Limited-time deals and promotional products.",
  
            shortDescription:
              "Limited-time offers",
  
            collectionType:
              "MANUAL",
  
            sortOrder:
              1,
  
            isActive:
              true,
  
            isFeatured:
              true,
  
            showInMenu:
              false,
  
            showOnHome:
              true,
  
            isSearchable:
              true,
  
            showProductCount:
              true,
  
            publishedFrom:
              "",
  
            publishedUntil:
              "",
  
            metaTitle:
              "Flash Deals",
  
            metaDescription:
              "Shop the latest MyShops flash deals.",
  
            metaKeywords:
              "flash deals offers",
  
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
            "Please upload a collection CSV file."
          );
  
        error.statusCode =
          400;
  
        error.code =
          "COLLECTION_IMPORT_FILE_REQUIRED";
  
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
        await importCollections({
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
              ? "Collection CSV imported successfully."
              : result.partiallySuccessful
                ? "Collection CSV import completed with some failures."
                : "Collection CSV import failed.",
  
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