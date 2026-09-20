const publicSitemapService =
  require(
    "./publicSitemap.service"
  );

const getSitemapData =
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

      const result =
        await publicSitemapService
          .getSitemapData({
            companyCode,
          });

      /*
      |--------------------------------------------------------------------------
      | Cache
      |--------------------------------------------------------------------------
      |
      | Sitemap data does not need second-by-second freshness.
      |
      | Browser/CDN:
      |   5 minutes
      |
      | Shared/proxy cache:
      |   1 hour
      |
      |--------------------------------------------------------------------------
      */

      res.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
      );

      res
        .status(200)
        .json({
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
  getSitemapData,
};