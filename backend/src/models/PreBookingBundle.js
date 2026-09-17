const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PreBookingBundle =
    sequelize.define(
      "PreBookingBundle",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue:
            DataTypes.UUIDV4,
          primaryKey: true,
        },
  
        companyId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        campaignProductId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        code: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
  
        name: {
          type: DataTypes.STRING(250),
          allowNull: false,
        },
  
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Bundle Price
        |--------------------------------------------------------------------------
        |
        | INHERIT_PRODUCT:
        |   Use selected variant price.
        |
        | FIXED_TOTAL:
        |   priceAmount becomes complete bundle price.
        |
        | ADD_ON:
        |   priceAmount is added to variant price.
        |--------------------------------------------------------------------------
        */
  
        priceMode: {
          type: DataTypes.ENUM(
            "INHERIT_PRODUCT",
            "FIXED_TOTAL",
            "ADD_ON"
          ),
          allowNull: false,
          defaultValue:
            "INHERIT_PRODUCT",
        },
  
        priceAmount: {
          type: DataTypes.DECIMAL(
            18,
            4
          ),
          allowNull: true,
        },
  
        currencyCode: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: "AED",
        },
  
        /*
        |--------------------------------------------------------------------------
        | Existing Damage Protection
        |--------------------------------------------------------------------------
        */
  
        protectionSchemeId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        protectionIncluded: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Display
        |--------------------------------------------------------------------------
        */
  
        badgeText: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
  
        isDefault: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
  
        sortOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
  
        createdBy: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        updatedBy: {
          type: DataTypes.UUID,
          allowNull: true,
        },
      },
      {
        tableName:
          "pre_booking_bundles",
  
        timestamps: true,
  
        indexes: [
            {
              name:
                "uq_pb_bundle_code",
          
              unique:
                true,
          
              fields: [
                "companyId",
                "campaignProductId",
                "code",
              ],
            },
          
            {
              name:
                "idx_pb_bundle_cp_active",
          
              fields: [
                "companyId",
                "campaignProductId",
                "isActive",
              ],
            },
          
            {
              name:
                "idx_pb_bundle_protection",
          
              fields: [
                "companyId",
                "protectionSchemeId",
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
          },
        },
      }
    );
  
  module.exports =
    PreBookingBundle;