const publicProductService =
  require(
    "./publicProduct.service"
  );

exports.getPublicProduct =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        req.headers[
          "x-company-code"
        ] ||
        req.query.companyCode;

      const apiBaseUrl =
        `${req.protocol}://${req.get(
          "host"
        )}`;

      const result =
        await publicProductService
          .getPublicProduct({
            companyCode,
            slug:
              req.params.slug,
            channel:
              req.query.channel ||
              "WEBSITE",
            apiBaseUrl,
          });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
