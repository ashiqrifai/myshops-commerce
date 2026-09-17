const {
    DataTypes,
  } =
    require(
      "sequelize"
    );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const BundlePromotion =
    sequelize.define(
      "BundlePromotion",
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
  
        configId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Identity
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
        | Pricing
        |--------------------------------------------------------------------------
        |
        | FREE
        |   Bundle items are supplied at no additional charge.
        |
        | ADD_ON
        |   priceAmount is added to the normal main-product price.
        |
        | FIXED_TOTAL
        |   priceAmount represents the promotional total for the main
        |   product + this bundle.
        |--------------------------------------------------------------------------
        */
  
        priceMode: {
          type:
            DataTypes.ENUM(
              "FREE",
              "ADD_ON",
              "FIXED_TOTAL"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "FREE",
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
        | Validity
        |--------------------------------------------------------------------------
        */
  
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
  
        /*
        |--------------------------------------------------------------------------
        | Display
        |--------------------------------------------------------------------------
        */
  
        badgeText: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        isDefault: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            false,
        },
  
        sortOrder: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            0,
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
          "bundle_promotions",
  
        timestamps:
          true,
  
        indexes: [
          {
            name:
              "uq_bundle_promotion_code",
  
            unique:
              true,
  
            fields: [
              "companyId",
              "configId",
              "code",
            ],
          },
  
          {
            name:
              "idx_bundle_promotion_config_active",
  
            fields: [
              "companyId",
              "configId",
              "isActive",
            ],
          },
  
          {
            name:
              "idx_bundle_promotion_validity",
  
            fields: [
              "companyId",
              "startsAt",
              "endsAt",
            ],
          },
        ],
  
        hooks: {
          beforeValidate(
            bundle
          ) {
            if (
              bundle.code
            ) {
              bundle.code =
                String(
                  bundle.code
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
              bundle.currencyCode
            ) {
              bundle.currencyCode =
                String(
                  bundle.currencyCode
                )
                  .trim()
                  .toUpperCase();
            }
  
            /*
             * FREE bundles never need a price amount.
             */
            if (
              bundle.priceMode ===
              "FREE"
            ) {
              bundle.priceAmount =
                null;
            }
          },
        },
      }
    );
  
  module.exports =
    BundlePromotion;