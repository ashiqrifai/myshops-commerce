const {
  Op,
} = require(
  "sequelize"
);

const {
  Product,
  ProductVariant,
  ProtectionSetting,
  ProtectionScheme,
  ProtectionSchemeAssignment,
} = require(
  "../models"
);

const priceResolverService =
  require(
    "../modules/pricing/priceResolver.service"
  );

/*
 * ------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------
 */

const DEFAULT_CHANNEL =
  "WEBSITE";

const DEFAULT_CURRENCY =
  "AED";

const SCOPE_PRIORITY = {
  PRODUCT:
    300,

  BRAND:
    200,

  CATEGORY:
    100,

  DEFAULT:
    0,
};

/*
 * ------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------
 */

/**
 * Resolve all available protection plans for one
 * product variant.
 *
 * Business rules:
 *
 * 1. Global protection engine must be enabled.
 * 2. Current selling price must be >= global minimum.
 * 3. Scheme must be active and within validity dates.
 * 4. Scheme-level min/max product amount must match.
 * 5. Product eligibility is controlled by active protection assignments.
 * 6. Assignment pricing priority:
 *
 *      PRODUCT
 *        >
 *      BRAND
 *        >
 *      CATEGORY
 *        >
 *      scheme default
 *
 * 7. Price is always calculated server-side.
 */
async function resolveProtectionPlans({
  companyId,
  productId,
  productVariantId,
  channelCode =
    DEFAULT_CHANNEL,
  currencyCode =
    DEFAULT_CURRENCY,
  quantity =
    1,
  effectiveDate =
    new Date(),
}) {
  validateRequiredInput({
    companyId,
    productId,
    productVariantId,
  });

  const normalizedChannel =
    normalizeCode(
      channelCode ||
        DEFAULT_CHANNEL
    );

  const normalizedCurrency =
    normalizeCurrency(
      currencyCode ||
        DEFAULT_CURRENCY
    );

  const normalizedQuantity =
    normalizeQuantity(
      quantity
    );

  const resolvedDate =
    normalizeDate(
      effectiveDate
    );

  /*
   * ----------------------------------------------------------
   * Product
   * ----------------------------------------------------------
   */

  const product =
    await Product.findOne({
      where: {
        id:
          productId,

        companyId,
      },

      attributes: [
        "id",
        "name",
        "brandId",
        "primaryCategoryId",
      ],
    });

  if (
    !product
  ) {
    throw createProtectionError(
      "PRODUCT_NOT_FOUND",
      "The selected product was not found.",
      404
    );
  }

  /*
   * ----------------------------------------------------------
   * Variant
   * ----------------------------------------------------------
   */

  const variant =
  await ProductVariant.findOne({
    where: {
      id:
        productVariantId,

      productId:
        product.id,
    },

    attributes: [
      "id",
      "productId",
      "sku",
      "name",
    ],
  });

  if (
    !variant
  ) {
    throw createProtectionError(
      "PRODUCT_VARIANT_NOT_FOUND",
      "The selected product variant was not found.",
      404
    );
  }


  /*
   * ----------------------------------------------------------
   * Product eligibility
   * ----------------------------------------------------------
   *
   * Eligibility is assignment-driven.
   *
   * A product becomes eligible when at least one active
   * protection scheme has a matching PRODUCT, BRAND or
   * CATEGORY assignment.
   *
   * The legacy isExtendedWarrantyEligible field is intentionally
   * not used as a mandatory opt-in here. This allows category
   * assignments such as "Mobiles" or "Laptops & Tablets" to
   * automatically apply to all matching products.
   * ----------------------------------------------------------
   */

  /*
   * ----------------------------------------------------------
   * Global protection settings
   * ----------------------------------------------------------
   */

  const settings =
    await ProtectionSetting.findOne({
      where: {
        companyId,
      },
    });

  if (
    !settings
  ) {
    return buildIneligibleResponse({
      product,
      variant,

      reason:
        "PROTECTION_SETTINGS_NOT_CONFIGURED",

      message:
        "Protection settings have not been configured.",

      currencyCode:
        normalizedCurrency,
    });
  }

  if (
    settings.isEnabled !==
    true
  ) {
    return buildIneligibleResponse({
      product,
      variant,

      reason:
        "PROTECTION_DISABLED",

      message:
        "Protection plans are currently disabled.",

      currencyCode:
        normalizedCurrency,
    });
  }

  /*
   * ----------------------------------------------------------
   * Resolve current selling price
   *
   * IMPORTANT:
   * Do not trust the price sent by the storefront.
   *
   * We reuse your existing central price resolver.
   * ----------------------------------------------------------
   */

  const resolvedPrice =
    await priceResolverService
      .resolvePrice({
        companyId,

        productVariantId:
          variant.id,

        channelCode:
          normalizedChannel,

        currencyCode:
          normalizedCurrency,

        quantity:
          normalizedQuantity,

        effectiveDate:
          resolvedDate,

        includeInactive:
          false,
      });

  const sellingPrice =
    extractSellingPrice(
      resolvedPrice
    );

  if (
    !Number.isFinite(
      sellingPrice
    ) ||
    sellingPrice <=
      0
  ) {
    return buildIneligibleResponse({
      product,
      variant,

      reason:
        "INVALID_PRODUCT_PRICE",

      message:
        "The selected product does not have a valid selling price.",

      currencyCode:
        normalizedCurrency,
    });
  }

  const actualCurrencyCode =
    extractCurrencyCode(
      resolvedPrice,
      normalizedCurrency
    );

  /*
   * ----------------------------------------------------------
   * Global minimum eligible product value
   * ----------------------------------------------------------
   */

  const globalMinimumAmount =
    toNumber(
      settings
        .minimumEligibleProductAmount,
      0
    );

  if (
    sellingPrice <
    globalMinimumAmount
  ) {
    return {
      eligible:
        false,

      reason:
        "BELOW_MINIMUM_AMOUNT",

      message:
        `Protection plans are available for products priced at ${formatAmount(
          globalMinimumAmount
        )} ${actualCurrencyCode} or above.`,

      product: {
        id:
          product.id,

        name:
          product.name,
      },

      variant: {
        id:
          variant.id,

        sku:
          variant.sku,

        name:
          variant.name,
      },

      pricing: {
        sellingPrice:
          roundMoney(
            sellingPrice
          ),

        currencyCode:
          actualCurrencyCode,

        minimumEligibleProductAmount:
          roundMoney(
            globalMinimumAmount
          ),
      },

      plans:
        [],
    };
  }

  /*
   * ----------------------------------------------------------
   * Active schemes
   * ----------------------------------------------------------
   */

  const schemes =
    await ProtectionScheme.findAll({
      where: {
        companyId,

        isActive:
          true,

        [Op.and]: [
          {
            [Op.or]: [
              {
                validFrom:
                  null,
              },

              {
                validFrom: {
                  [Op.lte]:
                    resolvedDate,
                },
              },
            ],
          },

          {
            [Op.or]: [
              {
                validUntil:
                  null,
              },

              {
                validUntil: {
                  [Op.gte]:
                    resolvedDate,
                },
              },
            ],
          },
        ],
      },

      order: [
        [
          "sortOrder",
          "ASC",
        ],

        [
          "durationMonths",
          "ASC",
        ],

        [
          "name",
          "ASC",
        ],
      ],
    });

  if (
    schemes.length ===
    0
  ) {
    return {
      eligible:
        true,

      reason:
        "NO_ACTIVE_SCHEMES",

      message:
        "This product is eligible for protection, but no active protection schemes are currently available.",

      product: {
        id:
          product.id,

        name:
          product.name,
      },

      variant: {
        id:
          variant.id,

        sku:
          variant.sku,

        name:
          variant.name,
      },

      pricing: {
        sellingPrice:
          roundMoney(
            sellingPrice
          ),

        currencyCode:
          actualCurrencyCode,

        minimumEligibleProductAmount:
          roundMoney(
            globalMinimumAmount
          ),
      },

      plans:
        [],
    };
  }

  /*
  /*
   * ----------------------------------------------------------
   * Load all active assignments for active schemes
   * ----------------------------------------------------------
   *
   * Assignments control ELIGIBILITY as well as pricing.
   *
   * PRODUCT  -> only that product
   * BRAND    -> only products of that brand
   * CATEGORY -> only products of that category
   *
   * "Scheme default" on an assignment means:
   * use the scheme's default pricing.
   *
   * It does NOT mean:
   * make the scheme available globally.
   * ----------------------------------------------------------
   */

  const schemeIds =
    schemes.map(
      (scheme) =>
        scheme.id
    );

  const allAssignments =
    await ProtectionSchemeAssignment.findAll({
      where: {
        companyId,

        schemeId: {
          [Op.in]:
            schemeIds,
        },

        isActive:
          true,

        [Op.and]: [
          {
            [Op.or]: [
              {
                validFrom:
                  null,
              },

              {
                validFrom: {
                  [Op.lte]:
                    resolvedDate,
                },
              },
            ],
          },

          {
            [Op.or]: [
              {
                validUntil:
                  null,
              },

              {
                validUntil: {
                  [Op.gte]:
                    resolvedDate,
                },
              },
            ],
          },
        ],
      },
    });

  /*
   * Index ALL assignments by scheme
   */

  const allAssignmentsByScheme =
    new Map();

  for (
    const assignment of
    allAssignments
  ) {
    const existing =
      allAssignmentsByScheme.get(
        assignment.schemeId
      ) ||
      [];

    existing.push(
      assignment
    );

    allAssignmentsByScheme.set(
      assignment.schemeId,
      existing
    );
  }

  /*
   * Find assignments matching the current product
   */

  const matchingAssignmentsByScheme =
    new Map();

  for (
    const assignment of
    allAssignments
  ) {
    let matches =
      false;

    if (
      assignment.scopeType ===
        "PRODUCT" &&
      assignment.productId ===
        product.id
    ) {
      matches =
        true;
    }

    if (
      assignment.scopeType ===
        "BRAND" &&
      product.brandId &&
      assignment.brandId ===
        product.brandId
    ) {
      matches =
        true;
    }

    if (
      assignment.scopeType ===
        "CATEGORY" &&
      product.primaryCategoryId &&
      assignment.categoryId ===
        product.primaryCategoryId
    ) {
      matches =
        true;
    }

    if (
      !matches
    ) {
      continue;
    }

    const existing =
      matchingAssignmentsByScheme.get(
        assignment.schemeId
      ) ||
      [];

    existing.push(
      assignment
    );

    matchingAssignmentsByScheme.set(
      assignment.schemeId,
      existing
    );
  }

  /*
   * ----------------------------------------------------------
   * Resolve every scheme independently.
   * ----------------------------------------------------------
   */

  const plans =
    [];

  for (
    const scheme of
    schemes
  ) {
    /*
     * Scheme's own product-value range.
     */

    if (
      !isPriceInsideSchemeRange(
        sellingPrice,
        scheme
      )
    ) {
      continue;
    }

    /*
     * --------------------------------------------------------
     * Assignment eligibility
     * --------------------------------------------------------
     */

    const schemeAssignments =
      allAssignmentsByScheme.get(
        scheme.id
      ) ||
      [];

    if (
      schemeAssignments.length ===
      0
    ) {
      continue;
    }

    const matchingAssignments =
      matchingAssignmentsByScheme.get(
        scheme.id
      ) ||
      [];

    if (
      matchingAssignments.length ===
      0
    ) {
      continue;
    }

    /*
     * PRODUCT > BRAND > CATEGORY
     */
    const selectedAssignment =
      selectHighestPriorityAssignment(
        matchingAssignments
      );

    const pricing =
      resolveSchemePricing({
        scheme,
        assignment:
          selectedAssignment,
        sellingPrice,
      });

    /*
     * Bad/missing configuration should not
     * expose an invalid scheme to customers.
     */

    if (
      !pricing
    ) {
      continue;
    }

    const unitPrice =
      calculateProtectionPrice({
        sellingPrice,

        pricingMethod:
          pricing.pricingMethod,

        percentage:
          pricing.percentage,

        fixedAmount:
          pricing.fixedAmount,
      });

    if (
      !Number.isFinite(
        unitPrice
      ) ||
      unitPrice <=
        0
    ) {
      continue;
    }

    plans.push({
      schemeId:
        scheme.id,

      zohoItemId:
        scheme
          .zohoItemId ||
        null,

      assignmentId:
        selectedAssignment
          ?.id ||
        null,
        
    

      code:
        scheme.code,

      name:
        scheme.name,

      description:
        scheme.description ||
        null,

      schemeType:
        scheme.schemeType,

      durationMonths:
        scheme.durationMonths ===
          null ||
        scheme.durationMonths ===
          undefined
          ? null
          : Number(
              scheme
                .durationMonths
            ),

      coverageStartMode:
        scheme.coverageStartMode,

      pricingMethod:
        pricing.pricingMethod,

      percentage:
        pricing.percentage,

      fixedAmount:
        pricing.fixedAmount,

      productUnitPrice:
        roundMoney(
          sellingPrice
        ),

      unitPrice:
        roundMoney(
          unitPrice
        ),

      currencyCode:
        actualCurrencyCode,

      pricingSource:
        selectedAssignment
          ? selectedAssignment
              .scopeType
          : "DEFAULT",

      termsAndConditions:
        scheme
          .termsAndConditions ||
        null,

      sortOrder:
        Number(
          scheme.sortOrder ||
            0
        ),
    });
  }

  return {
    eligible:
      true,

    reason:
      plans.length >
      0
        ? null
        : "NO_APPLICABLE_SCHEMES",

    message:
      plans.length >
      0
        ? "Protection plans resolved successfully."
        : "No protection schemes are applicable to the selected product.",

    product: {
      id:
        product.id,

      name:
        product.name,

      brandId:
        product.brandId ||
        null,

      categoryId:
        product
          .primaryCategoryId ||
        null,
    },

    variant: {
      id:
        variant.id,

      sku:
        variant.sku,

      name:
        variant.name,
    },

    pricing: {
      sellingPrice:
        roundMoney(
          sellingPrice
        ),

      currencyCode:
        actualCurrencyCode,

      minimumEligibleProductAmount:
        roundMoney(
          globalMinimumAmount
        ),
    },

    plans,
  };
}

/*
 * ------------------------------------------------------------
 * Resolve one specific protection scheme
 *
 * Very important for checkout/order revalidation.
 *
 * The storefront can submit schemeId, but it CANNOT
 * submit/trust its own protection price.
 * ------------------------------------------------------------
 */

async function resolveProtectionScheme({
  companyId,
  productId,
  productVariantId,
  schemeId,
  channelCode =
    DEFAULT_CHANNEL,
  currencyCode =
    DEFAULT_CURRENCY,
  quantity =
    1,
  effectiveDate =
    new Date(),
}) {
  if (
    !schemeId
  ) {
    throw createProtectionError(
      "PROTECTION_SCHEME_ID_REQUIRED",
      "Protection scheme ID is required.",
      400
    );
  }

  const result =
    await resolveProtectionPlans({
      companyId,
      productId,
      productVariantId,
      channelCode,
      currencyCode,
      quantity,
      effectiveDate,
    });

  if (
    !result.eligible
  ) {
    throw createProtectionError(
      "PROTECTION_NOT_ELIGIBLE",
      result.message ||
        "The selected product is not eligible for protection.",
      409
    );
  }

  const plan =
    result.plans.find(
      (item) =>
        item.schemeId ===
        schemeId
    );

  if (
    !plan
  ) {
    throw createProtectionError(
      "PROTECTION_SCHEME_NOT_AVAILABLE",
      "The selected protection scheme is no longer available for this product.",
      409
    );
  }

  return {
    ...result,

    plan,
  };
}

/*
 * ------------------------------------------------------------
 * Assignment resolution
 * ------------------------------------------------------------
 */

function selectHighestPriorityAssignment(
  assignments
) {
  if (
    !Array.isArray(
      assignments
    ) ||
    assignments.length ===
      0
  ) {
    return null;
  }

  return [
    ...assignments,
  ].sort(
    (
      first,
      second
    ) => {
      const firstPriority =
        SCOPE_PRIORITY[
          first.scopeType
        ] ||
        0;

      const secondPriority =
        SCOPE_PRIORITY[
          second.scopeType
        ] ||
        0;

      return (
        secondPriority -
        firstPriority
      );
    }
  )[0];
}

/*
 * ------------------------------------------------------------
 * Pricing source
 * ------------------------------------------------------------
 */

function resolveSchemePricing({
  scheme,
  assignment,
  sellingPrice,
}) {
  const schemeMethod =
    normalizeCode(
      scheme.pricingMethod
    );

  /*
   * Percentage scheme
   */

  if (
    schemeMethod ===
    "PERCENTAGE"
  ) {
    const assignmentPercentage =
      assignment
        ?.percentageOverride;

    const percentage =
      assignmentPercentage !==
        null &&
      assignmentPercentage !==
        undefined
        ? toNumber(
            assignmentPercentage,
            NaN
          )
        : toNumber(
            scheme.percentage,
            NaN
          );

    if (
      !Number.isFinite(
        percentage
      ) ||
      percentage <=
        0
    ) {
      return null;
    }

    return {
      pricingMethod:
        "PERCENTAGE",

      percentage:
        percentage,

      fixedAmount:
        null,
    };
  }

  /*
   * Fixed scheme
   */

  if (
    schemeMethod ===
    "FIXED"
  ) {
    const assignmentFixedAmount =
      assignment
        ?.fixedAmountOverride;

    const fixedAmount =
      assignmentFixedAmount !==
        null &&
      assignmentFixedAmount !==
        undefined
        ? toNumber(
            assignmentFixedAmount,
            NaN
          )
        : toNumber(
            scheme.fixedAmount,
            NaN
          );

    if (
      !Number.isFinite(
        fixedAmount
      ) ||
      fixedAmount <=
        0
    ) {
      return null;
    }

    return {
      pricingMethod:
        "FIXED",

      percentage:
        null,

      fixedAmount,
    };
  }

  return null;
}

/*
 * ------------------------------------------------------------
 * Price calculation
 * ------------------------------------------------------------
 */

function calculateProtectionPrice({
  sellingPrice,
  pricingMethod,
  percentage,
  fixedAmount,
}) {
  if (
    pricingMethod ===
    "PERCENTAGE"
  ) {
    return roundMoney(
      sellingPrice *
        (
          Number(
            percentage
          ) /
          100
        )
    );
  }

  if (
    pricingMethod ===
    "FIXED"
  ) {
    return roundMoney(
      Number(
        fixedAmount
      )
    );
  }

  return NaN;
}

/*
 * ------------------------------------------------------------
 * Scheme amount eligibility
 * ------------------------------------------------------------
 */

function isPriceInsideSchemeRange(
  sellingPrice,
  scheme
) {
  const minimum =
    scheme
      .minimumProductAmount ===
      null ||
    scheme
      .minimumProductAmount ===
      undefined
      ? null
      : Number(
          scheme
            .minimumProductAmount
        );

  const maximum =
    scheme
      .maximumProductAmount ===
      null ||
    scheme
      .maximumProductAmount ===
      undefined
      ? null
      : Number(
          scheme
            .maximumProductAmount
        );

  if (
    minimum !==
      null &&
    Number.isFinite(
      minimum
    ) &&
    sellingPrice <
      minimum
  ) {
    return false;
  }

  if (
    maximum !==
      null &&
    Number.isFinite(
      maximum
    ) &&
    sellingPrice >
      maximum
  ) {
    return false;
  }

  return true;
}

/*
 * ------------------------------------------------------------
 * Price Resolver compatibility helper
 *
 * Your central price resolver may return the selling
 * price directly or nested in a resolved price object.
 *
 * We support the common structures here.
 * ------------------------------------------------------------
 */

function extractSellingPrice(
  resolvedPrice
) {
  const candidates = [
    resolvedPrice
      ?.sellingPrice,

    resolvedPrice
      ?.price,

    resolvedPrice
      ?.unitPrice,

    resolvedPrice
      ?.resolvedPrice,

    resolvedPrice
      ?.data
      ?.sellingPrice,

    resolvedPrice
      ?.data
      ?.price,

    resolvedPrice
      ?.price
      ?.sellingPrice,

    resolvedPrice
      ?.data
      ?.price
      ?.sellingPrice,
  ];

  for (
    const candidate of
    candidates
  ) {
    const numeric =
      Number(
        candidate
      );

    if (
      Number.isFinite(
        numeric
      ) &&
      numeric >
        0
    ) {
      return numeric;
    }
  }

  return NaN;
}

function extractCurrencyCode(
  resolvedPrice,
  fallbackCurrency
) {
  const candidate =
    resolvedPrice
      ?.currencyCode ||
    resolvedPrice
      ?.data
      ?.currencyCode ||
    resolvedPrice
      ?.price
      ?.currencyCode ||
    resolvedPrice
      ?.data
      ?.price
      ?.currencyCode ||
    fallbackCurrency ||
    DEFAULT_CURRENCY;

  return normalizeCurrency(
    candidate
  );
}

/*
 * ------------------------------------------------------------
 * Ineligible response
 * ------------------------------------------------------------
 */

function buildIneligibleResponse({
  product,
  variant,
  reason,
  message,
  currencyCode,
}) {
  return {
    eligible:
      false,

    reason,

    message,

    product: {
      id:
        product?.id ||
        null,

      name:
        product?.name ||
        null,
    },

    variant: {
      id:
        variant?.id ||
        null,

      sku:
        variant?.sku ||
        null,

      name:
        variant?.name ||
        null,
    },

    pricing: {
      sellingPrice:
        null,

      currencyCode:
        normalizeCurrency(
          currencyCode
        ),
    },

    plans:
      [],
  };
}

/*
 * ------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------
 */

function validateRequiredInput({
  companyId,
  productId,
  productVariantId,
}) {
  if (
    !companyId
  ) {
    throw createProtectionError(
      "COMPANY_ID_REQUIRED",
      "Company ID is required.",
      400
    );
  }

  if (
    !productId
  ) {
    throw createProtectionError(
      "PRODUCT_ID_REQUIRED",
      "Product ID is required.",
      400
    );
  }

  if (
    !productVariantId
  ) {
    throw createProtectionError(
      "PRODUCT_VARIANT_ID_REQUIRED",
      "Product variant ID is required.",
      400
    );
  }
}

/*
 * ------------------------------------------------------------
 * Normalization
 * ------------------------------------------------------------
 */

function normalizeCode(
  value
) {
  return String(
    value ||
      ""
  )
    .trim()
    .toUpperCase();
}

function normalizeCurrency(
  value
) {
  const normalized =
    String(
      value ||
        DEFAULT_CURRENCY
    )
      .trim()
      .toUpperCase();

  return (
    normalized ||
    DEFAULT_CURRENCY
  );
}

function normalizeQuantity(
  value
) {
  const numeric =
    Math.floor(
      Number(
        value
      )
    );

  if (
    !Number.isFinite(
      numeric
    ) ||
    numeric <
      1
  ) {
    return 1;
  }

  return Math.min(
    numeric,
    999
  );
}

function normalizeDate(
  value
) {
  if (
    value instanceof
    Date
  ) {
    return value;
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return new Date();
  }

  return parsed;
}

/*
 * ------------------------------------------------------------
 * Numeric helpers
 * ------------------------------------------------------------
 */

function toNumber(
  value,
  fallback =
    0
) {
  const numeric =
    Number(
      value
    );

  return Number.isFinite(
    numeric
  )
    ? numeric
    : fallback;
}

function roundMoney(
  value
) {
  const numeric =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0;
  }

  return (
    Math.round(
      (
        numeric +
        Number.EPSILON
      ) *
        100
    ) /
    100
  );
}

function formatAmount(
  value
) {
  return roundMoney(
    value
  ).toFixed(
    2
  );
}

/*
 * ------------------------------------------------------------
 * Error helper
 *
 * We deliberately do not depend on AppError here so this
 * service can work even if your AppError constructor differs.
 * The controller/error middleware can still read statusCode
 * and errorCode.
 * ------------------------------------------------------------
 */

function createProtectionError(
  code,
  message,
  statusCode =
    400,
  details =
    []
) {
  const error =
    new Error(
      message
    );

  error.name =
    "ProtectionResolverError";

  error.statusCode =
    statusCode;

  error.errorCode =
    code;

  error.details =
    details;

  error.isOperational =
    true;

  return error;
}

/*
 * ------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------
 */

module.exports = {
  resolveProtectionPlans,
  resolveProtectionScheme,
};
