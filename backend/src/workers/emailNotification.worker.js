require(
  "dotenv"
)
  .config();

const {
  Op,
} =
  require(
    "sequelize"
  );

const db =
  require(
    "../models"
  );

const {
  processEmailNotification,
} =
  require(
    "../services/emailNotificationQueue.service"
  );

const POLL_MS =
  Number(
    process.env
      .EMAIL_QUEUE_POLL_MS ||
    5000
  );

const BATCH_SIZE =
  Number(
    process.env
      .EMAIL_QUEUE_BATCH_SIZE ||
    10
  );

let stopping =
  false;

const sleep =
  (
    ms
  ) =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );

const processBatch =
  async () => {
    const rows =
      await db.EmailNotificationQueue
        .findAll({
          where: {
            status:
              "PENDING",

            availableAt: {
              [Op.lte]:
                new Date(),
            },
          },

          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],

          limit:
            BATCH_SIZE,
        });

    for (
      const row of
      rows
    ) {
      try {
        await processEmailNotification(
          row
        );

        console.log(
          "[Email Worker] Sent",
          row.notificationType,
          row.orderId,
          row.recipientEmail
        );
      } catch (
        error
      ) {
        console.error(
          "[Email Worker] Failed",
          row.notificationType,
          row.orderId,
          error.message
        );
      }
    }

    return rows.length;
  };

const recoverStuckRows =
  async () => {
    const cutoff =
      new Date(
        Date.now() -
        15 *
        60 *
        1000
      );

    await db.EmailNotificationQueue
      .update(
        {
          status:
            "PENDING",

          processingStartedAt:
            null,

          availableAt:
            new Date(),
        },
        {
          where: {
            status:
              "PROCESSING",

            processingStartedAt: {
              [Op.lt]:
                cutoff,
            },
          },
        }
      );
  };

const main =
  async () => {
    await db.sequelize
      .authenticate();

    await recoverStuckRows();

    console.log(
      "[Email Worker] Started"
    );

    while (
      !stopping
    ) {
      const count =
        await processBatch();

      if (
        count ===
        0
      ) {
        await sleep(
          POLL_MS
        );
      }
    }

    await db.sequelize
      .close();

    console.log(
      "[Email Worker] Stopped"
    );
  };

const stop =
  () => {
    stopping =
      true;
  };

process.on(
  "SIGINT",
  stop
);

process.on(
  "SIGTERM",
  stop
);

main()
  .catch(
    async (
      error
    ) => {
      console.error(
        "[Email Worker] Fatal",
        error
      );

      try {
        await db.sequelize
          .close();
      } catch {}

      process.exit(
        1
      );
    }
  );
