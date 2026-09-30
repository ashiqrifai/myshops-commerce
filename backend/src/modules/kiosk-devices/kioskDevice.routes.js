const express=require("express");
const c=require("./kioskDevice.controller");
const authenticate=require("../../middleware/authenticate");
const authorize=require("../../middleware/authorize");
const authDevice=require("../../middleware/authenticateKioskDevice");
const validate=require("../../middleware/validateRequest");
const v=require("./kioskDevice.validation");

const adminRouter=express.Router();
adminRouter.use(authenticate);
adminRouter.get("/",authorize("cms.pages.read"),c.listDevices);
adminRouter.post("/",authorize("cms.pages.update"),v.createDeviceValidation,validate,c.createDevice);
adminRouter.post("/:id/regenerate-activation",authorize("cms.pages.update"),v.deviceIdValidation,validate,c.regenerateActivation);
adminRouter.patch("/:id/status",authorize("cms.pages.update"),v.changeStatusValidation,validate,c.changeStatus);

const kioskRouter=express.Router();
kioskRouter.post("/activate",v.activateDeviceValidation,validate,c.activateDevice);
kioskRouter.get("/bootstrap",authDevice,c.bootstrap);
kioskRouter.post("/heartbeat",authDevice,v.heartbeatValidation,validate,c.heartbeat);

module.exports={adminRouter,kioskRouter};
