const adminOrderService =
  require(
    "../services/adminOrderService"
  );

const kioskFulfillmentAssignmentService =
  require(
    "../services/kioskFulfillmentAssignment.service"
  );


const getCompanyId = (
  req
) =>
  req.user?.companyId ||
  req.auth?.companyId ||
  req.companyId ||
  null;

const getUserId = (
  req
) =>
  req.user?.id ||
  req.auth?.userId ||
  req.userId ||
  null;

const getIsSuperAdmin = (
  req
) =>
  req.user?.isSuperAdmin ===
  true;

const sendSuccess = (
  res,
  {
    data,
    statusCode =
      200,
  }
) =>
  res
    .status(statusCode)
    .json({
      success:
        true,

      data,

      meta: {
        timestamp:
          new Date()
            .toISOString(),
      },
    });

const sendError = (
  res,
  error
) => {
  console.error(
    "[Admin Orders]",
    error
  );

  const statusCode =
    error.statusCode ||
    error.status ||
    500;

  return res
    .status(statusCode)
    .json({
      success:
        false,

      error: {
        code:
          error.code ||
          "ADMIN_ORDER_ERROR",

        message:
          error.message ||
          "Unable to process order request.",

        details:
          error.details ||
          [],
      },

      meta: {
        timestamp:
          new Date()
            .toISOString(),
      },
    });
};

exports.listOrders =
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        getCompanyId(
          req
        );

      const result =
        await adminOrderService
          .listAdminOrders({
            companyId,

            userId:
              getUserId(req),

            isSuperAdmin:
              getIsSuperAdmin(req),
            search:
              req.query.search,
            orderStatus:
              req.query.orderStatus,
            paymentStatus:
              req.query.paymentStatus,
            paymentMethod:
              req.query.paymentMethod,
            fulfillmentStatus:
              req.query.fulfillmentStatus,
            deliveryMethod:
              req.query.deliveryMethod,
            dateFrom:
              req.query.dateFrom,
            dateTo:
              req.query.dateTo,
            page:
              req.query.page,
            pageSize:
              req.query.pageSize,
            sortBy:
              req.query.sortBy,
            sortDirection:
              req.query.sortDirection,
          });

      return sendSuccess(
        res,
        {
          data: {
            orders:
              result.rows,
            pagination:
              result.pagination,
          },
        }
      );
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.getOrderSummary =
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        getCompanyId(
          req
        );

      const summary =
        await adminOrderService
          .getAdminOrderSummary({
            companyId,

            userId:
              getUserId(req),

            isSuperAdmin:
              getIsSuperAdmin(req),
          });

      return sendSuccess(
        res,
        {
          data: {
            summary,
          },
        }
      );
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.getOrder =
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        getCompanyId(
          req
        );

      const result =
        await adminOrderService
          .getAdminOrderDetail({
            companyId,

            userId:
              getUserId(req),

            isSuperAdmin:
              getIsSuperAdmin(req),
            orderId:
              req.params.id,
          });

      return sendSuccess(
        res,
        {
          data:
            result,
        }
      );
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.getKioskFulfillmentAssignments =
  async (
    req,
    res
  ) => {

    try {

      const data =
        await kioskFulfillmentAssignmentService
          .listAssignments({
            companyId:
              getCompanyId(req),

            orderId:
              req.params.id,

            userId:
              getUserId(req),

            isSuperAdmin:
              getIsSuperAdmin(req),
          });

      return sendSuccess(
        res,
        {
          data,
        }
      );

    } catch (error) {

      return sendError(
        res,
        error
      );
    }
  };


exports.getKioskFulfillmentLocations =
  async (
    req,
    res
  ) => {

    try {

      const data =
        await kioskFulfillmentAssignmentService
          .listCandidateLocations({
            companyId:
              getCompanyId(req),

            orderId:
              req.params.id,

            assignmentId:
              req.params.assignmentId,

            userId:
              getUserId(req),

            isSuperAdmin:
              getIsSuperAdmin(req),
          });

      return sendSuccess(
        res,
        {
          data,
        }
      );

    } catch (error) {

      return sendError(
        res,
        error
      );
    }
  };


exports.assignKioskFulfillmentLocation =
  async (
    req,
    res
  ) => {

    try {

      const data =
        await kioskFulfillmentAssignmentService
          .assignLocation({
            companyId:
              getCompanyId(req),

            orderId:
              req.params.id,

            assignmentId:
              req.params.assignmentId,

            fulfillmentLocationId:
              req.body
                ?.fulfillmentLocationId,

            notes:
              req.body
                ?.notes ||
              null,

            userId:
              getUserId(req),

            isSuperAdmin:
              getIsSuperAdmin(req),
          });

      return sendSuccess(
        res,
        {
          data,
        }
      );

    } catch (error) {

      return sendError(
        res,
        error
      );
    }
  };


exports.updateOrderStatus =
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        getCompanyId(
          req
        );

      const changedBy =
        getUserId(
          req
        );

      const order =
        await adminOrderService
          .updateAdminOrderStatus({
            companyId,
            orderId:
              req.params.id,
            orderStatus:
              req.body?.orderStatus,
            fulfillmentStatus:
              req.body?.fulfillmentStatus,
            note:
              req.body?.note,
            changedBy,
          });

      return sendSuccess(
        res,
        {
          data: {
            order,
          },
        }
      );
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.updateShipmentStatus =
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        getCompanyId(
          req
        );

      const changedBy =
        getUserId(
          req
        );

      const result =
        await adminOrderService
          .updateAdminShipmentStatus({
            companyId,

            orderId:
              req.params.id,

            shipmentId:
              req.params.shipmentId,

            status:
              req.body?.status,

            note:
              req.body?.note,

            changedBy,
          });

      return sendSuccess(
        res,
        {
          data:
            result,
        }
      );
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.retryZohoSalesOrder =
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        getCompanyId(
          req
        );

      const changedBy =
        getUserId(
          req
        );

      const result =
        await adminOrderService
          .retryZohoSalesOrder({
            companyId,
            orderId:
              req.params.id,
            changedBy,
          });

      return sendSuccess(
        res,
        {
          data:
            result,
        }
      );
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };
