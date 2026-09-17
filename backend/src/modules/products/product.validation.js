const {
  body,
  param,
  query,
} = require("express-validator");

const {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  CHANNEL_CODES,
  PUBLISH_STATUSES,
  IMAGE_ROLES,
} = require("./product.constants");

exports.productIdValidation = [
  param("id")
    .isUUID()
    .withMessage(
      "A valid product ID is required."
    ),
];

exports.variantIdValidation = [
  ...exports.productIdValidation,

  param("variantId")
    .isUUID()
    .withMessage(
      "A valid variant ID is required."
    ),
];

exports.listProductsValidation = [
  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .toInt(),

  query("pageSize")
    .optional()
    .isInt({
      min: 1,
      max: 200,
    })
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 300,
    }),

  query("brandId")
    .optional()
    .isUUID(),

  query("categoryId")
    .optional()
    .isUUID(),

  query("productType")
    .optional()
    .isIn(
      PRODUCT_TYPES
    ),

  query("status")
    .optional()
    .isIn(
      PRODUCT_STATUSES
    ),

  query("channelCode")
    .optional()
    .isIn(
      CHANNEL_CODES
    ),

  query("isFeatured")
    .optional()
    .isBoolean()
    .toBoolean(),

  query("sortBy")
    .optional()
    .isIn([
      "name",
      "parentSku",
      "productType",
      "status",
      "sortOrder",
      "createdAt",
      "updatedAt",
    ]),

  query("sortDirection")
    .optional()
    .isIn([
      "ASC",
      "DESC",
    ]),
];

const commonProductFields = [
  body("brandId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID(),

  body("primaryCategoryId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID(),

  body("slug")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 320,
    }),

  body("productType")
    .optional()
    .isIn(
      PRODUCT_TYPES
    ),

  body("status")
    .optional()
    .isIn(
      PRODUCT_STATUSES
    ),

  body("parentSku")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 150,
    }),

  body("erpId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 180,
    })
    .withMessage(
      "ERP ID cannot exceed 180 characters."
    ),

  body("shortDescription")
    .optional({
      nullable: true,
    })
    .isString(),

  body("description")
    .optional({
      nullable: true,
    })
    .isString(),

  body("features")
    .optional({
      nullable: true,
    })
    .isArray(),

  body("whatsInTheBox")
    .optional({
      nullable: true,
    })
    .isArray(),

  body("warrantyText")
    .optional({
      nullable: true,
    })
    .isString(),

  body("taxCode")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 100,
    }),

  body("taxPercent")
    .optional()
    .isFloat({
      min: 0,
      max: 100,
    })
    .toFloat(),

  body("sortOrder")
    .optional()
    .isInt({
      min: 0,
    })
    .toInt(),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false."
    )
    .toBoolean(),

  body("isSearchable")
    .optional()
    .isBoolean()
    .withMessage(
      "isSearchable must be true or false."
    )
    .toBoolean(),
  
    body("alwaysAvailableForSale")
    .optional()
    .isBoolean()
    .withMessage(
      "alwaysAvailableForSale must be true or false."
    )
    .toBoolean(),

  /*
   * Customer-facing delivery promise.
   */
  body("expressDeliveryEnabled")
    .optional()
    .isBoolean()
    .withMessage(
      "expressDeliveryEnabled must be true or false."
    )
    .toBoolean(),

  body("expressDeliveryHours")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 1,
      max: 168,
    })
    .withMessage(
      "expressDeliveryHours must be between 1 and 168."
    )
    .toInt(),

  body("deliveryMinDays")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 0,
      max: 365,
    })
    .withMessage(
      "deliveryMinDays must be between 0 and 365."
    )
    .toInt(),

  body("deliveryMaxDays")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 0,
      max: 365,
    })
    .withMessage(
      "deliveryMaxDays must be between 0 and 365."
    )
    .toInt(),

  body("deliveryNote")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "deliveryNote cannot exceed 500 characters."
    ),

  body()
    .custom((payload) => {
      if (
        payload?.deliveryMinDays != null &&
        payload?.deliveryMaxDays != null &&
        Number(
          payload.deliveryMaxDays
        ) <
          Number(
            payload.deliveryMinDays
          )
      ) {
        throw new Error(
          "deliveryMaxDays cannot be less than deliveryMinDays."
        );
      }

      return true;
    }),

  /*
   * Supplier-direct fulfillment.
   */
  body("isDirectDelivery")
    .optional()
    .isBoolean()
    .withMessage(
      "isDirectDelivery must be true or false."
    )
    .toBoolean(),

  body("directDeliverySupplierId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage(
      "directDeliverySupplierId must be a valid UUID."
    ),

  body("directDeliveryLeadTimeDays")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 0,
      max: 3650,
    })
    .withMessage(
      "directDeliveryLeadTimeDays must be a non-negative whole number."
    )
    .toInt(),

  body("directDeliveryNote")
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "directDeliveryNote cannot exceed 500 characters."
    ),

  body()
    .custom(
      (
        payload
      ) => {
        if (
          payload?.isDirectDelivery ===
            true &&
          !payload?.directDeliverySupplierId
        ) {
          throw new Error(
            "directDeliverySupplierId is required when isDirectDelivery is true."
          );
        }

        return true;
      }
    ),

  body("metaTitle")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 300,
    }),

  body("metaDescription")
    .optional({
      nullable: true,
    })
    .isString(),

  body("metaKeywords")
    .optional({
      nullable: true,
    })
    .isString(),

  body("canonicalUrl")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isURL(),

  body("categoryIds")
    .optional()
    .isArray(),

  body("categoryIds.*")
    .optional()
    .isUUID(),

  body("images")
    .optional()
    .isArray(),

  body("images.*.mediaAssetId")
    .isUUID(),

  body("images.*.variantId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID(),

  body("images.*.imageRole")
    .optional()
    .isIn(
      IMAGE_ROLES
    ),

  body("images.*.displayOrder")
    .optional()
    .isInt({
      min: 0,
    })
    .toInt(),

  body("images.*.isActive")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("channels")
    .optional()
    .isArray(),

  body("channels.*.channelCode")
    .isIn(
      CHANNEL_CODES
    ),

  body("channels.*.isVisible")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("channels.*.publishStatus")
    .optional()
    .isIn(
      PUBLISH_STATUSES
    ),

  body("attributeValues")
    .optional()
    .isArray(),

  body("attributeValues.*.attributeId")
    .isUUID(),

  body("attributeValues.*.optionId")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID(),

  body("variants")
    .optional()
    .isArray(),

  body("variants.*.id")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID(),

  body("variants.*.sku")
    .trim()
    .notEmpty()
    .isLength({
      max: 180,
    }),

  body("variants.*.barcode")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 180,
    }),

  body("variants.*.name")
    .trim()
    .notEmpty()
    .isLength({
      max: 350,
    }),

  body("variants.*.status")
    .optional()
    .isIn(
      PRODUCT_STATUSES
    ),

  /*
   * Variant-level delivery override.
   */
  body(
    "variants.*.overrideDeliverySettings"
  )
    .optional()
    .isBoolean()
    .toBoolean(),

  body(
    "variants.*.expressDeliveryEnabled"
  )
    .optional({
      nullable: true,
    })
    .isBoolean()
    .toBoolean(),

  body(
    "variants.*.expressDeliveryHours"
  )
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 1,
      max: 168,
    })
    .toInt(),

  body(
    "variants.*.deliveryMinDays"
  )
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 0,
      max: 365,
    })
    .toInt(),

  body(
    "variants.*.deliveryMaxDays"
  )
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isInt({
      min: 0,
      max: 365,
    })
    .toInt(),

  body(
    "variants.*.deliveryNote"
  )
    .optional({
      nullable: true,
    })
    .isString()
    .trim()
    .isLength({
      max: 500,
    }),

  body("variants.*")
    .custom(
      (
        variant
      ) => {
        if (
          variant?.deliveryMinDays != null &&
          variant?.deliveryMaxDays != null &&
          Number(
            variant.deliveryMaxDays
          ) <
            Number(
              variant.deliveryMinDays
            )
        ) {
          throw new Error(
            "Variant deliveryMaxDays cannot be less than deliveryMinDays."
          );
        }

        return true;
      }
    ),

  body("variants.*.attributeValues")
    .optional()
    .isArray(),

  body(
    "variants.*.attributeValues.*.attributeId"
  )
    .isUUID(),

  body(
    "variants.*.attributeValues.*.optionId"
  )
    .isUUID(),
];

exports.createProductValidation = [
  body("name")
    .trim()
    .notEmpty()
    .isLength({
      max: 300,
    }),

  ...commonProductFields,
];

exports.updateProductValidation = [
  ...exports.productIdValidation,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .isLength({
      max: 300,
    }),

  ...commonProductFields,
];

exports.changeProductStatusValidation = [
  ...exports.productIdValidation,

  body("status")
    .isIn(
      PRODUCT_STATUSES
    ),
];

exports.generateVariantsValidation = [
  ...exports.productIdValidation,

  body("attributeSelections")
    .isArray({
      min: 1,
    })
    .withMessage(
      "At least one variant attribute selection is required."
    ),

  body(
    "attributeSelections.*.attributeId"
  )
    .isUUID(),

  body(
    "attributeSelections.*.optionIds"
  )
    .isArray({
      min: 1,
    }),

  body(
    "attributeSelections.*.optionIds.*"
  )
    .isUUID(),

  body("replaceExisting")
    .optional()
    .isBoolean()
    .toBoolean(),

  body("skuPrefix")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 150,
    }),
];
