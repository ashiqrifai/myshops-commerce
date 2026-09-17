const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const ProtectionSchemeAssignment =
    sequelize.define(
      "ProtectionSchemeAssignment",
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
  
        schemeId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        scopeType: {
          type:
            DataTypes.ENUM(
              "CATEGORY",
              "BRAND",
              "PRODUCT"
            ),
  
          allowNull:
            false,
        },
  
        categoryId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        brandId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        productId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        percentageOverride: {
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
  
        fixedAmountOverride: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
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
          "protection_scheme_assignments",
  
        timestamps:
          true,
  
        indexes: [
          {
            fields: [
              "companyId",
              "schemeId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "scopeType",
            ],
          },
  
          {
            fields: [
              "companyId",
              "productId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "brandId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "categoryId",
            ],
          },
        ],
  
        validate: {
          validateScope() {
            if (
              this.scopeType ===
              "PRODUCT"
            ) {
              if (
                !this.productId
              ) {
                throw new Error(
                  "productId is required for a PRODUCT protection assignment."
                );
              }
  
              if (
                this.brandId ||
                this.categoryId
              ) {
                throw new Error(
                  "PRODUCT protection assignments may only contain productId."
                );
              }
            }
  
            if (
              this.scopeType ===
              "BRAND"
            ) {
              if (
                !this.brandId
              ) {
                throw new Error(
                  "brandId is required for a BRAND protection assignment."
                );
              }
  
              if (
                this.productId ||
                this.categoryId
              ) {
                throw new Error(
                  "BRAND protection assignments may only contain brandId."
                );
              }
            }
  
            if (
              this.scopeType ===
              "CATEGORY"
            ) {
              if (
                !this.categoryId
              ) {
                throw new Error(
                  "categoryId is required for a CATEGORY protection assignment."
                );
              }
  
              if (
                this.productId ||
                this.brandId
              ) {
                throw new Error(
                  "CATEGORY protection assignments may only contain categoryId."
                );
              }
            }
          },
        },
      }
    );
  
  module.exports =
    ProtectionSchemeAssignment;