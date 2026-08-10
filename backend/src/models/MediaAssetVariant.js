const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MediaAssetVariant = sequelize.define(
  "MediaAssetVariant",
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

    mediaAssetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    variantType: {
      type: DataTypes.ENUM(
        "ORIGINAL",
        "THUMBNAIL",
        "SMALL",
        "MEDIUM",
        "LARGE",
        "DESKTOP",
        "TABLET",
        "MOBILE",
        "KIOSK",
        "PREVIEW"
      ),
      allowNull: false,
    },

    format: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    mimeType: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fileSize: {
      type: DataTypes.BIGINT,
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

    checksum: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "media_asset_variants",

    indexes: [
      {
        unique: true,
        fields: [
          "mediaAssetId",
          "variantType",
          "format",
        ],
        name: "media_asset_variants_asset_type_format_unique",
      },
      {
        fields: [
          "companyId",
          "mediaAssetId",
          "isActive",
        ],
        name: "media_asset_variants_company_asset_active_idx",
      },
      {
        fields: [
          "companyId",
          "variantType",
          "format",
        ],
        name: "media_asset_variants_company_type_format_idx",
      },
    ],
  }
);

module.exports = MediaAssetVariant;