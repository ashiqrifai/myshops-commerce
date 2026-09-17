const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define(
  "Product",
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
    brandId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    primaryCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(320),
      allowNull: false,
    },
    productType: {
      type: DataTypes.ENUM(
        "SIMPLE",
        "VARIABLE",
        "BUNDLE",
        "SERVICE"
      ),
      allowNull: false,
      defaultValue: "SIMPLE",
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
    parentSku: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    whatsInTheBox: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    warrantyText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    taxCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    taxPercent: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: false,
      defaultValue: 0,
    },
    isExtendedWarrantyEligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    /*
    |--------------------------------------------------------------------------
    | Customer-facing delivery promise
    |--------------------------------------------------------------------------
    |
    | These are separate from supplier-direct fulfilment fields below.
    | Product variants may optionally override these values.
    |--------------------------------------------------------------------------
    */

    expressDeliveryEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    expressDeliveryHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 4,
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

    isDirectDelivery: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    directDeliverySupplierId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    directDeliveryLeadTimeDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },

    directDeliveryNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isSearchable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    alwaysAvailableForSale: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metaTitle: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metaKeywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    canonicalUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
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
    tableName: "products",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "slug"],
      },
      {
        unique: true,
        fields: ["companyId", "parentSku"],
        where: {
          parentSku: {
            [require("sequelize").Op.ne]: null,
          },
        },
      },
      {
        fields: ["companyId", "status"],
      },
      {
        fields: ["companyId", "brandId"],
      },
      {
        fields: ["companyId", "primaryCategoryId"],
      },
      {
        fields: ["companyId", "productType"],
      },
    ],
  }
);

module.exports = Product;
