const publicStorefrontService =
  require("./publicStorefront.service");

exports.getPublicStorefrontPage =
  async (req, res, next) => {
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
        await publicStorefrontService
          .getPublicStorefrontPage({
            companyCode,
            slug:
              req.query.slug || "/",
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