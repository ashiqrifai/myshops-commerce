const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductVariantAttributeValue = sequelize.define(
  "ProductVariantAttributeValue",
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
    productVariantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    attributeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    optionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    displayValue: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "product_variant_attribute_values",
    timestamps: true,
    indexes: [
      {
        name: "ux_variant_attr_value",
        unique: true,
        fields: [
          "companyId",
          "productVariantId",
          "attributeId",
        ],
      },
      {
        name: "ix_variant_attr_option",
        fields: [
          "attributeId",
          "optionId",
        ],
      },
    ],
  }
);

module.exports = ProductVariantAttributeValue;
