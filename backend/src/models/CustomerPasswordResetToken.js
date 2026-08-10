const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CustomerPasswordResetToken = sequelize.define("CustomerPasswordResetToken", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "customer_password_reset_tokens",
  indexes: [
    { fields: ["customerId"] },
    { fields: ["expiresAt"] },
  ],
});

module.exports = CustomerPasswordResetToken;
