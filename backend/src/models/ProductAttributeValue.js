const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductAttributeValue = sequelize.define(
  "ProductAttributeValue",
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    attributeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    optionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    textValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    numberValue: {
      type: DataTypes.DECIMAL(20, 6),
      allowNull: true,
    },
    booleanValue: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    dateValue: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    jsonValue: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    displayValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "product_attribute_values",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "productId", "attributeId"],
      },
      {
        fields: ["attributeId", "optionId"],
      },
    ],
  }
);

module.exports = ProductAttributeValue;
