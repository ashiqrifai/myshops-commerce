const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const DeliveryZoneCity =
    sequelize.define(
      "DeliveryZoneCity",
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
  
        emirateCode: {
          type:
            DataTypes.STRING(
              50
            ),
  
          allowNull:
            false,
        },
  
        cityCode: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        cityName: {
          type:
            DataTypes.STRING(
              150
            ),
  
          allowNull:
            false,
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
          "delivery_zone_cities",
  
        timestamps:
          true,
  
          indexes: [
            {
              unique: true,
          
              name:
                "uq_delivery_zone_city",
          
              fields: [
                "companyId",
                "deliveryZoneId",
                "cityCode",
              ],
            },
          
            {
              name:
                "ix_dzc_city_active",
          
              fields: [
                "companyId",
                "cityCode",
                "isActive",
              ],
            },
          ],
      }
    );
  
  module.exports =
    DeliveryZoneCity;