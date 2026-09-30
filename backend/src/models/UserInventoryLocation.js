const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );


const UserInventoryLocation =
  sequelize.define(
    "UserInventoryLocation",
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

      userId: {
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
    },
    {
      tableName:
        "user_inventory_locations",

      timestamps:
        true,

      indexes: [
        {
          unique:
            true,

          fields: [
            "companyId",
            "userId",
            "inventoryLocationId",
          ],

          name:
            "uq_user_inventory_location",
        },

        {
          fields: [
            "companyId",
            "inventoryLocationId",
          ],
        },
      ],
    }
  );


module.exports =
  UserInventoryLocation;
