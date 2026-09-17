const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const ProductAttachmentRule =
  sequelize.define(
    "ProductAttachmentRule",
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

      name: {
        type:
          DataTypes.STRING(
            250
          ),

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

      scopeType: {
        type:
          DataTypes.ENUM(
            "PRODUCT",
            "BRAND",
            "CATEGORY"
          ),

        allowNull:
          false,
      },

      productId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      brandId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      categoryId: {
        type:
          DataTypes.UUID,

        allowNull:
          true,
      },

      relationshipType: {
        type:
          DataTypes.ENUM(
            "ACCESSORY",
            "UPSELL",
            "CROSS_SELL",
            "ADD_ON",
            "BUNDLE_SUGGESTION",
            "COMPATIBLE_PRODUCT"
          ),

        allowNull:
          false,

        defaultValue:
          "ACCESSORY",
      },

      displayLocation: {
        type:
          DataTypes.ENUM(
            "PRODUCT_DETAIL",
            "ADD_TO_CART",
            "CART",
            "CHECKOUT",
            "ALL"
          ),

        allowNull:
          false,

        defaultValue:
          "PRODUCT_DETAIL",
      },

      priority: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          100,
      },

      effectiveFrom: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
      },

      effectiveUntil: {
        type:
          DataTypes.DATE,

        allowNull:
          true,
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
        "product_attachment_rules",

      timestamps:
        true,

        indexes: [
          {
            name:
              "uq_attach_rule_company_code",
        
            unique:
              true,
        
            fields: [
              "companyId",
              "code",
            ],
          },
        
          {
            name:
              "idx_attach_rule_product",
        
            fields: [
              "companyId",
              "scopeType",
              "productId",
              "isActive",
            ],
          },
        
          {
            name:
              "idx_attach_rule_brand",
        
            fields: [
              "companyId",
              "scopeType",
              "brandId",
              "isActive",
            ],
          },
        
          {
            name:
              "idx_attach_rule_category",
        
            fields: [
              "companyId",
              "scopeType",
              "categoryId",
              "isActive",
            ],
          },
        
          {
            name:
              "idx_attach_rule_location",
        
            fields: [
              "companyId",
              "displayLocation",
              "isActive",
            ],
          },
        
          {
            name:
              "idx_attach_rule_priority",
        
            fields: [
              "companyId",
              "priority",
            ],
          },
        ],
    }
  );

module.exports =
  ProductAttachmentRule;
