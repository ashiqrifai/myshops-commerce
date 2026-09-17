const crypto = require("crypto");

const AppError = require("../utils/AppError");

const networkInternationalService =
  require(
    "../services/networkInternationalService"
  );

const WEBHOOK_SECRET =
  String(
    process.env
      .NETWORK_INTL_WEBHOOK_SECRET ||
      ""
  ).trim();

const safeSecretMatches = (
  received,
  expected
) => {
  if (
    !received ||
    !expected
  ) {
    return false;
  }

  const receivedBuffer =
    Buffer.from(
      String(
        received
      )
    );

  const expectedBuffer =
    Buffer.from(
      String(
        expected
      )
    );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
};

/*
|--------------------------------------------------------------------------
| Create Hosted Checkout
|--------------------------------------------------------------------------
*/

exports.createHostedCheckout =
  async (
    req,
    res,
    next
  ) => {
    try {
      const orderId =
        String(
          req.body?.orderId ||
          ""
        ).trim();

      if (!orderId) {
        throw new AppError(
          "Order ID is required.",
          400,
          "ORDER_ID_REQUIRED"
        );
      }

      const result =
        await networkInternationalService
          .createHostedCheckout({
            orderId,

            customerId:
              req.customer?.id ||
              null,
          });

      res.status(200).json({
        success:
          true,

        data: {
          reused:
            result.reused ===
            true,

          orderId:
            result.order.id,

          orderNumber:
            result.order
              .orderNumber,

          paymentUrl:
            result.paymentUrl,

          gatewayOrderReference:
            result.gatewayOrderReference,

          gatewayOrderId:
            result.gatewayOrderId,

          paymentStatus:
            result.order
              .paymentStatus,

          orderStatus:
            result.order
              .orderStatus,
        },
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Legacy Hosted Session Completion
|--------------------------------------------------------------------------
*/

exports.completeHostedSession =
  async (
    req,
    res,
    next
  ) => {
    try {
      const orderId =
        String(
          req.body?.orderId ||
          ""
        ).trim();

      const sessionId =
        String(
          req.body?.sessionId ||
          ""
        ).trim();

      if (!orderId) {
        throw new AppError(
          "Order ID is required.",
          400,
          "ORDER_ID_REQUIRED"
        );
      }

      if (!sessionId) {
        throw new AppError(
          "Hosted Session ID is required.",
          400,
          "NETWORK_INTL_SESSION_REQUIRED"
        );
      }

      const result =
        await networkInternationalService
          .completeHostedSessionPayment({
            orderId,
            sessionId,

            customerId:
              req.customer?.id ||
              null,
          });

      res.status(200).json({
        success:
          true,

        data: {
          alreadyPaid:
            result.alreadyPaid,

          gatewayState:
            result.gatewayState,

          paymentResponse:
            result.gatewayResponse,

          order: {
            id:
              result.order.id,

            orderNumber:
              result.order
                .orderNumber,

            orderStatus:
              result.order
                .orderStatus,

            paymentStatus:
              result.order
                .paymentStatus,

            paymentMethod:
              result.order
                .paymentMethod,

            grandTotal:
              Number(
                result.order
                  .grandTotal
              ),

            currencyCode:
              result.order
                .currencyCode,
          },
        },
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Reconcile
|--------------------------------------------------------------------------
*/

exports.reconcile =
  async (
    req,
    res,
    next
  ) => {
    try {
      const orderId =
        String(
          req.body?.orderId ||
          ""
        ).trim();

      if (!orderId) {
        throw new AppError(
          "Order ID is required.",
          400,
          "ORDER_ID_REQUIRED"
        );
      }

      const result =
        await networkInternationalService
          .reconcileOrderPayment({
            orderId,

            customerId:
              req.customer?.id ||
              null,
          });

      res.status(200).json({
        success:
          true,

        data: {
          gatewayState:
            result.gatewayState,

          order: {
            id:
              result.order.id,

            orderNumber:
              result.order
                .orderNumber,

            orderStatus:
              result.order
                .orderStatus,

            paymentStatus:
              result.order
                .paymentStatus,

            paymentMethod:
              result.order
                .paymentMethod,

            grandTotal:
              Number(
                result.order
                  .grandTotal
              ),

            currencyCode:
              result.order
                .currencyCode,
          },
        },
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Webhook
|--------------------------------------------------------------------------
*/

exports.webhook =
  async (
    req,
    res,
    next
  ) => {
    try {
      const suppliedSecret =
        String(
          req.get(
            "X-MyShops-Webhook-Token"
          ) ||
          ""
        ).trim();

      if (
        !safeSecretMatches(
          suppliedSecret,
          WEBHOOK_SECRET
        )
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            error: {
              code:
                "INVALID_WEBHOOK_SECRET",

              message:
                "Webhook authentication failed.",

              details:
                [],
            },
          });
      }

      const result =
        await networkInternationalService
          .processWebhook(
            req.body
          );

      return res
        .status(200)
        .json({
          success:
            true,

          data:
            result,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };
