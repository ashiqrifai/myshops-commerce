const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserRole = sequelize.define(
  "UserRole",
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

    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "user_roles",
    indexes: [
      {
        unique: true,
        fields: ["userId", "roleId"],
      },
    ],
  }
);

module.exports = UserRole;