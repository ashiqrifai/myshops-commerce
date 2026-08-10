const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CustomerRefreshToken = sequelize.define("CustomerRefreshToken", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  tokenId: { type: DataTypes.UUID, allowNull: false, unique: true },
  tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
  replacedByTokenId: { type: DataTypes.UUID, allowNull: true },
  ipAddress: { type: DataTypes.STRING(100), allowNull: true },
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  deviceId: { type: DataTypes.STRING(200), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "customer_refresh_tokens",
  indexes: [
    { fields: ["customerId", "isActive"] },
    { fields: ["expiresAt"] },
    { fields: ["deviceId"] },
  ],
});

module.exports = CustomerRefreshToken;
