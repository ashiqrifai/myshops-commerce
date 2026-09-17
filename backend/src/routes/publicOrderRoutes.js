const express =
  require(
    "express"
  );

const {
  placePublicOrder,
} = require(
  "../controllers/publicOrderController"
);

const optionalAuthenticateCustomer =
  require(
    "../middleware/optionalAuthenticateCustomer"
  );

const router =
  express.Router();

router.post(
  "/",
  optionalAuthenticateCustomer,
  placePublicOrder
);

module.exports =
  router;