const {
    body,
    param,
    query,
  } = require("express-validator");
  
  const uuidMessage =
    "A valid UUID is required.";
  
  const optionalUuid = (
    field
  ) =>
    body(field)
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(uuidMessage);
  
  const categoryIdValidation = [
    param("categoryId")
      .isUUID()
      .withMessage(
        "A valid category ID is required."
      ),
  ];
  
  const createCategoryValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Category name is required."
      )
      .isLength({
        max: 200,
      })
      .withMessage(
        "Category name cannot exceed 200 characters."
      ),
  
    body("slug")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 250,
      })
      .withMessage(
        "Slug cannot exceed 250 characters."
      ),
  
    optionalUuid(
      "parentCategoryId"
    ),
  
    optionalUuid(
      "thumbnailAssetId"
    ),
  
    optionalUuid("imageAssetId"),
  
    optionalUuid("bannerAssetId"),
  
    optionalUuid("landingPageId"),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .withMessage(
        "Sort order must be zero or greater."
      )
      .toInt(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    body("showInMenu")
      .optional()
      .isBoolean()
      .withMessage(
        "showInMenu must be true or false."
      )
      .toBoolean(),
  
    body("showOnHome")
      .optional()
      .isBoolean()
      .withMessage(
        "showOnHome must be true or false."
      )
      .toBoolean(),
  
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage(
        "isFeatured must be true or false."
      )
      .toBoolean(),
  
    body("isSearchable")
      .optional()
      .isBoolean()
      .withMessage(
        "isSearchable must be true or false."
      )
      .toBoolean(),
  
    body("robotsIndex")
      .optional()
      .isBoolean()
      .withMessage(
        "robotsIndex must be true or false."
      )
      .toBoolean(),
  
    body("robotsFollow")
      .optional()
      .isBoolean()
      .withMessage(
        "robotsFollow must be true or false."
      )
      .toBoolean(),
  ];
  
  const updateCategoryValidation = [
    ...categoryIdValidation,
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Category name cannot be empty."
      )
      .isLength({
        max: 200,
      })
      .withMessage(
        "Category name cannot exceed 200 characters."
      ),
  
    body("slug")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 250,
      })
      .withMessage(
        "Slug cannot exceed 250 characters."
      ),
  
    optionalUuid(
      "parentCategoryId"
    ),
  
    optionalUuid(
      "thumbnailAssetId"
    ),
  
    optionalUuid("imageAssetId"),
  
    optionalUuid("bannerAssetId"),
  
    optionalUuid("landingPageId"),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .withMessage(
        "Sort order must be zero or greater."
      )
      .toInt(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    body("showInMenu")
      .optional()
      .isBoolean()
      .withMessage(
        "showInMenu must be true or false."
      )
      .toBoolean(),
  
    body("showOnHome")
      .optional()
      .isBoolean()
      .withMessage(
        "showOnHome must be true or false."
      )
      .toBoolean(),
  
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage(
        "isFeatured must be true or false."
      )
      .toBoolean(),
  
    body("isSearchable")
      .optional()
      .isBoolean()
      .withMessage(
        "isSearchable must be true or false."
      )
      .toBoolean(),
  ];
  
  const listCategoriesValidation = [
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
        max: 200,
      })
      .withMessage(
        "Page size must be between 1 and 200."
      )
      .toInt(),
  
    query("parentCategoryId")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Parent category ID must be a valid UUID."
      ),
  
    query("level")
      .optional()
      .isInt({
        min: 0,
      })
      .withMessage(
        "Level must be zero or greater."
      )
      .toInt(),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("showInMenu")
      .optional()
      .isBoolean()
      .withMessage(
        "showInMenu must be true or false."
      )
      .toBoolean(),
  
    query("showOnHome")
      .optional()
      .isBoolean()
      .withMessage(
        "showOnHome must be true or false."
      )
      .toBoolean(),
  
    query("isFeatured")
      .optional()
      .isBoolean()
      .withMessage(
        "isFeatured must be true or false."
      )
      .toBoolean(),
  ];
  
  const updateCategoryStatusValidation = [
    ...categoryIdValidation,
  
    body("isActive")
      .exists()
      .withMessage(
        "isActive is required."
      )
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    body("includeChildren")
      .optional()
      .isBoolean()
      .withMessage(
        "includeChildren must be true or false."
      )
      .toBoolean(),
  ];
  
  const reorderCategoriesValidation = [
    body("categories")
      .isArray({
        min: 1,
      })
      .withMessage(
        "Categories must be a non-empty array."
      ),
  
    body("categories.*.id")
      .isUUID()
      .withMessage(
        "Every category must have a valid ID."
      ),
  
    body(
      "categories.*.sortOrder"
    )
      .isInt({
        min: 0,
      })
      .withMessage(
        "Every sort order must be zero or greater."
      )
      .toInt(),
  
    body(
      "categories.*.parentCategoryId"
    )
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Parent category ID must be a valid UUID."
      ),
  ];
  
  module.exports = {
    categoryIdValidation,
    createCategoryValidation,
    updateCategoryValidation,
    listCategoriesValidation,
    updateCategoryStatusValidation,
    reorderCategoriesValidation,
  };