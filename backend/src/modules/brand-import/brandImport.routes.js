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
  "./brandImport.controller"
);

const {
  handleBrandImportUpload,
} = require(
  "./brandImport.upload"
);

const router =
express.Router();

router.use(
  authenticate
);

router.get(
  "/template",

  authorize(
    "brands.read"
  ),

  getTemplate
);

router.post(
  "/import",

  authorize(
    "brands.create"
  ),

  handleBrandImportUpload,

  importCsv
);

module.exports =
router;