const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize = require(
    "../config/database"
  );
  
  const NavigationItem =
    sequelize.define(
      "NavigationItem",
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
  
        navigationMenuId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        label: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
  
        itemType: {
          type: DataTypes.ENUM(
            "CUSTOM_LINK",
            "CATEGORY",
            "BRAND",
            "PRODUCT",
            "COLLECTION",
            "CMS_PAGE",
            "DROPDOWN",
            "MEGA_MENU",
            "HEADING",
            "PROMOTION"
          ),
          allowNull: false,
          defaultValue:
            "CUSTOM_LINK",
        },
  
        referenceId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
  
        icon: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
  
        mediaAssetId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
  
        badgeText: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
  
        badgeColor: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
  
        displayOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
  
        depth: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
  
        columnNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
  
        openInNewTab: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        desktopVisible: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
  
        mobileVisible: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
  
        isFeatured: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        settings: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
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
        tableName:
          "navigation_items",
  
        timestamps: true,
  
        indexes: [
          {
            name:
              "ix_navigation_items_menu",
            fields: [
              "navigationMenuId",
            ],
          },
          {
            name:
              "ix_navigation_items_parent",
            fields: [
              "parentId",
            ],
          },
          {
            name:
              "ix_navigation_items_order",
            fields: [
              "navigationMenuId",
              "parentId",
              "displayOrder",
            ],
          },
          {
            name:
              "ix_navigation_items_company_active",
            fields: [
              "companyId",
              "isActive",
            ],
          },
          {
            name:
              "ix_navigation_items_media_asset",
            fields: [
              "mediaAssetId",
            ],
          },
        ],
  
        validate: {
          validateColumnNumber() {
            if (
              this.columnNumber !==
                null &&
              this.columnNumber < 1
            ) {
              throw new Error(
                "Column number must be at least 1."
              );
            }
          },
  
          validateDepth() {
            if (
              this.depth !== null &&
              this.depth < 0
            ) {
              throw new Error(
                "Navigation depth cannot be negative."
              );
            }
  
            if (
              this.depth !== null &&
              this.depth > 4
            ) {
              throw new Error(
                "Navigation items cannot exceed four nested levels."
              );
            }
          },
        },
      }
    );
  
  module.exports =
    NavigationItem;