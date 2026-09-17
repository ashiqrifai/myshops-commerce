const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize = require(
    "../config/database"
  );
  
  const Collection =
    sequelize.define(
      "Collection",
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
            DataTypes.STRING(
              250
            ),
  
          allowNull:
            false,
  
          validate: {
            notEmpty: {
              msg:
                "Collection name is required.",
            },
          },
        },
  
        slug: {
          type:
            DataTypes.STRING(
              250
            ),
  
          allowNull:
            false,
  
          validate: {
            notEmpty: {
              msg:
                "Collection slug is required.",
            },
          },
        },
  
        description: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        shortDescription: {
          type:
            DataTypes.STRING(
              500
            ),
  
          allowNull:
            true,
        },
  
        collectionType: {
          type:
            DataTypes.ENUM(
              "MANUAL",
              "SMART"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "MANUAL",
        },

        smartRules: {
          type:
            DataTypes.JSONB,

          allowNull:
            true,

          defaultValue:
            null,
        },
  
        sortOrder: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            0,
  
          validate: {
            min:
              0,
          },
        },
  
        thumbnailAssetId: {
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
  
        mobileBannerAssetId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        landingPageId: {
          type:
            DataTypes.UUID,
  
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
  
        showInMenu: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            false,
        },
  
        showOnHome: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            false,
        },
  
        isSearchable: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        showProductCount: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        publishedFrom: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
  
        publishedUntil: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
  
        metaTitle: {
          type:
            DataTypes.STRING(
              250
            ),
  
          allowNull:
            true,
        },
  
        metaDescription: {
          type:
            DataTypes.STRING(
              500
            ),
  
          allowNull:
            true,
        },
  
        metaKeywords: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        canonicalUrl: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        robotsIndex: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        robotsFollow: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        createdBy: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
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
          "collections",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            fields: [
              "companyId",
              "slug",
            ],
  
            name:
              "collections_company_slug_unique",
          },
  
          {
            fields: [
              "companyId",
              "collectionType",
            ],
  
            name:
              "collections_company_type_idx",
          },
  
          {
            fields: [
              "companyId",
              "isActive",
            ],
  
            name:
              "collections_company_active_idx",
          },
  
          {
            fields: [
              "companyId",
              "isFeatured",
            ],
  
            name:
              "collections_company_featured_idx",
          },
  
          {
            fields: [
              "companyId",
              "showInMenu",
            ],
  
            name:
              "collections_company_menu_idx",
          },
  
          {
            fields: [
              "companyId",
              "showOnHome",
            ],
  
            name:
              "collections_company_home_idx",
          },
  
          {
            fields: [
              "companyId",
              "sortOrder",
            ],
  
            name:
              "collections_company_sort_idx",
          },
  
          {
            fields: [
              "companyId",
              "publishedFrom",
              "publishedUntil",
            ],
  
            name:
              "collections_company_publish_idx",
          },
        ],
  
        validate: {
          validPublishingPeriod() {
            if (
              this.publishedFrom &&
              this.publishedUntil &&
              new Date(
                this.publishedUntil
              ).getTime() <
                new Date(
                  this.publishedFrom
                ).getTime()
            ) {
              throw new Error(
                "Published Until cannot be earlier than Published From."
              );
            }
          },
        },
      }
    );
  
  module.exports =
    Collection;