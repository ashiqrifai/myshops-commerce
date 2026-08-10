const {
    Op,
    fn,
    col,
    literal,
  } = require("sequelize");
  
  const db = require("../../models");
  const AppError = require("../../utils/AppError");
  
  const normalizeCode = (value) =>
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
  
  const generateCodeFromName = (name) =>
    normalizeCode(name);
  
  const getMediaFolderById = async ({
    companyId,
    folderId,
    includeChildren = false,
    includeAssets = false,
    transaction,
  }) => {
    const include = [
      {
        model: db.MediaFolder,
        as: "parent",
        attributes: [
          "id",
          "name",
          "code",
        ],
        required: false,
      },
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
    ];
  
    if (includeChildren) {
      include.push({
        model: db.MediaFolder,
        as: "children",
        where: {
          companyId,
          isActive: true,
        },
        required: false,
        separate: true,
        order: [
          ["displayOrder", "ASC"],
          ["name", "ASC"],
        ],
      });
    }
  
    if (includeAssets) {
      include.push({
        model: db.MediaAsset,
        as: "assets",
        where: {
          companyId,
          isActive: true,
        },
        required: false,
        separate: true,
        order: [
          ["createdAt", "DESC"],
        ],
      });
    }
  
    const folder =
      await db.MediaFolder.findOne({
        where: {
          id: folderId,
          companyId,
        },
        include,
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
  
  const validateParentFolder = async ({
    companyId,
    parentFolderId,
    folderId,
    transaction,
  }) => {
    if (!parentFolderId) {
      return null;
    }
  
    if (
      folderId &&
      parentFolderId === folderId
    ) {
      throw new AppError(
        "A folder cannot be its own parent.",
        400,
        "MEDIA_FOLDER_SELF_PARENT"
      );
    }
  
    const parentFolder =
      await db.MediaFolder.findOne({
        where: {
          id: parentFolderId,
          companyId,
          isActive: true,
        },
        transaction,
      });
  
    if (!parentFolder) {
      throw new AppError(
        "Parent media folder not found.",
        404,
        "MEDIA_PARENT_FOLDER_NOT_FOUND"
      );
    }
  
    return parentFolder;
  };
  
  const preventCircularHierarchy = async ({
    companyId,
    folderId,
    parentFolderId,
    transaction,
  }) => {
    if (
      !folderId ||
      !parentFolderId
    ) {
      return;
    }
  
    let currentParentId =
      parentFolderId;
  
    const visited = new Set();
  
    while (currentParentId) {
      if (
        currentParentId === folderId
      ) {
        throw new AppError(
          "This folder move would create a circular hierarchy.",
          400,
          "MEDIA_FOLDER_CIRCULAR_HIERARCHY"
        );
      }
  
      if (
        visited.has(currentParentId)
      ) {
        throw new AppError(
          "A circular media folder hierarchy already exists.",
          409,
          "MEDIA_FOLDER_HIERARCHY_INVALID"
        );
      }
  
      visited.add(currentParentId);
  
      const currentFolder =
        await db.MediaFolder.findOne({
          where: {
            id: currentParentId,
            companyId,
          },
          attributes: [
            "id",
            "parentFolderId",
          ],
          transaction,
        });
  
      if (!currentFolder) {
        break;
      }
  
      currentParentId =
        currentFolder.parentFolderId;
    }
  };
  
  const ensureUniqueCode = async ({
    companyId,
    code,
    folderId,
    transaction,
  }) => {
    const where = {
      companyId,
      code,
    };
  
    if (folderId) {
      where.id = {
        [Op.ne]: folderId,
      };
    }
  
    const existingFolder =
      await db.MediaFolder.findOne({
        where,
        attributes: ["id"],
        transaction,
      });
  
    if (existingFolder) {
      throw new AppError(
        "A media folder with this code already exists.",
        409,
        "MEDIA_FOLDER_CODE_EXISTS"
      );
    }
  };
  
  const buildFolderTree = (
    folders
  ) => {
    const folderMap = new Map();
    const rootFolders = [];
  
    for (const folderRecord of folders) {
      const folder = folderRecord.toJSON
        ? folderRecord.toJSON()
        : { ...folderRecord };
  
      folder.children = [];
  
      folderMap.set(
        folder.id,
        folder
      );
    }
  
    for (const folder of folderMap.values()) {
      if (
        folder.parentFolderId &&
        folderMap.has(
          folder.parentFolderId
        )
      ) {
        folderMap
          .get(folder.parentFolderId)
          .children.push(folder);
      } else {
        rootFolders.push(folder);
      }
    }
  
    const sortFolders = (
      folderList
    ) => {
      folderList.sort(
        (left, right) => {
          const orderDifference =
            Number(
              left.displayOrder || 0
            ) -
            Number(
              right.displayOrder || 0
            );
  
          if (
            orderDifference !== 0
          ) {
            return orderDifference;
          }
  
          return left.name.localeCompare(
            right.name
          );
        }
      );
  
      for (const folder of folderList) {
        sortFolders(
          folder.children
        );
      }
    };
  
    sortFolders(rootFolders);
  
    return rootFolders;
  };
  
  const listMediaFolders = async ({
    companyId,
    search,
    parentFolderId,
    isActive = true,
    includeAssetCount = true,
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
          name: {
            [Op.iLike]:
              `%${search}%`,
          },
        },
        {
          code: {
            [Op.iLike]:
              `%${search}%`,
          },
        },
        {
          description: {
            [Op.iLike]:
              `%${search}%`,
          },
        },
      ];
    }
  
    if (
      parentFolderId !== undefined
    ) {
      where.parentFolderId =
        parentFolderId === null ||
        parentFolderId === "" ||
        parentFolderId === "null"
          ? null
          : parentFolderId;
    }
  
    const attributes = {
      include: [],
    };
  
    if (includeAssetCount) {
      attributes.include.push([
        literal(`(
          SELECT COUNT(*)
          FROM "media_assets" AS asset
          WHERE asset."folderId" = "MediaFolder"."id"
            AND asset."companyId" = "MediaFolder"."companyId"
            AND asset."isActive" = true
        )`),
        "assetCount",
      ]);
  
      attributes.include.push([
        literal(`(
          SELECT COUNT(*)
          FROM "media_folders" AS child
          WHERE child."parentFolderId" = "MediaFolder"."id"
            AND child."companyId" = "MediaFolder"."companyId"
            AND child."isActive" = true
        )`),
        "childFolderCount",
      ]);
    }
  
    return db.MediaFolder.findAll({
      where,
      attributes,
      include: [
        {
          model: db.MediaFolder,
          as: "parent",
          attributes: [
            "id",
            "name",
            "code",
          ],
          required: false,
        },
      ],
      order: [
        ["displayOrder", "ASC"],
        ["name", "ASC"],
      ],
    });
  };
  
  const getMediaFolderTree = async ({
    companyId,
    isActive = true,
  }) => {
    const folders =
      await db.MediaFolder.findAll({
        where: {
          companyId,
          isActive,
        },
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*)
                FROM "media_assets" AS asset
                WHERE asset."folderId" = "MediaFolder"."id"
                  AND asset."companyId" = "MediaFolder"."companyId"
                  AND asset."isActive" = true
              )`),
              "assetCount",
            ],
          ],
        },
        order: [
          ["displayOrder", "ASC"],
          ["name", "ASC"],
        ],
      });
  
    return buildFolderTree(folders);
  };
  
  const createMediaFolder = async ({
    companyId,
    userId,
    payload,
  }) => {
    const transaction =
      await db.sequelize.transaction();
  
    try {
      const parentFolderId =
        payload.parentFolderId ||
        null;
  
      await validateParentFolder({
        companyId,
        parentFolderId,
        transaction,
      });
  
      const code = normalizeCode(
        payload.code ||
          generateCodeFromName(
            payload.name
          )
      );
  
      if (!code) {
        throw new AppError(
          "A valid folder code could not be generated.",
          400,
          "MEDIA_FOLDER_CODE_INVALID"
        );
      }
  
      await ensureUniqueCode({
        companyId,
        code,
        transaction,
      });
  
      const folder =
        await db.MediaFolder.create(
          {
            companyId,
            parentFolderId,
            name:
              payload.name.trim(),
            code,
            description:
              payload.description ||
              null,
            displayOrder:
              payload.displayOrder ||
              0,
            isSystemFolder: false,
            isActive:
              payload.isActive !==
              false,
            createdBy: userId,
            updatedBy: userId,
          },
          {
            transaction,
          }
        );
  
      await transaction.commit();
  
      return getMediaFolderById({
        companyId,
        folderId: folder.id,
        includeChildren: true,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
  
  const updateMediaFolder = async ({
    companyId,
    folderId,
    userId,
    payload,
  }) => {
    const transaction =
      await db.sequelize.transaction();
  
    try {
      const folder =
        await db.MediaFolder.findOne({
          where: {
            id: folderId,
            companyId,
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
  
      const updateValues = {
        updatedBy: userId,
      };
  
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "name"
        )
      ) {
        updateValues.name =
          payload.name.trim();
      }
  
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "code"
        )
      ) {
        const code =
          normalizeCode(
            payload.code
          );
  
        await ensureUniqueCode({
          companyId,
          code,
          folderId,
          transaction,
        });
  
        updateValues.code = code;
      }
  
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "parentFolderId"
        )
      ) {
        const parentFolderId =
          payload.parentFolderId ||
          null;
  
        await validateParentFolder({
          companyId,
          parentFolderId,
          folderId,
          transaction,
        });
  
        await preventCircularHierarchy({
          companyId,
          folderId,
          parentFolderId,
          transaction,
        });
  
        updateValues.parentFolderId =
          parentFolderId;
      }
  
      const directFields = [
        "description",
        "displayOrder",
      ];
  
      for (const field of directFields) {
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
  
      await folder.update(
        updateValues,
        {
          transaction,
        }
      );
  
      await transaction.commit();
  
      return getMediaFolderById({
        companyId,
        folderId,
        includeChildren: true,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
  
  const changeMediaFolderActive = async ({
    companyId,
    folderId,
    userId,
    isActive,
  }) => {
    const transaction =
      await db.sequelize.transaction();
  
    try {
      const folder =
        await db.MediaFolder.findOne({
          where: {
            id: folderId,
            companyId,
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
  
      if (
        folder.isSystemFolder &&
        !isActive
      ) {
        throw new AppError(
          "System media folders cannot be disabled.",
          400,
          "MEDIA_SYSTEM_FOLDER_PROTECTED"
        );
      }
  
      if (!isActive) {
        const activeChildCount =
          await db.MediaFolder.count({
            where: {
              companyId,
              parentFolderId:
                folderId,
              isActive: true,
            },
            transaction,
          });
  
        const activeAssetCount =
          await db.MediaAsset.count({
            where: {
              companyId,
              folderId,
              isActive: true,
            },
            transaction,
          });
  
        if (
          activeChildCount > 0 ||
          activeAssetCount > 0
        ) {
          throw new AppError(
            "This folder cannot be disabled while it contains active child folders or media assets.",
            409,
            "MEDIA_FOLDER_NOT_EMPTY"
          );
        }
      }
  
      await folder.update(
        {
          isActive,
          updatedBy: userId,
        },
        {
          transaction,
        }
      );
  
      await transaction.commit();
  
      return getMediaFolderById({
        companyId,
        folderId,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
  
  const deleteMediaFolder = async ({
    companyId,
    folderId,
    userId,
  }) => {
    const transaction =
      await db.sequelize.transaction();
  
    try {
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
  
      if (
        folder.isSystemFolder
      ) {
        throw new AppError(
          "System media folders cannot be removed.",
          400,
          "MEDIA_SYSTEM_FOLDER_PROTECTED"
        );
      }
  
      const childFolderCount =
        await db.MediaFolder.count({
          where: {
            companyId,
            parentFolderId:
              folderId,
            isActive: true,
          },
          transaction,
        });
  
      if (
        childFolderCount > 0
      ) {
        throw new AppError(
          "This folder cannot be removed while it contains active child folders.",
          409,
          "MEDIA_FOLDER_HAS_CHILDREN"
        );
      }
  
      const activeAssetCount =
        await db.MediaAsset.count({
          where: {
            companyId,
            folderId,
            isActive: true,
          },
          transaction,
        });
  
      if (
        activeAssetCount > 0
      ) {
        throw new AppError(
          "This folder cannot be removed while it contains active media assets.",
          409,
          "MEDIA_FOLDER_HAS_ASSETS"
        );
      }
  
      await folder.update(
        {
          isActive: false,
          updatedBy: userId,
        },
        {
          transaction,
        }
      );
  
      await transaction.commit();
  
      return {
        id: folderId,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
  
  module.exports = {
    listMediaFolders,
    getMediaFolderTree,
    getMediaFolderById,
    createMediaFolder,
    updateMediaFolder,
    changeMediaFolderActive,
    deleteMediaFolder,
  };    