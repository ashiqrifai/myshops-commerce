const {
    Op,
  } = require("sequelize");
  
  const db = require("../../models");
  
  const AppError = require(
    "../../utils/AppError"
  );
  
  const {
    buildVariantPricePayload,
    quantityRangesOverlap,
    dateRangesOverlap,
    calculateDiscount,
  } = require(
    "./variantPrice.utils"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Includes
  |--------------------------------------------------------------------------
  */
  
  const VARIANT_PRICE_INCLUDE = [
    {
      model: db.ProductVariant,
      as: "variant",
      required: true,
      include: [
        {
          model: db.Product,
          as: "product",
          required: false,
        },
      ],
    },
  
    {
      model: db.PriceList,
      as: "priceList",
      required: true,
    },
  
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

  const ensureVariantExists =
  async ({
    companyId,
    variantId,
    transaction,
  }) => {
    const variant =
      await db.ProductVariant.findOne({
        where: {
          id: variantId,
          companyId,
        },

        transaction,
      });

    if (!variant) {
      throw new AppError(
        "Product variant not found.",
        404,
        "PRODUCT_VARIANT_NOT_FOUND"
      );
    }

    return variant;
  };

  const ensurePriceListExists =
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

  const ensureUniqueTier =
  async ({
    companyId,
    payload,
    excludeId,
    transaction,
  }) => {
    const existingPrices =
      await db.ProductVariantPrice.findAll({
        where: {
          companyId,

          productVariantId:
            payload.productVariantId,

          priceListId:
            payload.priceListId,
        },

        transaction,
      });

    for (const row of existingPrices) {
      if (
        excludeId &&
        row.id === excludeId
      ) {
        continue;
      }

      const quantityOverlap =
        quantityRangesOverlap({
          firstMinimum:
            row.minimumQuantity,

          firstMaximum:
            row.maximumQuantity,

          secondMinimum:
            payload.minimumQuantity,

          secondMaximum:
            payload.maximumQuantity,
        });

      if (
        !quantityOverlap
      ) {
        continue;
      }

      const dateOverlap =
        dateRangesOverlap({
          firstFrom:
            row.validFrom,

          firstUntil:
            row.validUntil,

          secondFrom:
            payload.validFrom,

          secondUntil:
            payload.validUntil,
        });
        if (
          dateOverlap
        ) {
          /*
          |--------------------------------------------------------------------------
          | Allow intentional promotional overlays
          |--------------------------------------------------------------------------
          |
          | The same variant + price list may have:
          |
          | - an always-valid base price
          | - a scheduled promotional price
          |
          | provided they use different priorities.
          |
          | Lower priority number wins in the price resolver.
          |--------------------------------------------------------------------------
          */
        
          const existingPriority =
            Number(
              row.priority ??
                100
            );
        
          const incomingPriority =
            Number(
              payload.priority ??
                100
            );
        
          if (
            existingPriority ===
            incomingPriority
          ) {
            throw new AppError(
              "Another pricing tier already exists for this quantity and date range with the same priority.",
              409,
              "VARIANT_PRICE_OVERLAP"
            );
          }
        }
    }
  };

  const createAuditLog =
  async ({
    companyId,
    variantPriceId,
    variantId,
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

    const changedFields =
      oldValues &&
      newValues
        ? Object.keys(
            newValues
          ).filter(
            (key) =>
              JSON.stringify(
                oldValues[key]
              ) !==
              JSON.stringify(
                newValues[key]
              )
          )
        : null;

    await db.PriceAuditLog.create(
      {
        companyId,

        productVariantId:
          variantId,

        productVariantPriceId:
          variantPriceId,

        priceListId,

        action,

        oldValues:
          oldValues || null,

        newValues:
          newValues || null,

        changedFields,

        changedBy:
          userId,

        ipAddress,

        userAgent,
      },

      {
        transaction,
      }
    );
  };

  const decoratePrice =
  (row) => {
    const json =
      row.toJSON();

    return {
      ...json,

      ...calculateDiscount({
        regularPrice:
          json.regularPrice,

        sellingPrice:
          json.sellingPrice,
      }),
    };
  };

  /*
|--------------------------------------------------------------------------
| Get Variant Price
|--------------------------------------------------------------------------
*/

const getVariantPriceById =
async ({
  companyId,
  variantPriceId,
  transaction,
}) => {
  const variantPrice =
    await db.ProductVariantPrice.findOne({
      where: {
        id: variantPriceId,
        companyId,
      },

      include:
        VARIANT_PRICE_INCLUDE,

      transaction,
    });

  if (!variantPrice) {
    throw new AppError(
      "Variant price not found.",
      404,
      "VARIANT_PRICE_NOT_FOUND"
    );
  }

  return decoratePrice(
    variantPrice
  );
};

/*
|--------------------------------------------------------------------------
| List Variant Prices
|--------------------------------------------------------------------------
*/

const listVariantPrices =
async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  productVariantId,
  productId,
  priceListId,
  isActive,
  validOn,
  quantity,
  sortBy = "priority",
  sortDirection = "ASC",
}) => {
  const where = {
    companyId,
  };

  if (productVariantId) {
    where.productVariantId =
      productVariantId;
  }

  if (priceListId) {
    where.priceListId =
      priceListId;
  }

  if (
    typeof isActive ===
    "boolean"
  ) {
    where.isActive =
      isActive;
  }

  if (validOn) {
    const validDate =
      new Date(validOn);

    where[Op.and] = [
      {
        [Op.or]: [
          {
            validFrom: null,
          },
          {
            validFrom: {
              [Op.lte]:
                validDate,
            },
          },
        ],
      },

      {
        [Op.or]: [
          {
            validUntil: null,
          },
          {
            validUntil: {
              [Op.gte]:
                validDate,
            },
          },
        ],
      },
    ];
  }

  if (
    quantity !== undefined &&
    quantity !== null
  ) {
    const normalizedQuantity =
      Number(quantity);

    const quantityClauses = [
      {
        minimumQuantity: {
          [Op.lte]:
            normalizedQuantity,
        },
      },

      {
        [Op.or]: [
          {
            maximumQuantity:
              null,
          },
          {
            maximumQuantity: {
              [Op.gte]:
                normalizedQuantity,
            },
          },
        ],
      },
    ];

    if (
      Array.isArray(
        where[Op.and]
      )
    ) {
      where[Op.and].push(
        ...quantityClauses
      );
    } else {
      where[Op.and] =
        quantityClauses;
    }
  }

  const variantWhere = {};

  if (productId) {
    variantWhere.productId =
      productId;
  }

  if (search) {
    variantWhere[Op.or] = [
      {
        sku: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
      {
        barcode: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
      {
        name: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
    ];
  }

  const hasVariantFilters =
  Reflect.ownKeys(
    variantWhere
  ).length >
  0;

const include =
  VARIANT_PRICE_INCLUDE.map(
    (item) => {
      if (
        item.as !==
        "variant"
      ) {
        return item;
      }

      return {
        ...item,

        required:
          Boolean(
            productId ||
              search
          ) ||
          item.required,

        where:
          hasVariantFilters
            ? variantWhere
            : undefined,
      };
    }
  );

  const normalizedPage =
    Number(page);

  const normalizedPageSize =
    Number(pageSize);

  const result =
    await db.ProductVariantPrice
      .findAndCountAll({
        where,

        include,

        distinct: true,

        limit:
          normalizedPageSize,

        offset:
          (
            normalizedPage -
            1
          ) *
          normalizedPageSize,

        order: [
          [
            sortBy,
            String(
              sortDirection
            ).toUpperCase(),
          ],

          [
            "minimumQuantity",
            "ASC",
          ],

          [
            "validFrom",
            "ASC",
          ],
        ],
      });

  return {
    rows:
      result.rows.map(
        decoratePrice
      ),

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
| Create Variant Price
|--------------------------------------------------------------------------
*/

const createVariantPrice =
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
      /*
      ----------------------------------
      Validate Variant
      ----------------------------------
      */

      const variant =
        await ensureVariantExists({
          companyId,
          variantId:
            payload.productVariantId,
          transaction,
        });

      /*
      ----------------------------------
      Validate Price List
      ----------------------------------
      */

      const priceList =
        await ensurePriceListExists({
          companyId,
          priceListId:
            payload.priceListId,
          transaction,
        });

      /*
      ----------------------------------
      Normalize Payload
      ----------------------------------
      */

      const normalized =
        buildVariantPricePayload({
          payload,
        });

      /*
      ----------------------------------
      Prevent overlapping tiers
      ----------------------------------
      */

      await ensureUniqueTier({
        companyId,

        payload: {
          ...normalized,

          productVariantId:
            variant.id,

          priceListId:
            priceList.id,
        },

        transaction,
      });

      /*
      ----------------------------------
      Create
      ----------------------------------
      */

      const variantPrice =
        await db.ProductVariantPrice.create(
          {
            companyId,

            productVariantId:
              variant.id,

            priceListId:
              priceList.id,

            regularPrice:
              normalized.regularPrice,

            sellingPrice:
              normalized.sellingPrice,

            compareAtPrice:
              normalized.compareAtPrice,

            costPrice:
              normalized.costPrice,

            minimumQuantity:
              normalized.minimumQuantity,

            maximumQuantity:
              normalized.maximumQuantity,

            validFrom:
              normalized.validFrom,

            validUntil:
              normalized.validUntil,

            priority:
              normalized.priority,

            isActive:
              normalized.isActive,

            createdBy:
              userId,

            updatedBy:
              userId,
          },

          {
            transaction,
          }
        );

      /*
      ----------------------------------
      Audit
      ----------------------------------
      */

      await createAuditLog({
        companyId,

        variantPriceId:
          variantPrice.id,

        variantId:
          variant.id,

        priceListId:
          priceList.id,

        action:
          "CREATE",

        oldValues:
          null,

        newValues:
          variantPrice.toJSON(),

        userId,

        ipAddress,

        userAgent,

        transaction,
      });

      await transaction.commit();

      return getVariantPriceById({
        companyId,

        variantPriceId:
          variantPrice.id,
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
| Update Variant Price
|--------------------------------------------------------------------------
*/

const updateVariantPrice =
async ({
  companyId,
  variantPriceId,
  userId,
  payload,
  ipAddress,
  userAgent,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const variantPrice =
      await db.ProductVariantPrice.findOne({
        where: {
          id: variantPriceId,
          companyId,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!variantPrice) {
      throw new AppError(
        "Variant price not found.",
        404,
        "VARIANT_PRICE_NOT_FOUND"
      );
    }

    const oldValues =
      variantPrice.toJSON();

    const productVariantId =
      Object.prototype
        .hasOwnProperty.call(
          payload,
          "productVariantId"
        )
        ? payload.productVariantId
        : variantPrice.productVariantId;

    const priceListId =
      Object.prototype
        .hasOwnProperty.call(
          payload,
          "priceListId"
        )
        ? payload.priceListId
        : variantPrice.priceListId;

    const variant =
      await ensureVariantExists({
        companyId,

        variantId:
          productVariantId,

        transaction,
      });

    const priceList =
      await ensurePriceListExists({
        companyId,

        priceListId,

        transaction,
      });

    const normalized =
      buildVariantPricePayload({
        payload,

        existingPrice:
          variantPrice,
      });

    await ensureUniqueTier({
      companyId,

      payload: {
        ...normalized,

        productVariantId:
          variant.id,

        priceListId:
          priceList.id,
      },

      excludeId:
        variantPrice.id,

      transaction,
    });

    await variantPrice.update(
      {
        productVariantId:
          variant.id,

        priceListId:
          priceList.id,

        regularPrice:
          normalized.regularPrice,

        sellingPrice:
          normalized.sellingPrice,

        compareAtPrice:
          normalized.compareAtPrice,

        costPrice:
          normalized.costPrice,

        minimumQuantity:
          normalized.minimumQuantity,

        maximumQuantity:
          normalized.maximumQuantity,

        validFrom:
          normalized.validFrom,

        validUntil:
          normalized.validUntil,

        priority:
          normalized.priority,

        isActive:
          normalized.isActive,

        updatedBy:
          userId,
      },

      {
        transaction,
      }
    );

    await createAuditLog({
      companyId,

      variantPriceId:
        variantPrice.id,

      variantId:
        variant.id,

      priceListId:
        priceList.id,

      action:
        "UPDATE",

      oldValues,

      newValues:
        variantPrice.toJSON(),

      userId,

      ipAddress,

      userAgent,

      transaction,
    });

    await transaction.commit();

    return getVariantPriceById({
      companyId,

      variantPriceId:
        variantPrice.id,
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
| Change Variant Price Status
|--------------------------------------------------------------------------
*/

const changeVariantPriceStatus =
  async ({
    companyId,
    variantPriceId,
    userId,
    isActive,
    ipAddress,
    userAgent,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const variantPrice =
        await db.ProductVariantPrice.findOne({
          where: {
            id: variantPriceId,
            companyId,
          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,
        });

      if (!variantPrice) {
        throw new AppError(
          "Variant price not found.",
          404,
          "VARIANT_PRICE_NOT_FOUND"
        );
      }

      if (
        variantPrice.isActive ===
        isActive
      ) {
        await transaction.commit();

        return getVariantPriceById({
          companyId,

          variantPriceId:
            variantPrice.id,
        });
      }

      const oldValues =
        variantPrice.toJSON();

      await variantPrice.update(
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

        variantPriceId:
          variantPrice.id,

        variantId:
          variantPrice.productVariantId,

        priceListId:
          variantPrice.priceListId,

        action:
          isActive
            ? "ACTIVATE"
            : "DEACTIVATE",

        oldValues,

        newValues:
          variantPrice.toJSON(),

        userId,

        ipAddress,

        userAgent,

        transaction,
      });

      await transaction.commit();

      return getVariantPriceById({
        companyId,

        variantPriceId:
          variantPrice.id,
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
| Delete Variant Price
|--------------------------------------------------------------------------
*/

const deleteVariantPrice =
  async ({
    companyId,
    variantPriceId,
    userId,
    ipAddress,
    userAgent,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const variantPrice =
        await db.ProductVariantPrice.findOne({
          where: {
            id: variantPriceId,
            companyId,
          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,
        });

      if (!variantPrice) {
        throw new AppError(
          "Variant price not found.",
          404,
          "VARIANT_PRICE_NOT_FOUND"
        );
      }

      const oldValues =
        variantPrice.toJSON();

      await createAuditLog({
        companyId,

        variantPriceId:
          variantPrice.id,

        variantId:
          variantPrice.productVariantId,

        priceListId:
          variantPrice.priceListId,

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

      await variantPrice.destroy({
        transaction,
      });

      await transaction.commit();

      return {
        id:
          variantPriceId,
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
| Get Prices By Variant
|--------------------------------------------------------------------------
*/

const getPricesByVariant =
async ({
  companyId,
  variantId,
  priceListId,
  isActive,
  validOn,
  quantity,
}) => {
  const where = {
    companyId,
    productVariantId:
      variantId,
  };

  if (priceListId) {
    where.priceListId =
      priceListId;
  }

  if (
    typeof isActive ===
    "boolean"
  ) {
    where.isActive =
      isActive;
  }

  if (validOn) {
    const date =
      new Date(validOn);

    where[Op.and] = [
      {
        [Op.or]: [
          {
            validFrom: null,
          },
          {
            validFrom: {
              [Op.lte]:
                date,
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
                date,
            },
          },
        ],
      },
    ];
  }

  if (
    quantity !== undefined &&
    quantity !== null
  ) {
    const qty =
      Number(quantity);

    const qtyFilter = [
      {
        minimumQuantity: {
          [Op.lte]: qty,
        },
      },

      {
        [Op.or]: [
          {
            maximumQuantity:
              null,
          },

          {
            maximumQuantity: {
              [Op.gte]: qty,
            },
          },
        ],
      },
    ];

    if (
      Array.isArray(
        where[Op.and]
      )
    ) {
      where[Op.and].push(
        ...qtyFilter
      );
    } else {
      where[Op.and] =
        qtyFilter;
    }
  }

  const prices =
    await db.ProductVariantPrice.findAll({
      where,

      include:
        VARIANT_PRICE_INCLUDE,

      order: [
        [
          "priority",
          "ASC",
        ],

        [
          "minimumQuantity",
          "ASC",
        ],

        [
          "validFrom",
          "ASC",
        ],
      ],
    });

  return prices.map(
    decoratePrice
  );
};

/*
|--------------------------------------------------------------------------
| Get Prices By Product
|--------------------------------------------------------------------------
*/

const getPricesByProduct =
async ({
  companyId,
  productId,
  priceListId,
  isActive,
  validOn,
  quantity,
}) => {
  

  const include =
    VARIANT_PRICE_INCLUDE.map(
      (include) => {
        if (
          include.as !==
          "variant"
        ) {
          return include;
        }

        return {
          ...include,

          required: true,

          where: {},

          include: [
            {
              model:
                db.Product,

              as:
                "product",

              required:
                true,

              where: {
                id: productId,
              },
            },
          ],
        };
      }
    );

  const where = {
    companyId,
  };

  if (priceListId) {
    where.priceListId =
      priceListId;
  }

  if (
    typeof isActive ===
    "boolean"
  ) {
    where.isActive =
      isActive;
  }

  if (validOn) {
    const date =
      new Date(validOn);

    where[Op.and] = [
      {
        [Op.or]: [
          {
            validFrom:
              null,
          },

          {
            validFrom: {
              [Op.lte]:
                date,
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
                date,
            },
          },
        ],
      },
    ];
  }

  if (
    quantity !== undefined &&
    quantity !== null
  ) {
    const qty =
      Number(quantity);

    const qtyFilter = [
      {
        minimumQuantity: {
          [Op.lte]: qty,
        },
      },

      {
        [Op.or]: [
          {
            maximumQuantity:
              null,
          },

          {
            maximumQuantity: {
              [Op.gte]: qty,
            },
          },
        ],
      },
    ];

    if (
      Array.isArray(
        where[Op.and]
      )
    ) {
      where[Op.and].push(
        ...qtyFilter
      );
    } else {
      where[Op.and] =
        qtyFilter;
    }
  }

  const prices =
    await db.ProductVariantPrice.findAll({
      where,

      include,

      order: [
        [
          "priority",
          "ASC",
        ],

        [
          "minimumQuantity",
          "ASC",
        ],

        [
          "validFrom",
          "ASC",
        ],
      ],
    });

  return prices.map(
    decoratePrice
  );
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
listVariantPrices,
getVariantPriceById,
createVariantPrice,
updateVariantPrice,
changeVariantPriceStatus,
deleteVariantPrice,
getPricesByVariant,
getPricesByProduct,
};