const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const Coupon =
    sequelize.define(
      "Coupon",
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
  
        code: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        name: {
          type:
            DataTypes.STRING(
              250
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
  
        discountType: {
          type:
            DataTypes.ENUM(
              "PERCENTAGE",
              "FIXED",
              "FREE_SHIPPING"
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
  
          defaultValue:
            0,
        },
  
        minimumOrderAmount: {
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
  
        maximumDiscountAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            true,
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
  
        channelCode: {
          type:
            DataTypes.STRING(
              50
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "WEBSITE",
        },
  
        usageLimit: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        perCustomerLimit: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
  
          defaultValue:
            1,
        },
  
        firstOrderOnly: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            false,
        },
  
        validFrom: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
  
        validUntil: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
  
        isActive: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
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
          "coupons",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            fields: [
              "companyId",
              "code",
            ],
          },
  
          {
            fields: [
              "companyId",
              "isActive",
            ],
          },
  
          {
            fields: [
              "companyId",
              "channelCode",
              "isActive",
            ],
          },
  
          {
            fields: [
              "companyId",
              "validFrom",
              "validUntil",
            ],
          },
        ],
  
        hooks: {
          beforeValidate(
            coupon
          ) {
            if (
              coupon.code
            ) {
              coupon.code =
                coupon.code
                  .trim()
                  .toUpperCase();
            }
  
            if (
              coupon.currencyCode
            ) {
              coupon.currencyCode =
                coupon.currencyCode
                  .trim()
                  .toUpperCase();
            }
  
            if (
              coupon.channelCode
            ) {
              coupon.channelCode =
                coupon.channelCode
                  .trim()
                  .toUpperCase();
            }
          },
        },
      }
    );
  
  module.exports =
    Coupon;