const { body } = require("express-validator");

exports.loginValidation = [
  body("companyCode")
    .trim()
    .notEmpty()
    .withMessage("Company code is required.")
    .isLength({ max: 50 })
    .withMessage("Company code is too long."),

  body("login")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required.")
    .isLength({ max: 200 })
    .withMessage("Login value is too long."),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8, max: 128 })
    .withMessage(
      "Password must contain between 8 and 128 characters."
    ),
];

exports.refreshValidation = [
  body("refreshToken")
    .optional()
    .isString()
    .withMessage("Refresh token must be valid text."),
];