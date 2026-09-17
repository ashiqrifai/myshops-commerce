const express = require("express");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const productMergeController = require("./productMerge.controller");

const router = express.Router();

router.use(authenticate);

router.post(
  "/preview",
  authorize("products.update"),
  productMergeController.previewProductMerge
);

router.post(
  "/execute",
  authorize("products.update"),
  productMergeController.executeProductMerge
);

module.exports = router;
