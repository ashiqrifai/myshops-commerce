const publicCollectionService =
  require(
    "./publicCollection.service"
  );

  const getPublicApiBaseUrl =
  require(
    "../../utils/getPublicApiBaseUrl"
  );

const getPublicCollection =
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
        await publicCollectionService
          .getPublicCollection({
            companyCode,

            slug:
              req.params.slug,

            channel:
              req.query.channel ||
              "WEBSITE",

            query:
              req.query,

            apiBaseUrl,
          });

      res.status(200).json({
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
  getPublicCollection,
};