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

const ALLOWED_SCHEME_TYPES = [
  "EXTENDED_WARRANTY",
  "DAMAGE_PROTECTION",
];

const ALLOWED_PRICING_METHODS = [
  "PERCENTAGE",
  "FIXED",
];

const normalizeNullable = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
};

const normalizeCode = (
  value
) =>
  String(
    value ||
      ""
  )
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /&/g,
      " AND "
    )
    .replace(
      /[^A-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .replace(
      /_{2,}/g,
      "_"
    );

const toNullableNumber = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : null;
};

const toInteger = (
  value,
  fallback = 0
) => {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? Math.trunc(
        numberValue
      )
    : fallback;
};

const normalizeSchemePayload = (
  payload,
  current = null
) => {
  const schemeType =
    payload.schemeType !==
    undefined
      ? String(
          payload.schemeType
        )
          .trim()
          .toUpperCase()
      : current
        ?.schemeType ||
        "EXTENDED_WARRANTY";

  const pricingMethod =
    payload.pricingMethod !==
    undefined
      ? String(
          payload.pricingMethod
        )
          .trim()
          .toUpperCase()
      : current
        ?.pricingMethod ||
        "PERCENTAGE";

  if (
    !ALLOWED_SCHEME_TYPES.includes(
      schemeType
    )
  ) {
    throw new AppError(
      "Invalid protection scheme type.",
      400,
      "PROTECTION_SCHEME_TYPE_INVALID"
    );
  }

  if (
    !ALLOWED_PRICING_METHODS.includes(
      pricingMethod
    )
  ) {
    throw new AppError(
      "Invalid protection pricing method.",
      400,
      "PROTECTION_PRICING_METHOD_INVALID"
    );
  }

  const name =
    payload.name !==
    undefined
      ? String(
          payload.name ||
            ""
        ).trim()
      : current
        ?.name ||
        "";

  if (!name) {
    throw new AppError(
      "Protection scheme name is required.",
      400,
      "PROTECTION_SCHEME_NAME_REQUIRED"
    );
  }

  const code =
    payload.code !==
    undefined
      ? normalizeCode(
          payload.code ||
            name
        )
      : current
        ?.code ||
        normalizeCode(
          name
        );

  if (!code) {
    throw new AppError(
      "Protection scheme code could not be generated.",
      400,
      "PROTECTION_SCHEME_CODE_REQUIRED"
    );
  }

  const percentage =
    pricingMethod ===
    "PERCENTAGE"
      ? (
          payload.percentage !==
          undefined
            ? toNullableNumber(
                payload.percentage
              )
            : toNullableNumber(
                current
                  ?.percentage
              )
        )
      : null;

  const fixedAmount =
    pricingMethod ===
    "FIXED"
      ? (
          payload.fixedAmount !==
          undefined
            ? toNullableNumber(
                payload.fixedAmount
              )
            : toNullableNumber(
                current
                  ?.fixedAmount
              )
        )
      : null;

  if (
    pricingMethod ===
      "PERCENTAGE" &&
    (
      percentage ===
        null ||
      percentage <=
        0 ||
      percentage >
        100
    )
  ) {
    throw new AppError(
      "Percentage pricing requires a percentage greater than 0 and not more than 100.",
      400,
      "PROTECTION_PERCENTAGE_INVALID"
    );
  }

  if (
    pricingMethod ===
      "FIXED" &&
    (
      fixedAmount ===
        null ||
      fixedAmount <
        0
    )
  ) {
    throw new AppError(
      "Fixed pricing requires a valid fixed amount.",
      400,
      "PROTECTION_FIXED_AMOUNT_INVALID"
    );
  }

  const minimumProductAmount =
    payload.minimumProductAmount !==
    undefined
      ? toNullableNumber(
          payload.minimumProductAmount
        )
      : toNullableNumber(
          current
            ?.minimumProductAmount
        );

  const maximumProductAmount =
    payload.maximumProductAmount !==
    undefined
      ? toNullableNumber(
          payload.maximumProductAmount
        )
      : toNullableNumber(
          current
            ?.maximumProductAmount
        );

  if (
    minimumProductAmount !==
      null &&
    minimumProductAmount <
      0
  ) {
    throw new AppError(
      "Minimum product amount cannot be negative.",
      400,
      "PROTECTION_MIN_AMOUNT_INVALID"
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
      "PROTECTION_MAX_AMOUNT_INVALID"
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
      "PROTECTION_AMOUNT_RANGE_INVALID"
    );
  }

  const durationMonths =
    payload.durationMonths !==
    undefined
      ? toNullableNumber(
          payload.durationMonths
        )
      : toNullableNumber(
          current
            ?.durationMonths
        );

  if (
    durationMonths !==
      null &&
    (
      !Number.isInteger(
        durationMonths
      ) ||
      durationMonths <
        1
    )
  ) {
    throw new AppError(
      "Duration months must be a whole number greater than zero.",
      400,
      "PROTECTION_DURATION_INVALID"
    );
  }

  return {
    name,

    code,

    schemeType,

    description:
      payload.description !==
      undefined
        ? normalizeNullable(
            payload.description
          )
        : current
          ?.description ??
          null,

    durationMonths,

    pricingMethod,

    percentage,

    fixedAmount,

    minimumProductAmount,

    maximumProductAmount,

    currencyCode:
      String(
        payload.currencyCode !==
        undefined
          ? payload.currencyCode ||
            "AED"
          : current
            ?.currencyCode ||
            "AED"
      )
        .trim()
        .toUpperCase(),

    coverageStartMode:
      String(
        payload.coverageStartMode !==
        undefined
          ? payload.coverageStartMode ||
            "AFTER_MANUFACTURER_WARRANTY"
          : current
            ?.coverageStartMode ||
            "AFTER_MANUFACTURER_WARRANTY"
      )
        .trim()
        .toUpperCase(),

    termsAndConditions:
      payload.termsAndConditions !==
      undefined
        ? normalizeNullable(
            payload.termsAndConditions
          )
        : current
          ?.termsAndConditions ??
          null,

    sortOrder:
      payload.sortOrder !==
      undefined
        ? toInteger(
            payload.sortOrder,
            0
          )
        : toInteger(
            current
              ?.sortOrder,
            0
          ),

    isActive:
      payload.isActive !==
      undefined
        ? Boolean(
            payload.isActive
          )
        : current
          ?.isActive !==
          false,
  };
};

const ensureUniqueCode =
  async ({
    companyId,
    code,
    excludeId = null,
    transaction,
  }) => {
    const where = {
      companyId,
      code,
    };

    if (
      excludeId
    ) {
      where.id = {
        [Op.ne]:
          excludeId,
      };
    }

    const existing =
      await db
        .ProtectionScheme
        .findOne({
          where,
          transaction,
        });

    if (
      existing
    ) {
      throw new AppError(
        "A protection scheme with this code already exists.",
        409,
        "PROTECTION_SCHEME_CODE_EXISTS"
      );
    }
  };

const getProtectionSchemeById =
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

const listProtectionSchemes =
  async ({
    companyId,
    page = 1,
    pageSize = 30,
    search,
    schemeType,
    pricingMethod,
    currencyCode,
    isActive,
    sortBy = "sortOrder",
    sortDirection = "ASC",
  }) => {
    const where = {
      companyId,
    };

    if (
      typeof isActive ===
      "boolean"
    ) {
      where.isActive =
        isActive;
    }

    if (
      schemeType
    ) {
      where.schemeType =
        String(
          schemeType
        )
          .trim()
          .toUpperCase();
    }

    if (
      pricingMethod
    ) {
      where.pricingMethod =
        String(
          pricingMethod
        )
          .trim()
          .toUpperCase();
    }

    if (
      currencyCode
    ) {
      where.currencyCode =
        String(
          currencyCode
        )
          .trim()
          .toUpperCase();
    }

    if (
      search
    ) {
      where[Op.or] = [
        {
          name: {
            [Op.iLike]:
              `%${search}%`,
          },
        },

        {
          code: {
            [Op.iLike]:
              `%${search}%`,
          },
        },

        {
          description: {
            [Op.iLike]:
              `%${search}%`,
          },
        },
      ];
    }

    const normalizedPage =
      Number(page);

    const normalizedPageSize =
      Number(pageSize);

    const offset =
      (
        normalizedPage -
        1
      ) *
      normalizedPageSize;

    const result =
      await db
        .ProtectionScheme
        .findAndCountAll({
          where,

          limit:
            normalizedPageSize,

          offset,

          order: [
            [
              sortBy,
              String(
                sortDirection
              )
                .trim()
                .toUpperCase(),
            ],

            [
              "name",
              "ASC",
            ],
          ],
        });

    return {
      rows:
        result.rows,

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

const createProtectionScheme =
  async ({
    companyId,
    userId,
    payload,
  }) => {
    const transaction =
      await db
        .sequelize
        .transaction();

    try {
      const values =
        normalizeSchemePayload(
          payload
        );

      await ensureUniqueCode({
        companyId,
        code:
          values.code,
        transaction,
      });

      const createValues = {
        companyId,
        ...values,
      };

      /*
       * createdBy / updatedBy are used only when
       * those columns exist on your model.
       */
      if (
        db.ProtectionScheme
          .rawAttributes
          ?.createdBy
      ) {
        createValues.createdBy =
          userId;
      }

      if (
        db.ProtectionScheme
          .rawAttributes
          ?.updatedBy
      ) {
        createValues.updatedBy =
          userId;
      }

      const scheme =
        await db
          .ProtectionScheme
          .create(
            createValues,
            {
              transaction,
            }
          );

      await transaction
        .commit();

      return getProtectionSchemeById({
        companyId,
        schemeId:
          scheme.id,
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

const updateProtectionScheme =
  async ({
    companyId,
    schemeId,
    userId,
    payload,
  }) => {
    const transaction =
      await db
        .sequelize
        .transaction();

    try {
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

            lock:
              transaction
                .LOCK
                .UPDATE,
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

      const values =
        normalizeSchemePayload(
          payload,
          scheme
        );

      await ensureUniqueCode({
        companyId,
        code:
          values.code,
        excludeId:
          scheme.id,
        transaction,
      });

      const updateValues = {
        ...values,
      };

      if (
        db.ProtectionScheme
          .rawAttributes
          ?.updatedBy
      ) {
        updateValues.updatedBy =
          userId;
      }

      await scheme.update(
        updateValues,
        {
          transaction,
        }
      );

      await transaction
        .commit();

      return getProtectionSchemeById({
        companyId,
        schemeId:
          scheme.id,
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

const changeProtectionSchemeStatus =
  async ({
    companyId,
    schemeId,
    userId,
    isActive,
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

    const updateValues = {
      isActive,
    };

    if (
      db.ProtectionScheme
        .rawAttributes
        ?.updatedBy
    ) {
      updateValues.updatedBy =
        userId;
    }

    await scheme.update(
      updateValues
    );

    return getProtectionSchemeById({
      companyId,
      schemeId,
    });
  };

const getAssignmentSchemeField =
  () => {
    if (
      !db
        .ProtectionSchemeAssignment
    ) {
      return null;
    }

    const attributes =
      db
        .ProtectionSchemeAssignment
        .rawAttributes ||
      {};

    if (
      attributes.schemeId
    ) {
      return "schemeId";
    }

    if (
      attributes.protectionSchemeId
    ) {
      return "protectionSchemeId";
    }

    return null;
  };

const deleteProtectionScheme =
  async ({
    companyId,
    schemeId,
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

    const assignmentField =
      getAssignmentSchemeField();

    if (
      assignmentField
    ) {
      const assignmentCount =
        await db
          .ProtectionSchemeAssignment
          .count({
            where: {
              companyId,

              [assignmentField]:
                schemeId,
            },
          });

      if (
        assignmentCount >
        0
      ) {
        throw new AppError(
          "This protection scheme is assigned to products, brands or categories and cannot be deleted. Deactivate it instead.",
          409,
          "PROTECTION_SCHEME_IN_USE"
        );
      }
    }

    /*
     * If order protection rows reference the scheme,
     * PostgreSQL/Sequelize should also prevent unsafe
     * deletion through the foreign key.
     */
    await scheme.destroy();

    return {
      id:
        schemeId,
    };
  };

module.exports = {
  listProtectionSchemes,
  getProtectionSchemeById,
  createProtectionScheme,
  updateProtectionScheme,
  changeProtectionSchemeStatus,
  deleteProtectionScheme,
};
