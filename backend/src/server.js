const app = require("./app");
const env = require("./config/env");
const db = require("./models");

let server = null;
let isShuttingDown = false;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();

    console.log(
      "PostgreSQL database connection established successfully."
    );

    /*
     * During early development, allow Sequelize
     * to create missing tables without altering
     * or deleting existing schema.
     */
    await db.sequelize.sync({
      alter: false,
    });

    server = app.listen(
      env.port,
      () => {
        console.log(
          `MyShops Commerce API is running on http://localhost:${env.port}`
        );

        console.log(
          `Environment: ${env.nodeEnv}`
        );
      }
    );

    server.on(
      "error",
      (error) => {
        console.error(
          "HTTP server error:"
        );

        console.error(
          error
        );
      }
    );

    server.on(
      "close",
      () => {
        console.log(
          "HTTP server close event fired."
        );
      }
    );
  } catch (error) {
    console.error(
      "Unable to start MyShops Commerce API:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
};

const shutdown = async (
  signal
) => {
  if (
    isShuttingDown
  ) {
    console.log(
      `Shutdown already in progress. Ignoring ${signal}.`
    );

    return;
  }

  isShuttingDown = true;

  console.log(
    `${signal} received. Shutting down gracefully.`
  );

  try {
    if (
      server &&
      server.listening
    ) {
      await new Promise(
        (
          resolve,
          reject
        ) => {
          server.close(
            (
              error
            ) => {
              if (
                error
              ) {
                reject(
                  error
                );

                return;
              }

              resolve();
            }
          );
        }
      );
    } else {
      console.log(
        "HTTP server was already stopped."
      );
    }

    try {
      await db.sequelize.close();

      console.log(
        "Database connection closed."
      );
    } catch (
      databaseError
    ) {
      console.error(
        "Error while closing database connection:"
      );

      console.error(
        databaseError
      );
    }

    console.log(
      "Graceful shutdown completed."
    );

    process.exitCode = 0;
  } catch (error) {
    console.error(
      "Error during graceful shutdown:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
};

process.on(
  "SIGTERM",
  () => {
    console.log(
      "DEBUG: SIGTERM event received by Node."
    );

    shutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "SIGINT",
  () => {
    console.log(
      "DEBUG: SIGINT event received by Node."
    );

    shutdown(
      "SIGINT"
    );
  }
);

process.on(
  "beforeExit",
  (
    code
  ) => {
    console.log(
      `DEBUG: beforeExit fired with code ${code}`
    );
  }
);

process.on(
  "exit",
  (
    code
  ) => {
    console.log(
      `DEBUG: process exit fired with code ${code}`
    );
  }
);

process.on(
  "unhandledRejection",
  (
    reason
  ) => {
    console.error(
      "Unhandled promise rejection:"
    );

    console.error(
      reason
    );
  }
);

process.on(
  "uncaughtException",
  (
    error
  ) => {
    console.error(
      "Uncaught exception:"
    );

    console.error(
      error
    );

    process.exitCode =
      1;
  }
);

startServer();