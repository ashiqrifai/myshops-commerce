const express = require("express");

const productController = require(
  "./product.controller"
);

const authenticate = require(
  "../../middleware/authenticate"
);

const authorize = require(
  "../../middleware/authorize"
);

const validateRequest = require(
  "../../middleware/validateRequest"
);

const {
  productIdValidation,
  listProductsValidation,
  createProductValidation,
  updateProductValidation,
  changeProductStatusValidation,
  generateVariantsValidation,
} = require("./product.validation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("products.read"),
  listProductsValidation,
  validateRequest,
  productController.listProducts
);

router.post(
  "/",
  authorize("products.create"),
  createProductValidation,
  validateRequest,
  productController.createProduct
);

router.get(
  "/:id",
  authorize("products.read"),
  productIdValidation,
  validateRequest,
  productController.getProductById
);

router.put(
  "/:id",
  authorize("products.update"),
  updateProductValidation,
  validateRequest,
  productController.updateProduct
);

router.patch(
  "/:id/status",
  authorize("products.update"),
  changeProductStatusValidation,
  validateRequest,
  productController.changeProductStatus
);

router.post(
  "/:id/generate-variants",
  authorize("products.update"),
  generateVariantsValidation,
  validateRequest,
  productController.generateVariants
);

router.delete(
  "/:id",
  authorize("products.delete"),
  productIdValidation,
  validateRequest,
  productController.deleteProduct
);

module.exports = router;
