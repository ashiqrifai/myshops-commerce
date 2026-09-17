const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/deliveryEligibility.controller"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Cart / Checkout Delivery Plan
|--------------------------------------------------------------------------
*/

router.post(
  "/delivery-plan",
  controller.getDeliveryPlan
);

/*
|--------------------------------------------------------------------------
| Product / PDP Bulk Delivery Eligibility
|--------------------------------------------------------------------------
*/

router.post(
  "/eligibility",
  controller.getDeliveryEligibility
);

module.exports =
  router;