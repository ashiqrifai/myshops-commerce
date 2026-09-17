const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const GiftVoucherPromotionItem =
    sequelize.define(
      "GiftVoucherPromotionItem",
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
  
        giftVoucherPromotionId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Product
        |--------------------------------------------------------------------------
        |
        | Required.
        |
        | If productVariantId is NULL, the promotion applies
        | to all active variants of the product.
        |--------------------------------------------------------------------------
        */
  
        productId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Variant
        |--------------------------------------------------------------------------
        |
        | Optional.
        |
        | NULL:
        | promotion applies to the complete product.
        |
        | UUID:
        | promotion applies only to this variant.
        |--------------------------------------------------------------------------
        */
  
        productVariantId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */
  
        isActive: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Audit
        |--------------------------------------------------------------------------
        */
  
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
          "gift_voucher_promotion_items",
  
        timestamps:
          true,
  
        indexes: [
          {
            name:
              "ix_gv_item_promotion",
  
            fields: [
              "companyId",
              "giftVoucherPromotionId",
            ],
          },
  
          {
            name:
              "ix_gv_item_product",
  
            fields: [
              "companyId",
              "productId",
            ],
          },
  
          {
            name:
              "ix_gv_item_variant",
  
            fields: [
              "companyId",
              "productVariantId",
            ],
          },
  
          {
            name:
              "ix_gv_item_active",
  
            fields: [
              "companyId",
              "isActive",
            ],
          },
        ],
      }
    );
  
  module.exports =
    GiftVoucherPromotionItem;