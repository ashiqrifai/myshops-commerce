const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttributeOption = sequelize.define(
  "AttributeOption",
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
    attributeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    swatchValue: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    tableName: "attribute_options",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: [
          "companyId",
          "attributeId",
          "value",
        ],
      },
      {
        fields: ["attributeId", "isActive"],
      },
      {
        fields: ["attributeId", "displayOrder"],
      },
    ],
  }
);

module.exports = AttributeOption;
