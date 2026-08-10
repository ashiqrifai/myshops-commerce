const {
  body,
  query,
} = require(
  "express-validator"
);

/*
|--------------------------------------------------------------------------
| Quote Item Validation
|--------------------------------------------------------------------------
*/

const quoteItemValidation = [
  body("productVariantId")
    .trim()
    .notEmpty()
    .isUUID(),

  body("quantity")
    .optional()
    .isFloat({
      min: 1,
    })
    .toFloat(),

  body("priceListId")
    .optional({
      nullable: true,
    })
    .isUUID(),

  body("effectiveDate")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .toDate(),

  body("includeInactive")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("couponCodes")
    .optional()
    .isArray(),
];

/*
|--------------------------------------------------------------------------
| Quote Cart Validation
|--------------------------------------------------------------------------
*/

const quoteCartValidation = [
  body("items")
    .isArray({
      min: 1,
    }),

  body(
    "items.*.productVariantId"
  )
    .trim()
    .notEmpty()
    .isUUID(),

  body(
    "items.*.quantity"
  )
    .optional()
    .isFloat({
      min: 1,
    })
    .toFloat(),

  body("effectiveDate")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .toDate(),

  body("couponCodes")
    .optional()
    .isArray(),
];

/*
|--------------------------------------------------------------------------
| Price Matrix Validation
|--------------------------------------------------------------------------
*/

const priceMatrixValidation = [
  query("productId")
    .trim()
    .notEmpty()
    .withMessage(
      "Product ID is required."
    )
    .isUUID()
    .withMessage(
      "Product ID must be a valid UUID."
    ),

  query("quantity")
    .optional()
    .isFloat({
      min: 1,
    })
    .withMessage(
      "Quantity must be at least 1."
    )
    .toFloat(),

  query("effectiveDate")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .withMessage(
      "Effective date must be a valid ISO date."
    )
    .toDate(),

  query("currencyCode")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      min: 3,
      max: 3,
    })
    .withMessage(
      "Currency code must contain exactly 3 characters."
    )
    .toUpperCase(),

  query("channelCode")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      min: 1,
      max: 50,
    })
    .withMessage(
      "Channel code must not exceed 50 characters."
    )
    .toUpperCase(),

  query("includeInactive")
    .optional()
    .isBoolean()
    .withMessage(
      "Include inactive must be true or false."
    )
    .toBoolean(),
];

module.exports = {
  quoteItemValidation,
  quoteCartValidation,
  priceMatrixValidation,
};