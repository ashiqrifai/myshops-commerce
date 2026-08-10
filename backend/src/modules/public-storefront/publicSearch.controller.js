const publicSearchService =
  require(
    "./publicSearch.service"
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
        `${req.protocol}://${req.get(
          "host"
        )}`;

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