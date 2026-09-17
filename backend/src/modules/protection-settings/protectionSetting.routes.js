const express =
  require(
    "express"
  );

const protectionSettingController =
  require(
    "./protectionSetting.controller"
  );

const authenticate =
  require(
    "../../middleware/authenticate"
  );

const authorize =
  require(
    "../../middleware/authorize"
  );

const validateRequest =
  require(
    "../../middleware/validateRequest"
  );

const {
  getProtectionSettingValidation,
  updateProtectionSettingValidation,
} = require(
  "./protectionSetting.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",
  authorize(
    "protection_settings.read"
  ),
  getProtectionSettingValidation,
  validateRequest,
  protectionSettingController
    .getProtectionSetting
);

router.put(
  "/",
  authorize(
    "protection_settings.update"
  ),
  updateProtectionSettingValidation,
  validateRequest,
  protectionSettingController
    .updateProtectionSetting
);

module.exports =
  router;
