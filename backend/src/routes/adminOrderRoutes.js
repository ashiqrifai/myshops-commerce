const express =
  require(
    "express"
  );

const router =
  express.Router();

const authenticate =
  require(
    "../middleware/authenticate"
  );

const adminOrderController =
  require(
    "../controllers/adminOrderController"
  );

router.use(
  authenticate
);

router.get(
  "/",
  adminOrderController
    .listOrders
);

router.get(
  "/summary",
  adminOrderController
    .getOrderSummary
);

router.patch(
  "/:id/shipments/:shipmentId/status",
  adminOrderController
    .updateShipmentStatus
);

router.post(
  "/:id/zoho/retry",
  adminOrderController
    .retryZohoSalesOrder
);

router.get(
  "/:id",
  adminOrderController
    .getOrder
);

router.patch(
  "/:id/status",
  adminOrderController
    .updateOrderStatus
);

module.exports =
  router;
