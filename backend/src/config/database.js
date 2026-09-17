const {
  Sequelize,
} = require(
  "sequelize"
);

const env =
  require(
    "./env"
  );

const sequelize =
  new Sequelize(
    env.database.name,
    env.database.username,
    env.database.password,
    {
      host:
        env.database.host,

      port:
        env.database.port,

      dialect:
        "postgres",

      logging:
        env.nodeEnv ===
        "development"
          ? (
              message
            ) =>
              console.log(
                `[Sequelize] ${message}`
              )
          : false,

      dialectOptions:
        env.database.ssl
          ? {
              ssl: {
                require:
                  true,

                rejectUnauthorized:
                  false,
              },
            }
          : {},

      define: {
        timestamps:
          true,

        freezeTableName:
          false,

        underscored:
          false,
      },

      /*
      |--------------------------------------------------------------------------
      | PostgreSQL Connection Pool
      |--------------------------------------------------------------------------
      |
      | PostgreSQL max_connections = 100.
      |
      | The storefront performs several parallel product/category queries.
      | A pool of 10 was being exhausted during concurrent storefront traffic,
      | causing SequelizeConnectionAcquireTimeoutError.
      |--------------------------------------------------------------------------
      */

      pool: {
        max:
          25,

        min:
          2,

        acquire:
          60000,

        idle:
          10000,
      },

      timezone:
        "+00:00",
    }
  );

module.exports =
  sequelize;