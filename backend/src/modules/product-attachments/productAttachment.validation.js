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

const RELATIONSHIP_TYPES = [
  "ACCESSORY",
  "UPSELL",
  "CROSS_SELL",
  "ADD_ON",
  "BUNDLE_SUGGESTION",
  "COMPATIBLE_PRODUCT",
];

const DISPLAY_LOCATIONS = [
  "PRODUCT_DETAIL",
  "ADD_TO_CART",
  "CART",
  "CHECKOUT",
  "ALL",
];

exports.productAttachmentRuleIdValidation = [
  param(
    "id"
  )
    .isUUID()
    .withMessage(
      "A valid product attachment rule ID is required."
    ),
];

exports.listProductAttachmentRulesValidation = [
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
    "relationshipType"
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
      RELATIONSHIP_TYPES
    )
    .withMessage(
      "Invalid relationship type."
    ),

  query(
    "displayLocation"
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
      DISPLAY_LOCATIONS
    )
    .withMessage(
      "Invalid display location."
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
    "sortBy"
  )
    .optional()
    .isIn([
      "name",
      "code",
      "scopeType",
      "relationshipType",
      "displayLocation",
      "priority",
      "isActive",
      "createdAt",
      "updatedAt",
    ])
    .withMessage(
      "Invalid product attachment sort field."
    ),

  query(
    "sortDirection"
  )
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

const optionalRuleFields = [
  body(
    "code"
  )
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
      "Rule code cannot exceed 100 characters."
    ),

  body(
    "relationshipType"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      RELATIONSHIP_TYPES
    )
    .withMessage(
      "Invalid relationship type."
    ),

  body(
    "displayLocation"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      DISPLAY_LOCATIONS
    )
    .withMessage(
      "Invalid display location."
    ),

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
    "isActive"
  )
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),

  body(
    "items"
  )
    .optional()
    .isArray({
      min:
        1,
    })
    .withMessage(
      "At least one suggested product is required."
    ),

  body(
    "items.*.attachmentProductId"
  )
    .isUUID()
    .withMessage(
      "Each suggested product must have a valid product ID."
    ),

  body(
    "items.*.sortOrder"
  )
    .optional()
    .isInt({
      min:
        0,
    })
    .withMessage(
      "Suggested product sort order must be zero or greater."
    )
    .toInt(),

  body(
    "items.*.minimumQuantity"
  )
    .optional()
    .isInt({
      min:
        1,
    })
    .withMessage(
      "Minimum quantity must be at least 1."
    )
    .toInt(),

  body(
    "items.*.maximumQuantity"
  )
    .optional({
      nullable:
        true,
    })
    .isInt({
      min:
        1,
    })
    .withMessage(
      "Maximum quantity must be at least 1."
    )
    .toInt(),

  body(
    "items.*.isActive"
  )
    .optional()
    .isBoolean()
    .withMessage(
      "Suggested product isActive must be true or false."
    )
    .toBoolean(),

  body()
    .custom(
      (
        value
      ) => {
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

        if (
          Array.isArray(
            value.items
          )
        ) {
          const ids =
            value.items
              .map(
                (
                  item
                ) =>
                  item
                    .attachmentProductId
              )
              .filter(
                Boolean
              );

          if (
            new Set(
              ids
            ).size !==
            ids.length
          ) {
            throw new Error(
              "The same suggested product cannot be added more than once."
            );
          }

          for (
            const item of
            value.items
          ) {
            if (
              item
                .maximumQuantity !==
                undefined &&
              item
                .maximumQuantity !==
                null &&
              item
                .minimumQuantity !==
                undefined &&
              Number(
                item
                  .maximumQuantity
              ) <
                Number(
                  item
                    .minimumQuantity
                )
            ) {
              throw new Error(
                "Maximum quantity cannot be less than minimum quantity."
              );
            }
          }
        }

        return true;
      }
    ),
];

exports.createProductAttachmentRuleValidation = [
  body(
    "name"
  )
    .trim()
    .notEmpty()
    .withMessage(
      "Rule name is required."
    )
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Rule name cannot exceed 250 characters."
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
      "A valid rule target ID is required."
    ),

  body(
    "items"
  )
    .isArray({
      min:
        1,
    })
    .withMessage(
      "At least one suggested product is required."
    ),

  ...optionalRuleFields,
];

exports.updateProductAttachmentRuleValidation = [
  ...exports
    .productAttachmentRuleIdValidation,

  body(
    "name"
  )
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Rule name cannot be empty."
    )
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Rule name cannot exceed 250 characters."
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
      "Rule target ID must be a valid UUID."
    ),

  ...optionalRuleFields,
];

exports.changeProductAttachmentRuleStatusValidation = [
  ...exports
    .productAttachmentRuleIdValidation,

  body(
    "isActive"
  )
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),
];
