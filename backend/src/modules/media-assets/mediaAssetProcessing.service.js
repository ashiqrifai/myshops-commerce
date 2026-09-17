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

const {
  resolveAbsoluteStoragePath,
} = require(
  "../../services/media/mediaStorage.service"
);

const {
  generateImageVariants,
  extractDominantColor,
} = require(
  "../../services/media/mediaImageProcessor.service"
);

/*
|--------------------------------------------------------------------------
| Reprocess Media Asset
|--------------------------------------------------------------------------
*/

const reprocessMediaAsset =
  async ({
    companyId,
    assetId,
    userId,
  }) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      /*
      |--------------------------------------------------------------------------
      | Asset
      |--------------------------------------------------------------------------
      */

      const asset =
        await db.MediaAsset.findOne({
          where: {
            id:
              assetId,

            companyId,

            isActive:
              true,
          },

          transaction,
        });

      if (!asset) {
        throw new AppError(
          "Media asset not found.",
          404,
          "MEDIA_ASSET_NOT_FOUND"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Only Images
      |--------------------------------------------------------------------------
      */

      if (
        asset.assetType !==
        "IMAGE"
      ) {
        throw new AppError(
          "Only image assets can currently be reprocessed.",
          400,
          "MEDIA_REPROCESS_UNSUPPORTED"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Processing Status
      |--------------------------------------------------------------------------
      */

      await asset.update(
        {
          status:
            "PROCESSING",

          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Generated Variant Types
      |--------------------------------------------------------------------------
      |
      | ORIGINAL is deliberately NOT included.
      |
      | Therefore the original uploaded file remains untouched.
      |
      |--------------------------------------------------------------------------
      */

      const generatedVariantTypes =
        [
          "THUMBNAIL",
          "SMALL",
          "MEDIUM",
          "LARGE",
          "DESKTOP",
          "TABLET",
          "MOBILE",
          "KIOSK",
          "PREVIEW",
        ];

      /*
      |--------------------------------------------------------------------------
      | Delete Existing Generated Variant Records
      |--------------------------------------------------------------------------
      */

      await db.MediaAssetVariant.destroy({
        where: {
          companyId,

          mediaAssetId:
            asset.id,

          variantType: {
            [Op.in]:
              generatedVariantTypes,
          },
        },

        transaction,
      });

      /*
      |--------------------------------------------------------------------------
      | Original Source Path
      |--------------------------------------------------------------------------
      */

      const sourcePath =
        resolveAbsoluteStoragePath(
          asset.storagePath
        );

      /*
      |--------------------------------------------------------------------------
      | Decide Whether to Normalise
      |--------------------------------------------------------------------------
      |
      | Only PRODUCT assets are normalised.
      |
      | CATEGORY / CMS / BRAND / MARKETING / PROMOTION etc.
      | regenerate using their existing normal behaviour.
      |
      |--------------------------------------------------------------------------
      */

      const normalizeProductImage =
        String(
          asset.classification ||
            ""
        )
          .trim()
          .toUpperCase() ===
        "PRODUCT";

      /*
      |--------------------------------------------------------------------------
      | Generate New Variants
      |--------------------------------------------------------------------------
      */

      const generatedVariants =
        await generateImageVariants({
          companyId,

          assetId:
            asset.id,

          sourcePath,

          isPublic:
            asset.isPublic,

          normalizeProductImage,
        });

      /*
      |--------------------------------------------------------------------------
      | Save New Variant Records
      |--------------------------------------------------------------------------
      */

      await db.MediaAssetVariant.bulkCreate(
        generatedVariants.map(
          (
            variant
          ) => ({
            companyId,

            mediaAssetId:
              asset.id,

            ...variant,

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

      /*
      |--------------------------------------------------------------------------
      | Dominant Colour
      |--------------------------------------------------------------------------
      |
      | Still taken from ORIGINAL.
      |
      |--------------------------------------------------------------------------
      */

      const dominantColor =
        await extractDominantColor(
          sourcePath
        );

      /*
      |--------------------------------------------------------------------------
      | Thumbnail
      |--------------------------------------------------------------------------
      */

      const thumbnailVariant =
        generatedVariants.find(
          (
            variant
          ) =>
            variant.variantType ===
              "THUMBNAIL" &&
            variant.format ===
              "webp"
        ) ||
        generatedVariants.find(
          (
            variant
          ) =>
            variant.variantType ===
            "THUMBNAIL"
        );

      /*
      |--------------------------------------------------------------------------
      | Preview
      |--------------------------------------------------------------------------
      */

      const previewVariant =
        generatedVariants.find(
          (
            variant
          ) =>
            variant.variantType ===
              "PREVIEW" &&
            variant.format ===
              "webp"
        ) ||
        generatedVariants.find(
          (
            variant
          ) =>
            variant.variantType ===
            "PREVIEW"
        );

      /*
      |--------------------------------------------------------------------------
      | Update Asset
      |--------------------------------------------------------------------------
      */

      await asset.update(
        {
          dominantColor,

          thumbnailPath:
            thumbnailVariant
              ?.storagePath ||
            null,

          previewPath:
            previewVariant
              ?.storagePath ||
            null,

          isOptimized:
            true,

          status:
            "READY",

          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Commit
      |--------------------------------------------------------------------------
      */

      await transaction.commit();

      /*
      |--------------------------------------------------------------------------
      | Return Updated Asset
      |--------------------------------------------------------------------------
      */

      return db.MediaAsset.findOne({
        where: {
          id:
            asset.id,

          companyId,
        },

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

            separate:
              true,

            order: [
              [
                "variantType",
                "ASC",
              ],

              [
                "format",
                "ASC",
              ],
            ],
          },
        ],
      });
    } catch (
      error
    ) {
      /*
      |--------------------------------------------------------------------------
      | Rollback
      |--------------------------------------------------------------------------
      */

      if (
        !transaction.finished
      ) {
        await transaction.rollback();
      }

      /*
      |--------------------------------------------------------------------------
      | Failed Status
      |--------------------------------------------------------------------------
      */

      await db.MediaAsset.update(
        {
          status:
            "FAILED",

          updatedBy:
            userId,
        },
        {
          where: {
            id:
              assetId,

            companyId,
          },
        }
      );

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  reprocessMediaAsset,
};