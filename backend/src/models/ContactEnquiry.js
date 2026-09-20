const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const ContactEnquiry =
    sequelize.define(
      "ContactEnquiry",
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
  
        firstName: {
          type:
            DataTypes.STRING(100),
  
          allowNull:
            false,
        },
  
        lastName: {
          type:
            DataTypes.STRING(100),
  
          allowNull:
            false,
        },
  
        email: {
          type:
            DataTypes.STRING(320),
  
          allowNull:
            false,
  
          validate: {
            isEmail:
              true,
          },
        },
  
        message: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            false,
        },
  
        status: {
          type:
            DataTypes.ENUM(
              "NEW",
              "READ",
              "REPLIED",
              "CLOSED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "NEW",
        },
  
        emailSent: {
          type:
            DataTypes.BOOLEAN,
  
          allowNull:
            false,
  
          defaultValue:
            false,
        },
  
        emailSentAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
  
        emailError: {
          type:
            DataTypes.TEXT,
  
          allowNull:
            true,
        },
      },
      {
        tableName:
          "contact_enquiries",
  
        timestamps:
          true,
  
        indexes: [
          {
            fields: [
              "companyId",
              "status",
            ],
  
            name:
              "contact_enquiries_company_status_idx",
          },
  
          {
            fields: [
              "companyId",
              "createdAt",
            ],
  
            name:
              "contact_enquiries_company_created_idx",
          },
  
          {
            fields: [
              "email",
            ],
  
            name:
              "contact_enquiries_email_idx",
          },
        ],
      }
    );
  
  module.exports =
    ContactEnquiry;