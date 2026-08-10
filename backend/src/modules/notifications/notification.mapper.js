const mapNotification =
(
  model
) => {
  const notification =
    model?.get
      ? model.get({
          plain:
            true,
        })
      : model;

  if (
    !notification
  ) {
    return null;
  }

  return {
    id:
      notification.id,

    companyId:
      notification.companyId,

    customerId:
      notification.customerId,

    type:
      notification.type,

    channel:
      notification.channel,

    title:
      notification.title,

    message:
      notification.message,

    entity: {
      type:
        notification.entityType,

      id:
        notification.entityId,
    },

    actionUrl:
      notification.actionUrl,

    data:
      notification.data ||
      {},

    isRead:
      Boolean(
        notification.readAt
      ),

    readAt:
      notification.readAt,

    email: {
      status:
        notification.emailStatus,

      sentAt:
        notification.emailSentAt,

      error:
        notification.emailError,
    },

    createdAt:
      notification.createdAt,

    updatedAt:
      notification.updatedAt,
  };
};

module.exports = {
  mapNotification,
};