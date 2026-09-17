const express =
  require(
    "express"
  );

const controller =
  require(
    "./publicActivity.controller"
  );

const router =
  express.Router();

router.post(
  "/activity",
  controller.trackActivity
);

module.exports =
  router;