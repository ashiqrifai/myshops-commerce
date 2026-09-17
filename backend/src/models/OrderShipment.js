// src/models/OrderShipment.js

const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const OrderShipment =
    sequelize.define(
      "OrderShipment",
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
  
        orderId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        deliveryZoneId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        shipmentNumber: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        deliveryZoneCode: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        deliveryLabel: {
          type:
            DataTypes.STRING(
              250
            ),
  
          allowNull:
            true,
        },
  
        deliveryMethod: {
          type:
            DataTypes.ENUM(
              "STANDARD",
              "EXPRESS",
              "PICKUP",
              "DIRECT_DELIVERY"
            ),
  
          allowNull:
            false,
        },
  
        deliveryHours: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        deliveryMinDays: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        deliveryMaxDays: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        deliveryAmount: {
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
              "PENDING",
              "ALLOCATED",
              "READY",
              "DISPATCHED",
              "DELIVERED",
              "CANCELLED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "PENDING",
        },
  
        cityCode: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        notes: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
      },
      {
        tableName:
          "order_shipments",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            name:
              "uq_order_shipment_number",
  
            fields: [
              "companyId",
              "shipmentNumber",
            ],
          },
  
          {
            name:
              "ix_order_shipments_order",
  
            fields: [
              "companyId",
              "orderId",
            ],
          },
  
          {
            name:
              "ix_order_shipments_status",
  
            fields: [
              "companyId",
              "status",
            ],
          },
        ],
      }
    );
  
  module.exports =
    OrderShipment;