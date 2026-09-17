const { body, param, query } = require("express-validator");
const {
  LOCATION_TYPES,
} = require("./inventoryLocation.constants");

exports.locationIdValidation = [
  param("id")
    .isUUID()
    .withMessage("A valid inventory location ID is required."),
];

exports.listLocationsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 200 })
    .toInt(),
  query("search").optional().trim().isLength({ max: 250 }),
  query("locationType").optional().isIn(LOCATION_TYPES),
  query("isActive").optional().isBoolean().toBoolean(),
  query("isDeliveryEnabled").optional().isBoolean().toBoolean(),
  query("isPickupEnabled").optional().isBoolean().toBoolean(),
  query("sortBy")
    .optional()
    .isIn([
      "name",
      "code",
      "locationType",
      "emirate",
      "city",
      "area",
      "sortOrder",
      "isActive",
      "createdAt",
      "updatedAt",
    ]),
  query("sortDirection").optional().isIn(["ASC", "DESC"]),
];

const optionalFields = [
  body("code")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),
  body("locationType").optional().isIn(LOCATION_TYPES),
  body("countryCode").optional().trim().isLength({ max: 10 }),
  body("country").optional().trim().isLength({ max: 150 }),
  body("emirate")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),
  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 }),
  body("area")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 }),
  body("addressLine1")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),
  body("addressLine2")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),
  body("landmark")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 250 }),
  body("latitude")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .toFloat(),
  body("longitude")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .toFloat(),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 }),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail(),
  body("isDeliveryEnabled").optional().isBoolean().toBoolean(),
  body("isPickupEnabled").optional().isBoolean().toBoolean(),
  body("pickupLeadTimeMinutes")
    .optional()
    .isInt({ min: 0, max: 10080 })
    .toInt(),
  body("pickupInstructions").optional({ nullable: true }).isString(),
  body("isActive").optional().isBoolean().toBoolean(),
  body("sortOrder").optional().isInt({ min: 0 }).toInt(),
];

exports.createLocationValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Location name is required.")
    .isLength({ max: 250 }),
  ...optionalFields,
];

exports.updateLocationValidation = [
  ...exports.locationIdValidation,
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 250 }),
  ...optionalFields,
];

exports.changeLocationStatusValidation = [
  ...exports.locationIdValidation,
  body("isActive").isBoolean().toBoolean(),
];
