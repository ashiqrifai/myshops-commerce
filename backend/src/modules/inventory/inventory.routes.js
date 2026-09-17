const express = require("express");
const controller = require("./inventory.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");

const {
  listInventoryValidation,
  variantAvailabilityValidation,
  upsertBalanceValidation,
  adjustOnHandValidation,
} = require("./inventory.validation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("inventory.read"),
  listInventoryValidation,
  validateRequest,
  controller.listInventory
);

router.get(
  "/variants/:variantId/availability",
  authorize("inventory.read"),
  variantAvailabilityValidation,
  validateRequest,
  controller.getVariantAvailability
);

router.put(
  "/balances",
  authorize("inventory.update"),
  upsertBalanceValidation,
  validateRequest,
  controller.upsertBalance
);

router.post(
  "/adjust",
  authorize("inventory.update"),
  adjustOnHandValidation,
  validateRequest,
  controller.adjustOnHand
);

module.exports = router;
