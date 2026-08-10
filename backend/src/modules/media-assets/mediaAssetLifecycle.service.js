const db = require("../../models");
const AppError = require("../../utils/AppError");

const {
  getActiveMediaUsageCount,
} = require(
  "../../services/media/mediaUsage.service"
);

const getAsset = async ({
  companyId,
  assetId,
  transaction,
}) => {
  const asset =
    await db.MediaAsset.findOne({
      where: {
        id: assetId,
        companyId,
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

  return asset;
};

const archiveMediaAsset = async ({
  companyId,
  assetId,
  userId,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const asset = await getAsset({
      companyId,
      assetId,
      transaction,
    });

    if (
      asset.status === "ARCHIVED" ||
      asset.isActive === false
    ) {
      throw new AppError(
        "This media asset is already archived.",
        409,
        "MEDIA_ASSET_ALREADY_ARCHIVED"
      );
    }

    if (
      asset.status === "PROCESSING" ||
      asset.status === "UPLOADING"
    ) {
      throw new AppError(
        "A media asset cannot be archived while it is being processed.",
        409,
        "MEDIA_ASSET_PROCESSING"
      );
    }

    const usageCount =
      await getActiveMediaUsageCount({
        companyId,
        mediaAssetId:
          asset.id,
        transaction,
      });

    if (usageCount > 0) {
      throw new AppError(
        `This media asset cannot be archived because it is currently used in ${usageCount} location${
          usageCount === 1
            ? ""
            : "s"
        }.`,
        409,
        "MEDIA_ASSET_IN_USE",
        {
          usageCount,
        }
      );
    }

    await asset.update(
      {
        status: "ARCHIVED",
        isActive: false,
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    return asset;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

const restoreMediaAsset = async ({
  companyId,
  assetId,
  userId,
}) => {
  const transaction =
    await db.sequelize.transaction();

  try {
    const asset = await getAsset({
      companyId,
      assetId,
      transaction,
    });

    if (
      asset.status !== "ARCHIVED" &&
      asset.isActive !== false
    ) {
      throw new AppError(
        "This media asset is not archived.",
        409,
        "MEDIA_ASSET_NOT_ARCHIVED"
      );
    }

    const folderExists =
      !asset.folderId ||
      (await db.MediaFolder.findOne({
        where: {
          id: asset.folderId,
          companyId,
          isActive: true,
        },

        transaction,
      }));

    await asset.update(
      {
        folderId: folderExists
          ? asset.folderId
          : null,

        status: "READY",
        isActive: true,
        updatedBy: userId,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    return asset;
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  archiveMediaAsset,
  restoreMediaAsset,
};