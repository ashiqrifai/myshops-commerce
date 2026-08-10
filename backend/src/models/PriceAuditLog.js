const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize = require(
    "../config/database"
  );
  
  const PriceAuditLog =
    sequelize.define(
      "PriceAuditLog",
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
  
        priceListId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        productVariantId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        productVariantPriceId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        action: {
          type: DataTypes.ENUM(
            "CREATE",
            "UPDATE",
            "ACTIVATE",
            "DEACTIVATE",
            "DELETE"
          ),
          allowNull: false,
        },
  
        oldValues: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
  
        newValues: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
  
        changedFields: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
  
        changedBy: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        ipAddress: {
          type:
            DataTypes.STRING(100),
          allowNull: true,
        },
  
        userAgent: {
          type:
            DataTypes.STRING(1000),
          allowNull: true,
        },
      },
      {
        tableName:
          "price_audit_logs",
  
        timestamps: true,
  
        updatedAt: false,
  
        indexes: [
          {
            fields: [
              "companyId",
              "productVariantId",
              "createdAt",
            ],
          },
  
          {
            fields: [
              "companyId",
              "priceListId",
              "createdAt",
            ],
          },
  
          {
            fields: [
              "companyId",
              "productVariantPriceId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "changedBy",
              "createdAt",
            ],
          },
        ],
      }
    );
  
  module.exports =
    PriceAuditLog;