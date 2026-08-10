const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    tokenId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },

    tokenHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    replacedByTokenId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "refresh_tokens",
    indexes: [
      {
        fields: ["userId", "isActive"],
      },
      {
        fields: ["expiresAt"],
      },
    ],
  }
);

module.exports = RefreshToken;