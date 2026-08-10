const publicCategoryService =
  require(
    "./publicCategory.service"
  );

const getPublicCategory =
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
        await publicCategoryService
          .getPublicCategory({
            companyCode,
            slug: req.params.slug,
            channel:
              req.query.channel ||
              "WEBSITE",
            query: req.query,
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
  getPublicCategory,
};
