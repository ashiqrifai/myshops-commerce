const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db = require(
    "../../models"
  );
  
  const AppError = require(
    "../../utils/AppError"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Constants
  |--------------------------------------------------------------------------
  */
  
  const COLLECTION_TYPES = [
    "MANUAL",
    "SMART",
  ];
  
  const ALLOWED_SORT_FIELDS =
    new Set([
      "name",
      "slug",
      "collectionType",
      "sortOrder",
      "isActive",
      "isFeatured",
      "showInMenu",
      "showOnHome",
      "publishedFrom",
      "publishedUntil",
      "createdAt",
      "updatedAt",
    ]);
  
  const COLLECTION_INCLUDE = [
    {
      model:
        db.MediaAsset,
  
      as:
        "thumbnailAsset",
  
      required:
        false,
  
      include: [
        {
          model:
            db.MediaAssetVariant,
  
          as:
            "variants",
  
          required:
            false,
  
          where: {
            isActive:
              true,
          },
  
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
  
          required:
            false,
  
          where: {
            isActive:
              true,
          },
  
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
        "mobileBannerAsset",
  
      required:
        false,
  
      include: [
        {
          model:
            db.MediaAssetVariant,
  
          as:
            "variants",
  
          required:
            false,
  
          where: {
            isActive:
              true,
          },
  
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
        db.CmsPage,
  
      as:
        "landingPage",
  
      required:
        false,
  
      attributes: [
        "id",
        "title",
        "slug",
        "status",
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
  
  /*
  |--------------------------------------------------------------------------
  | Basic Helpers
  |--------------------------------------------------------------------------
  */
  
  const hasOwn = (
    object,
    field
  ) =>
    Object.prototype
      .hasOwnProperty.call(
        object,
        field
      );
  
  const normalizeNullable = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }
  
    if (
      typeof value ===
      "string"
    ) {
      const normalized =
        value.trim();
  
      return normalized ||
        null;
    }
  
    return value;
  };
  
  const generateSlug = (
    value
  ) => {
    return String(
      value || ""
    )
      .trim()
      .toLowerCase()
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  };
  
  const normalizeBoolean = (
    value
  ) => {
    if (
      typeof value ===
      "boolean"
    ) {
      return value;
    }
  
    if (
      typeof value ===
      "string"
    ) {
      const normalized =
        value
          .trim()
          .toLowerCase();
  
      if (
        [
          "true",
          "1",
          "yes",
        ].includes(
          normalized
        )
      ) {
        return true;
      }
  
      if (
        [
          "false",
          "0",
          "no",
        ].includes(
          normalized
        )
      ) {
        return false;
      }
    }
  
    return undefined;
  };
  
  const normalizeNonNegativeInteger = (
    value,
    fallback = 0
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return fallback;
    }
  
    const number =
      Number(value);
  
    if (
      !Number.isInteger(
        number
      ) ||
      number < 0
    ) {
      return null;
    }
  
    return number;
  };
  
  const normalizeDate = (
    value
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return undefined;
    }
  
    return date;
  };
  
  const normalizeCollectionType = (
    value
  ) => {
    const normalized =
      String(
        value ||
        "MANUAL"
      )
        .trim()
        .toUpperCase();
  
    return COLLECTION_TYPES.includes(
      normalized
    )
      ? normalized
      : null;
  };
  
  const normalizePageNumber = (
    value,
    fallback
  ) => {
    const number =
      Number(value);
  
    return Number.isInteger(
      number
    ) &&
      number > 0
      ? number
      : fallback;
  };
  
  const normalizeSortDirection = (
    value
  ) => {
    return String(
      value ||
      "ASC"
    )
      .trim()
      .toUpperCase() ===
      "DESC"
      ? "DESC"
      : "ASC";
  };
  
  const normalizeSortField = (
    value
  ) => {
    const sortField =
      String(
        value ||
        "sortOrder"
      ).trim();
  
    return ALLOWED_SORT_FIELDS.has(
      sortField
    )
      ? sortField
      : "sortOrder";
  };
  
  /*
  |--------------------------------------------------------------------------
  | Validation Helpers
  |--------------------------------------------------------------------------
  */
  
  const validateCollectionType = (
    collectionType
  ) => {
    if (
      !collectionType
    ) {
      throw new AppError(
        "Collection type must be MANUAL or SMART.",
        400,
        "COLLECTION_TYPE_INVALID"
      );
    }
  };
  
  const validatePublishingPeriod = ({
    publishedFrom,
    publishedUntil,
  }) => {
    if (
      publishedFrom ===
      undefined
    ) {
      throw new AppError(
        "Published From is invalid.",
        400,
        "COLLECTION_PUBLISHED_FROM_INVALID"
      );
    }
  
    if (
      publishedUntil ===
      undefined
    ) {
      throw new AppError(
        "Published Until is invalid.",
        400,
        "COLLECTION_PUBLISHED_UNTIL_INVALID"
      );
    }
  
    if (
      publishedFrom &&
      publishedUntil &&
      publishedUntil.getTime() <
        publishedFrom.getTime()
    ) {
      throw new AppError(
        "Published Until cannot be earlier than Published From.",
        400,
        "COLLECTION_PUBLISHING_PERIOD_INVALID"
      );
    }
  };
  
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
      await db.MediaAsset
        .findOne({
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
        "COLLECTION_MEDIA_ASSET_INVALID"
      );
    }
  
    return asset;
  };
  
  const validateLandingPage = async ({
    companyId,
    landingPageId,
    transaction,
  }) => {
    if (!landingPageId) {
      return null;
    }
  
    const page =
      await db.CmsPage.findOne({
        where: {
          id:
            landingPageId,
  
          companyId,
        },
  
        transaction,
      });
  
    if (!page) {
      throw new AppError(
        "The selected landing page was not found.",
        400,
        "COLLECTION_LANDING_PAGE_INVALID"
      );
    }
  
    return page;
  };
  
  const validateCollectionAssets =
    async ({
      companyId,
      payload,
      transaction,
      partial = false,
    }) => {
      const assetFields = [
        {
          field:
            "thumbnailAssetId",
  
          label:
            "Collection thumbnail",
        },
  
        {
          field:
            "bannerAssetId",
  
          label:
            "Collection banner",
        },
  
        {
          field:
            "mobileBannerAssetId",
  
          label:
            "Collection mobile banner",
        },
      ];
  
      for (
        const assetField of
        assetFields
      ) {
        if (
          partial &&
          !hasOwn(
            payload,
            assetField.field
          )
        ) {
          continue;
        }
  
        await validateImageAsset({
          companyId,
  
          assetId:
            normalizeNullable(
              payload[
                assetField.field
              ]
            ),
  
          fieldName:
            assetField.label,
  
          transaction,
        });
      }
  
      if (
        !partial ||
        hasOwn(
          payload,
          "landingPageId"
        )
      ) {
        await validateLandingPage({
          companyId,
  
          landingPageId:
            normalizeNullable(
              payload.landingPageId
            ),
  
          transaction,
        });
      }
    };
  
  const ensureUniqueCollection =
    async ({
      companyId,
      slug,
      excludeId,
      transaction,
    }) => {
      const where = {
        companyId,
        slug,
      };
  
      if (excludeId) {
        where.id = {
          [Op.ne]:
            excludeId,
        };
      }
  
      const existing =
        await db.Collection
          .findOne({
            where,
            transaction,
          });
  
      if (existing) {
        throw new AppError(
          "A collection with this slug already exists.",
          409,
          "COLLECTION_SLUG_EXISTS"
        );
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Product Count Helpers
  |--------------------------------------------------------------------------
  */
  
  const loadProductCounts = async ({
    companyId,
    collectionIds,
    transaction,
  }) => {
    if (
      !Array.isArray(
        collectionIds
      ) ||
      collectionIds.length ===
        0
    ) {
      return new Map();
    }
  
    const rows =
      await db.ProductCollection
        .findAll({
          where: {
            companyId,
  
            collectionId: {
              [Op.in]:
                collectionIds,
            },
          },
  
          attributes: [
            "collectionId",
  
            [
              db.sequelize.fn(
                "COUNT",
                db.sequelize.col(
                  "id"
                )
              ),
              "productCount",
            ],
          ],
  
          group: [
            "collectionId",
          ],
  
          raw:
            true,
  
          transaction,
        });
  
    return new Map(
      rows.map(
        (
          row
        ) => [
          row.collectionId,
          Number(
            row.productCount ||
            0
          ),
        ]
      )
    );
  };
  
  const attachProductCount = (
    collection,
    productCount
  ) => {
    if (!collection) {
      return collection;
    }
  
    collection.setDataValue(
      "productCount",
      Number(
        productCount ||
        0
      )
    );
  
    return collection;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Get Collection
  |--------------------------------------------------------------------------
  */
  
  const getCollectionById =
    async ({
      companyId,
      collectionId,
      transaction,
    }) => {
      const collection =
        await db.Collection
          .findOne({
            where: {
              id:
                collectionId,
  
              companyId,
            },
  
            include:
              COLLECTION_INCLUDE,
  
            distinct:
              true,
  
            transaction,
          });
  
      if (!collection) {
        throw new AppError(
          "Collection not found.",
          404,
          "COLLECTION_NOT_FOUND"
        );
      }
  
      const productCount =
        await db.ProductCollection
          .count({
            where: {
              companyId,
  
              collectionId:
                collection.id,
            },
  
            transaction,
          });
  
      return attachProductCount(
        collection,
        productCount
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | List Collections
  |--------------------------------------------------------------------------
  */
  
  const listCollections =
    async ({
      companyId,
      page = 1,
      pageSize = 30,
      search,
      isActive,
      isFeatured,
      showInMenu,
      showOnHome,
      collectionType,
      published,
      sortBy = "sortOrder",
      sortDirection = "ASC",
    }) => {
      const normalizedPage =
        normalizePageNumber(
          page,
          1
        );
  
      const normalizedPageSize =
        Math.min(
          normalizePageNumber(
            pageSize,
            30
          ),
          200
        );
  
      const normalizedSortBy =
        normalizeSortField(
          sortBy
        );
  
      const normalizedDirection =
        normalizeSortDirection(
          sortDirection
        );
  
      const where = {
        companyId,
      };
  
      const activeFilter =
        normalizeBoolean(
          isActive
        );
  
      const featuredFilter =
        normalizeBoolean(
          isFeatured
        );
  
      const menuFilter =
        normalizeBoolean(
          showInMenu
        );
  
      const homeFilter =
        normalizeBoolean(
          showOnHome
        );
  
      const publishedFilter =
        normalizeBoolean(
          published
        );
  
      if (
        activeFilter !==
        undefined
      ) {
        where.isActive =
          activeFilter;
      }
  
      if (
        featuredFilter !==
        undefined
      ) {
        where.isFeatured =
          featuredFilter;
      }
  
      if (
        menuFilter !==
        undefined
      ) {
        where.showInMenu =
          menuFilter;
      }
  
      if (
        homeFilter !==
        undefined
      ) {
        where.showOnHome =
          homeFilter;
      }
  
      if (collectionType) {
        const normalizedType =
          normalizeCollectionType(
            collectionType
          );
  
        validateCollectionType(
          normalizedType
        );
  
        where.collectionType =
          normalizedType;
      }
  
      if (search) {
        const normalizedSearch =
          String(
            search
          ).trim();
  
        if (
          normalizedSearch
        ) {
          where[Op.or] = [
            {
              name: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
  
            {
              slug: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
  
            {
              shortDescription: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
  
            {
              description: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
          ];
        }
      }
  
      if (
        publishedFilter !==
        undefined
      ) {
        const now =
          new Date();
  
        const publishedConditions = [
          {
            [Op.or]: [
              {
                publishedFrom:
                  null,
              },
  
              {
                publishedFrom: {
                  [Op.lte]:
                    now,
                },
              },
            ],
          },
  
          {
            [Op.or]: [
              {
                publishedUntil:
                  null,
              },
  
              {
                publishedUntil: {
                  [Op.gte]:
                    now,
                },
              },
            ],
          },
        ];
  
        if (
          publishedFilter ===
          true
        ) {
          where[Op.and] = [
            ...(where[Op.and] ||
              []),
  
            {
              isActive:
                true,
            },
  
            ...publishedConditions,
          ];
        } else {
          where[Op.and] = [
            ...(where[Op.and] ||
              []),
  
            {
              [Op.or]: [
                {
                  isActive:
                    false,
                },
  
                {
                  publishedFrom: {
                    [Op.gt]:
                      now,
                  },
                },
  
                {
                  publishedUntil: {
                    [Op.lt]:
                      now,
                  },
                },
              ],
            },
          ];
        }
      }
  
      const offset =
        (normalizedPage - 1) *
        normalizedPageSize;
  
      const result =
        await db.Collection
          .findAndCountAll({
            where,
  
            include:
              COLLECTION_INCLUDE,
  
            distinct:
              true,
  
            limit:
              normalizedPageSize,
  
            offset,
  
            order: [
              [
                normalizedSortBy,
                normalizedDirection,
              ],
  
              [
                "name",
                "ASC",
              ],
            ],
          });
  
      const collectionIds =
        result.rows.map(
          (
            collection
          ) =>
            collection.id
        );
  
      const productCountMap =
        await loadProductCounts({
          companyId,
          collectionIds,
        });
  
      for (
        const collection of
        result.rows
      ) {
        attachProductCount(
          collection,
          productCountMap.get(
            collection.id
          ) ||
            0
        );
      }
  
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
  
  /*
  |--------------------------------------------------------------------------
  | Create Collection
  |--------------------------------------------------------------------------
  */
  
  const createCollection =
    async ({
      companyId,
      userId,
      payload,
    }) => {
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        const name =
          String(
            payload.name ||
            ""
          ).trim();
  
        if (!name) {
          throw new AppError(
            "Collection name is required.",
            400,
            "COLLECTION_NAME_REQUIRED"
          );
        }
  
        const slug =
          generateSlug(
            payload.slug ||
            name
          );
  
        if (!slug) {
          throw new AppError(
            "Collection slug could not be generated.",
            400,
            "COLLECTION_SLUG_REQUIRED"
          );
        }
  
        const collectionType =
          normalizeCollectionType(
            payload.collectionType
          );
  
        validateCollectionType(
          collectionType
        );
  
        const sortOrder =
          normalizeNonNegativeInteger(
            payload.sortOrder,
            0
          );
  
        if (
          sortOrder ===
          null
        ) {
          throw new AppError(
            "Sort order must be a non-negative whole number.",
            400,
            "COLLECTION_SORT_ORDER_INVALID"
          );
        }
  
        const publishedFrom =
          normalizeDate(
            payload.publishedFrom
          );
  
        const publishedUntil =
          normalizeDate(
            payload.publishedUntil
          );
  
        validatePublishingPeriod({
          publishedFrom,
          publishedUntil,
        });
  
        await ensureUniqueCollection({
          companyId,
          slug,
          transaction,
        });
  
        await validateCollectionAssets({
          companyId,
          payload,
          transaction,
        });
  
        const collection =
          await db.Collection
            .create(
              {
                companyId,
                name,
                slug,
  
                description:
                  normalizeNullable(
                    payload.description
                  ),
  
                shortDescription:
                  normalizeNullable(
                    payload.shortDescription
                  ),
  
                collectionType,
                sortOrder,
  
                thumbnailAssetId:
                  normalizeNullable(
                    payload.thumbnailAssetId
                  ),
  
                bannerAssetId:
                  normalizeNullable(
                    payload.bannerAssetId
                  ),
  
                mobileBannerAssetId:
                  normalizeNullable(
                    payload.mobileBannerAssetId
                  ),
  
                landingPageId:
                  normalizeNullable(
                    payload.landingPageId
                  ),
  
                isActive:
                  payload.isActive !==
                  false,
  
                isFeatured:
                  payload.isFeatured ===
                  true,
  
                showInMenu:
                  payload.showInMenu ===
                  true,
  
                showOnHome:
                  payload.showOnHome ===
                  true,
  
                isSearchable:
                  payload.isSearchable !==
                  false,
  
                showProductCount:
                  payload.showProductCount !==
                  false,
  
                publishedFrom,
                publishedUntil,
  
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
  
                canonicalUrl:
                  normalizeNullable(
                    payload.canonicalUrl
                  ),
  
                robotsIndex:
                  payload.robotsIndex !==
                  false,
  
                robotsFollow:
                  payload.robotsFollow !==
                  false,
  
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
  
        return getCollectionById({
          companyId,
  
          collectionId:
            collection.id,
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
  
  /*
  |--------------------------------------------------------------------------
  | Update Collection
  |--------------------------------------------------------------------------
  */
  
  const updateCollection =
    async ({
      companyId,
      collectionId,
      userId,
      payload,
    }) => {
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        const collection =
          await db.Collection
            .findOne({
              where: {
                id:
                  collectionId,
  
                companyId,
              },
  
              transaction,
  
              lock:
                transaction.LOCK
                  .UPDATE,
            });
  
        if (!collection) {
          throw new AppError(
            "Collection not found.",
            404,
            "COLLECTION_NOT_FOUND"
          );
        }
  
        const name =
          hasOwn(
            payload,
            "name"
          )
            ? String(
                payload.name ||
                ""
              ).trim()
            : collection.name;
  
        if (!name) {
          throw new AppError(
            "Collection name is required.",
            400,
            "COLLECTION_NAME_REQUIRED"
          );
        }
  
        const slug =
          hasOwn(
            payload,
            "slug"
          )
            ? generateSlug(
                payload.slug ||
                name
              )
            : collection.slug;
  
        if (!slug) {
          throw new AppError(
            "Collection slug could not be generated.",
            400,
            "COLLECTION_SLUG_REQUIRED"
          );
        }
  
        const collectionType =
          hasOwn(
            payload,
            "collectionType"
          )
            ? normalizeCollectionType(
                payload.collectionType
              )
            : collection.collectionType;
  
        validateCollectionType(
          collectionType
        );
  
        const sortOrder =
          hasOwn(
            payload,
            "sortOrder"
          )
            ? normalizeNonNegativeInteger(
                payload.sortOrder,
                0
              )
            : collection.sortOrder;
  
        if (
          sortOrder ===
          null
        ) {
          throw new AppError(
            "Sort order must be a non-negative whole number.",
            400,
            "COLLECTION_SORT_ORDER_INVALID"
          );
        }
  
        const publishedFrom =
          hasOwn(
            payload,
            "publishedFrom"
          )
            ? normalizeDate(
                payload.publishedFrom
              )
            : collection.publishedFrom;
  
        const publishedUntil =
          hasOwn(
            payload,
            "publishedUntil"
          )
            ? normalizeDate(
                payload.publishedUntil
              )
            : collection.publishedUntil;
  
        validatePublishingPeriod({
          publishedFrom,
          publishedUntil,
        });
  
        await ensureUniqueCollection({
          companyId,
          slug,
  
          excludeId:
            collection.id,
  
          transaction,
        });
  
        await validateCollectionAssets({
          companyId,
          payload,
          transaction,
  
          partial:
            true,
        });
  
        const updateValues = {
          name,
          slug,
          collectionType,
          sortOrder,
          publishedFrom,
          publishedUntil,
  
          updatedBy:
            userId,
        };
  
        const nullableFields = [
          "description",
          "shortDescription",
          "thumbnailAssetId",
          "bannerAssetId",
          "mobileBannerAssetId",
          "landingPageId",
          "metaTitle",
          "metaDescription",
          "metaKeywords",
          "canonicalUrl",
        ];
  
        for (
          const field of
          nullableFields
        ) {
          if (
            hasOwn(
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
  
        const booleanFields = [
          "isActive",
          "isFeatured",
          "showInMenu",
          "showOnHome",
          "isSearchable",
          "showProductCount",
          "robotsIndex",
          "robotsFollow",
        ];
  
        for (
          const field of
          booleanFields
        ) {
          if (
            hasOwn(
              payload,
              field
            )
          ) {
            const booleanValue =
              normalizeBoolean(
                payload[field]
              );
  
            if (
              booleanValue ===
              undefined
            ) {
              throw new AppError(
                `${field} must be true or false.`,
                400,
                "COLLECTION_BOOLEAN_INVALID"
              );
            }
  
            updateValues[field] =
              booleanValue;
          }
        }
  
        await collection.update(
          updateValues,
          {
            transaction,
          }
        );
  
        await transaction
          .commit();
  
        return getCollectionById({
          companyId,
  
          collectionId:
            collection.id,
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
  
  /*
  |--------------------------------------------------------------------------
  | Change Status
  |--------------------------------------------------------------------------
  */
  
  const changeCollectionStatus =
    async ({
      companyId,
      collectionId,
      userId,
      isActive,
    }) => {
      const normalizedStatus =
        normalizeBoolean(
          isActive
        );
  
      if (
        normalizedStatus ===
        undefined
      ) {
        throw new AppError(
          "isActive must be true or false.",
          400,
          "COLLECTION_STATUS_INVALID"
        );
      }
  
      const collection =
        await db.Collection
          .findOne({
            where: {
              id:
                collectionId,
  
              companyId,
            },
          });
  
      if (!collection) {
        throw new AppError(
          "Collection not found.",
          404,
          "COLLECTION_NOT_FOUND"
        );
      }
  
      await collection.update({
        isActive:
          normalizedStatus,
  
        updatedBy:
          userId,
      });
  
      return getCollectionById({
        companyId,
        collectionId,
      });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Collection Products
  |--------------------------------------------------------------------------
  */
  
  const getCollectionProducts =
    async ({
      companyId,
      collectionId,
      page = 1,
      pageSize = 50,
      search,
      status,
    }) => {
      const collection =
        await db.Collection
          .findOne({
            where: {
              id:
                collectionId,
  
              companyId,
            },
  
            attributes: [
              "id",
              "name",
              "slug",
              "collectionType",
              "isActive",
            ],
          });
  
      if (!collection) {
        throw new AppError(
          "Collection not found.",
          404,
          "COLLECTION_NOT_FOUND"
        );
      }
  
      const normalizedPage =
        normalizePageNumber(
          page,
          1
        );
  
      const normalizedPageSize =
        Math.min(
          normalizePageNumber(
            pageSize,
            50
          ),
          200
        );
  
      const productWhere = {
        companyId,
      };
  
      if (search) {
        const normalizedSearch =
          String(
            search
          ).trim();
  
        if (
          normalizedSearch
        ) {
          productWhere[Op.or] = [
            {
              name: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
  
            {
              parentSku: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
  
            {
              slug: {
                [Op.iLike]:
                  `%${normalizedSearch}%`,
              },
            },
          ];
        }
      }
  
      if (status) {
        productWhere.status =
          String(
            status
          )
            .trim()
            .toUpperCase();
      }
  
      const offset =
        (normalizedPage - 1) *
        normalizedPageSize;
  
      const result =
        await db.ProductCollection
          .findAndCountAll({
            where: {
              companyId,
              collectionId,
            },
  
            include: [
              {
                model:
                  db.Product,
  
                as:
                  "product",
  
                required:
                  true,
  
                where:
                  productWhere,
  
                attributes: [
                  "id",
                  "name",
                  "parentSku",
                  "slug",
                  "status",
                  "brandId",
                  "primaryCategoryId",
                  "productType",
                  "updatedAt",
                ],
  
                include: [
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
                      "slug",
                    ],
                  },
  
                  {
                    model:
                      db.Category,
  
                    as:
                      "primaryCategory",
  
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
                      db.ProductImage,
                  
                    as:
                      "images",
                  
                    required:
                      false,
                  
                    separate:
                      true,
                  
                    limit:
                      1,
                  
                    order: [
                      [
                        "displayOrder",
                        "ASC",
                      ],
                    ],
                  
                    include: [
                      {
                        model:
                          db.MediaAsset,
                  
                        as:
                          "mediaAsset",
                  
                        required:
                          false,
                  
                        attributes: [
                          "id",
                          "publicUrl",
                          "originalFileName",
                        ],
                      },
                    ],
                  }
                ],
              },
            ],
  
            distinct:
              true,
  
            limit:
              normalizedPageSize,
  
            offset,
  
            order: [
              [
                "sortOrder",
                "ASC",
              ],
  
              [
                "createdAt",
                "ASC",
              ],
            ],
          });
  
      return {
        collection,
  
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
  
  /*
  |--------------------------------------------------------------------------
  | Replace Collection Products
  |--------------------------------------------------------------------------
  */
  
  const replaceCollectionProducts =
    async ({
      companyId,
      collectionId,
      userId,
      productIds,
    }) => {
      if (
        !Array.isArray(
          productIds
        )
      ) {
        throw new AppError(
          "productIds must be an array.",
          400,
          "COLLECTION_PRODUCT_IDS_REQUIRED"
        );
      }
  
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        const collection =
          await db.Collection
            .findOne({
              where: {
                id:
                  collectionId,
  
                companyId,
              },
  
              transaction,
  
              lock:
                transaction.LOCK
                  .UPDATE,
            });
  
        if (!collection) {
          throw new AppError(
            "Collection not found.",
            404,
            "COLLECTION_NOT_FOUND"
          );
        }
  
        if (
          collection.collectionType ===
          "SMART"
        ) {
          throw new AppError(
            "Products cannot be assigned manually to a smart collection.",
            409,
            "SMART_COLLECTION_MANUAL_ASSIGNMENT_NOT_ALLOWED"
          );
        }
  
        /*
         * Accept either:
         *
         * ["uuid-1", "uuid-2"]
         *
         * or:
         *
         * [
         *   {
         *     productId: "uuid-1",
         *     sortOrder: 0
         *   }
         * ]
         */
  
        const normalizedAssignments =
          productIds.map(
            (
              item,
              index
            ) => {
              const productId =
                typeof item ===
                "string"
                  ? item.trim()
                  : String(
                      item?.productId ||
                      item?.id ||
                      ""
                    ).trim();
  
              const suppliedSortOrder =
                typeof item ===
                "object" &&
                item !==
                  null &&
                hasOwn(
                  item,
                  "sortOrder"
                )
                  ? normalizeNonNegativeInteger(
                      item.sortOrder,
                      index
                    )
                  : index;
  
              if (!productId) {
                throw new AppError(
                  `Product ID is required at position ${
                    index + 1
                  }.`,
                  400,
                  "COLLECTION_PRODUCT_ID_INVALID"
                );
              }
  
              if (
                suppliedSortOrder ===
                null
              ) {
                throw new AppError(
                  `Sort order is invalid for product ${productId}.`,
                  400,
                  "COLLECTION_PRODUCT_SORT_ORDER_INVALID"
                );
              }
  
              return {
                productId,
  
                sortOrder:
                  suppliedSortOrder,
              };
            }
          );
  
        const seenProductIds =
          new Set();
  
        for (
          const assignment of
          normalizedAssignments
        ) {
          if (
            seenProductIds.has(
              assignment.productId
            )
          ) {
            throw new AppError(
              "The same product cannot be assigned more than once.",
              400,
              "COLLECTION_PRODUCT_DUPLICATE"
            );
          }
  
          seenProductIds.add(
            assignment.productId
          );
        }
  
        const uniqueProductIds =
          normalizedAssignments.map(
            (
              assignment
            ) =>
              assignment.productId
          );
  
        if (
          uniqueProductIds.length >
          0
        ) {
          const products =
            await db.Product.findAll({
              where: {
                id: {
                  [Op.in]:
                    uniqueProductIds,
                },
  
                companyId,
              },
  
              attributes: [
                "id",
              ],
  
              transaction,
            });
  
          if (
            products.length !==
            uniqueProductIds.length
          ) {
            const foundIds =
              new Set(
                products.map(
                  (
                    product
                  ) =>
                    product.id
                )
              );
  
            const missingIds =
              uniqueProductIds.filter(
                (
                  productId
                ) =>
                  !foundIds.has(
                    productId
                  )
              );
  
            throw new AppError(
              `One or more products were not found: ${missingIds.join(
                ", "
              )}`,
              400,
              "COLLECTION_PRODUCTS_NOT_FOUND"
            );
          }
        }
  
        await db.ProductCollection
          .destroy({
            where: {
              companyId,
              collectionId,
            },
  
            transaction,
          });
  
        if (
          normalizedAssignments.length >
          0
        ) {
          await db.ProductCollection
            .bulkCreate(
              normalizedAssignments.map(
                (
                  assignment
                ) => ({
                  companyId,
                  collectionId,
  
                  productId:
                    assignment.productId,
  
                  sortOrder:
                    assignment.sortOrder,
  
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
        }
  
        await collection.update(
          {
            updatedBy:
              userId,
          },
          {
            transaction,
          }
        );
  
        await transaction
          .commit();
  
        return {
          collection:
            await getCollectionById({
              companyId,
              collectionId,
            }),
  
          assignedCount:
            normalizedAssignments.length,
  
          productIds:
            normalizedAssignments.map(
              (
                assignment
              ) =>
                assignment.productId
            ),
        };
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
  
  /*
  |--------------------------------------------------------------------------
  | Delete Collection
  |--------------------------------------------------------------------------
  */
  
  const deleteCollection =
    async ({
      companyId,
      collectionId,
    }) => {
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        const collection =
          await db.Collection
            .findOne({
              where: {
                id:
                  collectionId,
  
                companyId,
              },
  
              transaction,
  
              lock:
                transaction.LOCK
                  .UPDATE,
            });
  
        if (!collection) {
          throw new AppError(
            "Collection not found.",
            404,
            "COLLECTION_NOT_FOUND"
          );
        }
  
        const productCount =
          await db.ProductCollection
            .count({
              where: {
                companyId,
                collectionId,
              },
  
              transaction,
            });
  
        if (
          productCount > 0
        ) {
          throw new AppError(
            "This collection contains products and cannot be deleted. Remove the products first or deactivate the collection.",
            409,
            "COLLECTION_IN_USE"
          );
        }
  
        await collection.destroy({
          transaction,
        });
  
        await transaction
          .commit();
  
        return {
          id:
            collectionId,
        };
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
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    listCollections,
    getCollectionById,
    createCollection,
    updateCollection,
    changeCollectionStatus,
    deleteCollection,
    getCollectionProducts,
    replaceCollectionProducts,
    validateCollectionAssets,
    ensureUniqueCollection,
  };