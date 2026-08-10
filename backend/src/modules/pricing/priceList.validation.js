const {
    body,
    param,
    query,
  } = require("express-validator");
  
  const PRICE_LIST_TYPES = [
    "STANDARD",
    "RETAIL",
    "B2B",
    "WHOLESALE",
    "VIP",
    "EMPLOYEE",
    "PROMOTIONAL",
  ];
  
  const SUPPORTED_CURRENCIES = [
    "AED",
    "USD",
    "EUR",
    "GBP",
    "SAR",
    "QAR",
    "KWD",
    "OMR",
    "BHD",
  ];
  
  const SORTABLE_FIELDS = [
    "name",
    "code",
    "priceListType",
    "channelCode",
    "currencyCode",
    "priority",
    "isDefault",
    "isActive",
    "validFrom",
    "validUntil",
    "createdAt",
    "updatedAt",
  ];
  
  const normalizeUppercase = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }
  
    return String(value)
      .trim()
      .toUpperCase();
  };
  
  const validateDateRange = (
    validUntil,
    {
      req,
    }
  ) => {
    if (!validUntil) {
      return true;
    }
  
    const validFrom =
      req.body.validFrom;
  
    if (!validFrom) {
      return true;
    }
  
    const fromDate =
      new Date(validFrom);
  
    const untilDate =
      new Date(validUntil);
  
    if (
      Number.isNaN(
        fromDate.getTime()
      ) ||
      Number.isNaN(
        untilDate.getTime()
      )
    ) {
      return true;
    }
  
    if (
      untilDate.getTime() <
      fromDate.getTime()
    ) {
      throw new Error(
        "Valid until must be later than or equal to valid from."
      );
    }
  
    return true;
  };
  
  const priceListIdValidation = [
    param("id")
      .trim()
      .notEmpty()
      .withMessage(
        "Price list ID is required."
      )
      .bail()
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  ];
  
  const listPriceListsValidation = [
    query("page")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Page must be an integer greater than or equal to 1."
      )
      .toInt(),
  
    query("pageSize")
      .optional()
      .isInt({
        min: 1,
        max: 200,
      })
      .withMessage(
        "Page size must be between 1 and 200."
      )
      .toInt(),
  
    query("search")
      .optional({
        checkFalsy: true,
      })
      .trim()
      .isLength({
        max: 250,
      })
      .withMessage(
        "Search cannot exceed 250 characters."
      ),
  
    query("priceListType")
      .optional({
        checkFalsy: true,
      })
      .customSanitizer(
        normalizeUppercase
      )
      .isIn(
        PRICE_LIST_TYPES
      )
      .withMessage(
        `Price list type must be one of: ${PRICE_LIST_TYPES.join(
          ", "
        )}.`
      ),
  
    query("channelCode")
      .optional({
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 1,
        max: 100,
      })
      .withMessage(
        "Channel code must be between 1 and 100 characters."
      )
      .customSanitizer(
        normalizeUppercase
      ),
  
    query("currencyCode")
      .optional({
        checkFalsy: true,
      })
      .customSanitizer(
        normalizeUppercase
      )
      .isIn(
        SUPPORTED_CURRENCIES
      )
      .withMessage(
        `Currency code must be one of: ${SUPPORTED_CURRENCIES.join(
          ", "
        )}.`
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("isDefault")
      .optional()
      .isBoolean()
      .withMessage(
        "isDefault must be true or false."
      )
      .toBoolean(),
  
    query("sortBy")
      .optional({
        checkFalsy: true,
      })
      .isIn(
        SORTABLE_FIELDS
      )
      .withMessage(
        `sortBy must be one of: ${SORTABLE_FIELDS.join(
          ", "
        )}.`
      ),
  
    query("sortDirection")
      .optional({
        checkFalsy: true,
      })
      .customSanitizer(
        normalizeUppercase
      )
      .isIn([
        "ASC",
        "DESC",
      ])
      .withMessage(
        "Sort direction must be ASC or DESC."
      ),
  ];
  
  const createPriceListValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Price list name is required."
      )
      .bail()
      .isLength({
        min: 2,
        max: 250,
      })
      .withMessage(
        "Price list name must be between 2 and 250 characters."
      ),
  
    body("code")
      .optional({
        checkFalsy: true,
      })
      .trim()
      .isLength({
        min: 2,
        max: 100,
      })
      .withMessage(
        "Price list code must be between 2 and 100 characters."
      )
      .matches(
        /^[A-Za-z0-9 _-]+$/
      )
      .withMessage(
        "Price list code may contain only letters, numbers, spaces, underscores and hyphens."
      ),
  
    body("description")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 5000,
      })
      .withMessage(
        "Description cannot exceed 5,000 characters."
      ),
  
    body("priceListType")
      .optional()
      .customSanitizer(
        normalizeUppercase
      )
      .isIn(
        PRICE_LIST_TYPES
      )
      .withMessage(
        `Price list type must be one of: ${PRICE_LIST_TYPES.join(
          ", "
        )}.`
      ),
  
    body("channelCode")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Channel code cannot be empty."
      )
      .bail()
      .isLength({
        max: 100,
      })
      .withMessage(
        "Channel code cannot exceed 100 characters."
      )
      .matches(
        /^[A-Za-z0-9_-]+$/
      )
      .withMessage(
        "Channel code may contain only letters, numbers, underscores and hyphens."
      )
      .customSanitizer(
        normalizeUppercase
      ),
  
    body("currencyCode")
      .optional()
      .customSanitizer(
        normalizeUppercase
      )
      .isIn(
        SUPPORTED_CURRENCIES
      )
      .withMessage(
        `Currency code must be one of: ${SUPPORTED_CURRENCIES.join(
          ", "
        )}.`
      ),
  
    body("isTaxInclusive")
      .optional()
      .isBoolean()
      .withMessage(
        "isTaxInclusive must be true or false."
      )
      .toBoolean(),
  
    body("priority")
      .optional()
      .isInt({
        min: 0,
        max: 999999,
      })
      .withMessage(
        "Priority must be an integer between 0 and 999999."
      )
      .toInt(),
  
    body("validFrom")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Valid from must be a valid ISO 8601 date."
      )
      .toDate(),
  
    body("validUntil")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Valid until must be a valid ISO 8601 date."
      )
      .bail()
      .custom(
        validateDateRange
      )
      .toDate(),
  
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage(
        "isDefault must be true or false."
      )
      .toBoolean(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];
  
  const updatePriceListValidation = [
    ...priceListIdValidation,
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Price list name cannot be empty."
      )
      .bail()
      .isLength({
        min: 2,
        max: 250,
      })
      .withMessage(
        "Price list name must be between 2 and 250 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Price list code cannot be empty."
      )
      .bail()
      .isLength({
        min: 2,
        max: 100,
      })
      .withMessage(
        "Price list code must be between 2 and 100 characters."
      )
      .matches(
        /^[A-Za-z0-9 _-]+$/
      )
      .withMessage(
        "Price list code may contain only letters, numbers, spaces, underscores and hyphens."
      ),
  
    body("description")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 5000,
      })
      .withMessage(
        "Description cannot exceed 5,000 characters."
      ),
  
    body("priceListType")
      .optional()
      .customSanitizer(
        normalizeUppercase
      )
      .isIn(
        PRICE_LIST_TYPES
      )
      .withMessage(
        `Price list type must be one of: ${PRICE_LIST_TYPES.join(
          ", "
        )}.`
      ),
  
    body("channelCode")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Channel code cannot be empty."
      )
      .bail()
      .isLength({
        max: 100,
      })
      .withMessage(
        "Channel code cannot exceed 100 characters."
      )
      .matches(
        /^[A-Za-z0-9_-]+$/
      )
      .withMessage(
        "Channel code may contain only letters, numbers, underscores and hyphens."
      )
      .customSanitizer(
        normalizeUppercase
      ),
  
    body("currencyCode")
      .optional()
      .customSanitizer(
        normalizeUppercase
      )
      .isIn(
        SUPPORTED_CURRENCIES
      )
      .withMessage(
        `Currency code must be one of: ${SUPPORTED_CURRENCIES.join(
          ", "
        )}.`
      ),
  
    body("isTaxInclusive")
      .optional()
      .isBoolean()
      .withMessage(
        "isTaxInclusive must be true or false."
      )
      .toBoolean(),
  
    body("priority")
      .optional()
      .isInt({
        min: 0,
        max: 999999,
      })
      .withMessage(
        "Priority must be an integer between 0 and 999999."
      )
      .toInt(),
  
    body("validFrom")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Valid from must be a valid ISO 8601 date."
      )
      .toDate(),
  
    body("validUntil")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "Valid until must be a valid ISO 8601 date."
      )
      .bail()
      .custom(
        validateDateRange
      )
      .toDate(),
  
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage(
        "isDefault must be true or false."
      )
      .toBoolean(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    body()
      .custom((payload) => {
        const editableFields = [
          "name",
          "code",
          "description",
          "priceListType",
          "channelCode",
          "currencyCode",
          "isTaxInclusive",
          "priority",
          "validFrom",
          "validUntil",
          "isDefault",
          "isActive",
        ];
  
        const hasEditableField =
          editableFields.some(
            (field) =>
              Object.prototype
                .hasOwnProperty.call(
                  payload,
                  field
                )
          );
  
        if (!hasEditableField) {
          throw new Error(
            "At least one price list field must be provided."
          );
        }
  
        return true;
      }),
  ];
  
  const changePriceListStatusValidation = [
    ...priceListIdValidation,
  
    body("isActive")
      .exists({
        checkNull: true,
      })
      .withMessage(
        "isActive is required."
      )
      .bail()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];
  
  module.exports = {
    PRICE_LIST_TYPES,
    SUPPORTED_CURRENCIES,
    SORTABLE_FIELDS,
  
    priceListIdValidation,
    listPriceListsValidation,
    createPriceListValidation,
    updatePriceListValidation,
    changePriceListStatusValidation,
  };