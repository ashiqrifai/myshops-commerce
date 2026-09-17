const express =
  require("express");

const router =
  express.Router();

const tamaraController =
  require(
    "../controllers/tamaraController"
  );

  const authenticate =
  require(
    "../middleware/authenticate"
  );

/*
|--------------------------------------------------------------------------
| Public Tamara Checkout APIs
|--------------------------------------------------------------------------
*/

router.post(
  "/public/eligibility",
  tamaraController.checkEligibility
);

router.post(
  "/public/checkout",
  tamaraController.createCheckout
);

router.post(
  "/public/reconcile",
  tamaraController.reconcile
);



/*
|--------------------------------------------------------------------------
| Tamara Webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Do not attach customer JWT middleware.
| tamaraToken is validated by the controller.
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  tamaraController.webhook
);


router.post(
  "/refund",
  authenticate,
  tamaraController.refund
);


module.exports =
  router;