const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const ProtectionScheme =
    sequelize.define(
      "ProtectionScheme",
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
  
        code: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        name: {
          type:
            DataTypes.STRING(
              200
            ),
  
          allowNull:
            false,
        },
  
        schemeType: {
          type:
            DataTypes.ENUM(
              "EXTENDED_WARRANTY",
              "DAMAGE_PROTECTION"
            ),
  
          allowNull:
            false,
        },
  
        description: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        durationMonths: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
  
          validate: {
            min:
              1,
          },
        },
  
        pricingMethod: {
          type:
            DataTypes.ENUM(
              "PERCENTAGE",
              "FIXED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "PERCENTAGE",
        },
  
        percentage: {
          type:
            DataTypes.DECIMAL(
              10,
              4
            ),
  
          allowNull:
            true,
  
          validate: {
            min:
              0,
  
            max:
              100,
          },
        },
  
        fixedAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            true,
  
          validate: {
            min:
              0,
          },
        },
  
        minimumProductAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            true,
        },
  
        maximumProductAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            true,
        },

        zohoItemId: {
          type:
            DataTypes.STRING(
              100
            ),
        
          allowNull:
            true,
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
  
        coverageStartMode: {
          type:
            DataTypes.ENUM(
              "FROM_PURCHASE_DATE",
              "AFTER_MANUFACTURER_WARRANTY"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "AFTER_MANUFACTURER_WARRANTY",
        },
  
        termsAndConditions: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        sortOrder: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            0,
        },
  
        isActive: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        validFrom: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
  
        validUntil: {
          type:
            DataTypes.DATE,
  
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
          "protection_schemes",
  
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
            fields: [
              "companyId",
              "zohoItemId",
            ],
          },
          {
            fields: [
              "companyId",
              "schemeType",
              "isActive",
            ],
          },
  
          {
            fields: [
              "companyId",
              "sortOrder",
            ],
          },
        ],
  
        hooks: {
          beforeValidate(
            scheme
          ) {
            if (
              scheme.code
            ) {
              scheme.code =
                String(
                  scheme.code
                )
                  .trim()
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9]+/g,
                    "_"
                  )
                  .replace(
                    /^_+|_+$/g,
                    ""
                  );
            }
  
            if (
              scheme.name
            ) {
              scheme.name =
                String(
                  scheme.name
                ).trim();
            }
          },
        },
  
        validate: {
          pricingConfiguration() {
            if (
              this.pricingMethod ===
              "PERCENTAGE"
            ) {
              const percentage =
                Number(
                  this.percentage
                );
  
              if (
                !Number.isFinite(
                  percentage
                ) ||
                percentage <=
                  0
              ) {
                throw new Error(
                  "Percentage must be greater than zero for percentage-based protection schemes."
                );
              }
            }
  
            if (
              this.pricingMethod ===
              "FIXED"
            ) {
              const fixedAmount =
                Number(
                  this.fixedAmount
                );
  
              if (
                !Number.isFinite(
                  fixedAmount
                ) ||
                fixedAmount <=
                  0
              ) {
                throw new Error(
                  "Fixed amount must be greater than zero for fixed-price protection schemes."
                );
              }
            }
  
            if (
              this.minimumProductAmount !==
                null &&
              this.maximumProductAmount !==
                null &&
              Number(
                this.maximumProductAmount
              ) <
                Number(
                  this.minimumProductAmount
                )
            ) {
              throw new Error(
                "Maximum product amount cannot be lower than minimum product amount."
              );
            }
          },
        },
      }
    );
  
  module.exports =
    ProtectionScheme;