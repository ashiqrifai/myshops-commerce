// src/models/OrderShipmentItem.js

const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const OrderShipmentItem =
    sequelize.define(
      "OrderShipmentItem",
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
  
        orderShipmentId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        orderItemId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        productVariantId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        sku: {
          type:
            DataTypes.STRING(
              180
            ),
  
          allowNull:
            false,
        },
  
        quantity: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
        },
      },
      {
        tableName:
          "order_shipment_items",
  
        timestamps:
          true,
  
        indexes: [
          {
            name:
              "ix_osi_shipment",
  
            fields: [
              "companyId",
              "orderShipmentId",
            ],
          },
  
          {
            name:
              "ix_osi_order_item",
  
            fields: [
              "companyId",
              "orderItemId",
            ],
          },
  
          {
            name:
              "ix_osi_variant",
  
            fields: [
              "companyId",
              "productVariantId",
            ],
          },
        ],
      }
    );
  
  module.exports =
    OrderShipmentItem;