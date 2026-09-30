const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const KioskFulfillmentAssignment =
  sequelize.define(
    "KioskFulfillmentAssignment",
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

      orderItemId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      sellingLocationId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      fulfillmentLocationId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      productVariantId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      sku: {
        type:
          DataTypes.STRING(180),

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

      status: {
        type:
          DataTypes.ENUM(
            "AWAITING_ASSIGNMENT",
            "RESERVED",
            "PREPARING",
            "READY",
            "DISPATCHED",
            "DELIVERED",
            "CANCELLED"
          ),

        allowNull:
          false,

        defaultValue:
          "AWAITING_ASSIGNMENT",
      },

      assignedBy: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      assignedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      reservedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      readyAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      dispatchedAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      deliveredAt: {
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
    },
    {
      tableName:
        "kiosk_fulfillment_assignments",

      timestamps:
        true,

      indexes: [
        {
          unique:
            true,

          fields: [
            "companyId",
            "orderItemId",
          ],

          name:
            "uq_kiosk_fulfillment_order_item",
        },

        {
          name:
            "idx_kfa_selling_status",

          fields: [
            "companyId",
            "sellingLocationId",
            "status",
          ],
        },

        {
          name:
            "idx_kfa_fulfill_status",

          fields: [
            "companyId",
            "fulfillmentLocationId",
            "status",
          ],
        },

        {
          name:
            "idx_kfa_order",

          fields: [
            "companyId",
            "orderId",
          ],
        },
      ],
    }
  );

module.exports =
  KioskFulfillmentAssignment;
