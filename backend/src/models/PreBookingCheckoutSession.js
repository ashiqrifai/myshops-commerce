const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PreBookingCheckoutSession =
    sequelize.define(
      "PreBookingCheckoutSession",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue:
            DataTypes.UUIDV4,
          primaryKey: true,
        },
  
        publicToken: {
          type: DataTypes.UUID,
          defaultValue:
            DataTypes.UUIDV4,
          allowNull: false,
          
        },
  
        companyId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        campaignId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        campaignProductId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        productVariantId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        bundleId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        allocationId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        protectionSchemeId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        customerId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        orderId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
          },
        },
  
        /*
        |--------------------------------------------------------------------------
        | Frozen Selection / Price Snapshot
        |--------------------------------------------------------------------------
        */
  
        productName: {
          type: DataTypes.STRING(300),
          allowNull: false,
        },
  
        variantName: {
          type: DataTypes.STRING(350),
          allowNull: false,
        },
  
        sku: {
          type: DataTypes.STRING(180),
          allowNull: false,
        },
  
        bundleName: {
          type: DataTypes.STRING(250),
          allowNull: false,
        },
  
        productUnitPrice: {
          type: DataTypes.DECIMAL(
            18,
            4
          ),
          allowNull: false,
        },
  
        bundleAmount: {
          type: DataTypes.DECIMAL(
            18,
            4
          ),
          allowNull: false,
          defaultValue: 0,
        },
  
        protectionAmount: {
          type: DataTypes.DECIMAL(
            18,
            4
          ),
          allowNull: false,
          defaultValue: 0,
        },
  
        taxAmount: {
          type: DataTypes.DECIMAL(
            18,
            4
          ),
          allowNull: false,
          defaultValue: 0,
        },
  
        totalAmount: {
          type: DataTypes.DECIMAL(
            18,
            4
          ),
          allowNull: false,
        },
  
        currencyCode: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: "AED",
        },
  
        expectedStockFrom: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        expectedStockUntil: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Session Lifecycle
        |--------------------------------------------------------------------------
        */
  
        status: {
          type: DataTypes.ENUM(
            "OPEN",
            "RESERVED",
            "PAYMENT_PENDING",
            "COMPLETED",
            "FAILED",
            "EXPIRED",
            "CANCELLED"
          ),
          allowNull: false,
          defaultValue: "OPEN",
        },
  
        reservedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
  
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
  
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
  
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        tableName:
          "pre_booking_checkout_sessions",
  
        timestamps: true,
  
        indexes: [
            {
              name:
                "uq_pb_checkout_token",
          
              unique:
                true,
          
              fields: [
                "publicToken",
              ],
            },
          
            {
              name:
                "idx_pb_checkout_campaign",
          
              fields: [
                "companyId",
                "campaignId",
              ],
            },
          
            {
              name:
                "idx_pb_checkout_alloc_status",
          
              fields: [
                "companyId",
                "allocationId",
                "status",
              ],
            },
          
            {
              name:
                "idx_pb_checkout_customer",
          
              fields: [
                "companyId",
                "customerId",
              ],
            },
          
            {
              name:
                "idx_pb_checkout_order",
          
              fields: [
                "companyId",
                "orderId",
              ],
            },
          
            {
              name:
                "idx_pb_checkout_expiry",
          
              fields: [
                "status",
                "expiresAt",
              ],
            },
          ],
      }
    );
  
  module.exports =
    PreBookingCheckoutSession;