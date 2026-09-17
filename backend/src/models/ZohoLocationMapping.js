const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ZohoLocationMapping = sequelize.define(
  "ZohoLocationMapping",
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

    zohoLocationId: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },

    zohoLocationCode: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },

    zohoLocationName: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },

    inventoryLocationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "zoho_location_mappings",
    timestamps: true,

    indexes: [
      {
        unique: true,
        name: "uq_zoho_location_mapping_external",
        fields: ["companyId", "zohoLocationId"],
      },
      {
        unique: true,
        name: "uq_zoho_location_mapping_internal",
        fields: ["companyId", "inventoryLocationId"],
      },
      {
        fields: ["companyId", "isActive"],
      },
    ],
  }
);

module.exports = ZohoLocationMapping;
