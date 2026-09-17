const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventoryMovement = sequelize.define(
  "InventoryMovement",
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

    productVariantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    inventoryLocationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    movementType: {
      type: DataTypes.ENUM(
        "SALE",
        "RETURN",
        "TRANSFER_OUT",
        "TRANSFER_IN",
        "SNAPSHOT_ADJUSTMENT"
      ),
      allowNull: false,
    },

    quantityChange: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    quantityBefore: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    quantityAfter: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },

    sourceSystem: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "ZOHO",
    },

    sourceEventId: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    lineKey: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    referenceType: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    referenceId: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    referenceNumber: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    transactionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    payload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "inventory_movements",
    timestamps: true,
    updatedAt: false,

    indexes: [
      {
        unique: true,
        name: "uq_inventory_movement_source_event_line",
        fields: [
          "companyId",
          "sourceSystem",
          "sourceEventId",
          "lineKey",
        ],
      },
      {
        fields: ["companyId", "productVariantId", "createdAt"],
      },
      {
        fields: ["companyId", "inventoryLocationId", "createdAt"],
      },
    ],
  }
);

module.exports = InventoryMovement;
