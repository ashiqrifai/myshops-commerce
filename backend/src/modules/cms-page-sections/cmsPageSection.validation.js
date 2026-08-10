const {
    body,
    param,
  } = require("express-validator");
  
  exports.cmsPageIdValidation = [
    param("pageId")
      .isUUID()
      .withMessage("A valid CMS page ID is required."),
  ];
  
  exports.cmsPageSectionIdValidation = [
    param("pageId")
      .isUUID()
      .withMessage("A valid CMS page ID is required."),
  
    param("sectionId")
      .isUUID()
      .withMessage("A valid CMS page section ID is required."),
  ];
  
  exports.createCmsPageSectionValidation = [
    ...exports.cmsPageIdValidation,
  
    body("sectionTypeId")
      .isUUID()
      .withMessage("A valid section type ID is required."),
  
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 180 })
      .withMessage(
        "Section name must contain between 1 and 180 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Section code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({ max: 120 })
      .withMessage(
        "Section code cannot exceed 120 characters."
      ),
  
    body("settings")
      .optional()
      .isObject()
      .withMessage("Section settings must be an object."),
  
    body("content")
      .optional()
      .isObject()
      .withMessage("Section content must be an object."),
  
    body("visibility")
      .optional()
      .isObject()
      .withMessage("Section visibility must be an object."),
  
    body("visibility.desktop")
      .optional()
      .isBoolean()
      .withMessage("Desktop visibility must be true or false."),
  
    body("visibility.tablet")
      .optional()
      .isBoolean()
      .withMessage("Tablet visibility must be true or false."),
  
    body("visibility.mobile")
      .optional()
      .isBoolean()
      .withMessage("Mobile visibility must be true or false."),
  
    body("visibility.kiosk")
      .optional()
      .isBoolean()
      .withMessage("Kiosk visibility must be true or false."),
  
    body("publishStartAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("Publish start date must be valid."),
  
    body("publishEndAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("Publish end date must be valid."),
  
    body("isEnabled")
      .optional()
      .isBoolean()
      .withMessage("isEnabled must be true or false."),
  ];
  
  exports.updateCmsPageSectionValidation = [
    ...exports.cmsPageSectionIdValidation,
  
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 180 })
      .withMessage(
        "Section name must contain between 1 and 180 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Section code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({ max: 120 })
      .withMessage(
        "Section code cannot exceed 120 characters."
      ),
  
    body("settings")
      .optional()
      .isObject()
      .withMessage("Section settings must be an object."),
  
    body("content")
      .optional()
      .isObject()
      .withMessage("Section content must be an object."),
  
    body("visibility")
      .optional()
      .isObject()
      .withMessage("Section visibility must be an object."),
  
    body("visibility.desktop")
      .optional()
      .isBoolean()
      .withMessage("Desktop visibility must be true or false."),
  
    body("visibility.tablet")
      .optional()
      .isBoolean()
      .withMessage("Tablet visibility must be true or false."),
  
    body("visibility.mobile")
      .optional()
      .isBoolean()
      .withMessage("Mobile visibility must be true or false."),
  
    body("visibility.kiosk")
      .optional()
      .isBoolean()
      .withMessage("Kiosk visibility must be true or false."),
  
    body("publishStartAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("Publish start date must be valid."),
  
    body("publishEndAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("Publish end date must be valid."),
  
    body("isEnabled")
      .optional()
      .isBoolean()
      .withMessage("isEnabled must be true or false."),
  ];
  
  exports.changeCmsPageSectionEnabledValidation = [
    ...exports.cmsPageSectionIdValidation,
  
    body("isEnabled")
      .isBoolean()
      .withMessage("isEnabled must be true or false."),
  ];
  
  exports.reorderCmsPageSectionsValidation = [
    ...exports.cmsPageIdValidation,
  
    body("sections")
      .isArray({ min: 1, max: 200 })
      .withMessage(
        "Sections must be an array containing between 1 and 200 records."
      ),
  
    body("sections.*.id")
      .isUUID()
      .withMessage("Each section must contain a valid ID."),
  
    body("sections.*.displayOrder")
      .isInt({ min: 1, max: 10000 })
      .withMessage(
        "Each section must contain a valid display order."
      )
      .toInt(),
  ];