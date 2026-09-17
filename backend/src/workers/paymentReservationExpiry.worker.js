const db =
  require(
    "../models"
  );

const {
  expireAbandonedPaymentReservations,
} = require(
  "../services/paymentReservationExpiry.service"
);

const {
  expireAbandonedPreBookingReservations,
} = require(
  "../services/preBookingReservationExpiry.service"
);

const INTERVAL_MINUTES =
  Math.max(
    1,
    Number(
      process.env
        .PAYMENT_RESERVATION_EXPIRY_INTERVAL_MINUTES ||
        5
    )
  );

const INTERVAL_MS =
  INTERVAL_MINUTES *
  60 *
  1000;

let running =
  false;

const run =
  async () => {
    if (
      running
    ) {
      console.log(
        "[Reservation Expiry Worker] Previous scan is still running."
      );

      return;
    }

    running =
      true;

    try {
      /*
      |--------------------------------------------------------------------------
      | Standard Ecommerce Payment Reservations
      |--------------------------------------------------------------------------
      */

      const paymentResult =
        await expireAbandonedPaymentReservations();

      console.log(
        "[Reservation Expiry Worker] Standard checkout completed",
        {
          scanned:
            paymentResult.scanned,

          released:
            paymentResult.released,

          kept:
            paymentResult.kept,

          errors:
            paymentResult.errors,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Pre-Booking Reservations
      |--------------------------------------------------------------------------
      */

      const preBookingResult =
        await expireAbandonedPreBookingReservations();

      console.log(
        "[Reservation Expiry Worker] Pre-booking completed",
        {
          scanned:
            preBookingResult.scanned,

          released:
            preBookingResult.released,

          confirmed:
            preBookingResult.confirmed,

          kept:
            preBookingResult.kept,

          errors:
            preBookingResult.errors,
        }
      );
    } catch (
      error
    ) {
      console.error(
        "[Reservation Expiry Worker] Failed:",
        error
      );
    } finally {
      running =
        false;
    }
  };

const start =
  async () => {
    await db.sequelize.authenticate();

    console.log(
      `[Reservation Expiry Worker] Started. Interval: ${INTERVAL_MINUTES} minute(s).`
    );

    /*
     * Run immediately on worker startup.
     */
    await run();

    setInterval(
      () => {
        void run();
      },
      INTERVAL_MS
    );
  };

const shutdown =
  async (
    signal
  ) => {
    console.log(
      `[Reservation Expiry Worker] ${signal} received.`
    );

    try {
      await db.sequelize.close();
    } finally {
      process.exit(
        0
      );
    }
  };

process.on(
  "SIGTERM",
  () =>
    void shutdown(
      "SIGTERM"
    )
);

process.on(
  "SIGINT",
  () =>
    void shutdown(
      "SIGINT"
    )
);

start().catch(
  error => {
    console.error(
      "[Reservation Expiry Worker] Unable to start:",
      error
    );

    process.exit(
      1
    );
  }
);