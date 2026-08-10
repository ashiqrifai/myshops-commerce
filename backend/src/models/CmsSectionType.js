const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CmsSectionType = sequelize.define(
  "CmsSectionType",
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

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    category: {
      type: DataTypes.ENUM(
        "GLOBAL",
        "HERO",
        "CATALOG",
        "MARKETING",
        "AI",
        "KIOSK"
      ),
      allowNull: false,
      defaultValue: "MARKETING",
    },

    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    supportedChannels: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: ["WEBSITE"],
    },

    defaultSettings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    defaultContent: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    validationSchema: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    isSystemType: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "cms_section_types",

    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
        name: "cms_section_types_company_code_unique",
      },
      {
        fields: ["companyId", "category", "isActive"],
      },
      {
        fields: ["companyId", "displayOrder"],
      },
    ],
  }
);

module.exports = CmsSectionType;