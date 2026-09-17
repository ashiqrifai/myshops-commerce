const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PreBookingBundleItem =
    sequelize.define(
      "PreBookingBundleItem",
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
  
        bundleId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
  
        itemType: {
          type: DataTypes.ENUM(
            "PRODUCT",
            "TEXT"
          ),
          allowNull: false,
          defaultValue:
            "TEXT",
        },
  
        /*
        |--------------------------------------------------------------------------
        | Optional Catalogue Reference
        |--------------------------------------------------------------------------
        */
  
        productId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        productVariantId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Snapshot / Display
        |--------------------------------------------------------------------------
        */
  
        label: {
          type: DataTypes.STRING(300),
          allowNull: false,
        },
  
        description: {
          type: DataTypes.TEXT,
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
  
        isIncluded: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
  
        sortOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
  
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
          "pre_booking_bundle_items",
  
        timestamps: true,
  
        indexes: [
            {
              name:
                "idx_pb_item_bundle",
          
              fields: [
                "companyId",
                "bundleId",
                "isActive",
              ],
            },
          
            {
              name:
                "idx_pb_item_product",
          
              fields: [
                "companyId",
                "productId",
              ],
            },
          
            {
              name:
                "idx_pb_item_variant",
          
              fields: [
                "companyId",
                "productVariantId",
              ],
            },
          ],
      }
    );
  
  module.exports =
    PreBookingBundleItem;