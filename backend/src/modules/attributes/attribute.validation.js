const {
  body,
  param,
  query,
} = require("express-validator");

const {
  ATTRIBUTE_INPUT_TYPES,
  ATTRIBUTE_DATA_TYPES,
  SELECT_INPUT_TYPES,
} = require("./attribute.constants");

exports.attributeIdValidation = [
  param("id")
    .isUUID()
    .withMessage(
      "A valid attribute ID is required."
    ),
];

exports.attributeOptionIdValidation = [
  ...exports.attributeIdValidation,
  param("optionId")
    .isUUID()
    .withMessage(
      "A valid attribute option ID is required."
    ),
];

exports.listAttributesValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Page must be at least 1."
    )
    .toInt(),

  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage(
      "Page size must be between 1 and 200."
    )
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage(
      "Search cannot exceed 250 characters."
    ),

  query("inputType")
    .optional()
    .isIn(ATTRIBUTE_INPUT_TYPES)
    .withMessage(
      "Invalid attribute input type."
    ),

  query("dataType")
    .optional()
    .isIn(ATTRIBUTE_DATA_TYPES)
    .withMessage(
      "Invalid attribute data type."
    ),

  query("isVariantDefining")
    .optional()
    .isBoolean()
    .toBoolean(),

  query("isFilterable")
    .optional()
    .isBoolean()
    .toBoolean(),

  query("isActive")
    .optional()
    .isBoolean()
    .toBoolean(),

  query("categoryId")
    .optional()
    .isUUID()
    .withMessage(
      "categoryId must be a valid UUID."
    ),

  query("sortBy")
    .optional()
    .isIn([
      "name",
      "code",
      "inputType",
      "dataType",
      "displayOrder",
      "isVariantDefining",
      "isFilterable",
      "isActive",
      "createdAt",
      "updatedAt",
    ])
    .withMessage(
      "Invalid attribute sort field."
    ),

  query("sortDirection")
    .optional()
    .isIn(["ASC", "DESC"])
    .withMessage(
      "Sort direction must be ASC or DESC."
    ),
];

const optionalFields = [
  body("code")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 100 }),

  body("description")
    .optional({ nullable: true })
    .isString(),

  body("inputType")
    .optional()
    .isIn(ATTRIBUTE_INPUT_TYPES),

  body("dataType")
    .optional()
    .isIn(ATTRIBUTE_DATA_TYPES),

  body("unit")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 50 }),

  body("isVariantDefining")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("isFilterable")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("isSearchable")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("isComparable")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("isRequired")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("options")
    .optional()
    .isArray(),

  body("options.*.id")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID(),

  body("options.*.label")
    .trim()
    .notEmpty()
    .withMessage(
      "Option label is required."
    )
    .isLength({ max: 250 }),

  body("options.*.value")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 250 }),

  body("options.*.swatchValue")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 100 }),

  body("options.*.displayOrder")
    .optional()
    .isInt({ min: 0 })
    .toInt(),

  body("options.*.isActive")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments")
    .optional()
    .isArray(),

  body("categoryAssignments.*.categoryId")
    .isUUID()
    .withMessage(
      "Category assignment categoryId must be a valid UUID."
    ),

  body("categoryAssignments.*.isRequired")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments.*.isFilterable")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments.*.isVariantDefining")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments.*.displayOrder")
    .optional()
    .isInt({ min: 0 })
    .toInt(),

  body("categoryAssignments.*.isActive")
    .optional()
    .isBoolean()
    .toBoolean(),
];

exports.createAttributeValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage(
      "Attribute name is required."
    )
    .isLength({ max: 250 }),

  ...optionalFields,

  body().custom((payload) => {
    const inputType =
      payload.inputType || "TEXT";

    if (
      SELECT_INPUT_TYPES.includes(
        inputType
      ) &&
      (
        !Array.isArray(payload.options) ||
        payload.options.length === 0
      )
    ) {
      throw new Error(
        "Selectable attributes must contain at least one option."
      );
    }

    return true;
  }),
];

exports.updateAttributeValidation = [
  ...exports.attributeIdValidation,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 250 }),

  ...optionalFields,
];

exports.changeAttributeStatusValidation = [
  ...exports.attributeIdValidation,

  body("isActive")
    .isBoolean()
    .toBoolean(),
];

exports.optionBodyValidation = [
  ...exports.attributeIdValidation,

  body("label")
    .trim()
    .notEmpty()
    .withMessage(
      "Option label is required."
    )
    .isLength({ max: 250 }),

  body("value")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 250 }),

  body("swatchValue")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 100 }),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .toBoolean(),
];

exports.updateOptionValidation = [
  ...exports.attributeOptionIdValidation,

  body("label")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 250 }),

  body("value")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 250 }),

  body("swatchValue")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 100 }),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .toBoolean(),
];

exports.replaceCategoryAssignmentsValidation = [
  ...exports.attributeIdValidation,

  body("categoryAssignments")
    .isArray()
    .withMessage(
      "Category assignments must be an array."
    ),

  body("categoryAssignments.*.categoryId")
    .isUUID(),

  body("categoryAssignments.*.isRequired")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments.*.isFilterable")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments.*.isVariantDefining")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("categoryAssignments.*.displayOrder")
    .optional()
    .isInt({ min: 0 })
    .toInt(),

  body("categoryAssignments.*.isActive")
    .optional()
    .isBoolean()
    .toBoolean(),
];
