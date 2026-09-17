const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventoryBalance = sequelize.define(
  "InventoryBalance",
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
    inventoryLocationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productVariantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantityOnHand: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    quantityReserved: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
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
    tableName: "inventory_balances",
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: "uq_inventory_balance_location_variant",
        fields: [
          "companyId",
          "inventoryLocationId",
          "productVariantId",
        ],
      },
      {
        fields: ["companyId", "productVariantId"],
      },
      {
        fields: ["companyId", "inventoryLocationId"],
      },
    ],
    validate: {
      validQuantities() {
        const onHand = Number(this.quantityOnHand || 0);
        const reserved = Number(this.quantityReserved || 0);

        if (onHand < 0) {
          throw new Error("On-hand quantity cannot be negative.");
        }

        if (reserved < 0) {
          throw new Error("Reserved quantity cannot be negative.");
        }

        if (reserved > onHand) {
          throw new Error(
            "Reserved quantity cannot exceed on-hand quantity."
          );
        }
      },
    },
  }
);

module.exports = InventoryBalance;
