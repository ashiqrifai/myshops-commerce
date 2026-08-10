const express =
  require(
    "express"
  );

const controller =
  require(
    "./customerAddress.controller"
  );

const validation =
  require(
    "./customerAddress.validation"
  );

const authenticateCustomer =
  require(
    "../../middleware/authenticateCustomer"
  );

const validateRequest =
  require(
    "../../middleware/validateRequest"
  );

const router =
  express.Router();

router.use(
  authenticateCustomer
);

router.get(
  "/",

  validation.listValidation,

  validateRequest,

  controller.list
);

router.get(
  "/:id",

  validation.getValidation,

  validateRequest,

  controller.getById
);

router.post(
  "/",

  validation.createValidation,

  validateRequest,

  controller.create
);

router.put(
  "/:id",

  validation.updateValidation,

  validateRequest,

  controller.update
);

router.delete(
  "/:id",

  validation.deleteValidation,

  validateRequest,

  controller.remove
);

router.patch(
  "/:id/default-shipping",

  validation.defaultValidation,

  validateRequest,

  controller
    .setDefaultShipping
);

router.patch(
  "/:id/default-billing",

  validation.defaultValidation,

  validateRequest,

  controller
    .setDefaultBilling
);

module.exports =
  router;
