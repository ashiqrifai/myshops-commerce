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

const OrderTrackingOtp =
  sequelize.define(
    "OrderTrackingOtp",
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

      orderNumber: {
        type:
          DataTypes.STRING(
            80
          ),

        allowNull:
          false,
      },

      email: {
        type:
          DataTypes.STRING(
            320
          ),

        allowNull:
          false,
      },

      otpHash: {
        type:
          DataTypes.STRING(
            128
          ),

        allowNull:
          false,
      },

      otpExpiresAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,
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

      resendAvailableAt: {
        type:
          DataTypes.DATE,

        allowNull:
          false,
      },

      verifiedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      accessTokenHash: {
        type:
          DataTypes.STRING(
            128
          ),

        allowNull:
          true,
      },

      accessTokenExpiresAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      revokedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      requestIp: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,
      },

      userAgent: {
        type:
          DataTypes.STRING(
            1000
          ),

        allowNull:
          true,
      },
    },
    {
      tableName:
        "order_tracking_otps",

      timestamps:
        true,

      indexes: [
        {
          name:
            "ix_order_tracking_otps_order",

          fields: [
            "companyId",
            "orderId",
            "createdAt",
          ],
        },

        {
          name:
            "ix_order_tracking_otps_lookup",

          fields: [
            "companyId",
            "orderNumber",
            "email",
            "createdAt",
          ],
        },

        {
          name:
            "ix_order_tracking_otps_access_token",

          fields: [
            "accessTokenHash",
          ],
        },
      ],

      hooks: {
        beforeValidate(
          row
        ) {
          if (
            row.email
          ) {
            row.email =
              String(
                row.email
              )
                .trim()
                .toLowerCase();
          }

          if (
            row.orderNumber
          ) {
            row.orderNumber =
              String(
                row.orderNumber
              )
                .trim()
                .toUpperCase();
          }
        },
      },
    }
  );

module.exports =
  OrderTrackingOtp;
