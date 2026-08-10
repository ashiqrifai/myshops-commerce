const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductVariantChannel = sequelize.define(
  "ProductVariantChannel",
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
  },
  {
    tableName: "product_variant_channels",
    timestamps: true,
    indexes: [
      {
        name: "ux_variant_channel",
        unique: true,
        fields: [
          "companyId",
          "productVariantId",
          "channelCode",
        ],
      },
      {
        name: "ix_variant_channel_visible",
        fields: [
          "companyId",
          "channelCode",
          "isVisible",
        ],
      },
    ],
  }
);

module.exports = ProductVariantChannel;
