const {
    body,
  } = require("express-validator");
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Single Price
  |--------------------------------------------------------------------------
  */
  
  const resolvePriceValidation = [
    body("productVariantId")
      .trim()
      .notEmpty()
      .withMessage(
        "Product variant ID is required."
      )
      .bail()
      .isUUID()
      .withMessage(
        "Product variant ID must be a valid UUID."
      ),
  
    body("priceListId")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    body("channelCode")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 1,
        max: 100,
      })
      .withMessage(
        "Channel code must be between 1 and 100 characters."
      ),
  
    body("currencyCode")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 3,
        max: 3,
      })
      .withMessage(
        "Currency code must be exactly 3 characters."
      )
      .customSanitizer((value) =>
        String(value)
          .trim()
          .toUpperCase()
      ),
  
    body("quantity")
      .optional()
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Quantity must be greater than or equal to 1."
      )
      .toFloat(),
  
    body("effectiveDate")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Effective date must be a valid ISO 8601 date."
      )
      .toDate(),
  
    body("includeInactive")
      .optional()
      .isBoolean()
      .withMessage(
        "includeInactive must be true or false."
      )
      .toBoolean(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Multiple Prices
  |--------------------------------------------------------------------------
  */
  
  const resolvePricesValidation = [
    body("items")
      .isArray({
        min: 1,
      })
      .withMessage(
        "At least one pricing item is required."
      ),
  
    body("items.*.productVariantId")
      .trim()
      .notEmpty()
      .withMessage(
        "Product variant ID is required."
      )
      .bail()
      .isUUID()
      .withMessage(
        "Product variant ID must be a valid UUID."
      ),
  
    body("items.*.priceListId")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    body("items.*.channelCode")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 1,
        max: 100,
      })
      .withMessage(
        "Channel code must be between 1 and 100 characters."
      ),
  
    body("items.*.currencyCode")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 3,
        max: 3,
      })
      .withMessage(
        "Currency code must be exactly 3 characters."
      )
      .customSanitizer((value) =>
        String(value)
          .trim()
          .toUpperCase()
      ),
  
    body("items.*.quantity")
      .optional()
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Quantity must be greater than or equal to 1."
      )
      .toFloat(),
  
    body("items.*.effectiveDate")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Effective date must be a valid ISO 8601 date."
      )
      .toDate(),
  
    body("priceListId")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    body("channelCode")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 1,
        max: 100,
      })
      .withMessage(
        "Channel code must be between 1 and 100 characters."
      ),
  
    body("currencyCode")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 3,
        max: 3,
      })
      .withMessage(
        "Currency code must be exactly 3 characters."
      )
      .customSanitizer((value) =>
        String(value)
          .trim()
          .toUpperCase()
      ),
  
    body("effectiveDate")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Effective date must be a valid ISO 8601 date."
      )
      .toDate(),
  
    body("includeInactive")
      .optional()
      .isBoolean()
      .withMessage(
        "includeInactive must be true or false."
      )
      .toBoolean(),
  ];
  
  module.exports = {
    resolvePriceValidation,
    resolvePricesValidation,
  };