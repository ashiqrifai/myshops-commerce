const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const PaymentException =
  sequelize.define(
    "PaymentException",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      orderPaymentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      exceptionCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      provider: {
        type: DataTypes.ENUM(
          "NETWORK_INTERNATIONAL",
          "TAMARA",
          "TABBY"
        ),
        allowNull: false,
      },

      providerState: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM(
          "OPEN",
          "RETRYING",
          "RESOLVED",
          "REFUND_REQUIRED",
          "REFUNDED",
          "MANUAL_REVIEW"
        ),
        allowNull: false,
        defaultValue: "OPEN",
      },

      severity: {
        type: DataTypes.ENUM(
          "LOW",
          "MEDIUM",
          "HIGH",
          "CRITICAL"
        ),
        allowNull: false,
        defaultValue: "HIGH",
      },

      title: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      amount: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
      },

      currencyCode: {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: "AED",
      },

      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      lastRetryAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      resolutionNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      tableName: "payment_exceptions",
      timestamps: true,

      indexes: [
        {
          fields: [
            "companyId",
            "status",
          ],
        },
        {
          fields: [
            "companyId",
            "orderId",
          ],
        },
        {
          fields: [
            "companyId",
            "exceptionCode",
          ],
        },
        {
          fields: [
            "companyId",
            "provider",
          ],
        },
        {
          unique: true,
          name: "uq_payment_exception_order_code",
          fields: [
            "companyId",
            "orderId",
            "exceptionCode",
          ],
        },
      ],
    }
  );

module.exports =
  PaymentException;
