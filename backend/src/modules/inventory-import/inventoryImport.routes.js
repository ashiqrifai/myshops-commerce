const express = require("express");

const authenticate = require(
  "../../middleware/authenticate"
);

const authorize = require(
  "../../middleware/authorize"
);

const validateRequest = require(
  "../../middleware/validateRequest"
);

const controller = require(
  "./inventoryImport.controller"
);

const upload = require(
  "./inventoryImport.upload"
);

const {
  executeInventoryImportValidation,
} = require(
  "./inventoryImport.validation"
);

const router = express.Router();

router.use(authenticate);

router.get(
  "/template",
  authorize("inventory.read"),
  controller.downloadTemplate
);

router.get(
  "/export",
  authorize("inventory.read"),
  controller.exportInventory
);

router.post(
  "/preview",
  authorize("inventory.update"),
  upload,
  controller.previewUploadedCsv
);

router.post(
  "/execute",
  authorize("inventory.update"),
  executeInventoryImportValidation,
  validateRequest,
  controller.executeImport
);

module.exports = router;
