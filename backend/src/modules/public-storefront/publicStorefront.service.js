const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const navigationService = require(
  "../navigation/navigation.service"
);

/*
 * Normalize CMS page slugs so public requests match
 * the format used by the CMS page service.
 */
const normalizeSlug = (value) => {
  const trimmed = String(value || "/").trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/")
    ? trimmed
    : `/${trimmed}`;

  return withLeadingSlash
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase();
};

/*
 * Returns Sequelize publish-window conditions.
 *
 * A record is public when:
 * - publishStartAt is null or has already passed
 * - publishEndAt is null or has not yet passed
 */
const buildPublishWindowCondition = (now) => ({
  [Op.and]: [
    {
      [Op.or]: [
        {
          publishStartAt: null,
        },
        {
          publishStartAt: {
            [Op.lte]: now,
          },
        },
      ],
    },
    {
      [Op.or]: [
        {
          publishEndAt: null,
        },
        {
          publishEndAt: {
            [Op.gte]: now,
          },
        },
      ],
    },
  ],
});

/*
 * Converts Sequelize models into plain objects.
 */
const toPlainObject = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value.get === "function") {
    return value.get({
      plain: true,
    });
  }

  return value;
};

/*
 * Resolve the company selected by the storefront.
 */
const getCompanyByCode = async ({
  companyCode,
}) => {
  const normalizedCompanyCode = String(
    companyCode || ""
  )
    .trim()
    .toUpperCase();

  if (!normalizedCompanyCode) {
    throw new AppError(
      "Company code is required.",
      400,
      "COMPANY_CODE_REQUIRED"
    );
  }

  const company = await db.Company.findOne({
    where: {
      code: normalizedCompanyCode,
      isActive: true,
    },
  });

  if (!company) {
    throw new AppError(
      "Storefront company not found.",
      404,
      "STOREFRONT_COMPANY_NOT_FOUND"
    );
  }

  return company;
};

/*
 * Build an absolute media URL.
 *
 * For S3/R2/etc., publicUrl will normally already be absolute.
 * For local media, paths are prefixed with the API host.
 */
const buildAbsoluteUrl = (
  url,
  apiBaseUrl
) => {
  if (!url) {
    return null;
  }

  const stringUrl = String(url).trim();

  if (!stringUrl) {
    return null;
  }

  if (
    stringUrl.startsWith("http://") ||
    stringUrl.startsWith("https://")
  ) {
    return stringUrl;
  }

  const normalizedBaseUrl = String(
    apiBaseUrl || ""
  ).replace(/\/+$/, "");

  const normalizedPath =
    stringUrl.startsWith("/")
      ? stringUrl
      : `/${stringUrl}`;

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
};

/*
 * Convert a MediaAsset into a safe public response.
 */
const buildPublicMediaAsset = (
  asset,
  apiBaseUrl
) => {
  if (!asset) {
    return null;
  }

  const plainAsset = toPlainObject(asset);

  const variants = (
    plainAsset.variants || []
  )
    .filter(
      (variant) =>
        variant.isActive === true
    )
    .map((variant) => {
      const variantSourceUrl =
        variant.publicUrl ||
        variant.storagePath ||
        null;

      return {
        id: variant.id,
        variantType:
          variant.variantType,
        format: variant.format,
        mimeType: variant.mimeType,
        width: variant.width,
        height: variant.height,
        fileSize: variant.fileSize,
        publicUrl: buildAbsoluteUrl(
          variantSourceUrl,
          apiBaseUrl
        ),
        isPrimary: variant.isPrimary,
      };
    })
    .filter(
      (variant) => variant.publicUrl
    );

  const originalSourceUrl =
    plainAsset.publicUrl ||
    plainAsset.storagePath ||
    null;

  return {
    id: plainAsset.id,
    assetType: plainAsset.assetType,
    classification:
      plainAsset.classification,

    title: plainAsset.title,
    altText: plainAsset.altText,
    caption: plainAsset.caption,
    description:
      plainAsset.description,

    mimeType: plainAsset.mimeType,
    extension: plainAsset.extension,
    width: plainAsset.width,
    height: plainAsset.height,
    orientation:
      plainAsset.orientation,
    dominantColor:
      plainAsset.dominantColor,
    hasTransparency:
      plainAsset.hasTransparency,

    publicUrl: buildAbsoluteUrl(
      originalSourceUrl,
      apiBaseUrl
    ),

    thumbnailUrl: buildAbsoluteUrl(
      plainAsset.thumbnailPath
        ? `/media/${plainAsset.thumbnailPath}`
        : null,
      apiBaseUrl
    ),
    
    previewUrl: buildAbsoluteUrl(
      plainAsset.previewPath
        ? `/media/${plainAsset.previewPath}`
        : null,
      apiBaseUrl
    ),

    variants,
  };
};

/*
 * Determines whether a JSON key looks like a media asset ID.
 *
 * Supported examples:
 * - assetId
 * - mediaAssetId
 * - desktopAssetId
 * - mobileMediaAssetId
 * - backgroundAssetId
 */
const isMediaAssetIdKey = (key) => {
  const normalizedKey = String(
    key || ""
  ).toLowerCase();

  return (
    normalizedKey === "assetid" ||
    normalizedKey === "mediaassetid" ||
    normalizedKey.endsWith(
      "assetid"
    ) ||
    normalizedKey.endsWith(
      "mediaassetid"
    )
  );
};

/*
 * Recursively collect media asset IDs from the JSONB
 * settings and content objects.
 */
const collectMediaAssetIds = (
  value,
  result = new Set()
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectMediaAssetIds(
        item,
        result
      );
    }

    return result;
  }

  if (typeof value !== "object") {
    return result;
  }

  for (const [
    key,
    nestedValue,
  ] of Object.entries(value)) {
    if (
      isMediaAssetIdKey(key) &&
      typeof nestedValue ===
        "string" &&
      nestedValue.trim()
    ) {
      result.add(
        nestedValue.trim()
      );
    }

    collectMediaAssetIds(
      nestedValue,
      result
    );
  }

  return result;
};

/*
 * Recursively adds resolved media information beside
 * each media asset ID.
 *
 * Example:
 *
 * desktopAssetId: "uuid"
 *
 * becomes:
 *
 * desktopAssetId: "uuid"
 * desktopAssetIdResolved: { ...asset }
 */
const replaceMediaAssetReferences = (
  value,
  mediaMap
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      replaceMediaAssetReferences(
        item,
        mediaMap
      )
    );
  }

  if (typeof value !== "object") {
    return value;
  }

  const result = {};

  for (const [
    key,
    nestedValue,
  ] of Object.entries(value)) {
    result[key] =
      replaceMediaAssetReferences(
        nestedValue,
        mediaMap
      );

    if (
      isMediaAssetIdKey(key) &&
      typeof nestedValue ===
        "string"
    ) {
      result[`${key}Resolved`] =
        mediaMap.get(
          nestedValue
        ) || null;
    }
  }

  return result;
};

/*
 * Fetch storefront-safe public settings.
 *
 * GLOBAL settings and the selected channel settings
 * are included.
 */
const getPublicSettings = async ({
  companyId,
  channel,
}) => {
  const settings =
    await db.SystemSetting.findAll({
      where: {
        companyId,
        isPublic: true,
        isActive: true,

        channel: {
          [Op.in]: [
            "GLOBAL",
            channel,
          ],
        },
      },

      order: [
        ["group", "ASC"],
        ["displayOrder", "ASC"],
        ["key", "ASC"],
      ],
    });

  const groupedSettings = {};

  for (const settingModel of settings) {
    const setting =
      toPlainObject(settingModel);

    if (
      !groupedSettings[
        setting.group
      ]
    ) {
      groupedSettings[
        setting.group
      ] = {};
    }

    groupedSettings[
      setting.group
    ][setting.key] =
      setting.value;
  }

  return groupedSettings;
};

/*
 * Fetch the page independently.
 *
 * This is intentionally separated from the sections
 * query. A broken section, unsupported section type,
 * or include condition must not cause a valid page
 * to appear missing.
 */
const findPublishedPage = async ({
  companyId,
  normalizedSlug,
  channel,
  now,
}) => {
  return db.CmsPage.findOne({
    where: {
      companyId,
      slug: normalizedSlug,
      status: "PUBLISHED",
      isActive: true,

      channel: {
        [Op.in]: [
          channel,
          "BOTH",
        ],
      },

      ...buildPublishWindowCondition(
        now
      ),
    },
  });
};

/*
 * Fetch only public sections belonging to the page.
 */
const findPublishedSections = async ({
  companyId,
  pageId,
  channel,
  now,
}) => {
  return db.CmsPageSection.findAll({
    where: {
      companyId,
      cmsPageId: pageId,
      isEnabled: true,
      isActive: true,

      ...buildPublishWindowCondition(
        now
      ),
    },

    include: [
      {
        model: db.CmsSectionType,
        as: "sectionType",
        required: true,

        where: {
          companyId,
          isActive: true,

          supportedChannels: {
            [Op.contains]: [
              channel,
            ],
          },
        },

        attributes: [
          "id",
          "name",
          "code",
          "description",
          "category",
          "icon",
          "supportedChannels",
          "defaultSettings",
          "defaultContent",
        ],
      },
    ],

    order: [
      ["displayOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
  });
};

/*
 * Fetch all public and ready DAM assets referenced
 * by page section JSON.
 */
const findReferencedMediaAssets =
  async ({
    companyId,
    assetIds,
  }) => {
    if (!assetIds.size) {
      return [];
    }

    return db.MediaAsset.findAll({
      where: {
        id: {
          [Op.in]: Array.from(
            assetIds
          ),
        },

        companyId,
        status: "READY",
        isPublic: true,
        isActive: true,
      },

      include: [
        {
          model:
            db.MediaAssetVariant,
          as: "variants",
          required: false,

          where: {
            companyId,
            isActive: true,
          },
        },
      ],

      order: [
        [
          {
            model:
              db.MediaAssetVariant,
            as: "variants",
          },
          "variantType",
          "ASC",
        ],
      ],
    });
  };

  const withTimeout = (
    promise,
    milliseconds,
    operationName
  ) =>
    Promise.race([
      promise,
  
      new Promise((_, reject) => {
        const timer = setTimeout(() => {
          const error = new Error(
            `${operationName} timed out after ${milliseconds}ms.`
          );
  
          error.code =
            "NAVIGATION_RESOLUTION_TIMEOUT";
  
          reject(error);
        }, milliseconds);
  
        timer.unref?.();
      }),
    ]);
  
  const resolveNavigationSections = async ({
    sections,
    companyId,
    channel,
  }) => {
    const resolvedSections = [];
  
    console.log(
      "[Storefront] Starting navigation section resolution",
      {
        companyId,
        channel,
        sectionCount:
          Array.isArray(sections)
            ? sections.length
            : 0,
      }
    );
  
    for (const section of sections || []) {
      const sectionTypeCode = String(
        section?.type?.code || ""
      )
        .trim()
        .toUpperCase();
  
      if (
        sectionTypeCode !==
        "NAVIGATION"
      ) {
        resolvedSections.push(section);
        continue;
      }
  
      const content =
        section.content &&
        typeof section.content ===
          "object" &&
        !Array.isArray(section.content)
          ? section.content
          : {};
  
      const menuCode = String(
        content.menuCode ||
          content.navigationCode ||
          ""
      )
        .trim()
        .toUpperCase();
  
      console.log(
        "[Storefront] Navigation section found",
        {
          sectionId: section.id,
          sectionCode: section.code,
          menuCode,
        }
      );
  
      if (!menuCode) {
        console.warn(
          "[Storefront] Navigation section has no menuCode",
          {
            sectionId: section.id,
          }
        );
  
        resolvedSections.push({
          ...section,
  
          content: {
            ...content,
            menuResolved: null,
          },
        });
  
        continue;
      }
  
      try {
        console.time(
          `[Storefront] Resolve navigation ${menuCode}`
        );
        const menuResolved =
        await navigationService.getPublicNavigationByCode({
          companyId,
          code: menuCode,
          channel,
        });
  
        console.timeEnd(
          `[Storefront] Resolve navigation ${menuCode}`
        );
  
        console.log(
          "[Storefront] Navigation resolved successfully",
          {
            menuCode:
              menuResolved?.code,
  
            menuId:
              menuResolved?.id,
  
            itemCount:
              Array.isArray(
                menuResolved?.items
              )
                ? menuResolved.items.length
                : 0,
          }
        );
  
        resolvedSections.push({
          ...section,
  
          content: {
            ...content,
            menuCode,
            menuResolved,
          },
        });
      } catch (error) {
        console.error(
          "[Storefront] Navigation resolution failed",
          {
            menuCode,
            message:
              error?.message,
            code:
              error?.code,
            errorCode:
              error?.errorCode,
          }
        );
  
        const errorCode =
          error?.code ||
          error?.errorCode;
  
        if (
          errorCode ===
            "PUBLIC_NAVIGATION_NOT_FOUND" ||
          errorCode ===
            "NAVIGATION_RESOLUTION_TIMEOUT"
        ) {
          resolvedSections.push({
            ...section,
  
            content: {
              ...content,
              menuCode,
              menuResolved: null,
  
              menuResolutionError:
                errorCode,
            },
          });
  
          continue;
        }
  
        throw error;
      }
    }
  
    console.log(
      "[Storefront] Navigation section resolution completed",
      {
        resolvedSectionCount:
          resolvedSections.length,
      }
    );
  
    return resolvedSections;
  };


  /*
 * Return a storefront-safe category object.
 */
const buildPublicCategory = (
  category,
  apiBaseUrl
) => {
  if (!category) {
    return null;
  }

  const plainCategory =
    toPlainObject(category);

  const thumbnailAsset =
    plainCategory.thumbnailAsset
      ? buildPublicMediaAsset(
          plainCategory.thumbnailAsset,
          apiBaseUrl
        )
      : null;

  const imageAsset =
    plainCategory.imageAsset
      ? buildPublicMediaAsset(
          plainCategory.imageAsset,
          apiBaseUrl
        )
      : null;

  const bannerAsset =
    plainCategory.bannerAsset
      ? buildPublicMediaAsset(
          plainCategory.bannerAsset,
          apiBaseUrl
        )
      : null;

  return {
    id: plainCategory.id,
    name: plainCategory.name,
    slug: plainCategory.slug,

    description:
      plainCategory.description ||
      null,

    shortDescription:
      plainCategory.shortDescription ||
      null,

    categoryPath:
      plainCategory.categoryPath ||
      null,

    categoryPathIds:
      Array.isArray(
        plainCategory.categoryPathIds
      )
        ? plainCategory.categoryPathIds
        : [],

    level:
      Number(
        plainCategory.level || 0
      ),

    sortOrder:
      Number(
        plainCategory.sortOrder || 0
      ),

    parentCategoryId:
      plainCategory.parentCategoryId ||
      null,

    thumbnailAssetId:
      plainCategory.thumbnailAssetId ||
      null,

    imageAssetId:
      plainCategory.imageAssetId ||
      null,

    bannerAssetId:
      plainCategory.bannerAssetId ||
      null,

    iconName:
      plainCategory.iconName ||
      null,

    iconUrl:
      buildAbsoluteUrl(
        plainCategory.iconUrl,
        apiBaseUrl
      ),

    isFeatured:
      plainCategory.isFeatured === true,

    showOnHome:
      plainCategory.showOnHome === true,

    thumbnailAsset,
    imageAsset,
    bannerAsset,

    image:
      thumbnailAsset ||
      imageAsset ||
      bannerAsset ||
      null,
  };
};

/*
 * Collect all category IDs selected by CATEGORY_GRID sections.
 */
const collectCategoryGridIds = (
  sections
) => {
  const categoryIds =
    new Set();

  for (const section of sections || []) {
    const sectionTypeCode =
      String(
        section?.type?.code || ""
      )
        .trim()
        .toUpperCase();

    if (
      sectionTypeCode !==
      "CATEGORY_GRID"
    ) {
      continue;
    }

    const content =
      section.content &&
      typeof section.content ===
        "object" &&
      !Array.isArray(
        section.content
      )
        ? section.content
        : {};

    const selectedIds =
      Array.isArray(
        content.categoryIds
      )
        ? content.categoryIds
        : [];

    for (const categoryId of selectedIds) {
      if (
        typeof categoryId ===
          "string" &&
        categoryId.trim()
      ) {
        categoryIds.add(
          categoryId.trim()
        );
      }
    }
  }

  return categoryIds;
};

/*
 * Fetch categories referenced by CATEGORY_GRID sections.
 */
const findReferencedCategories =
  async ({
    companyId,
    categoryIds,
  }) => {
    if (!categoryIds.size) {
      return [];
    }

    return db.Category.findAll({
      where: {
        id: {
          [Op.in]:
            Array.from(
              categoryIds
            ),
        },

        companyId,
        isActive: true,
      },

      include: [
        {
          model:
            db.MediaAsset,

          as:
            "thumbnailAsset",

          required: false,

          where: {
            companyId,
            status: "READY",
            isPublic: true,
            isActive: true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as:
                "variants",

              required: false,

              where: {
                companyId,
                isActive: true,
              },
            },
          ],
        },

        {
          model:
            db.MediaAsset,

          as:
            "imageAsset",

          required: false,

          where: {
            companyId,
            status: "READY",
            isPublic: true,
            isActive: true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as:
                "variants",

              required: false,

              where: {
                companyId,
                isActive: true,
              },
            },
          ],
        },

        {
          model:
            db.MediaAsset,

          as:
            "bannerAsset",

          required: false,

          where: {
            companyId,
            status: "READY",
            isPublic: true,
            isActive: true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as:
                "variants",

              required: false,

              where: {
                companyId,
                isActive: true,
              },
            },
          ],
        },
      ],
    });
  };

/*
 * Resolve selected category IDs while preserving CMS order.
 */
const resolveCategoryGridSections =
  async ({
    sections,
    companyId,
    apiBaseUrl,
  }) => {
    const categoryIds =
      collectCategoryGridIds(
        sections
      );

    const categoryModels =
      await findReferencedCategories({
        companyId,
        categoryIds,
      });

    const categoryMap =
      new Map(
        categoryModels.map(
          (categoryModel) => {
            const category =
              buildPublicCategory(
                categoryModel,
                apiBaseUrl
              );

            return [
              category.id,
              category,
            ];
          }
        )
      );

    return (sections || []).map(
      (section) => {
        const sectionTypeCode =
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase();

        if (
          sectionTypeCode !==
          "CATEGORY_GRID"
        ) {
          return section;
        }

        const content =
          section.content &&
          typeof section.content ===
            "object" &&
          !Array.isArray(
            section.content
          )
            ? section.content
            : {};

        const categoryIds =
          Array.isArray(
            content.categoryIds
          )
            ? content.categoryIds.filter(
                (categoryId) =>
                  typeof categoryId ===
                    "string" &&
                  categoryId.trim()
              )
            : [];

        const categories =
          categoryIds
            .map(
              (categoryId) =>
                categoryMap.get(
                  categoryId
                ) || null
            )
            .filter(Boolean);

        return {
          ...section,

          content: {
            ...content,

            categoryIdsResolved:
              categories,
          },
        };
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Collection Grid
|--------------------------------------------------------------------------
*/

/*
 * Return a storefront-safe collection object.
 */
const buildPublicCollection = (
  collection,
  apiBaseUrl
) => {
  if (!collection) {
    return null;
  }

  const plainCollection =
    toPlainObject(
      collection
    );

  const thumbnailAsset =
    plainCollection.thumbnailAsset
      ? buildPublicMediaAsset(
          plainCollection.thumbnailAsset,
          apiBaseUrl
        )
      : null;

  const bannerAsset =
    plainCollection.bannerAsset
      ? buildPublicMediaAsset(
          plainCollection.bannerAsset,
          apiBaseUrl
        )
      : null;

  const mobileBannerAsset =
    plainCollection.mobileBannerAsset
      ? buildPublicMediaAsset(
          plainCollection.mobileBannerAsset,
          apiBaseUrl
        )
      : null;

  return {
    id:
      plainCollection.id,

    name:
      plainCollection.name,

    slug:
      plainCollection.slug,

    description:
      plainCollection.description ||
      null,

    shortDescription:
      plainCollection.shortDescription ||
      null,

    collectionType:
      plainCollection.collectionType ||
      "MANUAL",

    sortOrder:
      Number(
        plainCollection.sortOrder ||
        0
      ),

    isFeatured:
      plainCollection.isFeatured ===
      true,

    showInMenu:
      plainCollection.showInMenu ===
      true,

    showOnHome:
      plainCollection.showOnHome ===
      true,

    showProductCount:
      plainCollection.showProductCount !==
      false,

    publishedFrom:
      plainCollection.publishedFrom ||
      null,

    publishedUntil:
      plainCollection.publishedUntil ||
      null,

    thumbnailAssetId:
      plainCollection.thumbnailAssetId ||
      null,

    bannerAssetId:
      plainCollection.bannerAssetId ||
      null,

    mobileBannerAssetId:
      plainCollection.mobileBannerAssetId ||
      null,

    thumbnailAsset,
    bannerAsset,
    mobileBannerAsset,

    image:
      thumbnailAsset ||
      bannerAsset ||
      mobileBannerAsset ||
      null,

    productCount:
      Number(
        plainCollection.productCount ||
        0
      ),

    collectionUrl:
      `/collections/${plainCollection.slug}`,
  };
};

/*
|--------------------------------------------------------------------------
| Collect Collection IDs
|--------------------------------------------------------------------------
*/

const collectCollectionGridIds = (
  sections
) => {
  const collectionIds =
    new Set();

  for (
    const section of
    sections || []
  ) {
    const sectionTypeCode =
      String(
        section?.type?.code ||
        ""
      )
        .trim()
        .toUpperCase();

    if (
      sectionTypeCode !==
      "COLLECTION_GRID"
    ) {
      continue;
    }

    const content =
      section.content &&
      typeof section.content ===
        "object" &&
      !Array.isArray(
        section.content
      )
        ? section.content
        : {};

    const selectedIds =
      Array.isArray(
        content.collectionIds
      )
        ? content.collectionIds
        : [];

    for (
      const collectionId of
      selectedIds
    ) {
      if (
        typeof collectionId ===
          "string" &&
        collectionId.trim()
      ) {
        collectionIds.add(
          collectionId.trim()
        );
      }
    }
  }

  return collectionIds;
};

/*
|--------------------------------------------------------------------------
| Fetch Referenced Collections
|--------------------------------------------------------------------------
*/

const findReferencedCollections =
  async ({
    companyId,
    collectionIds,
    now,
  }) => {
    if (
      !collectionIds.size
    ) {
      return [];
    }

    return db.Collection.findAll({
      where: {
        id: {
          [Op.in]:
            Array.from(
              collectionIds
            ),
        },

        companyId,

        isActive:
          true,

        [Op.and]: [
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
        ],
      },

      include: [
        /*
        |--------------------------------------------------------------------------
        | Thumbnail
        |--------------------------------------------------------------------------
        */

        {
          model:
            db.MediaAsset,

          as:
            "thumbnailAsset",

          required:
            false,

          where: {
            companyId,

            status:
              "READY",

            isPublic:
              true,

            isActive:
              true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as:
                "variants",

              required:
                false,

              where: {
                companyId,

                isActive:
                  true,
              },
            },
          ],
        },

        /*
        |--------------------------------------------------------------------------
        | Banner
        |--------------------------------------------------------------------------
        */

        {
          model:
            db.MediaAsset,

          as:
            "bannerAsset",

          required:
            false,

          where: {
            companyId,

            status:
              "READY",

            isPublic:
              true,

            isActive:
              true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as:
                "variants",

              required:
                false,

              where: {
                companyId,

                isActive:
                  true,
              },
            },
          ],
        },

        /*
        |--------------------------------------------------------------------------
        | Mobile Banner
        |--------------------------------------------------------------------------
        */

        {
          model:
            db.MediaAsset,

          as:
            "mobileBannerAsset",

          required:
            false,

          where: {
            companyId,

            status:
              "READY",

            isPublic:
              true,

            isActive:
              true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as:
                "variants",

              required:
                false,

              where: {
                companyId,

                isActive:
                  true,
              },
            },
          ],
        },
      ],
    });
  };

/*
|--------------------------------------------------------------------------
| Resolve Collection Grid Sections
|--------------------------------------------------------------------------
*/

const resolveCollectionGridSections =
  async ({
    sections,
    companyId,
    apiBaseUrl,
    now,
  }) => {
    const collectionIds =
      collectCollectionGridIds(
        sections
      );

    if (
      !collectionIds.size
    ) {
      return sections || [];
    }

    const collectionModels =
      await findReferencedCollections({
        companyId,
        collectionIds,
        now,
      });

    /*
     * Optional product counts.
     *
     * We count rows in product_collections for all selected collections.
     */

    const productCountRows =
      await db.ProductCollection.findAll({
        where: {
          companyId,

          collectionId: {
            [Op.in]:
              Array.from(
                collectionIds
              ),
          },
        },

        attributes: [
          "collectionId",

          [
            db.sequelize.fn(
              "COUNT",
              db.sequelize.col(
                "productId"
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
      });

    const productCountMap =
      new Map(
        productCountRows.map(
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

    const collectionMap =
      new Map(
        collectionModels.map(
          (
            collectionModel
          ) => {
            const plainCollection =
              toPlainObject(
                collectionModel
              );

            plainCollection.productCount =
              productCountMap.get(
                plainCollection.id
              ) ||
              0;

            const collection =
              buildPublicCollection(
                plainCollection,
                apiBaseUrl
              );

            return [
              collection.id,
              collection,
            ];
          }
        )
      );

    return (
      sections ||
      []
    ).map(
      (
        section
      ) => {
        const sectionTypeCode =
          String(
            section?.type?.code ||
            ""
          )
            .trim()
            .toUpperCase();

        if (
          sectionTypeCode !==
          "COLLECTION_GRID"
        ) {
          return section;
        }

        const content =
          section.content &&
          typeof section.content ===
            "object" &&
          !Array.isArray(
            section.content
          )
            ? section.content
            : {};

        const selectedCollectionIds =
          Array.isArray(
            content.collectionIds
          )
            ? content.collectionIds.filter(
                (
                  collectionId
                ) =>
                  typeof collectionId ===
                    "string" &&
                  collectionId.trim()
              )
            : [];

        /*
         * Preserve exact order selected in CMS.
         */

        const collections =
          selectedCollectionIds
            .map(
              (
                collectionId
              ) =>
                collectionMap.get(
                  collectionId
                ) ||
                null
            )
            .filter(
              Boolean
            );

        return {
          ...section,

          content: {
            ...content,

            collectionIdsResolved:
              collections,
          },
        };
      }
    );
  };


  /*
 * Return a storefront-safe brand object.
 */
const buildPublicBrand = (
  brand,
  apiBaseUrl
) => {
  if (!brand) {
    return null;
  }

  const plainBrand =
    toPlainObject(brand);

  const logoAsset =
    plainBrand.logoAsset
      ? buildPublicMediaAsset(
          plainBrand.logoAsset,
          apiBaseUrl
        )
      : null;

  const bannerAsset =
    plainBrand.bannerAsset
      ? buildPublicMediaAsset(
          plainBrand.bannerAsset,
          apiBaseUrl
        )
      : null;

  return {
    id: plainBrand.id,
    name: plainBrand.name,
    code: plainBrand.code,
    slug: plainBrand.slug,

    description:
      plainBrand.description ||
      null,

    websiteUrl:
      plainBrand.websiteUrl ||
      null,

    countryOfOrigin:
      plainBrand.countryOfOrigin ||
      null,

    isFeatured:
      plainBrand.isFeatured ===
      true,

    sortOrder:
      Number(
        plainBrand.sortOrder ||
          0
      ),

    logoAssetId:
      plainBrand.logoAssetId ||
      null,

    bannerAssetId:
      plainBrand.bannerAssetId ||
      null,

    logoAsset,
    bannerAsset,

    image:
      logoAsset ||
      bannerAsset ||
      null,

    brandUrl:
      `/brands/${plainBrand.slug}`,
  };
};

/*
 * Collect brand IDs referenced by BRAND_CAROUSEL
 * sections.
 */
const collectBrandCarouselIds = (
  sections
) => {
  const brandIds =
    new Set();

  for (
    const section of
    sections || []
  ) {
    const sectionTypeCode =
      String(
        section?.type?.code ||
          ""
      )
        .trim()
        .toUpperCase();

    if (
      sectionTypeCode !==
      "BRAND_CAROUSEL"
    ) {
      continue;
    }

    const content =
      section.content &&
      typeof section.content ===
        "object" &&
      !Array.isArray(
        section.content
      )
        ? section.content
        : {};

    const selectedIds =
      Array.isArray(
        content.brandIds
      )
        ? content.brandIds
        : [];

    for (
      const brandId of
      selectedIds
    ) {
      if (
        typeof brandId ===
          "string" &&
        brandId.trim()
      ) {
        brandIds.add(
          brandId.trim()
        );
      }
    }
  }

  return brandIds;
};

/*
 * Fetch brands referenced by BRAND_CAROUSEL
 * sections.
 */
const findReferencedBrands =
  async ({
    companyId,
    brandIds,
  }) => {
    if (!brandIds.size) {
      return [];
    }

    return db.Brand.findAll({
      where: {
        id: {
          [Op.in]:
            Array.from(
              brandIds
            ),
        },

        companyId,
        isActive: true,
      },

      include: [
        {
          model:
            db.MediaAsset,

          as: "logoAsset",

          required: false,

          where: {
            companyId,
            status: "READY",
            isPublic: true,
            isActive: true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as: "variants",

              required: false,

              where: {
                companyId,
                isActive: true,
              },
            },
          ],
        },

        {
          model:
            db.MediaAsset,

          as: "bannerAsset",

          required: false,

          where: {
            companyId,
            status: "READY",
            isPublic: true,
            isActive: true,
          },

          include: [
            {
              model:
                db.MediaAssetVariant,

              as: "variants",

              required: false,

              where: {
                companyId,
                isActive: true,
              },
            },
          ],
        },
      ],
    });
  };

/*
 * Resolve brand IDs while preserving the CMS order.
 */
const resolveBrandCarouselSections =
  async ({
    sections,
    companyId,
    apiBaseUrl,
  }) => {
    const brandIds =
      collectBrandCarouselIds(
        sections
      );

    const brandModels =
      await findReferencedBrands({
        companyId,
        brandIds,
      });

    const brandMap =
      new Map(
        brandModels.map(
          (brandModel) => {
            const brand =
              buildPublicBrand(
                brandModel,
                apiBaseUrl
              );

            return [
              brand.id,
              brand,
            ];
          }
        )
      );

    return (sections || []).map(
      (section) => {
        const sectionTypeCode =
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase();

        if (
          sectionTypeCode !==
          "BRAND_CAROUSEL"
        ) {
          return section;
        }

        const content =
          section.content &&
          typeof section.content ===
            "object" &&
          !Array.isArray(
            section.content
          )
            ? section.content
            : {};

        const selectedBrandIds =
          Array.isArray(
            content.brandIds
          )
            ? content.brandIds.filter(
                (brandId) =>
                  typeof brandId ===
                    "string" &&
                  brandId.trim()
              )
            : [];

        const brands =
          selectedBrandIds
            .map(
              (brandId) =>
                brandMap.get(
                  brandId
                ) || null
            )
            .filter(Boolean);

        return {
          ...section,

          content: {
            ...content,

            brandIdsResolved:
              brands,
          },
        };
      }
    );
  };


  /*
 * Build a validity-window condition for price lists
 * and variant prices.
 */
const buildValidityWindowCondition = (
  now
) => ({
  [Op.and]: [
    {
      [Op.or]: [
        {
          validFrom: null,
        },
        {
          validFrom: {
            [Op.lte]: now,
          },
        },
      ],
    },
    {
      [Op.or]: [
        {
          validUntil: null,
        },
        {
          validUntil: {
            [Op.gte]: now,
          },
        },
      ],
    },
  ],
});

/*
 * Collect all manually selected product IDs from
 * FEATURED_PRODUCT_GRID sections.
 */
const collectFeaturedProductIds = (
  sections
) => {
  const productIds = new Set();

  for (const section of sections || []) {
    const sectionTypeCode = String(
      section?.type?.code || ""
    )
      .trim()
      .toUpperCase();

    if (
      sectionTypeCode !==
      "FEATURED_PRODUCT_GRID"
    ) {
      continue;
    }

    const content =
      section.content &&
      typeof section.content ===
        "object" &&
      !Array.isArray(section.content)
        ? section.content
        : {};

    const selectedIds =
      Array.isArray(
        content.productIds
      )
        ? content.productIds
        : [];

    for (const productId of selectedIds) {
      if (
        typeof productId ===
          "string" &&
        productId.trim()
      ) {
        productIds.add(
          productId.trim()
        );
      }
    }
  }

  return productIds;
};

/*
 * Find the active storefront price list for the
 * requested channel.
 *
 * Channel-specific lists are preferred over ALL.
 * Lower priority numbers are preferred.
 */
const findStorefrontPriceList =
  async ({
    companyId,
    channel,
    now,
  }) => {
    const priceLists =
      await db.PriceList.findAll({
        where: {
          companyId,
          isActive: true,

          channelCode: {
            [Op.in]: [
              channel,
              "ALL",
            ],
          },

          ...buildValidityWindowCondition(
            now
          ),
        },

        order: [
          ["priority", "ASC"],
          ["isDefault", "DESC"],
          ["createdAt", "ASC"],
        ],
      });

    if (!priceLists.length) {
      return null;
    }

    const channelSpecific =
      priceLists.find(
        (priceListModel) => {
          const priceList =
            toPlainObject(
              priceListModel
            );

          return (
            String(
              priceList.channelCode ||
                ""
            )
              .trim()
              .toUpperCase() ===
            channel
          );
        }
      );

    return (
      channelSpecific ||
      priceLists[0]
    );
  };

/*
 * Fetch all products referenced by
 * FEATURED_PRODUCT_GRID sections.
 */
const findReferencedProducts =
  async ({
    companyId,
    productIds,
    priceListId,
    now,
  }) => {
    if (!productIds.size) {
      return [];
    }

    const variantIncludes = [
      {
        model:
          db.ProductVariantPrice,

        as: "prices",

        required: false,

        where: {
          companyId,
          isActive: true,

          ...(priceListId
            ? {
                priceListId,
              }
            : {}),

          ...buildValidityWindowCondition(
            now
          ),
        },

        include: [
          {
            model:
              db.PriceList,

            as: "priceList",

            required: false,

            attributes: [
              "id",
              "code",
              "name",
              "currencyCode",
              "isTaxInclusive",
              "channelCode",
            ],
          },
        ],
      },
    ];

    return db.Product.findAll({
      where: {
        id: {
          [Op.in]:
            Array.from(
              productIds
            ),
        },

        companyId,
        status: "ACTIVE",
        isSearchable: true,
      },

      include: [
        {
          model: db.Brand,
          as: "brand",
          required: false,

          attributes: [
            "id",
            "name",
            "slug",
          ],
        },

        {
          model: db.Category,
          as: "primaryCategory",
          required: false,

          attributes: [
            "id",
            "name",
            "slug",
          ],
        },

        {
          model:
            db.ProductImage,

          as: "images",

          required: false,

          where: {
            companyId,
            isActive: true,
          },

          include: [
            {
              model:
                db.MediaAsset,

              as: "mediaAsset",

              required: false,

              where: {
                companyId,
                status: "READY",
                isPublic: true,
                isActive: true,
              },

              include: [
                {
                  model:
                    db.MediaAssetVariant,

                  as: "variants",

                  required: false,

                  where: {
                    companyId,
                    isActive: true,
                  },
                },
              ],
            },
          ],
        },

        {
          model:
            db.ProductVariant,

          as: "variants",

          required: false,

          where: {
            companyId,
            status: "ACTIVE",
          },

          include:
            variantIncludes,
        },
      ],

      order: [
        [
          {
            model:
              db.ProductImage,
            as: "images",
          },
          "displayOrder",
          "ASC",
        ],

        [
          {
            model:
              db.ProductVariant,
            as: "variants",
          },
          "sortOrder",
          "ASC",
        ],
      ],
    });
  };

/*
 * Select the best available product image.
 *
 * Product-level PRIMARY images are preferred,
 * followed by other product-level images.
 */
const getPublicProductImage = (
  product,
  apiBaseUrl
) => {
  const images = Array.isArray(
    product.images
  )
    ? [...product.images]
    : [];

  images.sort(
    (first, second) => {
      const firstPrimary =
        first.imageRole ===
        "PRIMARY"
          ? 0
          : 1;

      const secondPrimary =
        second.imageRole ===
        "PRIMARY"
          ? 0
          : 1;

      if (
        firstPrimary !==
        secondPrimary
      ) {
        return (
          firstPrimary -
          secondPrimary
        );
      }

      return (
        Number(
          first.displayOrder || 0
        ) -
        Number(
          second.displayOrder || 0
        )
      );
    }
  );

  const selectedImage =
    images.find(
      (image) =>
        image.mediaAsset
    );

  if (!selectedImage) {
    return null;
  }

  return {
    id: selectedImage.id,

    imageRole:
      selectedImage.imageRole,

    altText:
      selectedImage.altText ||
      selectedImage.mediaAsset
        ?.altText ||
      product.name,

    title:
      selectedImage.title ||
      selectedImage.mediaAsset
        ?.title ||
      null,

    mediaAsset:
      buildPublicMediaAsset(
        selectedImage.mediaAsset,
        apiBaseUrl
      ),
  };
};

/*
 * Select the default product variant.
 *
 * isDefault is preferred, followed by sortOrder.
 */
const getPublicProductVariant = (
  product
) => {
  const variants = Array.isArray(
    product.variants
  )
    ? [...product.variants]
    : [];

  variants.sort(
    (first, second) => {
      const firstDefault =
        first.isDefault
          ? 0
          : 1;

      const secondDefault =
        second.isDefault
          ? 0
          : 1;

      if (
        firstDefault !==
        secondDefault
      ) {
        return (
          firstDefault -
          secondDefault
        );
      }

      return (
        Number(
          first.sortOrder || 0
        ) -
        Number(
          second.sortOrder || 0
        )
      );
    }
  );

  return variants[0] || null;
};

/*
 * Select the best active price attached to a variant.
 */
const getPublicVariantPrice = (
  variant
) => {
  if (
    !variant ||
    !Array.isArray(
      variant.prices
    )
  ) {
    return null;
  }

  const prices = [
    ...variant.prices,
  ].sort(
    (first, second) =>
      Number(
        first.priority || 0
      ) -
      Number(
        second.priority || 0
      )
  );

  const selectedPrice =
    prices[0];

  if (!selectedPrice) {
    return null;
  }

  const sellingPrice =
    Number(
      selectedPrice.sellingPrice
    );

  const regularPrice =
    Number(
      selectedPrice.regularPrice
    );

  const compareAtPrice =
    selectedPrice.compareAtPrice !==
      null &&
    selectedPrice.compareAtPrice !==
      undefined
      ? Number(
          selectedPrice.compareAtPrice
        )
      : null;

  return {
    id: selectedPrice.id,

    priceListId:
      selectedPrice.priceListId,

    currencyCode:
      selectedPrice.priceList
        ?.currencyCode ||
      "AED",

    isTaxInclusive:
      selectedPrice.priceList
        ?.isTaxInclusive !== false,

    sellingPrice:
      Number.isFinite(
        sellingPrice
      )
        ? sellingPrice
        : null,

    regularPrice:
      Number.isFinite(
        regularPrice
      )
        ? regularPrice
        : null,

    compareAtPrice:
      Number.isFinite(
        compareAtPrice
      )
        ? compareAtPrice
        : null,
  };
};

/*
 * Convert a Product model into a storefront-safe
 * product-card response.
 */
const buildPublicProduct = (
  productModel,
  apiBaseUrl
) => {
  const product =
    toPlainObject(
      productModel
    );

  const selectedVariant =
    getPublicProductVariant(
      product
    );

  const selectedPrice =
    getPublicVariantPrice(
      selectedVariant
    );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,

    productType:
      product.productType,

    parentSku:
      product.parentSku ||
      null,

    shortDescription:
      product.shortDescription ||
      null,

    isFeatured:
      product.isFeatured ===
      true,

    taxPercent:
      Number(
        product.taxPercent || 0
      ),

    brand: product.brand
      ? {
          id:
            product.brand.id,

          name:
            product.brand.name,

          slug:
            product.brand.slug ||
            null,
        }
      : null,

    primaryCategory:
      product.primaryCategory
        ? {
            id:
              product
                .primaryCategory
                .id,

            name:
              product
                .primaryCategory
                .name,

            slug:
              product
                .primaryCategory
                .slug ||
              null,
          }
        : null,

    image:
      getPublicProductImage(
        product,
        apiBaseUrl
      ),

    defaultVariant:
      selectedVariant
        ? {
            id:
              selectedVariant.id,

            sku:
              selectedVariant.sku,

            barcode:
              selectedVariant.barcode ||
              null,

            name:
              selectedVariant.name,

            isDefault:
              selectedVariant
                .isDefault === true,
          }
        : null,

    price: selectedPrice,

    productUrl:
      `/products/${product.slug}`,
  };
};

/*
 * Resolve product IDs while preserving the exact
 * order selected inside the CMS editor.
 */
const resolveFeaturedProductGridSections =
  async ({
    sections,
    companyId,
    channel,
    apiBaseUrl,
    now,
  }) => {
    const productIds =
      collectFeaturedProductIds(
        sections
      );

    if (!productIds.size) {
      return sections || [];
    }

    const priceListModel =
      await findStorefrontPriceList({
        companyId,
        channel,
        now,
      });

    const priceList =
      priceListModel
        ? toPlainObject(
            priceListModel
          )
        : null;

    const productModels =
      await findReferencedProducts({
        companyId,
        productIds,

        priceListId:
          priceList?.id ||
          null,

        now,
      });

    const productMap =
      new Map(
        productModels.map(
          (productModel) => {
            const product =
              buildPublicProduct(
                productModel,
                apiBaseUrl
              );

            return [
              product.id,
              product,
            ];
          }
        )
      );

    return (sections || []).map(
      (section) => {
        const sectionTypeCode =
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase();

        if (
          sectionTypeCode !==
          "FEATURED_PRODUCT_GRID"
        ) {
          return section;
        }

        const content =
          section.content &&
          typeof section.content ===
            "object" &&
          !Array.isArray(
            section.content
          )
            ? section.content
            : {};

        const selectedProductIds =
          Array.isArray(
            content.productIds
          )
            ? content.productIds.filter(
                (productId) =>
                  typeof productId ===
                    "string" &&
                  productId.trim()
              )
            : [];

        const products =
          selectedProductIds
            .map(
              (productId) =>
                productMap.get(
                  productId
                ) || null
            )
            .filter(Boolean);

        return {
          ...section,

          content: {
            ...content,

            productIdsResolved:
              products,

            resolvedPriceList:
              priceList
                ? {
                    id:
                      priceList.id,

                    code:
                      priceList.code,

                    name:
                      priceList.name,

                    currencyCode:
                      priceList.currencyCode,

                    isTaxInclusive:
                      priceList.isTaxInclusive,
                  }
                : null,
          },
        };
      }
    );
  };


/*
 * Product Carousel
 * -------------------------------------------------------
 * Supports:
 * - MANUAL
 * - CATEGORY
 * - BRAND
 * - FEATURED
 * - NEW_ARRIVALS
 *
 * BEST_SELLERS is intentionally left empty until sales
 * aggregation is available.
 */

const getProductCarouselLimit = (
  settings
) => {
  const requestedLimit = Number(
    settings?.maximumProducts ||
      settings?.itemLimit ||
      settings?.limit ||
      12
  );

  if (
    !Number.isFinite(
      requestedLimit
    )
  ) {
    return 12;
  }

  return Math.min(
    50,
    Math.max(
      1,
      Math.floor(
        requestedLimit
      )
    )
  );
};

const getProductCarouselSourceType = (
  settings
) =>
  String(
    settings?.sourceType ||
      "MANUAL"
  )
    .trim()
    .toUpperCase();

const getProductStorefrontIncludes = ({
  companyId,
  priceListId,
  now,
}) => [
  {
    model: db.Brand,
    as: "brand",
    required: false,

    attributes: [
      "id",
      "name",
      "slug",
    ],
  },

  {
    model: db.Category,
    as: "primaryCategory",
    required: false,

    attributes: [
      "id",
      "name",
      "slug",
    ],
  },

  {
    model: db.ProductImage,
    as: "images",
    required: false,

    where: {
      companyId,
      isActive: true,
    },

    include: [
      {
        model:
          db.MediaAsset,

        as: "mediaAsset",
        required: false,

        where: {
          companyId,
          status: "READY",
          isPublic: true,
          isActive: true,
        },

        include: [
          {
            model:
              db.MediaAssetVariant,

            as: "variants",
            required: false,

            where: {
              companyId,
              isActive: true,
            },
          },
        ],
      },
    ],
  },

  {
    model:
      db.ProductVariant,

    as: "variants",
    required: false,

    where: {
      companyId,
      status: "ACTIVE",
    },

    include: [
      {
        model:
          db.ProductVariantPrice,

        as: "prices",
        required: false,

        where: {
          companyId,
          isActive: true,

          ...(priceListId
            ? {
                priceListId,
              }
            : {}),

          ...buildValidityWindowCondition(
            now
          ),
        },

        include: [
          {
            model:
              db.PriceList,

            as: "priceList",
            required: false,

            attributes: [
              "id",
              "code",
              "name",
              "currencyCode",
              "isTaxInclusive",
              "channelCode",
            ],
          },
        ],
      },
    ],
  },
];

const findProductCarouselProducts =
  async ({
    companyId,
    content,
    settings,
    priceListId,
    now,
  }) => {
    const sourceType =
      getProductCarouselSourceType(
        settings
      );

    const limit =
      getProductCarouselLimit(
        settings
      );

    const where = {
      companyId,
      status: "ACTIVE",
      isSearchable: true,
    };

    let order = [
      ["sortOrder", "ASC"],
      ["createdAt", "DESC"],
    ];

    if (sourceType === "MANUAL") {
      const productIds =
        Array.isArray(
          content.productIds
        )
          ? content.productIds
              .filter(
                (productId) =>
                  typeof productId ===
                    "string" &&
                  productId.trim()
              )
              .map(
                (productId) =>
                  productId.trim()
              )
          : [];

      if (!productIds.length) {
        return [];
      }

      where.id = {
        [Op.in]: productIds,
      };
    } else if (
      sourceType === "CATEGORY"
    ) {
      const categoryId =
        typeof content.categoryId ===
          "string"
          ? content.categoryId.trim()
          : "";

      if (!categoryId) {
        return [];
      }

      where.primaryCategoryId =
        categoryId;
    } else if (
      sourceType === "BRAND"
    ) {
      const brandId =
        typeof content.brandId ===
          "string"
          ? content.brandId.trim()
          : "";

      if (!brandId) {
        return [];
      }

      where.brandId = brandId;
    } else if (
      sourceType === "FEATURED"
    ) {
      where.isFeatured = true;
    } else if (
      sourceType ===
      "NEW_ARRIVALS"
    ) {
      order = [
        ["createdAt", "DESC"],
      ];
    } else if (
      sourceType ===
      "BEST_SELLERS"
    ) {
      return [];
    } else {
      return [];
    }

    const products =
      await db.Product.findAll({
        where,

        include:
          getProductStorefrontIncludes({
            companyId,
            priceListId,
            now,
          }),

        order: [
          ...order,

          [
            {
              model:
                db.ProductImage,
              as: "images",
            },
            "displayOrder",
            "ASC",
          ],

          [
            {
              model:
                db.ProductVariant,
              as: "variants",
            },
            "sortOrder",
            "ASC",
          ],
        ],

        limit:
          sourceType === "MANUAL"
            ? undefined
            : limit,

        distinct: true,
      });

    if (
      sourceType !== "MANUAL"
    ) {
      return products.slice(
        0,
        limit
      );
    }

    const productMap =
      new Map(
        products.map(
          (productModel) => {
            const product =
              toPlainObject(
                productModel
              );

            return [
              product.id,
              productModel,
            ];
          }
        )
      );

    return (
      content.productIds || []
    )
      .map(
        (productId) =>
          productMap.get(
            productId
          ) || null
      )
      .filter(Boolean)
      .slice(0, limit);
  };

const resolveProductCarouselSections =
  async ({
    sections,
    companyId,
    channel,
    apiBaseUrl,
    now,
  }) => {
    const hasProductCarousel =
      (sections || []).some(
        (section) =>
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase() ===
          "PRODUCT_CAROUSEL"
      );

    if (!hasProductCarousel) {
      return sections || [];
    }

    const priceListModel =
      await findStorefrontPriceList({
        companyId,
        channel,
        now,
      });

    const priceList =
      priceListModel
        ? toPlainObject(
            priceListModel
          )
        : null;

    const resolvedSections = [];

    for (
      const section of
      sections || []
    ) {
      const sectionTypeCode =
        String(
          section?.type?.code ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        sectionTypeCode !==
        "PRODUCT_CAROUSEL"
      ) {
        resolvedSections.push(
          section
        );

        continue;
      }

      const content =
        section.content &&
        typeof section.content ===
          "object" &&
        !Array.isArray(
          section.content
        )
          ? section.content
          : {};

      const settings =
        section.settings &&
        typeof section.settings ===
          "object" &&
        !Array.isArray(
          section.settings
        )
          ? section.settings
          : {};

      const productModels =
        await findProductCarouselProducts({
          companyId,
          content,
          settings,

          priceListId:
            priceList?.id ||
            null,

          now,
        });

      const products =
        productModels.map(
          (productModel) =>
            buildPublicProduct(
              productModel,
              apiBaseUrl
            )
        );

      resolvedSections.push({
        ...section,

        content: {
          ...content,

          productIdsResolved:
            products,

          resolvedPriceList:
            priceList
              ? {
                  id:
                    priceList.id,

                  code:
                    priceList.code,

                  name:
                    priceList.name,

                  currencyCode:
                    priceList.currencyCode,

                  isTaxInclusive:
                    priceList.isTaxInclusive,
                }
              : null,
        },
      });
    }

    return resolvedSections;
  };



/*
 * Flash Deals
 * -------------------------------------------------------
 * Supports:
 * - MANUAL
 * - CATEGORY
 * - BRAND
 *
 * PROMOTION remains empty until promotion-product
 * resolution is implemented.
 */
const resolveFlashDealsSections =
  async ({
    sections,
    companyId,
    channel,
    apiBaseUrl,
    now,
  }) => {
    const hasFlashDeals =
      (sections || []).some(
        (section) =>
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase() ===
          "FLASH_DEALS"
      );

    if (!hasFlashDeals) {
      return sections || [];
    }

    const priceListModel =
      await findStorefrontPriceList({
        companyId,
        channel,
        now,
      });

    const priceList =
      priceListModel
        ? toPlainObject(
            priceListModel
          )
        : null;

    const resolvedSections = [];

    for (
      const section of
      sections || []
    ) {
      const sectionTypeCode =
        String(
          section?.type?.code ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        sectionTypeCode !==
        "FLASH_DEALS"
      ) {
        resolvedSections.push(
          section
        );

        continue;
      }

      const content =
        section.content &&
        typeof section.content ===
          "object" &&
        !Array.isArray(
          section.content
        )
          ? section.content
          : {};

      const settings =
        section.settings &&
        typeof section.settings ===
          "object" &&
        !Array.isArray(
          section.settings
        )
          ? section.settings
          : {};

      const sourceType =
        String(
          settings.sourceType ||
            "MANUAL"
        )
          .trim()
          .toUpperCase();

      const startAt =
        content.startAt
          ? new Date(
              content.startAt
            )
          : null;

      const endAt =
        content.endAt
          ? new Date(
              content.endAt
            )
          : null;

      const hasValidStart =
        startAt &&
        !Number.isNaN(
          startAt.getTime()
        );

      const hasValidEnd =
        endAt &&
        !Number.isNaN(
          endAt.getTime()
        );

      const dealStatus =
        hasValidEnd &&
        endAt.getTime() <=
          now.getTime()
          ? "ENDED"
          : hasValidStart &&
              startAt.getTime() >
                now.getTime()
            ? "UPCOMING"
            : "ACTIVE";

      let productModels = [];

      if (
        sourceType !==
        "PROMOTION"
      ) {
        productModels =
          await findProductCarouselProducts({
            companyId,
            content,

            settings: {
              ...settings,
              sourceType,
            },

            priceListId:
              priceList?.id ||
              null,

            now,
          });
      }

      const products =
        productModels.map(
          (productModel) =>
            buildPublicProduct(
              productModel,
              apiBaseUrl
            )
        );

      resolvedSections.push({
        ...section,

        content: {
          ...content,

          productIdsResolved:
            products,

          dealStatus,

          startAt:
            hasValidStart
              ? startAt.toISOString()
              : null,

          endAt:
            hasValidEnd
              ? endAt.toISOString()
              : null,

          resolvedPriceList:
            priceList
              ? {
                  id:
                    priceList.id,

                  code:
                    priceList.code,

                  name:
                    priceList.name,

                  currencyCode:
                    priceList.currencyCode,

                  isTaxInclusive:
                    priceList.isTaxInclusive,
                }
              : null,
        },
      });
    }

    return resolvedSections;
  };


/*
 * Pre-Booking
 * -------------------------------------------------------
 * Reuses Product Carousel product and pricing helpers.
 */
const resolvePreBookingSections = async ({
  sections,
  companyId,
  channel,
  apiBaseUrl,
  now,
}) => {
  const hasPreBooking = (sections || []).some(
    (section) => String(section?.type?.code || "").trim().toUpperCase() === "PRE_BOOKING"
  );

  if (!hasPreBooking) return sections || [];

  const priceListModel = await findStorefrontPriceList({ companyId, channel, now });
  const priceList = priceListModel ? toPlainObject(priceListModel) : null;
  const resolvedSections = [];

  for (const section of sections || []) {
    const sectionTypeCode = String(section?.type?.code || "").trim().toUpperCase();

    if (sectionTypeCode !== "PRE_BOOKING") {
      resolvedSections.push(section);
      continue;
    }

    const content = section.content && typeof section.content === "object" && !Array.isArray(section.content)
      ? section.content
      : {};

    const settings = section.settings && typeof section.settings === "object" && !Array.isArray(section.settings)
      ? section.settings
      : {};

    const startAt = content.bookingStartAt ? new Date(content.bookingStartAt) : null;
    const endAt = content.bookingEndAt ? new Date(content.bookingEndAt) : null;
    const validStart = startAt && !Number.isNaN(startAt.getTime());
    const validEnd = endAt && !Number.isNaN(endAt.getTime());

    const bookingStatus =
      validEnd && endAt.getTime() <= now.getTime()
        ? "CLOSED"
        : validStart && startAt.getTime() > now.getTime()
          ? "UPCOMING"
          : "ACTIVE";

    const sourceType = String(settings.sourceType || "MANUAL").trim().toUpperCase();

    const productModels = await findProductCarouselProducts({
      companyId,
      content,
      settings: { ...settings, sourceType },
      priceListId: priceList?.id || null,
      now,
    });

    const products = productModels.map((productModel) => ({
      ...buildPublicProduct(productModel, apiBaseUrl),
      preBooking: {
        bookingType: "REGISTER_INTEREST",
        depositAmount: null,
        fullBookingPrice: null,
        bookingStartAt: validStart ? startAt.toISOString() : null,
        bookingEndAt: validEnd ? endAt.toISOString() : null,
        expectedLaunchAt: null,
        expectedDeliveryFrom: null,
        expectedDeliveryUntil: null,
        maximumBookings: null,
        bookedQuantity: 0,
        allowWaitlist: true,
        status: bookingStatus,
      },
    }));

    resolvedSections.push({
      ...section,
      content: {
        ...content,
        bookingStatus,
        bookingStartAt: validStart ? startAt.toISOString() : null,
        bookingEndAt: validEnd ? endAt.toISOString() : null,
        productIdsResolved: products,
        resolvedPriceList: priceList
          ? {
              id: priceList.id,
              code: priceList.code,
              name: priceList.name,
              currencyCode: priceList.currencyCode,
              isTaxInclusive: priceList.isTaxInclusive,
            }
          : null,
      },
    });
  }

  return resolvedSections;
};

/*
 * Public storefront page entry point.
 */

const getPublicStorefrontPage = async ({
  companyCode,
  slug = "/",
  channel = "WEBSITE",
  apiBaseUrl,
}) => {
  console.log("========== PUBLIC STOREFRONT START ==========");

  const now = new Date();

    const normalizedChannel = String(
      channel || "WEBSITE"
    )
      .trim()
      .toUpperCase();

    if (
      ![
        "WEBSITE",
        "KIOSK",
      ].includes(normalizedChannel)
    ) {
      throw new AppError(
        "Invalid storefront channel.",
        400,
        "INVALID_STOREFRONT_CHANNEL"
      );
    }

    /*
     * Important:
     * Normalize the slug before using it anywhere.
     */
    const normalizedSlug =
      normalizeSlug(slug);

    const company =
      await getCompanyByCode({
        companyCode,
      });

      console.log("Company loaded");
      
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "PUBLIC STOREFRONT LOOKUP",
        {
          receivedCompanyCode:
            companyCode,
          resolvedCompanyId:
            company.id,
          resolvedCompanyCode:
            company.code,
          requestedSlug:
            normalizedSlug,
          requestedChannel:
            normalizedChannel,
        }
      );
    }

    /*
     * Development-only diagnostic.
     *
     * This shows whether a CMS page exists for this
     * company and slug before public filters are applied.
     */
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      const diagnosticPage =
        await db.CmsPage.findOne({
          where: {
            companyId: company.id,
            slug: normalizedSlug,
          },

          attributes: [
            "id",
            "name",
            "code",
            "slug",
            "pageType",
            "channel",
            "status",
            "isActive",
            "isDefault",
            "publishedAt",
            "publishStartAt",
            "publishEndAt",
          ],

          raw: true,
        });

      console.log(
        "STOREFRONT PAGE DIAGNOSTIC",
        diagnosticPage
      );
    }

    /*
     * Find the public page first without joining sections.
     */
    const page =
      await findPublishedPage({
        companyId: company.id,
        normalizedSlug,
        channel:
          normalizedChannel,
        now,
      });


      console.log("Page loaded");


    if (!page) {
      throw new AppError(
        "Published storefront page not found.",
        404,
        "STOREFRONT_PAGE_NOT_FOUND"
      );
    }

    /*
     * Fetch public page sections separately.
     */
    const sectionModels =
      await findPublishedSections({
        companyId: company.id,
        pageId: page.id,
        channel:
          normalizedChannel,
        now,
      });

      console.log("Sections loaded");

    const plainPage =
      toPlainObject(page);

    const plainSections =
      sectionModels.map(
        (section) =>
          toPlainObject(section)
      );

    /*
     * Collect all media IDs referenced in section
     * settings and section content.
     */
    const assetIds = new Set();

    for (const section of plainSections) {
      collectMediaAssetIds(
        section.settings,
        assetIds
      );

      collectMediaAssetIds(
        section.content,
        assetIds
      );
    }

    /*
     * Fetch and resolve DAM assets.
     */
    const mediaAssets =
      await findReferencedMediaAssets({
        companyId: company.id,
        assetIds,
      });

      console.log("Media loaded");



    const mediaMap = new Map(
      mediaAssets.map(
        (assetModel) => {
          const asset =
            toPlainObject(
              assetModel
            );

          return [
            asset.id,
            buildPublicMediaAsset(
              asset,
              apiBaseUrl
            ),
          ];
        }
      )
    );

    /*
     * Build normalized rendering-engine sections.
     */
    const baseSections = plainSections
      .map((section) => ({
        id: section.id,
        companyId:
          section.companyId,
        cmsPageId:
          section.cmsPageId,

        code: section.code,
        name: section.name,

        displayOrder:
          Number(
            section.displayOrder ||
              0
          ),

        visibility:
          section.visibility || {
            desktop: true,
            tablet: true,
            mobile: true,
            kiosk: true,
          },

        publishStartAt:
          section.publishStartAt ||
          null,

        publishEndAt:
          section.publishEndAt ||
          null,

        type: {
          id:
            section.sectionType.id,

          name:
            section.sectionType.name,

          code:
            section.sectionType.code,

          description:
            section.sectionType
              .description || null,

          category:
            section.sectionType
              .category,

          icon:
            section.sectionType
              .icon || null,

          supportedChannels:
            section.sectionType
              .supportedChannels ||
            [],
        },

        settings:
          replaceMediaAssetReferences(
            section.settings || {},
            mediaMap
          ),

        content:
          replaceMediaAssetReferences(
            section.content || {},
            mediaMap
          ),
      }))
      .sort(
        (first, second) =>
          first.displayOrder -
          second.displayOrder
      );

      console.log(
        "[Storefront] Base sections prepared",
        {
          count:
            baseSections.length,
      
          types:
            baseSections.map(
              (section) =>
                section?.type?.code
            ),
        }
      );
      
      console.log("About to resolve navigation");

      const navigationResolvedSections =
  await resolveNavigationSections({
    sections:
      baseSections,

    companyId:
      company.id,

    channel:
      normalizedChannel,
  });

console.log(
  "Navigation resolved"
);

const categoryResolvedSections =
  await resolveCategoryGridSections({
    sections:
      navigationResolvedSections,

    companyId:
      company.id,

    apiBaseUrl,
  });

console.log(
  "Category grids resolved"
);

/*
|--------------------------------------------------------------------------
| Collection Grids
|--------------------------------------------------------------------------
*/

const collectionResolvedSections =
  await resolveCollectionGridSections({
    sections:
      categoryResolvedSections,

    companyId:
      company.id,

    apiBaseUrl,

    now,
  });

console.log(
  "Collection grids resolved"
);

/*
|--------------------------------------------------------------------------
| Brand Carousels
|--------------------------------------------------------------------------
*/

const brandResolvedSections =
  await resolveBrandCarouselSections({
    sections:
      collectionResolvedSections,

    companyId:
      company.id,

    apiBaseUrl,
  });

console.log(
  "Brand carousels resolved"
);

const featuredResolvedSections =
  await resolveFeaturedProductGridSections({
    sections:
      brandResolvedSections,

    companyId: company.id,
    channel: normalizedChannel,
    apiBaseUrl,
    now,
  });

console.log(
  "Featured product grids resolved"
);

const productCarouselResolvedSections =
  await resolveProductCarouselSections({
    sections:
      featuredResolvedSections,

    companyId: company.id,
    channel: normalizedChannel,
    apiBaseUrl,
    now,
  });

console.log(
  "Product carousels resolved"
);

const flashDealsResolvedSections =
  await resolveFlashDealsSections({
    sections:
      productCarouselResolvedSections,

    companyId: company.id,
    channel: normalizedChannel,
    apiBaseUrl,
    now,
  });

console.log(
  "Flash deals resolved"
);

const sections =
  await resolvePreBookingSections({
    sections:
      flashDealsResolvedSections,

    companyId: company.id,
    channel: normalizedChannel,
    apiBaseUrl,
    now,
  });

console.log(
  "Pre-booking sections resolved"
);
      
      console.log(
        "[Storefront] Sections fully resolved",
        {
          count:
            sections.length,
        }
      );

    /*
     * Public settings such as branding, contact,
     * header, footer and social configuration.
     */
    const settings =
      await getPublicSettings({
        companyId: company.id,
        channel:
          normalizedChannel,
      });

    return {
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        legalName:
          company.legalName,
        email: company.email,
        phone: company.phone,
        trn: company.trn,
        address: company.address,
        country: company.country,
        currency:
          company.currency,
        timezone:
          company.timezone,
        logoUrl: buildAbsoluteUrl(
          company.logoUrl,
          apiBaseUrl
        ),
      },

      page: {
        id: plainPage.id,
        name: plainPage.name,
        code: plainPage.code,
        slug: plainPage.slug,

        pageType:
          plainPage.pageType,

        channel:
          plainPage.channel,

        title:
          plainPage.title,

        description:
          plainPage.description,

        seo: {
          title:
            plainPage.seoTitle ||
            plainPage.title ||
            plainPage.name,

          description:
            plainPage.seoDescription ||
            plainPage.description ||
            null,

          keywords:
            Array.isArray(
              plainPage.seoKeywords
            )
              ? plainPage.seoKeywords
              : [],
        },

        layoutSettings:
          plainPage.layoutSettings ||
          {},

        publishedAt:
          plainPage.publishedAt,

        publishStartAt:
          plainPage.publishStartAt,

        publishEndAt:
          plainPage.publishEndAt,

        isDefault:
          plainPage.isDefault,

        sections,
      },

      settings,

      meta: {
        channel:
          normalizedChannel,

        requestedSlug:
          normalizedSlug,

        sectionCount:
          sections.length,

        resolvedAssetCount:
          mediaMap.size,

        generatedAt:
          new Date().toISOString(),
      },
    };
  };

module.exports = {
  getPublicStorefrontPage,
};