const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const env = require("../../config/env");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createCustomerAccessToken = (customer) => jwt.sign({ sub: customer.id, companyId: customer.companyId, type: "CUSTOMER_ACCESS" }, env.customerJwt.accessSecret, { expiresIn: env.customerJwt.accessExpiresIn });
const createCustomerRefreshToken = (customer) => {
  const tokenId = uuidv4();
  return {
    tokenId,
    token: jwt.sign({ sub: customer.id, companyId: customer.companyId, jti: tokenId, type: "CUSTOMER_REFRESH" }, env.customerJwt.refreshSecret, { expiresIn: env.customerJwt.refreshExpiresIn }),
  };
};
const verifyCustomerAccessToken = (token) => jwt.verify(token, env.customerJwt.accessSecret);
const verifyCustomerRefreshToken = (token) => jwt.verify(token, env.customerJwt.refreshSecret);
const decodeTokenExpiration = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) throw new Error("Token expiration is missing.");
  return new Date(decoded.exp * 1000);
};

module.exports = { hashToken, createCustomerAccessToken, createCustomerRefreshToken, verifyCustomerAccessToken, verifyCustomerRefreshToken, decodeTokenExpiration };
