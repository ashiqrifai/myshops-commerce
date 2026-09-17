const service =
  require(
    "./publicCategory.service"
  );

exports.getExpressDeliveryProducts =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        String(
          req.headers[
            "x-company-code"
          ] ||
          req.query
            ?.companyCode ||
          "MYSHOPS"
        )
          .trim()
          .toUpperCase();

      const forwardedProto =
        String(
          req.headers[
            "x-forwarded-proto"
          ] ||
          ""
        )
          .split(",")[0]
          .trim();

      const protocol =
        forwardedProto ||
        req.protocol ||
        "https";

      const apiBaseUrl =
        String(
          process.env
            .PUBLIC_API_BASE_URL ||
          process.env
            .NEXT_PUBLIC_API_URL ||
          `${protocol}://${req.get(
            "host"
          )}`
        ).replace(
          /\/+$/,
          ""
        );

      const data =
        await service
          .getExpressDeliveryProducts({
            companyCode,

            region:
              req.query
                ?.region ||
              "DXB_SHJ",

            channel:
              req.query
                ?.channel ||
              "WEBSITE",

            query:
              req.query ||
              {},

            apiBaseUrl,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          data,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };
