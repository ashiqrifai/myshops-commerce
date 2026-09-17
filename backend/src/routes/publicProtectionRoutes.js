const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/publicProtectionController"
  );

const optionalAuthenticateCustomer =
  require(
    "../middleware/optionalAuthenticateCustomer"
  );

const router =
  express.Router();

router.get(
  "/plans",
  optionalAuthenticateCustomer,
  controller.getProtectionPlans
);

module.exports =
  router;