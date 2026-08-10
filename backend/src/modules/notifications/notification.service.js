const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
  require(
    "../../models"
  );
  
  const AppError =
  require(
    "../../utils/AppError"
  );
  
  const messages =
  require(
    "./notification.messages"
  );
  
  const {
    mapNotification,
  } = require(
    "./notification.mapper"
  );
  
  const {
    NOTIFICATION_CHANNELS,
  } = require(
    "./notification.constants"
  );
  
  const cleanNullable =
  (
    value
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return null;
    }
  
    const text =
      String(
        value
      ).trim();
  
    return text ||
      null;
  };
  
  const normalizePage =
  (
    value
  ) => {
    const parsed =
      Number(
        value
      );
  
    if (
      !Number.isInteger(
        parsed
      ) ||
      parsed < 1
    ) {
      return 1;
    }
  
    return parsed;
  };
  
  const normalizeLimit =
  (
    value
  ) => {
    const parsed =
      Number(
        value
      );
  
    if (
      !Number.isInteger(
        parsed
      ) ||
      parsed < 1
    ) {
      return 20;
    }
  
    return Math.min(
      parsed,
      100
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Find customer-owned notification
  |--------------------------------------------------------------------------
  */
  
  const findOwnedNotification =
  async ({
    customer,
    notificationId,
    transaction,
    lock,
  }) => {
    const notification =
      await db.Notification
        .findOne({
          where: {
            id:
              notificationId,
  
            companyId:
              customer.companyId,
  
            customerId:
              customer.id,
  
            channel:
              "IN_APP",
  
            isActive:
              true,
          },
  
          transaction,
  
          lock:
            lock ||
            undefined,
        });
  
    if (
      !notification
    ) {
      throw new AppError(
        messages.NOT_FOUND,
        404,
        "CUSTOMER_NOTIFICATION_NOT_FOUND"
      );
    }
  
    return notification;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Internal notification creation
  |--------------------------------------------------------------------------
  |
  | This function is NOT an HTTP endpoint.
  |
  | Checkout, Orders, Payments, Refunds, Promotions etc. will call this
  | function directly.
  |
  */
  
  const createCustomerNotification =
  async ({
    companyId,
    customerId,
    type,
  
    channel =
      "IN_APP",
  
    title,
    message,
  
    entityType =
      null,
  
    entityId =
      null,
  
    actionUrl =
      null,
  
    data =
      {},
  
    transaction =
      undefined,
  }) => {
    const normalizedChannel =
      String(
        channel ||
        "IN_APP"
      )
        .trim()
        .toUpperCase();
  
    if (
      !companyId
    ) {
      throw new AppError(
        "Company ID is required when creating a notification.",
        400,
        "NOTIFICATION_COMPANY_REQUIRED"
      );
    }
  
    if (
      !customerId
    ) {
      throw new AppError(
        "Customer ID is required when creating a notification.",
        400,
        "NOTIFICATION_CUSTOMER_REQUIRED"
      );
    }
  
    if (
      !type
    ) {
      throw new AppError(
        "Notification type is required.",
        400,
        "NOTIFICATION_TYPE_REQUIRED"
      );
    }
  
    if (
      !title
    ) {
      throw new AppError(
        "Notification title is required.",
        400,
        "NOTIFICATION_TITLE_REQUIRED"
      );
    }
  
    if (
      !message
    ) {
      throw new AppError(
        "Notification message is required.",
        400,
        "NOTIFICATION_MESSAGE_REQUIRED"
      );
    }
  
    if (
      !NOTIFICATION_CHANNELS
        .includes(
          normalizedChannel
        )
    ) {
      throw new AppError(
        "Notification channel is invalid.",
        400,
        "INVALID_NOTIFICATION_CHANNEL"
      );
    }
  
    const notification =
      await db.Notification
        .create(
          {
            companyId,
  
            customerId,
  
            type:
              String(
                type
              )
                .trim()
                .toUpperCase(),
  
            channel:
              normalizedChannel,
  
            title:
              String(
                title
              ).trim(),
  
            message:
              String(
                message
              ).trim(),
  
            entityType:
              entityType
                ? String(
                    entityType
                  )
                    .trim()
                    .toUpperCase()
                : null,
  
            entityId:
              entityId ||
              null,
  
            actionUrl:
              cleanNullable(
                actionUrl
              ),
  
            data:
              data &&
              typeof data ===
                "object"
                ? data
                : {},
  
            readAt:
              null,
  
            emailStatus:
              normalizedChannel ===
              "EMAIL"
                ? "PENDING"
                : "NOT_REQUIRED",
  
            emailSentAt:
              null,
  
            emailError:
              null,
  
            isActive:
              true,
          },
          {
            transaction,
          }
        );
  
    return mapNotification(
      notification
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Customer notification list
  |--------------------------------------------------------------------------
  */
  
  const listNotifications =
  async ({
    customer,
    page =
      1,
    limit =
      20,
    unreadOnly =
      false,
    type =
      null,
  }) => {
    const currentPage =
      normalizePage(
        page
      );
  
    const pageSize =
      normalizeLimit(
        limit
      );
  
    const where = {
      companyId:
        customer.companyId,
  
      customerId:
        customer.id,
  
      channel:
        "IN_APP",
  
      isActive:
        true,
    };
  
    if (
      unreadOnly ===
        true ||
      unreadOnly ===
        "true"
    ) {
      where.readAt = {
        [
          Op.is
        ]:
          null,
      };
    }
  
    if (
      type
    ) {
      where.type =
        String(
          type
        )
          .trim()
          .toUpperCase();
    }
  
    const {
      rows,
      count,
    } =
      await db.Notification
        .findAndCountAll({
          where,
  
          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
  
          limit:
            pageSize,
  
          offset:
            (
              currentPage -
              1
            ) *
            pageSize,
        });
  
    const totalPages =
      count ===
      0
        ? 0
        : Math.ceil(
            count /
            pageSize
          );
  
    return {
      notifications:
        rows.map(
          mapNotification
        ),
  
      pagination: {
        page:
          currentPage,
  
        limit:
          pageSize,
  
        total:
          count,
  
        totalPages,
  
        hasNextPage:
          currentPage <
          totalPages,
  
        hasPreviousPage:
          currentPage >
          1,
      },
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Unread count
  |--------------------------------------------------------------------------
  */
  
  const getUnreadCount =
  async ({
    customer,
  }) => {
    const count =
      await db.Notification
        .count({
          where: {
            companyId:
              customer.companyId,
  
            customerId:
              customer.id,
  
            channel:
              "IN_APP",
  
            isActive:
              true,
  
            readAt: {
              [
                Op.is
              ]:
                null,
            },
          },
        });
  
    return {
      unreadCount:
        count,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Mark one notification as read
  |--------------------------------------------------------------------------
  */
  
  const markAsRead =
  async ({
    customer,
    notificationId,
  }) => {
    const transaction =
      await db.sequelize
        .transaction();
  
    try {
      const notification =
        await findOwnedNotification({
          customer,
  
          notificationId,
  
          transaction,
  
          lock:
            transaction
              .LOCK
              .UPDATE,
        });
  
      if (
        !notification.readAt
      ) {
        await notification
          .update(
            {
              readAt:
                new Date(),
            },
            {
              transaction,
            }
          );
      }
  
      await transaction
        .commit();
  
      return mapNotification(
        notification
      );
    } catch (
      error
    ) {
      await transaction
        .rollback();
  
      throw error;
    }
  };
  
  /*
  |--------------------------------------------------------------------------
  | Mark all notifications as read
  |--------------------------------------------------------------------------
  */
  
  const markAllAsRead =
  async ({
    customer,
  }) => {
    const now =
      new Date();
  
    const [
      updatedCount,
    ] =
      await db.Notification
        .update(
          {
            readAt:
              now,
          },
          {
            where: {
              companyId:
                customer.companyId,
  
              customerId:
                customer.id,
  
              channel:
                "IN_APP",
  
              isActive:
                true,
  
              readAt: {
                [
                  Op.is
                ]:
                  null,
              },
            },
          }
        );
  
    return {
      updatedCount,
  
      readAt:
        updatedCount >
        0
          ? now
          : null,
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Soft delete notification
  |--------------------------------------------------------------------------
  */
  
  const deleteNotification =
  async ({
    customer,
    notificationId,
  }) => {
    const transaction =
      await db.sequelize
        .transaction();
  
    try {
      const notification =
        await findOwnedNotification({
          customer,
  
          notificationId,
  
          transaction,
  
          lock:
            transaction
              .LOCK
              .UPDATE,
        });
  
      await notification
        .update(
          {
            isActive:
              false,
          },
          {
            transaction,
          }
        );
  
      await transaction
        .commit();
  
      return {
        id:
          notification.id,
  
        deleted:
          true,
      };
    } catch (
      error
    ) {
      await transaction
        .rollback();
  
      throw error;
    }
  };
  
  module.exports = {
    createCustomerNotification,
    listNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };