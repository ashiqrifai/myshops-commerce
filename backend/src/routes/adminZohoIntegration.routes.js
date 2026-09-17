const express =
  require(
    "express"
  );

const authenticate =
  require(
    "../middleware/authenticate"
  );

const controller =
  require(
    "../controllers/adminZohoIntegration.controller"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| These routes use the normal MyShops admin JWT.
|
| The Zoho integration secret must NEVER be exposed to the browser.
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Item Link Status
|--------------------------------------------------------------------------
*/

router.get(
  "/item-link-status",
  controller
    .getItemLinkStatus
);

/*
|--------------------------------------------------------------------------
| Sync Items
|--------------------------------------------------------------------------
*/

router.post(
  "/sync-items",
  controller
    .syncItems
);

module.exports =
  router;