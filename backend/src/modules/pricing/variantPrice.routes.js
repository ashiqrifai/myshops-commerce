const express = require(
    "express"
  );
  
  const variantPriceController = require(
    "./variantPrice.controller"
  );
  
  const authenticate = require(
    "../../middleware/authenticate"
  );
  
  const authorize = require(
    "../../middleware/authorize"
  );
  
  const validateRequest = require(
    "../../middleware/validateRequest"
  );
  
  const {
    variantPriceIdValidation,
    listVariantPricesValidation,
    createVariantPriceValidation,
    updateVariantPriceValidation,
    changeVariantPriceStatusValidation,
    getPricesByVariantValidation,
    getPricesByProductValidation,
  } = require(
    "./variantPrice.validation"
  );
  
  const router =
    express.Router();
  
  router.use(
    authenticate
  );
  
  /*
  |--------------------------------------------------------------------------
  | List
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/",
    authorize(
      "pricing.read"
    ),
    listVariantPricesValidation,
    validateRequest,
    variantPriceController.listVariantPrices
  );
  
  /*
  |--------------------------------------------------------------------------
  | Create
  |--------------------------------------------------------------------------
  */
  
  router.post(
    "/",
    authorize(
      "pricing.create"
    ),
    createVariantPriceValidation,
    validateRequest,
    variantPriceController.createVariantPrice
  );
  
  /*
  |--------------------------------------------------------------------------
  | Get by Variant
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/by-variant/:variantId",
    authorize(
      "pricing.read"
    ),
    getPricesByVariantValidation,
    validateRequest,
    variantPriceController.getPricesByVariant
  );
  
  /*
  |--------------------------------------------------------------------------
  | Get by Product
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/by-product/:productId",
    authorize(
      "pricing.read"
    ),
    getPricesByProductValidation,
    validateRequest,
    variantPriceController.getPricesByProduct
  );
  
  /*
  |--------------------------------------------------------------------------
  | Get By Id
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/:id",
    authorize(
      "pricing.read"
    ),
    variantPriceIdValidation,
    validateRequest,
    variantPriceController.getVariantPriceById
  );
  
  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */
  
  router.put(
    "/:id",
    authorize(
      "pricing.update"
    ),
    updateVariantPriceValidation,
    validateRequest,
    variantPriceController.updateVariantPrice
  );
  
  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */
  
  router.patch(
    "/:id/status",
    authorize(
      "pricing.update"
    ),
    changeVariantPriceStatusValidation,
    validateRequest,
    variantPriceController.changeVariantPriceStatus
  );
  
  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */
  
  router.delete(
    "/:id",
    authorize(
      "pricing.delete"
    ),
    variantPriceIdValidation,
    validateRequest,
    variantPriceController.deleteVariantPrice
  );
  
  module.exports =
    router;