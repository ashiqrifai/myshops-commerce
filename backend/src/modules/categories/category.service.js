const {
    Op,
  } = require("sequelize");
  
  const db = require("../../models");
  const AppError = require(
    "../../utils/AppError"
  );
  
  const {
    generateSlug,
    normalizeWhitespace,
    normalizeNullableText,
    buildCategoryTree,
  } = require(
    "./category.utils"
  );
  
  const categoryIncludes = [
    {
      model: db.Category,
      as: "parent",
      required: false,
      attributes: [
        "id",
        "name",
        "slug",
        "level",
        "categoryPath",
      ],
    },
    {
      model: db.MediaAsset,
      as: "thumbnailAsset",
      required: false,
    },
    {
      model: db.MediaAsset,
      as: "imageAsset",
      required: false,
    },
    {
      model: db.MediaAsset,
      as: "bannerAsset",
      required: false,
    },
    {
      model: db.CmsPage,
      as: "landingPage",
      required: false,
      attributes: [
        "id",
        "title",
        "slug",
        "status",
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
  
  const getCategoryOrFail = async ({
    categoryId,
    companyId,
    transaction,
    include = categoryIncludes,
  }) => {
    const category =
      await db.Category.findOne({
        where: {
          id: categoryId,
          companyId,
        },
        include,
        transaction,
      });
  
    if (!category) {
      throw new AppError(
        "Category was not found.",
        404,
        "CATEGORY_NOT_FOUND"
      );
    }
  
    return category;
  };
  
  const validateRelatedRecord = async ({
    model,
    id,
    companyId,
    label,
    transaction,
  }) => {
    if (!id) {
      return null;
    }
  
    const record = await model.findOne({
      where: {
        id,
        companyId,
      },
      transaction,
    });
  
    if (!record) {
      throw new AppError(
        `${label} was not found.`,
        400,
        "INVALID_CATEGORY_REFERENCE"
      );
    }
  
    return record;
  };
  
  const validateCategoryAssets =
    async ({
      companyId,
      thumbnailAssetId,
      imageAssetId,
      bannerAssetId,
      landingPageId,
      transaction,
    }) => {
      await Promise.all([
        validateRelatedRecord({
          model: db.MediaAsset,
          id: thumbnailAssetId,
          companyId,
          label:
            "Thumbnail media asset",
          transaction,
        }),
  
        validateRelatedRecord({
          model: db.MediaAsset,
          id: imageAssetId,
          companyId,
          label: "Image media asset",
          transaction,
        }),
  
        validateRelatedRecord({
          model: db.MediaAsset,
          id: bannerAssetId,
          companyId,
          label: "Banner media asset",
          transaction,
        }),
  
        validateRelatedRecord({
          model: db.CmsPage,
          id: landingPageId,
          companyId,
          label: "Landing page",
          transaction,
        }),
      ]);
    };
  
  const createUniqueSlug = async ({
    companyId,
    value,
    excludeCategoryId = null,
    transaction,
  }) => {
    const baseSlug =
      generateSlug(value);
  
    if (!baseSlug) {
      throw new AppError(
        "A valid category slug could not be generated.",
        400,
        "INVALID_CATEGORY_SLUG"
      );
    }
  
    let slug = baseSlug;
    let suffix = 2;
  
    while (true) {
      const where = {
        companyId,
        slug,
      };
  
      if (excludeCategoryId) {
        where.id = {
          [Op.ne]:
            excludeCategoryId,
        };
      }
  
      const existing =
        await db.Category.findOne({
          where,
          attributes: ["id"],
          transaction,
        });
  
      if (!existing) {
        return slug;
      }
  
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  };
  
  const getParentDetails = async ({
    parentCategoryId,
    companyId,
    transaction,
  }) => {
    if (!parentCategoryId) {
      return {
        parent: null,
        level: 0,
        categoryPathIds: [],
      };
    }
  
    const parent =
      await db.Category.findOne({
        where: {
          id: parentCategoryId,
          companyId,
        },
        transaction,
      });
  
    if (!parent) {
      throw new AppError(
        "Parent category was not found.",
        400,
        "PARENT_CATEGORY_NOT_FOUND"
      );
    }
  
    return {
      parent,
      level:
        Number(parent.level || 0) +
        1,
      categoryPathIds: [
        ...(Array.isArray(
          parent.categoryPathIds
        )
          ? parent.categoryPathIds
          : []),
        parent.id,
      ],
    };
  };
  
  const ensureNoCircularParent =
    async ({
      categoryId,
      parentCategoryId,
      companyId,
      transaction,
    }) => {
      if (!parentCategoryId) {
        return;
      }
  
      if (
        categoryId ===
        parentCategoryId
      ) {
        throw new AppError(
          "A category cannot be its own parent.",
          400,
          "CATEGORY_CANNOT_BE_OWN_PARENT"
        );
      }
  
      let currentCategoryId =
        parentCategoryId;
  
      const visited = new Set();
  
      while (currentCategoryId) {
        if (
          currentCategoryId ===
          categoryId
        ) {
          throw new AppError(
            "The selected parent would create a circular category hierarchy.",
            400,
            "CIRCULAR_CATEGORY_HIERARCHY"
          );
        }
  
        if (
          visited.has(
            currentCategoryId
          )
        ) {
          throw new AppError(
            "An invalid circular category hierarchy already exists.",
            400,
            "CIRCULAR_CATEGORY_HIERARCHY"
          );
        }
  
        visited.add(
          currentCategoryId
        );
  
        const current =
          await db.Category.findOne({
            where: {
              id: currentCategoryId,
              companyId,
            },
            attributes: [
              "id",
              "parentCategoryId",
            ],
            transaction,
          });
  
        if (!current) {
          throw new AppError(
            "Parent category was not found.",
            400,
            "PARENT_CATEGORY_NOT_FOUND"
          );
        }
  
        currentCategoryId =
          current.parentCategoryId;
      }
    };
  
  const buildPathValues = ({
    name,
    parent,
    categoryPathIds,
  }) => {
    const categoryPath = parent
      ? `${parent.categoryPath || parent.name} > ${name}`
      : name;
  
    return {
      categoryPath,
      categoryPathIds,
    };
  };
  
  const updateDescendantPaths =
    async ({
      category,
      companyId,
      userId,
      transaction,
    }) => {
      const children =
        await db.Category.findAll({
          where: {
            companyId,
            parentCategoryId:
              category.id,
          },
          order: [
            ["sortOrder", "ASC"],
            ["name", "ASC"],
          ],
          transaction,
        });
  
      for (
        const child of children
      ) {
        child.level =
          Number(category.level) + 1;
  
        child.categoryPath =
          `${category.categoryPath} > ${child.name}`;
  
        child.categoryPathIds = [
          ...(Array.isArray(
            category.categoryPathIds
          )
            ? category.categoryPathIds
            : []),
          category.id,
        ];
  
        child.updatedBy = userId;
  
        await child.save({
          transaction,
        });
  
        await updateDescendantPaths({
          category: child,
          companyId,
          userId,
          transaction,
        });
      }
    };
  
  const createCategory =
    async ({
      companyId,
      userId,
      payload,
    }) => {
      return db.sequelize.transaction(
        async (transaction) => {
          const name =
            normalizeWhitespace(
              payload.name
            );
  
          if (!name) {
            throw new AppError(
              "Category name is required.",
              400,
              "CATEGORY_NAME_REQUIRED"
            );
          }
  
          await validateCategoryAssets({
            companyId,
            thumbnailAssetId:
              payload.thumbnailAssetId,
            imageAssetId:
              payload.imageAssetId,
            bannerAssetId:
              payload.bannerAssetId,
            landingPageId:
              payload.landingPageId,
            transaction,
          });
  
          const {
            parent,
            level,
            categoryPathIds,
          } =
            await getParentDetails({
              parentCategoryId:
                payload.parentCategoryId ||
                null,
              companyId,
              transaction,
            });
  
          const slug =
            await createUniqueSlug({
              companyId,
              value:
                payload.slug || name,
              transaction,
            });
  
          const pathValues =
            buildPathValues({
              name,
              parent,
              categoryPathIds,
            });
  
          const category =
            await db.Category.create(
              {
                companyId,
  
                parentCategoryId:
                  payload.parentCategoryId ||
                  null,
  
                name,
                slug,
  
                description:
                  normalizeNullableText(
                    payload.description
                  ),
  
                shortDescription:
                  normalizeNullableText(
                    payload.shortDescription
                  ),
  
                ...pathValues,
                level,
  
                sortOrder:
                  Number(
                    payload.sortOrder ||
                      0
                  ),
  
                thumbnailAssetId:
                  payload.thumbnailAssetId ||
                  null,
  
                imageAssetId:
                  payload.imageAssetId ||
                  null,
  
                bannerAssetId:
                  payload.bannerAssetId ||
                  null,
  
                landingPageId:
                  payload.landingPageId ||
                  null,
  
                iconName:
                  normalizeNullableText(
                    payload.iconName
                  ),
  
                iconUrl:
                  normalizeNullableText(
                    payload.iconUrl
                  ),
  
                isActive:
                  payload.isActive !==
                  undefined
                    ? payload.isActive
                    : true,
  
                showInMenu:
                  payload.showInMenu !==
                  undefined
                    ? payload.showInMenu
                    : true,
  
                showOnHome:
                  payload.showOnHome !==
                  undefined
                    ? payload.showOnHome
                    : false,
  
                isFeatured:
                  payload.isFeatured !==
                  undefined
                    ? payload.isFeatured
                    : false,
  
                isSearchable:
                  payload.isSearchable !==
                  undefined
                    ? payload.isSearchable
                    : true,
  
                metaTitle:
                  normalizeNullableText(
                    payload.metaTitle
                  ),
  
                metaDescription:
                  normalizeNullableText(
                    payload.metaDescription
                  ),
  
                metaKeywords:
                  normalizeNullableText(
                    payload.metaKeywords
                  ),
  
                canonicalUrl:
                  normalizeNullableText(
                    payload.canonicalUrl
                  ),
  
                robotsIndex:
                  payload.robotsIndex !==
                  undefined
                    ? payload.robotsIndex
                    : true,
  
                robotsFollow:
                  payload.robotsFollow !==
                  undefined
                    ? payload.robotsFollow
                    : true,
  
                createdBy: userId,
                updatedBy: userId,
              },
              {
                transaction,
              }
            );
  
          return getCategoryOrFail({
            categoryId:
              category.id,
            companyId,
            transaction,
          });
        }
      );
    };
  
  const updateCategory =
    async ({
      categoryId,
      companyId,
      userId,
      payload,
    }) => {
      return db.sequelize.transaction(
        async (transaction) => {
          const category =
            await getCategoryOrFail({
              categoryId,
              companyId,
              transaction,
              include: [],
            });
  
          const name =
            payload.name !==
            undefined
              ? normalizeWhitespace(
                  payload.name
                )
              : category.name;
  
          if (!name) {
            throw new AppError(
              "Category name is required.",
              400,
              "CATEGORY_NAME_REQUIRED"
            );
          }
  
          const nextParentCategoryId =
            payload.parentCategoryId !==
            undefined
              ? payload.parentCategoryId ||
                null
              : category.parentCategoryId;
  
          await ensureNoCircularParent({
            categoryId,
            parentCategoryId:
              nextParentCategoryId,
            companyId,
            transaction,
          });
  
          await validateCategoryAssets({
            companyId,
  
            thumbnailAssetId:
              payload.thumbnailAssetId !==
              undefined
                ? payload.thumbnailAssetId
                : category.thumbnailAssetId,
  
            imageAssetId:
              payload.imageAssetId !==
              undefined
                ? payload.imageAssetId
                : category.imageAssetId,
  
            bannerAssetId:
              payload.bannerAssetId !==
              undefined
                ? payload.bannerAssetId
                : category.bannerAssetId,
  
            landingPageId:
              payload.landingPageId !==
              undefined
                ? payload.landingPageId
                : category.landingPageId,
  
            transaction,
          });
  
          const {
            parent,
            level,
            categoryPathIds,
          } =
            await getParentDetails({
              parentCategoryId:
                nextParentCategoryId,
              companyId,
              transaction,
            });
  
          let slug = category.slug;
  
          if (
            payload.slug !==
              undefined ||
            name !== category.name
          ) {
            slug =
              await createUniqueSlug({
                companyId,
                value:
                  payload.slug ||
                  name,
                excludeCategoryId:
                  category.id,
                transaction,
              });
          }
  
          const pathValues =
            buildPathValues({
              name,
              parent,
              categoryPathIds,
            });
  
          const updateValue = (
            field,
            normalizer = (
              value
            ) => value
          ) => {
            if (
              payload[field] !==
              undefined
            ) {
              category[field] =
                normalizer(
                  payload[field]
                );
            }
          };
  
          category.parentCategoryId =
            nextParentCategoryId;
  
          category.name = name;
          category.slug = slug;
          category.level = level;
  
          category.categoryPath =
            pathValues.categoryPath;
  
          category.categoryPathIds =
            pathValues.categoryPathIds;
  
          updateValue(
            "description",
            normalizeNullableText
          );
  
          updateValue(
            "shortDescription",
            normalizeNullableText
          );
  
          updateValue(
            "sortOrder",
            Number
          );
  
          updateValue(
            "thumbnailAssetId",
            (value) =>
              value || null
          );
  
          updateValue(
            "imageAssetId",
            (value) =>
              value || null
          );
  
          updateValue(
            "bannerAssetId",
            (value) =>
              value || null
          );
  
          updateValue(
            "landingPageId",
            (value) =>
              value || null
          );
  
          updateValue(
            "iconName",
            normalizeNullableText
          );
  
          updateValue(
            "iconUrl",
            normalizeNullableText
          );
  
          updateValue("isActive");
          updateValue("showInMenu");
          updateValue("showOnHome");
          updateValue("isFeatured");
          updateValue("isSearchable");
  
          updateValue(
            "metaTitle",
            normalizeNullableText
          );
  
          updateValue(
            "metaDescription",
            normalizeNullableText
          );
  
          updateValue(
            "metaKeywords",
            normalizeNullableText
          );
  
          updateValue(
            "canonicalUrl",
            normalizeNullableText
          );
  
          updateValue("robotsIndex");
          updateValue("robotsFollow");
  
          category.updatedBy = userId;
  
          await category.save({
            transaction,
          });
  
          await updateDescendantPaths({
            category,
            companyId,
            userId,
            transaction,
          });
  
          return getCategoryOrFail({
            categoryId,
            companyId,
            transaction,
          });
        }
      );
    };
  
  const listCategories =
    async ({
      companyId,
      query,
    }) => {
      const page = Math.max(
        Number(query.page || 1),
        1
      );
  
      const pageSize = Math.min(
        Math.max(
          Number(
            query.pageSize || 20
          ),
          1
        ),
        200
      );
  
      const where = {
        companyId,
      };
  
      if (query.search) {
        const search =
          String(
            query.search
          ).trim();
  
        if (search) {
          where[Op.or] = [
            {
              name: {
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
              description: {
                [Op.iLike]:
                  `%${search}%`,
              },
            },
            {
              categoryPath: {
                [Op.iLike]:
                  `%${search}%`,
              },
            },
          ];
        }
      }
  
      if (
        query.parentCategoryId
      ) {
        where.parentCategoryId =
          query.parentCategoryId;
      }
  
      if (
        query.rootOnly ===
          true ||
        query.rootOnly === "true"
      ) {
        where.parentCategoryId =
          null;
      }
  
      if (
        query.level !==
        undefined
      ) {
        where.level =
          Number(query.level);
      }
  
      [
        "isActive",
        "showInMenu",
        "showOnHome",
        "isFeatured",
        "isSearchable",
      ].forEach((field) => {
        if (
          query[field] !==
          undefined
        ) {
          where[field] =
            query[field] ===
              true ||
            query[field] ===
              "true";
        }
      });
  
      const {
        count,
        rows,
      } =
        await db.Category.findAndCountAll(
          {
            where,
            include:
              categoryIncludes,
            distinct: true,
            order: [
              ["level", "ASC"],
              ["sortOrder", "ASC"],
              ["name", "ASC"],
            ],
            limit: pageSize,
            offset:
              (page - 1) *
              pageSize,
          }
        );
  
      return {
        categories: rows,
        pagination: {
          page,
          pageSize,
          totalItems: count,
          totalPages:
            Math.ceil(
              count / pageSize
            ),
        },
      };
    };
  
  const getCategoryTree =
    async ({
      companyId,
      query = {},
    }) => {
      const where = {
        companyId,
      };
  
      if (
        query.isActive !==
        undefined
      ) {
        where.isActive =
          query.isActive ===
            true ||
          query.isActive ===
            "true";
      }
  
      if (
        query.showInMenu !==
        undefined
      ) {
        where.showInMenu =
          query.showInMenu ===
            true ||
          query.showInMenu ===
            "true";
      }
  
      if (
        query.showOnHome !==
        undefined
      ) {
        where.showOnHome =
          query.showOnHome ===
            true ||
          query.showOnHome ===
            "true";
      }
  
      const categories =
        await db.Category.findAll({
          where,
          include: [
            {
              model:
                db.MediaAsset,
              as: "thumbnailAsset",
              required: false,
            },
            {
              model:
                db.MediaAsset,
              as: "imageAsset",
              required: false,
            },
            {
              model:
                db.MediaAsset,
              as: "bannerAsset",
              required: false,
            },
          ],
          order: [
            ["level", "ASC"],
            ["sortOrder", "ASC"],
            ["name", "ASC"],
          ],
        });
  
      return buildCategoryTree(
        categories
      );
    };
  
  const updateCategoryStatus =
    async ({
      categoryId,
      companyId,
      userId,
      isActive,
      includeChildren = false,
    }) => {
      return db.sequelize.transaction(
        async (transaction) => {
          const category =
            await getCategoryOrFail({
              categoryId,
              companyId,
              transaction,
              include: [],
            });
  
          category.isActive =
            isActive;
  
          category.updatedBy =
            userId;
  
          await category.save({
            transaction,
          });
  
          if (includeChildren) {
            const updateChildren =
              async (
                parentCategoryId
              ) => {
                const children =
                  await db.Category.findAll(
                    {
                      where: {
                        companyId,
                        parentCategoryId,
                      },
                      transaction,
                    }
                  );
  
                for (
                  const child of children
                ) {
                  child.isActive =
                    isActive;
  
                  child.updatedBy =
                    userId;
  
                  await child.save({
                    transaction,
                  });
  
                  await updateChildren(
                    child.id
                  );
                }
              };
  
            await updateChildren(
              category.id
            );
          }
  
          return getCategoryOrFail({
            categoryId,
            companyId,
            transaction,
          });
        }
      );
    };
  
  const deleteCategory =
    async ({
      categoryId,
      companyId,
    }) => {
      return db.sequelize.transaction(
        async (transaction) => {
          const category =
            await getCategoryOrFail({
              categoryId,
              companyId,
              transaction,
              include: [],
            });
  
          const childCount =
            await db.Category.count({
              where: {
                companyId,
                parentCategoryId:
                  category.id,
              },
              transaction,
            });
  
          if (childCount > 0) {
            throw new AppError(
              "This category cannot be deleted because it contains child categories.",
              409,
              "CATEGORY_HAS_CHILDREN"
            );
          }
  
          /*
           * Product assignment validation will be added
           * when the Product model is connected.
           *
           * Example:
           *
           * const productCount =
           *   await db.Product.count({
           *     where: {
           *       companyId,
           *       categoryId:
           *         category.id,
           *     },
           *     transaction,
           *   });
           */
  
          await category.destroy({
            transaction,
          });
  
          return {
            id: category.id,
          };
        }
      );
    };
  
  const reorderCategories =
    async ({
      companyId,
      userId,
      categories,
    }) => {
      return db.sequelize.transaction(
        async (transaction) => {
          const ids =
            categories.map(
              (item) => item.id
            );
  
          const existingCategories =
            await db.Category.findAll({
              where: {
                id: {
                  [Op.in]: ids,
                },
                companyId,
              },
              transaction,
            });
  
          if (
            existingCategories.length !==
            ids.length
          ) {
            throw new AppError(
              "One or more categories were not found.",
              400,
              "CATEGORY_REORDER_INVALID"
            );
          }
  
          for (
            const item of categories
          ) {
            const category =
              existingCategories.find(
                (record) =>
                  record.id ===
                  item.id
              );
  
            const nextParentId =
              item.parentCategoryId !==
              undefined
                ? item.parentCategoryId ||
                  null
                : category.parentCategoryId;
  
            await ensureNoCircularParent({
              categoryId:
                category.id,
              parentCategoryId:
                nextParentId,
              companyId,
              transaction,
            });
  
            const {
              parent,
              level,
              categoryPathIds,
            } =
              await getParentDetails({
                parentCategoryId:
                  nextParentId,
                companyId,
                transaction,
              });
  
            const pathValues =
              buildPathValues({
                name: category.name,
                parent,
                categoryPathIds,
              });
  
            category.parentCategoryId =
              nextParentId;
  
            category.sortOrder =
              Number(
                item.sortOrder
              );
  
            category.level = level;
  
            category.categoryPath =
              pathValues.categoryPath;
  
            category.categoryPathIds =
              pathValues.categoryPathIds;
  
            category.updatedBy =
              userId;
  
            await category.save({
              transaction,
            });
  
            await updateDescendantPaths({
              category,
              companyId,
              userId,
              transaction,
            });
          }
  
          const allCategories =
            await db.Category.findAll({
              where: {
                companyId,
              },
              order: [
                ["level", "ASC"],
                ["sortOrder", "ASC"],
                ["name", "ASC"],
              ],
              transaction,
            });
  
          return buildCategoryTree(
            allCategories
          );
        }
      );
    };
  
  module.exports = {
    getCategoryOrFail,
    createCategory,
    updateCategory,
    listCategories,
    getCategoryTree,
    updateCategoryStatus,
    deleteCategory,
    reorderCategories,
  };