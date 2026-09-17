const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderAddress = sequelize.define("OrderAddress", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  orderId: { type: DataTypes.UUID, allowNull: false },
  addressType: { type: DataTypes.ENUM("SHIPPING", "BILLING"), allowNull: false, defaultValue: "SHIPPING" },
  firstName: { type: DataTypes.STRING(100), allowNull: false },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  email: { type: DataTypes.STRING(200), allowNull: true },
  mobile: { type: DataTypes.STRING(50), allowNull: false },
  countryCode: { type: DataTypes.STRING(2), allowNull: false, defaultValue: "AE" },
  country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "United Arab Emirates" },
  emirate: { type: DataTypes.STRING(100), allowNull: true },
  city: { type: DataTypes.STRING(120), allowNull: true },
  area: { type: DataTypes.STRING(160), allowNull: true },
  addressLine1: { type: DataTypes.STRING(500), allowNull: true },
  addressLine2: { type: DataTypes.STRING(500), allowNull: true },
  landmark: { type: DataTypes.STRING(250), allowNull: true },
  deliveryInstructions: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "order_addresses",
  timestamps: true,
  indexes: [
    { fields: ["companyId", "orderId"] },
    { fields: ["orderId", "addressType"] },
  ],
});

module.exports = OrderAddress;
