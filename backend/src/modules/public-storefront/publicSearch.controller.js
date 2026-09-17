const publicSearchService =
  require(
    "./publicSearch.service"
  );

  const getPublicApiBaseUrl =
  require(
    "../../utils/getPublicApiBaseUrl"
  );

const searchProducts =
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
        getPublicApiBaseUrl(
          req
        );

      const result =
        await publicSearchService
          .searchProducts({
            companyCode,

            channel:
              req.query.channel ||
              "WEBSITE",

            query:
              req.query,

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

module.exports = {
  searchProducts,
};