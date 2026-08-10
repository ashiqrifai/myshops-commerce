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
  generateSlug,
  generateCode,
  normalizeNullable,
} = require(
  "./brand.utils"
);

const BRAND_INCLUDE = [
  {
    model:
      db.MediaAsset,

    as:
      "logoAsset",

    required:
      false,

    include: [
      {
        model:
          db.MediaAssetVariant,

        as:
          "variants",

        where: {
          isActive:
            true,
        },

        required:
          false,

        attributes: [
          "id",
          "variantType",
          "format",
          "mimeType",
          "width",
          "height",
          "publicUrl",
          "isPrimary",
        ],
      },
    ],
  },

  {
    model:
      db.MediaAsset,

    as:
      "bannerAsset",

    required:
      false,

    include: [
      {
        model:
          db.MediaAssetVariant,

        as:
          "variants",

        where: {
          isActive:
            true,
        },

        required:
          false,

        attributes: [
          "id",
          "variantType",
          "format",
          "mimeType",
          "width",
          "height",
          "publicUrl",
          "isPrimary",
        ],
      },
    ],
  },

  {
    model:
      db.User,

    as:
      "createdByUser",

    required:
      false,

    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
    ],
  },

  {
    model:
      db.User,

    as:
      "updatedByUser",

    required:
      false,

    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
    ],
  },
];

const validateImageAsset = async ({
  companyId,
  assetId,
  fieldName,
  transaction,
}) => {
  if (!assetId) {
    return null;
  }

  const asset =
    await db.MediaAsset.findOne({
      where: {
        id:
          assetId,

        companyId,

        isActive:
          true,

        assetType:
          "IMAGE",
      },

      transaction,
    });

  if (!asset) {
    throw new AppError(
      `${fieldName} image was not found.`,
      400,
      "BRAND_MEDIA_ASSET_INVALID"
    );
  }

  return asset;
};

const ensureUniqueBrand = async ({
  companyId,
  code,
  slug,
  excludeId,
  transaction,
}) => {
  const where = {
    companyId,

    [Op.or]: [
      {
        code,
      },

      {
        slug,
      },
    ],
  };

  if (excludeId) {
    where.id = {
      [Op.ne]:
        excludeId,
    };
  }

  const existing =
    await db.Brand.findOne({
      where,

      transaction,
    });

  if (!existing) {
    return;
  }

  if (
    existing.code === code
  ) {
    throw new AppError(
      "A brand with this code already exists.",
      409,
      "BRAND_CODE_EXISTS"
    );
  }

  throw new AppError(
    "A brand with this slug already exists.",
    409,
    "BRAND_SLUG_EXISTS"
  );
};

const getBrandById = async ({
  companyId,
  brandId,
  transaction,
}) => {
  const brand =
    await db.Brand.findOne({
      where: {
        id:
          brandId,

        companyId,
      },

      include:
        BRAND_INCLUDE,

      transaction,
    });

  if (!brand) {
    throw new AppError(
      "Brand not found.",
      404,
      "BRAND_NOT_FOUND"
    );
  }

  return brand;
};

const listBrands = async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  isActive,
  isFeatured,
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
    typeof isFeatured ===
    "boolean"
  ) {
    where.isFeatured =
      isFeatured;
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
        slug: {
          [Op.iLike]:
            `%${search}%`,
        },
      },

      {
        countryOfOrigin: {
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
    await db.Brand.findAndCountAll({
      where,

      include:
        BRAND_INCLUDE,

      distinct:
        true,

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

const createBrand = async ({
  companyId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize
      .transaction();

  try {
    const name =
      payload.name.trim();

    const code =
      generateCode(
        payload.code ||
          name
      );

    const slug =
      generateSlug(
        payload.slug ||
          name
      );

    if (!code) {
      throw new AppError(
        "Brand code could not be generated.",
        400,
        "BRAND_CODE_REQUIRED"
      );
    }

    if (!slug) {
      throw new AppError(
        "Brand slug could not be generated.",
        400,
        "BRAND_SLUG_REQUIRED"
      );
    }

    await ensureUniqueBrand({
      companyId,
      code,
      slug,
      transaction,
    });

    await validateImageAsset({
      companyId,
      assetId:
        payload.logoAssetId,
      fieldName:
        "Brand logo",
      transaction,
    });

    await validateImageAsset({
      companyId,
      assetId:
        payload.bannerAssetId,
      fieldName:
        "Brand banner",
      transaction,
    });

    const brand =
      await db.Brand.create(
        {
          companyId,
          name,
          code,
          slug,

          description:
            normalizeNullable(
              payload.description
            ),

          logoAssetId:
            normalizeNullable(
              payload.logoAssetId
            ),

          bannerAssetId:
            normalizeNullable(
              payload.bannerAssetId
            ),

          websiteUrl:
            normalizeNullable(
              payload.websiteUrl
            ),

          countryOfOrigin:
            normalizeNullable(
              payload.countryOfOrigin
            ),

          isActive:
            payload.isActive !==
            false,

          isFeatured:
            payload.isFeatured ===
            true,

          sortOrder:
            Number(
              payload.sortOrder ||
                0
            ),

          metaTitle:
            normalizeNullable(
              payload.metaTitle
            ),

          metaDescription:
            normalizeNullable(
              payload.metaDescription
            ),

          metaKeywords:
            normalizeNullable(
              payload.metaKeywords
            ),

          createdBy:
            userId,

          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );

    await transaction
      .commit();

    return getBrandById({
      companyId,
      brandId:
        brand.id,
    });
  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction
        .rollback();
    }

    throw error;
  }
};

const updateBrand = async ({
  companyId,
  brandId,
  userId,
  payload,
}) => {
  const transaction =
    await db.sequelize
      .transaction();

  try {
    const brand =
      await db.Brand.findOne({
        where: {
          id:
            brandId,

          companyId,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!brand) {
      throw new AppError(
        "Brand not found.",
        404,
        "BRAND_NOT_FOUND"
      );
    }

    const name =
      payload.name !==
      undefined
        ? payload.name.trim()
        : brand.name;

    const code =
      payload.code !==
      undefined
        ? generateCode(
            payload.code ||
              name
          )
        : brand.code;

    const slug =
      payload.slug !==
      undefined
        ? generateSlug(
            payload.slug ||
              name
          )
        : brand.slug;

    await ensureUniqueBrand({
      companyId,
      code,
      slug,
      excludeId:
        brand.id,
      transaction,
    });

    if (
      Object.prototype
        .hasOwnProperty.call(
          payload,
          "logoAssetId"
        )
    ) {
      await validateImageAsset({
        companyId,
        assetId:
          payload.logoAssetId,
        fieldName:
          "Brand logo",
        transaction,
      });
    }

    if (
      Object.prototype
        .hasOwnProperty.call(
          payload,
          "bannerAssetId"
        )
    ) {
      await validateImageAsset({
        companyId,
        assetId:
          payload.bannerAssetId,
        fieldName:
          "Brand banner",
        transaction,
      });
    }

    const updateValues = {
      name,
      code,
      slug,
      updatedBy:
        userId,
    };

    const nullableFields = [
      "description",
      "logoAssetId",
      "bannerAssetId",
      "websiteUrl",
      "countryOfOrigin",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
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

    const directFields = [
      "isActive",
      "isFeatured",
      "sortOrder",
    ];

    for (
      const field of
      directFields
    ) {
      if (
        Object.prototype
          .hasOwnProperty.call(
            payload,
            field
          )
      ) {
        updateValues[field] =
          field ===
          "sortOrder"
            ? Number(
                payload[field] ||
                  0
              )
            : payload[field];
      }
    }

    await brand.update(
      updateValues,
      {
        transaction,
      }
    );

    await transaction
      .commit();

    return getBrandById({
      companyId,
      brandId:
        brand.id,
    });
  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction
        .rollback();
    }

    throw error;
  }
};

const changeBrandStatus = async ({
  companyId,
  brandId,
  userId,
  isActive,
}) => {
  const brand =
    await db.Brand.findOne({
      where: {
        id:
          brandId,

        companyId,
      },
    });

  if (!brand) {
    throw new AppError(
      "Brand not found.",
      404,
      "BRAND_NOT_FOUND"
    );
  }

  await brand.update({
    isActive,
    updatedBy:
      userId,
  });

  return getBrandById({
    companyId,
    brandId,
  });
};

const deleteBrand = async ({
  companyId,
  brandId,
}) => {
  const brand =
    await db.Brand.findOne({
      where: {
        id:
          brandId,

        companyId,
      },
    });

  if (!brand) {
    throw new AppError(
      "Brand not found.",
      404,
      "BRAND_NOT_FOUND"
    );
  }

  if (
    db.Product &&
    typeof brand.countProducts ===
      "function"
  ) {
    const productCount =
      await brand.countProducts();

    if (
      productCount > 0
    ) {
      throw new AppError(
        "This brand is assigned to products and cannot be deleted. Deactivate it instead.",
        409,
        "BRAND_IN_USE"
      );
    }
  }

  await brand.destroy();

  return {
    id:
      brandId,
  };
};

module.exports = {
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  changeBrandStatus,
  deleteBrand,
};
