const {
    body,
    param,
    query,
  } = require("express-validator");
  
  const {
    CMS_PAGE_TYPES,
    CMS_PAGE_CHANNELS,
    CMS_PAGE_STATUSES,
  } = require("./cmsPage.constants");
  
  const optionalNullableString = (
    field,
    maxLength,
    label
  ) =>
    body(field)
      .optional({ nullable: true })
      .trim()
      .isLength({ max: maxLength })
      .withMessage(
        `${label} cannot exceed ${maxLength} characters.`
      );
  
  exports.listCmsPagesValidation = [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be at least 1.")
      .toInt(),
  
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(
        "Page size must be between 1 and 100."
      )
      .toInt(),
  
    query("search")
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage(
        "Search cannot exceed 150 characters."
      ),
  
    query("pageType")
      .optional()
      .isIn(CMS_PAGE_TYPES)
      .withMessage("Invalid CMS page type."),
  
    query("channel")
      .optional()
      .isIn(CMS_PAGE_CHANNELS)
      .withMessage("Invalid CMS page channel."),
  
    query("status")
      .optional()
      .isIn(CMS_PAGE_STATUSES)
      .withMessage("Invalid CMS page status."),
  
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
        "name",
        "code",
        "slug",
        "pageType",
        "channel",
        "status",
        "createdAt",
        "updatedAt",
        "publishedAt",
      ])
      .withMessage("Invalid sort field."),
  
    query("sortDirection")
      .optional()
      .isIn(["ASC", "DESC"])
      .withMessage(
        "Sort direction must be ASC or DESC."
      ),
  ];
  
  exports.cmsPageIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid CMS page ID is required."
      ),
  ];
  
  exports.createCmsPageValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Page name is required.")
      .isLength({ max: 150 })
      .withMessage(
        "Page name cannot exceed 150 characters."
      ),
  
    body("code")
      .trim()
      .notEmpty()
      .withMessage("Page code is required.")
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Page code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({ max: 100 })
      .withMessage(
        "Page code cannot exceed 100 characters."
      ),
  
    body("slug")
      .trim()
      .notEmpty()
      .withMessage("Page slug is required.")
      .isLength({ max: 180 })
      .withMessage(
        "Page slug cannot exceed 180 characters."
      ),
  
    body("pageType")
      .isIn(CMS_PAGE_TYPES)
      .withMessage("Invalid CMS page type."),
  
    body("channel")
      .optional()
      .isIn(CMS_PAGE_CHANNELS)
      .withMessage("Invalid CMS page channel."),
  
    body("title")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 250 })
      .withMessage(
        "Title cannot exceed 250 characters."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    body("seoTitle")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 250 })
      .withMessage(
        "SEO title cannot exceed 250 characters."
      ),
  
    body("seoDescription")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "SEO description must be valid text."
      ),
  
    body("seoKeywords")
      .optional({ nullable: true })
      .isArray()
      .withMessage(
        "SEO keywords must be an array."
      ),
  
    body("layoutSettings")
      .optional({ nullable: true })
      .isObject()
      .withMessage(
        "Layout settings must be an object."
      ),
  
    body("publishStartAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage(
        "Publish start date must be valid."
      ),
  
    body("publishEndAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage(
        "Publish end date must be valid."
      ),
  
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage(
        "isDefault must be true or false."
      ),
  ];
  
  exports.updateCmsPageValidation = [
    ...exports.cmsPageIdValidation,
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Page name cannot be empty."
      )
      .isLength({ max: 150 })
      .withMessage(
        "Page name cannot exceed 150 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Page code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({ max: 100 })
      .withMessage(
        "Page code cannot exceed 100 characters."
      ),
  
    body("slug")
      .optional()
      .trim()
      .notEmpty()
      .isLength({ max: 180 })
      .withMessage(
        "Page slug cannot exceed 180 characters."
      ),
  
    body("pageType")
      .optional()
      .isIn(CMS_PAGE_TYPES)
      .withMessage("Invalid CMS page type."),
  
    body("channel")
      .optional()
      .isIn(CMS_PAGE_CHANNELS)
      .withMessage("Invalid CMS page channel."),
  
    optionalNullableString(
      "title",
      250,
      "Title"
    ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Description must be valid text."
      ),
  
    optionalNullableString(
      "seoTitle",
      250,
      "SEO title"
    ),
  
    body("seoDescription")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "SEO description must be valid text."
      ),
  
    body("seoKeywords")
      .optional({ nullable: true })
      .isArray()
      .withMessage(
        "SEO keywords must be an array."
      ),
  
    body("layoutSettings")
      .optional({ nullable: true })
      .isObject()
      .withMessage(
        "Layout settings must be an object."
      ),
  
    body("publishStartAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage(
        "Publish start date must be valid."
      ),
  
    body("publishEndAt")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage(
        "Publish end date must be valid."
      ),
  
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage(
        "isDefault must be true or false."
      ),
  ];
  
  exports.changeCmsPageStatusValidation = [
    ...exports.cmsPageIdValidation,
  
    body("status")
      .isIn(CMS_PAGE_STATUSES)
      .withMessage("Invalid CMS page status."),
  ];
  
  exports.changeCmsPageActiveValidation = [
    ...exports.cmsPageIdValidation,
  
    body("isActive")
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      ),
  ];