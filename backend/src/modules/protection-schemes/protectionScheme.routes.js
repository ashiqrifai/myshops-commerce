const express =
  require(
    "express"
  );

const protectionSchemeController =
  require(
    "./protectionScheme.controller"
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
  protectionSchemeIdValidation,
  listProtectionSchemesValidation,
  createProtectionSchemeValidation,
  updateProtectionSchemeValidation,
  changeProtectionSchemeStatusValidation,
} = require(
  "./protectionScheme.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",
  authorize(
    "protection_schemes.read"
  ),
  listProtectionSchemesValidation,
  validateRequest,
  protectionSchemeController
    .listProtectionSchemes
);

router.post(
  "/",
  authorize(
    "protection_schemes.create"
  ),
  createProtectionSchemeValidation,
  validateRequest,
  protectionSchemeController
    .createProtectionScheme
);

router.get(
  "/:id",
  authorize(
    "protection_schemes.read"
  ),
  protectionSchemeIdValidation,
  validateRequest,
  protectionSchemeController
    .getProtectionSchemeById
);

router.put(
  "/:id",
  authorize(
    "protection_schemes.update"
  ),
  updateProtectionSchemeValidation,
  validateRequest,
  protectionSchemeController
    .updateProtectionScheme
);

router.patch(
  "/:id/status",
  authorize(
    "protection_schemes.update"
  ),
  changeProtectionSchemeStatusValidation,
  validateRequest,
  protectionSchemeController
    .changeProtectionSchemeStatus
);

router.delete(
  "/:id",
  authorize(
    "protection_schemes.delete"
  ),
  protectionSchemeIdValidation,
  validateRequest,
  protectionSchemeController
    .deleteProtectionScheme
);

module.exports =
  router;
