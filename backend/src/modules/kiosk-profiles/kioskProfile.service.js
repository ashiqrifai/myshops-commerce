const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getProfileById = async ({
  companyId,
  profileId,
  transaction,
}) => {
  const profile =
    await db.KioskProfile.findOne({
      where: {
        id: profileId,
        companyId,
      },

      include: [
        {
          model: db.InventoryLocation,
          as: "inventoryLocation",
          required: true,
        },

        {
          model: db.KioskProfilePage,
          as: "pages",
          required: false,

          where: {
            isActive: true,
          },

          include: [
            {
              model: db.CmsPage,
              as: "cmsPage",
              required: true,
            },
          ],
        },

        {
          model: db.KioskDevice,
          as: "devices",
          required: false,

          where: {
            isActive: true,
          },
        },
      ],

      order: [
        [
          {
            model: db.KioskProfilePage,
            as: "pages",
          },
          "pageType",
          "ASC",
        ],
      ],

      transaction,
    });

  if (!profile) {
    throw new AppError(
      "Kiosk profile not found.",
      404,
      "KIOSK_PROFILE_NOT_FOUND"
    );
  }

  return profile;
};

const listProfiles = async ({
  companyId,
  search,
  isActive,
}) => {
  const where = {
    companyId,
  };

  if (
    typeof isActive === "boolean"
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
    ];
  }

  return db.KioskProfile.findAll({
    where,

    include: [
      {
        model: db.InventoryLocation,
        as: "inventoryLocation",
        required: true,

        attributes: [
          "id",
          "code",
          "name",
          "locationType",
          "isActive",
        ],
      },

      {
        model: db.KioskProfilePage,
        as: "pages",
        required: false,

        where: {
          isActive: true,
        },

        include: [
          {
            model: db.CmsPage,
            as: "cmsPage",
            required: true,

            attributes: [
              "id",
              "name",
              "code",
              "slug",
              "pageType",
              "channel",
              "status",
              "isActive",
            ],
          },
        ],
      },

      {
        model: db.KioskDevice,
        as: "devices",
        required: false,

        where: {
          isActive: true,
        },

        attributes: [
          "id",
          "deviceCode",
          "deviceName",
          "status",
          "appVersion",
          "lastSeenAt",
        ],
      },
    ],

    order: [
      ["isDefault", "DESC"],
      ["name", "ASC"],
    ],
  });
};

const validateInventoryLocation =
  async ({
    companyId,
    inventoryLocationId,
    transaction,
  }) => {
    const location =
      await db.InventoryLocation.findOne({
        where: {
          id: inventoryLocationId,
          companyId,
          isActive: true,
        },

        transaction,
      });

    if (!location) {
      throw new AppError(
        "Inventory location not found or inactive.",
        404,
        "INVENTORY_LOCATION_NOT_FOUND"
      );
    }

    return location;
  };

const clearOtherDefaults =
  async ({
    companyId,
    profileId,
    transaction,
  }) => {
    await db.KioskProfile.update(
      {
        isDefault: false,
      },
      {
        where: {
          companyId,

          id: {
            [Op.ne]: profileId,
          },

          isDefault: true,
        },

        transaction,
      }
    );
  };

const provisionDedicatedHomePage = async ({
  companyId,
  profile,
  userId,
  sourceCmsPageId,
  transaction,
}) => {
  const sourcePage = await db.CmsPage.findOne({
    where: {
      id: sourceCmsPageId,
      companyId,
      isActive: true,
      channel: {
        [Op.in]: ["KIOSK", "BOTH"],
      },
    },
    transaction,
  });

  if (!sourcePage) {
    throw new AppError(
      "Kiosk CMS template page not found.",
      404,
      "KIOSK_TEMPLATE_PAGE_NOT_FOUND"
    );
  }

  const profileCode = normalizeCode(profile.code).replace(/_KIOSK$/, "");
  const pageCode = `KIOSK_HOME_${profileCode}`;
  const slug = `/kiosk/${profileCode.toLowerCase().replace(/_/g, "-")}`;

  /*
   * Idempotency:
   * If this profile already has its dedicated page, reuse it.
   */
  let dedicatedPage = await db.CmsPage.findOne({
    where: {
      companyId,
      code: pageCode,
      channel: "KIOSK",
      isActive: true,
    },
    transaction,
  });

  if (!dedicatedPage) {
    const slugConflict = await db.CmsPage.findOne({
      where: {
        companyId,
        channel: "KIOSK",
        slug,
      },
      attributes: ["id", "code"],
      transaction,
    });

    if (slugConflict) {
      throw new AppError(
        "A different kiosk CMS page already uses this store slug.",
        409,
        "KIOSK_HOME_SLUG_EXISTS"
      );
    }

    dedicatedPage = await db.CmsPage.create(
      {
        companyId,
        name: `${profile.name} Home`,
        code: pageCode,
        slug,
        pageType: "HOME",
        channel: "KIOSK",
        status: sourcePage.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        title: sourcePage.title,
        description: sourcePage.description,
        seoTitle: sourcePage.seoTitle,
        seoDescription: sourcePage.seoDescription,
        seoKeywords: sourcePage.seoKeywords || [],
        layoutSettings: sourcePage.layoutSettings || {},
        publishedAt: sourcePage.status === "PUBLISHED" ? new Date() : null,
        publishStartAt: null,
        publishEndAt: null,
        isDefault: false,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction }
    );

    const sourceSections = await db.CmsPageSection.findAll({
      where: {
        companyId,
        cmsPageId: sourcePage.id,
        isActive: true,
      },
      order: [["displayOrder", "ASC"]],
      transaction,
    });

    if (sourceSections.length > 0) {
      await db.CmsPageSection.bulkCreate(
        sourceSections.map((section) => ({
          companyId,
          cmsPageId: dedicatedPage.id,
          sectionTypeId: section.sectionTypeId,
          name: section.name,
          code: section.code,
          displayOrder: section.displayOrder,
          settings: section.settings || {},
          content: section.content || {},
          visibility: section.visibility || {
            desktop: true,
            tablet: true,
            mobile: true,
            kiosk: true,
          },
          publishStartAt: section.publishStartAt,
          publishEndAt: section.publishEndAt,
          isEnabled: section.isEnabled,
          isActive: section.isActive,
          createdBy: userId,
          updatedBy: userId,
        })),
        { transaction }
      );
    }
  }

  const [assignment, created] = await db.KioskProfilePage.findOrCreate({
    where: {
      companyId,
      kioskProfileId: profile.id,
      pageType: "HOME",
    },
    defaults: {
      cmsPageId: dedicatedPage.id,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    },
    transaction,
  });

  if (
    !created &&
    (assignment.cmsPageId !== dedicatedPage.id || !assignment.isActive)
  ) {
    await assignment.update(
      {
        cmsPageId: dedicatedPage.id,
        isActive: true,
        updatedBy: userId,
      },
      { transaction }
    );
  }

  return dedicatedPage;
};

const createProfile = async ({
  companyId,
  userId,
  payload,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    await validateInventoryLocation({
      companyId,
      inventoryLocationId: payload.inventoryLocationId,
      transaction,
    });

    const code = normalizeCode(payload.code);

    const duplicate = await db.KioskProfile.findOne({
      where: {
        companyId,
        code,
      },
      transaction,
    });

    if (duplicate) {
      throw new AppError(
        "A kiosk profile with this code already exists.",
        409,
        "KIOSK_PROFILE_CODE_EXISTS"
      );
    }

    const profile = await db.KioskProfile.create(
      {
        companyId,
        inventoryLocationId: payload.inventoryLocationId,
        name: payload.name.trim(),
        code,
        description: payload.description || null,
        settings: payload.settings || {},
        isDefault: payload.isDefault === true,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction }
    );

    await provisionDedicatedHomePage({
      companyId,
      profile,
      userId,
      sourceCmsPageId: payload.sourceCmsPageId,
      transaction,
    });

    if (profile.isDefault) {
      await clearOtherDefaults({
        companyId,
        profileId: profile.id,
        transaction,
      });
    }

    await transaction.commit();

    return getProfileById({
      companyId,
      profileId: profile.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const updateProfile = async ({
  companyId,
  profileId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const profile =
      await db.KioskProfile.findOne({
        where: {
          id: profileId,
          companyId,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!profile) {
      throw new AppError(
        "Kiosk profile not found.",
        404,
        "KIOSK_PROFILE_NOT_FOUND"
      );
    }

    if (
      payload.inventoryLocationId
    ) {
      await validateInventoryLocation({
        companyId,

        inventoryLocationId:
          payload.inventoryLocationId,

        transaction,
      });
    }

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
      const code =
        normalizeCode(
          payload.code
        );

      const duplicate =
        await db.KioskProfile.findOne({
          where: {
            companyId,
            code,

            id: {
              [Op.ne]:
                profile.id,
            },
          },

          transaction,
        });

      if (duplicate) {
        throw new AppError(
          "A kiosk profile with this code already exists.",
          409,
          "KIOSK_PROFILE_CODE_EXISTS"
        );
      }

      updateValues.code =
        code;
    }

    const directFields = [
      "inventoryLocationId",
      "description",
      "settings",
      "isDefault",
      "isActive",
    ];

    for (
      const field of
      directFields
    ) {
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

    await profile.update(
      updateValues,
      {
        transaction,
      }
    );

    if (
      payload.isDefault ===
      true
    ) {
      await clearOtherDefaults({
        companyId,
        profileId:
          profile.id,
        transaction,
      });
    }

    await transaction.commit();

    return getProfileById({
      companyId,
      profileId:
        profile.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const assignPage = async ({
  companyId,
  profileId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const profile =
      await db.KioskProfile.findOne({
        where: {
          id: profileId,
          companyId,
          isActive: true,
        },

        transaction,
      });

    if (!profile) {
      throw new AppError(
        "Kiosk profile not found.",
        404,
        "KIOSK_PROFILE_NOT_FOUND"
      );
    }

    const cmsPage =
      await db.CmsPage.findOne({
        where: {
          id: payload.cmsPageId,
          companyId,
          isActive: true,

          channel: {
            [Op.in]: [
              "KIOSK",
              "BOTH",
            ],
          },
        },

        transaction,
      });

    if (!cmsPage) {
      throw new AppError(
        "The selected CMS page is not available for the kiosk channel.",
        400,
        "INVALID_KIOSK_CMS_PAGE"
      );
    }

    const [
      assignment,
      created,
    ] =
      await db.KioskProfilePage.findOrCreate({
        where: {
          companyId,
          kioskProfileId:
            profileId,
          pageType:
            payload.pageType,
        },

        defaults: {
          cmsPageId:
            cmsPage.id,

          isActive: true,

          createdBy:
            userId,

          updatedBy:
            userId,
        },

        transaction,
      });

    if (!created) {
      await assignment.update(
        {
          cmsPageId:
            cmsPage.id,

          isActive: true,

          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );
    }

    await transaction.commit();

    return getProfileById({
      companyId,
      profileId,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const createDedicatedHomePage = async ({
  companyId,
  profileId,
  userId,
  sourceCmsPageId,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const profile = await db.KioskProfile.findOne({
      where: {
        id: profileId,
        companyId,
        isActive: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!profile) {
      throw new AppError(
        "Kiosk profile not found.",
        404,
        "KIOSK_PROFILE_NOT_FOUND"
      );
    }

    await provisionDedicatedHomePage({
      companyId,
      profile,
      userId,
      sourceCmsPageId,
      transaction,
    });

    await transaction.commit();

    return getProfileById({
      companyId,
      profileId: profile.id,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  listProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  assignPage,
  createDedicatedHomePage,
};
