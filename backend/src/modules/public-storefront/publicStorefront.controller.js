const publicStorefrontService =
  require("./publicStorefront.service");

const publicPickupService =
  require("./publicPickup.service");


  const getPublicApiBaseUrl =
  require(
    "../../utils/getPublicApiBaseUrl"
  );

exports.getPublicStorefrontPage =
  async (req, res, next) => {
    try {
      const companyCode =
        req.headers[
          "x-company-code"
        ] ||
        req.query.companyCode;

        const apiBaseUrl =
        getPublicApiBaseUrl(
          req
        );

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

exports.getPickupLocations =
  async (req, res, next) => {
    try {
      const companyCode =
        req.headers["x-company-code"] ||
        req.query.companyCode;

      const result =
        await publicPickupService
          .getPickupLocations({
            companyCode,
            variantId:
              req.query.variantId,
            quantity:
              req.query.quantity || 1,
          });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
