const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const normalizeCode = (value) =>
  value.trim().toUpperCase();

const normalizeSlug = (value) => {
  const trimmed = value.trim();

  if (trimmed === "/") {
    return "/";
  }

  const withLeadingSlash =
    trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`;

  return withLeadingSlash
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase();
};

const getCmsPageById = async ({
  companyId,
  pageId,
}) => {
  const page = await db.CmsPage.findOne({
    where: {
      id: pageId,
      companyId,
    },
    include: [
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

const listCmsPages = async ({
  companyId,
  page = 1,
  pageSize = 25,
  search,
  pageType,
  channel,
  status,
  isActive,
  sortBy = "updatedAt",
  sortDirection = "DESC",
}) => {
  const where = {
    companyId,
  };

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
        slug: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        title: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  if (pageType) {
    where.pageType = pageType;
  }

  if (channel) {
    where.channel = channel;
  }

  if (status) {
    where.status = status;
  }

  if (
    typeof isActive === "boolean"
  ) {
    where.isActive = isActive;
  }

  const offset =
    (Number(page) - 1) * Number(pageSize);

  const result =
    await db.CmsPage.findAndCountAll({
      where,
      limit: Number(pageSize),
      offset,
      distinct: true,
      order: [
        [
          sortBy,
          sortDirection.toUpperCase(),
        ],
      ],
      include: [
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
    });

  return {
    rows: result.rows,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      totalItems: result.count,
      totalPages: Math.ceil(
        result.count / Number(pageSize)
      ),
    },
  };
};

const clearOtherDefaults = async ({
  companyId,
  channel,
  pageId,
  transaction,
}) => {
  await db.CmsPage.update(
    {
      isDefault: false,
    },
    {
      where: {
        companyId,
        channel,
        id: {
          [Op.ne]: pageId,
        },
        isDefault: true,
      },
      transaction,
    }
  );
};

const createCmsPage = async ({
  companyId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const code = normalizeCode(
      payload.code
    );

    const slug = normalizeSlug(
      payload.slug
    );

    const existingCode =
      await db.CmsPage.findOne({
        where: {
          companyId,
          code,
        },
        transaction,
      });

    if (existingCode) {
      throw new AppError(
        "A CMS page with this code already exists.",
        409,
        "CMS_PAGE_CODE_EXISTS"
      );
    }

    const existingSlug =
      await db.CmsPage.findOne({
        where: {
          companyId,
          channel:
            payload.channel || "WEBSITE",
          slug,
        },
        transaction,
      });

    if (existingSlug) {
      throw new AppError(
        "A CMS page with this channel and slug already exists.",
        409,
        "CMS_PAGE_SLUG_EXISTS"
      );
    }

    const page = await db.CmsPage.create(
      {
        companyId,
        name: payload.name.trim(),
        code,
        slug,
        pageType: payload.pageType,
        channel:
          payload.channel || "WEBSITE",
        status: "DRAFT",
        title: payload.title || null,
        description:
          payload.description || null,
        seoTitle:
          payload.seoTitle || null,
        seoDescription:
          payload.seoDescription || null,
        seoKeywords:
          payload.seoKeywords || [],
        layoutSettings:
          payload.layoutSettings || {},
        publishStartAt:
          payload.publishStartAt || null,
        publishEndAt:
          payload.publishEndAt || null,
        isDefault:
          payload.isDefault || false,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    if (page.isDefault) {
      await clearOtherDefaults({
        companyId,
        channel: page.channel,
        pageId: page.id,
        transaction,
      });
    }

    await transaction.commit();

    return getCmsPageById({
      companyId,
      pageId: page.id,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateCmsPage = async ({
  companyId,
  pageId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
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

    const newCode = payload.code
      ? normalizeCode(payload.code)
      : page.code;

    const newChannel =
      payload.channel || page.channel;

    const newSlug = payload.slug
      ? normalizeSlug(payload.slug)
      : page.slug;

    if (newCode !== page.code) {
      const duplicateCode =
        await db.CmsPage.findOne({
          where: {
            companyId,
            code: newCode,
            id: {
              [Op.ne]: page.id,
            },
          },
          transaction,
        });

      if (duplicateCode) {
        throw new AppError(
          "A CMS page with this code already exists.",
          409,
          "CMS_PAGE_CODE_EXISTS"
        );
      }
    }

    if (
      newSlug !== page.slug ||
      newChannel !== page.channel
    ) {
      const duplicateSlug =
        await db.CmsPage.findOne({
          where: {
            companyId,
            channel: newChannel,
            slug: newSlug,
            id: {
              [Op.ne]: page.id,
            },
          },
          transaction,
        });

      if (duplicateSlug) {
        throw new AppError(
          "A CMS page with this channel and slug already exists.",
          409,
          "CMS_PAGE_SLUG_EXISTS"
        );
      }
    }

    const updateValues = {
      updatedBy: userId,
    };

    const allowedFields = [
      "name",
      "pageType",
      "channel",
      "title",
      "description",
      "seoTitle",
      "seoDescription",
      "seoKeywords",
      "layoutSettings",
      "publishStartAt",
      "publishEndAt",
      "isDefault",
    ];

    for (const field of allowedFields) {
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

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "code"
      )
    ) {
      updateValues.code = newCode;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "slug"
      )
    ) {
      updateValues.slug = newSlug;
    }

    await page.update(
      updateValues,
      {
        transaction,
      }
    );

    if (
      payload.isDefault === true
    ) {
      await clearOtherDefaults({
        companyId,
        channel: newChannel,
        pageId: page.id,
        transaction,
      });
    }

    await transaction.commit();

    return getCmsPageById({
      companyId,
      pageId: page.id,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const changeCmsPageStatus = async ({
  companyId,
  pageId,
  userId,
  status,
}) => {
  const page =
    await db.CmsPage.findOne({
      where: {
        id: pageId,
        companyId,
      },
    });

  if (!page) {
    throw new AppError(
      "CMS page not found.",
      404,
      "CMS_PAGE_NOT_FOUND"
    );
  }

  if (
    status === "PUBLISHED" &&
    !page.isActive
  ) {
    throw new AppError(
      "An inactive CMS page cannot be published.",
      400,
      "CMS_PAGE_INACTIVE"
    );
  }

  const updateValues = {
    status,
    updatedBy: userId,
  };

  if (status === "PUBLISHED") {
    updateValues.publishedAt =
      new Date();
  }

  if (
    status === "DRAFT" ||
    status === "UNPUBLISHED"
  ) {
    updateValues.publishedAt = null;
  }

  await page.update(updateValues);

  return getCmsPageById({
    companyId,
    pageId,
  });
};

const changeCmsPageActive = async ({
  companyId,
  pageId,
  userId,
  isActive,
}) => {
  const page =
    await db.CmsPage.findOne({
      where: {
        id: pageId,
        companyId,
      },
    });

  if (!page) {
    throw new AppError(
      "CMS page not found.",
      404,
      "CMS_PAGE_NOT_FOUND"
    );
  }

  const updateValues = {
    isActive,
    updatedBy: userId,
  };

  if (!isActive) {
    updateValues.status =
      "UNPUBLISHED";

    updateValues.publishedAt = null;
    updateValues.isDefault = false;
  }

  await page.update(updateValues);

  return getCmsPageById({
    companyId,
    pageId,
  });
};

const generateUniqueCopyValue =
  async ({
    companyId,
    field,
    initialValue,
    channel,
  }) => {
    let candidate = initialValue;
    let counter = 1;

    while (true) {
      const where = {
        companyId,
        [field]: candidate,
      };

      if (field === "slug") {
        where.channel = channel;
      }

      const existing =
        await db.CmsPage.findOne({
          where,
          attributes: ["id"],
        });

      if (!existing) {
        return candidate;
      }

      counter += 1;

      candidate =
        field === "slug"
          ? `${initialValue}-${counter}`
          : `${initialValue}_${counter}`;
    }
  };

const duplicateCmsPage = async ({
  companyId,
  pageId,
  userId,
}) => {
  const sourcePage =
    await db.CmsPage.findOne({
      where: {
        id: pageId,
        companyId,
      },
    });

  if (!sourcePage) {
    throw new AppError(
      "CMS page not found.",
      404,
      "CMS_PAGE_NOT_FOUND"
    );
  }

  const copyCode =
    await generateUniqueCopyValue({
      companyId,
      field: "code",
      initialValue: `${sourcePage.code}_COPY`,
    });

  const slugBase =
    sourcePage.slug === "/"
      ? "/home-copy"
      : `${sourcePage.slug}-copy`;

  const copySlug =
    await generateUniqueCopyValue({
      companyId,
      field: "slug",
      initialValue: slugBase,
      channel: sourcePage.channel,
    });

  const duplicatedPage =
    await db.CmsPage.create({
      companyId,
      name: `${sourcePage.name} Copy`,
      code: copyCode,
      slug: copySlug,
      pageType: sourcePage.pageType,
      channel: sourcePage.channel,
      status: "DRAFT",
      title: sourcePage.title,
      description:
        sourcePage.description,
      seoTitle: sourcePage.seoTitle,
      seoDescription:
        sourcePage.seoDescription,
      seoKeywords:
        sourcePage.seoKeywords || [],
      layoutSettings:
        sourcePage.layoutSettings || {},
      publishedAt: null,
      publishStartAt: null,
      publishEndAt: null,
      isDefault: false,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

  return getCmsPageById({
    companyId,
    pageId: duplicatedPage.id,
  });
};

module.exports = {
  listCmsPages,
  getCmsPageById,
  createCmsPage,
  updateCmsPage,
  changeCmsPageStatus,
  changeCmsPageActive,
  duplicateCmsPage,
};