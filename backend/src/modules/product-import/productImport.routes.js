const express =
  require("express");

const router =
  express.Router();

const {
  getProductImportTemplate,

  downloadProductImportTemplate,

  previewProductImportCsv,

  executeProductImport,

  importProductCsvDirectly,

  exportProductsCsv,
} = require(
  "./productImport.controller"
);

const {
  handleProductImportUpload,
} = require(
  "./productImport.upload"
);

const authenticate =
  require(
    "../../middleware/authenticate"
  );

const authorize =
  require(
    "../../middleware/authorize"
  );

const PRODUCT_IMPORT_VIEW_PERMISSION =
  "PRODUCT_IMPORT_VIEW";

const PRODUCT_IMPORT_EXECUTE_PERMISSION =
  "PRODUCT_IMPORT_EXECUTE";

router.use(
  authenticate
);

router.get(
  "/template",

  authorize(
    PRODUCT_IMPORT_VIEW_PERMISSION
  ),

  getProductImportTemplate
);

router.get(
  "/template/download",

  authorize(
    PRODUCT_IMPORT_VIEW_PERMISSION
  ),

  downloadProductImportTemplate
);

/*
|--------------------------------------------------------------------------
| Export Products
|--------------------------------------------------------------------------
|
| GET /api/v1/product-import/export
|
| Optional query parameters:
| - search
| - status
| - brandId
| - categoryId
| - productType
| - channelCode
| - isFeatured
| - productIds (comma-separated UUIDs)
|--------------------------------------------------------------------------
*/

router.get(
  "/export",

  authorize(
    PRODUCT_IMPORT_VIEW_PERMISSION
  ),

  exportProductsCsv
);

router.post(
  "/preview",

  authorize(
    PRODUCT_IMPORT_VIEW_PERMISSION
  ),

  handleProductImportUpload,

  previewProductImportCsv
);

router.post(
  "/execute",

  authorize(
    PRODUCT_IMPORT_EXECUTE_PERMISSION
  ),

  executeProductImport
);

router.post(
  "/import",

  authorize(
    PRODUCT_IMPORT_EXECUTE_PERMISSION
  ),

  handleProductImportUpload,

  importProductCsvDirectly
);

module.exports =
  router;
