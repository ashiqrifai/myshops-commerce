const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const {
  BOOLEAN_SETTING_KEYS,
  NUMBER_SETTING_KEYS,
  COLOR_SETTING_KEYS,
} = require("./settings.constants");

const buildCompositeKey = (setting) => {
  return `${setting.group}.${setting.key}`;
};

const validateColor = (value) => {
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
};

const validateSettingValue = (setting, value) => {
  const compositeKey = buildCompositeKey(setting);

  if (
    setting.isRequired &&
    (value === null ||
      value === undefined ||
      value === "")
  ) {
    throw new AppError(
      `${setting.label} is required.`,
      400,
      "SETTING_VALUE_REQUIRED"
    );
  }

  if (value === null || value === undefined) {
    return;
  }

  if (
    setting.dataType === "BOOLEAN" ||
    BOOLEAN_SETTING_KEYS.has(compositeKey)
  ) {
    if (typeof value !== "boolean") {
      throw new AppError(
        `${setting.label} must be true or false.`,
        400,
        "INVALID_SETTING_VALUE"
      );
    }
  }

  if (
    setting.dataType === "NUMBER" ||
    NUMBER_SETTING_KEYS.has(compositeKey)
  ) {
    if (
      typeof value !== "number" ||
      Number.isNaN(value)
    ) {
      throw new AppError(
        `${setting.label} must be a valid number.`,
        400,
        "INVALID_SETTING_VALUE"
      );
    }
  }

  if (
    setting.dataType === "COLOR" ||
    COLOR_SETTING_KEYS.has(compositeKey)
  ) {
    if (
      typeof value !== "string" ||
      !validateColor(value)
    ) {
      throw new AppError(
        `${setting.label} must be a valid hexadecimal color.`,
        400,
        "INVALID_SETTING_VALUE"
      );
    }
  }

  if (setting.dataType === "EMAIL") {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      typeof value !== "string" ||
      !emailPattern.test(value)
    ) {
      throw new AppError(
        `${setting.label} must be a valid email address.`,
        400,
        "INVALID_SETTING_VALUE"
      );
    }
  }

  if (setting.dataType === "URL" && value) {
    try {
      new URL(value);
    } catch {
      throw new AppError(
        `${setting.label} must be a valid URL.`,
        400,
        "INVALID_SETTING_VALUE"
      );
    }
  }

  if (
    setting.dataType === "SELECT" &&
    Array.isArray(setting.options)
  ) {
    const allowedValues = setting.options.map(
      (option) =>
        typeof option === "object"
          ? option.value
          : option
    );

    if (!allowedValues.includes(value)) {
      throw new AppError(
        `${setting.label} contains an unsupported value.`,
        400,
        "INVALID_SETTING_VALUE"
      );
    }
  }
};

const transformSettingsToObject = (settings) => {
  const result = {};

  for (const setting of settings) {
    if (!result[setting.group]) {
      result[setting.group] = {};
    }

    result[setting.group][setting.key] =
      setting.value !== null &&
      setting.value !== undefined
        ? setting.value
        : setting.defaultValue;
  }

  return result;
};

const listAdminSettings = async ({
  companyId,
  channel,
  group,
  search,
}) => {
  const where = {
    companyId,
    isActive: true,
  };

  if (channel) {
    where.channel = channel;
  }

  if (group) {
    where.group = group;
  }

  if (search) {
    where[Op.or] = [
      {
        key: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        label: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        description: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  return db.SystemSetting.findAll({
    where,
    order: [
      ["channel", "ASC"],
      ["group", "ASC"],
      ["displayOrder", "ASC"],
      ["label", "ASC"],
    ],
  });
};

const getSettingById = async ({
  companyId,
  settingId,
}) => {
  const setting =
    await db.SystemSetting.findOne({
      where: {
        id: settingId,
        companyId,
        isActive: true,
      },
    });

  if (!setting) {
    throw new AppError(
      "System setting not found.",
      404,
      "SYSTEM_SETTING_NOT_FOUND"
    );
  }

  return setting;
};

const updateSetting = async ({
  companyId,
  settingId,
  value,
  userId,
}) => {
  const setting = await getSettingById({
    companyId,
    settingId,
  });

  if (!setting.isEditable) {
    throw new AppError(
      "This system setting cannot be edited.",
      403,
      "SYSTEM_SETTING_NOT_EDITABLE"
    );
  }

  validateSettingValue(setting, value);

  await setting.update({
    value,
    updatedBy: userId,
  });

  return setting;
};

const bulkUpdateSettings = async ({
  companyId,
  settings,
  userId,
}) => {
  const settingIds = settings.map(
    (item) => item.id
  );

  const existingSettings =
    await db.SystemSetting.findAll({
      where: {
        id: {
          [Op.in]: settingIds,
        },
        companyId,
        isActive: true,
      },
    });

  if (
    existingSettings.length !== settingIds.length
  ) {
    throw new AppError(
      "One or more system settings were not found.",
      404,
      "SYSTEM_SETTING_NOT_FOUND"
    );
  }

  const existingSettingMap = new Map(
    existingSettings.map((setting) => [
      setting.id,
      setting,
    ])
  );

  for (const item of settings) {
    const setting = existingSettingMap.get(
      item.id
    );

    if (!setting.isEditable) {
      throw new AppError(
        `${setting.label} cannot be edited.`,
        403,
        "SYSTEM_SETTING_NOT_EDITABLE"
      );
    }

    validateSettingValue(
      setting,
      item.value
    );
  }

  const transaction =
    await db.sequelize.transaction();

  try {
    for (const item of settings) {
      const setting =
        existingSettingMap.get(item.id);

      await setting.update(
        {
          value: item.value,
          updatedBy: userId,
        },
        {
          transaction,
        }
      );
    }

    await transaction.commit();

    return listAdminSettings({
      companyId,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getPublicSettings = async ({
  companyCode,
  channel = "WEBSITE",
}) => {
  const company = await db.Company.findOne({
    where: {
      code: companyCode,
      isActive: true,
    },
    attributes: [
      "id",
      "name",
      "code",
      "legalName",
      "currency",
      "timezone",
      "logoUrl",
    ],
  });

  if (!company) {
    throw new AppError(
      "Company configuration was not found.",
      404,
      "COMPANY_NOT_FOUND"
    );
  }

  const settings =
    await db.SystemSetting.findAll({
      where: {
        companyId: company.id,
        channel: {
          [Op.in]: ["GLOBAL", channel],
        },
        isPublic: true,
        isActive: true,
      },
      attributes: [
        "group",
        "key",
        "value",
        "defaultValue",
      ],
      order: [
        ["group", "ASC"],
        ["displayOrder", "ASC"],
      ],
    });

  return {
    company: company.get({
      plain: true,
    }),
    settings:
      transformSettingsToObject(settings),
  };
};

const getKioskSettings = async ({
  companyCode,
}) => {
  return getPublicSettings({
    companyCode,
    channel: "KIOSK",
  });
};

module.exports = {
  listAdminSettings,
  getSettingById,
  updateSetting,
  bulkUpdateSettings,
  getPublicSettings,
  getKioskSettings,
};