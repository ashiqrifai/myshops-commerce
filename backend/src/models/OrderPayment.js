const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderPayment = sequelize.define("OrderPayment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  orderId: { type: DataTypes.UUID, allowNull: false },
  paymentMethod: { type: DataTypes.ENUM("COD", "CARD", "TABBY", "TAMARA"), allowNull: false },
  status: { type: DataTypes.ENUM("PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"), allowNull: false, defaultValue: "PENDING" },
  amount: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
  currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "AED" },
  provider: { type: DataTypes.STRING(100), allowNull: true },
  providerReference: { type: DataTypes.STRING(250), allowNull: true },
  providerPayload: { type: DataTypes.JSONB, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "order_payments",
  timestamps: true,
  indexes: [
    { fields: ["companyId", "orderId"] },
    { fields: ["companyId", "status"] },
    { fields: ["companyId", "providerReference"] },
  ],
});

module.exports = OrderPayment;
