const db =
  require(
    "../models"
  );

const {
  sendEmail,
} =
  require(
    "./email.service"
  );

const {
  loadOrderNotificationData,
  buildOrderNotificationEmail,
} =
  require(
    "./orderNotification.service"
  );

const queueOrderNotification =
  async ({
    companyId,
    orderId,
    notificationType,
    recipientEmail =
      null,
    metadata = {},
    transaction =
      null,
  }) => {
    const order =
      await db.Order.findOne({
        where: {
          id:
            orderId,

          companyId,
        },

        attributes: [
          "id",
          "customerEmail",
        ],

        transaction,
      });

    if (!order) {
      throw new Error(
        "Order was not found."
      );
    }

    const email =
      String(
        recipientEmail ||
        order.customerEmail ||
        ""
      )
        .trim()
        .toLowerCase();

    if (!email) {
      return {
        queued:
          false,

        reason:
          "NO_RECIPIENT_EMAIL",
      };
    }

    const [
      row,
      created,
    ] =
      await db.EmailNotificationQueue
        .findOrCreate({
          where: {
            companyId,
            orderId,
            notificationType,
            recipientEmail:
              email,
          },

          defaults: {
            companyId,
            orderId,
            notificationType,
            recipientEmail:
              email,
            status:
              "PENDING",
            availableAt:
              new Date(),
            metadata,
          },

          transaction,
        });

    return {
      queued:
        true,

      created,

      queueId:
        row.id,

      status:
        row.status,
    };
  };

const processEmailNotification =
  async (
    row
  ) => {
    const data =
      await loadOrderNotificationData({
        companyId:
          row.companyId,

        orderId:
          row.orderId,
      });

    const content =
      buildOrderNotificationEmail({
        type:
          row.notificationType,

        data,
      });

    await row.update({
      subject:
        content.subject,

      status:
        "PROCESSING",

      processingStartedAt:
        new Date(),

      attempts:
        Number(
          row.attempts ||
          0
        ) +
        1,

      lastError:
        null,
    });

    try {
      const result =
        await sendEmail({
          to:
            row.recipientEmail,

          subject:
            content.subject,

          html:
            content.html,

          text:
            content.text,
        });

      await row.update({
        status:
          "SENT",

        sentAt:
          new Date(),

        messageId:
          result
            ?.messageId ||
          null,

        processingStartedAt:
          null,

        lastError:
          null,
      });

      return {
        sent:
          true,

        messageId:
          result
            ?.messageId ||
          null,
      };
    } catch (
      error
    ) {
      const attempts =
        Number(
          row.attempts ||
          0
        );

      const maxAttempts =
        Number(
          row.maxAttempts ||
          5
        );

      const terminal =
        attempts >=
        maxAttempts;

      const retryMinutes =
        Math.min(
          60,
          Math.max(
            2,
            attempts *
            attempts *
            2
          )
        );

      await row.update({
        status:
          terminal
            ? "FAILED"
            : "PENDING",

        failedAt:
          terminal
            ? new Date()
            : null,

        processingStartedAt:
          null,

        availableAt:
          terminal
            ? row.availableAt
            : new Date(
                Date.now() +
                retryMinutes *
                60 *
                1000
              ),

        lastError:
          String(
            error.message ||
            error
          ).slice(
            0,
            5000
          ),
      });

      throw error;
    }
  };

module.exports = {
  queueOrderNotification,
  processEmailNotification,
};
