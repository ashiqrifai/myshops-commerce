const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define("Order", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  orderNumber: { type: DataTypes.STRING(80), allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: true },
  channelCode: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "WEBSITE" },
  customerFirstName: { type: DataTypes.STRING(100), allowNull: false },
  customerLastName: { type: DataTypes.STRING(100), allowNull: true },
  customerEmail: { type: DataTypes.STRING(200), allowNull: false },
  customerPhone: { type: DataTypes.STRING(50), allowNull: false },
  currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "AED" },
  subtotal: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
  deliveryAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
  grandTotal: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
  couponCode: { type: DataTypes.STRING(100), allowNull: true },
  deliveryMethod: { type: DataTypes.ENUM("STANDARD", "EXPRESS", "PICKUP"), allowNull: false, defaultValue: "STANDARD" },
  paymentMethod: { type: DataTypes.ENUM("COD", "CARD", "TABBY", "TAMARA"), allowNull: false, defaultValue: "COD" },
  paymentStatus: { type: DataTypes.ENUM("PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"), allowNull: false, defaultValue: "PENDING" },
  orderStatus: { type: DataTypes.ENUM("PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"), allowNull: false, defaultValue: "PENDING" },
  zohoSalesOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  
  zohoSalesOrderNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  
  zohoSyncStatus: {
    type: DataTypes.ENUM(
      "NOT_POSTED",
      "PENDING",
      "PROCESSING",
      "POSTED",
      "FAILED"
    ),
    allowNull: false,
    defaultValue: "NOT_POSTED",
  },
  
  zohoSyncError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  zohoSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fulfillmentStatus: { type: DataTypes.ENUM("UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"), allowNull: false, defaultValue: "UNFULFILLED" },
  notes: { type: DataTypes.TEXT, allowNull: true },
  placedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  createdBy: { type: DataTypes.UUID, allowNull: true },
  updatedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "orders",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["companyId", "orderNumber"] },
    { fields: ["companyId", "customerId"] },
    { fields: ["companyId", "orderStatus"] },
    { fields: ["companyId", "paymentStatus"] },
    { fields: ["companyId", "placedAt"] },
    {
      fields: [
        "companyId",
        "zohoSalesOrderId",
      ],
    },
    
    {
      fields: [
        "companyId",
        "zohoSyncStatus",
      ],
    },
  ],
  hooks: {
    beforeValidate(order) {
      if (order.customerEmail) order.customerEmail = order.customerEmail.trim().toLowerCase();
      if (order.customerPhone) order.customerPhone = order.customerPhone.trim();
      if (order.couponCode) order.couponCode = order.couponCode.trim().toUpperCase();
    },
  },
});

module.exports = Order;
