const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MediaAssetUsage = sequelize.define(
  "MediaAssetUsage",
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

    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    entityType: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    fieldName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    usageContext: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: "media_asset_usage",

    indexes: [
      {
        unique: true,
        fields: [
          "mediaAssetId",
          "module",
          "entityType",
          "entityId",
          "fieldName",
        ],
        name: "media_asset_usage_reference_unique",
      },
      {
        fields: [
          "companyId",
          "mediaAssetId",
          "isActive",
        ],
        name: "media_asset_usage_company_asset_active_idx",
      },
      {
        fields: [
          "companyId",
          "module",
          "entityType",
          "entityId",
        ],
        name: "media_asset_usage_entity_idx",
      },
    ],
  }
);

module.exports = MediaAssetUsage;