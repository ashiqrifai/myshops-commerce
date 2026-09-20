const express = require("express");

const publicStorefrontController =
  require(
    "./publicStorefront.controller"
  );

const publicCategoryController =
  require(
    "./publicCategory.controller"
  );

const publicExpressDeliveryController =
  require(
    "./publicExpressDelivery.controller"
  );

const validateRequest =
  require(
    "../../middleware/validateRequest"
  );

const {
  getPublicStorefrontPageValidation,
} = require(
  "./publicStorefront.validation"
);

const {
  getPublicCategoryValidation,
} = require(
  "./publicCategory.validation"
);

const publicProductController =
  require(
    "./publicProduct.controller"
  );

const {
  getPublicProductValidation,
} = require(
  "./publicProduct.validation"
);

const publicStorefrontAiController =
  require(
    "./publicStorefrontAi.controller"
  );

const {
  chatValidation,
} = require(
  "./publicStorefrontAi.validation"
);

const publicCollectionController =
  require(
    "./publicCollection.controller"
  );

const {
  getPublicCollectionValidation,
} = require(
  "./publicCollection.validation"
);

const publicBrandController =
  require(
    "./publicBrand.controller"
  );

const {
  getPublicBrandValidation,
} = require(
  "./publicBrand.validation"
);

const publicSearchController =
  require(
    "./publicSearch.controller"
  );

const {
  getPublicSearchValidation,
} = require(
  "./publicSearch.validation"
);

const publicSitemapController =
  require(
    "./publicSitemap.controller"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Category
|--------------------------------------------------------------------------
*/


router.get(
  "/categories",
  publicCategoryController
    .getPublicCategories
);

router.get(
  "/categories/:slug",
  getPublicCategoryValidation,
  validateRequest,
  publicCategoryController
    .getPublicCategory
);

/*
|--------------------------------------------------------------------------
| Express Delivery
|--------------------------------------------------------------------------
*/

router.get(
  "/express-delivery/products",
  publicExpressDeliveryController
    .getExpressDeliveryProducts
);

/*
|--------------------------------------------------------------------------
| Public Search
|--------------------------------------------------------------------------
*/

router.get(
  "/search",
  getPublicSearchValidation,
  validateRequest,
  publicSearchController
    .searchProducts
);

/*
|--------------------------------------------------------------------------
| Storefront Page
|--------------------------------------------------------------------------
*/

router.get(
  "/page",
  getPublicStorefrontPageValidation,
  validateRequest,
  publicStorefrontController
    .getPublicStorefrontPage
);

/*
|--------------------------------------------------------------------------
| Pickup Locations
|--------------------------------------------------------------------------
*/

router.get(
  "/pickup-locations",
  publicStorefrontController
    .getPickupLocations
);


/*
|--------------------------------------------------------------------------
| Sitemap
|--------------------------------------------------------------------------
*/

router.get(
  "/sitemap-data",
  publicSitemapController
    .getSitemapData
);

/*
|--------------------------------------------------------------------------
| Product
|--------------------------------------------------------------------------
*/

router.get(
  "/products/:slug",
  getPublicProductValidation,
  validateRequest,
  publicProductController
    .getPublicProduct
);

/*
|--------------------------------------------------------------------------
| Storefront AI
|--------------------------------------------------------------------------
*/

router.post(
  "/ai/chat",
  chatValidation,
  validateRequest,
  publicStorefrontAiController
    .chat
);

/*
|--------------------------------------------------------------------------
| Collection
|--------------------------------------------------------------------------
*/

router.get(
  "/collections/:slug",
  getPublicCollectionValidation,
  validateRequest,
  publicCollectionController
    .getPublicCollection
);

/*
|--------------------------------------------------------------------------
| Brand
|--------------------------------------------------------------------------
*/

router.get(
  "/brands",
  publicBrandController
    .getPublicBrands
);

router.get(
  "/brands/:slug",
  getPublicBrandValidation,
  validateRequest,
  publicBrandController
    .getPublicBrand
);

module.exports =
  router;
