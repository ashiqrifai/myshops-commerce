const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );


const KioskOrder =
  sequelize.define(
    "KioskOrder",
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

      inventoryLocationId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      kioskDeviceId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      kioskProfileId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      fulfillmentMode: {
        type:
          DataTypes.ENUM(
            "IN_STORE",
            "DELIVERY",
            "MIXED"
          ),

        allowNull:
          false,

        defaultValue:
          "IN_STORE",
      },

      deliveryStatus: {
        type:
          DataTypes.ENUM(
            "NOT_REQUIRED",
            "REQUIRED",
            "SCHEDULED",
            "DISPATCHED",
            "DELIVERED",
            "CANCELLED"
          ),

        allowNull:
          false,

        defaultValue:
          "NOT_REQUIRED",
      },

      collectionStatus: {
        type:
          DataTypes.ENUM(
            "NOT_REQUIRED",
            "PENDING",
            "READY",
            "COLLECTED",
            "CANCELLED"
          ),

        allowNull:
          false,

        defaultValue:
          "PENDING",
      },

      deliveryScheduledAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      notes: {
        type:
          DataTypes.TEXT,

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
        "kiosk_orders",

      timestamps:
        true,

      indexes: [
        {
          unique:
            true,

          fields: [
            "companyId",
            "orderId",
          ],

          name:
            "uq_kiosk_orders_company_order",
        },

        {
          fields: [
            "companyId",
            "inventoryLocationId",
            "createdAt",
          ],

          name:
            "ix_kiosk_orders_location_created",
        },

        {
          fields: [
            "companyId",
            "kioskDeviceId",
            "createdAt",
          ],

          name:
            "ix_kiosk_orders_device_created",
        },

        {
          fields: [
            "companyId",
            "deliveryStatus",
          ],
        },

        {
          fields: [
            "companyId",
            "collectionStatus",
          ],
        },
      ],
    }
  );


module.exports =
  KioskOrder;
