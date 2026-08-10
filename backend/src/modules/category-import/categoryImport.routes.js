const express =
require(
  "express"
);

const authenticate =
require(
  "../../middleware/authenticate"
);

const authorize =
require(
  "../../middleware/authorize"
);

const {
  getTemplate,
  importCsv,
} = require(
  "./categoryImport.controller"
);

const {
  handleCategoryImportUpload,
} = require(
  "./categoryImport.upload"
);

const router =
express.Router();

router.use(
  authenticate
);

router.get(
  "/template",

  authorize(
    "CATEGORY_VIEW"
  ),

  getTemplate
);

router.post(
  "/import",

  authorize(
    "CATEGORY_CREATE"
  ),

  handleCategoryImportUpload,

  importCsv
);

module.exports =
router;