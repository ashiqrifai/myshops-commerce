const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/zohoIntegration.controller"
  );

const authenticateZohoInventory =
  require(
    "../middleware/authenticateZohoInventory"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(
  authenticateZohoInventory
);


/*
|--------------------------------------------------------------------------
| Zoho Item Link Status
|--------------------------------------------------------------------------
*/

router.get(
  "/item-link-status",
  controller
    .getItemLinkStatus
);

/*
|--------------------------------------------------------------------------
| Zoho Item Sync
|--------------------------------------------------------------------------
*/

router.post(
  "/sync-items",
  controller.syncItems
);

/*
|--------------------------------------------------------------------------
| Zoho Inventory Pull Sync
|--------------------------------------------------------------------------
*/

router.post(
  "/sync-inventory",
  controller.syncInventory
);

/*
|--------------------------------------------------------------------------
| Zoho Locations
|--------------------------------------------------------------------------
*/

router.get(
  "/locations",
  controller.getLocations
);

/*
|--------------------------------------------------------------------------
| Sales Order
|--------------------------------------------------------------------------
*/

router.post(
  "/orders/:orderId/post",
  controller.postSalesOrder
);

module.exports =
  router;