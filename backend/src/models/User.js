const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
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

    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    mobile: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "ACTIVE",
        "INACTIVE",
        "LOCKED",
        "PASSWORD_RESET_REQUIRED"
      ),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    indexes: [
      {
        unique: true,
        fields: ["companyId", "email"],
      },
      {
        unique: true,
        fields: ["companyId", "username"],
      },
      {
        fields: ["companyId", "status"],
      },
      {
        fields: ["companyId", "isActive"],
      },
    ],
  }
);

module.exports = User;