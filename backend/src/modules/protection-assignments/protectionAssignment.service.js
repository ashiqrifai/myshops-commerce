const {
  Op,
} = require(
  "sequelize"
);

const db = require(
  "../../models"
);

const AppError = require(
  "../../utils/AppError"
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

const getAttributes =
  () =>
    db
      .ProtectionSchemeAssignment
      ?.rawAttributes ||
    {};

const hasAttribute =
  (
    name
  ) =>
    Boolean(
      getAttributes()[
        name
      ]
    );

const pickField =
  (
    candidates
  ) =>
    candidates.find(
      hasAttribute
    ) ||
    null;

const FIELD = {
  schemeId:
    () =>
      pickField([
        "schemeId",
        "protectionSchemeId",
      ]),

  scopeType:
    () =>
      pickField([
        "scopeType",
        "assignmentType",
        "targetType",
        "level",
      ]),

  scopeId:
    () =>
      pickField([
        "scopeId",
        "targetId",
        "entityId",
      ]),

  productId:
    () =>
      pickField([
        "productId",
      ]),

  brandId:
    () =>
      pickField([
        "brandId",
      ]),

  categoryId:
    () =>
      pickField([
        "categoryId",
      ]),

  pricingMethod:
    () =>
      pickField([
        "pricingMethod",
        "overridePricingMethod",
      ]),

  percentage:
    () =>
      pickField([
        "percentage",
        "percentageOverride",
        "overridePercentage",
      ]),

  fixedAmount:
    () =>
      pickField([
        "fixedAmount",
        "fixedAmountOverride",
        "overrideFixedAmount",
      ]),

  minimumProductAmount:
    () =>
      pickField([
        "minimumProductAmount",
        "minimumEligibleProductAmount",
        "minProductAmount",
      ]),

  maximumProductAmount:
    () =>
      pickField([
        "maximumProductAmount",
        "maximumEligibleProductAmount",
        "maxProductAmount",
      ]),

  effectiveFrom:
    () =>
      pickField([
        "effectiveFrom",
        "validFrom",
        "startDate",
      ]),

  effectiveUntil:
    () =>
      pickField([
        "effectiveUntil",
        "validUntil",
        "endDate",
      ]),

  priority:
    () =>
      pickField([
        "priority",
        "sortOrder",
      ]),

  isActive:
    () =>
      pickField([
        "isActive",
        "enabled",
      ]),

  createdBy:
    () =>
      pickField([
        "createdBy",
      ]),

  updatedBy:
    () =>
      pickField([
        "updatedBy",
      ]),
};

const ensureModelConfigured =
  () => {
    if (
      !db
        .ProtectionSchemeAssignment
    ) {
      throw new AppError(
        "ProtectionSchemeAssignment model is not configured.",
        500,
        "PROTECTION_ASSIGNMENT_MODEL_NOT_CONFIGURED"
      );
    }

    if (
      !hasAttribute(
        "companyId"
      )
    ) {
      throw new AppError(
        "ProtectionSchemeAssignment must contain companyId.",
        500,
        "PROTECTION_ASSIGNMENT_COMPANY_FIELD_MISSING"
      );
    }

    if (
      !FIELD.schemeId()
    ) {
      throw new AppError(
        "ProtectionSchemeAssignment does not contain a supported scheme ID field.",
        500,
        "PROTECTION_ASSIGNMENT_SCHEME_FIELD_MISSING"
      );
    }

    const hasPolymorphicScope =
      Boolean(
        FIELD.scopeType() &&
        FIELD.scopeId()
      );

    const hasSpecificScope =
      Boolean(
        FIELD.productId() ||
        FIELD.brandId() ||
        FIELD.categoryId()
      );

    if (
      !hasPolymorphicScope &&
      !hasSpecificScope
    ) {
      throw new AppError(
        "ProtectionSchemeAssignment does not contain supported PRODUCT, BRAND or CATEGORY scope fields.",
        500,
        "PROTECTION_ASSIGNMENT_SCOPE_FIELDS_MISSING"
      );
    }
  };

const toNullableNumber =
  (
    value
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return null;
    }

    const result =
      Number(
        value
      );

    return Number.isFinite(
      result
    )
      ? result
      : null;
  };

const normalizeDate =
  (
    value
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return null;
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  };

const normalizeScopeType =
  (
    value
  ) =>
    String(
      value ||
        ""
    )
      .trim()
      .toUpperCase();

const validateScopeType =
  (
    scopeType
  ) => {
    if (
      !SCOPE_TYPES.includes(
        scopeType
      )
    ) {
      throw new AppError(
        "Assignment scope must be PRODUCT, BRAND or CATEGORY.",
        400,
        "PROTECTION_ASSIGNMENT_SCOPE_INVALID"
      );
    }
  };

const validateScheme =
  async ({
    companyId,
    schemeId,
    transaction,
  }) => {
    const scheme =
      await db
        .ProtectionScheme
        .findOne({
          where: {
            id:
              schemeId,

            companyId,
          },

          transaction,
        });

    if (
      !scheme
    ) {
      throw new AppError(
        "Protection scheme not found.",
        404,
        "PROTECTION_SCHEME_NOT_FOUND"
      );
    }

    return scheme;
  };

const validateScopeTarget =
  async ({
    companyId,
    scopeType,
    scopeId,
    transaction,
  }) => {
    let model =
      null;

    if (
      scopeType ===
      "PRODUCT"
    ) {
      model =
        db.Product;
    } else if (
      scopeType ===
      "BRAND"
    ) {
      model =
        db.Brand;
    } else if (
      scopeType ===
      "CATEGORY"
    ) {
      model =
        db.Category;
    }

    if (
      !model
    ) {
      throw new AppError(
        `The ${scopeType} model is not configured.`,
        500,
        "PROTECTION_ASSIGNMENT_TARGET_MODEL_MISSING"
      );
    }

    const target =
      await model
        .findOne({
          where: {
            id:
              scopeId,

            companyId,
          },

          transaction,
        });

    if (
      !target
    ) {
      throw new AppError(
        `${scopeType.toLowerCase()} was not found.`,
        404,
        "PROTECTION_ASSIGNMENT_TARGET_NOT_FOUND"
      );
    }

    return target;
  };

  const buildScopeWhere =
  ({
    scopeType,
    scopeId,
  }) => {
    const scopeTypeField =
      FIELD.scopeType();

    const scopeIdField =
      FIELD.scopeId();

    const result = {};

    /*
    |--------------------------------------------------------------------------
    | Scope Type
    |--------------------------------------------------------------------------
    |
    | Always populate scopeType when the model has the field.
    |
    | Some versions of ProtectionSchemeAssignment use:
    |
    | scopeType + productId / brandId / categoryId
    |
    | rather than:
    |
    | scopeType + scopeId
    |
    |--------------------------------------------------------------------------
    */

    if (
      scopeTypeField
    ) {
      result[
        scopeTypeField
      ] =
        scopeType;
    }

    /*
    |--------------------------------------------------------------------------
    | Generic Scope ID
    |--------------------------------------------------------------------------
    */

    if (
      scopeIdField
    ) {
      result[
        scopeIdField
      ] =
        scopeId;
    }

    /*
    |--------------------------------------------------------------------------
    | Product Scope
    |--------------------------------------------------------------------------
    */

    if (
      FIELD.productId()
    ) {
      result[
        FIELD.productId()
      ] =
        scopeType ===
        "PRODUCT"
          ? scopeId
          : null;
    }

    /*
    |--------------------------------------------------------------------------
    | Brand Scope
    |--------------------------------------------------------------------------
    */

    if (
      FIELD.brandId()
    ) {
      result[
        FIELD.brandId()
      ] =
        scopeType ===
        "BRAND"
          ? scopeId
          : null;
    }

    /*
    |--------------------------------------------------------------------------
    | Category Scope
    |--------------------------------------------------------------------------
    */

    if (
      FIELD.categoryId()
    ) {
      result[
        FIELD.categoryId()
      ] =
        scopeType ===
        "CATEGORY"
          ? scopeId
          : null;
    }

    return result;
  };
  
const getScopeFromAssignment =
  (
    assignment
  ) => {
    const plain =
      typeof assignment.get ===
        "function"
        ? assignment.get({
            plain:
              true,
          })
        : assignment;

    const scopeTypeField =
      FIELD.scopeType();

    const scopeIdField =
      FIELD.scopeId();

    if (
      scopeTypeField &&
      scopeIdField
    ) {
      return {
        scopeType:
          normalizeScopeType(
            plain[
              scopeTypeField
            ]
          ),

        scopeId:
          plain[
            scopeIdField
          ],
      };
    }

    if (
      FIELD.productId() &&
      plain[
        FIELD.productId()
      ]
    ) {
      return {
        scopeType:
          "PRODUCT",

        scopeId:
          plain[
            FIELD.productId()
          ],
      };
    }

    if (
      FIELD.brandId() &&
      plain[
        FIELD.brandId()
      ]
    ) {
      return {
        scopeType:
          "BRAND",

        scopeId:
          plain[
            FIELD.brandId()
          ],
      };
    }

    if (
      FIELD.categoryId() &&
      plain[
        FIELD.categoryId()
      ]
    ) {
      return {
        scopeType:
          "CATEGORY",

        scopeId:
          plain[
            FIELD.categoryId()
          ],
      };
    }

    return {
      scopeType:
        null,

      scopeId:
        null,
    };
  };

const serializeAssignment =
  (
    assignment
  ) => {
    if (
      !assignment
    ) {
      return null;
    }

    const plain =
      typeof assignment.get ===
        "function"
        ? assignment.get({
            plain:
              true,
          })
        : assignment;

    const scope =
      getScopeFromAssignment(
        plain
      );

    const pricingMethodField =
      FIELD.pricingMethod();

    const percentageField =
      FIELD.percentage();

    const fixedAmountField =
      FIELD.fixedAmount();

    const minimumField =
      FIELD.minimumProductAmount();

    const maximumField =
      FIELD.maximumProductAmount();

    const effectiveFromField =
      FIELD.effectiveFrom();

    const effectiveUntilField =
      FIELD.effectiveUntil();

    const priorityField =
      FIELD.priority();

    const activeField =
      FIELD.isActive();

    return {
      ...plain,

      schemeId:
        plain[
          FIELD.schemeId()
        ],

      scopeType:
        scope.scopeType,

      scopeId:
        scope.scopeId,

      pricingMethod:
        pricingMethodField
          ? plain[
              pricingMethodField
            ] ||
            null
          : null,

      percentage:
        percentageField
          ? toNullableNumber(
              plain[
                percentageField
              ]
            )
          : null,

      fixedAmount:
        fixedAmountField
          ? toNullableNumber(
              plain[
                fixedAmountField
              ]
            )
          : null,

      minimumProductAmount:
        minimumField
          ? toNullableNumber(
              plain[
                minimumField
              ]
            )
          : null,

      maximumProductAmount:
        maximumField
          ? toNullableNumber(
              plain[
                maximumField
              ]
            )
          : null,

      effectiveFrom:
        effectiveFromField
          ? plain[
              effectiveFromField
            ] ||
            null
          : null,

      effectiveUntil:
        effectiveUntilField
          ? plain[
              effectiveUntilField
            ] ||
            null
          : null,

      priority:
        priorityField
          ? Number(
              plain[
                priorityField
              ] ||
                0
            )
          : 0,

      isActive:
        activeField
          ? plain[
              activeField
            ] !==
            false
          : true,
    };
  };

const buildWriteValues =
  ({
    companyId,
    userId,
    payload,
    current = null,
  }) => {
    const scopeType =
      payload.scopeType !==
      undefined
        ? normalizeScopeType(
            payload.scopeType
          )
        : getScopeFromAssignment(
            current
          )
            .scopeType;

    const scopeId =
      payload.scopeId !==
      undefined
        ? String(
            payload.scopeId ||
              ""
          ).trim()
        : getScopeFromAssignment(
            current
          )
            .scopeId;

    validateScopeType(
      scopeType
    );

    if (
      !scopeId
    ) {
      throw new AppError(
        "Assignment target is required.",
        400,
        "PROTECTION_ASSIGNMENT_SCOPE_ID_REQUIRED"
      );
    }

    const schemeId =
      payload.schemeId !==
      undefined
        ? String(
            payload.schemeId ||
              ""
          ).trim()
        : current
          ? current[
              FIELD.schemeId()
            ]
          : "";

    if (
      !schemeId
    ) {
      throw new AppError(
        "Protection scheme is required.",
        400,
        "PROTECTION_ASSIGNMENT_SCHEME_REQUIRED"
      );
    }

    const pricingMethodField =
      FIELD.pricingMethod();

    const percentageField =
      FIELD.percentage();

    const fixedAmountField =
      FIELD.fixedAmount();

    let pricingMethod =
      null;

    if (
      payload.pricingMethod !==
      undefined
    ) {
      pricingMethod =
        payload
          .pricingMethod
          ? String(
              payload
                .pricingMethod
            )
              .trim()
              .toUpperCase()
          : null;
    } else if (
      current &&
      pricingMethodField
    ) {
      pricingMethod =
        current[
          pricingMethodField
        ] ||
        null;
    }

    if (
      pricingMethod &&
      !PRICING_METHODS.includes(
        pricingMethod
      )
    ) {
      throw new AppError(
        "Override pricing method must be PERCENTAGE or FIXED.",
        400,
        "PROTECTION_ASSIGNMENT_PRICING_METHOD_INVALID"
      );
    }

    let percentage =
      payload.percentage !==
      undefined
        ? toNullableNumber(
            payload.percentage
          )
        : current &&
            percentageField
          ? toNullableNumber(
              current[
                percentageField
              ]
            )
          : null;

    let fixedAmount =
      payload.fixedAmount !==
      undefined
        ? toNullableNumber(
            payload.fixedAmount
          )
        : current &&
            fixedAmountField
          ? toNullableNumber(
              current[
                fixedAmountField
              ]
            )
          : null;

    if (
      pricingMethod ===
      "PERCENTAGE"
    ) {
      if (
        percentage ===
          null ||
        percentage <=
          0 ||
        percentage >
          100
      ) {
        throw new AppError(
          "Percentage override must be greater than 0 and not more than 100.",
          400,
          "PROTECTION_ASSIGNMENT_PERCENTAGE_INVALID"
        );
      }

      fixedAmount =
        null;
    } else if (
      pricingMethod ===
      "FIXED"
    ) {
      if (
        fixedAmount ===
          null ||
        fixedAmount <
          0
      ) {
        throw new AppError(
          "Fixed amount override must be zero or greater.",
          400,
          "PROTECTION_ASSIGNMENT_FIXED_AMOUNT_INVALID"
        );
      }

      percentage =
        null;
    } else {
      percentage =
        null;

      fixedAmount =
        null;
    }

    const minimumField =
      FIELD.minimumProductAmount();

    const maximumField =
      FIELD.maximumProductAmount();

    const minimumProductAmount =
      payload.minimumProductAmount !==
      undefined
        ? toNullableNumber(
            payload.minimumProductAmount
          )
        : current &&
            minimumField
          ? toNullableNumber(
              current[
                minimumField
              ]
            )
          : null;

    const maximumProductAmount =
      payload.maximumProductAmount !==
      undefined
        ? toNullableNumber(
            payload.maximumProductAmount
          )
        : current &&
            maximumField
          ? toNullableNumber(
              current[
                maximumField
              ]
            )
          : null;

    if (
      minimumProductAmount !==
        null &&
      minimumProductAmount <
        0
    ) {
      throw new AppError(
        "Minimum product amount cannot be negative.",
        400,
        "PROTECTION_ASSIGNMENT_MINIMUM_AMOUNT_INVALID"
      );
    }

    if (
      maximumProductAmount !==
        null &&
      maximumProductAmount <
        0
    ) {
      throw new AppError(
        "Maximum product amount cannot be negative.",
        400,
        "PROTECTION_ASSIGNMENT_MAXIMUM_AMOUNT_INVALID"
      );
    }

    if (
      minimumProductAmount !==
        null &&
      maximumProductAmount !==
        null &&
      maximumProductAmount <
        minimumProductAmount
    ) {
      throw new AppError(
        "Maximum product amount cannot be less than minimum product amount.",
        400,
        "PROTECTION_ASSIGNMENT_AMOUNT_RANGE_INVALID"
      );
    }

    const effectiveFromField =
      FIELD.effectiveFrom();

    const effectiveUntilField =
      FIELD.effectiveUntil();

    const effectiveFrom =
      payload.effectiveFrom !==
      undefined
        ? normalizeDate(
            payload.effectiveFrom
          )
        : current &&
            effectiveFromField
          ? current[
              effectiveFromField
            ] ||
            null
          : null;

    const effectiveUntil =
      payload.effectiveUntil !==
      undefined
        ? normalizeDate(
            payload.effectiveUntil
          )
        : current &&
            effectiveUntilField
          ? current[
              effectiveUntilField
            ] ||
            null
          : null;

    if (
      effectiveFrom &&
      effectiveUntil &&
      effectiveUntil <
        effectiveFrom
    ) {
      throw new AppError(
        "Effective until cannot be earlier than effective from.",
        400,
        "PROTECTION_ASSIGNMENT_DATE_RANGE_INVALID"
      );
    }

    const values = {
      companyId,

      [FIELD.schemeId()]:
        schemeId,

      ...buildScopeWhere({
        scopeType,
        scopeId,
      }),
    };

    if (
      pricingMethodField
    ) {
      values[
        pricingMethodField
      ] =
        pricingMethod;
    }

    if (
      percentageField
    ) {
      values[
        percentageField
      ] =
        percentage;
    }

    if (
      fixedAmountField
    ) {
      values[
        fixedAmountField
      ] =
        fixedAmount;
    }

    if (
      minimumField
    ) {
      values[
        minimumField
      ] =
        minimumProductAmount;
    }

    if (
      maximumField
    ) {
      values[
        maximumField
      ] =
        maximumProductAmount;
    }

    if (
      effectiveFromField
    ) {
      values[
        effectiveFromField
      ] =
        effectiveFrom;
    }

    if (
      effectiveUntilField
    ) {
      values[
        effectiveUntilField
      ] =
        effectiveUntil;
    }

    if (
      FIELD.priority()
    ) {
      values[
        FIELD.priority()
      ] =
        payload.priority !==
        undefined
          ? Number(
              payload.priority ||
                0
            )
          : current
            ? Number(
                current[
                  FIELD.priority()
                ] ||
                  0
              )
            : 0;
    }

    if (
      FIELD.isActive()
    ) {
      values[
        FIELD.isActive()
      ] =
        payload.isActive !==
        undefined
          ? Boolean(
              payload.isActive
            )
          : current
            ? current[
                FIELD.isActive()
              ] !==
              false
            : true;
    }

    if (
      FIELD.updatedBy()
    ) {
      values[
        FIELD.updatedBy()
      ] =
        userId;
    }

    if (
      !current &&
      FIELD.createdBy()
    ) {
      values[
        FIELD.createdBy()
      ] =
        userId;
    }

    return {
      values,
      scopeType,
      scopeId,
      schemeId,
    };
  };

const ensureNoDuplicate =
  async ({
    companyId,
    schemeId,
    scopeType,
    scopeId,
    excludeId = null,
    transaction,
  }) => {
    const where = {
      companyId,

      [FIELD.schemeId()]:
        schemeId,

      ...buildScopeWhere({
        scopeType,
        scopeId,
      }),
    };

    if (
      excludeId
    ) {
      where.id = {
        [Op.ne]:
          excludeId,
      };
    }

    const duplicate =
      await db
        .ProtectionSchemeAssignment
        .findOne({
          where,
          transaction,
        });

    if (
      duplicate
    ) {
      throw new AppError(
        "This protection scheme is already assigned to the selected target.",
        409,
        "PROTECTION_ASSIGNMENT_EXISTS"
      );
    }
  };

const resolveScopeDetails =
  async (
    rows,
    companyId
  ) => {
    const productIds =
      new Set();

    const brandIds =
      new Set();

    const categoryIds =
      new Set();

    for (
      const row of
      rows
    ) {
      const {
        scopeType,
        scopeId,
      } =
        getScopeFromAssignment(
          row
        );

      if (
        scopeType ===
        "PRODUCT" &&
        scopeId
      ) {
        productIds.add(
          scopeId
        );
      }

      if (
        scopeType ===
        "BRAND" &&
        scopeId
      ) {
        brandIds.add(
          scopeId
        );
      }

      if (
        scopeType ===
        "CATEGORY" &&
        scopeId
      ) {
        categoryIds.add(
          scopeId
        );
      }
    }

    const [
      products,
      brands,
      categories,
    ] =
      await Promise.all([
        productIds.size
          ? db.Product.findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    Array.from(
                      productIds
                    ),
                },
              },

              attributes: [
                "id",
                "name",
                ...(db.Product
                  .rawAttributes
                  ?.slug
                  ? [
                      "slug",
                    ]
                  : []),
              ],
            })
          : [],

        brandIds.size
          ? db.Brand.findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    Array.from(
                      brandIds
                    ),
                },
              },

              attributes: [
                "id",
                "name",
                ...(db.Brand
                  .rawAttributes
                  ?.code
                  ? [
                      "code",
                    ]
                  : []),
              ],
            })
          : [],

        categoryIds.size
          ? db.Category.findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    Array.from(
                      categoryIds
                    ),
                },
              },

              attributes: [
                "id",
                "name",
                ...(db.Category
                  .rawAttributes
                  ?.slug
                  ? [
                      "slug",
                    ]
                  : []),
              ],
            })
          : [],
      ]);

    return {
      productMap:
        new Map(
          products.map(
            (
              item
            ) => [
              item.id,
              item.get({
                plain:
                  true,
              }),
            ]
          )
        ),

      brandMap:
        new Map(
          brands.map(
            (
              item
            ) => [
              item.id,
              item.get({
                plain:
                  true,
              }),
            ]
          )
        ),

      categoryMap:
        new Map(
          categories.map(
            (
              item
            ) => [
              item.id,
              item.get({
                plain:
                  true,
              }),
            ]
          )
        ),
    };
  };

const attachDisplayData =
  async (
    rows,
    companyId
  ) => {
    const schemeIds =
      Array.from(
        new Set(
          rows
            .map(
              (
                row
              ) =>
                row[
                  FIELD.schemeId()
                ]
            )
            .filter(
              Boolean
            )
        )
      );

    const schemes =
      schemeIds.length
        ? await db
            .ProtectionScheme
            .findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    schemeIds,
                },
              },
            })
        : [];

    const schemeMap =
      new Map(
        schemes.map(
          (
            scheme
          ) => [
            scheme.id,
            scheme.get({
              plain:
                true,
            }),
          ]
        )
      );

    const targets =
      await resolveScopeDetails(
        rows,
        companyId
      );

    return rows.map(
      (
        row
      ) => {
        const serialized =
          serializeAssignment(
            row
          );

        let target =
          null;

        if (
          serialized.scopeType ===
          "PRODUCT"
        ) {
          target =
            targets
              .productMap
              .get(
                serialized.scopeId
              ) ||
            null;
        }

        if (
          serialized.scopeType ===
          "BRAND"
        ) {
          target =
            targets
              .brandMap
              .get(
                serialized.scopeId
              ) ||
            null;
        }

        if (
          serialized.scopeType ===
          "CATEGORY"
        ) {
          target =
            targets
              .categoryMap
              .get(
                serialized.scopeId
              ) ||
            null;
        }

        return {
          ...serialized,

          scheme:
            schemeMap.get(
              serialized
                .schemeId
            ) ||
            null,

          target,
        };
      }
    );
  };

const listProtectionAssignments =
  async ({
    companyId,
    page = 1,
    pageSize = 30,
    schemeId,
    scopeType,
    scopeId,
    isActive,
    search,
  }) => {
    ensureModelConfigured();

    const where = {
      companyId,
    };

    if (
      schemeId
    ) {
      where[
        FIELD.schemeId()
      ] =
        schemeId;
    }

    if (
      scopeType
    ) {
      const normalized =
        normalizeScopeType(
          scopeType
        );

      validateScopeType(
        normalized
      );

      if (
        scopeId
      ) {
        Object.assign(
          where,
          buildScopeWhere({
            scopeType:
              normalized,

            scopeId,
          })
        );
      } else if (
        FIELD.scopeType()
      ) {
        where[
          FIELD.scopeType()
        ] =
          normalized;
      } else {
        const idField =
          normalized ===
          "PRODUCT"
            ? FIELD.productId()
            : normalized ===
              "BRAND"
              ? FIELD.brandId()
              : FIELD.categoryId();

        if (
          idField
        ) {
          where[
            idField
          ] = {
            [Op.ne]:
              null,
          };
        }
      }
    }

    if (
      typeof isActive ===
        "boolean" &&
      FIELD.isActive()
    ) {
      where[
        FIELD.isActive()
      ] =
        isActive;
    }

    const normalizedPage =
      Number(
        page
      );

    const normalizedPageSize =
      Number(
        pageSize
      );

    const offset =
      (
        normalizedPage -
        1
      ) *
      normalizedPageSize;

    const order = [];

    if (
      FIELD.priority()
    ) {
      order.push([
        FIELD.priority(),
        "ASC",
      ]);
    }

    order.push([
      "createdAt",
      "DESC",
    ]);

    const result =
      await db
        .ProtectionSchemeAssignment
        .findAndCountAll({
          where,

          limit:
            normalizedPageSize,

          offset,

          order,
        });

    let rows =
      await attachDisplayData(
        result.rows,
        companyId
      );

    if (
      search
    ) {
      const needle =
        String(
          search
        )
          .trim()
          .toLowerCase();

      rows =
        rows.filter(
          (
            item
          ) =>
            [
              item.scheme
                ?.name,
              item.scheme
                ?.code,
              item.target
                ?.name,
              item.target
                ?.code,
              item.target
                ?.slug,
              item.scopeType,
            ]
              .filter(
                Boolean
              )
              .some(
                (
                  value
                ) =>
                  String(
                    value
                  )
                    .toLowerCase()
                    .includes(
                      needle
                    )
              )
        );
    }

    return {
      rows,

      pagination: {
        page:
          normalizedPage,

        pageSize:
          normalizedPageSize,

        totalItems:
          result.count,

        totalPages:
          Math.ceil(
            result.count /
              normalizedPageSize
          ),
      },
    };
  };

const getProtectionAssignmentById =
  async ({
    companyId,
    assignmentId,
    transaction,
  }) => {
    ensureModelConfigured();

    const assignment =
      await db
        .ProtectionSchemeAssignment
        .findOne({
          where: {
            id:
              assignmentId,

            companyId,
          },

          transaction,
        });

    if (
      !assignment
    ) {
      throw new AppError(
        "Protection assignment not found.",
        404,
        "PROTECTION_ASSIGNMENT_NOT_FOUND"
      );
    }

    const [
      result,
    ] =
      await attachDisplayData(
        [
          assignment,
        ],
        companyId
      );

    return result;
  };

const createProtectionAssignment =
  async ({
    companyId,
    userId,
    payload,
  }) => {
    ensureModelConfigured();

    const transaction =
      await db
        .sequelize
        .transaction();

    try {
      const {
        values,
        schemeId,
        scopeType,
        scopeId,
      } =
        buildWriteValues({
          companyId,
          userId,
          payload,
        });

      await validateScheme({
        companyId,
        schemeId,
        transaction,
      });

      await validateScopeTarget({
        companyId,
        scopeType,
        scopeId,
        transaction,
      });

      await ensureNoDuplicate({
        companyId,
        schemeId,
        scopeType,
        scopeId,
        transaction,
      });

      const assignment =
        await db
          .ProtectionSchemeAssignment
          .create(
            values,
            {
              transaction,
            }
          );

      await transaction
        .commit();

      return getProtectionAssignmentById({
        companyId,
        assignmentId:
          assignment.id,
      });
    } catch (
      error
    ) {
      if (
        !transaction.finished
      ) {
        await transaction
          .rollback();
      }

      throw error;
    }
  };

const updateProtectionAssignment =
  async ({
    companyId,
    assignmentId,
    userId,
    payload,
  }) => {
    ensureModelConfigured();

    const transaction =
      await db
        .sequelize
        .transaction();

    try {
      const assignment =
        await db
          .ProtectionSchemeAssignment
          .findOne({
            where: {
              id:
                assignmentId,

              companyId,
            },

            transaction,

            lock:
              transaction
                .LOCK
                .UPDATE,
          });

      if (
        !assignment
      ) {
        throw new AppError(
          "Protection assignment not found.",
          404,
          "PROTECTION_ASSIGNMENT_NOT_FOUND"
        );
      }

      const {
        values,
        schemeId,
        scopeType,
        scopeId,
      } =
        buildWriteValues({
          companyId,
          userId,
          payload,
          current:
            assignment,
        });

      await validateScheme({
        companyId,
        schemeId,
        transaction,
      });

      await validateScopeTarget({
        companyId,
        scopeType,
        scopeId,
        transaction,
      });

      await ensureNoDuplicate({
        companyId,
        schemeId,
        scopeType,
        scopeId,
        excludeId:
          assignment.id,
        transaction,
      });

      await assignment.update(
        values,
        {
          transaction,
        }
      );

      await transaction
        .commit();

      return getProtectionAssignmentById({
        companyId,
        assignmentId:
          assignment.id,
      });
    } catch (
      error
    ) {
      if (
        !transaction.finished
      ) {
        await transaction
          .rollback();
      }

      throw error;
    }
  };

const changeProtectionAssignmentStatus =
  async ({
    companyId,
    assignmentId,
    userId,
    isActive,
  }) => {
    ensureModelConfigured();

    const assignment =
      await db
        .ProtectionSchemeAssignment
        .findOne({
          where: {
            id:
              assignmentId,

            companyId,
          },
        });

    if (
      !assignment
    ) {
      throw new AppError(
        "Protection assignment not found.",
        404,
        "PROTECTION_ASSIGNMENT_NOT_FOUND"
      );
    }

    if (
      !FIELD.isActive()
    ) {
      throw new AppError(
        "ProtectionSchemeAssignment does not contain an active-status field.",
        500,
        "PROTECTION_ASSIGNMENT_STATUS_FIELD_MISSING"
      );
    }

    const values = {
      [FIELD.isActive()]:
        isActive,
    };

    if (
      FIELD.updatedBy()
    ) {
      values[
        FIELD.updatedBy()
      ] =
        userId;
    }

    await assignment.update(
      values
    );

    return getProtectionAssignmentById({
      companyId,
      assignmentId,
    });
  };

const deleteProtectionAssignment =
  async ({
    companyId,
    assignmentId,
  }) => {
    ensureModelConfigured();

    const assignment =
      await db
        .ProtectionSchemeAssignment
        .findOne({
          where: {
            id:
              assignmentId,

            companyId,
          },
        });

    if (
      !assignment
    ) {
      throw new AppError(
        "Protection assignment not found.",
        404,
        "PROTECTION_ASSIGNMENT_NOT_FOUND"
      );
    }

    await assignment
      .destroy();

    return {
      id:
        assignmentId,
    };
  };

module.exports = {
  listProtectionAssignments,
  getProtectionAssignmentById,
  createProtectionAssignment,
  updateProtectionAssignment,
  changeProtectionAssignmentStatus,
  deleteProtectionAssignment,
};
