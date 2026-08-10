const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CmsPageSection = sequelize.define(
  "CmsPageSection",
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

    cmsPageId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    sectionTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    visibility: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        desktop: true,
        tablet: true,
        mobile: true,
        kiosk: true,
      },
    },

    publishStartAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    publishEndAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "cms_page_sections",

    indexes: [
      {
        unique: true,
        fields: ["cmsPageId", "code"],
        name: "cms_page_sections_page_code_unique",
      },
      {
        fields: ["companyId", "cmsPageId", "displayOrder"],
      },
      {
        fields: ["companyId", "sectionTypeId"],
      },
      {
        fields: ["companyId", "isEnabled", "isActive"],
      },
    ],
  }
);

module.exports = CmsPageSection;