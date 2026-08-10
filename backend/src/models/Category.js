const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize = require(
    "../config/database"
  );
  
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue:
          DataTypes.UUIDV4,
        primaryKey: true,
      },
  
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
  
      parentCategoryId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
  
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Category name is required.",
          },
        },
      },
  
      slug: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
  
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
  
      shortDescription: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
  
      categoryPath: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
  
      categoryPathIds: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
  
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
  
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
  
      thumbnailAssetId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
  
      imageAssetId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
  
      bannerAssetId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
  
      landingPageId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
  
      iconName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
  
      iconUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
  
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      showInMenu: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      showOnHome: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
  
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
  
      isSearchable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      metaTitle: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
  
      metaDescription: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
  
      metaKeywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
  
      canonicalUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
  
      robotsIndex: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      robotsFollow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
  
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "categories",
  
      indexes: [
        {
          unique: true,
          fields: [
            "companyId",
            "slug",
          ],
          name: "categories_company_slug_unique",
        },
        {
          fields: [
            "companyId",
            "parentCategoryId",
          ],
          name: "categories_company_parent_idx",
        },
        {
          fields: [
            "companyId",
            "isActive",
          ],
          name: "categories_company_active_idx",
        },
        {
          fields: [
            "companyId",
            "showInMenu",
          ],
          name: "categories_company_menu_idx",
        },
        {
          fields: [
            "companyId",
            "showOnHome",
          ],
          name: "categories_company_home_idx",
        },
        {
          fields: [
            "companyId",
            "isFeatured",
          ],
          name: "categories_company_featured_idx",
        },
        {
          fields: [
            "companyId",
            "sortOrder",
          ],
          name: "categories_company_sort_idx",
        },
      ],
    }
  );
  
  module.exports = Category;