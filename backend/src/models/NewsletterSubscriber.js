const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
    require(
      "../config/database"
    );
  
  const NewsletterSubscriber =
    sequelize.define(
      "NewsletterSubscriber",
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
  
        email: {
          type:
            DataTypes.STRING(
              320
            ),
  
          allowNull:
            false,
  
          validate: {
            isEmail:
              true,
          },
        },
  
        status: {
          type:
            DataTypes.ENUM(
              "SUBSCRIBED",
              "UNSUBSCRIBED"
            ),
  
          allowNull:
            false,
  
          defaultValue:
            "SUBSCRIBED",
        },
  
        subscribedAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            false,
  
          defaultValue:
            DataTypes.NOW,
        },
  
        unsubscribedAt: {
          type:
            DataTypes.DATE,
  
          allowNull:
            true,
        },
      },
      {
        tableName:
          "newsletter_subscribers",
  
        timestamps:
          true,
  
        indexes: [
          {
            unique:
              true,
  
            fields: [
              "companyId",
              "email",
            ],
  
            name:
              "newsletter_subscribers_company_email_unique",
          },
  
          {
            fields: [
              "companyId",
              "status",
            ],
  
            name:
              "newsletter_subscribers_company_status_idx",
          },
        ],
      }
    );
  
  module.exports =
    NewsletterSubscriber;