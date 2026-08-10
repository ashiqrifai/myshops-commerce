const express = require("express");

const authController = require("./auth.controller");
const authenticate = require("../../middleware/authenticate");
const validateRequest = require("../../middleware/validateRequest");

const {
  loginValidation,
  refreshValidation,
} = require("./auth.validation");

const router = express.Router();

router.post(
  "/login",
  loginValidation,
  validateRequest,
  authController.login
);

router.post(
  "/refresh",
  refreshValidation,
  validateRequest,
  authController.refresh
);

router.post(
  "/logout",
  authController.logout
);

router.post(
  "/logout-all",
  authenticate,
  authController.logoutAll
);

router.get(
  "/me",
  authenticate,
  authController.me
);

module.exports = router;