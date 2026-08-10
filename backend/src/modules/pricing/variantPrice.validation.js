const {
    body,
    param,
    query,
  } = require(
    "express-validator"
  );
  
  const SORTABLE_FIELDS = [
    "regularPrice",
    "sellingPrice",
    "compareAtPrice",
    "costPrice",
    "minimumQuantity",
    "maximumQuantity",
    "validFrom",
    "validUntil",
    "priority",
    "isActive",
    "createdAt",
    "updatedAt",
  ];
  
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
  
  const validateQuantityRange = (
    maximumQuantity,
    {
      req,
    }
  ) => {
    if (
      maximumQuantity ===
        undefined ||
      maximumQuantity ===
        null ||
      maximumQuantity ===
        ""
    ) {
      return true;
    }
  
    const minimumQuantity =
      req.body.minimumQuantity;
  
    if (
      minimumQuantity ===
        undefined ||
      minimumQuantity ===
        null ||
      minimumQuantity ===
        ""
    ) {
      return true;
    }
  
    if (
      Number(
        maximumQuantity
      ) <
      Number(
        minimumQuantity
      )
    ) {
      throw new Error(
        "Maximum quantity must be greater than or equal to minimum quantity."
      );
    }
  
    return true;
  };
  
  const validatePriceRelationship = (
    compareAtPrice,
    {
      req,
    }
  ) => {
    if (
      compareAtPrice ===
        undefined ||
      compareAtPrice ===
        null ||
      compareAtPrice ===
        ""
    ) {
      return true;
    }
  
    const sellingPrice =
      req.body.sellingPrice;
  
    if (
      sellingPrice ===
        undefined ||
      sellingPrice ===
        null ||
      sellingPrice ===
        ""
    ) {
      return true;
    }
  
    if (
      Number(
        sellingPrice
      ) >
      Number(
        compareAtPrice
      )
    ) {
      throw new Error(
        "Selling price cannot exceed compare-at price."
      );
    }
  
    return true;
  };
  
  /*
  |--------------------------------------------------------------------------
  | ID Validation
  |--------------------------------------------------------------------------
  */
  
  const variantPriceIdValidation = [
    param("id")
      .trim()
      .notEmpty()
      .withMessage(
        "Variant price ID is required."
      )
      .bail()
      .isUUID()
      .withMessage(
        "Variant price ID must be a valid UUID."
      ),
  ];
  
  const variantIdValidation = [
    param("variantId")
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
  ];
  
  const productIdValidation = [
    param("productId")
      .trim()
      .notEmpty()
      .withMessage(
        "Product ID is required."
      )
      .bail()
      .isUUID()
      .withMessage(
        "Product ID must be a valid UUID."
      ),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | List Validation
  |--------------------------------------------------------------------------
  */
  
  const listVariantPricesValidation = [
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
  
    query("productVariantId")
      .optional({
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Product variant ID must be a valid UUID."
      ),
  
    query("productId")
      .optional({
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Product ID must be a valid UUID."
      ),
  
    query("priceListId")
      .optional({
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("validOn")
      .optional({
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "validOn must be a valid ISO 8601 date."
      )
      .toDate(),
  
    query("quantity")
      .optional({
        checkFalsy: true,
      })
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Quantity must be greater than or equal to 1."
      )
      .toFloat(),
  
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
        (value) =>
          String(value)
            .trim()
            .toUpperCase()
      )
      .isIn([
        "ASC",
        "DESC",
      ])
      .withMessage(
        "Sort direction must be ASC or DESC."
      ),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Validation
  |--------------------------------------------------------------------------
  */
  
  const createVariantPriceValidation = [
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
  
    body("regularPrice")
      .exists({
        checkNull: true,
      })
      .withMessage(
        "Regular price is required."
      )
      .bail()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Regular price must be greater than or equal to 0."
      )
      .toFloat(),
  
    body("sellingPrice")
      .exists({
        checkNull: true,
      })
      .withMessage(
        "Selling price is required."
      )
      .bail()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Selling price must be greater than or equal to 0."
      )
      .toFloat(),
  
    body("compareAtPrice")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Compare-at price must be greater than or equal to 0."
      )
      .bail()
      .custom(
        validatePriceRelationship
      )
      .toFloat(),
  
    body("costPrice")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Cost price must be greater than or equal to 0."
      )
      .toFloat(),
  
    body("minimumQuantity")
      .optional()
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Minimum quantity must be greater than or equal to 1."
      )
      .toFloat(),
  
    body("maximumQuantity")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Maximum quantity must be greater than or equal to 1."
      )
      .bail()
      .custom(
        validateQuantityRange
      )
      .toFloat(),
  
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
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Update Validation
  |--------------------------------------------------------------------------
  */
  
  const updateVariantPriceValidation = [
    ...variantPriceIdValidation,
  
    body("productVariantId")
      .optional()
      .isUUID()
      .withMessage(
        "Product variant ID must be a valid UUID."
      ),
  
    body("priceListId")
      .optional()
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    body("regularPrice")
      .optional()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Regular price must be greater than or equal to 0."
      )
      .toFloat(),
  
    body("sellingPrice")
      .optional()
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Selling price must be greater than or equal to 0."
      )
      .toFloat(),
  
    body("compareAtPrice")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Compare-at price must be greater than or equal to 0."
      )
      .bail()
      .custom(
        validatePriceRelationship
      )
      .toFloat(),
  
    body("costPrice")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Cost price must be greater than or equal to 0."
      )
      .toFloat(),
  
    body("minimumQuantity")
      .optional()
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Minimum quantity must be greater than or equal to 1."
      )
      .toFloat(),
  
    body("maximumQuantity")
      .optional({
        nullable: true,
        checkFalsy: true,
      })
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Maximum quantity must be greater than or equal to 1."
      )
      .bail()
      .custom(
        validateQuantityRange
      )
      .toFloat(),
  
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
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    body().custom(
      (payload) => {
        const editableFields = [
          "productVariantId",
          "priceListId",
          "regularPrice",
          "sellingPrice",
          "compareAtPrice",
          "costPrice",
          "minimumQuantity",
          "maximumQuantity",
          "validFrom",
          "validUntil",
          "priority",
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
  
        if (
          !hasEditableField
        ) {
          throw new Error(
            "At least one variant price field must be provided."
          );
        }
  
        return true;
      }
    ),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Status Validation
  |--------------------------------------------------------------------------
  */
  
  const changeVariantPriceStatusValidation = [
    ...variantPriceIdValidation,
  
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
  
  /*
  |--------------------------------------------------------------------------
  | Variant/Product Pricing Query Validation
  |--------------------------------------------------------------------------
  */
  
  const getPricesByVariantValidation = [
    ...variantIdValidation,
  
    query("priceListId")
      .optional({
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("validOn")
      .optional({
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "validOn must be a valid ISO 8601 date."
      )
      .toDate(),
  
    query("quantity")
      .optional({
        checkFalsy: true,
      })
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Quantity must be greater than or equal to 1."
      )
      .toFloat(),
  ];
  
  const getPricesByProductValidation = [
    ...productIdValidation,
  
    query("priceListId")
      .optional({
        checkFalsy: true,
      })
      .isUUID()
      .withMessage(
        "Price list ID must be a valid UUID."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("validOn")
      .optional({
        checkFalsy: true,
      })
      .isISO8601()
      .withMessage(
        "validOn must be a valid ISO 8601 date."
      )
      .toDate(),
  
    query("quantity")
      .optional({
        checkFalsy: true,
      })
      .isFloat({
        min: 1,
      })
      .withMessage(
        "Quantity must be greater than or equal to 1."
      )
      .toFloat(),
  ];
  
  module.exports = {
    SORTABLE_FIELDS,
  
    variantPriceIdValidation,
    variantIdValidation,
    productIdValidation,
  
    listVariantPricesValidation,
    createVariantPriceValidation,
    updateVariantPriceValidation,
    changeVariantPriceStatusValidation,
    getPricesByVariantValidation,
    getPricesByProductValidation,
  };