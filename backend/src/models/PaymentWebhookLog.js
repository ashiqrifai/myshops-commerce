const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PaymentWebhookLog =
    sequelize.define(
      "PaymentWebhookLog",
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
            true,
        },
  
        orderId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        orderPaymentId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        provider: {
          type:
            DataTypes.STRING(
              50
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "TAMARA",
        },
  
        providerReference: {
          type:
            DataTypes.STRING(
              150
            ),
  
          allowNull:
            true,
        },
  
        eventType: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        providerStatus: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        processingStatus: {
          type:
            DataTypes.ENUM(
              "RECEIVED",
              "PROCESSED",
              "FAILED",
              "IGNORED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "RECEIVED",
        },
  
        payload: {
          type:
            DataTypes.JSONB,
  
          allowNull:
            true,
        },
  
        responseStatus: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        errorMessage: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        receivedAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            false,
  
          defaultValue:
            DataTypes.NOW,
        },
  
        processedAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
      },
      {
        tableName:
          "payment_webhook_logs",
  
        timestamps:
          true,
  
        indexes: [
          {
            fields: [
              "provider",
              "providerReference",
            ],
          },
  
          {
            fields: [
              "orderId",
            ],
          },
  
          {
            fields: [
              "orderPaymentId",
            ],
          },
  
          {
            fields: [
              "eventType",
            ],
          },
  
          {
            fields: [
              "processingStatus",
            ],
          },
  
          {
            fields: [
              "receivedAt",
            ],
          },
        ],
      }
    );
  
  module.exports =
    PaymentWebhookLog;