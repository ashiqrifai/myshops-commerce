const express =
  require("express");

const publicCategoryController =
  require(
    "./publicCategory.controller"
  );

const router =
  express.Router();

router.get(
  "/tree",
  publicCategoryController
    .getPublicCategoryTree
);

router.get(
  "/slug/:slug",
  publicCategoryController
    .getPublicCategoryBySlug
);

module.exports = router;