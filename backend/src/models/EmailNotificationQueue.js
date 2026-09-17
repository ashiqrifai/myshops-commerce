const {
  DataTypes,
} =
  require(
    "sequelize"
  );

const sequelize =
  require(
    "../config/database"
  );

const EmailNotificationQueue =
  sequelize.define(
    "EmailNotificationQueue",
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

      notificationType: {
        type:
          DataTypes.ENUM(
            "ORDER_CONFIRMED",
            "PAYMENT_SUCCESSFUL",
            "READY_FOR_PICKUP",
            "ORDER_DISPATCHED",
            "ORDER_DELIVERED",
            "ORDER_CANCELLED",
            "REFUND_PROCESSED"
          ),

        allowNull:
          false,
      },

      recipientEmail: {
        type:
          DataTypes.STRING(
            320
          ),

        allowNull:
          false,
      },

      subject: {
        type:
          DataTypes.STRING(
            500
          ),

        allowNull:
          true,
      },

      status: {
        type:
          DataTypes.ENUM(
            "PENDING",
            "PROCESSING",
            "SENT",
            "FAILED",
            "CANCELLED"
          ),

        allowNull:
          false,

        defaultValue:
          "PENDING",
      },

      attempts: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          0,
      },

      maxAttempts: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          5,
      },

      availableAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,

        defaultValue:
          DataTypes.NOW,
      },

      processingStartedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      sentAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      failedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      messageId: {
        type:
          DataTypes.STRING(
            500
          ),

        allowNull:
          true,
      },

      lastError: {
        type:
          DataTypes.TEXT,

        allowNull:
          true,
      },

      metadata: {
        type:
          DataTypes.JSONB,

        allowNull:
          false,

        defaultValue: {},
      },
    },
    {
      tableName:
        "email_notification_queue",

      timestamps:
        true,

      indexes: [
        {
          name:
            "ix_email_notification_queue_status_available",

          fields: [
            "status",
            "availableAt",
          ],
        },

        {
          name:
            "ix_email_notification_queue_order",

          fields: [
            "companyId",
            "orderId",
          ],
        },

        {
          unique:
            true,

          name:
            "uq_email_notification_order_type_recipient",

          fields: [
            "companyId",
            "orderId",
            "notificationType",
            "recipientEmail",
          ],
        },
      ],
    }
  );

module.exports =
  EmailNotificationQueue;
