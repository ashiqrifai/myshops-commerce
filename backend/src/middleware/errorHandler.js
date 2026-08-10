const env = require("../config/env");

const handleSequelizeValidationError = (error) => {
  return {
    statusCode: 400,
    errorCode: "DATABASE_VALIDATION_FAILED",
    message: "Database validation failed.",
    details: error.errors.map((item) => ({
      field: item.path,
      message: item.message,
      value: item.value,
    })),
  };
};

const handleSequelizeUniqueConstraintError = (error) => {
  return {
    statusCode: 409,
    errorCode: "DUPLICATE_RECORD",
    message: "A record with the same unique value already exists.",
    details: error.errors.map((item) => ({
      field: item.path,
      message: item.message,
      value: item.value,
    })),
  };
};

const handleSequelizeForeignKeyConstraintError = () => {
  return {
    statusCode: 400,
    errorCode: "FOREIGN_KEY_CONSTRAINT_FAILED",
    message: "The referenced record does not exist or cannot be changed.",
    details: [],
  };
};

const errorHandler = (error, req, res, next) => {
  console.error(error);

  let statusCode = error.statusCode || 500;
  let errorCode = error.errorCode || "INTERNAL_SERVER_ERROR";
  let message = error.message || "An unexpected error occurred.";
  let details = error.details || [];

  if (error.name === "SequelizeValidationError") {
    const normalized = handleSequelizeValidationError(error);

    statusCode = normalized.statusCode;
    errorCode = normalized.errorCode;
    message = normalized.message;
    details = normalized.details;
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    const normalized = handleSequelizeUniqueConstraintError(error);

    statusCode = normalized.statusCode;
    errorCode = normalized.errorCode;
    message = normalized.message;
    details = normalized.details;
  }

  if (error.name === "SequelizeForeignKeyConstraintError") {
    const normalized = handleSequelizeForeignKeyConstraintError(error);

    statusCode = normalized.statusCode;
    errorCode = normalized.errorCode;
    message = normalized.message;
    details = normalized.details;
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message:
        statusCode === 500 && env.nodeEnv === "production"
          ? "An unexpected server error occurred."
          : message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  };

  if (env.nodeEnv !== "production") {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;