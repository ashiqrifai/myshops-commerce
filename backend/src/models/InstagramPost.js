const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const InstagramPost =
    sequelize.define(
      "InstagramPost",
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
  
        mediaAssetId: {
          type:
            DataTypes.UUID,
  
          allowNull:
            false,
        },
  
        instagramUrl: {
          type:
            DataTypes.STRING(
              1000
            ),
  
          allowNull:
            false,
  
          validate: {
            notEmpty:
              true,
          },
        },
  
        caption: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
  
        altText: {
          type:
            DataTypes.STRING(
              500
            ),
  
          allowNull:
            true,
        },
  
        sortOrder: {
          type:
            DataTypes.INTEGER,
  
          allowNull:
            false,
  
          defaultValue:
            0,
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
          "instagram_posts",
  
        timestamps:
          true,
  
        indexes: [
          {
            fields: [
              "companyId",
              "isActive",
              "sortOrder",
            ],
          },
  
          {
            fields: [
              "mediaAssetId",
            ],
          },
        ],
      }
    );
  
  module.exports =
    InstagramPost;