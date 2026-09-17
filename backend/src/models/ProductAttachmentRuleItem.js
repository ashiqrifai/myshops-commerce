const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );

const ProductAttachmentRuleItem =
  sequelize.define(
    "ProductAttachmentRuleItem",
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

      ruleId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      attachmentProductId: {
        type:
          DataTypes.UUID,

        allowNull:
          false,
      },

      sortOrder: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          0,
      },

      minimumQuantity: {
        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          1,
      },

      maximumQuantity: {
        type:
          DataTypes.INTEGER,

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
        "product_attachment_rule_items",

      timestamps:
        true,

        indexes: [
          {
            name:
              "uq_attach_item_rule_product",
        
            unique:
              true,
        
            fields: [
              "companyId",
              "ruleId",
              "attachmentProductId",
            ],
          },
        
          {
            name:
              "idx_attach_item_rule",
        
            fields: [
              "companyId",
              "ruleId",
              "isActive",
            ],
          },
        
          {
            name:
              "idx_attach_item_product",
        
            fields: [
              "companyId",
              "attachmentProductId",
              "isActive",
            ],
          },
        
          {
            name:
              "idx_attach_item_sort",
        
            fields: [
              "companyId",
              "sortOrder",
            ],
          },
        ],
    }
  );

module.exports =
  ProductAttachmentRuleItem;
