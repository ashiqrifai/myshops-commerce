const service =
  require(
    "./customerOrder.service"
  );

exports.list =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.getOrders({
          customerId:
            req.customer.id,

          companyId:
            req.customer.companyId,

          page:
            req.query.page,

          pageSize:
            req.query.pageSize,
        });

      return res.status(
        200
      ).json({
        success:
          true,

        data:
          result,
      });
    } catch (error) {
      return next(
        error
      );
    }
  };

exports.getById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const order =
        await service.getOrderById({
          orderId:
            req.params.id,

          customerId:
            req.customer.id,

          companyId:
            req.customer.companyId,
        });

      return res.status(
        200
      ).json({
        success:
          true,

        data: {
          order,
        },
      });
    } catch (error) {
      return next(
        error
      );
    }
  };