const orderTrackingService =
  require(
    "../services/orderTracking.service"
  );

const getCompanyId =
  (
    req
  ) =>
    req.companyId ||
    req.company?.id ||
    null;

const getCompanyCode =
  (
    req
  ) =>
    req.headers[
      "x-company-code"
    ] ||
    req.body
      ?.companyCode ||
    null;

const sendError =
  (
    res,
    error
  ) => {
    console.error(
      "[Public Order Tracking]",
      error
    );

    return res
      .status(
        error.statusCode ||
        error.status ||
        500
      )
      .json({
        success:
          false,

        error: {
          code:
            error.code ||
            "ORDER_TRACKING_ERROR",

          message:
            error.message ||
            "Unable to process order tracking request.",
        },
      });
  };

exports.requestOtp =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await orderTrackingService
          .requestOtp({
            companyId:
              getCompanyId(
                req
              ),

            companyCode:
              getCompanyCode(
                req
              ),

            orderNumber:
              req.body
                ?.orderNumber,

            email:
              req.body
                ?.email,

            requestIp:
              req.ip ||
              req.socket
                ?.remoteAddress ||
              null,

            userAgent:
              req.headers[
                "user-agent"
              ] ||
              null,
          });

      return res.json({
        success:
          true,

        data:
          result,
      });
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.verifyOtp =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await orderTrackingService
          .verifyOtp({
            companyId:
              getCompanyId(
                req
              ),

            companyCode:
              getCompanyCode(
                req
              ),

            orderNumber:
              req.body
                ?.orderNumber,

            email:
              req.body
                ?.email,

            otp:
              req.body
                ?.otp,
          });

      return res.json({
        success:
          true,

        data:
          result,
      });
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };

exports.getTrackingDetails =
  async (
    req,
    res
  ) => {
    try {
      const authHeader =
        String(
          req.headers
            .authorization ||
          ""
        ).trim();

      const bearerToken =
        authHeader
          .toLowerCase()
          .startsWith(
            "bearer "
          )
          ? authHeader.slice(
              7
            ).trim()
          : null;

      const result =
        await orderTrackingService
          .getTrackingDetails({
            companyId:
              getCompanyId(
                req
              ),

            companyCode:
              req.headers[
                "x-company-code"
              ] ||
              req.query
                ?.companyCode ||
              null,

            orderNumber:
              req.params
                .orderNumber,

            accessToken:
              bearerToken,
          });

      return res.json({
        success:
          true,

        data:
          result,
      });
    } catch (
      error
    ) {
      return sendError(
        res,
        error
      );
    }
  };
