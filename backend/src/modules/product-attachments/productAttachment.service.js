const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
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

const normalizeNullable =
  (
    value
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return null;
    }

    const normalized =
      String(
        value
      ).trim();

    return normalized ||
      null;
  };

const normalizeCode =
  (
    value
  ) =>
    String(
      value ||
        ""
    )
      .trim()
      .toUpperCase()
      .normalize(
        "NFKD"
      )
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

const normalizeEnum =
  (
    value
  ) =>
    String(
      value ||
        ""
    )
      .trim()
      .toUpperCase();

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

const normalizeInteger =
  (
    value,
    fallback =
      0
  ) => {
    const numberValue =
      Number(
        value
      );

    return Number.isFinite(
      numberValue
    )
      ? Math.trunc(
          numberValue
        )
      : fallback;
  };

const validateRuleEnums =
  ({
    scopeType,
    relationshipType,
    displayLocation,
  }) => {
    if (
      !SCOPE_TYPES.includes(
        scopeType
      )
    ) {
      throw new AppError(
        "Scope type must be PRODUCT, BRAND or CATEGORY.",
        400,
        "PRODUCT_ATTACHMENT_SCOPE_INVALID"
      );
    }

    if (
      !RELATIONSHIP_TYPES.includes(
        relationshipType
      )
    ) {
      throw new AppError(
        "Invalid product attachment relationship type.",
        400,
        "PRODUCT_ATTACHMENT_RELATIONSHIP_INVALID"
      );
    }

    if (
      !DISPLAY_LOCATIONS.includes(
        displayLocation
      )
    ) {
      throw new AppError(
        "Invalid product attachment display location.",
        400,
        "PRODUCT_ATTACHMENT_LOCATION_INVALID"
      );
    }
  };

const buildScopeValues =
  ({
    scopeType,
    scopeId,
  }) => ({
    productId:
      scopeType ===
      "PRODUCT"
        ? scopeId
        : null,

    brandId:
      scopeType ===
      "BRAND"
        ? scopeId
        : null,

    categoryId:
      scopeType ===
      "CATEGORY"
        ? scopeId
        : null,
  });

const getScopeFromRule =
  (
    rule
  ) => {
    const plain =
      typeof rule?.get ===
        "function"
        ? rule.get({
            plain:
              true,
          })
        : rule ||
          {};

    if (
      plain.scopeType ===
        "PRODUCT"
    ) {
      return {
        scopeType:
          "PRODUCT",

        scopeId:
          plain.productId,
      };
    }

    if (
      plain.scopeType ===
        "BRAND"
    ) {
      return {
        scopeType:
          "BRAND",

        scopeId:
          plain.brandId,
      };
    }

    return {
      scopeType:
        "CATEGORY",

      scopeId:
        plain.categoryId,
    };
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

    let label =
      "";

    if (
      scopeType ===
      "PRODUCT"
    ) {
      model =
        db.Product;

      label =
        "product";
    } else if (
      scopeType ===
      "BRAND"
    ) {
      model =
        db.Brand;

      label =
        "brand";
    } else if (
      scopeType ===
      "CATEGORY"
    ) {
      model =
        db.Category;

      label =
        "category";
    }

    const target =
      await model.findOne({
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
        `Selected ${label} was not found.`,
        400,
        "PRODUCT_ATTACHMENT_SCOPE_TARGET_INVALID"
      );
    }

    return target;
  };

const validateAttachmentProducts =
  async ({
    companyId,
    mainProductId,
    items,
    transaction,
  }) => {
    const normalizedItems =
      Array.isArray(
        items
      )
        ? items
        : [];

    const attachmentIds =
      normalizedItems
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
      attachmentIds.length ===
      0
    ) {
      throw new AppError(
        "At least one suggested product is required.",
        400,
        "PRODUCT_ATTACHMENT_ITEM_REQUIRED"
      );
    }

    const uniqueIds =
      [
        ...new Set(
          attachmentIds
        ),
      ];

    if (
      uniqueIds.length !==
      attachmentIds.length
    ) {
      throw new AppError(
        "The same suggested product cannot be added more than once to a rule.",
        400,
        "PRODUCT_ATTACHMENT_ITEM_DUPLICATE"
      );
    }

    if (
      mainProductId &&
      uniqueIds.includes(
        mainProductId
      )
    ) {
      throw new AppError(
        "A product cannot be suggested as an attachment to itself.",
        400,
        "PRODUCT_ATTACHMENT_SELF_REFERENCE"
      );
    }

    const products =
      await db.Product
        .findAll({
          where: {
            companyId,

            id: {
              [Op.in]:
                uniqueIds,
            },
          },

          attributes: [
            "id",
          ],

          transaction,
        });

    if (
      products.length !==
      uniqueIds.length
    ) {
      throw new AppError(
        "One or more suggested products were not found.",
        400,
        "PRODUCT_ATTACHMENT_ITEM_INVALID"
      );
    }
  };

const ensureUniqueCode =
  async ({
    companyId,
    code,
    excludeId =
      null,
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
        .ProductAttachmentRule
        .findOne({
          where,
          transaction,
        });

    if (
      existing
    ) {
      throw new AppError(
        "A product attachment rule with this code already exists.",
        409,
        "PRODUCT_ATTACHMENT_RULE_CODE_EXISTS"
      );
    }
  };

const replaceRuleItems =
  async ({
    companyId,
    ruleId,
    userId,
    items,
    transaction,
  }) => {
    await db
      .ProductAttachmentRuleItem
      .destroy({
        where: {
          companyId,

          ruleId,
        },

        transaction,
      });

    if (
      !Array.isArray(
        items
      ) ||
      items.length ===
        0
    ) {
      return;
    }

    await db
      .ProductAttachmentRuleItem
      .bulkCreate(
        items.map(
          (
            item,
            index
          ) => ({
            companyId,

            ruleId,

            attachmentProductId:
              item
                .attachmentProductId,

            sortOrder:
              normalizeInteger(
                item.sortOrder,
                index
              ),

            minimumQuantity:
              Math.max(
                1,
                normalizeInteger(
                  item.minimumQuantity,
                  1
                )
              ),

            maximumQuantity:
              item.maximumQuantity ===
                undefined ||
              item.maximumQuantity ===
                null ||
              item.maximumQuantity ===
                ""
                ? null
                : Math.max(
                    1,
                    normalizeInteger(
                      item.maximumQuantity,
                      1
                    )
                  ),

            isActive:
              item.isActive !==
              false,

            createdBy:
              userId,

            updatedBy:
              userId,
          })
        ),
        {
          transaction,
        }
      );
  };

const serializeRule =
  (
    rule
  ) => {
    if (
      !rule
    ) {
      return null;
    }

    const plain =
      typeof rule.get ===
        "function"
        ? rule.get({
            plain:
              true,
          })
        : rule;

    const {
      scopeType,
      scopeId,
    } =
      getScopeFromRule(
        plain
      );

    return {
      ...plain,

      scopeType,

      scopeId,
    };
  };

const getRuleInclude =
  () => [
    {
      model:
        db.Product,

      as:
        "product",

      required:
        false,

      attributes: [
        "id",
        "name",
        "slug",
      ],
    },

    {
      model:
        db.Brand,

      as:
        "brand",

      required:
        false,

      attributes: [
        "id",
        "name",
        "code",
      ],
    },

    {
      model:
        db.Category,

      as:
        "category",

      required:
        false,

      attributes: [
        "id",
        "name",
        "slug",
      ],
    },

    {
      model:
        db.ProductAttachmentRuleItem,

      as:
        "items",

      required:
        false,

      include: [
        {
          model:
            db.Product,

          as:
            "attachmentProduct",

          required:
            false,

          attributes: [
            "id",
            "name",
            "slug",
            "status",
          ],
        },
      ],
    },
  ];

const listProductAttachmentRules =
  async ({
    companyId,
    page =
      1,
    pageSize =
      30,
    search,
    scopeType,
    relationshipType,
    displayLocation,
    isActive,
    sortBy =
      "priority",
    sortDirection =
      "ASC",
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
      scopeType
    ) {
      where.scopeType =
        normalizeEnum(
          scopeType
        );
    }

    if (
      relationshipType
    ) {
      where.relationshipType =
        normalizeEnum(
          relationshipType
        );
    }

    if (
      displayLocation
    ) {
      where.displayLocation =
        normalizeEnum(
          displayLocation
        );
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
      ];
    }

    const normalizedPage =
      Number(
        page
      );

    const normalizedPageSize =
      Number(
        pageSize
      );

    const result =
      await db
        .ProductAttachmentRule
        .findAndCountAll({
          where,

          include:
            getRuleInclude(),

          distinct:
            true,

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
              )
                .trim()
                .toUpperCase(),
            ],

            [
              "name",
              "ASC",
            ],

            [
              {
                model:
                  db.ProductAttachmentRuleItem,

                as:
                  "items",
              },

              "sortOrder",
              "ASC",
            ],
          ],
        });

    return {
      rows:
        result.rows.map(
          serializeRule
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

const getProductAttachmentRuleById =
  async ({
    companyId,
    ruleId,
    transaction,
  }) => {
    const rule =
      await db
        .ProductAttachmentRule
        .findOne({
          where: {
            id:
              ruleId,

            companyId,
          },

          include:
            getRuleInclude(),

          transaction,
        });

    if (
      !rule
    ) {
      throw new AppError(
        "Product attachment rule not found.",
        404,
        "PRODUCT_ATTACHMENT_RULE_NOT_FOUND"
      );
    }

    return serializeRule(
      rule
    );
  };

const normalizeRulePayload =
  (
    payload,
    current =
      null
  ) => {
    const currentScope =
      current
        ? getScopeFromRule(
            current
          )
        : {
            scopeType:
              null,

            scopeId:
              null,
          };

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

    if (
      !name
    ) {
      throw new AppError(
        "Product attachment rule name is required.",
        400,
        "PRODUCT_ATTACHMENT_RULE_NAME_REQUIRED"
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

    if (
      !code
    ) {
      throw new AppError(
        "Product attachment rule code is required.",
        400,
        "PRODUCT_ATTACHMENT_RULE_CODE_REQUIRED"
      );
    }

    const scopeType =
      payload.scopeType !==
      undefined
        ? normalizeEnum(
            payload.scopeType
          )
        : currentScope
            .scopeType;

    const scopeId =
      payload.scopeId !==
      undefined
        ? normalizeNullable(
            payload.scopeId
          )
        : currentScope
            .scopeId;

    const relationshipType =
      payload.relationshipType !==
      undefined
        ? normalizeEnum(
            payload.relationshipType
          )
        : current
          ?.relationshipType ||
          "ACCESSORY";

    const displayLocation =
      payload.displayLocation !==
      undefined
        ? normalizeEnum(
            payload.displayLocation
          )
        : current
          ?.displayLocation ||
          "PRODUCT_DETAIL";

    validateRuleEnums({
      scopeType,
      relationshipType,
      displayLocation,
    });

    if (
      !scopeId
    ) {
      throw new AppError(
        "Product attachment rule target is required.",
        400,
        "PRODUCT_ATTACHMENT_SCOPE_ID_REQUIRED"
      );
    }

    const effectiveFrom =
      payload.effectiveFrom !==
      undefined
        ? normalizeDate(
            payload.effectiveFrom
          )
        : current
          ?.effectiveFrom ||
          null;

    const effectiveUntil =
      payload.effectiveUntil !==
      undefined
        ? normalizeDate(
            payload.effectiveUntil
          )
        : current
          ?.effectiveUntil ||
          null;

    if (
      effectiveFrom &&
      effectiveUntil &&
      effectiveUntil <
        effectiveFrom
    ) {
      throw new AppError(
        "Effective until cannot be earlier than effective from.",
        400,
        "PRODUCT_ATTACHMENT_DATE_RANGE_INVALID"
      );
    }

    return {
      name,
      code,
      scopeType,
      scopeId,
      relationshipType,
      displayLocation,
      priority:
        payload.priority !==
        undefined
          ? normalizeInteger(
              payload.priority,
              100
            )
          : normalizeInteger(
              current
                ?.priority,
              100
            ),
      effectiveFrom,
      effectiveUntil,
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

const createProductAttachmentRule =
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
        normalizeRulePayload(
          payload
        );

      await ensureUniqueCode({
        companyId,
        code:
          values.code,
        transaction,
      });

      await validateScopeTarget({
        companyId,
        scopeType:
          values.scopeType,
        scopeId:
          values.scopeId,
        transaction,
      });

      await validateAttachmentProducts({
        companyId,
        mainProductId:
          values.scopeType ===
          "PRODUCT"
            ? values.scopeId
            : null,
        items:
          payload.items,
        transaction,
      });

      const rule =
        await db
          .ProductAttachmentRule
          .create(
            {
              companyId,

              name:
                values.name,

              code:
                values.code,

              scopeType:
                values.scopeType,

              ...buildScopeValues({
                scopeType:
                  values.scopeType,

                scopeId:
                  values.scopeId,
              }),

              relationshipType:
                values.relationshipType,

              displayLocation:
                values.displayLocation,

              priority:
                values.priority,

              effectiveFrom:
                values.effectiveFrom,

              effectiveUntil:
                values.effectiveUntil,

              isActive:
                values.isActive,

              createdBy:
                userId,

              updatedBy:
                userId,
            },
            {
              transaction,
            }
          );

      await replaceRuleItems({
        companyId,
        ruleId:
          rule.id,
        userId,
        items:
          payload.items,
        transaction,
      });

      await transaction
        .commit();

      return getProductAttachmentRuleById({
        companyId,
        ruleId:
          rule.id,
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

const updateProductAttachmentRule =
  async ({
    companyId,
    ruleId,
    userId,
    payload,
  }) => {
    const transaction =
      await db
        .sequelize
        .transaction();

    try {
      const rule =
        await db
          .ProductAttachmentRule
          .findOne({
            where: {
              id:
                ruleId,

              companyId,
            },

            transaction,

            lock:
              transaction
                .LOCK
                .UPDATE,
          });

      if (
        !rule
      ) {
        throw new AppError(
          "Product attachment rule not found.",
          404,
          "PRODUCT_ATTACHMENT_RULE_NOT_FOUND"
        );
      }

      const values =
        normalizeRulePayload(
          payload,
          rule
        );

      await ensureUniqueCode({
        companyId,
        code:
          values.code,
        excludeId:
          rule.id,
        transaction,
      });

      await validateScopeTarget({
        companyId,
        scopeType:
          values.scopeType,
        scopeId:
          values.scopeId,
        transaction,
      });

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            payload,
            "items"
          )
      ) {
        await validateAttachmentProducts({
          companyId,
          mainProductId:
            values.scopeType ===
            "PRODUCT"
              ? values.scopeId
              : null,
          items:
            payload.items,
          transaction,
        });
      } else if (
        values.scopeType ===
        "PRODUCT"
      ) {
        const existingItems =
          await db
            .ProductAttachmentRuleItem
            .findAll({
              where: {
                companyId,

                ruleId:
                  rule.id,
              },

              attributes: [
                "attachmentProductId",
              ],

              transaction,
            });

        if (
          existingItems.some(
            (
              item
            ) =>
              item
                .attachmentProductId ===
              values.scopeId
          )
        ) {
          throw new AppError(
            "A product cannot be suggested as an attachment to itself.",
            400,
            "PRODUCT_ATTACHMENT_SELF_REFERENCE"
          );
        }
      }

      await rule.update(
        {
          name:
            values.name,

          code:
            values.code,

          scopeType:
            values.scopeType,

          ...buildScopeValues({
            scopeType:
              values.scopeType,

            scopeId:
              values.scopeId,
          }),

          relationshipType:
            values.relationshipType,

          displayLocation:
            values.displayLocation,

          priority:
            values.priority,

          effectiveFrom:
            values.effectiveFrom,

          effectiveUntil:
            values.effectiveUntil,

          isActive:
            values.isActive,

          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            payload,
            "items"
          )
      ) {
        await replaceRuleItems({
          companyId,
          ruleId:
            rule.id,
          userId,
          items:
            payload.items,
          transaction,
        });
      }

      await transaction
        .commit();

      return getProductAttachmentRuleById({
        companyId,
        ruleId:
          rule.id,
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

const changeProductAttachmentRuleStatus =
  async ({
    companyId,
    ruleId,
    userId,
    isActive,
  }) => {
    const rule =
      await db
        .ProductAttachmentRule
        .findOne({
          where: {
            id:
              ruleId,

            companyId,
          },
        });

    if (
      !rule
    ) {
      throw new AppError(
        "Product attachment rule not found.",
        404,
        "PRODUCT_ATTACHMENT_RULE_NOT_FOUND"
      );
    }

    await rule.update({
      isActive,
      updatedBy:
        userId,
    });

    return getProductAttachmentRuleById({
      companyId,
      ruleId,
    });
  };

const deleteProductAttachmentRule =
  async ({
    companyId,
    ruleId,
  }) => {
    const transaction =
      await db
        .sequelize
        .transaction();

    try {
      const rule =
        await db
          .ProductAttachmentRule
          .findOne({
            where: {
              id:
                ruleId,

              companyId,
            },

            transaction,
          });

      if (
        !rule
      ) {
        throw new AppError(
          "Product attachment rule not found.",
          404,
          "PRODUCT_ATTACHMENT_RULE_NOT_FOUND"
        );
      }

      await db
        .ProductAttachmentRuleItem
        .destroy({
          where: {
            companyId,

            ruleId:
              rule.id,
          },

          transaction,
        });

      await rule.destroy({
        transaction,
      });

      await transaction
        .commit();

      return {
        id:
          ruleId,
      };
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

module.exports = {
  listProductAttachmentRules,
  getProductAttachmentRuleById,
  createProductAttachmentRule,
  updateProductAttachmentRule,
  changeProductAttachmentRuleStatus,
  deleteProductAttachmentRule,
};
