const {
    DataTypes,
  } =
    require(
      "sequelize"
    );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const ZohoItemLinkStatus =
    sequelize.define(
      "ZohoItemLinkStatus",
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
  
        productVariantId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        sku: {
          type:
            DataTypes.STRING(
              255
            ),
  
          allowNull:
            true,
        },
  
        status: {
          type:
            DataTypes.ENUM(
              "LINKED",
              "SKU_NOT_FOUND_IN_ZOHO",
              "ZOHO_ITEM_MISSING_ID"
            ),
  
          allowNull:
            false,
        },
  
        zohoItemId: {
          type:
            DataTypes.STRING(
              100
            ),
  
          allowNull:
            true,
        },
  
        message: {
          type:
            DataTypes.STRING(
              500
            ),
  
          allowNull:
            true,
        },
  
        lastCheckedAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            false,
        },
      },
      {
        tableName:
          "zoho_item_link_statuses",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            fields: [
              "companyId",
              "productVariantId",
            ],
  
            name:
              "zoho_item_link_status_company_variant_unique",
          },
  
          {
            fields: [
              "companyId",
              "status",
            ],
  
            name:
              "zoho_item_link_status_company_status_idx",
          },
  
          {
            fields: [
              "sku",
            ],
  
            name:
              "zoho_item_link_status_sku_idx",
          },
        ],
      }
    );
  
  module.exports =
    ZohoItemLinkStatus;