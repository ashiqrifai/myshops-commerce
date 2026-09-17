const {
  body,
  param,
  query,
} = require(
  "express-validator"
);

const SCOPE_TYPES = [
  "PRODUCT",
  "BRAND",
  "CATEGORY",
];

const PRICING_METHODS = [
  "PERCENTAGE",
  "FIXED",
];

exports.protectionAssignmentIdValidation = [
  param(
    "id"
  )
    .isUUID()
    .withMessage(
      "A valid protection assignment ID is required."
    ),
];

exports.listProtectionAssignmentsValidation = [
  query(
    "page"
  )
    .optional()
    .isInt({
      min:
        1,
    })
    .withMessage(
      "Page must be at least 1."
    )
    .toInt(),

  query(
    "pageSize"
  )
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

  query(
    "schemeId"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .isUUID()
    .withMessage(
      "Scheme ID must be a valid UUID."
    ),

  query(
    "scopeType"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .trim()
    .toUpperCase()
    .isIn(
      SCOPE_TYPES
    )
    .withMessage(
      "Scope type must be PRODUCT, BRAND or CATEGORY."
    ),

  query(
    "scopeId"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .isUUID()
    .withMessage(
      "Scope ID must be a valid UUID."
    ),

  query(
    "isActive"
  )
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),

  query(
    "search"
  )
    .optional()
    .trim()
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Search cannot exceed 250 characters."
    ),
];

const optionalFields = [
  body(
    "pricingMethod"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .trim()
    .toUpperCase()
    .isIn(
      PRICING_METHODS
    )
    .withMessage(
      "Pricing method must be PERCENTAGE or FIXED."
    ),

  body(
    "percentage"
  )
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

  body(
    "fixedAmount"
  )
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

  body(
    "minimumProductAmount"
  )
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

  body(
    "maximumProductAmount"
  )
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

  body(
    "effectiveFrom"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .isISO8601()
    .withMessage(
      "Effective from must be a valid ISO date."
    )
    .toDate(),

  body(
    "effectiveUntil"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .isISO8601()
    .withMessage(
      "Effective until must be a valid ISO date."
    )
    .toDate(),

  body(
    "priority"
  )
    .optional()
    .isInt({
      min:
        0,
    })
    .withMessage(
      "Priority must be zero or greater."
    )
    .toInt(),

  body(
    "isActive"
  )
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
          value
            .minimumProductAmount !==
            undefined &&
          value
            .minimumProductAmount !==
            null &&
          value
            .maximumProductAmount !==
            undefined &&
          value
            .maximumProductAmount !==
            null &&
          Number(
            value
              .maximumProductAmount
          ) <
            Number(
              value
                .minimumProductAmount
            )
        ) {
          throw new Error(
            "Maximum product amount cannot be less than minimum product amount."
          );
        }

        if (
          value
            .effectiveFrom &&
          value
            .effectiveUntil &&
          new Date(
            value
              .effectiveUntil
          ) <
            new Date(
              value
                .effectiveFrom
            )
        ) {
          throw new Error(
            "Effective until cannot be earlier than effective from."
          );
        }

        const method =
          value
            .pricingMethod
            ? String(
                value
                  .pricingMethod
              )
                .trim()
                .toUpperCase()
            : null;

        if (
          method ===
            "PERCENTAGE" &&
          (
            value
              .percentage ===
              undefined ||
            value
              .percentage ===
              null
          )
        ) {
          throw new Error(
            "Percentage is required for a PERCENTAGE override."
          );
        }

        if (
          method ===
            "FIXED" &&
          (
            value
              .fixedAmount ===
              undefined ||
            value
              .fixedAmount ===
              null
          )
        ) {
          throw new Error(
            "Fixed amount is required for a FIXED override."
          );
        }

        return true;
      }
    ),
];

exports.createProtectionAssignmentValidation = [
  body(
    "schemeId"
  )
    .isUUID()
    .withMessage(
      "A valid protection scheme ID is required."
    ),

  body(
    "scopeType"
  )
    .trim()
    .toUpperCase()
    .isIn(
      SCOPE_TYPES
    )
    .withMessage(
      "Scope type must be PRODUCT, BRAND or CATEGORY."
    ),

  body(
    "scopeId"
  )
    .isUUID()
    .withMessage(
      "A valid assignment target ID is required."
    ),

  ...optionalFields,
];

exports.updateProtectionAssignmentValidation = [
  ...exports
    .protectionAssignmentIdValidation,

  body(
    "schemeId"
  )
    .optional()
    .isUUID()
    .withMessage(
      "Scheme ID must be a valid UUID."
    ),

  body(
    "scopeType"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      SCOPE_TYPES
    )
    .withMessage(
      "Scope type must be PRODUCT, BRAND or CATEGORY."
    ),

  body(
    "scopeId"
  )
    .optional()
    .isUUID()
    .withMessage(
      "Scope ID must be a valid UUID."
    ),

  ...optionalFields,
];

exports.changeProtectionAssignmentStatusValidation = [
  ...exports
    .protectionAssignmentIdValidation,

  body(
    "isActive"
  )
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),
];
