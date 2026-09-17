const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const OrderItemBundleItem =
  sequelize.define(
    "OrderItemBundleItem",
    {
      id: {
        type:
          DataTypes.UUID,

        defaultValue:
          DataTypes.UUIDV4,

        primaryKey:
          true,
      },

      companyId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      orderId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      orderItemId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      orderItemBundleId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      bundlePromotionItemId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      itemType: {
        type:
          DataTypes.ENUM(
            "PRODUCT",
            "PROTECTION_PLAN",
            "TEXT"
          ),

        allowNull:
          false,
      },

      productId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      productVariantId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      protectionSchemeId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      sku: {
        type:
          DataTypes.STRING(
            180
          ),

        allowNull:
          true,
      },

      productName: {
        type:
          DataTypes.STRING(
            300
          ),

        allowNull:
          true,
      },

      variantName: {
        type:
          DataTypes.STRING(
            350
          ),

        allowNull:
          true,
      },

      protectionSchemeCode: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,
      },

      protectionSchemeName: {
        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          true,
      },

      protectionSchemeType: {
        type:
          DataTypes.STRING(
            50
          ),

        allowNull:
          true,
      },

      protectionDurationMonths: {
        type:
          DataTypes.INTEGER,

        allowNull:
          true,
      },

      protectionCoverageStartMode: {
        type:
          DataTypes.STRING(
            60
          ),

        allowNull:
          true,
      },

      label: {
        type:
          DataTypes.STRING(
            300
          ),

        allowNull:
          false,
      },

      description: {
        type:
          DataTypes.TEXT,

        allowNull:
          true,
      },

      quantityPerBundle: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          1,
      },

      selectionQuantity: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          1,
      },

      totalQuantity: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          1,
      },

      isIncluded: {
        type:
          DataTypes.BOOLEAN,

        allowNull:
          false,

        defaultValue:
          true,
      },

      sortOrder: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          0,
      },

      createdBy: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      updatedBy: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },
    },
    {
      tableName:
        "order_item_bundle_items",

      timestamps:
        true,
    }
  );

module.exports =
  OrderItemBundleItem;
