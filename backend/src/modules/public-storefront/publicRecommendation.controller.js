const publicRecommendationService =
  require(
    "./publicRecommendation.service"
  );

const getRecommendations =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        req.headers[
          "x-company-code"
        ];

      const visitorId =
        req.query
          ?.visitorId ||
        null;

      const channel =
        req.query
          ?.channel ||
        "WEBSITE";

      const limit =
        req.query
          ?.limit ||
        18;

      /*
       * Logged-in customer support will
       * be wired after guest recommendations
       * are confirmed working.
       */
      const customerId =
        null;

      const apiBaseUrl =
        `${req.protocol}://${req.get(
          "host"
        )}`;

      const data =
        await publicRecommendationService
          .getPublicRecommendations({
            companyCode,

            visitorId,

            customerId,

            channel,

            limit,

            apiBaseUrl,
          });

      return res.json({
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


const getCartRecommendations =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        req.headers[
          "x-company-code"
        ];

      const channel =
        req.body
          ?.channel ||
        "WEBSITE";

      const limit =
        req.body
          ?.limit ||
        12;

      const productIds =
        Array.isArray(
          req.body
            ?.productIds
        )
          ? req.body
              .productIds
          : [];

      const apiBaseUrl =
        `${req.protocol}://${req.get(
          "host"
        )}`;

      const data =
        await publicRecommendationService
          .getCartRecommendations({
            companyCode,
            productIds,
            channel,
            limit,
            apiBaseUrl,
          });

      return res.json({
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

module.exports = {
  getRecommendations,
  getCartRecommendations,
};