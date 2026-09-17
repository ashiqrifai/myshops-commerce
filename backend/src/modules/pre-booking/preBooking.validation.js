const {
    body,
    param,
    query,
  } = require(
    "express-validator"
  );
  
  const {
    PRE_BOOKING_CAMPAIGN_STATUSES,
    PRE_BOOKING_PAYMENT_POLICIES,
    PRE_BOOKING_BUNDLE_PRICE_MODES,
    PRE_BOOKING_BUNDLE_ITEM_TYPES,
  } = require(
    "./preBooking.constants"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Common ID Validators
  |--------------------------------------------------------------------------
  */
  
  exports.campaignIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid pre-booking campaign ID is required."
      ),
  ];
  
  exports.campaignProductIdValidation = [
    param(
      "campaignProductId"
    )
      .isUUID()
      .withMessage(
        "A valid campaign product ID is required."
      ),
  ];
  
  exports.bundleIdValidation = [
    param("bundleId")
      .isUUID()
      .withMessage(
        "A valid bundle ID is required."
      ),
  ];
  
  exports.bundleItemIdValidation = [
    param(
      "bundleItemId"
    )
      .isUUID()
      .withMessage(
        "A valid bundle item ID is required."
      ),
  ];
  
  exports.allocationIdValidation = [
    param(
      "allocationId"
    )
      .isUUID()
      .withMessage(
        "A valid allocation ID is required."
      ),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Campaign List
  |--------------------------------------------------------------------------
  */
  
  exports.listCampaignsValidation = [
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
        max: 250,
      }),
  
    query("status")
      .optional()
      .isIn(
        PRE_BOOKING_CAMPAIGN_STATUSES
      )
      .withMessage(
        "Invalid pre-booking campaign status."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    query("sortBy")
      .optional()
      .isIn([
        "name",
        "code",
        "bookingStartAt",
        "bookingEndAt",
        "sortOrder",
        "status",
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
  
  /*
  |--------------------------------------------------------------------------
  | Shared Campaign Fields
  |--------------------------------------------------------------------------
  */
  
  const optionalCampaignFields = [
    body("description")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("status")
      .optional()
      .isIn(
        PRE_BOOKING_CAMPAIGN_STATUSES
      )
      .withMessage(
        "Invalid pre-booking campaign status."
      ),
  
    body("bookingStartAt")
      .optional({
        nullable: true,
      })
      .isISO8601()
      .withMessage(
        "Booking start date must be valid."
      )
      .toDate(),
  
    body("bookingEndAt")
      .optional({
        nullable: true,
      })
      .isISO8601()
      .withMessage(
        "Booking end date must be valid."
      )
      .toDate(),
  
    body("paymentPolicy")
      .optional()
      .isIn(
        PRE_BOOKING_PAYMENT_POLICIES
      )
      .withMessage(
        "Invalid pre-booking payment policy."
      ),
  
    body("allowCard")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("allowTabby")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("allowTamara")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("allowCoupons")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("allowGiftVouchers")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("checkoutSessionMinutes")
      .optional()
      .isInt({
        min: 5,
        max: 120,
      })
      .withMessage(
        "Checkout session minutes must be between 5 and 120."
      )
      .toInt(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Campaign
  |--------------------------------------------------------------------------
  */
  
  exports.createCampaignValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Campaign name is required."
      )
      .isLength({
        max: 250,
      }),
  
    body("code")
      .trim()
      .notEmpty()
      .withMessage(
        "Campaign code is required."
      )
      .isLength({
        max: 100,
      }),
  
    body("slug")
      .trim()
      .notEmpty()
      .withMessage(
        "Campaign slug is required."
      )
      .isLength({
        max: 250,
      }),
  
    ...optionalCampaignFields,
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Update Campaign
  |--------------------------------------------------------------------------
  */
  
  exports.updateCampaignValidation = [
    ...exports
      .campaignIdValidation,
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .isLength({
        max: 250,
      }),
  
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .isLength({
        max: 100,
      }),
  
    body("slug")
      .optional()
      .trim()
      .notEmpty()
      .isLength({
        max: 250,
      }),
  
    ...optionalCampaignFields,
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Change Campaign Status
  |--------------------------------------------------------------------------
  */
  
  exports.changeCampaignStatusValidation = [
    ...exports
      .campaignIdValidation,
  
    body("status")
      .isIn(
        PRE_BOOKING_CAMPAIGN_STATUSES
      )
      .withMessage(
        "Invalid pre-booking campaign status."
      ),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Campaign Product
  |--------------------------------------------------------------------------
  */
  
  exports.createCampaignProductValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid campaign ID is required."
      ),
  
    body("productId")
      .isUUID()
      .withMessage(
        "A valid product ID is required."
      ),
  
    body("displayTitle")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 300,
      }),
  
    body("shortDescription")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("badgeText")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 100,
      }),
  
    body("minimumQuantity")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Minimum quantity must be at least 1."
      )
      .toInt(),
  
    body("maximumQuantityPerOrder")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Maximum quantity per order must be at least 1."
      )
      .toInt(),
  
    body("priceOverride")
      .optional({
        nullable: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Price override cannot be negative."
      )
      .toFloat(),
  
    body("currencyCode")
      .optional()
      .trim()
      .isLength({
        min: 3,
        max: 3,
      })
      .withMessage(
        "Currency code must contain exactly 3 characters."
      ),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Update Campaign Product
  |--------------------------------------------------------------------------
  */
  
  exports.updateCampaignProductValidation = [
    ...exports
      .campaignProductIdValidation,
  
    body("displayTitle")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 300,
      }),
  
    body("shortDescription")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("badgeText")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 100,
      }),
  
    body("minimumQuantity")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Minimum quantity must be at least 1."
      )
      .toInt(),
  
    body("maximumQuantityPerOrder")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Maximum quantity per order must be at least 1."
      )
      .toInt(),
  
    body("priceOverride")
      .optional({
        nullable: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Price override cannot be negative."
      )
      .toFloat(),
  
    body("currencyCode")
      .optional()
      .trim()
      .isLength({
        min: 3,
        max: 3,
      })
      .withMessage(
        "Currency code must contain exactly 3 characters."
      ),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Bundle
  |--------------------------------------------------------------------------
  */
  
  exports.createBundleValidation = [
    ...exports
      .campaignProductIdValidation,
  
    body("code")
      .trim()
      .notEmpty()
      .withMessage(
        "Bundle code is required."
      )
      .isLength({
        max: 100,
      }),
  
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Bundle name is required."
      )
      .isLength({
        max: 250,
      }),
  
    body("description")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("priceMode")
      .optional()
      .isIn(
        PRE_BOOKING_BUNDLE_PRICE_MODES
      )
      .withMessage(
        "Invalid bundle price mode."
      ),
  
    body("priceAmount")
      .optional({
        nullable: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Bundle price amount cannot be negative."
      )
      .toFloat(),
  
    body("currencyCode")
      .optional()
      .trim()
      .isLength({
        min: 3,
        max: 3,
      }),
  
    /*
     * Optional protection.
     */
    body("protectionSchemeId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "protectionSchemeId must be a valid UUID."
      ),
  
    body("protectionIncluded")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("badgeText")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 100,
      }),
  
    body("isDefault")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Update Bundle
  |--------------------------------------------------------------------------
  */
  
  exports.updateBundleValidation = [
    ...exports
      .bundleIdValidation,
  
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .isLength({
        max: 100,
      }),
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .isLength({
        max: 250,
      }),
  
    body("description")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("priceMode")
      .optional()
      .isIn(
        PRE_BOOKING_BUNDLE_PRICE_MODES
      )
      .withMessage(
        "Invalid bundle price mode."
      ),
  
    body("priceAmount")
      .optional({
        nullable: true,
      })
      .isFloat({
        min: 0,
      })
      .withMessage(
        "Bundle price amount cannot be negative."
      )
      .toFloat(),
  
    body("currencyCode")
      .optional()
      .trim()
      .isLength({
        min: 3,
        max: 3,
      }),
  
    body("protectionSchemeId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "protectionSchemeId must be a valid UUID."
      ),
  
    body("protectionIncluded")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("badgeText")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 100,
      }),
  
    body("isDefault")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Bundle Item
  |--------------------------------------------------------------------------
  */
  
  exports.createBundleItemValidation = [
    ...exports
      .bundleIdValidation,
  
    body("itemType")
      .optional()
      .isIn(
        PRE_BOOKING_BUNDLE_ITEM_TYPES
      )
      .withMessage(
        "Invalid bundle item type."
      ),
  
    body("productId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "productId must be a valid UUID."
      ),
  
    body("productVariantId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "productVariantId must be a valid UUID."
      ),
  
    body("label")
      .trim()
      .notEmpty()
      .withMessage(
        "Bundle item label is required."
      )
      .isLength({
        max: 300,
      }),
  
    body("description")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("quantity")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Bundle item quantity must be at least 1."
      )
      .toInt(),
  
    body("isIncluded")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Update Bundle Item
  |--------------------------------------------------------------------------
  */
  
  exports.updateBundleItemValidation = [
    ...exports
      .bundleItemIdValidation,
  
    body("itemType")
      .optional()
      .isIn(
        PRE_BOOKING_BUNDLE_ITEM_TYPES
      )
      .withMessage(
        "Invalid bundle item type."
      ),
  
    body("productId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "productId must be a valid UUID."
      ),
  
    body("productVariantId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "productVariantId must be a valid UUID."
      ),
  
    body("label")
      .optional()
      .trim()
      .notEmpty()
      .isLength({
        max: 300,
      }),
  
    body("description")
      .optional({
        nullable: true,
      })
      .isString(),
  
    body("quantity")
      .optional()
      .isInt({
        min: 1,
      })
      .withMessage(
        "Bundle item quantity must be at least 1."
      )
      .toInt(),
  
    body("isIncluded")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Shared Allocation Fields
  |--------------------------------------------------------------------------
  */
  
  const allocationOptionalFields = [
    body("productVariantId")
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "productVariantId must be a valid UUID."
      ),
  
    body("availableFrom")
      .optional({
        nullable: true,
      })
      .isISO8601()
      .withMessage(
        "Available-from date must be valid."
      )
      .toDate(),
  
    body("availableUntil")
      .optional({
        nullable: true,
      })
      .isISO8601()
      .withMessage(
        "Available-until date must be valid."
      )
      .toDate(),
  
    body("expectedStockFrom")
      .optional({
        nullable: true,
      })
      .isISO8601()
      .withMessage(
        "Expected stock start date must be valid."
      )
      .toDate(),
  
    body("expectedStockUntil")
      .optional({
        nullable: true,
      })
      .isISO8601()
      .withMessage(
        "Expected stock end date must be valid."
      )
      .toDate(),
  
    body("note")
      .optional({
        nullable: true,
      })
      .trim()
      .isLength({
        max: 500,
      }),
  
    body("isActive")
      .optional()
      .isBoolean()
      .toBoolean(),
  
    body("sortOrder")
      .optional()
      .isInt({
        min: 0,
      })
      .toInt(),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Product-Level Allocation
  |--------------------------------------------------------------------------
  |
  | No bundle is required.
  |--------------------------------------------------------------------------
  */
  
  exports.createProductAllocationValidation = [
    ...exports
      .campaignProductIdValidation,
  
    body("allocationQuantity")
      .isInt({
        min: 0,
      })
      .withMessage(
        "Allocation quantity must be zero or greater."
      )
      .toInt(),
  
    ...allocationOptionalFields,
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Create Bundle Allocation
  |--------------------------------------------------------------------------
  */
  
  exports.createAllocationValidation = [
    ...exports
      .bundleIdValidation,
  
    body("allocationQuantity")
      .isInt({
        min: 0,
      })
      .withMessage(
        "Allocation quantity must be zero or greater."
      )
      .toInt(),
  
    ...allocationOptionalFields,
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Update Allocation
  |--------------------------------------------------------------------------
  |
  | Works for both product-level and bundle-level allocation records.
  |--------------------------------------------------------------------------
  */
  
  exports.updateAllocationValidation = [
    ...exports
      .allocationIdValidation,
  
    body("allocationQuantity")
      .optional()
      .isInt({
        min: 0,
      })
      .withMessage(
        "Allocation quantity must be zero or greater."
      )
      .toInt(),
  
    ...allocationOptionalFields,
  ];