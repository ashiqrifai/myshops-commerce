const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const OrderItemBundle =
  sequelize.define(
    "OrderItemBundle",
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

      bundlePromotionConfigId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      bundlePromotionId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      bundleCode: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          false,
      },

      bundleName: {
        type:
          DataTypes.STRING(
            250
          ),

        allowNull:
          false,
      },

      bundleDescription: {
        type:
          DataTypes.TEXT,

        allowNull:
          true,
      },

      priceMode: {
        type:
          DataTypes.ENUM(
            "FREE",
            "ADD_ON",
            "FIXED_TOTAL"
          ),

        allowNull:
          false,
      },

      priceAmount: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),

        allowNull:
          true,
      },

      chargedUnitAmount: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),

        allowNull:
          false,

        defaultValue:
          0,
      },

      selectionQuantity: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          1,
      },

      chargedAmount: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),

        allowNull:
          false,

        defaultValue:
          0,
      },

      currencyCode: {
        type:
          DataTypes.STRING(
            3
          ),

        allowNull:
          false,

        defaultValue:
          "AED",
      },

      source: {
        type:
          DataTypes.ENUM(
            "VARIANT",
            "PRODUCT"
          ),

        allowNull:
          false,
      },

      badgeText: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,
      },

      startsAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      endsAt: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
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
        "order_item_bundles",

      timestamps:
        true,
    }
  );

module.exports =
  OrderItemBundle;
