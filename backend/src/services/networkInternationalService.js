const axios = require("axios");

const db = require("../models");
const AppError = require("../utils/AppError");

const reservationLifecycleService =
  require(
    "./orderShipmentReservationLifecycle.service"
  );

const latePaymentRecoveryService =
  require(
    "./latePaymentRecovery.service"
  );

  const zohoSalesOrderService =
  require(
    "./zohoSalesOrder.service"
  );

const {
  queueOrderNotification,
} =
  require(
    "./emailNotificationQueue.service"
  );

/*
 * ============================================================
 * NETWORK INTERNATIONAL CONFIG
 * ============================================================
 */

const ENVIRONMENT = String(
  process.env.NETWORK_INTL_ENV || "sandbox"
)
  .trim()
  .toLowerCase();

const OUTLET_REF = String(
  process.env.NETWORK_INTL_OUTLET_REF || ""
).trim();

const API_KEY = String(
  process.env.NETWORK_INTL_API_KEY || ""
).trim();

const HOSTED_RETURN_URL = String(
  process.env.NETWORK_INTL_RETURN_URL || ""
).trim();

const HOSTED_CANCEL_URL = String(
  process.env.NETWORK_INTL_CANCEL_URL || ""
).trim();

const BASE_URL =
  ENVIRONMENT === "production"
    ? "https://api-gateway.ngenius-payments.com"
    : "https://api-gateway.sandbox.ngenius-payments.com";

const IDENTITY_URL =
  `${BASE_URL}/identity/auth/access-token`;

const PAYMENT_CONTENT_TYPE =
  "application/vnd.ni-payment.v2+json";

const DELIVERY_AMOUNTS = {
  STANDARD: 0,
  EXPRESS: 0,
  PICKUP: 0,
};

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

const moneyToMinorUnits = (value) =>
  Math.round(
    Number(
      value || 0
    ) * 100
  );

const ensureConfiguration =
  () => {
    if (!OUTLET_REF) {
      throw new AppError(
        "Network International outlet reference is not configured.",
        500,
        "NETWORK_INTL_OUTLET_NOT_CONFIGURED"
      );
    }

    if (!API_KEY) {
      throw new AppError(
        "Network International Merchant Service Account API key is not configured.",
        500,
        "NETWORK_INTL_API_KEY_NOT_CONFIGURED"
      );
    }

  };

const ensureHostedCheckoutConfiguration =
  () => {
    ensureConfiguration();

    if (!HOSTED_RETURN_URL) {
      throw new AppError(
        "Network International hosted payment return URL is not configured.",
        500,
        "NETWORK_INTL_RETURN_URL_NOT_CONFIGURED"
      );
    }

    if (!HOSTED_CANCEL_URL) {
      throw new AppError(
        "Network International hosted payment cancel URL is not configured.",
        500,
        "NETWORK_INTL_CANCEL_URL_NOT_CONFIGURED"
      );
    }
  };

const getGatewayError =
  (error) => ({
    status:
      error?.response?.status ||
      null,

    data:
      error?.response?.data ||
      null,

    message:
      error?.response?.data
        ?.message ||
      error?.message ||
      "Network International request failed.",
  });

const addQueryParameter =
  (
    rawUrl,
    key,
    value
  ) => {
    const url =
      new URL(
        rawUrl
      );

    url.searchParams.set(
      key,
      String(
        value
      )
    );

    return url.toString();
  };


/*
 * ============================================================
 * ORDER REFERENCE EXTRACTION
 * ============================================================
 */

const extractOrderReference =
  (payload) => {
    if (!payload) {
      return null;
    }

    /*
     * --------------------------------------------------------
     * 1. Explicit order fields
     * --------------------------------------------------------
     */

    const explicitOrderReference =
      payload?.orderReference ||
      payload?.order?.orderReference ||
      payload?.order?.reference;

    if (
      explicitOrderReference
    ) {
      return String(
        explicitOrderReference
      );
    }

    /*
     * --------------------------------------------------------
     * 2. Order URNs
     * --------------------------------------------------------
     */

    const possibleUrns = [
      payload?._id,
      payload?.order?._id,
    ];

    for (
      const urn
      of possibleUrns
    ) {
      if (
        typeof urn ===
          "string" &&
        urn.startsWith(
          "urn:order:"
        )
      ) {
        return urn.substring(
          "urn:order:".length
        );
      }
    }

    /*
     * --------------------------------------------------------
     * 3. Order links
     *
     * Example:
     * /transactions/outlets/{outlet}/orders/{orderReference}
     * --------------------------------------------------------
     */

    const possibleLinks = [
      payload?._links?.self?.href,
      payload?._links?.order?.href,
      payload?.order?._links
        ?.self?.href,
    ];

    for (
      const href
      of possibleLinks
    ) {
      if (
        typeof href !==
        "string"
      ) {
        continue;
      }

      const match =
        href.match(
          /\/orders\/([^/?#]+)/
        );

      if (
        match?.[1]
      ) {
        return decodeURIComponent(
          match[1]
        );
      }
    }

    /*
     * --------------------------------------------------------
     * 4. Embedded order
     * --------------------------------------------------------
     */

    if (
      payload?._embedded?.order
    ) {
      const embeddedOrder =
        Array.isArray(
          payload._embedded
            .order
        )
          ? payload._embedded
              .order[0]
          : payload._embedded
              .order;

      const embeddedRef =
        extractOrderReference(
          embeddedOrder
        );

      if (
        embeddedRef
      ) {
        return embeddedRef;
      }
    }

    /*
     * --------------------------------------------------------
     * 5. Last fallback
     *
     * IMPORTANT:
     * Do not prefer payload.reference before order-specific
     * fields because Hosted Session responses may contain
     * a payment or transaction reference which is not the
     * retrievable N-Genius order reference.
     * --------------------------------------------------------
     */

    if (
      payload?.reference
    ) {
      return String(
        payload.reference
      );
    }

    return null;
  };

/*
 * ============================================================
 * PAYMENT EXTRACTION
 * ============================================================
 */

const extractPayment =
  (payload) => {
    if (
      payload?._embedded &&
      Array.isArray(
        payload
          ._embedded
          .payment
      ) &&
      payload
        ._embedded
        .payment
        .length
    ) {
      return payload
        ._embedded
        .payment[0];
    }

    if (
      payload?.order
        ?._embedded &&
      Array.isArray(
        payload
          .order
          ._embedded
          .payment
      ) &&
      payload
        .order
        ._embedded
        .payment
        .length
    ) {
      return payload
        .order
        ._embedded
        .payment[0];
    }

    return null;
  };

/*
 * ============================================================
 * GATEWAY STATE
 * ============================================================
 */

const extractGatewayState =
  (payload) => {
    const payment =
      extractPayment(
        payload
      );

    return String(
      payment?.state ||
      payload?.state ||
      payload?.eventName ||
      ""
    )
      .trim()
      .toUpperCase();
  };

const mapGatewayState =
  (state) => {
    const normalizedState =
      String(
        state ||
        ""
      )
        .trim()
        .toUpperCase();

    switch (
      normalizedState
    ) {
      case "PURCHASED":
      case "CAPTURED":
        return {
          paymentStatus:
            "PAID",

          orderStatus:
            "CONFIRMED",

          paid:
            true,

          releaseReservation:
            false,
        };

      case "AUTHORISED":
      case "AUTHORIZED":
        return {
          paymentStatus:
            "AUTHORIZED",

          orderStatus:
            "CONFIRMED",

          paid:
            false,

          releaseReservation:
            false,
        };

      /*
       * Failed card attempts may still be retried,
       * so keep the reservation temporarily.
       */
      case "FAILED":
      case "FAILURE":
      case "DECLINED":
      case "REJECTED":
      case "THREE_DS_FAILURE":
        return {
          paymentStatus:
            "FAILED",

          orderStatus:
            "PENDING",

          paid:
            false,

          releaseReservation:
            false,
        };

      /*
       * Terminal checkout states.
       */
      case "CANCELLED":
      case "CANCELED":
      case "EXPIRED":
      case "ABANDONED":
        return {
          paymentStatus:
            "FAILED",

          orderStatus:
            "CANCELLED",

          paid:
            false,

          releaseReservation:
            true,
        };

      default:
        return {
          paymentStatus:
            "PENDING",

          orderStatus:
            "PENDING",

          paid:
            false,

          releaseReservation:
            false,
        };
    }
  };

/*
 * ============================================================
 * ACCESS TOKEN
 * ============================================================
 */

const requestAccessToken =
  async () => {
    ensureConfiguration();

    try {
      console.log(
        "Requesting Network International access token...",
        {
          environment:
            ENVIRONMENT,

          identityUrl:
            IDENTITY_URL,

          hasApiKey:
            Boolean(
              API_KEY
            ),
        }
      );

      const response =
        await axios.post(
          IDENTITY_URL,
          null,
          {
            timeout:
              20000,

            headers: {
              Authorization:
                `Basic ${API_KEY}`,

              "Content-Type":
                "application/vnd.ni-identity.v1+json",

              Accept:
                "application/vnd.ni-identity.v1+json",
            },
          }
        );

      const accessToken =
        response
          ?.data
          ?.access_token;

      if (
        !accessToken
      ) {
        console.error(
          "Network International authentication response:",
          response.data
        );

        throw new AppError(
          "Network International did not return an access token.",
          502,
          "NETWORK_INTL_ACCESS_TOKEN_MISSING"
        );
      }

      console.log(
        "Network International authentication successful.",
        {
          hasAccessToken:
            true,

          expiresIn:
            response
              ?.data
              ?.expires_in ||
            null,
        }
      );

      return accessToken;
    } catch (
      error
    ) {
      if (
        error instanceof
        AppError
      ) {
        throw error;
      }

      const details =
        getGatewayError(
          error
        );

      console.error(
        "========== NETWORK INTERNATIONAL AUTH ERROR =========="
      );

      console.error(
        JSON.stringify(
          {
            url:
              IDENTITY_URL,

            environment:
              ENVIRONMENT,

            status:
              error
                ?.response
                ?.status ||
              null,

            statusText:
              error
                ?.response
                ?.statusText ||
              null,

            response:
              error
                ?.response
                ?.data ||
              null,

            message:
              error
                ?.message ||
              null,
          },
          null,
          2
        )
      );

      console.error(
        "======================================================"
      );

      throw new AppError(
        "Unable to authenticate with Network International.",
        502,
        "NETWORK_INTL_AUTHENTICATION_FAILED",
        details.data
          ? [
              details.data,
            ]
          : []
      );
    }
  };

/*
 * ============================================================
 * COUPON REDEMPTION
 * ============================================================
 */

const recordCardCouponRedemption =
  async ({
    order,
    transaction,
  }) => {
    if (
      !order.couponCode
    ) {
      return;
    }

    const existing =
      await db
        .CouponRedemption
        .findOne({
          where: {
            companyId:
              order.companyId,

            orderId:
              order.id,
          },

          transaction,
        });

    if (
      existing
    ) {
      return;
    }

    const coupon =
      await db.Coupon
        .findOne({
          where: {
            companyId:
              order.companyId,

            code:
              order.couponCode,
          },

          transaction,
        });

    if (
      !coupon
    ) {
      return;
    }

    let benefitAmount =
      Number(
        order.discountAmount ||
        0
      );

    if (
      coupon.discountType ===
      "FREE_SHIPPING"
    ) {
      const originalDelivery =
        DELIVERY_AMOUNTS[
          order.deliveryMethod
        ] || 0;

      benefitAmount =
        Math.max(
          0,
          originalDelivery -
            Number(
              order.deliveryAmount ||
              0
            )
        );
    }

    await db
      .CouponRedemption
      .create(
        {
          companyId:
            order.companyId,

          couponId:
            coupon.id,

          orderId:
            order.id,

          customerId:
            order.customerId ||
            null,

          customerEmail:
            order.customerEmail,

          couponCode:
            coupon.code,

          discountType:
            coupon.discountType,

          discountValue:
            Number(
              coupon.discountValue ||
              0
            ),

          discountAmount:
            benefitAmount,

          redeemedAt:
            new Date(),
        },
        {
          transaction,
        }
      );
  };

/*
 * ============================================================
 * APPLY GATEWAY RESULT
 * ============================================================
 */

const applyGatewayResult =
  async ({
    order,
    payment,
    gatewayPayload,
    explicitState,
    providerReference,
  }) => {
    const gatewayState =
      String(
        explicitState ||
        extractGatewayState(
          gatewayPayload
        ) ||
        ""
      )
        .trim()
        .toUpperCase();

    const mapped =
      mapGatewayState(
        gatewayState
      );

    const oldPaymentStatus =
      order.paymentStatus;

    const oldOrderStatus =
      order.orderStatus;

    const transaction =
      await db
        .sequelize
        .transaction();

    let latePaymentRecovery =
      null;

    try {
      await payment.update(
        {
          status:
            mapped.paymentStatus,

          provider:
            "NETWORK_INTERNATIONAL",

          providerReference:
            providerReference ||
            payment.providerReference ||
            extractOrderReference(
              gatewayPayload
            ),

          providerPayload: {
            ...(
              payment.providerPayload &&
              typeof payment.providerPayload ===
                "object" &&
              !Array.isArray(
                payment.providerPayload
              )
                ? payment.providerPayload
                : {}
            ),

            ...(
              gatewayPayload &&
              typeof gatewayPayload ===
                "object" &&
              !Array.isArray(
                gatewayPayload
              )
                ? gatewayPayload
                : {
                    gatewayPayload,
                  }
            ),

            gatewayState:
              gatewayState ||
              null,
          },

          paidAt:
            mapped.paid
              ? payment.paidAt ||
                new Date()
              : payment.paidAt,
        },
        {
          transaction,
        }
      );

      await order.update(
        {
          paymentStatus:
            mapped.paymentStatus,

          orderStatus:
            mapped.orderStatus,
        },
        {
          transaction,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Late Successful Payment Recovery
      |--------------------------------------------------------------------------
      |
      | If the 30-minute worker already released this order's reservation,
      | a late PAID/AUTHORIZED gateway result must re-reserve CURRENT stock
      | before the order is allowed back into fulfillment.
      |--------------------------------------------------------------------------
      */

      if (
        mapped.paymentStatus ===
          "PAID" ||
        mapped.paymentStatus ===
          "AUTHORIZED"
      ) {
        latePaymentRecovery =
          await latePaymentRecoveryService
            .handleLateSuccessfulPayment({
              order,
              payment,

              provider:
                "NETWORK_INTERNATIONAL",

              providerState:
                gatewayState,

              transaction,
            });

        /*
         * Recovery may have changed the order back to CONFIRMED or kept it
         * CANCELLED with PAID_AFTER_RESERVATION_EXPIRY.
         */
        await order.reload({
          transaction,
        });

        await payment.reload({
          transaction,
        });
      }

      if (
        oldPaymentStatus !==
        order.paymentStatus
      ) {
        await db
          .OrderStatusHistory
          .create(
            {
              companyId:
                order.companyId,

              orderId:
                order.id,

              statusType:
                "PAYMENT",

              fromStatus:
                oldPaymentStatus,

              toStatus:
                order.paymentStatus,

              note:
                `Network International payment state: ${
                  gatewayState ||
                  "UNKNOWN"
                }.`,
            },
            {
              transaction,
            }
          );
      }

      if (
        oldOrderStatus !==
        order.orderStatus
      ) {
        await db
          .OrderStatusHistory
          .create(
            {
              companyId:
                order.companyId,

              orderId:
                order.id,

              statusType:
                "ORDER",

              fromStatus:
                oldOrderStatus,

              toStatus:
                order.orderStatus,

              note:
                `Order status updated after Network International payment state ${
                  gatewayState ||
                  "UNKNOWN"
                }.`,
            },
            {
              transaction,
            }
          );
      }

      if (
        mapped.paid &&
        order.orderStatus ===
          "CONFIRMED"
      ) {
        await recordCardCouponRedemption({
          order,
          transaction,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Release Inventory Reservation
      |--------------------------------------------------------------------------
      |
      | Only terminal cancellation / expiry states release stock here.
      | Retryable FAILED / DECLINED states keep their reservation temporarily.
      |--------------------------------------------------------------------------
      */

      if (
        mapped.releaseReservation
      ) {
        await reservationLifecycleService
          .releaseForPaymentFailure({
            order,

            reason:
              `NETWORK_INTERNATIONAL_${gatewayState || "CANCELLED"}`,

            transaction,
          });
      }

      await transaction.commit();
    } catch (
      error
    ) {
      if (
        !transaction.finished
      ) {
        await transaction.rollback();
      }

      throw error;
    }

    await order.reload();
    await payment.reload();

    /*
    |--------------------------------------------------------------------------
    | Order Confirmation Email
    |--------------------------------------------------------------------------
    */

    if (
      order.paymentStatus ===
        "PAID" &&
      order.orderStatus ===
        "CONFIRMED"
    ) {
      try {
        const emailQueueResult =
          await queueOrderNotification({
            companyId:
              order.companyId,

            orderId:
              order.id,

            notificationType:
              "ORDER_CONFIRMED",
          });

        console.log(
          "Order confirmation email queued after Network International payment:",
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            queued: emailQueueResult?.queued === true,
            created: emailQueueResult?.created === true,
            queueId: emailQueueResult?.queueId || null,
            status: emailQueueResult?.status || null,
          }
        );
      } catch (emailQueueError) {
        console.error(
          "Order confirmation email queue failed after Network International payment:",
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            error: emailQueueError?.message || String(emailQueueError),
          }
        );
      }
    }
    
    /*
    |--------------------------------------------------------------------------
    | Zoho Sales Order
    |--------------------------------------------------------------------------
    |
    | Payment has already been committed at this point.
    | Zoho failure must never roll back or invalidate the customer payment.
    |--------------------------------------------------------------------------
    */
    
    if (
      order.paymentStatus ===
        "PAID" &&
      order.orderStatus ===
        "CONFIRMED" &&
      !order.zohoSalesOrderId
    ) {
      try {
        const zohoResult =
          await zohoSalesOrderService
            .createZohoSalesOrder({
              orderId:
                order.id,
            });
    
        console.log(
          "Zoho Sales Order posted after Network International payment:",
          {
            orderId:
              order.id,
    
            orderNumber:
              order.orderNumber,
    
            zohoSalesOrderId:
              zohoResult
                ?.zohoSalesOrderId ||
              null,
    
            zohoSalesOrderNumber:
              zohoResult
                ?.zohoSalesOrderNumber ||
              null,
    
            alreadyPosted:
              Boolean(
                zohoResult
                  ?.alreadyPosted
              ),
          }
        );
    
        /*
         * Reload because Zoho service updates
         * zohoSalesOrderId / zohoSyncStatus.
         */
        await order.reload();
      } catch (
        zohoError
      ) {
        console.error(
          "Zoho Sales Order posting failed after Network International payment:",
          {
            orderId:
              order.id,
    
            orderNumber:
              order.orderNumber,
    
            error:
              zohoError
                ?.message ||
              String(
                zohoError
              ),
          }
        );
    
        /*
         * IMPORTANT:
         * Do NOT throw.
         *
         * Customer payment has already succeeded.
         * zohoSalesOrder.service.js stores FAILED status
         * so the integration can be retried.
         */
      }
    }
    
    return {
      gatewayState,
      mapped,
    
      latePaymentRecovery,
      order,
      payment,
    };
  };

/*
 * ============================================================
 * GET CARD ORDER
 * ============================================================
 */

const getCardOrder =
  async ({
    orderId,
    customerId = null,
  }) => {
    const where = {
      id:
        orderId,

      paymentMethod:
        "CARD",
    };

    if (
      customerId
    ) {
      where.customerId =
        customerId;
    }

    const order =
      await db.Order.findOne({
        where,
      });

    if (
      !order
    ) {
      throw new AppError(
        "Card order was not found.",
        404,
        "CARD_ORDER_NOT_FOUND"
      );
    }

    const payment =
      await db
        .OrderPayment
        .findOne({
          where: {
            companyId:
              order.companyId,

            orderId:
              order.id,

            paymentMethod:
              "CARD",
          },

          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
        });

    if (
      !payment
    ) {
      throw new AppError(
        "Card payment record was not found.",
        409,
        "CARD_PAYMENT_NOT_FOUND"
      );
    }

    return {
      order,
      payment,
    };
  };

/*
 * ============================================================
 * CREATE HOSTED PAYMENT PAGE CHECKOUT
 * ============================================================
 */

const createHostedCheckout =
  async ({
    orderId,
    customerId = null,
  }) => {
    ensureHostedCheckoutConfiguration();

    const {
      order,
      payment,
    } =
      await getCardOrder({
        orderId,
        customerId,
      });

    if (
      order.paymentStatus ===
      "PAID"
    ) {
      throw new AppError(
        "This order has already been paid.",
        409,
        "ORDER_ALREADY_PAID"
      );
    }

    const existingPaymentUrl =
      payment.provider ===
        "NETWORK_INTERNATIONAL"
        ? payment.providerPayload
            ?.hostedCheckout
            ?.paymentUrl ||
          null
        : null;

    if (
      payment.providerReference &&
      existingPaymentUrl &&
      payment.status ===
        "PENDING"
    ) {
      return {
        reused:
          true,

        paymentUrl:
          existingPaymentUrl,

        gatewayOrderReference:
          payment.providerReference,

        gatewayOrderId:
          payment.providerPayload
            ?.hostedCheckout
            ?.gatewayOrderId ||
          null,

        order,
        payment,
      };
    }

    const accessToken =
      await requestAccessToken();

    const url =
      `${BASE_URL}/transactions/outlets/${encodeURIComponent(
        OUTLET_REF
      )}/orders`;

    const redirectUrl =
      addQueryParameter(
        HOSTED_RETURN_URL,
        "orderId",
        order.id
      );

    const cancelUrl =
      addQueryParameter(
        HOSTED_CANCEL_URL,
        "orderId",
        order.id
      );

    const merchantOrderReference =
      String(
        order.orderNumber ||
        order.id
      )
        .replace(
          /[^A-Za-z0-9-]/g,
          "-"
        )
        .slice(
          0,
          64
        );

    const body = {
      action:
        "PURCHASE",

      amount: {
        currencyCode:
          String(
            order.currencyCode ||
            "AED"
          )
            .trim()
            .toUpperCase(),

        value:
          moneyToMinorUnits(
            order.grandTotal
          ),
      },

      language:
        "en",

      emailAddress:
        String(
          order.customerEmail ||
          ""
        ).trim(),

      merchantOrderReference,

      merchantAttributes: {
        redirectUrl,
        cancelUrl,
        skipConfirmationPage:
          true,
        skip3DS:
          false,
        paymentAttempts:
          "3",
      },
    };

    let gatewayResponse;

    try {
      console.log(
        "=== NETWORK INTERNATIONAL HOSTED CHECKOUT REQUEST ==="
      );

      console.log(
        JSON.stringify(
          {
            method:
              "POST",
            url,
            outletRef:
              OUTLET_REF,
            orderId:
              order.id,
            orderNumber:
              order.orderNumber,
            body,
          },
          null,
          2
        )
      );

      const response =
        await axios.post(
          url,
          body,
          {
            timeout:
              30000,

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                PAYMENT_CONTENT_TYPE,

              Accept:
                PAYMENT_CONTENT_TYPE,
            },
          }
        );

      gatewayResponse =
        response.data;
    } catch (
      error
    ) {
      const details =
        getGatewayError(
          error
        );

      console.error(
        "Network International hosted checkout creation failed:",
        JSON.stringify(
          details,
          null,
          2
        )
      );

      await payment.update({
        status:
          "FAILED",

        provider:
          "NETWORK_INTERNATIONAL",

        providerPayload: {
          hostedCheckout: {
            request: {
              action:
                body.action,

              amount:
                body.amount,

              merchantOrderReference,

              redirectUrl,

              cancelUrl,
            },

            gatewayError:
              details,
          },
        },
      });

      await order.update({
        paymentStatus:
          "FAILED",

        orderStatus:
          "PENDING",
      });

      throw new AppError(
        "Unable to start the secure card payment.",
        502,
        "NETWORK_INTL_HOSTED_CHECKOUT_FAILED",
        details.data
          ? [
              details.data,
            ]
          : []
      );
    }

    const paymentUrl =
      gatewayResponse
        ?._links
        ?.payment
        ?.href;

    const gatewayOrderReference =
      extractOrderReference(
        gatewayResponse
      );

    const gatewayOrderId =
      gatewayResponse
        ?._id ||
      null;

    if (
      !paymentUrl ||
      !gatewayOrderReference
    ) {
      console.error(
        "Network International hosted checkout response was incomplete:",
        JSON.stringify(
          gatewayResponse,
          null,
          2
        )
      );

      await payment.update({
        status:
          "FAILED",

        provider:
          "NETWORK_INTERNATIONAL",

        providerPayload: {
          hostedCheckout: {
            gatewayResponse,
          },
        },
      });

      await order.update({
        paymentStatus:
          "FAILED",

        orderStatus:
          "PENDING",
      });

      throw new AppError(
        "Network International did not return a hosted payment URL or order reference.",
        502,
        "NETWORK_INTL_HOSTED_CHECKOUT_RESPONSE_INVALID"
      );
    }

    await payment.update({
      status:
        "PENDING",

      provider:
        "NETWORK_INTERNATIONAL",

      providerReference:
        gatewayOrderReference,

      providerPayload: {
        hostedCheckout: {
          paymentUrl,
          gatewayOrderReference,
          gatewayOrderId,
          redirectUrl,
          cancelUrl,
          merchantOrderReference,
          gatewayResponse,
        },
      },
    });

    if (
      order.paymentStatus !==
      "PENDING"
    ) {
      await order.update({
        paymentStatus:
          "PENDING",

        orderStatus:
          "PENDING",
      });
    }

    console.log(
      "Network International hosted checkout created:",
      {
        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        gatewayOrderReference,

        paymentUrl,
      }
    );

    return {
      reused:
        false,

      paymentUrl,

      gatewayOrderReference,

      gatewayOrderId,

      gatewayResponse,

      order,

      payment,
    };
  };

/*
 * ============================================================
 * COMPLETE HOSTED SESSION PAYMENT
 * ============================================================
 */

const completeHostedSessionPayment =
  async ({
    orderId,
    sessionId,
    customerId = null,
  }) => {
    ensureConfiguration();

    if (
      !sessionId
    ) {
      throw new AppError(
        "Hosted Session ID is required.",
        400,
        "NETWORK_INTL_SESSION_REQUIRED"
      );
    }

    const {
      order,
      payment,
    } =
      await getCardOrder({
        orderId,
        customerId,
      });

    if (
      order.paymentStatus ===
      "PAID"
    ) {
      return {
        alreadyPaid:
          true,

        gatewayResponse:
          payment.providerPayload,

        gatewayState:
          extractGatewayState(
            payment.providerPayload
          ),

        order,
        payment,
      };
    }

    const accessToken =
      await requestAccessToken();

    const url =
      `${BASE_URL}/transactions/outlets/${encodeURIComponent(
        OUTLET_REF
      )}/payment/hosted-session/${encodeURIComponent(
        sessionId
      )}`;

    const body = {
      action:
        "PURCHASE",

      amount: {
        currencyCode:
          String(
            order.currencyCode ||
            "AED"
          )
            .trim()
            .toUpperCase(),

        value:
          moneyToMinorUnits(
            order.grandTotal
          ),
      },

      merchantAttributes: {
        merchantOrderReference:
          order.orderNumber,
      },
    };

    let gatewayResponse;

    try {
      console.log(
        "=== NETWORK INTERNATIONAL PAYMENT REQUEST ==="
      );

      console.log(
        JSON.stringify(
          {
            method:
              "POST",

            url,

            outletRef:
              OUTLET_REF,

            body,
          },
          null,
          2
        )
      );

      const response =
        await axios.post(
          url,
          body,
          {
            timeout:
              30000,

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                PAYMENT_CONTENT_TYPE,

              Accept:
                PAYMENT_CONTENT_TYPE,
            },
          }
        );

      /*
       * IMPORTANT:
       * Assign first, then log.
       */
      gatewayResponse =
        response.data;

      console.log(
        "=== NETWORK INTERNATIONAL SUCCESSFUL PAYMENT RESPONSE ==="
      );

      console.log(
        JSON.stringify(
          gatewayResponse,
          null,
          2
        )
      );

      console.log(
        "=== END NETWORK INTERNATIONAL SUCCESSFUL PAYMENT RESPONSE ==="
      );
    } catch (
      error
    ) {
      const details =
        getGatewayError(
          error
        );

      console.error(
        "Network International Hosted Session payment failed:",
        JSON.stringify(
          details,
          null,
          2
        )
      );

      await payment.update({
        status:
          "FAILED",

        provider:
          "NETWORK_INTERNATIONAL",

        providerPayload: {
          sessionId,

          request: {
            action:
              body.action,

            amount:
              body.amount,
          },

          gatewayError:
            details,
        },
      });

      await order.update({
        paymentStatus:
          "FAILED",

        orderStatus:
          "PENDING",
      });

      throw new AppError(
        "The card payment could not be processed.",
        502,
        "NETWORK_INTL_PAYMENT_FAILED",
        details.data
          ? [
              details.data,
            ]
          : []
      );
    }

    const providerReference =
      extractOrderReference(
        gatewayResponse
      );

    console.log(
      "Network International extracted order reference:",
      providerReference
    );

    const result =
      await applyGatewayResult({
        order,
        payment,

        gatewayPayload: {
          sessionId,
          gatewayResponse,
        },

        explicitState:
          extractGatewayState(
            gatewayResponse
          ),

        providerReference,
      });

    return {
      alreadyPaid:
        false,

      gatewayResponse,

      gatewayState:
        result.gatewayState,

      order:
        result.order,

      payment:
        result.payment,
    };
  };

/*
 * ============================================================
 * RETRIEVE NETWORK INTERNATIONAL ORDER
 * ============================================================
 */

const retrieveGatewayOrder =
  async ({
    orderReference,
  }) => {
    ensureConfiguration();

    if (
      !orderReference
    ) {
      throw new AppError(
        "Network International order reference is missing.",
        409,
        "NETWORK_INTL_ORDER_REFERENCE_MISSING"
      );
    }

    const accessToken =
      await requestAccessToken();

    const url =
      `${BASE_URL}/transactions/outlets/${encodeURIComponent(
        OUTLET_REF
      )}/orders/${encodeURIComponent(
        orderReference
      )}`;

    try {
      const response =
        await axios.get(
          url,
          {
            timeout:
              20000,

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              Accept:
                PAYMENT_CONTENT_TYPE,
            },
          }
        );

      return response.data;
    } catch (
      error
    ) {
      const details =
        getGatewayError(
          error
        );

      console.error(
        "=== NETWORK INTERNATIONAL PAYMENT ERROR START ==="
      );

      console.error(
        JSON.stringify(
          {
            request: {
              method:
                "GET",

              url,

              orderReference,
            },

            response: {
              status:
                error
                  ?.response
                  ?.status,

              statusText:
                error
                  ?.response
                  ?.statusText,

              data:
                error
                  ?.response
                  ?.data,
            },
          },
          null,
          2
        )
      );

      console.error(
        "=== NETWORK INTERNATIONAL PAYMENT ERROR END ==="
      );

      console.error(
        "Network International order status retrieval failed:",
        details
      );

      throw new AppError(
        "Unable to retrieve payment status from Network International.",
        502,
        "NETWORK_INTL_STATUS_RETRIEVAL_FAILED",
        details.data
          ? [
              details.data,
            ]
          : []
      );
    }
  };

/*
 * ============================================================
 * RECONCILE ORDER PAYMENT
 * ============================================================
 */

const reconcileOrderPayment =
  async ({
    orderId,
    customerId = null,
  }) => {
    const {
      order,
      payment,
    } =
      await getCardOrder({
        orderId,
        customerId,
      });

    if (
      !payment.providerReference
    ) {
      throw new AppError(
        "Network International order reference has not been recorded yet.",
        409,
        "NETWORK_INTL_ORDER_REFERENCE_MISSING"
      );
    }

    console.log(
      "Reconciling Network International payment:",
      {
        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        providerReference:
          payment.providerReference,

        outletRef:
          OUTLET_REF,
      }
    );

    const gatewayOrder =
      await retrieveGatewayOrder({
        orderReference:
          payment.providerReference,
      });

    const result =
      await applyGatewayResult({
        order,
        payment,

        gatewayPayload:
          gatewayOrder,

        explicitState:
          extractGatewayState(
            gatewayOrder
          ),

        providerReference:
          payment.providerReference,
      });

    return {
      gatewayResponse:
        gatewayOrder,

      gatewayState:
        result.gatewayState,

      order:
        result.order,

      payment:
        result.payment,
    };
  };

/*
 * ============================================================
 * WEBHOOK
 * ============================================================
 */

const processWebhook =
  async (
    payload
  ) => {
    const eventName =
      String(
        payload
          ?.eventName ||
        ""
      )
        .trim()
        .toUpperCase();

    const gatewayOrder =
      payload?.order ||
      null;

    const orderReference =
      extractOrderReference(
        gatewayOrder
      );

    if (
      !orderReference
    ) {
      return {
        ignored:
          true,

        reason:
          "ORDER_REFERENCE_MISSING",
      };
    }

    const payment =
      await db
        .OrderPayment
        .findOne({
          where: {
            provider:
              "NETWORK_INTERNATIONAL",

            providerReference:
              orderReference,
          },

          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
        });

    if (
      !payment
    ) {
      return {
        ignored:
          true,

        reason:
          "PAYMENT_NOT_FOUND",

        orderReference,
      };
    }

    const order =
      await db
        .Order
        .findOne({
          where: {
            id:
              payment.orderId,

            companyId:
              payment.companyId,
          },
        });

    if (
      !order
    ) {
      return {
        ignored:
          true,

        reason:
          "ORDER_NOT_FOUND",

        orderReference,
      };
    }

    const result =
      await applyGatewayResult({
        order,
        payment,

        gatewayPayload:
          payload,

        explicitState:
          eventName ||
          extractGatewayState(
            gatewayOrder
          ),

        providerReference:
          orderReference,
      });

    return {
      ignored:
        false,

      eventName,

      gatewayState:
        result.gatewayState,

      orderId:
        order.id,

      orderNumber:
        order.orderNumber,
    };
  };

/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  requestAccessToken,
  createHostedCheckout,
  completeHostedSessionPayment,
  reconcileOrderPayment,
  processWebhook,
  extractGatewayState,
  extractOrderReference,
};