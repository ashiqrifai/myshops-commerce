const express = require("express");

const cmsSectionTypeController =
  require(
    "./cmsSectionType.controller"
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
  listCmsSectionTypesValidation,
  cmsSectionTypeIdValidation,
} = require(
  "./cmsSectionType.validation"
);

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("cms.pages.read"),
  listCmsSectionTypesValidation,
  validateRequest,
  cmsSectionTypeController
    .listCmsSectionTypes
);

router.post(
  "/:id/sync-defaults",
  authorize("cms.pages.update"),
  cmsSectionTypeIdValidation,
  validateRequest,
  cmsSectionTypeController
    .syncCmsSectionTypeDefaults
);

router.get(
  "/:id",
  authorize("cms.pages.read"),
  cmsSectionTypeIdValidation,
  validateRequest,
  cmsSectionTypeController
    .getCmsSectionTypeById
);

module.exports = router;