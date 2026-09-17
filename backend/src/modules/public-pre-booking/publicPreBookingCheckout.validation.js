const {
  body,
  param,
  validationResult,
} = require(
  "express-validator"
);

const validate =
  (
    req,
    res,
    next
  ) => {
    const errors =
      validationResult(req);

    if (
      errors.isEmpty()
    ) {
      return next();
    }

    return res
      .status(400)
      .json({
        success: false,
        error: {
          code:
            "VALIDATION_ERROR",
          message:
            "Request validation failed.",
          details:
            errors.array(),
        },
      });
  };

exports.createCheckoutSessionValidation =
  [
    body(
      "campaignProductId"
    )
      .isUUID()
      .withMessage(
        "campaignProductId must be a valid UUID."
      ),

    body(
      "productVariantId"
    )
      .isUUID()
      .withMessage(
        "productVariantId must be a valid UUID."
      ),

    body(
      "allocationId"
    )
      .isUUID()
      .withMessage(
        "allocationId must be a valid UUID."
      ),

    body(
      "bundleId"
    )
      .optional({
        nullable: true,
      })
      .isUUID()
      .withMessage(
        "bundleId must be a valid UUID."
      ),

    body(
      "quantity"
    )
      .isInt({
        min: 1,
      })
      .withMessage(
        "quantity must be a positive whole number."
      )
      .toInt(),

    body(
      "channel"
    )
      .optional()
      .trim()
      .toUpperCase()
      .isIn([
        "WEBSITE",
        "KIOSK",
      ])
      .withMessage(
        "channel must be WEBSITE or KIOSK."
      ),

    validate,
  ];

exports.getCheckoutSessionValidation =
  [
    param(
      "publicToken"
    )
      .isUUID()
      .withMessage(
        "publicToken must be a valid UUID."
      ),

    validate,
  ];
