const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/networkInternationalController"
  );

const optionalAuthenticateCustomer =
  require(
    "../middleware/optionalAuthenticateCustomer"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Hosted Payment Page
|--------------------------------------------------------------------------
|
| Body:
|
| {
|   orderId
| }
|
| Backend creates the N-Genius order using the authoritative
| MyShops order amount and returns the hosted payment URL.
|--------------------------------------------------------------------------
*/

router.post(
  "/public/hosted-checkout",
  optionalAuthenticateCustomer,
  controller.createHostedCheckout
);

/*
|--------------------------------------------------------------------------
| Legacy Hosted Sessions Completion
|--------------------------------------------------------------------------
|
| Keep temporarily if anything still uses the old embedded
| Network International Hosted Sessions integration.
|--------------------------------------------------------------------------
*/

router.post(
  "/public/complete",
  optionalAuthenticateCustomer,
  controller.completeHostedSession
);

/*
|--------------------------------------------------------------------------
| Reconcile
|--------------------------------------------------------------------------
*/

router.post(
  "/public/reconcile",
  optionalAuthenticateCustomer,
  controller.reconcile
);

/*
|--------------------------------------------------------------------------
| Network International Webhook
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  controller.webhook
);

module.exports =
  router;
