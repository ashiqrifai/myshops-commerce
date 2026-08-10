const {
    body,
    param,
    query,
  } = require("express-validator");
  
  const {
    MEDIA_ASSET_TYPES,
    MEDIA_ASSET_CLASSIFICATIONS,
    MEDIA_ASSET_STATUSES,
  } = require(
    "./mediaAsset.constants"
  );
  
  exports.mediaAssetIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid media asset ID is required."
      ),
  ];
  
  exports.listMediaAssetsValidation = [
    query("page")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Page must be at least 1."
      )
      .toInt(),
  
    query("pageSize")
      .optional()
      .isInt({
        min: 1,
        max: 100,
      })
      .withMessage(
        "Page size must be between 1 and 100."
      )
      .toInt(),
  
    query("search")
      .optional()
      .trim()
      .isLength({
        max: 200,
      })
      .withMessage(
        "Search cannot exceed 200 characters."
      ),
  
    query("folderId")
      .optional({ nullable: true })
      .custom((value) => {
        if (
          value === "" ||
          value === "null" ||
          value === null
        ) {
          return true;
        }
  
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        );
      })
      .withMessage(
        "folderId must be a valid UUID or null."
      ),
  
    query("assetType")
      .optional()
      .isIn(MEDIA_ASSET_TYPES)
      .withMessage(
        "Invalid media asset type."
      ),
  
    query("classification")
      .optional()
      .isIn(
        MEDIA_ASSET_CLASSIFICATIONS
      )
      .withMessage(
        "Invalid media classification."
      ),
  
    query("status")
      .optional()
      .isIn(MEDIA_ASSET_STATUSES)
      .withMessage(
        "Invalid media asset status."
      ),
  
    query("isPublic")
      .optional()
      .isBoolean()
      .withMessage(
        "isPublic must be true or false."
      )
      .toBoolean(),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("sortBy")
      .optional()
      .isIn([
        "title",
        "originalFileName",
        "fileSize",
        "assetType",
        "classification",
        "status",
        "createdAt",
        "updatedAt",
      ])
      .withMessage(
        "Invalid sort field."
      ),
  
    query("sortDirection")
      .optional()
      .isIn(["ASC", "DESC"])
      .withMessage(
        "Sort direction must be ASC or DESC."
      ),
  ];
  
  exports.uploadMediaAssetValidation = [
    body("folderId")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Folder ID must be a valid UUID."
      ),
  
    body("classification")
      .optional()
      .isIn(
        MEDIA_ASSET_CLASSIFICATIONS
      )
      .withMessage(
        "Invalid media classification."
      ),
  
    body("title")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 250,
      })
      .withMessage(
        "Title cannot exceed 250 characters."
      ),
  
    body("altText")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 500,
      })
      .withMessage(
        "Alternative text cannot exceed 500 characters."
      ),
  
    body("caption")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isString()
      .withMessage(
        "Caption must be valid text."
      ),
  
    body("description")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    body("copyright")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 500,
      })
      .withMessage(
        "Copyright cannot exceed 500 characters."
      ),
  
    body("license")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 500,
      })
      .withMessage(
        "License cannot exceed 500 characters."
      ),
  
    body("isPublic")
      .optional()
      .isBoolean()
      .withMessage(
        "isPublic must be true or false."
      )
      .toBoolean(),
  ];
  
  exports.updateMediaAssetValidation = [
    ...exports.mediaAssetIdValidation,
  
    body("folderId")
      .optional({
        nullable: true,
      })
      .custom((value) => {
        if (value === null) {
          return true;
        }
  
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value
        );
      })
      .withMessage(
        "Folder ID must be a valid UUID or null."
      ),
  
    body("classification")
      .optional()
      .isIn(
        MEDIA_ASSET_CLASSIFICATIONS
      )
      .withMessage(
        "Invalid media classification."
      ),
  
    body("title")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 250,
      })
      .withMessage(
        "Title cannot exceed 250 characters."
      ),
  
    body("altText")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 500,
      })
      .withMessage(
        "Alternative text cannot exceed 500 characters."
      ),
  
    body("caption")
      .optional({
        nullable: true,
      })
      .isString()
      .withMessage(
        "Caption must be valid text."
      ),
  
    body("description")
      .optional({
        nullable: true,
      })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    body("copyright")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 500,
      })
      .withMessage(
        "Copyright cannot exceed 500 characters."
      ),
  
    body("license")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 500,
      })
      .withMessage(
        "License cannot exceed 500 characters."
      ),
  
    body("isPublic")
      .optional()
      .isBoolean()
      .withMessage(
        "isPublic must be true or false."
      )
      .toBoolean(),
  ];