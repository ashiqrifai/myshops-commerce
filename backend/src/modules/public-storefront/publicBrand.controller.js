const publicBrandService =
  require(
    "./publicBrand.service"
  );

const getPublicBrand =
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
        await publicBrandService
          .getPublicBrand({
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
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

module.exports = {
  getPublicBrand,
};