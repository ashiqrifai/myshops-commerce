const express =
  require(
    "express"
  );

const controller =
  require(
    "./kioskCheckout.controller"
  );

const authenticateKioskDevice =
  require(
    "../../middleware/authenticateKioskDevice"
  );


const router =
  express.Router();


router.post(
  "/checkout",
  express.json({
    limit:
      "128kb",
  }),
  authenticateKioskDevice,
  controller.createCheckout
);




router.post(
  "/checkout/:orderId/payment-result",
  express.json({
    limit:
      "256kb",
  }),
  authenticateKioskDevice,
  controller.recordPaymentResult
);


router.get(
  "/products/:variantId/availability",
  authenticateKioskDevice,
  controller.getProductAvailability
);



module.exports =
  router;
