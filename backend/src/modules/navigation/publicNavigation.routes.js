const express =
  require(
    "express"
  );

const publicNavigationController =
  require(
    "./publicNavigation.controller"
  );

const router =
  express.Router();

router.get(
  "/:code",
  publicNavigationController
    .getPublicNavigation
);

module.exports =
  router;