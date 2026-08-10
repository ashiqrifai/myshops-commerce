const path = require("path");
const { Op } = require("sequelize");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const {
  validateUploadedFile,
  extractMediaMetadata,
} = require(
  "../../services/media/mediaFile.service"
);

const {
    generateImageVariants,
    extractDominantColor,
  } = require(
    "../../services/media/mediaImageProcessor.service"
  );

 

  const {
    generateVideoVariants,
  } = require(
    "../../services/media/mediaVideoProcessor.service"
  );

const {
  generateStoredFileName,
  buildAssetDirectory,
  buildAssetStoragePath,
  moveFile,
  removeFileIfExists,
  removeDirectoryIfExists,
  calculateFileChecksum,
  getRelativeStoragePath,
  buildPublicUrl,
} = require(
  "../../services/media/mediaStorage.service"
);

const getDefaultTitle = (
  originalFileName
) => {
  return path
    .basename(
      originalFileName,
      path.extname(originalFileName)
    )
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (value) =>
      value.toUpperCase()
    );
};

const validateFolder = async ({
  companyId,
  folderId,
  transaction,
}) => {
  if (!folderId) {
    return null;
  }

  const folder =
    await db.MediaFolder.findOne({
      where: {
        id: folderId,
        companyId,
        isActive: true,
      },
      transaction,
    });

  if (!folder) {
    throw new AppError(
      "Media folder not found.",
      404,
      "MEDIA_FOLDER_NOT_FOUND"
    );
  }

  return folder;
};

const getMediaAssetById = async ({
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

      include: [
        {
          model: db.MediaFolder,
          as: "folder",
          attributes: [
            "id",
            "name",
            "code",
          ],
          required: false,
        },

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

        {
          model:
            db.MediaAssetUsage,
          as: "usageRecords",
          where: {
            isActive: true,
          },
          required: false,
          separate: true,
          order: [
            ["createdAt", "DESC"],
          ],
        },

        {
          model: db.User,
          as: "uploadedByUser",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
          ],
          required: false,
        },
      ],

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

const listMediaAssets = async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  folderId,
  assetType,
  classification,
  status,
  isPublic,
  isActive = true,
  sortBy = "createdAt",
  sortDirection = "DESC",
}) => {
  const where = {
    companyId,
  };

  if (
    typeof isActive === "boolean"
  ) {
    where.isActive = isActive;
  }

  if (search) {
    where[Op.or] = [
      {
        title: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
      {
        originalFileName: {
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
        caption: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
      {
        checksum: {
          [Op.iLike]:
            `%${search}%`,
        },
      },
    ];
  }

  if (folderId !== undefined) {
    where.folderId =
      folderId === null ||
      folderId === "" ||
      folderId === "null"
        ? null
        : folderId;
  }

  if (assetType) {
    where.assetType = assetType;
  }

  if (classification) {
    where.classification =
      classification;
  }

  if (status) {
    where.status = status;
  }

  if (
    typeof isPublic === "boolean"
  ) {
    where.isPublic = isPublic;
  }

  const offset =
    (Number(page) - 1) *
    Number(pageSize);

  const result =
    await db.MediaAsset.findAndCountAll({
      where,

      limit: Number(pageSize),
      offset,

      distinct: true,

      include: [
        {
          model: db.MediaFolder,
          as: "folder",
          attributes: [
            "id",
            "name",
            "code",
          ],
          required: false,
        },

        {
          model:
            db.MediaAssetVariant,
          as: "variants",
          where: {
            isActive: true,
          },
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
          ],
          required: false,
        },
      ],

      order: [
        [
          sortBy,
          sortDirection.toUpperCase(),
        ],
      ],
    });

  return {
    rows: result.rows,

    pagination: {
      page: Number(page),
      pageSize:
        Number(pageSize),
      totalItems: result.count,
      totalPages: Math.ceil(
        result.count /
          Number(pageSize)
      ),
    },
  };
};

const uploadMediaAsset = async ({
  companyId,
  userId,
  file,
  payload,
}) => {
  if (!file) {
    throw new AppError(
      "A media file is required.",
      400,
      "MEDIA_FILE_REQUIRED"
    );
  }

  let asset = null;

  const transaction =
    await db.sequelize.transaction();

  try {
    const folderId =
      payload.folderId || null;

    await validateFolder({
      companyId,
      folderId,
      transaction,
    });

    const validatedFile =
      await validateUploadedFile({
        filePath: file.path,
        originalFileName:
          file.originalname,
        reportedMimeType:
          file.mimetype,
        fileSize: file.size,
      });

    const checksum =
      await calculateFileChecksum(
        file.path
      );

    const existingAsset =
      await db.MediaAsset.findOne({
        where: {
          companyId,
          checksum,
          isActive: true,
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
          },
        ],

        transaction,
      });

    if (existingAsset) {
      await transaction.rollback();

      await removeFileIfExists(
        file.path
      );

      return {
        asset: existingAsset,
        duplicate: true,
      };
    }

    const metadata =
      await extractMediaMetadata({
        filePath: file.path,
        assetType:
          validatedFile.assetType,
      });

    asset =
      await db.MediaAsset.create(
        {
          companyId,
          folderId,

          assetType:
            validatedFile.assetType,

          classification:
            payload.classification ||
            "OTHER",

          status: "PROCESSING",

          title:
            payload.title?.trim() ||
            getDefaultTitle(
              file.originalname
            ),

          altText:
            payload.altText?.trim() ||
            null,

          caption:
            payload.caption || null,

          description:
            payload.description ||
            null,

          originalFileName:
            file.originalname,

          storedFileName:
            "pending",

          mimeType:
            validatedFile.mimeType,

          extension:
            validatedFile.extension,

          fileSize: file.size,
          checksum,

          storageProvider:
            "LOCAL",

          storagePath:
            "pending",

          publicUrl: null,
          thumbnailPath: null,
          previewPath: null,

          width:
            metadata.width || null,

          height:
            metadata.height || null,

          durationSeconds: null,

          orientation:
            metadata.orientation ||
            "UNKNOWN",

          dominantColor: null,

          hasTransparency:
            metadata.hasTransparency,

          copyright:
            payload.copyright?.trim() ||
            null,

          license:
            payload.license?.trim() ||
            null,

          isPublic:
            payload.isPublic !== false,

          isOptimized: false,
          isActive: true,

          uploadedBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
        {
          transaction,
        }
      );

    const storedFileName =
      generateStoredFileName({
        originalFileName:
          file.originalname,
        checksum,
      });

    const absoluteStoragePath =
      buildAssetStoragePath({
        companyId,
        assetId: asset.id,
        storedFileName,
      });

    await moveFile({
      sourcePath: file.path,
      destinationPath:
        absoluteStoragePath,
    });

    const storagePath =
      getRelativeStoragePath(
        absoluteStoragePath
      );

    const publicUrl =
      payload.isPublic === false
        ? null
        : buildPublicUrl(
            storagePath
          );

          await asset.update(
            {
              storedFileName,
              storagePath,
              publicUrl,
              status: "PROCESSING",
              updatedBy: userId,
            },
            {
              transaction,
            }
          );

    await db.MediaAssetVariant.create(
        {
          companyId,
          mediaAssetId: asset.id,
      
          variantType: "ORIGINAL",
      
          format:
            validatedFile.extension,
      
          mimeType:
            validatedFile.mimeType,
      
          width:
            metadata.width || null,
      
          height:
            metadata.height || null,
      
          fileSize: file.size,
      
          storageProvider: "LOCAL",
      
          storagePath,
          publicUrl,
      
          checksum,
      
          isPrimary: true,
          isActive: true,
      
          createdBy: userId,
          updatedBy: userId,
        },
        {
          transaction,
        }
      );
      
      let generatedVariants = [];
      let dominantColor = null;
  
      let processedMetadata = {
        width:
          metadata.width || null,
  
        height:
          metadata.height || null,
  
        durationSeconds: null,
  
        orientation:
          metadata.orientation ||
          "UNKNOWN",
  
        hasTransparency:
          metadata.hasTransparency ??
          null,
      };
  
      if (
        validatedFile.assetType ===
        "IMAGE"
      ) {
        dominantColor =
          await extractDominantColor(
            absoluteStoragePath
          );
  
        generatedVariants =
          await generateImageVariants({
            companyId,
  
            assetId:
              asset.id,
  
            sourcePath:
              absoluteStoragePath,
  
            isPublic:
              payload.isPublic !== false,
          });
      }
  
      if (
        validatedFile.assetType ===
        "VIDEO"
      ) {
        const videoResult =
          await generateVideoVariants({
            companyId,
  
            assetId:
              asset.id,
  
            sourcePath:
              absoluteStoragePath,
  
            isPublic:
              payload.isPublic !== false,
          });
  
        generatedVariants =
          videoResult.variants || [];
  
        processedMetadata = {
          width:
            videoResult.metadata
              ?.width || null,
  
          height:
            videoResult.metadata
              ?.height || null,
  
          durationSeconds:
            videoResult.metadata
              ?.durationSeconds || null,
  
          orientation:
            videoResult.metadata
              ?.orientation ||
            "UNKNOWN",
  
          hasTransparency: null,
        };
      }
  
      if (
        generatedVariants.length > 0
      ) {
        await db.MediaAssetVariant.bulkCreate(
          generatedVariants.map(
            (variant) => ({
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
      }
  
      const thumbnailVariant =
        generatedVariants.find(
          (variant) =>
            variant.variantType ===
            "THUMBNAIL"
        );
  
      const previewVariant =
        generatedVariants.find(
          (variant) =>
            variant.variantType ===
              "PREVIEW" &&
            variant.format ===
              "webp"
        ) ||
        generatedVariants.find(
          (variant) =>
            variant.variantType ===
            "PREVIEW"
        );
  
      await asset.update(
        {
          width:
            processedMetadata.width,
  
          height:
            processedMetadata.height,
  
          durationSeconds:
            processedMetadata
              .durationSeconds,
  
          orientation:
            processedMetadata
              .orientation,
  
          hasTransparency:
            processedMetadata
              .hasTransparency,
  
          dominantColor,
  
          thumbnailPath:
            thumbnailVariant
              ?.storagePath || null,
  
          previewPath:
            previewVariant
              ?.storagePath || null,
  
          isOptimized:
            generatedVariants.length >
            0,
  
          status: "READY",
  
          updatedBy:
            userId,
        },
        {
          transaction,
        }
      );

        await transaction.commit();

    return {
      asset:
        await getMediaAssetById({
          companyId,
          assetId: asset.id,
        }),

      duplicate: false,
    };
  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    await removeFileIfExists(
      file?.path
    );

    if (asset?.id) {
      await removeDirectoryIfExists(
        buildAssetDirectory({
          companyId,
          assetId: asset.id,
        })
      );
    }

    throw error;
  }
};

const updateMediaAsset = async ({
  companyId,
  assetId,
  userId,
  payload,
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
      Object.prototype.hasOwnProperty.call(
        payload,
        "folderId"
      )
    ) {
      await validateFolder({
        companyId,

        folderId:
          payload.folderId,

        transaction,
      });
    }

    const updateValues = {
      updatedBy: userId,
    };

    const allowedFields = [
      "folderId",
      "classification",
      "title",
      "altText",
      "caption",
      "description",
      "copyright",
      "license",
      "isPublic",
    ];

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          field
        )
      ) {
        updateValues[field] =
          payload[field];
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "isPublic"
      )
    ) {
      updateValues.publicUrl =
        payload.isPublic
          ? buildPublicUrl(
              asset.storagePath
            )
          : null;

      const variants =
        await db.MediaAssetVariant.findAll({
          where: {
            companyId,

            mediaAssetId:
              asset.id,

            isActive: true,
          },

          transaction,
        });

      for (
        const variant of variants
      ) {
        await variant.update(
          {
            publicUrl:
              payload.isPublic
                ? buildPublicUrl(
                    variant.storagePath
                  )
                : null,

            updatedBy: userId,
          },
          {
            transaction,
          }
        );
      }
    }

    await asset.update(
      updateValues,
      {
        transaction,
      }
    );

    await transaction.commit();

    return getMediaAssetById({
      companyId,
      assetId,
    });
  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
};

module.exports = {
  listMediaAssets,
  getMediaAssetById,
  uploadMediaAsset,
  updateMediaAsset,
};