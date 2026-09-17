const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const CouponRedemption =
    sequelize.define(
      "CouponRedemption",
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
  
        couponId: {
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
  
        customerId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        customerEmail: {
          type:
            DataTypes.STRING(
              200
            ),
  
          allowNull:
            false,
        },
  
        couponCode: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        discountType: {
          type:
            DataTypes.STRING(
              50
            ),
  
          allowNull:
            false,
        },
  
        discountValue: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
        },
  
        discountAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
        },
  
        redeemedAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            false,
  
          defaultValue:
            DataTypes.NOW,
        },
      },
  
      {
        tableName:
          "coupon_redemptions",
  
        timestamps:
          true,
  
        indexes: [
          {
            fields: [
              "companyId",
              "couponId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "customerId",
              "couponId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "customerEmail",
              "couponId",
            ],
          },
  
          {
            unique:
              true,
  
            fields: [
              "orderId",
              "couponId",
            ],
          },
        ],
  
        hooks: {
          beforeValidate(
            redemption
          ) {
            if (
              redemption.customerEmail
            ) {
              redemption.customerEmail =
                redemption.customerEmail
                  .trim()
                  .toLowerCase();
            }
  
            if (
              redemption.couponCode
            ) {
              redemption.couponCode =
                redemption.couponCode
                  .trim()
                  .toUpperCase();
            }
          },
        },
      }
    );
  
  module.exports =
    CouponRedemption;