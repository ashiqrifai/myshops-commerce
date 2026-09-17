const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const DeliveryZone =
    sequelize.define(
      "DeliveryZone",
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
  
        code: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            false,
        },
  
        name: {
          type:
            DataTypes.STRING(
              250
            ),
  
          allowNull:
            false,
        },
  
        deliveryMethod: {
          type:
            DataTypes.ENUM(
              "STANDARD",
              "EXPRESS"
            ),
  
          allowNull:
            false,
        },
  
        deliveryHours: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        deliveryMinDays: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        deliveryMaxDays: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            true,
        },
  
        deliveryAmount: {
          type:
            DataTypes.DECIMAL(
              18,
              4
            ),
  
          allowNull:
            false,
  
          defaultValue:
            0,
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
          "delivery_zones",
  
        timestamps:
          true,
  
          indexes: [
            {
              unique: true,
          
              name:
                "uq_delivery_zone_code",
          
              fields: [
                "companyId",
                "code",
              ],
            },
          
            {
              name:
                "ix_delivery_zone_active",
          
              fields: [
                "companyId",
                "isActive",
                "priority",
              ],
            },
          ],
      }
    );
  
  module.exports =
    DeliveryZone;