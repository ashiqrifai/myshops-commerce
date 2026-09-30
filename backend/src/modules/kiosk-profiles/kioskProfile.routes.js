const express =
  require("express");

const controller =
  require(
    "./kioskProfile.controller"
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
    profileIdValidation,
    listProfilesValidation,
    createProfileValidation,
    updateProfileValidation,
    assignPageValidation,
    createDedicatedHomeValidation,
  } = require(
    "./kioskProfile.validation"
  );



const router =
  express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("cms.pages.read"),
  listProfilesValidation,
  validateRequest,
  controller.listProfiles
);

router.post(
  "/",
  authorize("cms.pages.create"),
  createProfileValidation,
  validateRequest,
  controller.createProfile
);

router.get(
  "/:id",
  authorize("cms.pages.read"),
  profileIdValidation,
  validateRequest,
  controller.getProfile
);

router.put(
  "/:id",
  authorize("cms.pages.update"),
  updateProfileValidation,
  validateRequest,
  controller.updateProfile
);

router.put(
  "/:id/page",
  authorize("cms.pages.update"),
  assignPageValidation,
  validateRequest,
  controller.assignPage
);

router.post(
    "/:id/dedicated-home",
    authorize("cms.pages.create"),
    createDedicatedHomeValidation,
    validateRequest,
    controller.createDedicatedHome
  );

module.exports =
  router;