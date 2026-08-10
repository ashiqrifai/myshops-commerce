const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require(
  "../../utils/AppError"
);

const {
  syncAssetUsageReferences,
} = require(
  "../../services/media/mediaAssetReference.service"
);

const {
  removeEntityMediaUsage,
} = require(
  "../../services/media/mediaUsage.service"
);

const DEFAULT_VISIBILITY = {
  desktop: true,
  tablet: true,
  mobile: true,
  kiosk: true,
};

const buildSectionMediaObject = ({
  settings,
  content,
}) => {
  return {
    settings: settings || {},
    content: content || {},
  };
};

const mergeObjects = (
  defaults,
  provided
) => ({
  ...(defaults || {}),
  ...(provided || {}),
});

const normalizeCode = (value) =>
  value
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9_-]+/g,
      "_"
    )
    .replace(/^_+|_+$/g, "");

const safeRollback = async (
  transaction
) => {
  if (!transaction.finished) {
    await transaction.rollback();
  }
};

const getCmsPage = async ({
  companyId,
  pageId,
  transaction,
}) => {
  const page =
    await db.CmsPage.findOne({
      where: {
        id: pageId,
        companyId,
      },
      transaction,
    });

  if (!page) {
    throw new AppError(
      "CMS page not found.",
      404,
      "CMS_PAGE_NOT_FOUND"
    );
  }

  return page;
};

const getCmsPageSectionById =
  async ({
    companyId,
    pageId,
    sectionId,
    transaction,
  }) => {
    const section =
      await db.CmsPageSection.findOne({
        where: {
          id: sectionId,
          cmsPageId: pageId,
          companyId,
        },

        include: [
          {
            model:
              db.CmsSectionType,
            as: "sectionType",
            required: true,
          },

          {
            model: db.User,
            as: "createdByUser",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "email",
            ],
            required: false,
          },

          {
            model: db.User,
            as: "updatedByUser",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "email",
            ],
            required: false,
          },
        ],

        transaction,
      });

    if (!section) {
      throw new AppError(
        "CMS page section not found.",
        404,
        "CMS_PAGE_SECTION_NOT_FOUND"
      );
    }

    return section;
  };

const listCmsPageSections = async ({
  companyId,
  pageId,
}) => {
  await getCmsPage({
    companyId,
    pageId,
  });

  return db.CmsPageSection.findAll({
    where: {
      companyId,
      cmsPageId: pageId,
      isActive: true,
    },

    include: [
      {
        model: db.CmsSectionType,
        as: "sectionType",
        required: true,
      },

      {
        model: db.User,
        as: "updatedByUser",
        attributes: [
          "id",
          "firstName",
          "lastName",
        ],
        required: false,
      },
    ],

    order: [
      ["displayOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
  });
};

const generateUniqueSectionCode =
  async ({
    pageId,
    initialCode,
    transaction,
  }) => {
    let candidate = initialCode;
    let counter = 1;

    while (true) {
      const existing =
        await db.CmsPageSection.findOne({
          where: {
            cmsPageId: pageId,
            code: candidate,
          },

          attributes: ["id"],
          transaction,
        });

      if (!existing) {
        return candidate;
      }

      counter += 1;

      candidate =
        `${initialCode}_${counter}`;
    }
  };

const getNextDisplayOrder = async ({
  companyId,
  pageId,
  transaction,
}) => {
  const maximum =
    await db.CmsPageSection.max(
      "displayOrder",
      {
        where: {
          companyId,
          cmsPageId: pageId,
          isActive: true,
        },

        transaction,
      }
    );

  return Number(maximum || 0) + 1;
};

const createCmsPageSection = async ({
  companyId,
  pageId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const page = await getCmsPage({
      companyId,
      pageId,
      transaction,
    });

    const sectionType =
      await db.CmsSectionType.findOne({
        where: {
          id:
            payload.sectionTypeId,

          companyId,
          isActive: true,
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

    const supportedChannels =
      sectionType.supportedChannels ||
      [];

    const pageChannels =
      page.channel === "BOTH"
        ? ["WEBSITE", "KIOSK"]
        : [page.channel];

    const supportsPage =
      pageChannels.some((channel) =>
        supportedChannels.includes(
          channel
        )
      );

    if (!supportsPage) {
      throw new AppError(
        `${sectionType.name} is not supported by the selected page channel.`,
        400,
        "CMS_SECTION_TYPE_CHANNEL_NOT_SUPPORTED"
      );
    }

    const displayOrder =
      await getNextDisplayOrder({
        companyId,
        pageId,
        transaction,
      });

    const initialCode =
      normalizeCode(
        payload.code ||
          `${sectionType.code}_${displayOrder}`
      );

    const code =
      await generateUniqueSectionCode({
        pageId,
        initialCode,
        transaction,
      });

    const section =
      await db.CmsPageSection.create(
        {
          companyId,
          cmsPageId: pageId,

          sectionTypeId:
            sectionType.id,

          name:
            payload.name?.trim() ||
            sectionType.name,

          code,
          displayOrder,

          settings: mergeObjects(
            sectionType.defaultSettings,
            payload.settings
          ),

          content: mergeObjects(
            sectionType.defaultContent,
            payload.content
          ),

          visibility: mergeObjects(
            DEFAULT_VISIBILITY,
            payload.visibility
          ),

          publishStartAt:
            payload.publishStartAt ||
            null,

          publishEndAt:
            payload.publishEndAt ||
            null,

          isEnabled:
            payload.isEnabled !==
            false,

          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        },
        {
          transaction,
        }
      );

    await syncAssetUsageReferences({
      companyId,
      module: "CMS",

      entityType:
        "CmsPageSection",

      entityId: section.id,
      entityName: section.name,

      previousObject: {},

      nextObject:
        buildSectionMediaObject({
          settings:
            section.settings,

          content:
            section.content,
        }),

      userId,
      transaction,
    });

    await transaction.commit();

    return getCmsPageSectionById({
      companyId,
      pageId,
      sectionId: section.id,
    });
  } catch (error) {
    await safeRollback(
      transaction
    );

    throw error;
  }
};

const updateCmsPageSection = async ({
  companyId,
  pageId,
  sectionId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    await getCmsPage({
      companyId,
      pageId,
      transaction,
    });

    const section =
      await db.CmsPageSection.findOne({
        where: {
          id: sectionId,
          cmsPageId: pageId,
          companyId,
          isActive: true,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!section) {
      throw new AppError(
        "CMS page section not found.",
        404,
        "CMS_PAGE_SECTION_NOT_FOUND"
      );
    }

    const previousMediaObject =
      buildSectionMediaObject({
        settings:
          section.settings,

        content:
          section.content,
      });

    const updateValues = {
      updatedBy: userId,
    };

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "name"
      )
    ) {
      updateValues.name =
        payload.name.trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "code"
      )
    ) {
      const newCode =
        normalizeCode(
          payload.code
        );

      const duplicate =
        await db.CmsPageSection.findOne({
          where: {
            cmsPageId: pageId,
            code: newCode,

            id: {
              [Op.ne]: sectionId,
            },
          },

          transaction,
        });

      if (duplicate) {
        throw new AppError(
          "Another section on this page already uses this code.",
          409,
          "CMS_PAGE_SECTION_CODE_EXISTS"
        );
      }

      updateValues.code =
        newCode;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "settings"
      )
    ) {
      updateValues.settings =
        mergeObjects(
          section.settings,
          payload.settings
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "content"
      )
    ) {
      updateValues.content =
        mergeObjects(
          section.content,
          payload.content
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "visibility"
      )
    ) {
      updateValues.visibility =
        mergeObjects(
          section.visibility,
          payload.visibility
        );
    }

    const directFields = [
      "publishStartAt",
      "publishEndAt",
      "isEnabled",
    ];

    for (const field of directFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          field
        )
      ) {
        updateValues[field] =
          payload[field];
      }
    }

    await section.update(
      updateValues,
      {
        transaction,
      }
    );

    const nextMediaObject =
      buildSectionMediaObject({
        settings:
          section.settings,

        content:
          section.content,
      });

    await syncAssetUsageReferences({
      companyId,
      module: "CMS",

      entityType:
        "CmsPageSection",

      entityId: section.id,
      entityName: section.name,

      previousObject:
        previousMediaObject,

      nextObject:
        nextMediaObject,

      userId,
      transaction,
    });

    await transaction.commit();

    return getCmsPageSectionById({
      companyId,
      pageId,
      sectionId,
    });
  } catch (error) {
    await safeRollback(
      transaction
    );

    throw error;
  }
};

const changeCmsPageSectionEnabled =
  async ({
    companyId,
    pageId,
    sectionId,
    userId,
    isEnabled,
  }) => {
    const section =
      await db.CmsPageSection.findOne({
        where: {
          id: sectionId,
          cmsPageId: pageId,
          companyId,
          isActive: true,
        },
      });

    if (!section) {
      throw new AppError(
        "CMS page section not found.",
        404,
        "CMS_PAGE_SECTION_NOT_FOUND"
      );
    }

    await section.update({
      isEnabled,
      updatedBy: userId,
    });

    return getCmsPageSectionById({
      companyId,
      pageId,
      sectionId,
    });
  };

const reorderCmsPageSections = async ({
  companyId,
  pageId,
  userId,
  sections,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    await getCmsPage({
      companyId,
      pageId,
      transaction,
    });

    const uniqueIds = new Set(
      sections.map(
        (item) => item.id
      )
    );

    if (
      uniqueIds.size !==
      sections.length
    ) {
      throw new AppError(
        "Duplicate section IDs are not allowed.",
        400,
        "DUPLICATE_SECTION_IDS"
      );
    }

    const existingSections =
      await db.CmsPageSection.findAll({
        where: {
          id: {
            [Op.in]: sections.map(
              (item) => item.id
            ),
          },

          cmsPageId: pageId,
          companyId,
          isActive: true,
        },

        transaction,
      });

    if (
      existingSections.length !==
      sections.length
    ) {
      throw new AppError(
        "One or more CMS page sections were not found.",
        404,
        "CMS_PAGE_SECTION_NOT_FOUND"
      );
    }

    for (const item of sections) {
      await db.CmsPageSection.update(
        {
          displayOrder:
            item.displayOrder,

          updatedBy: userId,
        },
        {
          where: {
            id: item.id,
            cmsPageId: pageId,
            companyId,
          },

          transaction,
        }
      );
    }

    await transaction.commit();

    return listCmsPageSections({
      companyId,
      pageId,
    });
  } catch (error) {
    await safeRollback(
      transaction
    );

    throw error;
  }
};

const duplicateCmsPageSection =
  async ({
    companyId,
    pageId,
    sectionId,
    userId,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const sourceSection =
        await db.CmsPageSection.findOne({
          where: {
            id: sectionId,
            cmsPageId: pageId,
            companyId,
            isActive: true,
          },

          transaction,
        });

      if (!sourceSection) {
        throw new AppError(
          "CMS page section not found.",
          404,
          "CMS_PAGE_SECTION_NOT_FOUND"
        );
      }

      const nextDisplayOrder =
        await getNextDisplayOrder({
          companyId,
          pageId,
          transaction,
        });

      const copiedCode =
        await generateUniqueSectionCode(
          {
            pageId,

            initialCode:
              `${sourceSection.code}_COPY`,

            transaction,
          }
        );

      const duplicatedSection =
        await db.CmsPageSection.create(
          {
            companyId,
            cmsPageId: pageId,

            sectionTypeId:
              sourceSection.sectionTypeId,

            name:
              `${sourceSection.name} Copy`,

            code: copiedCode,

            displayOrder:
              nextDisplayOrder,

            settings:
              sourceSection.settings ||
              {},

            content:
              sourceSection.content ||
              {},

            visibility:
              sourceSection.visibility ||
              DEFAULT_VISIBILITY,

            publishStartAt: null,
            publishEndAt: null,
            isEnabled: false,
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
          },
          {
            transaction,
          }
        );

      await syncAssetUsageReferences({
        companyId,
        module: "CMS",

        entityType:
          "CmsPageSection",

        entityId:
          duplicatedSection.id,

        entityName:
          duplicatedSection.name,

        previousObject: {},

        nextObject:
          buildSectionMediaObject({
            settings:
              duplicatedSection.settings,

            content:
              duplicatedSection.content,
          }),

        userId,
        transaction,
      });

      await transaction.commit();

      return getCmsPageSectionById({
        companyId,
        pageId,

        sectionId:
          duplicatedSection.id,
      });
    } catch (error) {
      await safeRollback(
        transaction
      );

      throw error;
    }
  };

const deleteCmsPageSection = async ({
  companyId,
  pageId,
  sectionId,
  userId,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const section =
      await db.CmsPageSection.findOne({
        where: {
          id: sectionId,
          cmsPageId: pageId,
          companyId,
          isActive: true,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!section) {
      throw new AppError(
        "CMS page section not found.",
        404,
        "CMS_PAGE_SECTION_NOT_FOUND"
      );
    }

    await section.update(
      {
        isActive: false,
        isEnabled: false,
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    await removeEntityMediaUsage({
      companyId,
      module: "CMS",

      entityType:
        "CmsPageSection",

      entityId: section.id,
      userId,
      transaction,
    });

    const remainingSections =
      await db.CmsPageSection.findAll({
        where: {
          companyId,
          cmsPageId: pageId,
          isActive: true,
        },

        order: [
          ["displayOrder", "ASC"],
        ],

        transaction,
      });

    for (
      let index = 0;
      index <
      remainingSections.length;
      index += 1
    ) {
      await remainingSections[
        index
      ].update(
        {
          displayOrder:
            index + 1,

          updatedBy: userId,
        },
        {
          transaction,
        }
      );
    }

    await transaction.commit();

    return {
      id: sectionId,
    };
  } catch (error) {
    await safeRollback(
      transaction
    );

    throw error;
  }
};

module.exports = {
  listCmsPageSections,
  getCmsPageSectionById,
  createCmsPageSection,
  updateCmsPageSection,
  changeCmsPageSectionEnabled,
  reorderCmsPageSections,
  duplicateCmsPageSection,
  deleteCmsPageSection,
};