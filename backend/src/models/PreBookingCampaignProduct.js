const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PreBookingCampaignProduct =
    sequelize.define(
      "PreBookingCampaignProduct",
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
  
        campaignId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Optional Campaign-Specific Presentation
        |--------------------------------------------------------------------------
        */
  
        displayTitle: {
          type: DataTypes.STRING(300),
          allowNull: true,
        },
  
        shortDescription: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
  
        badgeText: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Purchase Rules
        |--------------------------------------------------------------------------
        */
  
        minimumQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
          },
        },
  
        maximumQuantityPerOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
          },
        },
  
        /*
        |--------------------------------------------------------------------------
        | Optional Product-Level Price Override
        |--------------------------------------------------------------------------
        */
  
        priceOverride: {
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
          "pre_booking_campaign_products",
  
        timestamps: true,
  
        indexes: [
            {
              name:
                "uq_pb_campaign_product",
          
              unique:
                true,
          
              fields: [
                "companyId",
                "campaignId",
                "productId",
              ],
            },
          
            {
              name:
                "idx_pb_cp_campaign_active",
          
              fields: [
                "companyId",
                "campaignId",
                "isActive",
              ],
            },
          
            {
              name:
                "idx_pb_cp_product",
          
              fields: [
                "companyId",
                "productId",
              ],
            },
          ],
      }
    );
  
  module.exports =
    PreBookingCampaignProduct;