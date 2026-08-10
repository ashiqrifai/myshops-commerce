const {
  DataTypes,
} = require("sequelize");

const sequelize = require(
  "../config/database"
);

const Brand = sequelize.define(
  "Brand",
  {
    id: {
      type:
        DataTypes.UUID,

      defaultValue:
        DataTypes.UUIDV4,

      primaryKey:
        true,
    },

    companyId: {
      type:
        DataTypes.UUID,

      allowNull:
        false,
    },

    name: {
      type:
        DataTypes.STRING(250),

      allowNull:
        false,
    },

    code: {
      type:
        DataTypes.STRING(100),

      allowNull:
        false,
    },

    slug: {
      type:
        DataTypes.STRING(250),

      allowNull:
        false,
    },

    description: {
      type:
        DataTypes.TEXT,

      allowNull:
        true,
    },

    logoAssetId: {
      type:
        DataTypes.UUID,

      allowNull:
        true,
    },

    bannerAssetId: {
      type:
        DataTypes.UUID,

      allowNull:
        true,
    },

    websiteUrl: {
      type:
        DataTypes.STRING(1000),

      allowNull:
        true,
    },

    countryOfOrigin: {
      type:
        DataTypes.STRING(150),

      allowNull:
        true,
    },

    isActive: {
      type:
        DataTypes.BOOLEAN,

      allowNull:
        false,

      defaultValue:
        true,
    },

    isFeatured: {
      type:
        DataTypes.BOOLEAN,

      allowNull:
        false,

      defaultValue:
        false,
    },

    sortOrder: {
      type:
        DataTypes.INTEGER,

      allowNull:
        false,

      defaultValue:
        0,
    },

    metaTitle: {
      type:
        DataTypes.STRING(250),

      allowNull:
        true,
    },

    metaDescription: {
      type:
        DataTypes.STRING(500),

      allowNull:
        true,
    },

    metaKeywords: {
      type:
        DataTypes.TEXT,

      allowNull:
        true,
    },

    createdBy: {
      type:
        DataTypes.UUID,

      allowNull:
        true,
    },

    updatedBy: {
      type:
        DataTypes.UUID,

      allowNull:
        true,
    },
  },
  {
    tableName:
      "brands",

    timestamps:
      true,

    indexes: [
      {
        unique:
          true,

        fields: [
          "companyId",
          "code",
        ],
      },

      {
        unique:
          true,

        fields: [
          "companyId",
          "slug",
        ],
      },

      {
        fields: [
          "companyId",
          "isActive",
        ],
      },

      {
        fields: [
          "companyId",
          "isFeatured",
        ],
      },

      {
        fields: [
          "companyId",
          "sortOrder",
        ],
      },
    ],
  }
);

module.exports = Brand;
