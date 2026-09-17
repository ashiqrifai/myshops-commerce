const { body } = require("express-validator");

const executeInventoryImportValidation = [
  body("rows")
    .isArray({ min: 1, max: 10000 })
    .withMessage(
      "Rows must contain between 1 and 10,000 stock records."
    ),

  body("rows.*.rowNumber")
    .optional()
    .isInt({ min: 1 })
    .toInt(),

  body("rows.*.locationCode")
    .trim()
    .notEmpty()
    .withMessage("Location code is required.")
    .isLength({ max: 100 })
    .toUpperCase(),

  body("rows.*.variantSku")
    .trim()
    .notEmpty()
    .withMessage("Variant SKU is required.")
    .isLength({ max: 180 })
    .toUpperCase(),

  body("rows.*.quantityOnHand")
    .isFloat({ min: 0 })
    .withMessage(
      "On-hand quantity must be zero or greater."
    )
    .toFloat(),

  body("rows.*.quantityReserved")
    .isFloat({ min: 0 })
    .withMessage(
      "Reserved quantity must be zero or greater."
    )
    .toFloat(),
];

module.exports = {
  executeInventoryImportValidation,
};
