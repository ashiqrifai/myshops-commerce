const {
    body,
    param,
    query,
  } = require(
    "express-validator"
  );
  
  exports.instagramPostIdValidation = [
    param(
      "id"
    )
      .isUUID()
      .withMessage(
        "A valid Instagram post ID is required."
      ),
  ];
  
  exports.listInstagramPostsValidation = [
    query(
      "page"
    )
      .optional()
      .isInt({
        min:
          1,
      })
      .withMessage(
        "Page must be at least 1."
      )
      .toInt(),
  
    query(
      "pageSize"
    )
      .optional()
      .isInt({
        min:
          1,
  
        max:
          200,
      })
      .withMessage(
        "Page size must be between 1 and 200."
      )
      .toInt(),
  
    query(
      "search"
    )
      .optional()
      .trim()
      .isLength({
        max:
          250,
      })
      .withMessage(
        "Search cannot exceed 250 characters."
      ),
  
    query(
      "isActive"
    )
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query(
      "sortBy"
    )
      .optional()
      .isIn([
        "sortOrder",
        "isActive",
        "createdAt",
        "updatedAt",
      ])
      .withMessage(
        "Invalid Instagram post sort field."
      ),
  
    query(
      "sortDirection"
    )
      .optional()
      .isIn([
        "ASC",
        "DESC",
      ])
      .withMessage(
        "Sort direction must be ASC or DESC."
      ),
  ];
  
  const optionalInstagramFields = [
    body(
      "caption"
    )
      .optional({
        nullable:
          true,
      })
      .isString()
      .withMessage(
        "Caption must be valid text."
      ),
  
    body(
      "altText"
    )
      .optional({
        nullable:
          true,
  
        checkFalsy:
          true,
      })
      .trim()
      .isLength({
        max:
          500,
      })
      .withMessage(
        "Alt text cannot exceed 500 characters."
      ),
  
    body(
      "sortOrder"
    )
      .optional()
      .isInt({
        min:
          0,
      })
      .withMessage(
        "Sort order must be zero or greater."
      )
      .toInt(),
  
    body(
      "isActive"
    )
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];
  
  exports.createInstagramPostValidation = [
    body(
      "mediaAssetId"
    )
      .notEmpty()
      .withMessage(
        "Instagram image is required."
      )
      .isUUID()
      .withMessage(
        "Instagram image must be a valid media asset ID."
      ),
  
    body(
      "instagramUrl"
    )
      .trim()
      .notEmpty()
      .withMessage(
        "Instagram URL is required."
      )
      .isURL({
        protocols: [
          "http",
          "https",
        ],
  
        require_protocol:
          true,
      })
      .withMessage(
        "Instagram URL must be a valid HTTP or HTTPS URL."
      )
      .custom(
        (
          value
        ) => {
          try {
            const url =
              new URL(
                value
              );
  
            const hostname =
              url.hostname
                .toLowerCase()
                .replace(
                  /^www\./,
                  ""
                );
  
            if (
              hostname !==
              "instagram.com"
            ) {
              throw new Error();
            }
  
            return true;
          } catch {
            throw new Error(
              "URL must point to instagram.com."
            );
          }
        }
      )
      .isLength({
        max:
          1000,
      })
      .withMessage(
        "Instagram URL cannot exceed 1000 characters."
      ),
  
    ...optionalInstagramFields,
  ];
  
  exports.updateInstagramPostValidation = [
    ...exports
      .instagramPostIdValidation,
  
    body(
      "mediaAssetId"
    )
      .optional()
      .isUUID()
      .withMessage(
        "Instagram image must be a valid media asset ID."
      ),
  
    body(
      "instagramUrl"
    )
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Instagram URL cannot be empty."
      )
      .isURL({
        protocols: [
          "http",
          "https",
        ],
  
        require_protocol:
          true,
      })
      .withMessage(
        "Instagram URL must be a valid HTTP or HTTPS URL."
      )
      .custom(
        (
          value
        ) => {
          try {
            const url =
              new URL(
                value
              );
  
            const hostname =
              url.hostname
                .toLowerCase()
                .replace(
                  /^www\./,
                  ""
                );
  
            if (
              hostname !==
              "instagram.com"
            ) {
              throw new Error();
            }
  
            return true;
          } catch {
            throw new Error(
              "URL must point to instagram.com."
            );
          }
        }
      )
      .isLength({
        max:
          1000,
      })
      .withMessage(
        "Instagram URL cannot exceed 1000 characters."
      ),
  
    ...optionalInstagramFields,
  ];
  
  exports.changeInstagramPostStatusValidation = [
    ...exports
      .instagramPostIdValidation,
  
    body(
      "isActive"
    )
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];