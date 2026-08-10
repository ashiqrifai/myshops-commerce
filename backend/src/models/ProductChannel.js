const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductChannel = sequelize.define(
  "ProductChannel",
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
    channelCode: {
      type: DataTypes.ENUM(
        "WEBSITE",
        "MOBILE",
        "KIOSK",
        "POS",
        "MARKETPLACE",
        "B2B"
      ),
      allowNull: false,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    publishStatus: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PUBLISHED",
        "UNPUBLISHED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    channelTitle: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    channelDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "product_channels",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "productId", "channelCode"],
      },
      {
        fields: ["companyId", "channelCode", "isVisible"],
      },
    ],
  }
);

module.exports = ProductChannel;
