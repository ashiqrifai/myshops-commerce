const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const DeliveryZoneLocation =
    sequelize.define(
      "DeliveryZoneLocation",
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
  
        deliveryZoneId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        inventoryLocationId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        priority: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            100,
        },
  
        isActive: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            true,
        },
      },
      {
        tableName:
          "delivery_zone_locations",
  
        timestamps:
          true,
  
          indexes: [
            {
              unique: true,
          
              name:
                "uq_delivery_zone_location",
          
              fields: [
                "companyId",
                "deliveryZoneId",
                "inventoryLocationId",
              ],
            },
          
            {
              name:
                "ix_dzl_location_active",
          
              fields: [
                "companyId",
                "inventoryLocationId",
                "isActive",
              ],
            },
          ],
      }
    );
  
  module.exports =
    DeliveryZoneLocation;