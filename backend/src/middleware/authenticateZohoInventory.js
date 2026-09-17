const crypto = require("crypto");
const AppError = require("../utils/AppError");

const expectedKey = String(
  process.env.ZOHO_INVENTORY_INTEGRATION_KEY || ""
).trim();

const safeEqual = (received, expected) => {
  if (!received || !expected) return false;

  const a = Buffer.from(String(received));
  const b = Buffer.from(String(expected));

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
};

module.exports = (req, _res, next) => {
  try {
    if (!expectedKey) {
      throw new AppError(
        "Zoho inventory integration key is not configured.",
        500,
        "ZOHO_INVENTORY_KEY_NOT_CONFIGURED"
      );
    }

    const suppliedKey = String(
      req.get("X-MyShops-Integration-Key") || ""
    ).trim();

    if (!safeEqual(suppliedKey, expectedKey)) {
      throw new AppError(
        "Integration authentication failed.",
        401,
        "INVALID_INTEGRATION_KEY"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
