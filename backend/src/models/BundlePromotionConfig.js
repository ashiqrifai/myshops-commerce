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
  
  const BundlePromotionConfig =
    sequelize.define(
      "BundlePromotionConfig",
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
        | Main Product
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
        | Optional Main Variant
        |--------------------------------------------------------------------------
        |
        | NULL:
        |   Bundle configuration applies to the product generally.
        |
        | UUID:
        |   Bundle configuration applies only to this particular main variant.
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
        | Customer Selection Rules
        |--------------------------------------------------------------------------
        */
  
        bundlesOptional: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
  
        /*
         * Maximum number of bundle OFFERS that may be selected
         * for each unit of the main product.
         *
         * Example:
         *
         * main quantity = 2
         * maxBundleSelectionsPerUnit = 2
         *
         * maximum selected bundle offers = 4
         */
        maxBundleSelectionsPerUnit: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            1,
  
          validate: {
            min:
              1,
  
            max:
              100,
          },
        },
  
        /*
         * Optional storefront display limit.
         *
         * NULL means show all applicable active bundle offers.
         *
         * This is intentionally different from
         * maxBundleSelectionsPerUnit.
         */
        maxBundlesDisplayed: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
  
          validate: {
            min:
              1,
  
            max:
              100,
          },
        },
  
        /*
        |--------------------------------------------------------------------------
        | Channel
        |--------------------------------------------------------------------------
        */
  
        channelCode: {
          type:
            DataTypes.ENUM(
              "WEBSITE",
              "KIOSK"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "WEBSITE",
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
          "bundle_promotion_configs",
  
        timestamps:
          true,
  
        indexes: [
          {
            name:
              "idx_bundle_config_company_product",
  
            fields: [
              "companyId",
              "productId",
              "isActive",
            ],
          },
  
          {
            name:
              "idx_bundle_config_variant",
  
            fields: [
              "companyId",
              "productVariantId",
              "isActive",
            ],
          },
  
          {
            name:
              "idx_bundle_config_channel",
  
            fields: [
              "companyId",
              "channelCode",
              "isActive",
            ],
          },
        ],
      }
    );
  
  module.exports =
    BundlePromotionConfig;