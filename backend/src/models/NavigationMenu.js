const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize = require(
    "../config/database"
  );
  
  const NavigationMenu =
    sequelize.define(
      "NavigationMenu",
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
  
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
  
        code: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
  
        channel: {
          type: DataTypes.ENUM(
            "WEBSITE",
            "KIOSK",
            "BOTH"
          ),
          allowNull: false,
          defaultValue:
            "WEBSITE",
        },
  
        menuType: {
          type: DataTypes.ENUM(
            "SIMPLE",
            "DROPDOWN",
            "MEGA_MENU"
          ),
          allowNull: false,
          defaultValue:
            "MEGA_MENU",
        },
  
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
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
          "navigation_menus",
  
        timestamps: true,
  
        indexes: [
          {
            unique: true,
            name:
              "uq_navigation_menus_company_code",
            fields: [
              "companyId",
              "code",
            ],
          },
          {
            name:
              "ix_navigation_menus_company_channel",
            fields: [
              "companyId",
              "channel",
            ],
          },
          {
            name:
              "ix_navigation_menus_active",
            fields: [
              "companyId",
              "isActive",
            ],
          },
        ],
      }
    );
  
  module.exports =
    NavigationMenu;