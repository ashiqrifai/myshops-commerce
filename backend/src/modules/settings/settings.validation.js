const { body, param, query } = require("express-validator");

const {
  SETTING_CHANNELS,
  SETTING_GROUPS,
} = require("./settings.constants");

exports.listSettingsValidation = [
  query("channel")
    .optional()
    .isIn(SETTING_CHANNELS)
    .withMessage("Invalid settings channel."),

  query("group")
    .optional()
    .isIn(SETTING_GROUPS)
    .withMessage("Invalid settings group."),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("Search text is too long."),
];

exports.getSettingValidation = [
  param("id")
    .isUUID()
    .withMessage("A valid setting ID is required."),
];

exports.updateSettingValidation = [
  param("id")
    .isUUID()
    .withMessage("A valid setting ID is required."),

  body("value")
    .exists()
    .withMessage("Setting value is required."),
];

exports.bulkUpdateSettingsValidation = [
  body("settings")
    .isArray({ min: 1, max: 200 })
    .withMessage(
      "Settings must be an array containing between 1 and 200 items."
    ),

  body("settings.*.id")
    .isUUID()
    .withMessage("Each setting must contain a valid ID."),

  body("settings.*.value")
    .exists()
    .withMessage("Each setting must contain a value."),
];

exports.publicSettingsValidation = [
  query("channel")
    .optional()
    .isIn(["GLOBAL", "WEBSITE"])
    .withMessage("Public settings support GLOBAL or WEBSITE only."),
];

exports.kioskSettingsValidation = [
  query("storeId")
    .optional()
    .isUUID()
    .withMessage("Store ID must be a valid UUID."),
];