const express = require("express");
const controller = require("./supplier.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");

const {
  supplierIdValidation,
  listSuppliersValidation,
  createSupplierValidation,
  updateSupplierValidation,
  changeSupplierStatusValidation,
} = require("./supplier.validation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("suppliers.read"),
  listSuppliersValidation,
  validateRequest,
  controller.listSuppliers
);

router.post(
  "/",
  authorize("suppliers.create"),
  createSupplierValidation,
  validateRequest,
  controller.createSupplier
);

router.get(
  "/:id",
  authorize("suppliers.read"),
  supplierIdValidation,
  validateRequest,
  controller.getSupplierById
);

router.put(
  "/:id",
  authorize("suppliers.update"),
  updateSupplierValidation,
  validateRequest,
  controller.updateSupplier
);

router.patch(
  "/:id/status",
  authorize("suppliers.update"),
  changeSupplierStatusValidation,
  validateRequest,
  controller.changeSupplierStatus
);

router.delete(
  "/:id",
  authorize("suppliers.delete"),
  supplierIdValidation,
  validateRequest,
  controller.deleteSupplier
);

module.exports = router;
