const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CustomerVerificationToken = sequelize.define("CustomerVerificationToken", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  purpose: { type: DataTypes.ENUM("EMAIL_VERIFICATION", "MOBILE_VERIFICATION"), allowNull: false, defaultValue: "EMAIL_VERIFICATION" },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "customer_verification_tokens",
  indexes: [
    { fields: ["customerId", "purpose"] },
    { fields: ["expiresAt"] },
  ],
});

module.exports = CustomerVerificationToken;
