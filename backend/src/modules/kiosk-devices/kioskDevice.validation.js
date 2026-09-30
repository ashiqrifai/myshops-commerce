const {body,param}=require("express-validator");
exports.deviceIdValidation=[param("id").isUUID().withMessage("A valid kiosk device ID is required.")];
exports.createDeviceValidation=[
 body("kioskProfileId").isUUID().withMessage("A valid kiosk profile ID is required."),
 body("deviceCode").trim().notEmpty().isLength({max:120}).withMessage("Device code is required."),
 body("deviceName").trim().notEmpty().isLength({max:180}).withMessage("Device name is required.")
];
exports.activateDeviceValidation=[
 body("deviceCode").trim().notEmpty().withMessage("Device code is required."),
 body("activationCode").trim().notEmpty().withMessage("Activation code is required."),
 body("appVersion").optional({nullable:true}).isString().isLength({max:50})
];
exports.heartbeatValidation=[body("appVersion").optional({nullable:true}).isString().isLength({max:50})];
exports.changeStatusValidation=[
 ...exports.deviceIdValidation,
 body("status").isIn(["PENDING","ACTIVE","DISABLED"]).withMessage("Invalid kiosk device status.")
];
