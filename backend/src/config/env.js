const dotenv = require("dotenv");

dotenv.config();

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CUSTOMER_JWT_ACCESS_SECRET",
  "CUSTOMER_JWT_REFRESH_SECRET",
];

const missingVariables = requiredVariables.filter(
  (variableName) => !process.env[variableName]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}`
  );
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5080),

  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "8h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  customerJwt: {
    accessSecret: process.env.CUSTOMER_JWT_ACCESS_SECRET,
    refreshSecret: process.env.CUSTOMER_JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.CUSTOMER_JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.CUSTOMER_JWT_REFRESH_EXPIRES_IN || "30d",
  },
  

  urls: {
    adminWebUrl: process.env.ADMIN_WEB_URL || "http://localhost:3001",
    publicWebUrl: process.env.PUBLIC_WEB_URL || "http://localhost:3000",
  },
};

module.exports = env;