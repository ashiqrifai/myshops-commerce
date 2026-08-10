const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require(
  "../../utils/AppError"
);

const {
  SELECT_INPUT_TYPES,
} = require("./attribute.constants");

const {
  generateCode,
  generateOptionValue,
  normalizeNullable,
} = require("./attribute.utils");

const ATTRIBUTE_INCLUDE = [
  {
    model: db.AttributeOption,
    as: "options",
    required: false,
  },
  {
    model: db.CategoryAttribute,
    as: "categoryAssignments",
    required: false,
    include: [
      {
        model: db.Category,
        as: "category",
        required: false,
      },
    ],
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

const ensureUniqueCode = async ({
  companyId,
  code,
  excludeId,
  transaction,
}) => {
  const where = {
    companyId,
    code,
  };

  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }

  const existing =
    await db.Attribute.findOne({
      where,
      transaction,
    });

  if (existing) {
    throw new AppError(
      "An attribute with this code already exists.",
      409,
      "ATTRIBUTE_CODE_EXISTS"
    );
  }
};

const validateCategoryAssignments = async ({
  companyId,
  assignments,
  transaction,
}) => {
  if (
    !Array.isArray(assignments) ||
    assignments.length === 0
  ) {
    return;
  }

  const categoryIds = [
    ...new Set(
      assignments.map(
        (item) => item.categoryId
      )
    ),
  ];

  const categories =
    await db.Category.findAll({
      where: {
        companyId,
        id: {
          [Op.in]: categoryIds,
        },
      },
      attributes: ["id"],
      transaction,
    });

  if (
    categories.length !==
    categoryIds.length
  ) {
    throw new AppError(
      "One or more selected categories were not found.",
      400,
      "ATTRIBUTE_CATEGORY_INVALID"
    );
  }
};

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) {
    return [];
  }

  const usedValues = new Set();

  return options.map(
    (option, index) => {
      const label =
        String(option.label || "").trim();

      const value =
        generateOptionValue(
          option.value || label
        );

      if (!label) {
        throw new AppError(
          "Every attribute option requires a label.",
          400,
          "ATTRIBUTE_OPTION_LABEL_REQUIRED"
        );
      }

      if (!value) {
        throw new AppError(
          `A value could not be generated for option "${label}".`,
          400,
          "ATTRIBUTE_OPTION_VALUE_REQUIRED"
        );
      }

      if (usedValues.has(value)) {
        throw new AppError(
          `Duplicate attribute option value "${value}".`,
          409,
          "ATTRIBUTE_OPTION_DUPLICATE"
        );
      }

      usedValues.add(value);

      return {
        id: option.id || null,
        label,
        value,
        swatchValue:
          normalizeNullable(
            option.swatchValue
          ),
        displayOrder:
          Number(
            option.displayOrder ??
            index
          ),
        isActive:
          option.isActive !== false,
      };
    }
  );
};

const replaceOptions = async ({
  companyId,
  attribute,
  options,
  userId,
  transaction,
}) => {
  const normalizedOptions =
    normalizeOptions(options);

  if (
    SELECT_INPUT_TYPES.includes(
      attribute.inputType
    ) &&
    normalizedOptions.length === 0
  ) {
    throw new AppError(
      "Selectable attributes must contain at least one option.",
      400,
      "ATTRIBUTE_OPTIONS_REQUIRED"
    );
  }

  const existingOptions =
    await db.AttributeOption.findAll({
      where: {
        companyId,
        attributeId: attribute.id,
      },
      transaction,
    });

  const existingById =
    new Map(
      existingOptions.map(
        (item) => [item.id, item]
      )
    );

  const retainedIds = new Set();

  for (const option of normalizedOptions) {
    if (
      option.id &&
      existingById.has(option.id)
    ) {
      const existing =
        existingById.get(option.id);

      await existing.update(
        {
          label: option.label,
          value: option.value,
          swatchValue:
            option.swatchValue,
          displayOrder:
            option.displayOrder,
          isActive:
            option.isActive,
          updatedBy: userId,
        },
        { transaction }
      );

      retainedIds.add(existing.id);
    } else {
      const created =
        await db.AttributeOption.create(
          {
            companyId,
            attributeId:
              attribute.id,
            label: option.label,
            value: option.value,
            swatchValue:
              option.swatchValue,
            displayOrder:
              option.displayOrder,
            isActive:
              option.isActive,
            createdBy: userId,
            updatedBy: userId,
          },
          { transaction }
        );

      retainedIds.add(created.id);
    }
  }

  const removeIds =
    existingOptions
      .filter(
        (item) =>
          !retainedIds.has(item.id)
      )
      .map((item) => item.id);

  if (removeIds.length > 0) {
    await db.AttributeOption.destroy({
      where: {
        id: {
          [Op.in]: removeIds,
        },
      },
      transaction,
    });
  }
};

const replaceCategoryAssignments = async ({
  companyId,
  attribute,
  assignments,
  userId,
  transaction,
}) => {
  const normalized =
    Array.isArray(assignments)
      ? assignments
      : [];

  await validateCategoryAssignments({
    companyId,
    assignments: normalized,
    transaction,
  });

  await db.CategoryAttribute.destroy({
    where: {
      companyId,
      attributeId: attribute.id,
    },
    transaction,
  });

  if (normalized.length === 0) {
    return;
  }

  await db.CategoryAttribute.bulkCreate(
    normalized.map(
      (item, index) => ({
        companyId,
        categoryId: item.categoryId,
        attributeId: attribute.id,
        isRequired:
          item.isRequired ??
          attribute.isRequired,
        isFilterable:
          item.isFilterable ??
          attribute.isFilterable,
        isVariantDefining:
          item.isVariantDefining ??
          attribute.isVariantDefining,
        displayOrder:
          Number(
            item.displayOrder ??
            index
          ),
        isActive:
          item.isActive !== false,
        createdBy: userId,
        updatedBy: userId,
      })
    ),
    { transaction }
  );
};

const getAttributeById = async ({
  companyId,
  attributeId,
  transaction,
}) => {
  const attribute =
    await db.Attribute.findOne({
      where: {
        id: attributeId,
        companyId,
      },
      include: ATTRIBUTE_INCLUDE,
      transaction,
      order: [
        [
          {
            model: db.AttributeOption,
            as: "options",
          },
          "displayOrder",
          "ASC",
        ],
        [
          {
            model: db.CategoryAttribute,
            as: "categoryAssignments",
          },
          "displayOrder",
          "ASC",
        ],
      ],
    });

  if (!attribute) {
    throw new AppError(
      "Attribute not found.",
      404,
      "ATTRIBUTE_NOT_FOUND"
    );
  }

  return attribute;
};

const listAttributes = async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  inputType,
  dataType,
  isVariantDefining,
  isFilterable,
  isActive,
  categoryId,
  sortBy = "displayOrder",
  sortDirection = "ASC",
}) => {
  const where = { companyId };

  if (inputType) {
    where.inputType = inputType;
  }

  if (dataType) {
    where.dataType = dataType;
  }

  if (
    typeof isVariantDefining ===
    "boolean"
  ) {
    where.isVariantDefining =
      isVariantDefining;
  }

  if (
    typeof isFilterable ===
    "boolean"
  ) {
    where.isFilterable =
      isFilterable;
  }

  if (
    typeof isActive ===
    "boolean"
  ) {
    where.isActive = isActive;
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
        unit: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
    ];
  }

  const include = [
    {
      model: db.AttributeOption,
      as: "options",
      required: false,
    },
    {
      model: db.CategoryAttribute,
      as: "categoryAssignments",
      required: Boolean(categoryId),
      where: categoryId
        ? {
            categoryId,
            isActive: true,
          }
        : undefined,
      include: [
        {
          model: db.Category,
          as: "category",
          required: false,
        },
      ],
    },
  ];

  const normalizedPage = Number(page);
  const normalizedPageSize =
    Number(pageSize);

  const offset =
    (normalizedPage - 1) *
    normalizedPageSize;

  const result =
    await db.Attribute.findAndCountAll({
      where,
      include,
      distinct: true,
      limit: normalizedPageSize,
      offset,
      order: [
        [
          sortBy,
          String(
            sortDirection
          ).toUpperCase(),
        ],
        ["name", "ASC"],
      ],
    });

  return {
    rows: result.rows,
    pagination: {
      page: normalizedPage,
      pageSize:
        normalizedPageSize,
      totalItems: result.count,
      totalPages: Math.ceil(
        result.count /
        normalizedPageSize
      ),
    },
  };
};

const createAttribute = async ({
  companyId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const name =
      payload.name.trim();

    const code =
      generateCode(
        payload.code || name
      );

    if (!code) {
      throw new AppError(
        "Attribute code could not be generated.",
        400,
        "ATTRIBUTE_CODE_REQUIRED"
      );
    }

    await ensureUniqueCode({
      companyId,
      code,
      transaction,
    });

    const inputType =
      payload.inputType || "TEXT";

    const dataType =
      payload.dataType ||
      (
        inputType === "NUMBER"
          ? "NUMBER"
          : inputType ===
            "BOOLEAN"
          ? "BOOLEAN"
          : inputType === "DATE"
          ? "DATE"
          : inputType ===
            "MULTI_SELECT"
          ? "JSON"
          : "STRING"
      );

    const attribute =
      await db.Attribute.create(
        {
          companyId,
          name,
          code,
          description:
            normalizeNullable(
              payload.description
            ),
          inputType,
          dataType,
          unit:
            normalizeNullable(
              payload.unit
            ),
          isVariantDefining:
            payload.isVariantDefining ===
            true,
          isFilterable:
            payload.isFilterable ===
            true,
          isSearchable:
            payload.isSearchable ===
            true,
          isComparable:
            payload.isComparable ===
            true,
          isRequired:
            payload.isRequired ===
            true,
          displayOrder:
            Number(
              payload.displayOrder || 0
            ),
          isActive:
            payload.isActive !== false,
          createdBy: userId,
          updatedBy: userId,
        },
        { transaction }
      );

    await replaceOptions({
      companyId,
      attribute,
      options:
        payload.options || [],
      userId,
      transaction,
    });

    await replaceCategoryAssignments({
      companyId,
      attribute,
      assignments:
        payload.categoryAssignments ||
        [],
      userId,
      transaction,
    });

    await transaction.commit();

    return getAttributeById({
      companyId,
      attributeId: attribute.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const updateAttribute = async ({
  companyId,
  attributeId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const attribute =
      await db.Attribute.findOne({
        where: {
          id: attributeId,
          companyId,
        },
        transaction,
        lock:
          transaction.LOCK.UPDATE,
      });

    if (!attribute) {
      throw new AppError(
        "Attribute not found.",
        404,
        "ATTRIBUTE_NOT_FOUND"
      );
    }

    const name =
      payload.name !== undefined
        ? payload.name.trim()
        : attribute.name;

    const code =
      payload.code !== undefined
        ? generateCode(
            payload.code || name
          )
        : attribute.code;

    await ensureUniqueCode({
      companyId,
      code,
      excludeId: attribute.id,
      transaction,
    });

    const updateValues = {
      name,
      code,
      updatedBy: userId,
    };

    for (
      const field of
      ["description", "unit"]
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

    for (
      const field of [
        "inputType",
        "dataType",
        "isVariantDefining",
        "isFilterable",
        "isSearchable",
        "isComparable",
        "isRequired",
        "displayOrder",
        "isActive",
      ]
    ) {
      if (
        Object.prototype
          .hasOwnProperty.call(
            payload,
            field
          )
      ) {
        updateValues[field] =
          field === "displayOrder"
            ? Number(
                payload[field] || 0
              )
            : payload[field];
      }
    }

    await attribute.update(
      updateValues,
      { transaction }
    );

    if (
      Object.prototype
        .hasOwnProperty.call(
          payload,
          "options"
        )
    ) {
      await replaceOptions({
        companyId,
        attribute,
        options: payload.options,
        userId,
        transaction,
      });
    }

    if (
      Object.prototype
        .hasOwnProperty.call(
          payload,
          "categoryAssignments"
        )
    ) {
      await replaceCategoryAssignments({
        companyId,
        attribute,
        assignments:
          payload.categoryAssignments,
        userId,
        transaction,
      });
    }

    await transaction.commit();

    return getAttributeById({
      companyId,
      attributeId: attribute.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const changeAttributeStatus = async ({
  companyId,
  attributeId,
  userId,
  isActive,
}) => {
  const attribute =
    await db.Attribute.findOne({
      where: {
        id: attributeId,
        companyId,
      },
    });

  if (!attribute) {
    throw new AppError(
      "Attribute not found.",
      404,
      "ATTRIBUTE_NOT_FOUND"
    );
  }

  await attribute.update({
    isActive,
    updatedBy: userId,
  });

  return getAttributeById({
    companyId,
    attributeId,
  });
};

const createOption = async ({
  companyId,
  attributeId,
  userId,
  payload,
}) => {
  const attribute =
    await db.Attribute.findOne({
      where: {
        id: attributeId,
        companyId,
      },
    });

  if (!attribute) {
    throw new AppError(
      "Attribute not found.",
      404,
      "ATTRIBUTE_NOT_FOUND"
    );
  }

  if (
    !SELECT_INPUT_TYPES.includes(
      attribute.inputType
    )
  ) {
    throw new AppError(
      "Options can only be added to selectable attributes.",
      400,
      "ATTRIBUTE_OPTIONS_NOT_ALLOWED"
    );
  }

  const label =
    payload.label.trim();

  const value =
    generateOptionValue(
      payload.value || label
    );

  const existing =
    await db.AttributeOption.findOne({
      where: {
        companyId,
        attributeId,
        value,
      },
    });

  if (existing) {
    throw new AppError(
      "An option with this value already exists.",
      409,
      "ATTRIBUTE_OPTION_EXISTS"
    );
  }

  return db.AttributeOption.create({
    companyId,
    attributeId,
    label,
    value,
    swatchValue:
      normalizeNullable(
        payload.swatchValue
      ),
    displayOrder:
      Number(
        payload.displayOrder || 0
      ),
    isActive:
      payload.isActive !== false,
    createdBy: userId,
    updatedBy: userId,
  });
};

const updateOption = async ({
  companyId,
  attributeId,
  optionId,
  userId,
  payload,
}) => {
  const option =
    await db.AttributeOption.findOne({
      where: {
        id: optionId,
        companyId,
        attributeId,
      },
    });

  if (!option) {
    throw new AppError(
      "Attribute option not found.",
      404,
      "ATTRIBUTE_OPTION_NOT_FOUND"
    );
  }

  const label =
    payload.label !== undefined
      ? payload.label.trim()
      : option.label;

  const value =
    payload.value !== undefined
      ? generateOptionValue(
          payload.value || label
        )
      : option.value;

  const duplicate =
    await db.AttributeOption.findOne({
      where: {
        companyId,
        attributeId,
        value,
        id: {
          [Op.ne]: option.id,
        },
      },
    });

  if (duplicate) {
    throw new AppError(
      "An option with this value already exists.",
      409,
      "ATTRIBUTE_OPTION_EXISTS"
    );
  }

  const updateValues = {
    label,
    value,
    updatedBy: userId,
  };

  if (
    Object.prototype
      .hasOwnProperty.call(
        payload,
        "swatchValue"
      )
  ) {
    updateValues.swatchValue =
      normalizeNullable(
        payload.swatchValue
      );
  }

  if (
    Object.prototype
      .hasOwnProperty.call(
        payload,
        "displayOrder"
      )
  ) {
    updateValues.displayOrder =
      Number(
        payload.displayOrder || 0
      );
  }

  if (
    Object.prototype
      .hasOwnProperty.call(
        payload,
        "isActive"
      )
  ) {
    updateValues.isActive =
      payload.isActive;
  }

  await option.update(
    updateValues
  );

  return option;
};

const deleteOption = async ({
  companyId,
  attributeId,
  optionId,
}) => {
  const option =
    await db.AttributeOption.findOne({
      where: {
        id: optionId,
        companyId,
        attributeId,
      },
    });

  if (!option) {
    throw new AppError(
      "Attribute option not found.",
      404,
      "ATTRIBUTE_OPTION_NOT_FOUND"
    );
  }

  await option.destroy();

  return { id: optionId };
};

const replaceAssignments = async ({
  companyId,
  attributeId,
  userId,
  categoryAssignments,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const attribute =
      await db.Attribute.findOne({
        where: {
          id: attributeId,
          companyId,
        },
        transaction,
      });

    if (!attribute) {
      throw new AppError(
        "Attribute not found.",
        404,
        "ATTRIBUTE_NOT_FOUND"
      );
    }

    await replaceCategoryAssignments({
      companyId,
      attribute,
      assignments:
        categoryAssignments,
      userId,
      transaction,
    });

    await transaction.commit();

    return getAttributeById({
      companyId,
      attributeId,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const deleteAttribute = async ({
  companyId,
  attributeId,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const attribute =
      await db.Attribute.findOne({
        where: {
          id: attributeId,
          companyId,
        },
        transaction,
      });

    if (!attribute) {
      throw new AppError(
        "Attribute not found.",
        404,
        "ATTRIBUTE_NOT_FOUND"
      );
    }

    await db.CategoryAttribute.destroy({
      where: {
        companyId,
        attributeId,
      },
      transaction,
    });

    await db.AttributeOption.destroy({
      where: {
        companyId,
        attributeId,
      },
      transaction,
    });

    await attribute.destroy({
      transaction,
    });

    await transaction.commit();

    return { id: attributeId };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  listAttributes,
  getAttributeById,
  createAttribute,
  updateAttribute,
  changeAttributeStatus,
  createOption,
  updateOption,
  deleteOption,
  replaceAssignments,
  deleteAttribute,
};
