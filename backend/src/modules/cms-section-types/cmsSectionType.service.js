const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

/*
 * Adds only missing keys from defaults.
 *
 * Existing section values always win.
 * Arrays are treated as complete values and are
 * not merged item by item.
 */
const mergeMissingDefaults = (
  defaults,
  existing
) => {
  const safeDefaults = isPlainObject(
    defaults
  )
    ? defaults
    : {};

  const safeExisting = isPlainObject(
    existing
  )
    ? existing
    : {};

  const result = {
    ...safeExisting,
  };

  for (const [
    key,
    defaultValue,
  ] of Object.entries(safeDefaults)) {
    const hasExistingValue =
      Object.prototype.hasOwnProperty.call(
        safeExisting,
        key
      );

    if (!hasExistingValue) {
      result[key] = defaultValue;
      continue;
    }

    if (
      isPlainObject(defaultValue) &&
      isPlainObject(safeExisting[key])
    ) {
      result[key] =
        mergeMissingDefaults(
          defaultValue,
          safeExisting[key]
        );
    }
  }

  return result;
};

const objectsAreEqual = (
  first,
  second
) => {
  return (
    JSON.stringify(first) ===
    JSON.stringify(second)
  );
};

const listCmsSectionTypes = async ({
  companyId,
  category,
  channel,
  search,
  isActive = true,
}) => {
  const where = {
    companyId,
  };

  if (category) {
    where.category = category;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (search) {
    where[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        code: {
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

  if (channel) {
    where.supportedChannels = {
      [Op.contains]: [channel],
    };
  }

  return db.CmsSectionType.findAll({
    where,
    order: [
      ["category", "ASC"],
      ["displayOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
};

const getCmsSectionTypeById = async ({
  companyId,
  sectionTypeId,
  transaction,
}) => {
  const sectionType =
    await db.CmsSectionType.findOne({
      where: {
        id: sectionTypeId,
        companyId,
      },
      transaction,
    });

  if (!sectionType) {
    throw new AppError(
      "CMS section type not found.",
      404,
      "CMS_SECTION_TYPE_NOT_FOUND"
    );
  }

  return sectionType;
};

const syncCmsSectionTypeDefaults =
  async ({
    companyId,
    sectionTypeId,
    userId,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const sectionType =
        await getCmsSectionTypeById({
          companyId,
          sectionTypeId,
          transaction,
        });

      const sections =
        await db.CmsPageSection.findAll({
          where: {
            companyId,
            sectionTypeId,
            isActive: true,
          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,
        });

      let updatedSections = 0;
      let unchangedSections = 0;

      const updatedSectionIds = [];

      for (const section of sections) {
        const currentSettings =
          section.settings || {};

        const currentContent =
          section.content || {};

        const nextSettings =
          mergeMissingDefaults(
            sectionType.defaultSettings ||
              {},
            currentSettings
          );

        const nextContent =
          mergeMissingDefaults(
            sectionType.defaultContent ||
              {},
            currentContent
          );

        const settingsChanged =
          !objectsAreEqual(
            currentSettings,
            nextSettings
          );

        const contentChanged =
          !objectsAreEqual(
            currentContent,
            nextContent
          );

        if (
          !settingsChanged &&
          !contentChanged
        ) {
          unchangedSections += 1;
          continue;
        }

        const updateValues = {
          updatedBy: userId,
        };

        if (settingsChanged) {
          updateValues.settings =
            nextSettings;
        }

        if (contentChanged) {
          updateValues.content =
            nextContent;
        }

        await section.update(
          updateValues,
          {
            transaction,
          }
        );

        updatedSections += 1;

        updatedSectionIds.push(
          section.id
        );
      }

      await transaction.commit();

      return {
        sectionType: {
          id: sectionType.id,
          name: sectionType.name,
          code: sectionType.code,
        },

        totalSections:
          sections.length,

        updatedSections,
        unchangedSections,
        updatedSectionIds,
      };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      throw error;
    }
  };

module.exports = {
  listCmsSectionTypes,
  getCmsSectionTypeById,
  syncCmsSectionTypeDefaults,
};