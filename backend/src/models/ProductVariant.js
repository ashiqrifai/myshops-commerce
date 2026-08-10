const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductVariant = sequelize.define(
  "ProductVariant",
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
    sku: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(350),
      allowNull: false,
    },
    variantKey: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    weight: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
    weightUnit: {
      type: DataTypes.ENUM("G", "KG", "LB", "OZ"),
      allowNull: true,
    },
    length: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
    width: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },
    dimensionUnit: {
      type: DataTypes.ENUM("MM", "CM", "M", "IN"),
      allowNull: true,
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
    tableName: "product_variants",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "sku"],
      },
      {
        unique: true,
        fields: ["companyId", "barcode"],
        where: {
          barcode: {
            [require("sequelize").Op.ne]: null,
          },
        },
      },
      {
        unique: true,
        fields: ["companyId", "productId", "variantKey"],
      },
      {
        fields: ["companyId", "productId", "status"],
      },
    ],
  }
);

module.exports = ProductVariant;
