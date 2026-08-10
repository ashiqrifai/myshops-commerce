const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CategoryAttribute = sequelize.define(
  "CategoryAttribute",
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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    attributeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isFilterable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isVariantDefining: {
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
    tableName: "category_attributes",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: [
          "companyId",
          "categoryId",
          "attributeId",
        ],
      },
      {
        fields: ["categoryId", "isActive"],
      },
      {
        fields: ["attributeId", "isActive"],
      },
      {
        fields: ["categoryId", "displayOrder"],
      },
    ],
  }
);

module.exports = CategoryAttribute;
