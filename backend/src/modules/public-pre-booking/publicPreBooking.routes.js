const express =
  require(
    "express"
  );

const controller =
  require(
    "./publicPreBooking.controller"
  );

const validation =
  require(
    "./publicPreBooking.validation"
  );

const checkoutRoutes =
  require(
    "./publicPreBookingCheckout.routes"
  );

const router =
  express.Router();

router.use(
  "/checkout-sessions",
  checkoutRoutes
);

/*
|--------------------------------------------------------------------------
| Campaign Listing
|--------------------------------------------------------------------------
*/

router.get(
  "/campaigns",
  controller
    .getCampaigns
);


router.get(
  "/campaigns/:slug",
  validation
    .campaignValidation,
  controller
    .getCampaign
);

router.get(
  "/campaigns/:slug/products/:productSlug",
  validation
    .campaignProductValidation,
  controller
    .getCampaignProduct
);

module.exports =
  router;
