const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderStatusHistory = sequelize.define("OrderStatusHistory", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  orderId: { type: DataTypes.UUID, allowNull: false },
  statusType: { type: DataTypes.ENUM("ORDER", "PAYMENT", "FULFILLMENT"), allowNull: false },
  fromStatus: { type: DataTypes.STRING(80), allowNull: true },
  toStatus: { type: DataTypes.STRING(80), allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: true },
  changedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: "order_status_history",
  timestamps: true,
  indexes: [
    { fields: ["companyId", "orderId"] },
    { fields: ["orderId", "statusType"] },
  ],
});

module.exports = OrderStatusHistory;
