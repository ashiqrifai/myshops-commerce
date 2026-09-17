const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
  );

const toPlain = (
  value
) =>
  value &&
  typeof value.get ===
    "function"
    ? value.get({
        plain:
          true,
      })
    : value;

const absoluteUrl = (
  value,
  apiBaseUrl
) => {
  if (!value) {
    return null;
  }

  const url =
    String(
      value
    ).trim();

  if (!url) {
    return null;
  }

  if (
    /^https?:\/\//i.test(
      url
    )
  ) {
    return url;
  }

  const base =
    String(
      apiBaseUrl ||
        ""
    ).replace(
      /\/+$/,
      ""
    );

  const path =
    url.startsWith(
      "/"
    )
      ? url
      : `/${url}`;

  return base
    ? `${base}${path}`
    : path;
};

const publicMediaAsset = (
  model,
  apiBaseUrl
) => {
  if (!model) {
    return null;
  }

  const asset =
    toPlain(
      model
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

    width:
      asset.width ||
      null,

    height:
      asset.height ||
      null,

    publicUrl:
      absoluteUrl(
        asset.publicUrl ||
          asset.storagePath,
        apiBaseUrl
      ),

    thumbnailUrl:
      absoluteUrl(
        asset.thumbnailPath
          ? `/media/${asset.thumbnailPath}`
          : null,
        apiBaseUrl
      ),

    previewUrl:
      absoluteUrl(
        asset.previewPath
          ? `/media/${asset.previewPath}`
          : null,
        apiBaseUrl
      ),

    variants:
      Array.isArray(
        asset.variants
      )
        ? asset.variants
            .filter(
              (
                variant
              ) =>
                variant.isActive ===
                true
            )
            .map(
              (
                variant
              ) => ({
                id:
                  variant.id,

                variantType:
                  variant.variantType,

                format:
                  variant.format,

                width:
                  variant.width,

                height:
                  variant.height,

                publicUrl:
                  absoluteUrl(
                    variant.publicUrl ||
                      variant.storagePath,
                    apiBaseUrl
                  ),
              })
            )
        : [],
  };
};

const getPublicInstagram =
  async ({
    companyCode,
    apiBaseUrl,
    limit = 8,
  }) => {
    const normalizedCompanyCode =
      String(
        companyCode ||
          ""
      )
        .trim()
        .toUpperCase();

    if (
      !normalizedCompanyCode
    ) {
      throw new AppError(
        "Company code is required.",
        400,
        "COMPANY_CODE_REQUIRED"
      );
    }

    const company =
      await db.Company.findOne({
        where: {
          code:
            normalizedCompanyCode,

          isActive:
            true,
        },

        attributes: [
          "id",
          "code",
          "name",
        ],
      });

    if (!company) {
      throw new AppError(
        "Company not found.",
        404,
        "COMPANY_NOT_FOUND"
      );
    }

    const requestedLimit =
      Math.min(
        Math.max(
          Number(
            limit ||
              8
          ),
          1
        ),
        20
      );

    const posts =
      await db.InstagramPost.findAll({
        where: {
          companyId:
            company.id,

          isActive:
            true,
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
              companyId:
                company.id,

              isActive:
                true,

              isPublic:
                true,

              status:
                "READY",
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
                  companyId:
                    company.id,

                  isActive:
                    true,
                },
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
            "createdAt",
            "DESC",
          ],
        ],

        limit:
          requestedLimit,
      });

    return {
      username:
        "myshops.ae",

      profileUrl:
        "https://www.instagram.com/myshops.ae/",

      posts:
        posts.map(
          (
            postModel
          ) => {
            const post =
              toPlain(
                postModel
              );

            return {
              id:
                post.id,

              instagramUrl:
                post.instagramUrl,

              caption:
                post.caption ||
                null,

              altText:
                post.altText ||
                post.mediaAsset
                  ?.altText ||
                "MyShops Instagram",

              sortOrder:
                post.sortOrder,

              media:
                publicMediaAsset(
                  post.mediaAsset,
                  apiBaseUrl
                ),
            };
          }
        ),
    };
  };

module.exports = {
  getPublicInstagram,
};