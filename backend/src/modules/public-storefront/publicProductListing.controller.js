const {
  validationResult,
} = require(
  "express-validator"
);

const productListingService =
  require(
    "./publicProductListing.service"
  );


const getPublicProductListing =
  async (
    req,
    res,
    next
  ) => {

    try {

      const errors =
        validationResult(
          req
        );

      if (
        !errors.isEmpty()
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "VALIDATION_ERROR",

              message:
                "Invalid product listing request.",

              details:
                errors.array(),
            },
          });
      }

      const companyCode =
        req.headers[
          "x-company-code"
        ] ||
        req.query.companyCode;

      const channel =
        req.query.channel ||
        "WEBSITE";

      const protocol =
        req.headers[
          "x-forwarded-proto"
        ] ||
        req.protocol;

      const host =
        req.get(
          "host"
        );

      const apiBaseUrl =
        host
          ? `${protocol}://${host}`
          : "";

      const result =
        await productListingService
          .getPublicProductListing({
            companyCode,

            url:
              req.query.url,

            channel,

            apiBaseUrl,

            query:
              req.query,
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

      return next(
        error
      );
    }
  };


module.exports = {
  getPublicProductListing,
};
