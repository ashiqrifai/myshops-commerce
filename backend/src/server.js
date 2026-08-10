const app = require("./app");
const env = require("./config/env");
const db = require("./models");

let server;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();

    console.log("PostgreSQL database connection established successfully.");

    /*
     * During early development, we will allow Sequelize to create tables.
     * Do not use force: true because it deletes existing tables.
     */
    await db.sequelize.sync({
      alter: false,
    });

    server = app.listen(env.port, () => {
      console.log(
        `MyShops Commerce API is running on http://localhost:${env.port}`
      );

      console.log(`Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error("Unable to start MyShops Commerce API:");
    console.error(error);

    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await db.sequelize.close();

    console.log("HTTP server and database connection closed.");

    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:");
    console.error(error);

    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:");
  console.error(error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:");
  console.error(error);

  process.exit(1);
});

startServer();