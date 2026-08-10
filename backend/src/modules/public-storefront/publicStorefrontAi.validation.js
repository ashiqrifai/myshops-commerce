const {
  body,
  header,
  query,
} = require(
  "express-validator"
);

exports.chatValidation = [
  header(
    "x-company-code"
  )
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 50,
    })
    .withMessage(
      "x-company-code cannot exceed 50 characters."
    ),

  query(
    "companyCode"
  )
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 50,
    })
    .withMessage(
      "companyCode cannot exceed 50 characters."
    ),

  body("message")
    .isString()
    .trim()
    .isLength({
      min: 1,
      max: 1000,
    })
    .withMessage(
      "message is required and cannot exceed 1000 characters."
    ),

  body("conversation")
    .optional()
    .isArray({
      max: 12,
    })
    .withMessage(
      "conversation must be an array with no more than 12 messages."
    ),

  body(
    "conversation.*.role"
  )
    .optional()
    .isIn([
      "user",
      "assistant",
    ])
    .withMessage(
      "Conversation role must be user or assistant."
    ),

  body(
    "conversation.*.text"
  )
    .optional()
    .isString()
    .trim()
    .isLength({
      min: 1,
      max: 1500,
    })
    .withMessage(
      "Conversation text cannot exceed 1500 characters."
    ),

  body("pageContext")
    .optional()
    .isObject()
    .withMessage(
      "pageContext must be an object."
    ),

  body("cartContext")
    .optional()
    .isObject()
    .withMessage(
      "cartContext must be an object."
    ),

  (
    req,
    res,
    next
  ) => {
    const companyCode =
      req.headers[
        "x-company-code"
      ] ||
      req.query.companyCode;

    if (!companyCode) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Company code is required.",
          code:
            "COMPANY_CODE_REQUIRED",
        });
    }

    return next();
  },
];
