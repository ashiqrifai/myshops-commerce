const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../models"
  );

const upsertPaidAfterExpiryException =
  async ({
    order,
    payment,
    provider,
    providerState,
    message,
    transaction,
  }) => {
    const [
      exception,
      created,
    ] =
      await db.PaymentException.findOrCreate({
        where: {
          companyId:
            order.companyId,

          orderId:
            order.id,

          exceptionCode:
            "PAID_AFTER_RESERVATION_EXPIRY",
        },

        defaults: {
          orderPaymentId:
            payment?.id ||
            null,

          provider,

          providerState:
            providerState ||
            null,

          status:
            "OPEN",

          severity:
            "CRITICAL",

          title:
            "Paid order could not be reallocated",

          message:
            message ||
            "Payment succeeded after the stock reservation expired, but inventory could not be reallocated.",

          amount:
            order.grandTotal,

          currencyCode:
            order.currencyCode ||
            "AED",

          metadata: {
            reservationExpired:
              true,

            recoveryAttempted:
              true,

            recoverySucceeded:
              false,
          },
        },

        transaction,
      });

    if (
      !created
    ) {
      await exception.update(
        {
          orderPaymentId:
            payment?.id ||
            exception
              .orderPaymentId,

          provider,

          providerState:
            providerState ||
            null,

          status:
            exception.status ===
              "REFUNDED"
              ? "REFUNDED"
              : "OPEN",

          severity:
            "CRITICAL",

          title:
            "Paid order could not be reallocated",

          message:
            message ||
            exception.message,

          amount:
            order.grandTotal,

          currencyCode:
            order.currencyCode ||
            "AED",

          metadata: {
            ...(
              exception.metadata ||
              {}
            ),

            reservationExpired:
              true,

            recoveryAttempted:
              true,

            recoverySucceeded:
              false,

            lastFailureAt:
              new Date()
                .toISOString(),
          },
        },
        {
          transaction,
        }
      );
    }

    return exception;
  };

const resolvePaidAfterExpiryException =
  async ({
    order,
    transaction,
    note =
      "Inventory successfully reallocated.",
  }) => {
    await db.PaymentException.update(
      {
        status:
          "RESOLVED",

        resolvedAt:
          new Date(),

        resolutionNote:
          note,
      },
      {
        where: {
          companyId:
            order.companyId,

          orderId:
            order.id,

          exceptionCode:
            "PAID_AFTER_RESERVATION_EXPIRY",

          status: {
            [Op.notIn]: [
              "RESOLVED",
              "REFUNDED",
            ],
          },
        },

        transaction,
      }
    );
  };

module.exports = {
  upsertPaidAfterExpiryException,
  resolvePaidAfterExpiryException,
};
