// backend/src/models/Notification.js

const {
    DataTypes,
  } = require(
    "sequelize"
  );
  
  const sequelize =
  require(
    "../config/database"
  );
  
  const Notification =
  sequelize.define(
    "Notification",
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
  
      customerId: {
        type:
          DataTypes.UUID,
  
        allowNull:
          false,
      },
  
      type: {
        type:
          DataTypes.STRING(
            100
          ),
  
        allowNull:
          false,
      },
  
      channel: {
        type:
          DataTypes.ENUM(
            "IN_APP",
            "EMAIL",
            "SMS",
            "WHATSAPP",
            "PUSH"
          ),
  
        allowNull:
          false,
  
        defaultValue:
          "IN_APP",
      },
  
      title: {
        type:
          DataTypes.STRING(
            250
          ),
  
        allowNull:
          false,
      },
  
      message: {
        type:
          DataTypes.TEXT,
  
        allowNull:
          false,
      },
  
      entityType: {
        type:
          DataTypes.STRING(
            100
          ),
  
        allowNull:
          true,
      },
  
      entityId: {
        type:
          DataTypes.UUID,
  
        allowNull:
          true,
      },
  
      actionUrl: {
        type:
          DataTypes.STRING(
            1000
          ),
  
        allowNull:
          true,
      },
  
      data: {
        type:
          DataTypes.JSONB,
  
        allowNull:
          true,
  
        defaultValue:
          {},
      },
  
      readAt: {
        type:
          DataTypes.DATE,
  
        allowNull:
          true,
      },
  
      emailStatus: {
        type:
          DataTypes.ENUM(
            "NOT_REQUIRED",
            "PENDING",
            "SENT",
            "FAILED"
          ),
  
        allowNull:
          false,
  
        defaultValue:
          "NOT_REQUIRED",
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
        "notifications",
  
      indexes: [
        {
          fields: [
            "companyId",
            "customerId",
            "isActive",
          ],
        },
  
        {
          fields: [
            "customerId",
            "readAt",
          ],
        },
  
        {
          fields: [
            "companyId",
            "type",
          ],
        },
  
        {
          fields: [
            "entityType",
            "entityId",
          ],
        },
  
        {
          fields: [
            "emailStatus",
          ],
        },
  
        {
          fields: [
            "createdAt",
          ],
        },
      ],
  
      hooks: {
        beforeValidate(
          notification
        ) {
          const fields = [
            "type",
            "channel",
            "title",
            "message",
            "entityType",
            "actionUrl",
            "emailError",
          ];
  
          fields.forEach(
            (
              field
            ) => {
              if (
                typeof notification[
                  field
                ] ===
                "string"
              ) {
                const value =
                  notification[
                    field
                  ].trim();
  
                notification[
                  field
                ] =
                  value ||
                  null;
              }
            }
          );
  
          if (
            notification.type
          ) {
            notification.type =
              notification.type
                .toUpperCase();
          }
  
          if (
            notification.channel
          ) {
            notification.channel =
              notification.channel
                .toUpperCase();
          }
  
          if (
            notification.entityType
          ) {
            notification.entityType =
              notification.entityType
                .toUpperCase();
          }
        },
      },
    }
  );
  
  module.exports =
  Notification;