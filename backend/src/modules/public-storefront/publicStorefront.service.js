const { Op } = require("sequelize");

const db = require("../../models");

const publicAvailabilityService =
  require(
    "./publicAvailability.service"
  );

const giftVoucherPromotionService =
  require(
    "../gift-voucher-promotions/giftVoucherPromotion.service"
  );


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
      ![
        "CATEGORY_GRID",
        "CATEGORY_CAROUSEL",
      ].includes(
        sectionTypeCode
      )
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
/*
|--------------------------------------------------------------------------
| Fetch Referenced Categories
|--------------------------------------------------------------------------
|
| IMPORTANT PERFORMANCE NOTE
|
| Category cards may reference:
|
| - thumbnailAsset
| - imageAsset
| - bannerAsset
|
| Each MediaAsset can itself have several MediaAssetVariant rows.
|
| Joining all three MediaAssetVariant collections into one SQL query creates
| a multiplicative result set:
|
| thumbnail variants
|   × image variants
|   × banner variants
|
| This previously caused the CATEGORY_GRID resolver to allocate hundreds of
| MB of temporary heap for a relatively small homepage payload.
|
| Use separate:true for the hasMany MediaAssetVariant associations so
| Sequelize fetches variants separately instead of multiplying SQL rows.
|--------------------------------------------------------------------------
*/

const findReferencedCategories =
  async ({
    companyId,
    categoryIds,
  }) => {
    if (
      !categoryIds.size
    ) {
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

        isActive:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | Category Fields
      |--------------------------------------------------------------------------
      |
      | Keep the fields required by buildPublicCategory().
      |--------------------------------------------------------------------------
      */

      attributes: [
        "id",
        "name",
        "slug",
        "description",
        "shortDescription",
        "categoryPath",
        "categoryPathIds",
        "level",
        "sortOrder",
        "parentCategoryId",
        "thumbnailAssetId",
        "imageAssetId",
        "bannerAssetId",
        "iconName",
        "iconUrl",
        "isFeatured",
        "showOnHome",
      ],

      include: [
        /*
        |--------------------------------------------------------------------------
        | Thumbnail Asset
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

              /*
               * CRITICAL:
               *
               * Prevent this hasMany relationship from participating in
               * the main Category SQL join.
               */
              separate:
                true,

              where: {
                companyId,

                isActive:
                  true,

                  variantType: {
                    [Op.in]: [
                      "THUMBNAIL",
                      "SMALL",
                    ],
                  },
                  
                  format: {
                    [Op.in]: [
                      "avif",
                    ],
                  },
              },

              order: [
                [
                  "variantType",
                  "ASC",
                ],

                [
                  "createdAt",
                  "ASC",
                ],
              ],
            },
          ],
        },

        /*
        |--------------------------------------------------------------------------
        | Main Image Asset
        |--------------------------------------------------------------------------
        */

        {
          model:
            db.MediaAsset,

          as:
            "imageAsset",

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

              /*
               * Prevent Cartesian multiplication.
               */
              separate:
                true,

              where: {
                companyId,

                isActive:
                  true,

                variantType: {
                  [Op.in]: [
                    "THUMBNAIL",
                    "SMALL",
                    "PREVIEW",
                    "MEDIUM",
                  ],
                },
              },

              order: [
                [
                  "variantType",
                  "ASC",
                ],

                [
                  "createdAt",
                  "ASC",
                ],
              ],
            },
          ],
        },

        /*
        |--------------------------------------------------------------------------
        | Banner Asset
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

              /*
               * Prevent Cartesian multiplication.
               */
              separate:
                true,

              where: {
                companyId,

                isActive:
                  true,

                variantType: {
                  [Op.in]: [
                    "THUMBNAIL",
                    "SMALL",
                    "PREVIEW",
                    "MEDIUM",
                  ],
                },
              },

              order: [
                [
                  "variantType",
                  "ASC",
                ],

                [
                  "createdAt",
                  "ASC",
                ],
              ],
            },
          ],
        },
      ],

      order: [
        [
          "sortOrder",
          "ASC",
        ],

        [
          "name",
          "ASC",
        ],
      ],
    });
  };

/*
|--------------------------------------------------------------------------
| Compact Homepage Category Media
|--------------------------------------------------------------------------
|
| CATEGORY_CAROUSEL and CATEGORY_GRID do not need the complete DAM payload
| returned by buildPublicCategory().
|
| Keep only the media information required to render category cards.
|--------------------------------------------------------------------------
*/

const buildCompactCategoryMedia = (
  mediaAsset,
  apiBaseUrl
) => {
  if (!mediaAsset) {
    return null;
  }

  const asset =
    toPlainObject(
      mediaAsset
    );

  /*
   * Homepage category cards only need small image variants.
   *
   * Prefer AVIF when available. Keep one variant for each useful size
   * instead of returning WebP + AVIF + PREVIEW + MEDIUM metadata.
   */
  const variants =
    Array.isArray(
      asset.variants
    )
      ? asset.variants
          .filter(
            (variant) =>
              variant &&
              variant.isActive ===
                true &&
              [
                "THUMBNAIL",
                "SMALL",
              ].includes(
                String(
                  variant.variantType ||
                    ""
                ).toUpperCase()
              ) &&
              String(
                variant.format ||
                  ""
              ).toLowerCase() ===
                "avif"
          )
          .map(
            (variant) => ({
              id:
                variant.id,

              variantType:
                variant.variantType,

              format:
                variant.format,

              width:
                variant.width ??
                null,

              height:
                variant.height ??
                null,

              publicUrl:
                buildAbsoluteUrl(
                  variant.publicUrl ||
                    variant.storagePath ||
                    null,
                  apiBaseUrl
                ),

              isPrimary:
                variant.isPrimary ===
                true,
            })
          )
          .filter(
            (variant) =>
              Boolean(
                variant.publicUrl
              )
          )
      : [];

  const thumbnailVariant =
    variants.find(
      (variant) =>
        variant.variantType ===
        "THUMBNAIL"
    );

  const smallVariant =
    variants.find(
      (variant) =>
        variant.variantType ===
        "SMALL"
    );

  return {
    id:
      asset.id,

    title:
      asset.title ||
      null,

    altText:
      asset.altText ||
      null,

    /*
     * Preserve these fields because the existing storefront components
     * already know how to consume them.
     */
    publicUrl:
      buildAbsoluteUrl(
        asset.publicUrl ||
          asset.storagePath ||
          null,
        apiBaseUrl
      ),

    thumbnailUrl:
      thumbnailVariant
        ?.publicUrl ||
      buildAbsoluteUrl(
        asset.thumbnailUrl,
        apiBaseUrl
      ) ||
      null,

    previewUrl:
      smallVariant
        ?.publicUrl ||
      buildAbsoluteUrl(
        asset.previewUrl,
        apiBaseUrl
      ) ||
      null,

    variants,
  };
};

/*
|--------------------------------------------------------------------------
| Compact Homepage Category
|--------------------------------------------------------------------------
*/

const buildCompactHomepageCategory = (
  category,
  apiBaseUrl
) => {
  if (!category) {
    return null;
  }

  const row =
    toPlainObject(
      category
    );

  /*
   * Prefer thumbnailAsset.
   *
   * Keep imageAsset/bannerAsset only as fallbacks when a category has no
   * thumbnail. Do not serialize all three full MediaAsset objects.
   */
  const sourceAsset =
    row.thumbnailAsset ||
    row.imageAsset ||
    row.bannerAsset ||
    null;

  const image =
    buildCompactCategoryMedia(
      sourceAsset,
      apiBaseUrl
    );

  return {
    id:
      row.id,

    name:
      row.name,

    slug:
      row.slug,

    shortDescription:
      row.shortDescription ||
      null,

    categoryPath:
      row.categoryPath ||
      null,

    iconName:
      row.iconName ||
      null,

    iconUrl:
      buildAbsoluteUrl(
        row.iconUrl,
        apiBaseUrl
      ),

    /*
     * Maintain compatibility with both existing category components.
     *
     * We intentionally reference the same compact object instead of
     * constructing several complete media representations.
     */
    thumbnailAsset:
      image,

    image:
      image,

    productCount:
      row.productCount ??
      null,
  };
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
              buildCompactHomepageCategory(
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
          ![
            "CATEGORY_GRID",
            "CATEGORY_CAROUSEL",
          ].includes(
            sectionTypeCode
          )
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

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          |
          | Do NOT load MediaAssetVariant here.
          |
          | BrandCarouselSection only uses:
          |
          | - publicUrl
          | - previewUrl
          | - thumbnailUrl
          |
          | Loading all variants massively increases the homepage payload.
          |
          |--------------------------------------------------------------------------
          */
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

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          |
          | Same rule for the optional banner asset:
          | no MediaAssetVariant hydration is required by Brand Carousel.
          |
          |--------------------------------------------------------------------------
          */
        },
      ],
    });
  };

/*
|--------------------------------------------------------------------------
| Compact Homepage Brand Media
|--------------------------------------------------------------------------
|
| BRAND_CAROUSEL does not need the complete public MediaAsset structure.
| MediaAssetVariant rows are already intentionally excluded by
| findReferencedBrands().
|
| Keep only the fields required by BrandCarouselSection.
|--------------------------------------------------------------------------
*/

const buildCompactHomepageBrandMedia = (
  mediaAsset,
  apiBaseUrl
) => {
  if (!mediaAsset) {
    return null;
  }

  const asset =
    toPlainObject(
      mediaAsset
    );

  return {
    id:
      asset.id,

    title:
      asset.title ||
      null,

    altText:
      asset.altText ||
      null,

    publicUrl:
      buildAbsoluteUrl(
        asset.publicUrl ||
          asset.storagePath ||
          null,
        apiBaseUrl
      ),

    thumbnailUrl:
      buildAbsoluteUrl(
        asset.thumbnailUrl,
        apiBaseUrl
      ),

    previewUrl:
      buildAbsoluteUrl(
        asset.previewUrl,
        apiBaseUrl
      ),
  };
};

/*
|--------------------------------------------------------------------------
| Compact Homepage Brand
|--------------------------------------------------------------------------
|
| Used only by BRAND_CAROUSEL.
|--------------------------------------------------------------------------
*/

const buildCompactHomepageBrand = (
  brand,
  apiBaseUrl
) => {
  if (!brand) {
    return null;
  }

  const row =
    toPlainObject(
      brand
    );

  const sourceAsset =
    row.logoAsset ||
    row.bannerAsset ||
    null;

  const logoAsset =
    buildCompactHomepageBrandMedia(
      sourceAsset,
      apiBaseUrl
    );

  return {
    id:
      row.id,

    name:
      row.name,

    code:
      row.code,

    slug:
      row.slug,

    brandUrl:
      `/brands/${row.slug}`,

    /*
     * Keep both properties for compatibility with the existing
     * BrandCarouselSection fallback logic.
     *
     * Both references point to the same compact object.
     */
    logoAsset,

    image:
      logoAsset,
  };
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
            buildCompactHomepageBrand(
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
|--------------------------------------------------------------------------
| Lightweight Variant Attribute Include
|--------------------------------------------------------------------------
|
| Used by storefront product-card queries so cards can expose a small
| variantSummary without loading full product-detail payloads.
|
| This remains part of the same Sequelize product query. It does not
| execute a separate query per product.
|--------------------------------------------------------------------------
*/

const getVariantAttributeSummaryInclude = ({
  companyId,
}) => ({
  model:
    db.ProductVariantAttributeValue,

  as:
    "attributeValues",

  required:
    false,

  separate:
    true,

  order: [
    ["sortOrder", "ASC"],
    ["createdAt", "ASC"],
  ],

  attributes: [
    "id",
    "productVariantId",
    "attributeId",
    "optionId",
    "displayValue",
    "sortOrder",
  ],

  include: [
    {
      model:
        db.Attribute,

      as:
        "attribute",

      required:
        false,

      where: {
        companyId,
        isActive:
          true,
      },

      attributes: [
        "id",
        "code",
        "name",
        "isVariantDefining",
        "displayOrder",
      ],
    },

    {
      model:
        db.AttributeOption,

      as:
        "option",

      required:
        false,

      where: {
        companyId,
        isActive:
          true,
      },

      attributes: [
        "id",
        "label",
        "value",
        "swatchValue",
        "displayOrder",
      ],
    },
  ],
});

/*
 * Fetch all products referenced by
 * FEATURED_PRODUCT_GRID sections.
 */
/*
|--------------------------------------------------------------------------
| Storefront Card Query Performance
|--------------------------------------------------------------------------
|
| Product-card hasMany relations use `separate: true`.
|
| This prevents Sequelize from creating a huge joined row-set across:
| images x media variants x product variants x prices x attributes.
|
| Sequelize performs a small number of bulk follow-up queries instead,
| then attaches the child rows back to their parent models.
|--------------------------------------------------------------------------
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

        separate:
          true,

        order: [
          ["priority", "ASC"],
          ["createdAt", "ASC"],
        ],

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

      getVariantAttributeSummaryInclude({
        companyId,
      }),
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

          separate:
      true,

    order: [
      ["displayOrder", "ASC"],
      ["createdAt", "ASC"],
    ],

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

                  separate:
                    true,

                  order: [
                    ["variantType", "ASC"],
                    ["createdAt", "ASC"],
                  ],

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

          separate:
            true,

          order: [
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],

          where: {
            companyId,
            status: "ACTIVE",
          },

          include:
            variantIncludes,
        },
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
|--------------------------------------------------------------------------
| Gift Voucher Pricing
|--------------------------------------------------------------------------
*/

const applyGiftVoucherToPrice = (
  price,
  giftVoucher
) => {
  if (!price) {
    return null;
  }

  const regularPrice =
    Number(
      price.regularPrice ||
      0
    );

  const baseSellingPrice =
    Number(
      price.sellingPrice ||
      0
    );

  const priceDiscountAmount =
    Math.max(
      0,
      regularPrice -
        baseSellingPrice
    );

  const giftVoucherDiscountAmount =
    giftVoucher
      ? Number(
          giftVoucher.unitDiscount ||
          0
        )
      : 0;

  const sellingPrice =
    Math.max(
      0,
      baseSellingPrice -
        giftVoucherDiscountAmount
    );

  const totalDiscountAmount =
    Math.max(
      0,
      regularPrice -
        sellingPrice
    );

  const totalDiscountPercent =
    regularPrice > 0
      ? (
          totalDiscountAmount /
          regularPrice
        ) *
        100
      : 0;

  return {
    ...price,

    regularPrice:
      Number(
        regularPrice.toFixed(
          4
        )
      ),

    baseSellingPrice:
      Number(
        baseSellingPrice.toFixed(
          4
        )
      ),

    priceDiscountAmount:
      Number(
        priceDiscountAmount.toFixed(
          4
        )
      ),

    giftVoucherDiscountAmount:
      Number(
        giftVoucherDiscountAmount.toFixed(
          4
        )
      ),

    sellingPrice:
      Number(
        sellingPrice.toFixed(
          4
        )
      ),

    totalDiscountAmount:
      Number(
        totalDiscountAmount.toFixed(
          4
        )
      ),

    totalDiscountPercent:
      Number(
        totalDiscountPercent.toFixed(
          4
        )
      ),

    giftVoucher:
      giftVoucher
        ? {
            promotionId:
              giftVoucher.id,

            code:
              giftVoucher.code,

            name:
              giftVoucher.name,

            discountType:
              giftVoucher.discountType,

            discountValue:
              giftVoucher.discountValue,

            discountAmount:
              Number(
                giftVoucherDiscountAmount.toFixed(
                  4
                )
              ),

            validFrom:
              giftVoucher.validFrom,

            validUntil:
              giftVoucher.validUntil,
          }
        : null,
  };
};

const applyGiftVoucherPricingToProducts =
  async ({
    companyId,
    channelCode,
    effectiveDate,
    products,
  }) => {
    if (
      !Array.isArray(products) ||
      !products.length
    ) {
      return products || [];
    }

    const items =
      products
        .filter(
          (product) =>
            product.defaultVariant?.id &&
            product.price?.sellingPrice !== null &&
            product.price?.sellingPrice !== undefined
        )
        .map(
          (product) => ({
            productId:
              product.id,

            productVariantId:
              product.defaultVariant.id,

            sellingPrice:
              product.price.sellingPrice,

            quantity:
              1,
          })
        );

    if (!items.length) {
      return products;
    }

    const promotionMap =
      await giftVoucherPromotionService
        .resolveApplicablePromotionsBatch({
          companyId,
          items,
          channelCode,
          effectiveDate,
        });

    return products.map(
      (product) => {
        if (
          !product.defaultVariant?.id ||
          !product.price
        ) {
          return product;
        }

        const key =
          `${product.id}:${product.defaultVariant.id}`;

        return {
          ...product,

          price:
            applyGiftVoucherToPrice(
              product.price,
              promotionMap.get(key) ||
                null
            ),
        };
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Build Lightweight Variant Summary
|--------------------------------------------------------------------------
|
| This is intentionally much smaller than the product-detail variant
| payload. Product cards only receive enough information to communicate
| that options exist and to render color swatches.
|
| Full variant selection, images, pricing, availability and combination
| validation remain inside the product-detail / Quick Add endpoint.
|--------------------------------------------------------------------------
*/

const buildVariantSummary = (
  product
) => {
  const variants =
    Array.isArray(
      product?.variants
    )
      ? product.variants
      : [];

  if (
    !variants.length
  ) {
    return {
      hasVariants:
        false,

      variantCount:
        0,

      selectorCount:
        0,

      selectors:
        [],
    };
  }

  const selectorMap =
    new Map();

  for (
    const variant of
    variants
  ) {
    const attributeValues =
      Array.isArray(
        variant.attributeValues
      )
        ? variant.attributeValues
        : [];

    for (
      const value of
      attributeValues
    ) {
      const attribute =
        value.attribute;

      /*
       * Only variant-defining attributes should be exposed
       * on the compact product-card summary.
       */
      if (
        !attribute ||
        attribute.isVariantDefining !==
          true
      ) {
        continue;
      }

      const attributeId =
        attribute.id ||
        value.attributeId;

      if (
        !attributeId
      ) {
        continue;
      }

      if (
        !selectorMap.has(
          attributeId
        )
      ) {
        selectorMap.set(
          attributeId,
          {
            id:
              attributeId,

            code:
              String(
                attribute.code ||
                  ""
              )
                .trim()
                .toUpperCase(),

            name:
              attribute.name ||
              "Option",

            displayOrder:
              Number(
                attribute.displayOrder ||
                  0
              ),

            optionsMap:
              new Map(),
          }
        );
      }

      const selector =
        selectorMap.get(
          attributeId
        );

      const option =
        value.option;

      const optionId =
        option?.id ||
        value.optionId ||
        value.displayValue ||
        null;

      if (
        !optionId ||
        selector.optionsMap.has(
          optionId
        )
      ) {
        continue;
      }

      selector.optionsMap.set(
        optionId,
        {
          id:
            optionId,

          label:
            option?.label ||
            value.displayValue ||
            option?.value ||
            "Option",

          value:
            option?.value ||
            value.displayValue ||
            null,

          swatchValue:
            option?.swatchValue ||
            null,

          displayOrder:
            Number(
              option?.displayOrder ||
                value.sortOrder ||
                0
            ),
        }
      );
    }
  }

  const selectors =
    Array.from(
      selectorMap.values()
    )
      .sort(
        (
          first,
          second
        ) =>
          first.displayOrder -
          second.displayOrder
      )
      .map(
        (
          selector
        ) => {
          const options =
            Array.from(
              selector.optionsMap
                .values()
            ).sort(
              (
                first,
                second
              ) =>
                first.displayOrder -
                second.displayOrder
            );

          const normalizedName =
            String(
              selector.name ||
                ""
            )
              .trim()
              .toLowerCase();

          const isColor =
            selector.code ===
              "COLOR" ||
            normalizedName ===
              "color" ||
            normalizedName ===
              "colour";

          return {
            id:
              selector.id,

            code:
              selector.code,

            name:
              selector.name,

            optionCount:
              options.length,

            /*
             * Color receives option-level data because the
             * storefront card renders visual swatches.
             *
             * Storage, RAM, Size, etc. return only counts.
             */
            options:
              isColor
                ? options.map(
                    (
                      option
                    ) => ({
                      id:
                        option.id,

                      label:
                        option.label,

                      swatchValue:
                        option.swatchValue,
                    })
                  )
                : [],
          };
        }
      );

  /*
   * Multiple technical variants without a variant-defining selector
   * should still behave like a simple product on the card.
   */
  const hasVariants =
    variants.length >
      1 &&
    selectors.length >
      0;

  return {
    hasVariants,

    variantCount:
      variants.length,

    selectorCount:
      selectors.length,

    selectors,
  };
};

/*
 * Convert a Product model into a storefront-safe
 * product-card response.
 */
const buildPublicProduct = (
  productModel,
  apiBaseUrl,
  availabilityByVariant
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



    delivery: {
      expressDeliveryEnabled:
        product.expressDeliveryEnabled ===
        true,

      expressDeliveryHours:
        product.expressDeliveryHours !==
          null &&
        product.expressDeliveryHours !==
          undefined
          ? Number(
              product.expressDeliveryHours
            )
          : null,

      deliveryMinDays:
        product.deliveryMinDays !==
          null &&
        product.deliveryMinDays !==
          undefined
          ? Number(
              product.deliveryMinDays
            )
          : null,

      deliveryMaxDays:
        product.deliveryMaxDays !==
          null &&
        product.deliveryMaxDays !==
          undefined
          ? Number(
              product.deliveryMaxDays
            )
          : null,

      deliveryNote:
        product.deliveryNote ||
        null,
    },

    isDirectDelivery:
      product.isDirectDelivery ===
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

    variantSummary:
      buildVariantSummary(
        product
      ),

    price: selectedPrice,


    availability:
  publicAvailabilityService
    .getAvailabilityForProduct({
      product,

      availabilityByVariant,
    }),

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

    const availabilityByVariant =
      await publicAvailabilityService
        .getVariantAvailabilityMap({
          companyId,

          products:
            productModels,
        });

    const featuredProducts =
      await applyGiftVoucherPricingToProducts({
        companyId,
        channelCode:
          channel,
        effectiveDate:
          now,

        products:
          productModels.map(
            (productModel) =>
              buildPublicProduct(
                productModel,
                apiBaseUrl,
                availabilityByVariant
              )
          ),
      });

    const productMap =
      new Map(
        featuredProducts.map(
          (product) => [
            product.id,
            product,
          ]
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
            publicAvailabilityService
              .filterAvailablePublicProducts(
                selectedProductIds
                  .map(
                    (
                      productId
                    ) =>
                      productMap.get(
                        productId
                      ) ||
                      null
                  )
                  .filter(
                    Boolean
                  )
              );

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
 * - COLLECTION
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

    separate:
      true,

    order: [
      ["displayOrder", "ASC"],
      ["createdAt", "ASC"],
    ],

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

            separate:
              true,

            order: [
              ["variantType", "ASC"],
              ["createdAt", "ASC"],
            ],

            where: {
              companyId,
              isActive: true,

              variantType: {
                [Op.in]: [
                  "MEDIUM",
                  "SMALL",
                  "THUMBNAIL",
                ],
              },
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

    separate:
      true,

    order: [
      ["sortOrder", "ASC"],
      ["createdAt", "ASC"],
    ],

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

        separate:
          true,

        order: [
          ["priority", "ASC"],
          ["createdAt", "ASC"],
        ],

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

      getVariantAttributeSummaryInclude({
        companyId,
      }),
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

    /*
    |--------------------------------------------------------------------------
    | Source-order preservation
    |--------------------------------------------------------------------------
    |
    | MANUAL and COLLECTION sources have an explicit order that must be
    | restored after Product.findAll(), because an IN (...) condition does
    | not guarantee the same order as the supplied IDs.
    |--------------------------------------------------------------------------
    */
    let orderedProductIds = [];

    if (
      sourceType ===
      "MANUAL"
    ) {
      orderedProductIds =
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

      if (
        !orderedProductIds.length
      ) {
        return [];
      }

      where.id = {
        [Op.in]:
          orderedProductIds,
      };
    } else if (
      sourceType ===
      "CATEGORY"
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
      sourceType ===
      "BRAND"
    ) {
      const brandId =
        typeof content.brandId ===
          "string"
          ? content.brandId.trim()
          : "";

      if (!brandId) {
        return [];
      }

      where.brandId =
        brandId;
    } else if (
      sourceType ===
      "COLLECTION"
    ) {
      const collectionId =
        typeof content.collectionId ===
          "string"
          ? content.collectionId.trim()
          : "";

      if (!collectionId) {
        return [];
      }

      /*
      |--------------------------------------------------------------------------
      | Collection validation
      |--------------------------------------------------------------------------
      |
      | Only use an active collection that is currently inside its publishing
      | window. This keeps page-builder sections from exposing an unpublished
      | or expired collection.
      |--------------------------------------------------------------------------
      */
      const collection =
        await db.Collection.findOne({
          where: {
            id:
              collectionId,

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

          attributes: [
            "id",
            "collectionType",
          ],

          raw:
            true,
        });

      if (!collection) {
        return [];
      }

      /*
      |--------------------------------------------------------------------------
      | Collection membership
      |--------------------------------------------------------------------------
      |
      | MANUAL collections use ProductCollection assignments directly.
      | SMART collections are also expected to have ProductCollection rows
      | after refreshSmartCollection(), so the storefront uses one consistent
      | membership source.
      |--------------------------------------------------------------------------
      */
      const assignments =
        await db.ProductCollection.findAll({
          where: {
            companyId,

            collectionId,
          },

          attributes: [
            "productId",
            "sortOrder",
          ],

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

          raw:
            true,
        });

      orderedProductIds =
        assignments
          .map(
            (assignment) =>
              assignment.productId
          )
          .filter(
            Boolean
          );

      if (
        !orderedProductIds.length
      ) {
        return [];
      }

      where.id = {
        [Op.in]:
          orderedProductIds,
      };
    } else if (
      sourceType ===
      "FEATURED"
    ) {
      where.isFeatured =
        true;
    } else if (
      sourceType ===
      "NEW_ARRIVALS"
    ) {
      order = [
        [
          "createdAt",
          "DESC",
        ],
      ];
    } else if (
      sourceType ===
      "BEST_SELLERS"
    ) {
      return [];
    } else {
      return [];
    }

    const preserveSourceOrder =
      sourceType ===
        "MANUAL" ||
      sourceType ===
        "COLLECTION";

    const products =
      await db.Product.findAll({
        where,

        include:
          getProductStorefrontIncludes({
            companyId,
            priceListId,
            now,
          }),

        order:
          order,

        /*
         * For ordered sources, fetch the complete selected set first and
         * apply the configured maximum only after restoring source order.
         */
        limit:
          preserveSourceOrder
            ? undefined
            : limit,

        distinct:
          true,
      });

    if (
      !preserveSourceOrder
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

    return orderedProductIds
      .map(
        (productId) =>
          productMap.get(
            productId
          ) ||
          null
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        limit
      );
  };

  const resolveProductCarouselSections =
  async ({
    sections,
    companyId,
    channel,
    apiBaseUrl,
    now,
  }) => {
    const allSections =
      sections || [];

    const carouselSections =
      allSections.filter(
        (section) =>
          String(
            section?.type?.code ||
              ""
          )
            .trim()
            .toUpperCase() ===
          "PRODUCT_CAROUSEL"
      );

    if (
      !carouselSections.length
    ) {
      return allSections;
    }

    /*
    |--------------------------------------------------------------------------
    | Storefront Price List
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Determine Whether All Homepage Carousels Are Manual
    |--------------------------------------------------------------------------
    |
    | Empty sourceType is treated as MANUAL by getProductCarouselSourceType().
    |--------------------------------------------------------------------------
    */

    const allManual =
      carouselSections.every(
        (section) => {
          const settings =
            section.settings &&
            typeof section.settings ===
              "object" &&
            !Array.isArray(
              section.settings
            )
              ? section.settings
              : {};

          return (
            getProductCarouselSourceType(
              settings
            ) ===
            "MANUAL"
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Fallback
    |--------------------------------------------------------------------------
    |
    | Keep the existing generic behaviour for CATEGORY / BRAND / COLLECTION /
    | FEATURED / NEW_ARRIVALS if those source types are used in future.
    |--------------------------------------------------------------------------
    */

    if (
      !allManual
    ) {
      const resolvedSections =
        [];

      for (
        const section of
        allSections
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

        const availabilityByVariant =
          await publicAvailabilityService
            .getVariantAvailabilityMap({
              companyId,

              products:
                productModels,
            });

        const baseProducts =
          publicAvailabilityService
            .filterAvailablePublicProducts(
              productModels.map(
                (
                  productModel
                ) =>
                  buildPublicProduct(
                    productModel,
                    apiBaseUrl,
                    availabilityByVariant
                  )
              )
            );

        const products =
          await applyGiftVoucherPricingToProducts({
            companyId,

            channelCode:
              channel,

            effectiveDate:
              now,

            products:
              baseProducts,
          });

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
    }

    /*
    |--------------------------------------------------------------------------
    | Collect Unique Manual Product IDs
    |--------------------------------------------------------------------------
    |
    | The current homepage contains:
    |
    | Hot Deals     = 13
    | New Arrivals  = 6
    | Bestsellers   = 13
    |
    | 32 positions / 30 unique products.
    |
    | Load the 30 unique products ONCE rather than executing the complete
    | storefront product graph independently for every carousel.
    |--------------------------------------------------------------------------
    */

    const uniqueProductIds =
      Array.from(
        new Set(
          carouselSections.flatMap(
            (section) => {
              const content =
                section.content &&
                typeof section.content ===
                  "object" &&
                !Array.isArray(
                  section.content
                )
                  ? section.content
                  : {};

              return Array.isArray(
                content.productIds
              )
                ? content.productIds
                    .filter(
                      (
                        productId
                      ) =>
                        typeof productId ===
                          "string" &&
                        productId.trim()
                    )
                    .map(
                      (
                        productId
                      ) =>
                        productId.trim()
                    )
                : [];
            }
          )
        )
      );

    /*
    |--------------------------------------------------------------------------
    | No Configured Products
    |--------------------------------------------------------------------------
    */

    if (
      !uniqueProductIds.length
    ) {
      return allSections.map(
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
            "PRODUCT_CAROUSEL"
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

          return {
            ...section,

            content: {
              ...content,

              productIdsResolved:
                [],

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
    }

    /*
    |--------------------------------------------------------------------------
    | One Product Graph Query
    |--------------------------------------------------------------------------
    */

    const productModels =
      await db.Product.findAll({
        where: {
          id: {
            [Op.in]:
              uniqueProductIds,
          },

          companyId,

          status:
            "ACTIVE",

          isSearchable:
            true,
        },

        include:
          getProductStorefrontIncludes({
            companyId,

            priceListId:
              priceList?.id ||
              null,

            now,
          }),

        distinct:
          true,
      });

    /*
    |--------------------------------------------------------------------------
    | One Availability Resolution
    |--------------------------------------------------------------------------
    */

    const availabilityByVariant =
      await publicAvailabilityService
        .getVariantAvailabilityMap({
          companyId,

          products:
            productModels,
        });

    /*
    |--------------------------------------------------------------------------
    | Build Public Products Once
    |--------------------------------------------------------------------------
    */

    const publicProducts =
      productModels.map(
        (
          productModel
        ) =>
          buildPublicProduct(
            productModel,
            apiBaseUrl,
            availabilityByVariant
          )
      );

    /*
    |--------------------------------------------------------------------------
    | Availability Filtering Once
    |--------------------------------------------------------------------------
    */

    const availableProducts =
      publicAvailabilityService
        .filterAvailablePublicProducts(
          publicProducts
        );

    /*
    |--------------------------------------------------------------------------
    | Gift Voucher Pricing Once
    |--------------------------------------------------------------------------
    */

    const pricedProducts =
      await applyGiftVoucherPricingToProducts({
        companyId,

        channelCode:
          channel,

        effectiveDate:
          now,

        products:
          availableProducts,
      });

    /*
    |--------------------------------------------------------------------------
    | Product Map
    |--------------------------------------------------------------------------
    */

    const productMap =
      new Map(
        pricedProducts.map(
          (
            product
          ) => [
            String(
              product.id
            ),

            product,
          ]
        )
      );

    /*
    |--------------------------------------------------------------------------
    | Rebuild Each Carousel
    |--------------------------------------------------------------------------
    |
    | Preserve:
    |
    | - CMS product order
    | - each carousel's maximumProducts
    | - existing public product shape
    |--------------------------------------------------------------------------
    */

    return allSections.map(
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
          "PRODUCT_CAROUSEL"
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

        const settings =
          section.settings &&
          typeof section.settings ===
            "object" &&
          !Array.isArray(
            section.settings
          )
            ? section.settings
            : {};

        const limit =
          getProductCarouselLimit(
            settings
          );

        const configuredIds =
          Array.isArray(
            content.productIds
          )
            ? content.productIds
                .filter(
                  (
                    productId
                  ) =>
                    typeof productId ===
                      "string" &&
                    productId.trim()
                )
                .map(
                  (
                    productId
                  ) =>
                    productId.trim()
                )
            : [];

        const products =
          configuredIds
            .map(
              (
                productId
              ) =>
                productMap.get(
                  productId
                ) ||
                null
            )
            .filter(
              Boolean
            )
            .slice(
              0,
              limit
            );

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
 * Flash Deals
 * -------------------------------------------------------
 * Supports:
 * - MANUAL
 * - CATEGORY
 * - BRAND
 * - COLLECTION
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

      const availabilityByVariant =
        await publicAvailabilityService
          .getVariantAvailabilityMap({
            companyId,

            products:
              productModels,
          });

      const baseProducts =
        publicAvailabilityService
          .filterAvailablePublicProducts(
            productModels.map(
              (productModel) =>
                buildPublicProduct(
                  productModel,
                  apiBaseUrl,
                  availabilityByVariant
                )
            )
          );

      const products =
        await applyGiftVoucherPricingToProducts({
          companyId,
          channelCode:
            channel,
          effectiveDate:
            now,
          products:
            baseProducts,
        });

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
 *
 * IMPORTANT PERFORMANCE DESIGN
 *
 * Do NOT load the complete pre-booking hierarchy using one
 * Sequelize include tree.
 *
 * The previous implementation joined:
 *
 * Campaign
 *   -> CampaignProducts[]
 *      -> Product
 *      -> Allocations[]
 *      -> Bundles[]
 *         -> ProtectionScheme
 *         -> Items[]
 *         -> Allocations[]
 *
 * That creates a Cartesian multiplication of hasMany rows.
 *
 * This implementation deliberately loads each collection in
 * small independent queries and combines the result using Maps.
 */
const resolvePreBookingSections =
  async ({
    sections,
    companyId,
    channel,
    apiBaseUrl,
    now,
  }) => {
    const sourceSections =
      Array.isArray(
        sections
      )
        ? sections
        : [];

    /*
    |--------------------------------------------------------------------------
    | Nothing To Resolve
    |--------------------------------------------------------------------------
    */

    const hasPreBooking =
      sourceSections.some(
        (
          section
        ) =>
          String(
            section?.type
              ?.code ||
              ""
          )
            .trim()
            .toUpperCase() ===
          "PRE_BOOKING"
      );

    if (
      !hasPreBooking
    ) {
      return sourceSections;
    }

    /*
    |--------------------------------------------------------------------------
    | Storefront Price List
    |--------------------------------------------------------------------------
    */

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

    const resolvedPriceList =
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
        : null;

    /*
    |--------------------------------------------------------------------------
    | Build Unavailable Section
    |--------------------------------------------------------------------------
    */

    const buildUnavailableSection =
      (
        section,
        content
      ) => ({
        ...section,

        content: {
          ...content,

          bookingStatus:
            "UNAVAILABLE",

          bookingStartAt:
            null,

          bookingEndAt:
            null,

          campaignResolved:
            null,

          productIdsResolved:
            [],

          resolvedPriceList,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Group Helper
    |--------------------------------------------------------------------------
    */

    const groupRows =
      (
        rows,
        fieldName
      ) => {
        const map =
          new Map();

        for (
          const row of
          rows || []
        ) {
          const plain =
            toPlainObject(
              row
            );

          const key =
            plain?.[
              fieldName
            ];

          if (!key) {
            continue;
          }

          const normalizedKey =
            String(
              key
            );

          if (
            !map.has(
              normalizedKey
            )
          ) {
            map.set(
              normalizedKey,
              []
            );
          }

          map
            .get(
              normalizedKey
            )
            .push(
              plain
            );
        }

        return map;
      };

    /*
    |--------------------------------------------------------------------------
    | Resolve Sections
    |--------------------------------------------------------------------------
    */

    const resolvedSections =
      [];

    for (
      const section of
      sourceSections
    ) {
      const sectionTypeCode =
        String(
          section?.type
            ?.code ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        sectionTypeCode !==
        "PRE_BOOKING"
      ) {
        resolvedSections.push(
          section
        );

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | CMS Content / Settings
      |--------------------------------------------------------------------------
      */

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

      const campaignId =
        String(
          content.campaignId ||
            ""
        ).trim();

      if (
        !campaignId
      ) {
        resolvedSections.push(
          buildUnavailableSection(
            section,
            content
          )
        );

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | 1. Campaign Master Only
      |--------------------------------------------------------------------------
      |
      | No includes here.
      |--------------------------------------------------------------------------
      */

      const campaignModel =
        await db.PreBookingCampaign.findOne(
          {
            where: {
              id:
                campaignId,

              companyId,

              isActive:
                true,
            },
          }
        );

      if (
        !campaignModel
      ) {
        resolvedSections.push(
          buildUnavailableSection(
            section,
            content
          )
        );

        continue;
      }

      const campaign =
        toPlainObject(
          campaignModel
        );

      /*
      |--------------------------------------------------------------------------
      | Campaign Booking Window
      |--------------------------------------------------------------------------
      */

      const startAt =
        campaign.bookingStartAt
          ? new Date(
              campaign.bookingStartAt
            )
          : null;

      const endAt =
        campaign.bookingEndAt
          ? new Date(
              campaign.bookingEndAt
            )
          : null;

      const validStart =
        Boolean(
          startAt
        ) &&
        !Number.isNaN(
          startAt.getTime()
        );

      const validEnd =
        Boolean(
          endAt
        ) &&
        !Number.isNaN(
          endAt.getTime()
        );

      /*
      |--------------------------------------------------------------------------
      | Effective Booking Status
      |--------------------------------------------------------------------------
      */

      let bookingStatus =
        "ACTIVE";

      if (
        validStart &&
        startAt.getTime() >
          now.getTime()
      ) {
        bookingStatus =
          "UPCOMING";
      }

      if (
        validEnd &&
        endAt.getTime() <=
          now.getTime()
      ) {
        bookingStatus =
          "CLOSED";
      }

      const campaignStatus =
        String(
          campaign.status ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        [
          "CLOSED",
          "ARCHIVED",
          "INACTIVE",
        ].includes(
          campaignStatus
        )
      ) {
        bookingStatus =
          "CLOSED";
      }

      if (
        [
          "DRAFT",
          "PAUSED",
        ].includes(
          campaignStatus
        )
      ) {
        bookingStatus =
          "UPCOMING";
      }

      /*
      |--------------------------------------------------------------------------
      | Homepage Product Limit
      |--------------------------------------------------------------------------
      */

      const requestedMaximum =
        Number(
          settings.maximumProducts ||
            8
        );

      const maximumProducts =
        Math.min(
          24,
          Math.max(
            1,
            Number.isFinite(
              requestedMaximum
            )
              ? Math.floor(
                  requestedMaximum
                )
              : 8
          )
        );

      /*
      |--------------------------------------------------------------------------
      | 2. Lightweight Campaign Product Assignments
      |--------------------------------------------------------------------------
      |
      | Load all active assignments so campaign productCount stays accurate.
      |
      | No catalogue Product include.
      | No bundles.
      | No allocations.
      |--------------------------------------------------------------------------
      */

      const campaignProductModels =
        await db.PreBookingCampaignProduct.findAll(
          {
            where: {
              companyId,

              campaignId:
                campaign.id,

              isActive:
                true,
            },

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
          }
        );

      const allCampaignProducts =
        campaignProductModels.map(
          (
            campaignProduct
          ) =>
            toPlainObject(
              campaignProduct
            )
        );

      /*
       * Only these assignments need the heavy storefront
       * product-card information on the homepage.
       */
      const selectedCampaignProducts =
        allCampaignProducts.slice(
          0,
          maximumProducts
        );

      const selectedCampaignProductIds =
        selectedCampaignProducts
          .map(
            (
              campaignProduct
            ) =>
              campaignProduct.id
          )
          .filter(
            Boolean
          );

      const selectedProductIds =
        selectedCampaignProducts
          .map(
            (
              campaignProduct
            ) =>
              campaignProduct.productId
          )
          .filter(
            Boolean
          );

      /*
      |--------------------------------------------------------------------------
      | Empty Campaign
      |--------------------------------------------------------------------------
      */

      if (
        !selectedProductIds.length
      ) {
        const campaignUrl =
          campaign.slug
            ? `/pre-booking/${campaign.slug}`
            : "/pre-booking";

        const configuredButtonUrl =
          String(
            content.buttonUrl ||
              ""
          ).trim();

        resolvedSections.push({
          ...section,

          content: {
            ...content,

            bookingStatus,

            bookingStartAt:
              validStart
                ? startAt.toISOString()
                : null,

            bookingEndAt:
              validEnd
                ? endAt.toISOString()
                : null,

            buttonUrl:
              configuredButtonUrl ||
              campaignUrl,

            campaignResolved: {
              id:
                campaign.id,

              code:
                campaign.code,

              name:
                campaign.name,

              slug:
                campaign.slug,

              description:
                campaign.description ||
                null,

              status:
                campaign.status,

              bookingStatus,

              bookingStartAt:
                validStart
                  ? startAt.toISOString()
                  : null,

              bookingEndAt:
                validEnd
                  ? endAt.toISOString()
                  : null,

              paymentPolicy:
                campaign.paymentPolicy ||
                "FULL_PREPAID",

              allowCard:
                campaign.allowCard ===
                true,

              allowTabby:
                campaign.allowTabby ===
                true,

              allowTamara:
                campaign.allowTamara ===
                true,

              allowCoupons:
                campaign.allowCoupons ===
                true,

              allowGiftVouchers:
                campaign.allowGiftVouchers ===
                true,

              checkoutSessionMinutes:
                campaign.checkoutSessionMinutes ??
                null,

              campaignUrl,

              productCount:
                allCampaignProducts.length,
            },

            productIdsResolved:
              [],

            resolvedPriceList,
          },
        });

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | 3. Full Storefront Product Cards
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | Pass ONLY the homepage-limited product IDs.
      |
      | findProductCarouselProducts() is already optimized using
      | separate:true for hasMany storefront relationships.
      |--------------------------------------------------------------------------
      */

      const productModels =
        await findProductCarouselProducts(
          {
            companyId,

            content: {
              productIds:
                selectedProductIds,
            },

            settings: {
              sourceType:
                "MANUAL",

              maximumProducts:
                selectedProductIds.length,
            },

            priceListId:
              priceList?.id ||
              null,

            now,
          }
        );

      /*
      |--------------------------------------------------------------------------
      | Storefront Inventory Availability
      |--------------------------------------------------------------------------
      */

      const availabilityByVariant =
        await publicAvailabilityService
          .getVariantAvailabilityMap({
            companyId,

            products:
              productModels,
          });

      /*
      |--------------------------------------------------------------------------
      | 4. Direct Allocations
      |--------------------------------------------------------------------------
      |
      | One hasMany table only.
      | Variant is belongsTo and therefore safe to include.
      |--------------------------------------------------------------------------
      */

      const directAllocationModels =
        selectedCampaignProductIds.length
          ? await db.PreBookingAllocation.findAll(
              {
                where: {
                  companyId,

                  campaignProductId: {
                    [Op.in]:
                      selectedCampaignProductIds,
                  },

                  bundleId:
                    null,

                  isActive:
                    true,
                },

                include: [
                  {
                    model:
                      db.ProductVariant,

                    as:
                      "variant",

                    required:
                      false,

                    attributes: [
                      "id",
                      "productId",
                      "sku",
                      "name",
                      "isDefault",
                      "status",
                    ],
                  },
                ],

                order: [
                  [
                    "campaignProductId",
                    "ASC",
                  ],
                  [
                    "sortOrder",
                    "ASC",
                  ],
                  [
                    "createdAt",
                    "ASC",
                  ],
                ],
              }
            )
          : [];

      /*
      |--------------------------------------------------------------------------
      | 4B. Variant-Specific Images For Pre-Booking Cards
      |--------------------------------------------------------------------------
      |
      | Product carousel queries already load variants, prices and attributes.
      | For PRE_BOOKING only, load images assigned directly to those variants.
      |--------------------------------------------------------------------------
      */

      /*
      | Homepage: only variants with active direct allocation and stock
      */
      const preBookingVariantIds =
        Array.from(
          new Set(
            directAllocationModels
              .map(row => toPlainObject(row))
              .filter(allocation => {
                const availableQuantity =
                  Math.max(
                    0,
                    Number(allocation.allocationQuantity || 0) -
                    Number(allocation.reservedQuantity || 0) -
                    Number(allocation.confirmedQuantity || 0)
                  );

                return Boolean(allocation.productVariantId) &&
                  availableQuantity > 0;
              })
              .map(allocation => String(allocation.productVariantId))
          )
        );

      const preBookingVariantImageModels =
        preBookingVariantIds.length
          ? await db.ProductImage.findAll({
              where: {
                companyId,
                variantId: {
                  [Op.in]: preBookingVariantIds,
                },
                isActive: true,
              },
              include: [
                {
                  model:
                    db.MediaAsset,
              
                  as:
                    "mediaAsset",
              
                  required:
                    true,
              
                  where: {
                    companyId,
              
                    status:
                      "READY",
              
                    isPublic:
                      true,
              
                    isActive:
                      true,
                  },
              
                  attributes: [
                    "id",
                    "publicUrl",
                    "altText",
                    "title",
                  ],
              
                  include: [
                    {
                      model:
                        db.MediaAssetVariant,
              
                      as:
                        "variants",
              
                      required:
                        false,
              
                      separate:
                        true,
              
                      attributes: [
                        "id",
                        "variantType",
                        "format",
                        "mimeType",
                        "width",
                        "height",
                        "fileSize",
                        "publicUrl",
                        "isPrimary",
                        "isActive",
                      ],
              
                      where: {
                        companyId,
              
                        isActive:
                          true,
              
                        variantType: {
                          [Op.in]: [
                            "MEDIUM",
                            "SMALL",
                            "THUMBNAIL",
                          ],
                        },
                      },
              
                      order: [
                        [
                          "variantType",
                          "ASC",
                        ],
                        [
                          "createdAt",
                          "ASC",
                        ],
                      ],
                    },
                  ],
                },
              ],
              order: [
                ["variantId", "ASC"],
                ["displayOrder", "ASC"],
                ["createdAt", "ASC"],
              ],
            })
          : [];

      const preBookingVariantImagesByVariantId =
        new Map();

      for (const imageModel of preBookingVariantImageModels) {
        const image = toPlainObject(imageModel);
        const variantKey = String(image.variantId || "");

        if (!variantKey || !image.mediaAsset) continue;

        /*
         * Only the first ordered image is required for a homepage card.
         */
        if (preBookingVariantImagesByVariantId.has(variantKey)) continue;

        const mediaAsset =
  image.mediaAsset;

const normalizedMediaAsset =
  buildPublicMediaAsset(
    mediaAsset,
    apiBaseUrl
  );

preBookingVariantImagesByVariantId.set(
  variantKey,
  [
    {
      id:
        image.id,

      imageRole:
        image.imageRole ||
        null,

      altText:
        image.altText ||
        mediaAsset.altText ||
        null,

      title:
        image.title ||
        mediaAsset.title ||
        null,

        mediaAsset: {
          id:
            normalizedMediaAsset
              ?.id ||
            mediaAsset.id,
        
          publicUrl:
            normalizedMediaAsset
              ?.publicUrl ||
            null,
        
          /*
          |--------------------------------------------------------------------------
          | Optimized Homepage Variants
          |--------------------------------------------------------------------------
          |
          | Only MEDIUM / SMALL / THUMBNAIL were loaded above.
          |
          | This keeps the homepage response lean while allowing
          | PreBookingProductCard to avoid downloading original
          | product images.
          |--------------------------------------------------------------------------
          */
        
          variants:
            normalizedMediaAsset
              ?.variants ||
            [],
        
          altText:
            normalizedMediaAsset
              ?.altText ||
            mediaAsset.altText ||
            null,
        
          title:
            normalizedMediaAsset
              ?.title ||
            mediaAsset.title ||
            null,
        },
    },
  ]
);
      }

      /*
      |--------------------------------------------------------------------------
      | 5. Bundles
      |--------------------------------------------------------------------------
      |
      | ProtectionScheme is belongsTo, not hasMany, so this remains safe.
      |--------------------------------------------------------------------------
      */

      const bundleModels =
        selectedCampaignProductIds.length
          ? await db.PreBookingBundle.findAll(
              {
                where: {
                  companyId,

                  campaignProductId: {
                    [Op.in]:
                      selectedCampaignProductIds,
                  },

                  isActive:
                    true,
                },

                include: [
                  {
                    model:
                      db.ProtectionScheme,

                    as:
                      "protectionScheme",

                    required:
                      false,

                    where: {
                      companyId,

                      isActive:
                        true,
                    },
                  },
                ],

                order: [
                  [
                    "campaignProductId",
                    "ASC",
                  ],
                  [
                    "sortOrder",
                    "ASC",
                  ],
                  [
                    "createdAt",
                    "ASC",
                  ],
                ],
              }
            )
          : [];

      const bundles =
        bundleModels.map(
          (
            bundle
          ) =>
            toPlainObject(
              bundle
            )
        );

      const bundleIds =
        bundles
          .map(
            (
              bundle
            ) =>
              bundle.id
          )
          .filter(
            Boolean
          );

      /*
      |--------------------------------------------------------------------------
      | 6. Bundle Items + Bundle Allocations
      |--------------------------------------------------------------------------
      |
      | These run as independent queries.
      |
      | No bundle × item × allocation multiplication can occur.
      |--------------------------------------------------------------------------
      */

      let bundleItemModels =
        [];

      let bundleAllocationModels =
        [];

      if (
        bundleIds.length
      ) {
        [
          bundleItemModels,
          bundleAllocationModels,
        ] =
          await Promise.all([
            /*
            |--------------------------------------------------------------------------
            | Bundle Items
            |--------------------------------------------------------------------------
            */

            db.PreBookingBundleItem.findAll(
              {
                where: {
                  companyId,

                  bundleId: {
                    [Op.in]:
                      bundleIds,
                  },

                  isActive:
                    true,
                },

                include: [
                  {
                    model:
                      db.Product,

                    as:
                      "product",

                    required:
                      false,

                    attributes: [
                      "id",
                      "name",
                      "slug",
                      "parentSku",
                      "status",
                    ],
                  },

                  {
                    model:
                      db.ProductVariant,

                    as:
                      "variant",

                    required:
                      false,

                    attributes: [
                      "id",
                      "productId",
                      "sku",
                      "name",
                      "isDefault",
                      "status",
                    ],
                  },
                ],

                order: [
                  [
                    "bundleId",
                    "ASC",
                  ],
                  [
                    "sortOrder",
                    "ASC",
                  ],
                  [
                    "createdAt",
                    "ASC",
                  ],
                ],
              }
            ),

            /*
            |--------------------------------------------------------------------------
            | Bundle Allocations
            |--------------------------------------------------------------------------
            */

            db.PreBookingAllocation.findAll(
              {
                where: {
                  companyId,

                  bundleId: {
                    [Op.in]:
                      bundleIds,
                  },

                  isActive:
                    true,
                },

                include: [
                  {
                    model:
                      db.ProductVariant,

                    as:
                      "variant",

                    required:
                      false,

                    attributes: [
                      "id",
                      "productId",
                      "sku",
                      "name",
                      "isDefault",
                      "status",
                    ],
                  },
                ],

                order: [
                  [
                    "bundleId",
                    "ASC",
                  ],
                  [
                    "sortOrder",
                    "ASC",
                  ],
                  [
                    "createdAt",
                    "ASC",
                  ],
                ],
              }
            ),
          ]);
      }

      /*
      |--------------------------------------------------------------------------
      | Build Lookup Maps
      |--------------------------------------------------------------------------
      */

      const directAllocationsByCampaignProductId =
        groupRows(
          directAllocationModels,
          "campaignProductId"
        );

      const bundlesByCampaignProductId =
        groupRows(
          bundles,
          "campaignProductId"
        );

      const bundleItemsByBundleId =
        groupRows(
          bundleItemModels,
          "bundleId"
        );

      const bundleAllocationsByBundleId =
        groupRows(
          bundleAllocationModels,
          "bundleId"
        );

      /*
      |--------------------------------------------------------------------------
      | Campaign Product Lookups
      |--------------------------------------------------------------------------
      */

      const campaignProductByProductId =
        new Map(
          selectedCampaignProducts.map(
            (
              campaignProduct
            ) => [
              String(
                campaignProduct.productId
              ),

              campaignProduct,
            ]
          )
        );

      const campaignProductOrder =
        new Map(
          selectedCampaignProducts.map(
            (
              campaignProduct,
              index
            ) => [
              String(
                campaignProduct.productId
              ),

              Number(
                campaignProduct.sortOrder ??
                  index
              ),
            ]
          )
        );

      /*
      |--------------------------------------------------------------------------
      | Build Public Products
      |--------------------------------------------------------------------------
      */

      const baseProducts =
        productModels
          .map(
            (
              productModel
            ) => {
              const publicProduct =
                buildPublicProduct(
                  productModel,
                  apiBaseUrl,
                  availabilityByVariant
                );

              const campaignProduct =
                campaignProductByProductId.get(
                  String(
                    publicProduct.id
                  )
                );

              if (
                !campaignProduct
              ) {
                return null;
              }

              /*
              |--------------------------------------------------------------------------
              | Product Price Override
              |--------------------------------------------------------------------------
              */

              const parsedPriceOverride =
                campaignProduct.priceOverride !==
                  null &&
                campaignProduct.priceOverride !==
                  undefined
                  ? Number(
                      campaignProduct.priceOverride
                    )
                  : null;

              const hasPriceOverride =
                Number.isFinite(
                  parsedPriceOverride
                ) &&
                parsedPriceOverride >=
                  0;

              const resolvedPrice =
                publicProduct.price
                  ? {
                      ...publicProduct.price,
                    }
                  : null;

              if (
                resolvedPrice &&
                hasPriceOverride
              ) {
                resolvedPrice.sellingPrice =
                  parsedPriceOverride;
              }

              /*
              |--------------------------------------------------------------------------
              | Direct Allocations
              |--------------------------------------------------------------------------
              */

              const directAllocations =
                directAllocationsByCampaignProductId.get(
                  String(
                    campaignProduct.id
                  )
                ) || [];

              /*
              |--------------------------------------------------------------------------
              | Public Pre-Booking Variants
              |--------------------------------------------------------------------------
              |
              | Expose the full variant card payload only inside PRE_BOOKING.
              | The normal PRODUCT_CAROUSEL response remains unchanged.
              |--------------------------------------------------------------------------
              */

              const productPlain =
                toPlainObject(
                  productModel
                );

              const productVariants =
                Array.isArray(
                  productPlain.variants
                )
                  ? productPlain.variants
                  : [];

              const directAllocationPlain =
                directAllocations.map(
                  (
                    allocation
                  ) =>
                    toPlainObject(
                      allocation
                    )
                );

              const preBookingPublicVariants =
                productVariants.flatMap(
                  variant => {
                    const variantAllocations =
                      directAllocationPlain.filter(
                        allocation =>
                          String(
                            allocation.productVariantId ||
                            allocation.variant?.id ||
                            ""
                          ) === String(variant.id)
                      );

                    if (!variantAllocations.length) return [];

                    const allocationQuantity =
                      variantAllocations.reduce(
                        (total, allocation) =>
                          total + Number(allocation.allocationQuantity || 0),
                        0
                      );

                    const reservedQuantity =
                      variantAllocations.reduce(
                        (total, allocation) =>
                          total + Number(allocation.reservedQuantity || 0),
                        0
                      );

                    const confirmedQuantity =
                      variantAllocations.reduce(
                        (total, allocation) =>
                          total + Number(allocation.confirmedQuantity || 0),
                        0
                      );

                    const availableQuantity =
                      Math.max(
                        0,
                        allocationQuantity -
                        reservedQuantity -
                        confirmedQuantity
                      );

                    if (availableQuantity <= 0) return [];

                    const attributeValues =
                      Array.isArray(variant.attributeValues)
                        ? variant.attributeValues
                        : [];

                    return [
                      {
                        id: variant.id,
                        sku: variant.sku,
                        barcode: variant.barcode || null,
                        name: variant.name,
                        isDefault: variant.isDefault === true,
                        sortOrder: Number(variant.sortOrder || 0),

                        attributes:
                          attributeValues.map(
                            value => ({
                              id: value.id,
                              attributeId: value.attributeId,
                              optionId: value.optionId || null,
                              code: value.attribute?.code || null,
                              name: value.attribute?.name || null,
                              displayOrder: Number(
                                value.attribute?.displayOrder ||
                                value.sortOrder ||
                                0
                              ),
                              value:
                                value.option?.value ||
                                value.displayValue ||
                                null,
                              label:
                                value.option?.label ||
                                value.displayValue ||
                                null,
                              swatchValue:
                                value.option?.swatchValue ||
                                null,
                            })
                          ),

                        images:
                          preBookingVariantImagesByVariantId.get(
                            String(variant.id)
                          ) || [],

                        price:
                          getPublicVariantPrice(variant),

                        allocationSummary: {
                          hasAllocation: true,
                          availableQuantity,
                          isAvailable: true,
                        },
                      },
                    ];
                  }
                );

              /*
              |--------------------------------------------------------------------------
              | Bundles
              |--------------------------------------------------------------------------
              */

              const productBundles =
                (
                  bundlesByCampaignProductId.get(
                    String(
                      campaignProduct.id
                    )
                  ) || []
                ).map(
                  (
                    bundle
                  ) => ({
                    id:
                      bundle.id,

                    campaignProductId:
                      bundle.campaignProductId,

                    code:
                      bundle.code,

                    name:
                      bundle.name,

                    description:
                      bundle.description ||
                      null,

                    priceMode:
                      bundle.priceMode,

                    priceAmount:
                      bundle.priceAmount,

                    currencyCode:
                      bundle.currencyCode,

                    protectionSchemeId:
                      bundle.protectionSchemeId ||
                      null,

                    protectionIncluded:
                      bundle.protectionIncluded ===
                      true,

                    badgeText:
                      bundle.badgeText ||
                      null,

                    isDefault:
                      bundle.isDefault ===
                      true,

                    isActive:
                      bundle.isActive ===
                      true,

                    sortOrder:
                      Number(
                        bundle.sortOrder ||
                          0
                      ),

                    protectionScheme:
                      bundle.protectionScheme ||
                      null,

                    items:
                      bundleItemsByBundleId.get(
                        String(
                          bundle.id
                        )
                      ) || [],

                    allocations:
                      bundleAllocationsByBundleId.get(
                        String(
                          bundle.id
                        )
                      ) || [],
                  })
                );

              /*
              |--------------------------------------------------------------------------
              | Public Product Response
              |--------------------------------------------------------------------------
              */

              return {
                ...publicProduct,

                name:
                  campaignProduct.displayTitle ||
                  publicProduct.name,

                price:
                  resolvedPrice,

                /*
                 * Full variants are intentionally exposed only for the
                 * PRE_BOOKING CMS section so the storefront can render one
                 * card per available Color + Storage combination.
                 */
                variants:
                  preBookingPublicVariants,

                preBooking: {
                  /*
                   * Current business rule:
                   * pre-booking is full prepaid.
                   */
                  bookingType:
                    "FULL_PAYMENT",

                  campaignId:
                    campaign.id,

                  campaignProductId:
                    campaignProduct.id,

                  campaignSlug:
                    campaign.slug,

                  campaignCode:
                    campaign.code,

                  campaignName:
                    campaign.name,

                  badgeText:
                    campaignProduct.badgeText ||
                    null,

                  shortDescription:
                    campaignProduct.shortDescription ||
                    null,

                  minimumQuantity:
                    Number(
                      campaignProduct.minimumQuantity ||
                        1
                    ),

                  maximumQuantityPerOrder:
                    Number(
                      campaignProduct.maximumQuantityPerOrder ||
                        1
                    ),

                  depositAmount:
                    null,

                  fullBookingPrice:
                    hasPriceOverride
                      ? parsedPriceOverride
                      : resolvedPrice
                          ?.sellingPrice ??
                        null,

                  bookingStartAt:
                    validStart
                      ? startAt.toISOString()
                      : null,

                  bookingEndAt:
                    validEnd
                      ? endAt.toISOString()
                      : null,

                  expectedLaunchAt:
                    null,

                  expectedDeliveryFrom:
                    null,

                  expectedDeliveryUntil:
                    null,

                  allowWaitlist:
                    false,

                  status:
                    bookingStatus,

                  hasDirectAllocation:
                    directAllocations.length >
                    0,

                  hasBundles:
                    productBundles.length >
                    0,

                  allocations:
                    directAllocations,

                  bundles:
                    productBundles,
                },
              };
            }
          )
          .filter(
            Boolean
          );

      /*
      |--------------------------------------------------------------------------
      | Preserve Campaign Sort Order
      |--------------------------------------------------------------------------
      */

      baseProducts.sort(
        (
          first,
          second
        ) => {
          const firstOrder =
            campaignProductOrder.get(
              String(
                first.id
              )
            ) ??
            0;

          const secondOrder =
            campaignProductOrder.get(
              String(
                second.id
              )
            ) ??
            0;

          return (
            firstOrder -
            secondOrder
          );
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Promotion / Gift Voucher Pricing
      |--------------------------------------------------------------------------
      */

      const products =
        await applyGiftVoucherPricingToProducts(
          {
            companyId,

            channelCode:
              channel,

            effectiveDate:
              now,

            products:
              baseProducts,
          }
        );

      /*
      |--------------------------------------------------------------------------
      | Campaign URL
      |--------------------------------------------------------------------------
      */

      const campaignUrl =
        campaign.slug
          ? `/pre-booking/${campaign.slug}`
          : "/pre-booking";

      const configuredButtonUrl =
        String(
          content.buttonUrl ||
            ""
        ).trim();

      /*
      |--------------------------------------------------------------------------
      | Public Campaign Summary
      |--------------------------------------------------------------------------
      */

      const campaignResolved =
        {
          id:
            campaign.id,

          code:
            campaign.code,

          name:
            campaign.name,

          slug:
            campaign.slug,

          description:
            campaign.description ||
            null,

          status:
            campaign.status,

          bookingStatus,

          bookingStartAt:
            validStart
              ? startAt.toISOString()
              : null,

          bookingEndAt:
            validEnd
              ? endAt.toISOString()
              : null,

          paymentPolicy:
            campaign.paymentPolicy ||
            "FULL_PREPAID",

          allowCard:
            campaign.allowCard ===
            true,

          allowTabby:
            campaign.allowTabby ===
            true,

          allowTamara:
            campaign.allowTamara ===
            true,

          allowCoupons:
            campaign.allowCoupons ===
            true,

          allowGiftVouchers:
            campaign.allowGiftVouchers ===
            true,

          checkoutSessionMinutes:
            campaign.checkoutSessionMinutes ??
            null,

          campaignUrl,

          /*
           * Number of active campaign assignments,
           * not merely homepage-visible products.
           */
          productCount:
            allCampaignProducts.length,
        };

      /*
      |--------------------------------------------------------------------------
      | Final CMS Section
      |--------------------------------------------------------------------------
      */

      resolvedSections.push({
        ...section,

        content: {
          ...content,

          bookingStatus,

          bookingStartAt:
            validStart
              ? startAt.toISOString()
              : null,

          bookingEndAt:
            validEnd
              ? endAt.toISOString()
              : null,

          buttonUrl:
            configuredButtonUrl ||
            campaignUrl,

          campaignResolved,

          productIdsResolved:
            products,

          resolvedPriceList,
        },
      });
    }

    return resolvedSections;
  };

/*
|--------------------------------------------------------------------------
| Featured Grid View All Resolver
|--------------------------------------------------------------------------
*/

const resolveFeaturedGridViewAllLinks =
  async ({
    sections,
    companyId,
  }) => {
    const categoryIds =
      new Set();

    const brandIds =
      new Set();

    const collectionIds =
      new Set();

    for (
      const section of
        sections || []
    ) {
      const type =
        String(
          section?.type
            ?.code ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        type !==
        "FEATURED_PRODUCT_GRID"
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

      const targetType =
        String(
          content.viewAllType ||
            "FEATURED"
        )
          .trim()
          .toUpperCase();

      const targetId =
        String(
          content.viewAllTargetId ||
            ""
        ).trim();

      if (!targetId) {
        continue;
      }

      if (
        targetType ===
        "CATEGORY"
      ) {
        categoryIds.add(
          targetId
        );
      }

      if (
        targetType ===
        "BRAND"
      ) {
        brandIds.add(
          targetId
        );
      }

      if (
        targetType ===
        "COLLECTION"
      ) {
        collectionIds.add(
          targetId
        );
      }
    }

    const [
      categories,
      brands,
      collections,
    ] =
      await Promise.all([
        categoryIds.size
          ? db.Category.findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    Array.from(
                      categoryIds
                    ),
                },

                isActive:
                  true,
              },

              attributes: [
                "id",
                "slug",
              ],

              raw: true,
            })
          : [],

        brandIds.size
          ? db.Brand.findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    Array.from(
                      brandIds
                    ),
                },

                isActive:
                  true,
              },

              attributes: [
                "id",
                "slug",
              ],

              raw: true,
            })
          : [],

        collectionIds.size
          ? db.Collection.findAll({
              where: {
                companyId,

                id: {
                  [Op.in]:
                    Array.from(
                      collectionIds
                    ),
                },

                isActive:
                  true,
              },

              attributes: [
                "id",
                "slug",
              ],

              raw: true,
            })
          : [],
      ]);

    const categoryMap =
      new Map(
        categories.map(
          (item) => [
            item.id,
            item.slug,
          ]
        )
      );

    const brandMap =
      new Map(
        brands.map(
          (item) => [
            item.id,
            item.slug,
          ]
        )
      );

    const collectionMap =
      new Map(
        collections.map(
          (item) => [
            item.id,
            item.slug,
          ]
        )
      );

    return (
      sections || []
    ).map(
      (section) => {
        const type =
          String(
            section?.type
              ?.code ||
              ""
          )
            .trim()
            .toUpperCase();

        if (
          type !==
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

        const targetType =
          String(
            content.viewAllType ||
              "FEATURED"
          )
            .trim()
            .toUpperCase();

        const targetId =
          String(
            content.viewAllTargetId ||
              ""
          ).trim();

        let resolvedUrl =
          null;

        switch (
          targetType
        ) {
          case "FEATURED":
            resolvedUrl =
              "/products/featured";
            break;

          case "CATEGORY": {
            const slug =
              categoryMap.get(
                targetId
              );

            resolvedUrl =
              slug
                ? `/category/${slug}`
                : null;

            break;
          }

          case "BRAND": {
            const slug =
              brandMap.get(
                targetId
              );

            resolvedUrl =
              slug
                ? `/brands/${slug}`
                : null;

            break;
          }

          case "COLLECTION": {
            const slug =
              collectionMap.get(
                targetId
              );

            resolvedUrl =
              slug
                ? `/collections/${slug}`
                : null;

            break;
          }

          case "CUSTOM": {
            const customUrl =
              String(
                content.viewAllUrl ||
                  ""
              ).trim();

            resolvedUrl =
              customUrl ||
              null;

            break;
          }

          case "NONE":
          default:
            resolvedUrl =
              null;
            break;
        }

        return {
          ...section,

          content: {
            ...content,

            viewAllResolvedUrl:
              resolvedUrl,
          },
        };
      }
    );
  };

/*
 * Public storefront page entry point.
 */

const getPublicStorefrontPageUncached = async ({
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

    
      
      /*

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const navigationResolvedSections =
  await resolveNavigationSections({
    sections:
      baseSections,

    companyId:
      company.id,

    channel:
      normalizedChannel,
  });


/*
|--------------------------------------------------------------------------
| Category Grid
|--------------------------------------------------------------------------
*/

const categoryResolvedSections =
  await resolveCategoryGridSections({
    sections:
      navigationResolvedSections,

    companyId:
      company.id,

    apiBaseUrl,
  });


/*
|--------------------------------------------------------------------------
| Collection Grid
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


/*
|--------------------------------------------------------------------------
| Brand Carousel
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


/*
|--------------------------------------------------------------------------
| Featured Product Grid
|--------------------------------------------------------------------------
*/

const featuredResolvedSections =
  await resolveFeaturedProductGridSections({
    sections:
      brandResolvedSections,

    companyId:
      company.id,

    channel:
      normalizedChannel,

    apiBaseUrl,

    now,
  });


/*
|--------------------------------------------------------------------------
| Featured View-All Links
|--------------------------------------------------------------------------
*/

const featuredViewAllResolvedSections =
  await resolveFeaturedGridViewAllLinks({
    sections:
      featuredResolvedSections,

    companyId:
      company.id,
  });


/*
|--------------------------------------------------------------------------
| Product Carousel
|--------------------------------------------------------------------------
*/

const productCarouselResolvedSections =
  await resolveProductCarouselSections({
    sections:
      featuredViewAllResolvedSections,

    companyId:
      company.id,

    channel:
      normalizedChannel,

    apiBaseUrl,

    now,
  });


/*
|--------------------------------------------------------------------------
| Flash Deals
|--------------------------------------------------------------------------
*/

const flashDealsResolvedSections =
  await resolveFlashDealsSections({
    sections:
      productCarouselResolvedSections,

    companyId:
      company.id,

    channel:
      normalizedChannel,

    apiBaseUrl,

    now,
  });


/*
|--------------------------------------------------------------------------
| Pre Booking
|--------------------------------------------------------------------------
*/

const sections =
  await resolvePreBookingSections({
    sections:
      flashDealsResolvedSections,

    companyId:
      company.id,

    channel:
      normalizedChannel,

    apiBaseUrl,

    now,
  });



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

  /*
|--------------------------------------------------------------------------
| Public Storefront In-Flight Request Coalescing
|--------------------------------------------------------------------------
|
| Several Next.js server renders can request the exact same storefront page
| at the same time.
|
| Without coalescing:
|
|   Request A -> full storefront resolution
|   Request B -> full storefront resolution
|   Request C -> full storefront resolution
|
| With coalescing:
|
|   Request A -> full storefront resolution
|   Request B -> waits for A
|   Request C -> waits for A
|
| This is intentionally NOT a persistent response cache.
|
| The Promise exists only while the request is being processed and is removed
| immediately after completion, whether the request succeeds or fails.
|--------------------------------------------------------------------------
*/

const storefrontPageInFlight =
new Map();

/*
* Prevent pathological growth if callers somehow generate many unique keys.
* Under normal storefront traffic this map should contain only a handful
* of entries and entries live only for the duration of the request.
*/
const MAX_STOREFRONT_INFLIGHT =
100;

const getPublicStorefrontPage = async ({
companyCode,
slug = "/",
channel = "WEBSITE",
apiBaseUrl,
}) => {
/*
|--------------------------------------------------------------------------
| Normalize Key Components
|--------------------------------------------------------------------------
*/

const normalizedCompanyCode =
  String(
    companyCode ||
      ""
  )
    .trim()
    .toUpperCase();

const normalizedSlug =
  normalizeSlug(
    slug
  );

const normalizedChannel =
  String(
    channel ||
      "WEBSITE"
  )
    .trim()
    .toUpperCase();

/*
 * apiBaseUrl is included because generated public media URLs depend on it.
 */
const normalizedApiBaseUrl =
  String(
    apiBaseUrl ||
      ""
  )
    .trim()
    .replace(
      /\/+$/,
      ""
    );

const requestKey =
  [
    normalizedCompanyCode,
    normalizedSlug,
    normalizedChannel,
    normalizedApiBaseUrl,
  ].join(
    "|"
  );

/*
|--------------------------------------------------------------------------
| Reuse Existing In-Flight Request
|--------------------------------------------------------------------------
*/

const existingPromise =
  storefrontPageInFlight.get(
    requestKey
  );

if (
  existingPromise
) {
  return existingPromise;
}

/*
|--------------------------------------------------------------------------
| Safety Guard
|--------------------------------------------------------------------------
|
| This should almost never be reached, but don't allow malformed/random
| traffic to create an unlimited number of unique in-flight entries.
|--------------------------------------------------------------------------
*/

if (
  storefrontPageInFlight.size >=
  MAX_STOREFRONT_INFLIGHT
) {
  return getPublicStorefrontPageUncached({
    companyCode:
      normalizedCompanyCode,

    slug:
      normalizedSlug,

    channel:
      normalizedChannel,

    apiBaseUrl:
      normalizedApiBaseUrl,
  });
}

/*
|--------------------------------------------------------------------------
| Start One Real Resolution
|--------------------------------------------------------------------------
*/

const requestPromise =
  getPublicStorefrontPageUncached({
    companyCode:
      normalizedCompanyCode,

    slug:
      normalizedSlug,

    channel:
      normalizedChannel,

    apiBaseUrl:
      normalizedApiBaseUrl,
  });

storefrontPageInFlight.set(
  requestKey,
  requestPromise
);

try {
  return await requestPromise;
} finally {
  /*
   * Delete only if this exact Promise still owns the key.
   */
  if (
    storefrontPageInFlight.get(
      requestKey
    ) ===
    requestPromise
  ) {
    storefrontPageInFlight.delete(
      requestKey
    );
  }
}
};
  

module.exports = {
  getPublicStorefrontPage,
};