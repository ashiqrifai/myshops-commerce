const { validationResult } = require("express-validator");

const AppError = require("../utils/AppError");

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const details = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value,
  }));

  return next(
    new AppError(
      "Request validation failed.",
      400,
      "VALIDATION_FAILED",
      details
    )
  );
};

module.exports = validateRequest;