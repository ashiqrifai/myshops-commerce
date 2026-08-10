const {
    Op,
  } = require("sequelize");
  
  const db = require(
    "../../models"
  );
  
  const AppError = require(
    "../../utils/AppError"
  );
  
  const {
    normalizeNullable,
    generatePriceListCode,
  } = require(
    "./priceList.utils"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Includes
  |--------------------------------------------------------------------------
  */
  
  const PRICE_LIST_INCLUDE = [
    {
      model: db.User,
      as: "createdByUser",
      required: false,
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
      ],
    },
  
    {
      model: db.User,
      as: "updatedByUser",
      required: false,
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
      ],
    },
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const normalizeUppercase = (
    value,
    fallback = null
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return fallback;
    }
  
    const normalized =
      String(value)
        .trim()
        .toUpperCase();
  
    return normalized || fallback;
  };
  
  const normalizeDate = (
    value
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }
  
    const parsedDate =
      value instanceof Date
        ? value
        : new Date(value);
  
    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new AppError(
        "A supplied price-list date is invalid.",
        400,
        "PRICE_LIST_DATE_INVALID"
      );
    }
  
    return parsedDate;
  };
  
  const validateDateRange = ({
    validFrom,
    validUntil,
  }) => {
    if (
      !validFrom ||
      !validUntil
    ) {
      return;
    }
  
    const fromTime =
      new Date(
        validFrom
      ).getTime();
  
    const untilTime =
      new Date(
        validUntil
      ).getTime();
  
    if (
      untilTime <
      fromTime
    ) {
      throw new AppError(
        "Valid until must be later than or equal to valid from.",
        400,
        "PRICE_LIST_DATE_RANGE_INVALID"
      );
    }
  };
  
  const getChangedFields = (
    oldValues,
    newValues
  ) => {
    if (
      !oldValues ||
      !newValues
    ) {
      return null;
    }
  
    return Object.keys(
      newValues
    ).filter((field) => {
      return (
        JSON.stringify(
          oldValues[field]
        ) !==
        JSON.stringify(
          newValues[field]
        )
      );
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Unique Code and Name
  |--------------------------------------------------------------------------
  */
  
  const ensureUniquePriceList =
    async ({
      companyId,
      code,
      name,
      excludeId,
      transaction,
    }) => {
      const normalizedName =
        String(name)
          .trim()
          .toLowerCase();
  
      const where = {
        companyId,
  
        [Op.or]: [
          {
            code,
          },
  
          db.sequelize.where(
            db.sequelize.fn(
              "LOWER",
              db.sequelize.col(
                "name"
              )
            ),
            normalizedName
          ),
        ],
      };
  
      if (excludeId) {
        where.id = {
          [Op.ne]:
            excludeId,
        };
      }
  
      const existing =
        await db.PriceList.findOne({
          where,
          transaction,
        });
  
      if (!existing) {
        return;
      }
  
      if (
        existing.code ===
        code
      ) {
        throw new AppError(
          `A price list with code "${code}" already exists.`,
          409,
          "PRICE_LIST_CODE_EXISTS"
        );
      }
  
      throw new AppError(
        `A price list with name "${name}" already exists.`,
        409,
        "PRICE_LIST_NAME_EXISTS"
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Default Price List
  |--------------------------------------------------------------------------
  */
  
  const clearOtherDefaults =
    async ({
      companyId,
      excludeId,
      userId,
      transaction,
    }) => {
      const where = {
        companyId,
        isDefault: true,
      };
  
      if (excludeId) {
        where.id = {
          [Op.ne]:
            excludeId,
        };
      }
  
      await db.PriceList.update(
        {
          isDefault: false,
          updatedBy: userId,
        },
        {
          where,
          transaction,
        }
      );
    };
  
  const ensureDefaultPriceListExists =
    async ({
      companyId,
      excludeId,
      transaction,
    }) => {
      const where = {
        companyId,
        isDefault: true,
        isActive: true,
      };
  
      if (excludeId) {
        where.id = {
          [Op.ne]:
            excludeId,
        };
      }
  
      const defaultCount =
        await db.PriceList.count({
          where,
          transaction,
        });
  
      return defaultCount > 0;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Audit Log
  |--------------------------------------------------------------------------
  */
  
  const createAuditLog =
    async ({
      companyId,
      priceListId,
      action,
      oldValues,
      newValues,
      userId,
      ipAddress,
      userAgent,
      transaction,
    }) => {
      if (
        !db.PriceAuditLog
      ) {
        return;
      }
  
      await db.PriceAuditLog.create(
        {
          companyId,
  
          priceListId,
  
          productVariantId:
            null,
  
          productVariantPriceId:
            null,
  
          action,
  
          oldValues:
            oldValues || null,
  
          newValues:
            newValues || null,
  
          changedFields:
            getChangedFields(
              oldValues,
              newValues
            ),
  
          changedBy:
            userId || null,
  
          ipAddress:
            normalizeNullable(
              ipAddress
            ),
  
          userAgent:
            normalizeNullable(
              userAgent
            ),
        },
        {
          transaction,
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Price List
  |--------------------------------------------------------------------------
  */
  
  const getPriceListById =
    async ({
      companyId,
      priceListId,
      transaction,
    }) => {
      const priceList =
        await db.PriceList.findOne({
          where: {
            id: priceListId,
            companyId,
          },
  
          include:
            PRICE_LIST_INCLUDE,
  
          transaction,
        });
  
      if (!priceList) {
        throw new AppError(
          "Price list not found.",
          404,
          "PRICE_LIST_NOT_FOUND"
        );
      }
  
      return priceList;
    };

/*
|--------------------------------------------------------------------------
| List Price Lists
|--------------------------------------------------------------------------
*/

const listPriceLists = async ({
    companyId,
    page = 1,
    pageSize = 30,
    search,
    priceListType,
    channelCode,
    currencyCode,
    isActive,
    isDefault,
    sortBy = "priority",
    sortDirection = "ASC",
  }) => {
    const where = {
      companyId,
    };
  
    if (priceListType) {
      where.priceListType =
        normalizeUppercase(
          priceListType
        );
    }
  
    if (channelCode) {
      where.channelCode =
        normalizeUppercase(
          channelCode
        );
    }
  
    if (currencyCode) {
      where.currencyCode =
        normalizeUppercase(
          currencyCode
        );
    }
  
    if (
      typeof isActive ===
      "boolean"
    ) {
      where.isActive =
        isActive;
    }
  
    if (
      typeof isDefault ===
      "boolean"
    ) {
      where.isDefault =
        isDefault;
    }
  
    if (search) {
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
  
        {
          channelCode: {
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
      (normalizedPage - 1) *
      normalizedPageSize;
  
    const result =
      await db.PriceList.findAndCountAll({
        where,
  
        include:
          PRICE_LIST_INCLUDE,
  
        distinct: true,
  
        limit:
          normalizedPageSize,
  
        offset,
  
        order: [
          [
            sortBy,
            String(
              sortDirection
            ).toUpperCase(),
          ],
  
          [
            "priority",
            "ASC",
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
  
  /*
  |--------------------------------------------------------------------------
  | Create Price List
  |--------------------------------------------------------------------------
  */
  
  const createPriceList =
    async ({
      companyId,
      userId,
      payload,
      ipAddress,
      userAgent,
    }) => {
      const transaction =
        await db.sequelize.transaction();
  
      try {
        const name =
          payload.name.trim();
  
        const code =
          generatePriceListCode(
            payload.code ||
              name
          );
  
        if (!code) {
          throw new AppError(
            "Price list code could not be generated.",
            400,
            "PRICE_LIST_CODE_REQUIRED"
          );
        }
  
        await ensureUniquePriceList({
          companyId,
          code,
          name,
          transaction,
        });
  
        const totalPriceLists =
          await db.PriceList.count({
            where: {
              companyId,
            },
            transaction,
          });
  
        const isDefault =
          payload.isDefault ===
            true ||
          totalPriceLists === 0;
  
        const isActive =
          isDefault
            ? true
            : payload.isActive !==
              false;
  
        const validFrom =
          normalizeDate(
            payload.validFrom
          );
  
        const validUntil =
          normalizeDate(
            payload.validUntil
          );
  
        validateDateRange({
          validFrom,
          validUntil,
        });
  
        if (isDefault) {
          await clearOtherDefaults({
            companyId,
            userId,
            transaction,
          });
        }
  
        const priceList =
          await db.PriceList.create(
            {
              companyId,
  
              code,
  
              name,
  
              description:
                normalizeNullable(
                  payload.description
                ),
  
              priceListType:
                normalizeUppercase(
                  payload.priceListType,
                  "RETAIL"
                ),
  
              channelCode:
                normalizeUppercase(
                  payload.channelCode,
                  "ALL"
                ),
  
              currencyCode:
                normalizeUppercase(
                  payload.currencyCode,
                  "AED"
                ),
  
              isTaxInclusive:
                payload.isTaxInclusive !==
                false,
  
              priority:
                Number(
                  payload.priority ??
                    100
                ),
  
              validFrom,
  
              validUntil,
  
              isDefault,
  
              isActive,
  
              createdBy:
                userId,
  
              updatedBy:
                userId,
            },
            {
              transaction,
            }
          );
  
        await createAuditLog({
          companyId,
  
          priceListId:
            priceList.id,
  
          action:
            "CREATE",
  
          oldValues:
            null,
  
          newValues:
            priceList.toJSON(),
  
          userId,
  
          ipAddress,
  
          userAgent,
  
          transaction,
        });
  
        await transaction.commit();
  
        return getPriceListById({
          companyId,
  
          priceListId:
            priceList.id,
        });
      } catch (error) {
        if (
          !transaction.finished
        ) {
          await transaction.rollback();
        }
  
        throw error;
      }
    };

/*
|--------------------------------------------------------------------------
| Update Price List
|--------------------------------------------------------------------------
*/

const updatePriceList =
  async ({
    companyId,
    priceListId,
    userId,
    payload,
    ipAddress,
    userAgent,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const priceList =
        await db.PriceList.findOne({
          where: {
            id: priceListId,
            companyId,
          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,
        });

      if (!priceList) {
        throw new AppError(
          "Price list not found.",
          404,
          "PRICE_LIST_NOT_FOUND"
        );
      }

      const oldValues =
        priceList.toJSON();

      const name =
        payload.name !==
        undefined
          ? payload.name.trim()
          : priceList.name;

      const code =
        payload.code !==
        undefined
          ? generatePriceListCode(
              payload.code ||
                name
            )
          : priceList.code;

      if (!code) {
        throw new AppError(
          "Price list code could not be generated.",
          400,
          "PRICE_LIST_CODE_REQUIRED"
        );
      }

      await ensureUniquePriceList({
        companyId,
        code,
        name,
        excludeId:
          priceList.id,
        transaction,
      });

      const validFrom =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "validFrom"
          )
          ? normalizeDate(
              payload.validFrom
            )
          : priceList.validFrom;

      const validUntil =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "validUntil"
          )
          ? normalizeDate(
              payload.validUntil
            )
          : priceList.validUntil;

      validateDateRange({
        validFrom,
        validUntil,
      });

      const wantsDefault =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "isDefault"
          )
          ? payload.isDefault ===
            true
          : priceList.isDefault;

      const wantsActive =
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "isActive"
          )
          ? payload.isActive ===
            true
          : priceList.isActive;

      if (
        priceList.isDefault &&
        wantsDefault === false
      ) {
        const anotherDefaultExists =
          await ensureDefaultPriceListExists({
            companyId,
            excludeId:
              priceList.id,
            transaction,
          });

        if (
          !anotherDefaultExists
        ) {
          throw new AppError(
            "You cannot remove the default status until another active price list is set as default.",
            409,
            "PRICE_LIST_DEFAULT_REQUIRED"
          );
        }
      }

      if (
        priceList.isDefault &&
        wantsActive === false
      ) {
        throw new AppError(
          "The default price list cannot be deactivated. Set another active price list as default first.",
          409,
          "DEFAULT_PRICE_LIST_DEACTIVATION_NOT_ALLOWED"
        );
      }

      if (
        wantsDefault &&
        wantsActive === false
      ) {
        throw new AppError(
          "A default price list must be active.",
          400,
          "DEFAULT_PRICE_LIST_MUST_BE_ACTIVE"
        );
      }

      if (wantsDefault) {
        await clearOtherDefaults({
          companyId,
          excludeId:
            priceList.id,
          userId,
          transaction,
        });
      }

      const updateValues = {
        name,

        code,

        validFrom,

        validUntil,

        isDefault:
          wantsDefault,

        isActive:
          wantsDefault
            ? true
            : wantsActive,

        updatedBy:
          userId,
      };

      const nullableFields = [
        "description",
      ];

      for (
        const field of
        nullableFields
      ) {
        if (
          Object.prototype
            .hasOwnProperty.call(
              payload,
              field
            )
        ) {
          updateValues[field] =
            normalizeNullable(
              payload[field]
            );
        }
      }

      const uppercaseFields = [
        "priceListType",
        "channelCode",
        "currencyCode",
      ];

      for (
        const field of
        uppercaseFields
      ) {
        if (
          Object.prototype
            .hasOwnProperty.call(
              payload,
              field
            )
        ) {
          updateValues[field] =
            normalizeUppercase(
              payload[field]
            );
        }
      }

      if (
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "isTaxInclusive"
          )
      ) {
        updateValues
          .isTaxInclusive =
          payload.isTaxInclusive ===
          true;
      }

      if (
        Object.prototype
          .hasOwnProperty.call(
            payload,
            "priority"
          )
      ) {
        updateValues.priority =
          Number(
            payload.priority
          );
      }

      await priceList.update(
        updateValues,
        {
          transaction,
        }
      );

      await createAuditLog({
        companyId,

        priceListId:
          priceList.id,

        action:
          "UPDATE",

        oldValues,

        newValues:
          priceList.toJSON(),

        userId,

        ipAddress,

        userAgent,

        transaction,
      });

      await transaction.commit();

      return getPriceListById({
        companyId,

        priceListId:
          priceList.id,
      });
    } catch (error) {
      if (
        !transaction.finished
      ) {
        await transaction.rollback();
      }

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Change Price List Status
|--------------------------------------------------------------------------
*/

const changePriceListStatus =
  async ({
    companyId,
    priceListId,
    userId,
    isActive,
    ipAddress,
    userAgent,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const priceList =
        await db.PriceList.findOne({
          where: {
            id: priceListId,
            companyId,
          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,
        });

      if (!priceList) {
        throw new AppError(
          "Price list not found.",
          404,
          "PRICE_LIST_NOT_FOUND"
        );
      }

      if (
        priceList.isDefault &&
        isActive === false
      ) {
        throw new AppError(
          "The default price list cannot be deactivated. Set another active price list as default first.",
          409,
          "DEFAULT_PRICE_LIST_DEACTIVATION_NOT_ALLOWED"
        );
      }

      if (
        priceList.isActive ===
        isActive
      ) {
        await transaction.commit();

        return getPriceListById({
          companyId,
          priceListId:
            priceList.id,
        });
      }

      const oldValues =
        priceList.toJSON();

      await priceList.update(
        {
          isActive,
          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );

      await createAuditLog({
        companyId,

        priceListId:
          priceList.id,

        action:
          isActive
            ? "ACTIVATE"
            : "DEACTIVATE",

        oldValues,

        newValues:
          priceList.toJSON(),

        userId,

        ipAddress,

        userAgent,

        transaction,
      });

      await transaction.commit();

      return getPriceListById({
        companyId,

        priceListId:
          priceList.id,
      });
    } catch (error) {
      if (
        !transaction.finished
      ) {
        await transaction.rollback();
      }

      throw error;
    }
  };

  /*
|--------------------------------------------------------------------------
| Delete Price List
|--------------------------------------------------------------------------
*/

const deletePriceList =
async ({
  companyId,
  priceListId,
  userId,
  ipAddress,
  userAgent,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const priceList =
      await db.PriceList.findOne({
        where: {
          id: priceListId,
          companyId,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!priceList) {
      throw new AppError(
        "Price list not found.",
        404,
        "PRICE_LIST_NOT_FOUND"
      );
    }

    if (priceList.isDefault) {
      throw new AppError(
        "The default price list cannot be deleted. Set another active price list as default first.",
        409,
        "DEFAULT_PRICE_LIST_DELETE_NOT_ALLOWED"
      );
    }

    const assignedPriceCount =
      await db.ProductVariantPrice.count({
        where: {
          companyId,
          priceListId,
        },

        transaction,
      });

    if (assignedPriceCount > 0) {
      throw new AppError(
        "This price list contains variant prices and cannot be deleted. Deactivate it instead.",
        409,
        "PRICE_LIST_IN_USE"
      );
    }

    const oldValues =
      priceList.toJSON();

    await createAuditLog({
      companyId,

      priceListId:
        priceList.id,

      action:
        "DELETE",

      oldValues,

      newValues:
        null,

      userId,

      ipAddress,

      userAgent,

      transaction,
    });

    await priceList.destroy({
      transaction,
    });

    await transaction.commit();

    return {
      id:
        priceListId,
    };
  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
listPriceLists,
getPriceListById,
createPriceList,
updatePriceList,
changePriceListStatus,
deletePriceList,
};

