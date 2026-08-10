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
  "./collectionImport.controller"
);

const {
  handleCollectionImportUpload,
} = require(
  "./collectionImport.upload"
);

const router =
express.Router();

router.use(
  authenticate
);

router.get(
  "/template",

  authorize(
    "collections.read"
  ),

  getTemplate
);

router.post(
  "/import",

  authorize(
    "collections.create"
  ),

  handleCollectionImportUpload,

  importCsv
);

module.exports =
router;