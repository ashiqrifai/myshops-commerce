const express = require(
  "express"
);

const pricingImportController = require(
  "./pricingImport.controller"
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
  previewPricingImportValidation,
  executePricingImportValidation,
} = require(
  "./pricingImport.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Preview
|--------------------------------------------------------------------------
*/

router.post(
  "/preview",
  authorize(
    "pricing.read"
  ),
  previewPricingImportValidation,
  validateRequest,
  pricingImportController.previewImport
);

/*
|--------------------------------------------------------------------------
| Execute
|--------------------------------------------------------------------------
*/

router.post(
  "/execute",

  /*
   * Replace pricing.write with the exact
   * permission used by your existing
   * create/update variant-price routes
   * if your permission code is different.
   */
  authorize(
    "pricing.write"
  ),

  executePricingImportValidation,

  validateRequest,

  pricingImportController.executeImport
);

module.exports =
  router;
