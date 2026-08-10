const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const env = require("../../config/env");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      companyId: user.companyId,
      type: "ACCESS",
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn,
    }
  );
};

const createRefreshToken = (user) => {
  const tokenId = uuidv4();

  const token = jwt.sign(
    {
      sub: user.id,
      companyId: user.companyId,
      jti: tokenId,
      type: "REFRESH",
    },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshExpiresIn,
    }
  );

  return {
    token,
    tokenId,
  };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

const decodeTokenExpiration = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded?.exp) {
    throw new Error("Token expiration is missing.");
  }

  return new Date(decoded.exp * 1000);
};

module.exports = {
  hashToken,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenExpiration,
};