const express = require("express");

const settingsController = require(
  "../modules/settings/settings.controller"
);

const router = express.Router();

router.get(
  "/website/:companyCode",
  settingsController.getPublicWebsiteSettings
);

router.get(
  "/kiosk/:companyCode",
  settingsController.getPublicKioskSettings
);

module.exports = router;