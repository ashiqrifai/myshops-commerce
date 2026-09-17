const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const OrderItemProtectionPlan =
    sequelize.define(
      "OrderItemProtectionPlan",
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
  
        orderId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        orderItemId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        schemeId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        assignmentId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            true,
        },
  
        schemeCode: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        schemeName: {
          type:
            DataTypes.STRING(
              200
            ),
  
          allowNull:
            false,
        },
  
        schemeType: {
          type:
            DataTypes.ENUM(
              "EXTENDED_WARRANTY",
              "DAMAGE_PROTECTION"
            ),
  
          allowNull:
            false,
        },


        zohoItemId: {
          type:
            DataTypes.STRING(
              100
            ),

          allowNull:
            true,
        },
  
        durationMonths: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        pricingMethod: {
          type:
            DataTypes.ENUM(
              "PERCENTAGE",
              "FIXED"
            ),
  
          allowNull:
            false,
        },
  
        productUnitPrice: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
        },
  
        percentageApplied: {
          type:
            DataTypes.DECIMAL(
              10,
              4
            ),
  
          allowNull:
            true,
        },
  
        protectionUnitPrice: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
        },
  
        quantity: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            1,
        },
  
        totalAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
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
  
        status: {
          type:
            DataTypes.ENUM(
              "PENDING",
              "ACTIVE",
              "CANCELLED",
              "EXPIRED",
              "CLAIMED",
              "REFUNDED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "PENDING",
        },
  
        coverageStartMode: {
          type:
            DataTypes.ENUM(
              "FROM_PURCHASE_DATE",
              "AFTER_MANUFACTURER_WARRANTY"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "AFTER_MANUFACTURER_WARRANTY",
        },
  
        coverageStartDate: {
          type:
            DataTypes.DATEONLY,
  
          allowNull:
            true,
        },
  
        coverageEndDate: {
          type:
            DataTypes.DATEONLY,
  
          allowNull:
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
          "order_item_protection_plans",
  
        timestamps:
          true,
  
        indexes: [
          {
            fields: [
              "companyId",
              "orderId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "orderItemId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "schemeId",
            ],
          },
  
          {
            fields: [
              "companyId",
              "status",
            ],
          },
          {
            fields: [
              "companyId",
              "zohoItemId",
            ],
          },
        ],
      }
    );
  
  module.exports =
    OrderItemProtectionPlan;