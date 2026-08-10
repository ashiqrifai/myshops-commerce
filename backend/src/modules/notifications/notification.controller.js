const service =
require(
  "./notification.service"
);

const messages =
require(
  "./notification.messages"
);

exports.list =
async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service
        .listNotifications({
          customer:
            req.customer,

          page:
            req.query.page,

          limit:
            req.query.limit,

          unreadOnly:
            req.query
              .unreadOnly,

          type:
            req.query.type,
        });

    return res
      .status(
        200
      )
      .json({
        success:
          true,

        data:
          result
            .notifications,

        meta:
          result
            .pagination,
      });
  } catch (
    error
  ) {
    return next(
      error
    );
  }
};

exports.unreadCount =
async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service
        .getUnreadCount({
          customer:
            req.customer,
        });

    return res
      .status(
        200
      )
      .json({
        success:
          true,

        data:
          result,
      });
  } catch (
    error
  ) {
    return next(
      error
    );
  }
};

exports.markAsRead =
async (
  req,
  res,
  next
) => {
  try {
    const notification =
      await service
        .markAsRead({
          customer:
            req.customer,

          notificationId:
            req.params.id,
        });

    return res
      .status(
        200
      )
      .json({
        success:
          true,

        message:
          messages
            .MARKED_AS_READ,

        data:
          notification,
      });
  } catch (
    error
  ) {
    return next(
      error
    );
  }
};

exports.markAllAsRead =
async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service
        .markAllAsRead({
          customer:
            req.customer,
        });

    return res
      .status(
        200
      )
      .json({
        success:
          true,

        message:
          messages
            .ALL_MARKED_AS_READ,

        data:
          result,
      });
  } catch (
    error
  ) {
    return next(
      error
    );
  }
};

exports.remove =
async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service
        .deleteNotification({
          customer:
            req.customer,

          notificationId:
            req.params.id,
        });

    return res
      .status(
        200
      )
      .json({
        success:
          true,

        message:
          messages.DELETED,

        data:
          result,
      });
  } catch (
    error
  ) {
    return next(
      error
    );
  }
};