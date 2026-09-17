// src/models/OrderShipmentAllocation.js

const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const OrderShipmentAllocation =
    sequelize.define(
      "OrderShipmentAllocation",
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
  
        orderShipmentItemId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        inventoryLocationId: {
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
  
        quantityAllocated: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
        },
  
        quantityFulfilled: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
  
          defaultValue:
            0,
        },
  
        status: {
          type:
            DataTypes.ENUM(
              "RESERVED",
              "RELEASED",
              "FULFILLED",
              "CANCELLED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "RESERVED",
        },
      },
      {
        tableName:
          "order_shipment_allocations",
  
        timestamps:
          true,
  
        indexes: [
          {
            name:
              "ix_osa_shipment",
  
            fields: [
              "companyId",
              "orderShipmentId",
            ],
          },
  
          {
            name:
              "ix_osa_item",
  
            fields: [
              "companyId",
              "orderShipmentItemId",
            ],
          },
  
          {
            name:
              "ix_osa_location_variant",
  
            fields: [
              "companyId",
              "inventoryLocationId",
              "productVariantId",
            ],
          },
        ],
      }
    );
  
  module.exports =
    OrderShipmentAllocation;