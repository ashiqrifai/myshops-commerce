const {
    param,
    query,
  } = require("express-validator");
  
  const {
    CMS_SECTION_TYPE_CATEGORIES,
    CMS_SECTION_CHANNELS,
  } = require("./cmsSectionType.constants");
  
  exports.listCmsSectionTypesValidation = [
    query("category")
      .optional()
      .isIn(CMS_SECTION_TYPE_CATEGORIES)
      .withMessage("Invalid section type category."),
  
    query("channel")
      .optional()
      .isIn(CMS_SECTION_CHANNELS)
      .withMessage("Invalid section type channel."),
  
    query("search")
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage(
        "Search text cannot exceed 150 characters."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false.")
      .toBoolean(),
  ];
  
  exports.cmsSectionTypeIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid section type ID is required."
      ),
  ];