const express = require("express");

const controller = require(
  "../controllers/zohoInventoryIntegration.controller"
);

const authenticateZohoInventory = require(
  "../middleware/authenticateZohoInventory"
);

const router = express.Router();

router.use(
  authenticateZohoInventory
);

router.get(
  "/location-mappings",
  controller.listLocationMappings
);

router.post(
  "/location-mappings",
  controller.upsertLocationMapping
);

router.post(
  "/inventory/snapshot",
  controller.applyStockSnapshot
);

router.post(
  "/inventory/transaction",
  controller.processTransaction
);

module.exports = router;
