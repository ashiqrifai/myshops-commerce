const express = require(
  "express"
);

const controller = require(
  "./customerAuth.controller"
);

const authenticateCustomer = require(
  "../../middleware/authenticateCustomer"
);

const validateRequest = require(
  "../../middleware/validateRequest"
);

const validation = require(
  "./customerAuth.validation"
);

const router = express.Router();

router.post(
  "/register",
  validation.registerValidation,
  validateRequest,
  controller.register
);

router.post(
  "/login",
  validation.loginValidation,
  validateRequest,
  controller.login
);

router.post(
  "/forgot-password",
  validation.forgotPasswordValidation,
  validateRequest,
  controller.forgotPassword
);

router.post(
  "/reset-password",
  validation.resetPasswordValidation,
  validateRequest,
  controller.resetPassword
);

router.post(
  "/refresh",
  validation.refreshValidation,
  validateRequest,
  controller.refresh
);

router.post(
  "/logout",
  controller.logout
);

router.post(
  "/logout-all",
  authenticateCustomer,
  controller.logoutAll
);

router.get(
  "/me",
  authenticateCustomer,
  controller.me
);

module.exports = router;
