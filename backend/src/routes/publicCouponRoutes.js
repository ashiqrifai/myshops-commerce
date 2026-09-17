const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/publicCouponController"
  );

const optionalAuthenticateCustomer =
  require(
    "../middleware/optionalAuthenticateCustomer"
  );

const router =
  express.Router();

router.post(
  "/validate",
  optionalAuthenticateCustomer,
  controller.validate
);

module.exports =
  router;