const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InventoryLocation = sequelize.define(
  "InventoryLocation",
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
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    locationType: {
      type: DataTypes.ENUM("HUB", "STORE", "WAREHOUSE"),
      allowNull: false,
      defaultValue: "STORE",
    },
    countryCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "AE",
    },
    country: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "United Arab Emirates",
    },
    emirate: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    addressLine1: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    addressLine2: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    landmark: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    zohoLocationId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    
    zohoWarehouseId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    
    zohoLastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDeliveryEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isPickupEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pickupLeadTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    pickupInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
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
    tableName: "inventory_locations",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
      },
      {
        fields: ["companyId", "isActive"],
      },
      {
        fields: ["companyId", "locationType"],
      },
      {
        fields: ["companyId", "isDeliveryEnabled"],
      },
      {
        fields: ["companyId", "isPickupEnabled"],
      },
      {
        fields: ["companyId", "emirate", "city", "area"],
      },
    ],
  }
);

module.exports = InventoryLocation;
