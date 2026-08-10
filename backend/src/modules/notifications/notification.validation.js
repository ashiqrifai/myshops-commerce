const {
    query,
    param,
  } = require(
    "express-validator"
  );
  
  const notificationIdValidation =
  param(
    "id"
  )
    .isUUID()
    .withMessage(
      "The selected notification is invalid."
    );
  
  module.exports = {
    listValidation: [
      query(
        "page"
      )
        .optional()
        .isInt({
          min:
            1,
        })
        .withMessage(
          "Page must be a positive integer."
        )
        .toInt(),
  
      query(
        "limit"
      )
        .optional()
        .isInt({
          min:
            1,
  
          max:
            100,
        })
        .withMessage(
          "Limit must be between 1 and 100."
        )
        .toInt(),
  
      query(
        "unreadOnly"
      )
        .optional()
        .isBoolean()
        .withMessage(
          "Unread only must be true or false."
        )
        .toBoolean(),
  
      query(
        "type"
      )
        .optional({
          nullable:
            true,
  
          checkFalsy:
            true,
        })
        .trim()
        .isLength({
          min:
            1,
  
          max:
            100,
        })
        .withMessage(
          "Notification type cannot exceed 100 characters."
        ),
    ],
  
    notificationIdValidation: [
      notificationIdValidation,
    ],
  };