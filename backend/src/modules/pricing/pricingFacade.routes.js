const express = require(
  "express"
);

const controller = require(
  "./pricingFacade.controller"
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
  quoteItemValidation,
  quoteCartValidation,
  priceMatrixValidation,
} = require(
  "./pricingFacade.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Price Matrix
|--------------------------------------------------------------------------
*/

router.get(
  "/matrix",
  authorize(
    "pricing.read"
  ),
  priceMatrixValidation,
  validateRequest,
  controller.getPriceMatrix
);

/*
|--------------------------------------------------------------------------
| Quote One Item
|--------------------------------------------------------------------------
*/

router.post(
  "/quote-item",
  authorize(
    "pricing.read"
  ),
  quoteItemValidation,
  validateRequest,
  controller.quoteItem
);

/*
|--------------------------------------------------------------------------
| Quote Cart
|--------------------------------------------------------------------------
*/

router.post(
  "/quote-cart",
  authorize(
    "pricing.read"
  ),
  quoteCartValidation,
  validateRequest,
  controller.quoteCart
);

module.exports =
  router;