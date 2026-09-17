const publicActivityService =
  require(
    "./publicActivity.service"
  );

const trackActivity =
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

      const activity =
        await publicActivityService
          .trackStorefrontActivity({
            companyCode,

            /*
             * For now guest tracking uses visitorId.
             * We can wire authenticated customerId
             * when we connect customer auth.
             */
            customerId:
              null,

            visitorId:
              req.body
                ?.visitorId,

            activityType:
              req.body
                ?.activityType,

            productId:
              req.body
                ?.productId,

            variantId:
              req.body
                ?.variantId,

            categoryId:
              req.body
                ?.categoryId,

            brandId:
              req.body
                ?.brandId,

            collectionId:
              req.body
                ?.collectionId,

            searchQuery:
              req.body
                ?.searchQuery,

            quantity:
              req.body
                ?.quantity,

            source:
              req.body
                ?.source,

            pageUrl:
              req.body
                ?.pageUrl,

            referrer:
              req.body
                ?.referrer,

            channel:
              req.body
                ?.channel ||
              "WEBSITE",

            metadata:
              req.body
                ?.metadata ||
              {},
          });

      return res
        .status(
          201
        )
        .json({
          success:
            true,

          data: {
            id:
              activity.id,

            activityType:
              activity.activityType,

            createdAt:
              activity.createdAt,
          },
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
  trackActivity,
};