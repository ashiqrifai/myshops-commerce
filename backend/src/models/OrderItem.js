const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const OrderItem =
  sequelize.define(
    "OrderItem",
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

      productId: {
        type:
          DataTypes.UUID,
        allowNull:
          false,
      },

      productVariantId: {
        type:
          DataTypes.UUID,
        allowNull:
          false,
      },

      sku: {
        type:
          DataTypes.STRING(
            180
          ),
        allowNull:
          false,
      },

      productName: {
        type:
          DataTypes.STRING(
            300
          ),
        allowNull:
          false,
      },

      variantName: {
        type:
          DataTypes.STRING(
            350
          ),
        allowNull:
          false,
      },

      quantity: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          false,
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

      /*
      |--------------------------------------------------------------------------
      | Pricing Snapshot
      |--------------------------------------------------------------------------
      |
      | These values are frozen at order creation time. They must never depend
      | on a later change to ProductVariantPrice or a promotion master.
      |--------------------------------------------------------------------------
      */

      regularUnitPrice: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          true,
      },

      baseSellingUnitPrice: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          true,
      },

      unitPrice: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          false,
      },

      priceDiscountUnit: {
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

      giftVoucherDiscountUnit: {
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

      totalDiscountUnit: {
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

      totalDiscountPercent: {
        type:
          DataTypes.DECIMAL(
            10,
            4
          ),
        allowNull:
          false,
        defaultValue:
          0,
      },

      regularLineAmount: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          true,
      },

      baseSellingLineAmount: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          true,
      },

      priceDiscountAmount: {
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

      giftVoucherDiscountAmount: {
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

      totalDiscountAmount: {
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

      /*
      |--------------------------------------------------------------------------
      | Existing Generic Discount
      |--------------------------------------------------------------------------
      |
      | Kept for compatibility with existing order/reporting logic.
      |--------------------------------------------------------------------------
      */

      discountAmount: {
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

      /*
      |--------------------------------------------------------------------------
      | Gift Voucher Promotion Snapshot
      |--------------------------------------------------------------------------
      */

      giftVoucherPromotionId: {
        type:
          DataTypes.UUID,
        allowNull:
          true,
      },

      giftVoucherPromotionCode: {
        type:
          DataTypes.STRING(
            120
          ),
        allowNull:
          true,
      },

   
      giftVoucherPromotionName: {
        type:
          DataTypes.STRING(
            250
          ),
        allowNull:
          true,
      },

      giftVoucherFundingType: {
        type:
          DataTypes.STRING(
            50
          ),
        allowNull:
          true,
      },

      giftVoucherFundingSource: {
        type:
          DataTypes.STRING(
            250
          ),
        allowNull:
          true,
      },

      giftVoucherInternalUnit: {
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

      giftVoucherExternalUnit: {
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

      giftVoucherInternalAmount: {
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

      giftVoucherExternalAmount: {
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

      giftVoucherValidFrom: {
        type:
          DataTypes.DATE,
        allowNull:
          true,
      },

      giftVoucherValidUntil: {
        type:
          DataTypes.DATE,
        allowNull:
          true,
      },

      /*
      |--------------------------------------------------------------------------
      | Tax + Final Line Amount
      |--------------------------------------------------------------------------
      */

      taxPercent: {
        type:
          DataTypes.DECIMAL(
            8,
            4
          ),
        allowNull:
          false,
        defaultValue:
          0,
      },

      taxAmount: {
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

      lineSubtotal: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          false,
      },

      lineTotal: {
        type:
          DataTypes.DECIMAL(
            18,
            4
          ),
        allowNull:
          false,
      },

      priceListId: {
        type:
          DataTypes.UUID,
        allowNull:
          true,
      },

      productVariantPriceId: {
        type:
          DataTypes.UUID,
        allowNull:
          true,
      },

      selectedDeliveryMethod: {
        type:
          DataTypes.ENUM(
            "STANDARD",
            "EXPRESS",
            "PICKUP"
          ),
        allowNull:
          true,
      },

      selectedPickupLocationId: {
        type:
          DataTypes.UUID,
        allowNull:
          true,
      },
    },
    {
      tableName:
        "order_items",

      timestamps:
        true,

      indexes: [
        {
          fields: [
            "companyId",
            "orderId",
          ],
        },

        {
          fields: [
            "companyId",
            "productVariantId",
          ],
        },

        {
          fields: [
            "companyId",
            "sku",
          ],
        },

      ],
    }
  );

module.exports =
  OrderItem;
