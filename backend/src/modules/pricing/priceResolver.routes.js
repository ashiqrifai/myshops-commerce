const express = require(
    "express"
  );
  
  const priceResolverController = require(
    "./priceResolver.controller"
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
    resolvePriceValidation,
    resolvePricesValidation,
  } = require(
    "./priceResolver.validation"
  );
  
  const router =
    express.Router();
  
  router.use(
    authenticate
  );
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Single Variant Price
  |--------------------------------------------------------------------------
  */
  
  router.post(
    "/resolve",
    authorize(
      "pricing.read"
    ),
    resolvePriceValidation,
    validateRequest,
    priceResolverController.resolvePrice
  );
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Multiple Variant Prices
  |--------------------------------------------------------------------------
  */
  
  router.post(
    "/resolve-batch",
    authorize(
      "pricing.read"
    ),
    resolvePricesValidation,
    validateRequest,
    priceResolverController.resolvePrices
  );
  
  module.exports =
    router;