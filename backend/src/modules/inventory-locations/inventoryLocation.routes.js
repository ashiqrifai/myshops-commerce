const express = require("express");
const controller = require("./inventoryLocation.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");

const {
  locationIdValidation,
  listLocationsValidation,
  createLocationValidation,
  updateLocationValidation,
  changeLocationStatusValidation,
} = require("./inventoryLocation.validation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("inventory-locations.read"),
  listLocationsValidation,
  validateRequest,
  controller.listLocations
);

router.post(
  "/",
  authorize("inventory-locations.create"),
  createLocationValidation,
  validateRequest,
  controller.createLocation
);

router.get(
  "/:id",
  authorize("inventory-locations.read"),
  locationIdValidation,
  validateRequest,
  controller.getLocationById
);

router.put(
  "/:id",
  authorize("inventory-locations.update"),
  updateLocationValidation,
  validateRequest,
  controller.updateLocation
);

router.patch(
  "/:id/status",
  authorize("inventory-locations.update"),
  changeLocationStatusValidation,
  validateRequest,
  controller.changeLocationStatus
);

router.delete(
  "/:id",
  authorize("inventory-locations.delete"),
  locationIdValidation,
  validateRequest,
  controller.deleteLocation
);

module.exports = router;
