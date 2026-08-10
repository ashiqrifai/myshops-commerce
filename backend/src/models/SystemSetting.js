const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SystemSetting = sequelize.define(
  "SystemSetting",
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

    group: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    key: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    label: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    defaultValue: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    dataType: {
      type: DataTypes.ENUM(
        "STRING",
        "NUMBER",
        "BOOLEAN",
        "COLOR",
        "IMAGE",
        "URL",
        "EMAIL",
        "JSON",
        "SELECT"
      ),
      allowNull: false,
      defaultValue: "STRING",
    },

    options: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    channel: {
      type: DataTypes.ENUM(
        "GLOBAL",
        "ADMIN",
        "WEBSITE",
        "KIOSK"
      ),
      allowNull: false,
      defaultValue: "GLOBAL",
    },

    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    isEditable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "system_settings",
    indexes: [
      {
        unique: true,
        fields: ["companyId", "channel", "group", "key"],
        name: "system_settings_company_channel_group_key_unique",
      },
      {
        fields: ["companyId", "channel", "isActive"],
      },
      {
        fields: ["companyId", "group", "displayOrder"],
      },
      {
        fields: ["companyId", "isPublic", "isActive"],
      },
    ],
  }
);

module.exports = SystemSetting;