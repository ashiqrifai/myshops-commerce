const express = require("express");
const router = express.Router();
const tabbyController = require("../controllers/tabbyController");

router.post("/public/prescore", tabbyController.prescore);
router.post("/public/checkout", tabbyController.createCheckout);
router.post("/public/reconcile", tabbyController.reconcile);

/*
|--------------------------------------------------------------------------
| Tabby Webhook
|--------------------------------------------------------------------------
|
| Public endpoint. Authentication is performed using the custom
| X-Tabby-Webhook-Secret header configured during webhook registration.
|--------------------------------------------------------------------------
*/

router.post(
  "/webhook",
  tabbyController.webhook
);

module.exports = router;
