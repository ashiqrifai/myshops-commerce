const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const GiftVoucherPromotion =
    sequelize.define(
      "GiftVoucherPromotion",
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
  
        /*
        |--------------------------------------------------------------------------
        | Identification
        |--------------------------------------------------------------------------
        */
  
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
  
        /*
        |--------------------------------------------------------------------------
        | Discount
        |--------------------------------------------------------------------------
        |
        | FIXED_AMOUNT
        | Example:
        | AED 300 discount
        |
        | PERCENTAGE
        | Example:
        | 5% discount
        |--------------------------------------------------------------------------
        */
  
        discountType: {
          type:
            DataTypes.ENUM(
              "FIXED_AMOUNT",
              "PERCENTAGE"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "FIXED_AMOUNT",
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
  
        /*
        |--------------------------------------------------------------------------
        | Funding
        |--------------------------------------------------------------------------
        |
        | INTERNAL
        | MyShops bears the GV discount.
        |
        | EXTERNAL
        | Vendor / Brand bears the GV discount.
        |--------------------------------------------------------------------------
        */
  
        fundingType: {
          type:
            DataTypes.ENUM(
              "INTERNAL",
              "EXTERNAL"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "INTERNAL",
        },
  
        /*
        |--------------------------------------------------------------------------
        | Funding Source
        |--------------------------------------------------------------------------
        |
        | FREE TEXT.
        |
        | Examples:
        | Apple
        | Samsung Gulf
        | Huawei
        | ABC Distributor
        |
        | No FK / master validation.
        |--------------------------------------------------------------------------
        */
  
        fundingSource: {
          type:
            DataTypes.STRING(
              250
            ),
  
          allowNull:
            true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Currency
        |--------------------------------------------------------------------------
        */
  
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
        | Channel
        |--------------------------------------------------------------------------
        |
        | WEBSITE
        | ALL
        |--------------------------------------------------------------------------
        */
  
        channelCode: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "WEBSITE",
        },
  
        /*
        |--------------------------------------------------------------------------
        | Promotion Period
        |--------------------------------------------------------------------------
        */
  
        validFrom: {
          type:
            DataTypes.DATE,
  
          allowNull:
            false,
        },
  
        validUntil: {
          type:
            DataTypes.DATE,
  
          allowNull:
            false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Priority
        |--------------------------------------------------------------------------
        |
        | Lower number wins if more than one GV promotion
        | is applicable to the same variant.
        |--------------------------------------------------------------------------
        */
  
        priority: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            100,
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
          "gift_voucher_promotions",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            name:
              "uq_gv_promotion_company_code",
  
            fields: [
              "companyId",
              "code",
            ],
          },
  
          {
            name:
              "ix_gv_promotion_company_active",
  
            fields: [
              "companyId",
              "isActive",
            ],
          },
  
          {
            name:
              "ix_gv_promotion_company_dates",
  
            fields: [
              "companyId",
              "validFrom",
              "validUntil",
            ],
          },
  
          {
            name:
              "ix_gv_promotion_channel",
  
            fields: [
              "companyId",
              "channelCode",
            ],
          },
  
          {
            name:
              "ix_gv_promotion_priority",
  
            fields: [
              "companyId",
              "priority",
            ],
          },
  
          {
            name:
              "ix_gv_promotion_funding",
  
            fields: [
              "companyId",
              "fundingType",
            ],
          },
        ],
  
        hooks: {
          beforeValidate(
            promotion
          ) {
            if (
              promotion.code
            ) {
              promotion.code =
                String(
                  promotion.code
                )
                  .trim()
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9]+/g,
                    "_"
                  )
                  .replace(
                    /^_+|_+$/g,
                    ""
                  );
            }
  
            if (
              promotion.name
            ) {
              promotion.name =
                String(
                  promotion.name
                ).trim();
            }
  
            if (
              promotion.currencyCode
            ) {
              promotion.currencyCode =
                String(
                  promotion.currencyCode
                )
                  .trim()
                  .toUpperCase();
            }
  
            if (
              promotion.channelCode
            ) {
              promotion.channelCode =
                String(
                  promotion.channelCode
                )
                  .trim()
                  .toUpperCase();
            }
  
            if (
              promotion.fundingSource
            ) {
              promotion.fundingSource =
                String(
                  promotion.fundingSource
                ).trim();
            }
          },
        },
      }
    );
  
  module.exports =
    GiftVoucherPromotion;