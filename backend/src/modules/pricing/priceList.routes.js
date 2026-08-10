const express = require(
    "express"
  );
  
  const priceListController = require(
    "./priceList.controller"
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
    priceListIdValidation,
    listPriceListsValidation,
    createPriceListValidation,
    updatePriceListValidation,
    changePriceListStatusValidation,
  } = require(
    "./priceList.validation"
  );
  
  const router =
    express.Router();
  
  router.use(
    authenticate
  );
  
  /*
  |--------------------------------------------------------------------------
  | List Price Lists
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/",
    authorize(
      "pricing.read"
    ),
    listPriceListsValidation,
    validateRequest,
    priceListController.listPriceLists
  );
  
  /*
  |--------------------------------------------------------------------------
  | Create Price List
  |--------------------------------------------------------------------------
  */
  
  router.post(
    "/",
    authorize(
      "pricing.create"
    ),
    createPriceListValidation,
    validateRequest,
    priceListController.createPriceList
  );
  
  /*
  |--------------------------------------------------------------------------
  | Get Price List
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/:id",
    authorize(
      "pricing.read"
    ),
    priceListIdValidation,
    validateRequest,
    priceListController.getPriceListById
  );
  
  /*
  |--------------------------------------------------------------------------
  | Update Price List
  |--------------------------------------------------------------------------
  */
  
  router.put(
    "/:id",
    authorize(
      "pricing.update"
    ),
    updatePriceListValidation,
    validateRequest,
    priceListController.updatePriceList
  );
  
  /*
  |--------------------------------------------------------------------------
  | Change Price List Status
  |--------------------------------------------------------------------------
  */
  
  router.patch(
    "/:id/status",
    authorize(
      "pricing.update"
    ),
    changePriceListStatusValidation,
    validateRequest,
    priceListController.changePriceListStatus
  );
  
  /*
  |--------------------------------------------------------------------------
  | Delete Price List
  |--------------------------------------------------------------------------
  */
  
  router.delete(
    "/:id",
    authorize(
      "pricing.delete"
    ),
    priceListIdValidation,
    validateRequest,
    priceListController.deletePriceList
  );
  
  module.exports =
    router;