const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const CustomerAddress =
  sequelize.define(
    "CustomerAddress",
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

      customerId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      addressType: {
        type:
          DataTypes.ENUM(
            "HOME",
            "OFFICE",
            "APARTMENT",
            "VILLA",
            "WAREHOUSE",
            "HOTEL",
            "GIFT",
            "OTHER"
          ),

        allowNull:
          false,

        defaultValue:
          "HOME",
      },

      label: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          false,

        defaultValue:
          "Home",
      },

      firstName: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          false,
      },

      lastName: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,
      },

      companyName: {
        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          true,
      },

      mobile: {
        type:
          DataTypes.STRING(
            50
          ),

        allowNull:
          false,
      },

      email: {
        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          true,

        validate: {
          isEmail:
            true,
        },
      },

      countryCode: {
        type:
          DataTypes.STRING(
            2
          ),

        allowNull:
          false,

        defaultValue:
          "AE",
      },

      country: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          false,

        defaultValue:
          "United Arab Emirates",
      },

      emirate: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          false,
      },

      city: {
        type:
          DataTypes.STRING(
            120
          ),

        allowNull:
          true,
      },

      area: {
        type:
          DataTypes.STRING(
            160
          ),

        allowNull:
          false,
      },

      street: {
        type:
          DataTypes.STRING(
            250
          ),

        allowNull:
          false,
      },

      building: {
        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          false,
      },

      floor: {
        type:
          DataTypes.STRING(
            50
          ),

        allowNull:
          true,
      },

      apartment: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,
      },

      villaNumber: {
        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,
      },

      landmark: {
        type:
          DataTypes.STRING(
            250
          ),

        allowNull:
          true,
      },

      postalCode: {
        type:
          DataTypes.STRING(
            50
          ),

        allowNull:
          true,
      },

      latitude: {
        type:
          DataTypes.DECIMAL(
            10,
            7
          ),

        allowNull:
          true,
      },

      longitude: {
        type:
          DataTypes.DECIMAL(
            10,
            7
          ),

        allowNull:
          true,
      },

      deliveryInstructions: {
        type:
          DataTypes.TEXT,

        allowNull:
          true,
      },

      isDefaultShipping: {
        type:
          DataTypes.BOOLEAN,

        allowNull:
          false,

        defaultValue:
          false,
      },

      isDefaultBilling: {
        type:
          DataTypes.BOOLEAN,

        allowNull:
          false,

        defaultValue:
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
        "customer_addresses",

      indexes: [
        {
          fields: [
            "companyId",
            "customerId",
            "isActive",
          ],
        },

        {
          fields: [
            "customerId",
            "isDefaultShipping",
          ],
        },

        {
          fields: [
            "customerId",
            "isDefaultBilling",
          ],
        },

        {
          fields: [
            "companyId",
            "emirate",
          ],
        },
      ],

      hooks: {
        beforeValidate(
          address
        ) {
          const fields = [
            "label",
            "firstName",
            "lastName",
            "companyName",
            "mobile",
            "email",
            "countryCode",
            "country",
            "emirate",
            "city",
            "area",
            "street",
            "building",
            "floor",
            "apartment",
            "villaNumber",
            "landmark",
            "postalCode",
            "deliveryInstructions",
          ];

          fields.forEach(
            (
              field
            ) => {
              if (
                typeof address[
                  field
                ] ===
                "string"
              ) {
                const value =
                  address[
                    field
                  ].trim();

                address[
                  field
                ] =
                  value ||
                  null;
              }
            }
          );

          if (
            address.email
          ) {
            address.email =
              address.email
                .toLowerCase();
          }

          if (
            address.countryCode
          ) {
            address.countryCode =
              address.countryCode
                .toUpperCase();
          }

          if (
            address.addressType
          ) {
            address.addressType =
              address.addressType
                .toUpperCase();
          }
        },
      },
    }
  );

module.exports =
  CustomerAddress;
