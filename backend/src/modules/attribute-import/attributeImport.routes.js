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
  "./attributeImport.controller"
);

const {
  handleAttributeImportUpload,
} = require(
  "./attributeImport.upload"
);

const router =
  express.Router();

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Template
|--------------------------------------------------------------------------
*/

router.get(
  "/template",

  authorize(
    "attributes.read"
  ),

  getTemplate
);

/*
|--------------------------------------------------------------------------
| Import
|--------------------------------------------------------------------------
*/

router.post(
  "/import",

  authorize(
    "attributes.create"
  ),

  handleAttributeImportUpload,

  importCsv
);

module.exports =
  router;