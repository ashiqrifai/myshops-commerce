const publicBrandService =
  require(
    "./publicBrand.service"
  );

const getPublicApiBaseUrl =
  require(
    "../../utils/getPublicApiBaseUrl"
  );

const getPublicBrands =
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
        await publicBrandService
          .getPublicBrands({
            companyCode,

            channel:
              req.query.channel ||
              "WEBSITE",

            apiBaseUrl,
          });

      res.status(
        200
      ).json({
        success:
          true,

        data:
          result,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

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
        getPublicApiBaseUrl(
          req
        );

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

      res.status(
        200
      ).json({
        success:
          true,

        data:
          result,
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
  getPublicBrands,
  getPublicBrand,
};