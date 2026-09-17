const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Supplier = sequelize.define(
  "Supplier",
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
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    contactPerson: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    websiteUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "suppliers",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
      },
      {
        fields: ["companyId", "name"],
      },
      {
        fields: ["companyId", "isActive"],
      },
      {
        fields: ["companyId", "sortOrder"],
      },
    ],
  }
);

module.exports = Supplier;
