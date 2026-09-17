const express =
  require("express");

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

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Everything below this line is Admin authenticated.
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Order Routes
|--------------------------------------------------------------------------
*/

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