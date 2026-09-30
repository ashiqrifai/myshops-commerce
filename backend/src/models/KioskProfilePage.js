const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const KioskProfilePage = sequelize.define(
  "KioskProfilePage",
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

    kioskProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    pageType: {
      type: DataTypes.ENUM(
        "HOME",
        "OFFERS",
        "WELCOME",
        "IDLE",
        "CUSTOM"
      ),
      allowNull: false,
      defaultValue: "HOME",
    },

    cmsPageId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: "kiosk_profile_pages",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: [
          "companyId",
          "kioskProfileId",
          "pageType",
        ],
        name: "kiosk_profile_pages_profile_type_unique",
      },
      {
        fields: ["companyId", "cmsPageId"],
      },
      {
        fields: ["companyId", "isActive"],
      },
    ],
  }
);

module.exports = KioskProfilePage;