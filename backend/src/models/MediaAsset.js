const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MediaAsset = sequelize.define(
  "MediaAsset",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    folderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    assetType: {
      type: DataTypes.ENUM(
        "IMAGE",
        "VIDEO",
        "AUDIO",
        "PDF",
        "DOCUMENT",
        "ARCHIVE",
        "MODEL_3D",
        "OTHER"
      ),
      allowNull: false,
    },

    classification: {
      type: DataTypes.ENUM(
        "MARKETING",
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "CMS",
        "PROMOTION",
        "LEGAL",
        "BLOG",
        "STORE",
        "AI",
        "DOWNLOAD",
        "OTHER"
      ),
      allowNull: false,
      defaultValue: "OTHER",
    },

    status: {
      type: DataTypes.ENUM(
        "UPLOADING",
        "PROCESSING",
        "READY",
        "FAILED",
        "ARCHIVED"
      ),
      allowNull: false,
      defaultValue: "UPLOADING",
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    altText: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    originalFileName: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    storedFileName: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    mimeType: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    extension: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    checksum: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    storageProvider: {
      type: DataTypes.ENUM(
        "LOCAL",
        "S3",
        "R2",
        "AZURE_BLOB",
        "GCS",
        "DIGITALOCEAN_SPACES"
      ),
      allowNull: false,
      defaultValue: "LOCAL",
    },

    storagePath: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    publicUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    thumbnailPath: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    previewPath: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    durationSeconds: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    orientation: {
      type: DataTypes.ENUM(
        "LANDSCAPE",
        "PORTRAIT",
        "SQUARE",
        "UNKNOWN"
      ),
      allowNull: false,
      defaultValue: "UNKNOWN",
    },

    dominantColor: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    hasTransparency: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    copyright: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    license: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    isOptimized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "media_assets",

    indexes: [
      {
        unique: true,
        fields: ["companyId", "checksum"],
        name: "media_assets_company_checksum_unique",
      },
      {
        fields: [
          "companyId",
          "folderId",
          "isActive",
        ],
        name: "media_assets_company_folder_active_idx",
      },
      {
        fields: [
          "companyId",
          "assetType",
          "classification",
        ],
        name: "media_assets_company_type_classification_idx",
      },
      {
        fields: [
          "companyId",
          "status",
          "isActive",
        ],
        name: "media_assets_company_status_active_idx",
      },
      {
        fields: ["companyId", "createdAt"],
        name: "media_assets_company_created_at_idx",
      },
    ],
  }
);

module.exports = MediaAsset;