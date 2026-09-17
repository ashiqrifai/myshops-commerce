const express =
  require(
    "express"
  );

const controller =
  require(
    "./preBooking.controller"
  );

const authenticate =
  require(
    "../../middleware/authenticate"
  );

const authorize =
  require(
    "../../middleware/authorize"
  );

const validateRequest =
  require(
    "../../middleware/validateRequest"
  );

const {
  campaignIdValidation,
  campaignProductIdValidation,
  bundleIdValidation,
  bundleItemIdValidation,
  allocationIdValidation,

  listCampaignsValidation,
  createCampaignValidation,
  updateCampaignValidation,
  changeCampaignStatusValidation,

  createCampaignProductValidation,
  updateCampaignProductValidation,

  createBundleValidation,
  updateBundleValidation,

  createBundleItemValidation,
  updateBundleItemValidation,

  createProductAllocationValidation,
  createAllocationValidation,
  updateAllocationValidation,
} = require(
  "./preBooking.validation"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Campaigns
|--------------------------------------------------------------------------
*/

router.get(
  "/campaigns",

  authorize(
    "products.read"
  ),

  listCampaignsValidation,

  validateRequest,

  controller
    .listCampaigns
);

router.post(
  "/campaigns",

  authorize(
    "products.create"
  ),

  createCampaignValidation,

  validateRequest,

  controller
    .createCampaign
);

router.get(
  "/campaigns/:id",

  authorize(
    "products.read"
  ),

  campaignIdValidation,

  validateRequest,

  controller
    .getCampaignById
);

router.put(
  "/campaigns/:id",

  authorize(
    "products.update"
  ),

  updateCampaignValidation,

  validateRequest,

  controller
    .updateCampaign
);

router.patch(
  "/campaigns/:id/status",

  authorize(
    "products.update"
  ),

  changeCampaignStatusValidation,

  validateRequest,

  controller
    .changeCampaignStatus
);

router.delete(
  "/campaigns/:id",

  authorize(
    "products.delete"
  ),

  campaignIdValidation,

  validateRequest,

  controller
    .deleteCampaign
);

/*
|--------------------------------------------------------------------------
| Campaign Products
|--------------------------------------------------------------------------
*/

router.post(
  "/campaigns/:id/products",

  authorize(
    "products.update"
  ),

  createCampaignProductValidation,

  validateRequest,

  controller
    .createCampaignProduct
);

router.put(
  "/campaign-products/:campaignProductId",

  authorize(
    "products.update"
  ),

  updateCampaignProductValidation,

  validateRequest,

  controller
    .updateCampaignProduct
);

router.delete(
  "/campaign-products/:campaignProductId",

  authorize(
    "products.update"
  ),

  campaignProductIdValidation,

  validateRequest,

  controller
    .deleteCampaignProduct
);

/*
|--------------------------------------------------------------------------
| Product-Level Allocations
|--------------------------------------------------------------------------
|
| This route is used when the pre-booking product does NOT have a bundle.
|
| Example:
|
| iPhone 18 Pro Max
| allocation = 20
| bundleId = null
|--------------------------------------------------------------------------
*/

router.post(
  "/campaign-products/:campaignProductId/allocations",

  authorize(
    "products.update"
  ),

  createProductAllocationValidation,

  validateRequest,

  controller
    .createProductAllocation
);

/*
|--------------------------------------------------------------------------
| Bundles
|--------------------------------------------------------------------------
|
| Bundles are optional.
|--------------------------------------------------------------------------
*/

router.post(
  "/campaign-products/:campaignProductId/bundles",

  authorize(
    "products.update"
  ),

  createBundleValidation,

  validateRequest,

  controller
    .createBundle
);

router.put(
  "/bundles/:bundleId",

  authorize(
    "products.update"
  ),

  updateBundleValidation,

  validateRequest,

  controller
    .updateBundle
);

router.delete(
  "/bundles/:bundleId",

  authorize(
    "products.update"
  ),

  bundleIdValidation,

  validateRequest,

  controller
    .deleteBundle
);

/*
|--------------------------------------------------------------------------
| Bundle Items
|--------------------------------------------------------------------------
*/

router.post(
  "/bundles/:bundleId/items",

  authorize(
    "products.update"
  ),

  createBundleItemValidation,

  validateRequest,

  controller
    .createBundleItem
);

router.put(
  "/bundle-items/:bundleItemId",

  authorize(
    "products.update"
  ),

  updateBundleItemValidation,

  validateRequest,

  controller
    .updateBundleItem
);

router.delete(
  "/bundle-items/:bundleItemId",

  authorize(
    "products.update"
  ),

  bundleItemIdValidation,

  validateRequest,

  controller
    .deleteBundleItem
);

/*
|--------------------------------------------------------------------------
| Bundle Allocations
|--------------------------------------------------------------------------
|
| This route is used when allocation belongs to a bundle.
|
| Example:
|
| Blue Pebble = 10
| MyX         = 10
|--------------------------------------------------------------------------
*/

router.post(
  "/bundles/:bundleId/allocations",

  authorize(
    "products.update"
  ),

  createAllocationValidation,

  validateRequest,

  controller
    .createAllocation
);

/*
|--------------------------------------------------------------------------
| Allocation Update
|--------------------------------------------------------------------------
|
| Works for both:
|
| Product-level allocations
| Bundle-level allocations
|--------------------------------------------------------------------------
*/

router.put(
  "/allocations/:allocationId",

  authorize(
    "products.update"
  ),

  updateAllocationValidation,

  validateRequest,

  controller
    .updateAllocation
);

/*
|--------------------------------------------------------------------------
| Allocation Delete
|--------------------------------------------------------------------------
*/

router.delete(
  "/allocations/:allocationId",

  authorize(
    "products.update"
  ),

  allocationIdValidation,

  validateRequest,

  controller
    .deleteAllocation
);

module.exports =
  router;