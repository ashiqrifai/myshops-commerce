const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/paymentExceptionController"
  );

const authenticate =
  require(
    "../middleware/authenticate"
  );

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",
  controller.list
);

router.get(
  "/:id",
  controller.detail
);

router.post(
  "/:id/retry-allocation",
  controller.retryAllocation
);

router.post(
  "/:id/manual-review",
  controller.markManualReview
);

router.post(
  "/:id/resolve",
  controller.resolve
);

router.post(
  "/:id/refund-required",
  controller.markRefundRequired
);

router.post(
  "/:id/refunded",
  controller.markRefunded
);

module.exports =
  router;
