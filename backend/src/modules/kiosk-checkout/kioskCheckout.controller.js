const service =
  require(
    "./kioskCheckout.service"
  );


const createCheckout =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await service.createCheckout({
          device:
            req.kioskDevice,

          profile:
            req.kioskProfile,

          location:
            req.kioskLocation,

          payload:
            req.body ||
            {},
        });


      res
        .status(
          201
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



const recordPaymentResult =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await service.recordPaymentResult({
          device:
            req.kioskDevice,

          orderId:
            req.params.orderId,

          payload:
            req.body ||
            {},
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


const getProductAvailability =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await service.getProductAvailability({
          device:
            req.kioskDevice,

          location:
            req.kioskLocation,

          variantId:
            req.params.variantId,
        });

      res
        .status(200)
        .json({
          success:
            true,

          data:
            result,
        });

    } catch (error) {

      next(error);
    }
  };



module.exports = {
  createCheckout,
  recordPaymentResult,
  getProductAvailability,
};
