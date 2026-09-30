const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const KioskProfile = sequelize.define(
  "KioskProfile",
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

    inventoryLocationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
    tableName: "kiosk_profiles",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
        name: "kiosk_profiles_company_code_unique",
      },
      {
        fields: ["companyId", "inventoryLocationId"],
      },
      {
        fields: ["companyId", "isActive"],
      },
      {
        fields: ["companyId", "isDefault"],
      },
    ],
  }
);

module.exports = KioskProfile;