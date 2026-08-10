const {
    DataTypes,
  } = require("sequelize");
  
  const sequelize = require(
    "../config/database"
  );
  
  const PriceList = sequelize.define(
    "PriceList",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue:
          DataTypes.UUIDV4,
        primaryKey: true,
      },
  
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
  
      code: {
        type:
          DataTypes.STRING(100),
        allowNull: false,
      },
  
      name: {
        type:
          DataTypes.STRING(250),
        allowNull: false,
      },
  
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
  
      priceListType: {
        type: DataTypes.ENUM(
          "STANDARD",
          "RETAIL",
          "B2B",
          "WHOLESALE",
          "VIP",
          "EMPLOYEE",
          "PROMOTIONAL"
        ),
        allowNull: false,
        defaultValue: "RETAIL",
      },
  
      channelCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "ALL",
    },
  
      currencyCode: {
        type:
          DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "AED",
      },
  
      isTaxInclusive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
  
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
  
      validFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
  
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
  
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
  
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "price_lists",
  
      timestamps: true,
  
      indexes: [
        {
          unique: true,
          fields: [
            "companyId",
            "code",
          ],
        },
  
        {
          fields: [
            "companyId",
            "isActive",
          ],
        },
  
        {
          fields: [
            "companyId",
            "channelCode",
            "isActive",
          ],
        },
  
        {
          fields: [
            "companyId",
            "priceListType",
            "isActive",
          ],
        },
  
        {
          fields: [
            "companyId",
            "priority",
          ],
        },
      ],
    }
  );
  
  module.exports = PriceList;