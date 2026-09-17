const {
  body,
  query,
} = require(
  "express-validator"
);

const channelValidation =
  query(
    "channelCode"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        1,

      max:
        50,
    })
    .withMessage(
      "Channel code cannot exceed 50 characters."
    );

exports.getProtectionSettingValidation = [
  channelValidation,
];

exports.updateProtectionSettingValidation = [
  channelValidation,

  body(
    "minimumEligibleProductAmount"
  )
    .exists({
      checkNull:
        true,
    })
    .withMessage(
      "Minimum eligible product amount is required."
    )
    .isFloat({
      min:
        0,
    })
    .withMessage(
      "Minimum eligible product amount must be zero or greater."
    )
    .toFloat(),

  body(
    "isEnabled"
  )
    .optional()
    .isBoolean()
    .withMessage(
      "isEnabled must be true or false."
    )
    .toBoolean(),

  body(
    "currencyCode"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        3,

      max:
        3,
    })
    .withMessage(
      "Currency code must contain exactly 3 characters."
    ),

  body(
    "channelCode"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        1,

      max:
        50,
    })
    .withMessage(
      "Channel code cannot exceed 50 characters."
    ),
];
