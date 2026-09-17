const express =
  require(
    "express"
  );

const authenticateCustomer =
  require(
    "../../middleware/authenticateCustomer"
  );

const controller =
  require(
    "./customerOrder.controller"
  );

const router =
  express.Router();

router.use(
  authenticateCustomer
);

router.get(
  "/",
  controller.list
);

router.get(
  "/:id",
  controller.getById
);

module.exports =
  router;