const express = require("express");

const publicStorefrontController =
  require(
    "./publicStorefront.controller"
  );

const publicCategoryController =
  require(
    "./publicCategory.controller"
  );

const validateRequest = require(
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

const router = express.Router();

router.get(
  "/categories/:slug",
  getPublicCategoryValidation,
  validateRequest,
  publicCategoryController
    .getPublicCategory
);

router.get(
  "/page",
  getPublicStorefrontPageValidation,
  validateRequest,
  publicStorefrontController
    .getPublicStorefrontPage
);

router.get(
  "/products/:slug",
  getPublicProductValidation,
  validateRequest,
  publicProductController
    .getPublicProduct
);


router.post(
  "/ai/chat",
  chatValidation,
  validateRequest,
  publicStorefrontAiController
    .chat
);

router.get(
  "/collections/:slug",
  getPublicCollectionValidation,
  validateRequest,
  publicCollectionController
    .getPublicCollection
);

router.get(
  "/brands/:slug",
  getPublicBrandValidation,
  validateRequest,
  publicBrandController
    .getPublicBrand
);

router.get(
  "/search",
  getPublicSearchValidation,
  validateRequest,
  publicSearchController
    .searchProducts
);

module.exports = router;

