const express = require("express");

const cmsPageController = require(
  "./cmsPage.controller"
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
  listCmsPagesValidation,
  cmsPageIdValidation,
  createCmsPageValidation,
  updateCmsPageValidation,
  changeCmsPageStatusValidation,
  changeCmsPageActiveValidation,
} = require("./cmsPage.validation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("cms.pages.read"),
  listCmsPagesValidation,
  validateRequest,
  cmsPageController.listCmsPages
);

router.post(
  "/",
  authorize("cms.pages.create"),
  createCmsPageValidation,
  validateRequest,
  cmsPageController.createCmsPage
);

router.get(
  "/:id",
  authorize("cms.pages.read"),
  cmsPageIdValidation,
  validateRequest,
  cmsPageController.getCmsPageById
);

router.put(
  "/:id",
  authorize("cms.pages.update"),
  updateCmsPageValidation,
  validateRequest,
  cmsPageController.updateCmsPage
);

router.patch(
  "/:id/status",
  authorize("cms.pages.publish"),
  changeCmsPageStatusValidation,
  validateRequest,
  cmsPageController.changeCmsPageStatus
);

router.patch(
  "/:id/active",
  authorize("cms.pages.update"),
  changeCmsPageActiveValidation,
  validateRequest,
  cmsPageController.changeCmsPageActive
);

router.post(
  "/:id/duplicate",
  authorize("cms.pages.create"),
  cmsPageIdValidation,
  validateRequest,
  cmsPageController.duplicateCmsPage
);

module.exports = router;