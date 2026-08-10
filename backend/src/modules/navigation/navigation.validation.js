const {
    body,
    param,
    query,
  } = require("express-validator");
  
  const {
    NAVIGATION_CHANNELS,
    NAVIGATION_MENU_TYPES,
    NAVIGATION_ITEM_TYPES,
  } = require("./navigation.constants");
  
  const optionalNullableString = (
    field,
    maxLength,
    label
  ) =>
    body(field)
      .optional({ nullable: true })
      .trim()
      .isLength({
        max: maxLength,
      })
      .withMessage(
        `${label} cannot exceed ${maxLength} characters.`
      );
  
  exports.listNavigationMenusValidation = [
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
        max: 150,
      })
      .withMessage(
        "Search cannot exceed 150 characters."
      ),
  
    query("channel")
      .optional()
      .isIn(NAVIGATION_CHANNELS)
      .withMessage(
        "Invalid navigation channel."
      ),
  
    query("menuType")
      .optional()
      .isIn(NAVIGATION_MENU_TYPES)
      .withMessage(
        "Invalid navigation menu type."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];
  
  exports.navigationMenuIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid navigation menu ID is required."
      ),
  ];
  
  exports.navigationMenuCodeValidation = [
    param("code")
      .trim()
      .notEmpty()
      .withMessage(
        "Navigation menu code is required."
      )
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Navigation menu code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({
        max: 100,
      })
      .withMessage(
        "Navigation menu code cannot exceed 100 characters."
      ),
  ];
  
  exports.createNavigationMenuValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Navigation menu name is required."
      )
      .isLength({
        max: 150,
      })
      .withMessage(
        "Navigation menu name cannot exceed 150 characters."
      ),
  
    body("code")
      .trim()
      .notEmpty()
      .withMessage(
        "Navigation menu code is required."
      )
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Navigation menu code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({
        max: 100,
      })
      .withMessage(
        "Navigation menu code cannot exceed 100 characters."
      ),
  
    body("channel")
      .optional()
      .isIn(NAVIGATION_CHANNELS)
      .withMessage(
        "Invalid navigation channel."
      ),
  
    body("menuType")
      .optional()
      .isIn(NAVIGATION_MENU_TYPES)
      .withMessage(
        "Invalid navigation menu type."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    body("settings")
      .optional()
      .isObject()
      .withMessage(
        "Settings must be an object."
      ),
  ];
  
  exports.updateNavigationMenuValidation = [
    ...exports.navigationMenuIdValidation,
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Navigation menu name cannot be empty."
      )
      .isLength({
        max: 150,
      })
      .withMessage(
        "Navigation menu name cannot exceed 150 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Navigation menu code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({
        max: 100,
      })
      .withMessage(
        "Navigation menu code cannot exceed 100 characters."
      ),
  
    body("channel")
      .optional()
      .isIn(NAVIGATION_CHANNELS)
      .withMessage(
        "Invalid navigation channel."
      ),
  
    body("menuType")
      .optional()
      .isIn(NAVIGATION_MENU_TYPES)
      .withMessage(
        "Invalid navigation menu type."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    body("settings")
      .optional()
      .isObject()
      .withMessage(
        "Settings must be an object."
      ),
  ];
  
  exports.changeNavigationMenuActiveValidation = [
    ...exports.navigationMenuIdValidation,
  
    body("isActive")
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      ),
  ];
  
  exports.navigationItemIdValidation = [
    param("itemId")
      .isUUID()
      .withMessage(
        "A valid navigation item ID is required."
      ),
  ];
  
  exports.createNavigationItemValidation = [
    param("menuId")
      .isUUID()
      .withMessage(
        "A valid navigation menu ID is required."
      ),
  
    body("parentId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "parentId must be a valid UUID."
      ),
  
    body("label")
      .trim()
      .notEmpty()
      .withMessage(
        "Navigation item label is required."
      )
      .isLength({
        max: 150,
      })
      .withMessage(
        "Navigation item label cannot exceed 150 characters."
      ),
  
    body("itemType")
      .optional()
      .isIn(NAVIGATION_ITEM_TYPES)
      .withMessage(
        "Invalid navigation item type."
      ),
  
    body("referenceId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "referenceId must be a valid UUID."
      ),
  
    optionalNullableString(
      "url",
      500,
      "URL"
    ),
  
    optionalNullableString(
      "icon",
      100,
      "Icon"
    ),
  
    body("mediaAssetId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "mediaAssetId must be a valid UUID."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    optionalNullableString(
      "badgeText",
      50,
      "Badge text"
    ),
  
    optionalNullableString(
      "badgeColor",
      30,
      "Badge color"
    ),
  
    body("displayOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .withMessage(
        "Display order must be zero or greater."
      )
      .toInt(),
  
    body("columnNumber")
      .optional()
      .isInt({
        min: 1,
        max: 12,
      })
      .withMessage(
        "Column number must be between 1 and 12."
      )
      .toInt(),
  
    body("openInNewTab")
      .optional()
      .isBoolean()
      .withMessage(
        "openInNewTab must be true or false."
      )
      .toBoolean(),
  
    body("desktopVisible")
      .optional()
      .isBoolean()
      .withMessage(
        "desktopVisible must be true or false."
      )
      .toBoolean(),
  
    body("mobileVisible")
      .optional()
      .isBoolean()
      .withMessage(
        "mobileVisible must be true or false."
      )
      .toBoolean(),
  
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage(
        "isFeatured must be true or false."
      )
      .toBoolean(),
  
    body("settings")
      .optional()
      .isObject()
      .withMessage(
        "Settings must be an object."
      ),
  ];
  
  exports.updateNavigationItemValidation = [
    ...exports.navigationItemIdValidation,
  
    body("parentId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "parentId must be a valid UUID."
      ),
  
    body("label")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Navigation item label cannot be empty."
      )
      .isLength({
        max: 150,
      })
      .withMessage(
        "Navigation item label cannot exceed 150 characters."
      ),
  
    body("itemType")
      .optional()
      .isIn(NAVIGATION_ITEM_TYPES)
      .withMessage(
        "Invalid navigation item type."
      ),
  
    body("referenceId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "referenceId must be a valid UUID."
      ),
  
    optionalNullableString(
      "url",
      500,
      "URL"
    ),
  
    optionalNullableString(
      "icon",
      100,
      "Icon"
    ),
  
    body("mediaAssetId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "mediaAssetId must be a valid UUID."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    optionalNullableString(
      "badgeText",
      50,
      "Badge text"
    ),
  
    optionalNullableString(
      "badgeColor",
      30,
      "Badge color"
    ),
  
    body("displayOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .withMessage(
        "Display order must be zero or greater."
      )
      .toInt(),
  
    body("columnNumber")
      .optional()
      .isInt({
        min: 1,
        max: 12,
      })
      .withMessage(
        "Column number must be between 1 and 12."
      )
      .toInt(),
  
    body("openInNewTab")
      .optional()
      .isBoolean()
      .withMessage(
        "openInNewTab must be true or false."
      )
      .toBoolean(),
  
    body("desktopVisible")
      .optional()
      .isBoolean()
      .withMessage(
        "desktopVisible must be true or false."
      )
      .toBoolean(),
  
    body("mobileVisible")
      .optional()
      .isBoolean()
      .withMessage(
        "mobileVisible must be true or false."
      )
      .toBoolean(),
  
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage(
        "isFeatured must be true or false."
      )
      .toBoolean(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    body("settings")
      .optional()
      .isObject()
      .withMessage(
        "Settings must be an object."
      ),
  ];
  
  exports.reorderNavigationItemsValidation = [
    param("menuId")
      .isUUID()
      .withMessage(
        "A valid navigation menu ID is required."
      ),
  
    body("items")
      .isArray({
        min: 1,
      })
      .withMessage(
        "At least one navigation item is required."
      ),
  
    body("items.*.id")
      .isUUID()
      .withMessage(
        "Every navigation item must have a valid ID."
      ),
  
    body("items.*.parentId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "Every parentId must be a valid UUID or null."
      ),
  
    body("items.*.displayOrder")
      .isInt({
        min: 0,
      })
      .withMessage(
        "Every display order must be zero or greater."
      )
      .toInt(),
  
    body("items.*.columnNumber")
      .optional()
      .isInt({
        min: 1,
        max: 12,
      })
      .withMessage(
        "Every column number must be between 1 and 12."
      )
      .toInt(),
  ];