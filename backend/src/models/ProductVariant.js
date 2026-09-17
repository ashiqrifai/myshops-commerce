const { DataTypes } = require("sequelize");

const sequelize = require("../config/database");

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    sku: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    barcode: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING(350),
      allowNull: false,
    },

    variantKey: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },

    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },

    zohoItemId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    
    zohoItemCode: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    
    zohoLastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    weight: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },

    weightUnit: {
      type: DataTypes.ENUM("G", "KG", "LB", "OZ"),
      allowNull: true,
    },

    length: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },

    width: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },

    height: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: true,
    },

    dimensionUnit: {
      type: DataTypes.ENUM("MM", "CM", "M", "IN"),
      allowNull: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Delivery override
    |--------------------------------------------------------------------------
    |
    | When overrideDeliverySettings is false, storefront logic should inherit
    | the delivery settings from Product.
    |--------------------------------------------------------------------------
    */

    overrideDeliverySettings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    expressDeliveryEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    expressDeliveryHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 168,
      },
    },

    deliveryMinDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 365,
      },
    },

    deliveryMaxDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 365,
      },
    },

    deliveryNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: "product_variants",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "sku"],
      },
      {
        unique: true,
        fields: ["companyId", "barcode"],
        where: {
          barcode: {
            [require("sequelize").Op.ne]: null,
          },
        },
      },
      {
        unique: true,
        fields: ["companyId", "productId", "variantKey"],
      },
      {
        fields: ["companyId", "productId", "status"],
      },
    ],
  }
);

module.exports = ProductVariant;
