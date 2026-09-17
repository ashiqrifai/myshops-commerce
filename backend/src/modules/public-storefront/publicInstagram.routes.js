const express =
  require(
    "express"
  );

const controller =
  require(
    "./publicInstagram.controller"
  );

const router =
  express.Router();

router.get(
  "/instagram",
  controller.getInstagram
);

module.exports =
  router;