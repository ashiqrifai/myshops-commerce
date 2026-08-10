const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Customer = sequelize.define("Customer", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  email: { type: DataTypes.STRING(200), allowNull: false, validate: { isEmail: true } },
  mobile: { type: DataTypes.STRING(50), allowNull: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  status: { type: DataTypes.ENUM("PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "LOCKED"), allowNull: false, defaultValue: "ACTIVE" },
  emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  mobileVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  failedLoginAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lockedUntil: { type: DataTypes.DATE, allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true },
  passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
  preferredLanguage: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "en" },
  preferredCurrency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "AED" },
  marketingConsent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: "customers",
  indexes: [
    { unique: true, fields: ["companyId", "email"] },
    { fields: ["companyId", "mobile"] },
    { fields: ["companyId", "status"] },
    { fields: ["companyId", "isActive"] },
  ],
  hooks: {
    beforeValidate(customer) {
      if (customer.email) customer.email = customer.email.trim().toLowerCase();
      if (customer.mobile) customer.mobile = customer.mobile.trim();
    },
  },
});

module.exports = Customer;
