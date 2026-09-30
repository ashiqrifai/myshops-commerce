const {
    body,
    param,
    query,
  } = require("express-validator");

  exports.profileIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid kiosk profile ID is required."
      ),
  ];

  exports.listProfilesValidation = [
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),

    query("search")
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage(
        "Search cannot exceed 150 characters."
      ),
  ];

  exports.createProfileValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Profile name is required."
      )
      .isLength({ max: 150 }),

    body("code")
      .trim()
      .notEmpty()
      .withMessage(
        "Profile code is required."
      )
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Profile code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({ max: 100 }),

    body("inventoryLocationId")
      .isUUID()
      .withMessage(
        "A valid inventory location is required."
      ),

    body("sourceCmsPageId")
      .isUUID()
      .withMessage(
        "A valid kiosk CMS template page ID is required."
      ),

    body("description")
      .optional({ nullable: true })
      .isString(),

    body("settings")
      .optional()
      .isObject()
      .withMessage(
        "Settings must be an object."
      ),

    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage(
        "isDefault must be true or false."
      ),


  ];

  exports.updateProfileValidation = [
    ...exports.profileIdValidation,

    body("name")
      .optional()
      .trim()
      .notEmpty()
      .isLength({ max: 150 }),

    body("code")
      .optional()
      .trim()
      .notEmpty()
      .matches(/^[A-Za-z0-9_-]+$/)
      .isLength({ max: 100 }),

    body("inventoryLocationId")
      .optional()
      .isUUID()
      .withMessage(
        "A valid inventory location is required."
      ),

    body("description")
      .optional({ nullable: true })
      .isString(),

    body("settings")
      .optional()
      .isObject(),

    body("isDefault")
      .optional()
      .isBoolean(),

    body("isActive")
      .optional()
      .isBoolean(),
  ];

  exports.assignPageValidation = [
    ...exports.profileIdValidation,

    body("pageType")
      .isIn([
        "HOME",
        "OFFERS",
        "WELCOME",
        "IDLE",
        "CUSTOM",
      ])
      .withMessage(
        "Invalid kiosk page type."
      ),

    body("cmsPageId")
      .isUUID()
      .withMessage(
        "A valid CMS page ID is required."
      ),
  ];

  exports.createDedicatedHomeValidation = [
    ...exports.profileIdValidation,

    body("sourceCmsPageId")
      .isUUID()
      .withMessage(
        "A valid source CMS page ID is required."
      ),
  ];
