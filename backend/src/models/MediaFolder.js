const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MediaFolder = sequelize.define(
  "MediaFolder",
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

    parentFolderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    isSystemFolder: {
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
    tableName: "media_folders",

    indexes: [
      {
        unique: true,
        fields: ["companyId", "code"],
        name: "media_folders_company_code_unique",
      },
      {
        fields: [
          "companyId",
          "parentFolderId",
          "isActive",
        ],
        name: "media_folders_company_parent_active_idx",
      },
      {
        fields: ["companyId", "displayOrder"],
        name: "media_folders_company_order_idx",
      },
    ],
  }
);

module.exports = MediaFolder;