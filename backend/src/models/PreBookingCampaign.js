const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PreBookingCampaign =
    sequelize.define(
      "PreBookingCampaign",
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
  
        code: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
  
        name: {
          type: DataTypes.STRING(250),
          allowNull: false,
        },
  
        slug: {
          type: DataTypes.STRING(250),
          allowNull: false,
        },
  
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
  
        status: {
          type: DataTypes.ENUM(
            "DRAFT",
            "ACTIVE",
            "PAUSED",
            "CLOSED",
            "ARCHIVED"
          ),
          allowNull: false,
          defaultValue: "DRAFT",
        },
  
        bookingStartAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        bookingEndAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Payment
        |--------------------------------------------------------------------------
        */
  
        paymentPolicy: {
          type: DataTypes.ENUM(
            "FULL_PREPAID"
          ),
          allowNull: false,
          defaultValue:
            "FULL_PREPAID",
        },
  
        allowCard: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
  
        allowTabby: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        allowTamara: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        /*
         * COD deliberately does not exist
         * as an allowed campaign payment
         * option.
         */
  
        allowCoupons: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        allowGiftVouchers: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Checkout
        |--------------------------------------------------------------------------
        */
  
        checkoutSessionMinutes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 15,
          validate: {
            min: 5,
            max: 120,
          },
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
          "pre_booking_campaigns",
  
        timestamps: true,
  
        indexes: [
            {
              name:
                "uq_pb_campaign_company_code",
          
              unique:
                true,
          
              fields: [
                "companyId",
                "code",
              ],
            },
          
            {
              name:
                "uq_pb_campaign_company_slug",
          
              unique:
                true,
          
              fields: [
                "companyId",
                "slug",
              ],
            },
          
            {
              name:
                "idx_pb_campaign_status",
          
              fields: [
                "companyId",
                "status",
                "isActive",
              ],
            },
          
            {
              name:
                "idx_pb_campaign_dates",
          
              fields: [
                "companyId",
                "bookingStartAt",
                "bookingEndAt",
              ],
            },
          ],
  
        hooks: {
          beforeValidate(
            campaign
          ) {
            if (
              campaign.code
            ) {
              campaign.code =
                String(
                  campaign.code
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
              campaign.slug
            ) {
              campaign.slug =
                String(
                  campaign.slug
                )
                  .trim()
                  .toLowerCase()
                  .replace(
                    /[^a-z0-9]+/g,
                    "-"
                  )
                  .replace(
                    /^-+|-+$/g,
                    ""
                  );
            }
          },
        },
      }
    );
  
  module.exports =
    PreBookingCampaign;