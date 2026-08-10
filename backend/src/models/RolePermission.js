const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "role_permissions",
    indexes: [
      {
        unique: true,
        fields: ["roleId", "permissionId"],
      },
    ],
  }
);

module.exports = RolePermission;