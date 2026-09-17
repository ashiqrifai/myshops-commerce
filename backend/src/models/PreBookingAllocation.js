const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize =
    require("../config/database");
  
  const PreBookingAllocation =
    sequelize.define(
      "PreBookingAllocation",
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
  
        bundleId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Optional Variant Allocation
        |--------------------------------------------------------------------------
        |
        | NULL:
        | allocation belongs to bundle generally.
        |
        | UUID:
        | allocation belongs only to selected product variant.
        |--------------------------------------------------------------------------
        */
  
        productVariantId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Quantities
        |--------------------------------------------------------------------------
        */
  
        allocationQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
  
        reservedQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
  
        confirmedQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
  
        /*
        |--------------------------------------------------------------------------
        | Booking Availability Window
        |--------------------------------------------------------------------------
        */
  
        availableFrom: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        availableUntil: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Expected Physical Stock Window
        |--------------------------------------------------------------------------
        */
  
        expectedStockFrom: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        expectedStockUntil: {
          type: DataTypes.DATE,
          allowNull: true,
        },
  
        note: {
          type: DataTypes.STRING(500),
          allowNull: true,
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
          "pre_booking_allocations",
  
        timestamps: true,
  
        indexes: [
            {
              name:
                "idx_pb_alloc_bundle",
          
              fields: [
                "companyId",
                "campaignProductId",
                "bundleId",
              ],
            },
          
            {
              name:
                "idx_pb_alloc_variant",
          
              fields: [
                "companyId",
                "productVariantId",
              ],
            },
          
            {
              name:
                "idx_pb_alloc_dates",
          
              fields: [
                "companyId",
                "availableFrom",
                "availableUntil",
                "isActive",
              ],
            },
          ],
  
        validate: {
          validQuantities() {
            if (
              Number(
                this.reservedQuantity
              ) +
                Number(
                  this.confirmedQuantity
                ) >
              Number(
                this.allocationQuantity
              )
            ) {
              throw new Error(
                "Reserved and confirmed quantities cannot exceed the allocation quantity."
              );
            }
          },
  
          validAvailabilityWindow() {
            if (
              this.availableFrom &&
              this.availableUntil &&
              new Date(
                this.availableUntil
              ) <
                new Date(
                  this.availableFrom
                )
            ) {
              throw new Error(
                "Availability end date cannot be earlier than availability start date."
              );
            }
          },
  
          validExpectedStockWindow() {
            if (
              this.expectedStockFrom &&
              this.expectedStockUntil &&
              new Date(
                this.expectedStockUntil
              ) <
                new Date(
                  this.expectedStockFrom
                )
            ) {
              throw new Error(
                "Expected stock end date cannot be earlier than expected stock start date."
              );
            }
          },
        },
      }
    );
  
  module.exports =
    PreBookingAllocation;