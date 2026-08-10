const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductImage = sequelize.define(
  "ProductImage",
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
    variantId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    mediaAssetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    imageRole: {
      type: DataTypes.ENUM(
        "PRIMARY",
        "GALLERY",
        "SWATCH",
        "LIFESTYLE",
        "MANUAL",
        "VIDEO",
        "DOCUMENT"
      ),
      allowNull: false,
      defaultValue: "GALLERY",
    },
    altText: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(300),
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
  },
  {
    tableName: "product_images",
    timestamps: true,
    indexes: [
      {
        name: "ix_product_image_product",
        fields: [
          "companyId",
          "productId",
        ],
      },
      {
        name: "ix_product_image_variant",
        fields: [
          "variantId",
        ],
      },
      {
        name: "ix_product_image_media",
        fields: [
          "mediaAssetId",
        ],
      },
      {
        name: "ux_product_image_usage",
        unique: true,
        fields: [
          "companyId",
          "productId",
          "variantId",
          "mediaAssetId",
          "imageRole",
        ],
      },
    ],
  }
);

module.exports = ProductImage;
