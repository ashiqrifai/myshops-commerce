const express = require("express");

const settingsController = require(
  "./settings.controller"
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
  listSettingsValidation,
  getSettingValidation,
  updateSettingValidation,
  bulkUpdateSettingsValidation,
} = require("./settings.validation");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("system.settings.read"),
  listSettingsValidation,
  validateRequest,
  settingsController.listAdminSettings
);

router.get(
  "/:id",
  authenticate,
  authorize("system.settings.read"),
  getSettingValidation,
  validateRequest,
  settingsController.getSettingById
);

router.patch(
  "/:id",
  authenticate,
  authorize("system.settings.update"),
  updateSettingValidation,
  validateRequest,
  settingsController.updateSetting
);

router.put(
  "/",
  authenticate,
  authorize("system.settings.update"),
  bulkUpdateSettingsValidation,
  validateRequest,
  settingsController.bulkUpdateSettings
);

module.exports = router;