const { Sequelize } = require("sequelize");

const env = require("./env");

const sequelize = new Sequelize(
  env.database.name,
  env.database.username,
  env.database.password,
  {
    host: env.database.host,
    port: env.database.port,
    dialect: "postgres",

    logging:
      env.nodeEnv === "development"
        ? (message) => console.log(`[Sequelize] ${message}`)
        : false,

    dialectOptions: env.database.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},

    define: {
      timestamps: true,
      freezeTableName: false,
      underscored: false,
    },

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    timezone: "+00:00",
  }
);

module.exports = sequelize;