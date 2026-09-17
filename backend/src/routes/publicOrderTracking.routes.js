const express =
  require(
    "express"
  );

const router =
  express.Router();

const controller =
  require(
    "../controllers/publicOrderTracking.controller"
  );

router.post(
  "/request-otp",
  controller
    .requestOtp
);

router.post(
  "/verify-otp",
  controller
    .verifyOtp
);

router.get(
  "/:orderNumber",
  controller
    .getTrackingDetails
);

module.exports =
  router;
