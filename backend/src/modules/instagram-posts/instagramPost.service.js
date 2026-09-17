const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../../models"
    );
  
  const AppError =
    require(
      "../../utils/AppError"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Instagram Post Includes
  |--------------------------------------------------------------------------
  */
  
  const INSTAGRAM_POST_INCLUDE = [
    {
      model:
        db.MediaAsset,
  
      as:
        "mediaAsset",
  
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
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const normalizeNullable = (
    value
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return null;
    }
  
    const normalized =
      String(
        value
      ).trim();
  
    return (
      normalized ||
      null
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Validate Media Asset
  |--------------------------------------------------------------------------
  */
  
  const validateImageAsset =
    async ({
      companyId,
      assetId,
      transaction,
    }) => {
      if (!assetId) {
        throw new AppError(
          "Instagram image is required.",
          400,
          "INSTAGRAM_MEDIA_ASSET_REQUIRED"
        );
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
          "Instagram image was not found or is not a valid image.",
          400,
          "INSTAGRAM_MEDIA_ASSET_INVALID"
        );
      }
  
      return asset;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Post
  |--------------------------------------------------------------------------
  */
  
  const getInstagramPostById =
    async ({
      companyId,
      instagramPostId,
      transaction,
    }) => {
      const post =
        await db.InstagramPost.findOne({
          where: {
            id:
              instagramPostId,
  
            companyId,
          },
  
          include:
            INSTAGRAM_POST_INCLUDE,
  
          transaction,
        });
  
      if (!post) {
        throw new AppError(
          "Instagram post not found.",
          404,
          "INSTAGRAM_POST_NOT_FOUND"
        );
      }
  
      return post;
    };
  
  /*
  |--------------------------------------------------------------------------
  | List Posts
  |--------------------------------------------------------------------------
  */
  
  const listInstagramPosts =
    async ({
      companyId,
  
      page = 1,
  
      pageSize = 30,
  
      search,
  
      isActive,
  
      sortBy =
        "sortOrder",
  
      sortDirection =
        "ASC",
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
        search
      ) {
        where[
          Op.or
        ] = [
          {
            caption: {
              [Op.iLike]:
                `%${search}%`,
            },
          },
  
          {
            altText: {
              [Op.iLike]:
                `%${search}%`,
            },
          },
  
          {
            instagramUrl: {
              [Op.iLike]:
                `%${search}%`,
            },
          },
        ];
      }
  
      const normalizedPage =
        Number(
          page
        );
  
      const normalizedPageSize =
        Number(
          pageSize
        );
  
      const offset =
        (
          normalizedPage -
          1
        ) *
        normalizedPageSize;
  
      const result =
        await db.InstagramPost
          .findAndCountAll({
            where,
  
            include:
              INSTAGRAM_POST_INCLUDE,
  
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
                "createdAt",
                "DESC",
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
  
  /*
  |--------------------------------------------------------------------------
  | Create Post
  |--------------------------------------------------------------------------
  */
  
  const createInstagramPost =
    async ({
      companyId,
      payload,
    }) => {
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        await validateImageAsset({
          companyId,
  
          assetId:
            payload.mediaAssetId,
  
          transaction,
        });
  
        const post =
          await db.InstagramPost
            .create(
              {
                companyId,
  
                mediaAssetId:
                  payload.mediaAssetId,
  
                instagramUrl:
                  String(
                    payload.instagramUrl ||
                      ""
                  ).trim(),
  
                caption:
                  normalizeNullable(
                    payload.caption
                  ),
  
                altText:
                  normalizeNullable(
                    payload.altText
                  ),
  
                sortOrder:
                  Number(
                    payload.sortOrder ||
                      0
                  ),
  
                isActive:
                  payload.isActive !==
                  false,
              },
              {
                transaction,
              }
            );
  
        await transaction
          .commit();
  
        return getInstagramPostById({
          companyId,
  
          instagramPostId:
            post.id,
        });
      } catch (
        error
      ) {
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
  | Update Post
  |--------------------------------------------------------------------------
  */
  
  const updateInstagramPost =
    async ({
      companyId,
      instagramPostId,
      payload,
    }) => {
      const transaction =
        await db.sequelize
          .transaction();
  
      try {
        const post =
          await db.InstagramPost
            .findOne({
              where: {
                id:
                  instagramPostId,
  
                companyId,
              },
  
              transaction,
  
              lock:
                transaction
                  .LOCK
                  .UPDATE,
            });
  
        if (!post) {
          throw new AppError(
            "Instagram post not found.",
            404,
            "INSTAGRAM_POST_NOT_FOUND"
          );
        }
  
        /*
         * Media changed
         */
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "mediaAssetId"
            )
        ) {
          await validateImageAsset({
            companyId,
  
            assetId:
              payload.mediaAssetId,
  
            transaction,
          });
        }
  
        const updateValues = {};
  
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "mediaAssetId"
            )
        ) {
          updateValues.mediaAssetId =
            payload.mediaAssetId;
        }
  
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "instagramUrl"
            )
        ) {
          updateValues.instagramUrl =
            String(
              payload.instagramUrl ||
                ""
            ).trim();
        }
  
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "caption"
            )
        ) {
          updateValues.caption =
            normalizeNullable(
              payload.caption
            );
        }
  
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "altText"
            )
        ) {
          updateValues.altText =
            normalizeNullable(
              payload.altText
            );
        }
  
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "sortOrder"
            )
        ) {
          updateValues.sortOrder =
            Number(
              payload.sortOrder ||
                0
            );
        }
  
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              payload,
              "isActive"
            )
        ) {
          updateValues.isActive =
            payload.isActive;
        }
  
        await post.update(
          updateValues,
          {
            transaction,
          }
        );
  
        await transaction
          .commit();
  
        return getInstagramPostById({
          companyId,
  
          instagramPostId:
            post.id,
        });
      } catch (
        error
      ) {
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
  
  const changeInstagramPostStatus =
    async ({
      companyId,
      instagramPostId,
      isActive,
    }) => {
      const post =
        await db.InstagramPost
          .findOne({
            where: {
              id:
                instagramPostId,
  
              companyId,
            },
          });
  
      if (!post) {
        throw new AppError(
          "Instagram post not found.",
          404,
          "INSTAGRAM_POST_NOT_FOUND"
        );
      }
  
      await post.update({
        isActive,
      });
  
      return getInstagramPostById({
        companyId,
  
        instagramPostId,
      });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Delete Post
  |--------------------------------------------------------------------------
  */
  
  const deleteInstagramPost =
    async ({
      companyId,
      instagramPostId,
    }) => {
      const post =
        await db.InstagramPost
          .findOne({
            where: {
              id:
                instagramPostId,
  
              companyId,
            },
          });
  
      if (!post) {
        throw new AppError(
          "Instagram post not found.",
          404,
          "INSTAGRAM_POST_NOT_FOUND"
        );
      }
  
      await post.destroy();
  
      return {
        id:
          instagramPostId,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    listInstagramPosts,
    getInstagramPostById,
    createInstagramPost,
    updateInstagramPost,
    changeInstagramPostStatus,
    deleteInstagramPost,
  };