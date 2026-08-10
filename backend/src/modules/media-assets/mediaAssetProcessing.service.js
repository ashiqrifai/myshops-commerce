const { Op } = require("sequelize");
const db = require("../../models");

const AppError = require("../../utils/AppError");

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

const reprocessMediaAsset = async ({
  companyId,
  assetId,
  userId,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const asset =
      await db.MediaAsset.findOne({
        where: {
          id: assetId,
          companyId,
          isActive: true,
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

    if (
      asset.assetType !== "IMAGE"
    ) {
      throw new AppError(
        "Only image assets can currently be reprocessed.",
        400,
        "MEDIA_REPROCESS_UNSUPPORTED"
      );
    }

    await asset.update(
      {
        status: "PROCESSING",
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    const generatedVariantTypes = [
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
      
      await db.MediaAssetVariant.destroy({
        where: {
          companyId,
          mediaAssetId: asset.id,
      
          variantType: {
            [Op.in]: generatedVariantTypes,
          },
        },
      
        transaction,
      });

    const sourcePath =
      resolveAbsoluteStoragePath(
        asset.storagePath
      );

    const generatedVariants =
      await generateImageVariants({
        companyId,
        assetId: asset.id,
        sourcePath,
        isPublic:
          asset.isPublic,
      });

    await db.MediaAssetVariant.bulkCreate(
      generatedVariants.map(
        (variant) => ({
          companyId,
          mediaAssetId:
            asset.id,

          ...variant,

          createdBy: userId,
          updatedBy: userId,
        })
      ),
      {
        transaction,
      }
    );

    const dominantColor =
      await extractDominantColor(
        sourcePath
      );

    const thumbnailVariant =
      generatedVariants.find(
        (variant) =>
          variant.variantType ===
            "THUMBNAIL" &&
          variant.format ===
            "webp"
      );

    const previewVariant =
      generatedVariants.find(
        (variant) =>
          variant.variantType ===
            "PREVIEW" &&
          variant.format ===
            "webp"
      );

    await asset.update(
      {
        dominantColor,

        thumbnailPath:
          thumbnailVariant
            ?.storagePath || null,

        previewPath:
          previewVariant
            ?.storagePath || null,

        isOptimized: true,
        status: "READY",
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    return db.MediaAsset.findOne({
      where: {
        id: asset.id,
        companyId,
      },

      include: [
        {
          model:
            db.MediaAssetVariant,
          as: "variants",
          where: {
            isActive: true,
          },
          required: false,
          separate: true,
          order: [
            ["variantType", "ASC"],
            ["format", "ASC"],
          ],
        },
      ],
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    await db.MediaAsset.update(
      {
        status: "FAILED",
        updatedBy: userId,
      },
      {
        where: {
          id: assetId,
          companyId,
        },
      }
    );

    throw error;
  }
};

module.exports = {
  reprocessMediaAsset,
};