const { body, param, query } = require("express-validator");

exports.listInventoryValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 200 })
    .toInt(),
  query("inventoryLocationId").optional().isUUID(),
  query("productVariantId").optional().isUUID(),
  query("productId").optional().isUUID(),
  query("search").optional().trim().isLength({ max: 300 }),
  query("onlyAvailable").optional().isBoolean().toBoolean(),
];

exports.variantAvailabilityValidation = [
  param("variantId")
    .isUUID()
    .withMessage("A valid product variant ID is required."),
];

exports.upsertBalanceValidation = [
  body("inventoryLocationId").isUUID(),
  body("productVariantId").isUUID(),
  body("quantityOnHand").isFloat({ min: 0 }).toFloat(),
  body("quantityReserved")
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
];

exports.adjustOnHandValidation = [
  body("inventoryLocationId").isUUID(),
  body("productVariantId").isUUID(),
  body("adjustment").isFloat().toFloat(),
  body("reason")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),
];
