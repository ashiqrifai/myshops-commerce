const db = require("../../models");
const AppError = require("../../utils/AppError");

const validateAsset = async ({
  companyId,
  mediaAssetId,
  transaction,
}) => {
  const asset =
    await db.MediaAsset.findOne({
      where: {
        id: mediaAssetId,
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

const registerMediaUsage = async ({
  companyId,
  mediaAssetId,
  module,
  entityType,
  entityId,
  fieldName,
  usageContext = null,
  userId = null,
  transaction,
}) => {
  if (!mediaAssetId) {
    return null;
  }

  await validateAsset({
    companyId,
    mediaAssetId,
    transaction,
  });

  const [
    usage,
    created,
  ] =
    await db.MediaAssetUsage.findOrCreate({
      where: {
        mediaAssetId,
        module,
        entityType,
        entityId,
        fieldName,
      },

      defaults: {
        companyId,
        mediaAssetId,
        module,
        entityType,
        entityId,
        fieldName,
        usageContext,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },

      transaction,
    });

  if (!created) {
    await usage.update(
      {
        companyId,
        usageContext,
        isActive: true,
        updatedBy: userId,
      },
      {
        transaction,
      }
    );
  }

  return usage;
};

const removeMediaUsage = async ({
  companyId,
  mediaAssetId,
  module,
  entityType,
  entityId,
  fieldName,
  userId = null,
  transaction,
}) => {
  if (!mediaAssetId) {
    return;
  }

  await db.MediaAssetUsage.update(
    {
      isActive: false,
      updatedBy: userId,
    },
    {
      where: {
        companyId,
        mediaAssetId,
        module,
        entityType,
        entityId,
        fieldName,
        isActive: true,
      },

      transaction,
    }
  );
};

const removeEntityMediaUsage = async ({
  companyId,
  module,
  entityType,
  entityId,
  userId = null,
  transaction,
}) => {
  await db.MediaAssetUsage.update(
    {
      isActive: false,
      updatedBy: userId,
    },
    {
      where: {
        companyId,
        module,
        entityType,
        entityId,
        isActive: true,
      },

      transaction,
    }
  );
};

const replaceMediaUsage = async ({
  companyId,
  previousMediaAssetId,
  nextMediaAssetId,
  module,
  entityType,
  entityId,
  fieldName,
  usageContext = null,
  userId = null,
  transaction,
}) => {
  if (
    previousMediaAssetId ===
    nextMediaAssetId
  ) {
    if (nextMediaAssetId) {
      return registerMediaUsage({
        companyId,
        mediaAssetId:
          nextMediaAssetId,
        module,
        entityType,
        entityId,
        fieldName,
        usageContext,
        userId,
        transaction,
      });
    }

    return null;
  }

  if (previousMediaAssetId) {
    await removeMediaUsage({
      companyId,
      mediaAssetId:
        previousMediaAssetId,
      module,
      entityType,
      entityId,
      fieldName,
      userId,
      transaction,
    });
  }

  if (nextMediaAssetId) {
    return registerMediaUsage({
      companyId,
      mediaAssetId:
        nextMediaAssetId,
      module,
      entityType,
      entityId,
      fieldName,
      usageContext,
      userId,
      transaction,
    });
  }

  return null;
};

const getMediaUsage = async ({
  companyId,
  mediaAssetId,
  includeInactive = false,
}) => {
  await validateAsset({
    companyId,
    mediaAssetId,
  });

  const where = {
    companyId,
    mediaAssetId,
  };

  if (!includeInactive) {
    where.isActive = true;
  }

  return db.MediaAssetUsage.findAll({
    where,

    include: [
      {
        model: db.User,
        as: "createdByUser",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
        ],
        required: false,
      },

      {
        model: db.User,
        as: "updatedByUser",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
        ],
        required: false,
      },
    ],

    order: [
      ["module", "ASC"],
      ["entityType", "ASC"],
      ["fieldName", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
};

const getActiveMediaUsageCount =
  async ({
    companyId,
    mediaAssetId,
    transaction,
  }) => {
    return db.MediaAssetUsage.count({
      where: {
        companyId,
        mediaAssetId,
        isActive: true,
      },

      transaction,
    });
  };

module.exports = {
  registerMediaUsage,
  removeMediaUsage,
  removeEntityMediaUsage,
  replaceMediaUsage,
  getMediaUsage,
  getActiveMediaUsageCount,
};