const {
  body,
  param,
} = require(
  "express-validator"
);

const {
  ADDRESS_TYPES,
  UAE_EMIRATES,
} = require(
  "./customerAddress.constants"
);

const messages =
  require(
    "./customerAddress.messages"
  );

const optionalText =
  (
    field,
    max
  ) =>
    body(
      field
    )
      .optional({
        nullable:
          true,

        checkFalsy:
          true,
      })
      .trim()
      .isLength({
        max,
      })
      .withMessage(
        `${field} cannot exceed ${max} characters.`
      );

const addressIdValidation =
  param(
    "id"
  )
    .isUUID()
    .withMessage(
      "The selected address is invalid."
    );

const addressBodyValidation = [
  body(
    "addressType"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isIn(
      ADDRESS_TYPES
    )
    .withMessage(
      "Please select a valid address type."
    ),

  body(
    "label"
  )
    .trim()
    .notEmpty()
    .withMessage(
      messages.REQUIRED_LABEL
    )
    .isLength({
      max:
        100,
    })
    .withMessage(
      "Address label cannot exceed 100 characters."
    ),

  body(
    "firstName"
  )
    .trim()
    .notEmpty()
    .withMessage(
      messages.REQUIRED_FIRST_NAME
    )
    .isLength({
      max:
        100,
    })
    .withMessage(
      "First name cannot exceed 100 characters."
    ),

  optionalText(
    "lastName",
    100
  ),

  optionalText(
    "companyName",
    200
  ),

  body(
    "mobile"
  )
    .trim()
    .matches(
      /^\+?[0-9\s\-()]{7,20}$/
    )
    .withMessage(
      messages.INVALID_MOBILE
    ),

  body(
    "email"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .trim()
    .isEmail()
    .withMessage(
      messages.INVALID_EMAIL
    )
    .normalizeEmail(),

  body(
    "countryCode"
  )
    .optional()
    .trim()
    .toUpperCase()
    .isLength({
      min:
        2,

      max:
        2,
    })
    .withMessage(
      "Country code must contain two letters."
    ),

  body(
    "country"
  )
    .optional()
    .trim()
    .isLength({
      min:
        2,

      max:
        100,
    })
    .withMessage(
      "Please enter a valid country."
    ),

  body(
    "emirate"
  )
    .trim()
    .toUpperCase()
    .isIn(
      UAE_EMIRATES
    )
    .withMessage(
      messages.INVALID_EMIRATE
    ),

  optionalText(
    "city",
    120
  ),

  body(
    "area"
  )
    .trim()
    .notEmpty()
    .withMessage(
      messages.REQUIRED_AREA
    )
    .isLength({
      max:
        160,
    })
    .withMessage(
      "Area cannot exceed 160 characters."
    ),

  body(
    "street"
  )
    .trim()
    .notEmpty()
    .withMessage(
      messages.REQUIRED_STREET
    )
    .isLength({
      max:
        250,
    })
    .withMessage(
      "Street cannot exceed 250 characters."
    ),

  body(
    "building"
  )
    .trim()
    .notEmpty()
    .withMessage(
      messages.REQUIRED_BUILDING
    )
    .isLength({
      max:
        200,
    })
    .withMessage(
      "Building cannot exceed 200 characters."
    ),

  optionalText(
    "floor",
    50
  ),

  optionalText(
    "apartment",
    100
  ),

  optionalText(
    "villaNumber",
    100
  ),

  optionalText(
    "landmark",
    250
  ),

  optionalText(
    "postalCode",
    50
  ),

  body(
    "latitude"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .isFloat({
      min:
        -90,

      max:
        90,
    })
    .withMessage(
      "Latitude must be between -90 and 90."
    )
    .toFloat(),

  body(
    "longitude"
  )
    .optional({
      nullable:
        true,

      checkFalsy:
        true,
    })
    .isFloat({
      min:
        -180,

      max:
        180,
    })
    .withMessage(
      "Longitude must be between -180 and 180."
    )
    .toFloat(),

  optionalText(
    "deliveryInstructions",
    2000
  ),

  body(
    "isDefaultShipping"
  )
    .optional()
    .isBoolean()
    .withMessage(
      "Default shipping must be true or false."
    )
    .toBoolean(),

  body(
    "isDefaultBilling"
  )
    .optional()
    .isBoolean()
    .withMessage(
      "Default billing must be true or false."
    )
    .toBoolean(),
];

module.exports = {
  listValidation:
    [],

  getValidation: [
    addressIdValidation,
  ],

  createValidation:
    addressBodyValidation,

  updateValidation: [
    addressIdValidation,
    ...addressBodyValidation,
  ],

  deleteValidation: [
    addressIdValidation,
  ],

  defaultValidation: [
    addressIdValidation,
  ],
};
