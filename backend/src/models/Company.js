const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    legalName: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    trn: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "United Arab Emirates",
    },

    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "AED",
    },

    timezone: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Asia/Dubai",
    },

    logoUrl: {
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
    tableName: "companies",
    indexes: [
      {
        unique: true,
        fields: ["code"],
      },
      {
        fields: ["isActive"],
      },
    ],
  }
);

module.exports = Company;