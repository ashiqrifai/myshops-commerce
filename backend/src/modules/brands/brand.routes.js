const express = require(
  "express"
);

const brandController = require(
  "./brand.controller"
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
  brandIdValidation,
  listBrandsValidation,
  createBrandValidation,
  updateBrandValidation,
  changeBrandStatusValidation,
} = require(
  "./brand.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",
  authorize(
    "brands.read"
  ),
  listBrandsValidation,
  validateRequest,
  brandController.listBrands
);

router.post(
  "/",
  authorize(
    "brands.create"
  ),
  createBrandValidation,
  validateRequest,
  brandController.createBrand
);

router.get(
  "/:id",
  authorize(
    "brands.read"
  ),
  brandIdValidation,
  validateRequest,
  brandController.getBrandById
);

router.put(
  "/:id",
  authorize(
    "brands.update"
  ),
  updateBrandValidation,
  validateRequest,
  brandController.updateBrand
);

router.patch(
  "/:id/status",
  authorize(
    "brands.update"
  ),
  changeBrandStatusValidation,
  validateRequest,
  brandController.changeBrandStatus
);

router.delete(
  "/:id",
  authorize(
    "brands.delete"
  ),
  brandIdValidation,
  validateRequest,
  brandController.deleteBrand
);

module.exports = router;
