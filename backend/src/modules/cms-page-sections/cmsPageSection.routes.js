const express = require("express");

const cmsPageSectionController = require(
  "./cmsPageSection.controller"
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
  cmsPageIdValidation,
  cmsPageSectionIdValidation,
  createCmsPageSectionValidation,
  updateCmsPageSectionValidation,
  changeCmsPageSectionEnabledValidation,
  reorderCmsPageSectionsValidation,
} = require("./cmsPageSection.validation");

const router = express.Router({
  mergeParams: true,
});

router.use(authenticate);

router.get(
  "/",
  authorize("cms.pages.read"),
  cmsPageIdValidation,
  validateRequest,
  cmsPageSectionController.listCmsPageSections
);

router.post(
  "/",
  authorize("cms.pages.update"),
  createCmsPageSectionValidation,
  validateRequest,
  cmsPageSectionController.createCmsPageSection
);

router.put(
  "/reorder",
  authorize("cms.pages.update"),
  reorderCmsPageSectionsValidation,
  validateRequest,
  cmsPageSectionController.reorderCmsPageSections
);

router.get(
  "/:sectionId",
  authorize("cms.pages.read"),
  cmsPageSectionIdValidation,
  validateRequest,
  cmsPageSectionController.getCmsPageSectionById
);

router.put(
  "/:sectionId",
  authorize("cms.pages.update"),
  updateCmsPageSectionValidation,
  validateRequest,
  cmsPageSectionController.updateCmsPageSection
);

router.patch(
  "/:sectionId/enabled",
  authorize("cms.pages.update"),
  changeCmsPageSectionEnabledValidation,
  validateRequest,
  cmsPageSectionController.changeCmsPageSectionEnabled
);

router.post(
  "/:sectionId/duplicate",
  authorize("cms.pages.update"),
  cmsPageSectionIdValidation,
  validateRequest,
  cmsPageSectionController.duplicateCmsPageSection
);

router.delete(
  "/:sectionId",
  authorize("cms.pages.update"),
  cmsPageSectionIdValidation,
  validateRequest,
  cmsPageSectionController.deleteCmsPageSection
);

module.exports = router;