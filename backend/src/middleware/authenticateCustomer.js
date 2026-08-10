const db = require("../models");
const AppError = require("../utils/AppError");
const { verifyCustomerAccessToken } = require("../modules/customer-auth/customerAuth.utils");

module.exports = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) throw new AppError("Customer authentication token is required.", 401, "CUSTOMER_AUTHENTICATION_REQUIRED");

    let payload;
    try {
      payload = verifyCustomerAccessToken(authorization.substring(7).trim());
    } catch {
      throw new AppError("Customer authentication token is invalid or expired.", 401, "INVALID_CUSTOMER_ACCESS_TOKEN");
    }

    if (payload.type !== "CUSTOMER_ACCESS" || !payload.sub || !payload.companyId) {
      throw new AppError("Customer authentication token is invalid.", 401, "INVALID_CUSTOMER_ACCESS_TOKEN");
    }

    const customer = await db.Customer.findOne({
      where: { id: payload.sub, companyId: payload.companyId, status: "ACTIVE", isActive: true },
      attributes: ["id", "companyId", "firstName", "lastName", "email", "mobile", "status", "emailVerifiedAt", "mobileVerifiedAt", "preferredLanguage", "preferredCurrency", "marketingConsent"],
    });

    if (!customer) throw new AppError("Customer account is not available.", 401, "CUSTOMER_NOT_AVAILABLE");

    req.customer = customer.get({ plain: true });
    req.context = { ...(req.context || {}), customerId: customer.id, companyId: customer.companyId, channel: "STOREFRONT" };
    next();
  } catch (error) {
    next(error);
  }
};
