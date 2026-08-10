const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attribute = sequelize.define(
  "Attribute",
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
    name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    inputType: {
      type: DataTypes.ENUM(
        "TEXT",
        "NUMBER",
        "BOOLEAN",
        "SINGLE_SELECT",
        "MULTI_SELECT",
        "COLOR_SWATCH",
        "DATE",
        "RICH_TEXT"
      ),
      allowNull: false,
      defaultValue: "TEXT",
    },
    dataType: {
      type: DataTypes.ENUM(
        "STRING",
        "NUMBER",
        "BOOLEAN",
        "DATE",
        "JSON"
      ),
      allowNull: false,
      defaultValue: "STRING",
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    isVariantDefining: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isFilterable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isSearchable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isComparable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "attributes",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
      },
      {
        fields: ["companyId", "isActive"],
      },
      {
        fields: ["companyId", "isVariantDefining"],
      },
      {
        fields: ["companyId", "displayOrder"],
      },
    ],
  }
);

module.exports = Attribute;
