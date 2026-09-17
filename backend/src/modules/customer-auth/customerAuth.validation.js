const {
  body,
  header,
} = require("express-validator");

const company = [
  header("x-company-code")
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 50,
    }),

  body("companyCode")
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 50,
    }),
];

const requireCompany = (
  req,
  res,
  next
) => {
  if (
    !(
      req.headers[
        "x-company-code"
      ] ||
      req.body
        ?.companyCode
    )
  ) {
    return res
      .status(400)
      .json({
        success: false,
        error: {
          code:
            "COMPANY_CODE_REQUIRED",
          message:
            "Company code is required.",
          details: [],
        },
      });
  }

  next();
};

const passwordValidation = (
  fieldName =
    "password"
) =>
  body(fieldName)
    .isString()
    .withMessage(
      "Password must be valid text."
    )
    .isLength({
      min: 8,
      max: 128,
    })
    .withMessage(
      "Password must contain between 8 and 128 characters."
    )
    .matches(/[a-z]/)
    .withMessage(
      "Password must contain at least one lowercase letter."
    )
    .matches(/[A-Z]/)
    .withMessage(
      "Password must contain at least one uppercase letter."
    )
    .matches(/\d/)
    .withMessage(
      "Password must contain at least one number."
    );

exports.registerValidation = [
  ...company,

  body("firstName")
    .trim()
    .notEmpty()
    .isLength({
      max: 100,
    }),

  body("lastName")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 100,
    }),

  body("email")
    .trim()
    .isEmail()
    .normalizeEmail(),

  body("mobile")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .matches(
      /^\+?[0-9\s\-()]{7,20}$/
    )
    .withMessage(
      "Please enter a valid mobile number."
    ),

  body("mobile")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      min: 7,
      max: 50,
    }),

  passwordValidation(),

  body("preferredLanguage")
    .optional()
    .isIn([
      "en",
      "ar",
    ]),

  body("marketingConsent")
    .optional()
    .isBoolean()
    .toBoolean(),

  requireCompany,
];

exports.loginValidation = [
  ...company,

  body("email")
    .trim()
    .isEmail()
    .normalizeEmail(),

  body("password")
    .isString()
    .notEmpty(),

  requireCompany,
];

exports.forgotPasswordValidation = [
  ...company,

  body("email")
    .trim()
    .isEmail()
    .withMessage(
      "Please enter a valid email address."
    )
    .normalizeEmail(),

  requireCompany,
];

exports.resetPasswordValidation = [
  ...company,

  body("token")
    .isString()
    .trim()
    .isLength({
      min: 32,
      max: 256,
    })
    .withMessage(
      "The password reset token is invalid."
    ),

  passwordValidation(),

  body("confirmPassword")
    .isString()
    .custom(
      (
        value,
        {
          req,
        }
      ) => {
        if (
          value !==
          req.body.password
        ) {
          throw new Error(
            "Password confirmation does not match."
          );
        }

        return true;
      }
    ),

  requireCompany,
];

exports.refreshValidation = [
  body("refreshToken")
    .optional()
    .isString(),
];
