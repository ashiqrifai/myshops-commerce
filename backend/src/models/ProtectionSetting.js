const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const ProtectionSetting =
    sequelize.define(
      "ProtectionSetting",
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
  
        isEnabled: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        minimumEligibleProductAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
  
          defaultValue:
            499,
        },
  
        currencyCode: {
          type:
            DataTypes.STRING(
              3
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "AED",
  
          set(value) {
            this.setDataValue(
              "currencyCode",
              String(
                value ||
                  "AED"
              )
                .trim()
                .toUpperCase()
            );
          },
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
          "protection_settings",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            fields: [
              "companyId",
            ],
          },
        ],
      }
    );
  
  module.exports =
    ProtectionSetting;