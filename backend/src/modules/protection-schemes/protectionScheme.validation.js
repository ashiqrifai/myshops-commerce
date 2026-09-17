const {
  body,
  param,
  query,
} = require(
  "express-validator"
);

const SCHEME_TYPES = [
  "EXTENDED_WARRANTY",
  "DAMAGE_PROTECTION",
];

const PRICING_METHODS = [
  "PERCENTAGE",
  "FIXED",
];

exports.protectionSchemeIdValidation = [
  param("id")
    .isUUID()
    .withMessage(
      "A valid protection scheme ID is required."
    ),
];

exports.listProtectionSchemesValidation = [
  query("page")
    .optional()
    .isInt({
      min:
        1,
    })
    .withMessage(
      "Page must be at least 1."
    )
    .toInt(),

  query("pageSize")
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

  query("search")
    .optional()
    .trim()
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Search cannot exceed 250 characters."
    ),

  query("schemeType")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      SCHEME_TYPES
    )
    .withMessage(
      "Invalid protection scheme type."
    ),

  query("pricingMethod")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      PRICING_METHODS
    )
    .withMessage(
      "Invalid protection pricing method."
    ),

  query("currencyCode")
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        3,

      max:
        3,
    })
    .withMessage(
      "Currency code must contain exactly 3 characters."
    ),

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
      "schemeType",
      "durationMonths",
      "pricingMethod",
      "percentage",
      "fixedAmount",
      "minimumProductAmount",
      "maximumProductAmount",
      "currencyCode",
      "coverageStartMode",
      "sortOrder",
      "isActive",
      "createdAt",
      "updatedAt",
    ])
    .withMessage(
      "Invalid protection scheme sort field."
    ),

  query("sortDirection")
    .optional()
    .trim()
    .toUpperCase()
    .isIn([
      "ASC",
      "DESC",
    ])
    .withMessage(
      "Sort direction must be ASC or DESC."
    ),
];

const optionalFields = [
  body("code")
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .trim()
    .isLength({
      max:
        100,
    })
    .withMessage(
      "Protection scheme code cannot exceed 100 characters."
    ),

  body("description")
    .optional({
      nullable:
        true,
    })
    .isString()
    .withMessage(
      "Description must be valid text."
    ),

  body("durationMonths")
    .optional({
      nullable:
        true,
    })
    .isInt({
      min:
        1,

      max:
        240,
    })
    .withMessage(
      "Duration months must be between 1 and 240."
    )
    .toInt(),

  body("pricingMethod")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      PRICING_METHODS
    )
    .withMessage(
      "Pricing method must be PERCENTAGE or FIXED."
    ),

  body("percentage")
    .optional({
      nullable:
        true,
    })
    .isFloat({
      gt:
        0,

      lte:
        100,
    })
    .withMessage(
      "Percentage must be greater than 0 and not more than 100."
    )
    .toFloat(),

  body("fixedAmount")
    .optional({
      nullable:
        true,
    })
    .isFloat({
      min:
        0,
    })
    .withMessage(
      "Fixed amount cannot be negative."
    )
    .toFloat(),

  body("minimumProductAmount")
    .optional({
      nullable:
        true,
    })
    .isFloat({
      min:
        0,
    })
    .withMessage(
      "Minimum product amount cannot be negative."
    )
    .toFloat(),

  body("maximumProductAmount")
    .optional({
      nullable:
        true,
    })
    .isFloat({
      min:
        0,
    })
    .withMessage(
      "Maximum product amount cannot be negative."
    )
    .toFloat(),

  body("currencyCode")
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        3,

      max:
        3,
    })
    .withMessage(
      "Currency code must contain exactly 3 characters."
    ),

  body("coverageStartMode")
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        1,

      max:
        100,
    })
    .withMessage(
      "Coverage start mode cannot exceed 100 characters."
    ),

  body("termsAndConditions")
    .optional({
      nullable:
        true,
    })
    .isString()
    .withMessage(
      "Terms and conditions must be valid text."
    ),

  body("sortOrder")
    .optional()
    .isInt({
      min:
        0,
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

  body()
    .custom(
      (
        value
      ) => {
        if (
          value.minimumProductAmount !==
            undefined &&
          value.minimumProductAmount !==
            null &&
          value.maximumProductAmount !==
            undefined &&
          value.maximumProductAmount !==
            null &&
          Number(
            value.maximumProductAmount
          ) <
            Number(
              value.minimumProductAmount
            )
        ) {
          throw new Error(
            "Maximum product amount cannot be less than minimum product amount."
          );
        }

        return true;
      }
    ),
];

exports.createProtectionSchemeValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage(
      "Protection scheme name is required."
    )
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Protection scheme name cannot exceed 250 characters."
    ),

  body("schemeType")
    .trim()
    .toUpperCase()
    .isIn(
      SCHEME_TYPES
    )
    .withMessage(
      "Scheme type must be EXTENDED_WARRANTY or DAMAGE_PROTECTION."
    ),

  ...optionalFields,

  body()
    .custom(
      (
        value
      ) => {
        const method =
          String(
            value.pricingMethod ||
              "PERCENTAGE"
          )
            .trim()
            .toUpperCase();

        if (
          method ===
            "PERCENTAGE" &&
          (
            value.percentage ===
              undefined ||
            value.percentage ===
              null ||
            Number(
              value.percentage
            ) <=
              0
          )
        ) {
          throw new Error(
            "Percentage is required when pricing method is PERCENTAGE."
          );
        }

        if (
          method ===
            "FIXED" &&
          (
            value.fixedAmount ===
              undefined ||
            value.fixedAmount ===
              null ||
            Number(
              value.fixedAmount
            ) <
              0
          )
        ) {
          throw new Error(
            "Fixed amount is required when pricing method is FIXED."
          );
        }

        return true;
      }
    ),
];

exports.updateProtectionSchemeValidation = [
  ...exports
    .protectionSchemeIdValidation,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Protection scheme name cannot be empty."
    )
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Protection scheme name cannot exceed 250 characters."
    ),

  body("schemeType")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      SCHEME_TYPES
    )
    .withMessage(
      "Scheme type must be EXTENDED_WARRANTY or DAMAGE_PROTECTION."
    ),

  ...optionalFields,
];

exports.changeProtectionSchemeStatusValidation = [
  ...exports
    .protectionSchemeIdValidation,

  body("isActive")
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),
];
