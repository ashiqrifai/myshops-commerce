const {
  body,
  param,
  query,
} = require(
  "express-validator"
);

exports.brandIdValidation = [
  param("id")
    .isUUID()
    .withMessage(
      "A valid brand ID is required."
    ),
];

exports.listBrandsValidation = [
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

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage(
      "Search cannot exceed 250 characters."
    ),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),

  query("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false."
    )
    .toBoolean(),

  query("sortBy")
    .optional()
    .isIn([
      "name",
      "code",
      "slug",
      "countryOfOrigin",
      "sortOrder",
      "isActive",
      "isFeatured",
      "createdAt",
      "updatedAt",
    ])
    .withMessage(
      "Invalid brand sort field."
    ),

  query("sortDirection")
    .optional()
    .isIn([
      "ASC",
      "DESC",
    ])
    .withMessage(
      "Sort direction must be ASC or DESC."
    ),
];

const optionalBrandFields = [
  body("code")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Brand code cannot exceed 100 characters."
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
      "Brand slug cannot exceed 250 characters."
    ),

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Description must be valid text."
    ),

  body("logoAssetId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage(
      "Logo asset ID must be a valid UUID."
    ),

  body("bannerAssetId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage(
      "Banner asset ID must be a valid UUID."
    ),

  body("websiteUrl")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isURL({
      protocols: [
        "http",
        "https",
      ],
      require_protocol:
        true,
    })
    .withMessage(
      "Website URL must be a valid HTTP or HTTPS URL."
    )
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Website URL cannot exceed 1000 characters."
    ),

  body("countryOfOrigin")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage(
      "Country of origin cannot exceed 150 characters."
    ),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false."
    )
    .toBoolean(),

  body("sortOrder")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage(
      "Sort order must be zero or greater."
    )
    .toInt(),

  body("metaTitle")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage(
      "Meta title cannot exceed 250 characters."
    ),

  body("metaDescription")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Meta description cannot exceed 500 characters."
    ),

  body("metaKeywords")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Meta keywords must be valid text."
    ),
];

exports.createBrandValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage(
      "Brand name is required."
    )
    .isLength({
      max: 250,
    })
    .withMessage(
      "Brand name cannot exceed 250 characters."
    ),

  ...optionalBrandFields,
];

exports.updateBrandValidation = [
  ...exports.brandIdValidation,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Brand name cannot be empty."
    )
    .isLength({
      max: 250,
    })
    .withMessage(
      "Brand name cannot exceed 250 characters."
    ),

  ...optionalBrandFields,
];

exports.changeBrandStatusValidation = [
  ...exports.brandIdValidation,

  body("isActive")
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),
];
