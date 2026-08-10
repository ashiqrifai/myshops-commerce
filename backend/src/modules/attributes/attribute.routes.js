const express = require("express");

const attributeController = require(
  "./attribute.controller"
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
  attributeIdValidation,
  attributeOptionIdValidation,
  listAttributesValidation,
  createAttributeValidation,
  updateAttributeValidation,
  changeAttributeStatusValidation,
  optionBodyValidation,
  updateOptionValidation,
  replaceCategoryAssignmentsValidation,
} = require(
  "./attribute.validation"
);

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("attributes.read"),
  listAttributesValidation,
  validateRequest,
  attributeController.listAttributes
);

router.post(
  "/",
  authorize("attributes.create"),
  createAttributeValidation,
  validateRequest,
  attributeController.createAttribute
);

router.get(
  "/:id",
  authorize("attributes.read"),
  attributeIdValidation,
  validateRequest,
  attributeController.getAttributeById
);

router.put(
  "/:id",
  authorize("attributes.update"),
  updateAttributeValidation,
  validateRequest,
  attributeController.updateAttribute
);

router.patch(
  "/:id/status",
  authorize("attributes.update"),
  changeAttributeStatusValidation,
  validateRequest,
  attributeController.changeAttributeStatus
);

router.post(
  "/:id/options",
  authorize("attributes.update"),
  optionBodyValidation,
  validateRequest,
  attributeController.createOption
);

router.put(
  "/:id/options/:optionId",
  authorize("attributes.update"),
  updateOptionValidation,
  validateRequest,
  attributeController.updateOption
);

router.delete(
  "/:id/options/:optionId",
  authorize("attributes.update"),
  attributeOptionIdValidation,
  validateRequest,
  attributeController.deleteOption
);

router.put(
  "/:id/categories",
  authorize("attributes.update"),
  replaceCategoryAssignmentsValidation,
  validateRequest,
  attributeController.replaceAssignments
);

router.delete(
  "/:id",
  authorize("attributes.delete"),
  attributeIdValidation,
  validateRequest,
  attributeController.deleteAttribute
);

module.exports = router;
