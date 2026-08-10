const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize = require(
    "../config/database"
  );
  
  const ProductCollection =
    sequelize.define(
      "ProductCollection",
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
  
        collectionId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        productId: {
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
  
          validate: {
            min:
              0,
          },
        },
  
        createdBy: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
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
          "product_collections",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            fields: [
              "collectionId",
              "productId",
            ],
  
            name:
              "product_collections_collection_product_unique",
          },
  
          {
            fields: [
              "companyId",
              "collectionId",
            ],
  
            name:
              "product_collections_company_collection_idx",
          },
  
          {
            fields: [
              "companyId",
              "productId",
            ],
  
            name:
              "product_collections_company_product_idx",
          },
  
          {
            fields: [
              "collectionId",
              "sortOrder",
            ],
  
            name:
              "product_collections_collection_sort_idx",
          },
        ],
      }
    );
  
  module.exports =
    ProductCollection;