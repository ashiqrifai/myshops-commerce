const {
  body,
} = require(
  "express-validator"
);

/*
|--------------------------------------------------------------------------
| Preview Import Validation
|--------------------------------------------------------------------------
*/

const previewPricingImportValidation = [
  body("rows")
    .isArray({
      min:
        1,
      max:
        5000,
    })
    .withMessage(
      "Rows must contain between 1 and 5,000 pricing records."
    ),

  body("rows.*.rowNumber")
    .optional()
    .isInt({
      min:
        1,
    })
    .toInt(),

  body("rows.*.productSku")
    .optional({
      nullable:
        true,
    })
    .trim()
    .isLength({
      max:
        150,
    })
    .toUpperCase(),

  body("rows.*.variantSku")
    .trim()
    .notEmpty()
    .withMessage(
      "Variant SKU is required."
    )
    .isLength({
      max:
        180,
    })
    .toUpperCase(),

  body("rows.*.priceListCode")
    .trim()
    .notEmpty()
    .withMessage(
      "Price list code is required."
    )
    .isLength({
      max:
        100,
    })
    .toUpperCase(),

  body("rows.*.currencyCode")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .trim()
    .isLength({
      min:
        3,
      max:
        3,
    })
    .withMessage(
      "Currency code must contain exactly 3 characters."
    )
    .toUpperCase(),

  body("rows.*.regularPrice")
    .notEmpty()
    .withMessage(
      "Regular price is required."
    )
    .isFloat({
      min:
        0,
    })
    .withMessage(
      "Regular price must be zero or greater."
    )
    .toFloat(),

  body("rows.*.sellingPrice")
    .notEmpty()
    .withMessage(
      "Selling price is required."
    )
    .isFloat({
      min:
        0,
    })
    .withMessage(
      "Selling price must be zero or greater."
    )
    .toFloat(),

  body("rows.*.compareAtPrice")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isFloat({
      min:
        0,
    })
    .toFloat(),

  body("rows.*.costPrice")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isFloat({
      min:
        0,
    })
    .toFloat(),

  body("rows.*.minimumQuantity")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isFloat({
      min:
        1,
    })
    .withMessage(
      "Minimum quantity must be at least 1."
    )
    .toFloat(),

  body("rows.*.maximumQuantity")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isFloat({
      min:
        1,
    })
    .withMessage(
      "Maximum quantity must be at least 1."
    )
    .toFloat(),

  body("rows.*.validFrom")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isISO8601({
      strict:
        true,
    })
    .withMessage(
      "Valid From must be a valid ISO date."
    ),

  body("rows.*.validUntil")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isISO8601({
      strict:
        true,
    })
    .withMessage(
      "Valid Until must be a valid ISO date."
    ),

  body("rows.*.validTo")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isISO8601({
      strict:
        true,
    })
    .withMessage(
      "Valid To must be a valid ISO date."
    ),

  body("rows.*.priority")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .isInt({
      min:
        0,
    })
    .withMessage(
      "Priority must be a non-negative whole number."
    )
    .toInt(),

  body("rows.*.status")
    .optional({
      nullable:
        true,
      checkFalsy:
        true,
    })
    .trim()
    .toUpperCase()
    .isIn([
      "ACTIVE",
      "INACTIVE",
    ])
    .withMessage(
      "Status must be ACTIVE or INACTIVE."
    ),
];

const executePricingImportValidation =
  previewPricingImportValidation;

module.exports = {
  previewPricingImportValidation,
  executePricingImportValidation,
};