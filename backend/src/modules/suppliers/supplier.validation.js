const { body, param, query } = require("express-validator");

exports.supplierIdValidation = [
  param("id")
    .isUUID()
    .withMessage("A valid supplier ID is required."),
];

exports.listSuppliersValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 200 })
    .toInt(),
  query("search").optional().trim().isLength({ max: 250 }),
  query("isActive").optional().isBoolean().toBoolean(),
  query("sortBy")
    .optional()
    .isIn([
      "name",
      "code",
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
  body("contactPerson")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 250 }),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail(),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 }),
  body("websiteUrl")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    }),
  body("notes").optional({ nullable: true }).isString(),
  body("isActive").optional().isBoolean().toBoolean(),
  body("sortOrder").optional().isInt({ min: 0 }).toInt(),
];

exports.createSupplierValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Supplier name is required.")
    .isLength({ max: 250 }),
  ...optionalFields,
];

exports.updateSupplierValidation = [
  ...exports.supplierIdValidation,
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 250 }),
  ...optionalFields,
];

exports.changeSupplierStatusValidation = [
  ...exports.supplierIdValidation,
  body("isActive").isBoolean().toBoolean(),
];
