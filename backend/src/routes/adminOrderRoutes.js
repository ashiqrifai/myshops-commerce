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

const authorize =
  require(
    "../middleware/authorize"
  );

const adminOrderController =
  require(
    "../controllers/adminOrderController"
  );

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Every Admin Order route requires a valid authenticated admin user.
|
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| List Orders
|--------------------------------------------------------------------------
|
| GET /api/v1/admin/orders
|
| Permission:
| orders.read
|
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authorize(
    "orders.read"
  ),
  adminOrderController
    .listOrders
);

/*
|--------------------------------------------------------------------------
| Order Summary
|--------------------------------------------------------------------------
|
| GET /api/v1/admin/orders/summary
|
| Permission:
| orders.read
|
|--------------------------------------------------------------------------
*/

router.get(
  "/summary",
  authorize(
    "orders.read"
  ),
  adminOrderController
    .getOrderSummary
);

/*
|--------------------------------------------------------------------------
| Update Shipment Status
|--------------------------------------------------------------------------
|
| PATCH
| /api/v1/admin/orders/:id/shipments/:shipmentId/status
|
| Permission:
| orders.fulfill
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/shipments/:shipmentId/status",
  authorize(
    "orders.fulfill"
  ),
  adminOrderController
    .updateShipmentStatus
);

/*
|--------------------------------------------------------------------------
| Retry Zoho Sales Order
|--------------------------------------------------------------------------
|
| POST
| /api/v1/admin/orders/:id/zoho/retry
|
| Permission:
| orders.zoho-retry
|
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/zoho/retry",
  authorize(
    "orders.zoho-retry"
  ),
  adminOrderController
    .retryZohoSalesOrder
);

/*
|--------------------------------------------------------------------------
| Get Order Detail
|--------------------------------------------------------------------------
|
| GET /api/v1/admin/orders/:id
|
| Permission:
| orders.read
|
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  authorize(
    "orders.read"
  ),
  adminOrderController
    .getOrder
);

/*
|--------------------------------------------------------------------------
| Update Order Status
|--------------------------------------------------------------------------
|
| PATCH /api/v1/admin/orders/:id/status
|
| Permission:
| orders.update
|
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/status",
  authorize(
    "orders.update"
  ),
  adminOrderController
    .updateOrderStatus
);

module.exports =
  router;