const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize = require(
    "../config/database"
  );
  
  const ProductVariantPrice =
    sequelize.define(
      "ProductVariantPrice",
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
          allowNull: false,
        },
  
        productVariantId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        regularPrice: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
          allowNull: false,
        },
  
        sellingPrice: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
          allowNull: false,
        },
  
        compareAtPrice: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
          allowNull: true,
        },
  
        costPrice: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
          allowNull: true,
        },
  
        minimumQuantity: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
          allowNull: false,
          defaultValue: 1,
        },
  
        maximumQuantity: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
          allowNull: true,
        },
  
        validFrom: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        validUntil: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        priority: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 100,
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
          "product_variant_prices",
  
        timestamps: true,
  
        indexes: [
            {
                unique: true,
                name:
                  "uq_variant_price_tier_schedule",
                fields: [
                  "companyId",
                  "priceListId",
                  "productVariantId",
                  "minimumQuantity",
                  "validFrom",
                  "validUntil",
                ],
              },
  
          {
            fields: [
              "companyId",
              "productVariantId",
              "isActive",
            ],
          },
  
          {
            fields: [
              "companyId",
              "priceListId",
              "isActive",
            ],
          },
  
          {
            fields: [
              "companyId",
              "validFrom",
              "validUntil",
            ],
          },
  
          {
            fields: [
              "companyId",
              "priority",
            ],
          },
        ],
      }
    );
  
  module.exports =
    ProductVariantPrice;