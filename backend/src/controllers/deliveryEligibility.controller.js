const service =
  require(
    "../services/deliveryEligibility.service"
  );

/*
|--------------------------------------------------------------------------
| Complete Cart Delivery Plan
|--------------------------------------------------------------------------
*/

exports.getDeliveryPlan =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .buildDeliveryPlan({
            companyCode:
              req.body
                ?.companyCode ||
              "MYSHOPS",

            cityCode:
              req.body
                ?.cityCode,

            items:
              req.body
                ?.items ||
              [],
          });

      res
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
      next(
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Bulk Product Delivery Eligibility
|--------------------------------------------------------------------------
*/

exports.getDeliveryEligibility =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .buildDeliveryEligibility({
            companyCode:
              req.body
                ?.companyCode ||
              "MYSHOPS",

            items:
              req.body
                ?.items ||
              [],
          });

      res
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
      next(
        error
      );
    }
  };