const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CmsPage = sequelize.define(
  "CmsPage",
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

    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    pageType: {
      type: DataTypes.ENUM(
        "HOME",
        "CATEGORY",
        "BRAND",
        "PRODUCT",
        "SEARCH",
        "CART",
        "CHECKOUT",
        "OFFERS",
        "LANDING",
        "CUSTOM"
      ),
      allowNull: false,
      defaultValue: "CUSTOM",
    },

    channel: {
      type: DataTypes.ENUM(
        "WEBSITE",
        "KIOSK",
        "BOTH"
      ),
      allowNull: false,
      defaultValue: "WEBSITE",
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PUBLISHED",
        "UNPUBLISHED",
        "ARCHIVED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    seoTitle: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    seoKeywords: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    layoutSettings: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    publishStartAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    publishEndAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isDefault: {
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
    tableName: "cms_pages",

    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
        name: "cms_pages_company_code_unique",
      },
      {
        unique: true,
        fields: ["companyId", "channel", "slug"],
        name: "cms_pages_company_channel_slug_unique",
      },
      {
        fields: ["companyId", "pageType", "status"],
      },
      {
        fields: ["companyId", "channel", "isActive"],
      },
      {
        fields: ["companyId", "isDefault"],
      },
    ],
  }
);

module.exports = CmsPage;