const { Op } = require("sequelize");

const db = require("../models");
const tabbyService = require("../services/tabbyService");

const reservationLifecycleService =
  require(
    "../services/orderShipmentReservationLifecycle.service"
  );

const latePaymentRecoveryService =
  require(
    "../services/latePaymentRecovery.service"
  );

const zohoSalesOrderService =
  require(
    "../services/zohoSalesOrder.service"
  );

const {
  queueOrderNotification,
} =
  require(
    "../services/emailNotificationQueue.service"
  );

const {
  Order,
  OrderItem,
  OrderAddress,
  OrderPayment,
  OrderStatusHistory,
  PaymentWebhookLog,
  Customer,
} = db;

const money = (value) => Number(value || 0).toFixed(2);

const storefrontUrl = () =>
  (
    process.env.STOREFRONT_URL ||
    process.env.FRONTEND_URL ||
    "https://vkposme.tech"
  ).replace(/\/+$/, "");

const mapStatus = (
  status
) => {
  const normalized =
    String(
      status ||
      ""
    )
      .trim()
      .toUpperCase();

  switch (
    normalized
  ) {
    case "AUTHORIZED":
      return {
        paymentStatus:
          "AUTHORIZED",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,

        releaseReservation:
          false,
      };

    case "CLOSED":
      return {
        paymentStatus:
          "PAID",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,

        releaseReservation:
          false,
      };

    case "REJECTED":
    case "EXPIRED":
    case "CANCELLED":
    case "CANCELED":
      return {
        paymentStatus:
          "FAILED",

        orderStatus:
          "CANCELLED",

        successfulCheckout:
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

        successfulCheckout:
          false,

        releaseReservation:
          false,
      };
  }
};

const loadOrder = (orderId) =>
  Order.findOne({
    where: { id: orderId },
    include: [
      { model: OrderItem, as: "items" },
      { model: OrderAddress, as: "addresses" },
      { model: OrderPayment, as: "payments", required: false },
    ],
  });

const latestPayment = (orderId) =>
  OrderPayment.findOne({
    where: { orderId, paymentMethod: "TABBY" },
    order: [["createdAt", "DESC"]],
  });

const savePayment = async ({ order, paymentId, status, payload }) => {
  let row = await latestPayment(order.id);

  const values = {
    companyId: order.companyId,
    orderId: order.id,
    paymentMethod: "TABBY",
    status,
    amount: order.grandTotal,
    currencyCode: order.currencyCode,
    provider: "TABBY",
    providerReference: paymentId || row?.providerReference || null,
    providerPayload: payload || null,
    paidAt: status === "PAID" ? new Date() : row?.paidAt || null,
  };

  if (row) {
    await row.update(values);
    return row;
  }

  return OrderPayment.create(values);
};

const buildItems = (order) =>
  (order.items || []).map((item) => ({
    title: item.productName,
    quantity: Number(item.quantity),
    unit_price: money(item.unitPrice),
    category: "Electronics",
    reference_id: item.sku || item.productVariantId,
    description: item.variantName || item.productName,
    discount_amount: money(item.discountAmount),
    is_refundable: true,
  }));


/*
|--------------------------------------------------------------------------
| Tabby Buyer / Order History
|--------------------------------------------------------------------------
|
| Tabby requires buyer_history and order_history on the real checkout
| session. order_history must exclude the current order and should contain
| up to 5-10 genuine previous orders where available.
|--------------------------------------------------------------------------
*/

const successfulHistoricalOrder =
  (order) => {
    const paymentStatus =
      String(
        order.paymentStatus ||
        ""
      )
        .trim()
        .toUpperCase();

    const orderStatus =
      String(
        order.orderStatus ||
        ""
      )
        .trim()
        .toUpperCase();

    return (
      paymentStatus ===
        "PAID" ||
      orderStatus ===
        "DELIVERED" ||
      orderStatus ===
        "COMPLETED"
    );
  };

const loadPreviousOrders =
  async (
    order
  ) => {
    const normalizedEmail =
      String(
        order.customerEmail ||
        ""
      )
        .trim()
        .toLowerCase();

    const identityWhere =
      order.customerId
        ? {
            [Op.or]: [
              {
                customerId:
                  order.customerId,
              },

              ...(normalizedEmail
                ? [
                    {
                      customerEmail:
                        normalizedEmail,
                    },
                  ]
                : []),
            ],
          }
        : normalizedEmail
          ? {
              customerEmail:
                normalizedEmail,
            }
          : null;

    if (
      !identityWhere
    ) {
      return [];
    }

    return Order.findAll({
      where: {
        companyId:
          order.companyId,

        id: {
          [Op.ne]:
            order.id,
        },

        ...identityWhere,
      },

      include: [
        {
          model:
            OrderItem,

          as:
            "items",
        },

        {
          model:
            OrderAddress,

          as:
            "addresses",
        },
      ],

      order: [
        [
          "createdAt",
          "DESC",
        ],
      ],

      /*
       * Tabby recommends 5-10 previous orders where available.
       */
      limit:
        10,
    });
  };

const loadRegisteredCustomer =
  async (
    order
  ) => {
    if (
      !order.customerId ||
      !Customer
    ) {
      return null;
    }

    return Customer.findOne({
      where: {
        id:
          order.customerId,

        companyId:
          order.companyId,
      },
    });
  };

const buildBuyerHistory =
  async (
    order,
    previousOrders
  ) => {
    const customer =
      await loadRegisteredCustomer(
        order
      );

    /*
     * For registered customers, use the real Customer.createdAt.
     * Guest checkout has no registration record, but Tabby requires
     * registered_since on every full session. In that case use the
     * earliest genuine interaction/order timestamp available.
     */
    const oldestPreviousOrder =
      previousOrders.length
        ? previousOrders[
            previousOrders.length -
              1
          ]
        : null;

    const registeredSince =
      customer?.createdAt ||
      oldestPreviousOrder
        ?.createdAt ||
      order.createdAt ||
      new Date();

    const loyaltyLevel =
      previousOrders.filter(
        successfulHistoricalOrder
      ).length;

    return {
      registered_since:
        new Date(
          registeredSince
        ).toISOString(),

      /*
       * Tabby defines loyalty_level as the number of successful
       * previous orders. Do not send a fabricated membership tier.
       */
      loyalty_level:
        loyaltyLevel,

      is_phone_number_verified:
        Boolean(
          customer
            ?.mobileVerifiedAt
        ),

      is_email_verified:
        Boolean(
          customer
            ?.emailVerifiedAt
        ),
    };
  };

const historicalPaymentMethod =
  (order) => {
    const method =
      String(
        order.paymentMethod ||
        ""
      )
        .trim()
        .toUpperCase();

    switch (
      method
    ) {
      case "CARD":
      case "NETWORK_INTERNATIONAL":
        return "card";

      case "TABBY":
        return "tabby";

      case "TAMARA":
        return "tamara";

      case "COD":
      case "CASH_ON_DELIVERY":
        return "cash";

      default:
        return (
          method
            .toLowerCase() ||
          "other"
        );
    }
  };

const historicalOrderStatus =
  (order) => {
    const orderStatus =
      String(
        order.orderStatus ||
        ""
      )
        .trim()
        .toUpperCase();

    const paymentStatus =
      String(
        order.paymentStatus ||
        ""
      )
        .trim()
        .toUpperCase();

    if (
      orderStatus ===
        "CANCELLED" ||
      orderStatus ===
        "CANCELED"
    ) {
      return "cancelled";
    }

    if (
      orderStatus ===
        "REFUNDED" ||
      paymentStatus ===
        "REFUNDED"
    ) {
      return "refunded";
    }

    if (
      orderStatus ===
        "DELIVERED" ||
      orderStatus ===
        "COMPLETED" ||
      paymentStatus ===
        "PAID"
    ) {
      return "complete";
    }

    if (
      orderStatus ===
        "CONFIRMED" ||
      orderStatus ===
        "PROCESSING"
    ) {
      return "processing";
    }

    return "new";
  };

const historicalShippingAddress =
  (order) => {
    const shipping =
      order.addresses?.find(
        (address) =>
          String(
            address.addressType ||
            ""
          ).toUpperCase() ===
          "SHIPPING"
      ) ||
      order.addresses?.[0] ||
      null;

    return {
      city:
        shipping?.city ||
        shipping?.emirate ||
        "Dubai",

      address:
        [
          shipping
            ?.addressLine1,
          shipping
            ?.addressLine2,
          shipping?.area,
          shipping?.emirate,
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          ) ||
        "United Arab Emirates",

      zip:
        shipping?.postalCode ||
        shipping?.zip ||
        "00000",
    };
  };

const buildHistoricalOrder =
  (order) => ({
    purchased_at:
      new Date(
        order.createdAt
      ).toISOString(),

    amount:
      money(
        order.grandTotal
      ),

    payment_method:
      historicalPaymentMethod(
        order
      ),

    status:
      historicalOrderStatus(
        order
      ),

    buyer: {
      name:
        [
          order.customerFirstName,
          order.customerLastName,
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
          .trim() ||
        "MyShops Customer",

      email:
        order.customerEmail,

      phone:
        order.customerPhone,
    },

    shipping_address:
      historicalShippingAddress(
        order
      ),

    items:
      buildItems(
        order
      ),
  });


const buildCapturePayload = (
  order
) => ({
  amount:
    money(
      order.grandTotal
    ),

  /*
   * Stable idempotency key:
   * repeated reconcile/success calls use the same value.
   */
  reference_id:
    `myshops-${order.id}-full-capture`,

  tax_amount:
    money(
      order.taxAmount
    ),

  shipping_amount:
    money(
      order.deliveryAmount
    ),

  discount_amount:
    money(
      order.discountAmount
    ),

  items:
    buildItems(
      order
    ),
});

const reconcileAndCapture =
  async (
    order
  ) => {
    const payment =
      await latestPayment(
        order.id
      );

    if (
      !payment
        ?.providerReference
    ) {
      const error =
        new Error(
          "Tabby payment reference was not found."
        );

      error.statusCode =
        404;

      throw error;
    }

    const paymentId =
      payment
        .providerReference;

    /*
    |--------------------------------------------------------------------------
    | Read authoritative Tabby state
    |--------------------------------------------------------------------------
    */

    let tabbyPayment =
      await tabbyService.getPayment(
        paymentId
      );

    let status =
      String(
        tabbyPayment
          ?.status ||
        ""
      )
        .trim()
        .toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | Immediate Capture
    |--------------------------------------------------------------------------
    |
    | CREATED     -> still pending
    | AUTHORIZED  -> capture full amount immediately
    | CLOSED      -> fully captured / paid
    | REJECTED    -> terminal failure
    | EXPIRED     -> terminal failure
    | CANCELLED   -> terminal failure
    |--------------------------------------------------------------------------
    */

    if (
      status ===
      "AUTHORIZED"
    ) {
      await tabbyService.capturePayment(
        paymentId,
        buildCapturePayload(
          order
        )
      );

      /*
       * Do not assume the capture response shape.
       * Retrieve the payment again and trust Tabby's final state.
       */
      tabbyPayment =
        await tabbyService.getPayment(
          paymentId
        );

      status =
        String(
          tabbyPayment
            ?.status ||
          ""
        )
          .trim()
          .toUpperCase();
    }

    const mapped =
      mapStatus(
        status
      );

    const fullyCaptured =
      status ===
      "CLOSED";

    const localPaymentStatus =
      fullyCaptured
        ? "PAID"
        : status ===
            "AUTHORIZED"
          ? "AUTHORIZED"
          : mapped
              .paymentStatus;

    /*
    |--------------------------------------------------------------------------
    | Persist Payment + Order + Reservation Lifecycle Atomically
    |--------------------------------------------------------------------------
    */

    const transaction =
      await db.sequelize.transaction();

    /*
     * Must be declared outside the try block because it is returned
     * later from reconcileAndCapture().
     */
    let latePaymentRecovery =
      null;

    try {
      await payment.update(
        {
          status:
            localPaymentStatus,

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

            tabbyPayment,
            tabbyStatus:
              status ||
              null,
          },

          paidAt:
            fullyCaptured
              ? payment.paidAt ||
                new Date()
              : payment.paidAt,
        },
        {
          transaction,
        }
      );

      const previousOrderStatus =
        order.orderStatus;

      const updates = {
        paymentStatus:
          localPaymentStatus,
      };

      if (
        fullyCaptured
      ) {
        updates.orderStatus =
          "CONFIRMED";
      } else if (
        mapped.releaseReservation
      ) {
        updates.orderStatus =
          "CANCELLED";
      } else if (
        order.orderStatus ===
        "PENDING" &&
        mapped.orderStatus
      ) {
        updates.orderStatus =
          mapped.orderStatus;
      }

      await order.update(
        updates,
        {
          transaction,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Late Successful Payment Recovery
      |--------------------------------------------------------------------------
      */

      if (
        localPaymentStatus ===
          "PAID" ||
        localPaymentStatus ===
          "AUTHORIZED"
      ) {
        latePaymentRecovery =
          await latePaymentRecoveryService
            .handleLateSuccessfulPayment({
              order,
              payment,

              provider:
                "TABBY",

              providerState:
                status,

              transaction,
            });

        await order.reload({
          transaction,
        });

        await payment.reload({
          transaction,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Release reservation for terminal Tabby outcomes
      |--------------------------------------------------------------------------
      */

      if (
        mapped.releaseReservation
      ) {
        await reservationLifecycleService
          .releaseForPaymentFailure({
            order,

            reason:
              `TABBY_${status || "FAILED"}`,

            transaction,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Order status history
      |--------------------------------------------------------------------------
      */

      if (
        order.orderStatus &&
        order.orderStatus !==
          previousOrderStatus &&
        OrderStatusHistory
      ) {
        try {
          await OrderStatusHistory.create(
            {
              companyId:
                order.companyId,

              orderId:
                order.id,

              statusType:
                "ORDER",

              fromStatus:
                previousOrderStatus,

              toStatus:
                order.orderStatus,

              note:
                fullyCaptured
                  ? "Tabby payment captured in full."
                  : `Tabby payment status changed to ${status}.`,
            },
            {
              transaction,
            }
          );
        } catch (
          historyError
        ) {
          console.error(
            "Tabby status history error:",
            historyError
          );
        }
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
            companyId: order.companyId,
            orderId: order.id,
            notificationType: "ORDER_CONFIRMED",
          });

        console.log(
          "Order confirmation email queued after Tabby payment:",
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
          "Order confirmation email queue failed after Tabby payment:",
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
| Tabby transaction has already committed.
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
      "Zoho Sales Order posted after Tabby payment:",
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

    await order.reload();
  } catch (
    zohoError
  ) {
    console.error(
      "Zoho Sales Order posting failed after Tabby payment:",
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
     * Never throw from here.
     * Tabby payment remains successful.
     */
  }
}

return {
  order,
  payment,
  tabbyPayment,
  status,
  fullyCaptured,
  localPaymentStatus,

  orderStatus:
    order.orderStatus,

  latePaymentRecovery,
    };
  };


/*
|--------------------------------------------------------------------------
| Background Pre-scoring
|--------------------------------------------------------------------------
|
| This does NOT create a MyShops order.
| It creates a Tabby checkout session in the background and uses the
| available_products response only to decide whether Tabby can be selected.
|
| Tabby QA specifically expects +971500000002 to be rejected during this
| background check when used with the documented UAE test credentials.
|--------------------------------------------------------------------------
*/

exports.prescore = async (req, res, next) => {
  try {
    const {
      amount,
      currency = "AED",
      firstName = "",
      lastName = "",
      email,
      phone,
      city = "Dubai",
      address = "United Arab Emirates",
      items = [],
      lang = "en",
    } = req.body || {};

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res
        .status(400)
        .json({
          success: false,
          eligible: false,
          message:
            "A valid amount is required for Tabby pre-scoring.",
        });
    }

    if (
      !email ||
      !phone
    ) {
      return res.json({
        success: true,
        eligible: false,
        pendingCustomerDetails: true,
        message:
          "Enter your email and mobile number to check Tabby availability.",
      });
    }

    const normalizedItems =
      Array.isArray(items) &&
      items.length
        ? items.map(
            (
              item,
              index
            ) => ({
              title:
                String(
                  item.title ||
                  item.name ||
                  `Item ${index + 1}`
                ),

              quantity:
                Math.max(
                  1,
                  Number(
                    item.quantity ||
                    1
                  )
                ),

              unit_price:
                money(
                  item.unitPrice
                ),

              category:
                String(
                  item.category ||
                  "Electronics"
                ),

              reference_id:
                String(
                  item.referenceId ||
                  item.sku ||
                  item.id ||
                  `item-${index + 1}`
                ),

              description:
                String(
                  item.description ||
                  item.title ||
                  item.name ||
                  "Product"
                ),

              discount_amount:
                money(
                  item.discountAmount
                ),

              is_refundable:
                true,
            })
          )
        : [
            {
              title:
                "MyShops checkout",

              quantity:
                1,

              unit_price:
                money(
                  numericAmount
                ),

              category:
                "Electronics",

              reference_id:
                "checkout-prescore",

              description:
                "MyShops checkout",

              discount_amount:
                "0.00",

              is_refundable:
                true,
            },
          ];

    const referenceId =
      `prescore-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const base =
      storefrontUrl();

    const session =
      await tabbyService.createCheckout({
        lang:
          lang === "ar"
            ? "ar"
            : "en",

        merchantUrls: {
          success:
            `${base}/checkout`,

          cancel:
            `${base}/checkout`,

          failure:
            `${base}/checkout`,
        },

        payment: {
          amount:
            money(
              numericAmount
            ),

          currency:
            String(
              currency ||
              "AED"
            ).toUpperCase(),

          buyer: {
            name:
              [
                firstName,
                lastName,
              ]
                .filter(
                  Boolean
                )
                .join(" ")
                .trim() ||
              "MyShops Customer",

            email:
              String(
                email
              ).trim(),

            phone:
              String(
                phone
              ).trim(),
          },

          shipping_address: {
            city:
              String(
                city ||
                "Dubai"
              ),

            address:
              String(
                address ||
                "United Arab Emirates"
              ),

            zip:
              "00000",
          },

          order: {
            reference_id:
              referenceId,

            items:
              normalizedItems,

            updated_at:
              new Date()
                .toISOString(),

            tax_amount:
              "0.00",

            shipping_amount:
              "0.00",

            discount_amount:
              "0.00",
          },

          description:
            "MyShops Tabby background pre-scoring",

          meta: {
            order_id:
              referenceId,

            customer:
              String(
                email
              ).trim(),
          },
        },
      });

    const checkoutUrl =
      session
        ?.configuration
        ?.available_products
        ?.installments?.[0]
        ?.web_url ||
      null;

    const eligible =
      session?.status ===
        "created" &&
      Boolean(
        checkoutUrl
      );

    const rejectionReason =
      session
        ?.configuration
        ?.products
        ?.installments
        ?.rejection_reason ||
      null;

    return res.json({
      success:
        true,

      eligible,

      status:
        session?.status ||
        null,

      rejectionReason,

      message:
        eligible
          ? "Tabby is available for this checkout."
          : "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order.",
    });
  } catch (error) {
    /*
     * A Tabby business rejection can arrive as a normal checkout response,
     * but if the provider returns a request-level error we fail closed:
     * Tabby becomes unavailable while other payment methods remain usable.
     */
    console.error(
      "Tabby background pre-scoring failed:",
      error
    );

    return res
      .status(
        error.statusCode &&
        error.statusCode < 500
          ? 200
          : 503
      )
      .json({
        success:
          error.statusCode &&
          error.statusCode < 500,

        eligible:
          false,

        message:
          "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order.",

        providerError:
          process.env.NODE_ENV ===
            "development"
            ? error.message
            : undefined,
      });
  }
};

exports.createCheckout = async (req, res, next) => {
  try {
    const { orderId, lang = "en" } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required." });
    }

    const order = await loadOrder(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order was not found." });
    }

    if (order.paymentMethod !== "TABBY") {
      return res.status(409).json({
        success: false,
        message: "The order payment method is not Tabby.",
      });
    }

    if (String(order.currencyCode).toUpperCase() !== "AED") {
      return res.status(400).json({
        success: false,
        message: "Tabby checkout is currently enabled for AED orders only.",
      });
    }

    const existing = await latestPayment(order.id);
    const reusedUrl =
      existing?.providerPayload?.configuration?.available_products?.installments?.[0]?.web_url;

    if (existing?.providerReference && reusedUrl && existing.status === "PENDING") {
      return res.json({
        success: true,
        reused: true,
        orderId: order.id,
        paymentId: existing.providerReference,
        checkoutUrl: reusedUrl,
        status: existing.providerPayload?.status || "created",
      });
    }

    const shipping =
      order.addresses?.find((x) => x.addressType === "SHIPPING") ||
      order.addresses?.[0] ||
      null;

    const previousOrders =
      await loadPreviousOrders(
        order
      );

    const buyerHistory =
      await buildBuyerHistory(
        order,
        previousOrders
      );

    const orderHistory =
      previousOrders.map(
        buildHistoricalOrder
      );

    const base = storefrontUrl();

    const session = await tabbyService.createCheckout({
      lang: lang === "ar" ? "ar" : "en",
      merchantUrls: {
        success: `${base}/checkout/tabby/success?orderId=${encodeURIComponent(order.id)}`,
        cancel: `${base}/checkout/tabby/cancel?orderId=${encodeURIComponent(order.id)}`,
        failure: `${base}/checkout/tabby/failure?orderId=${encodeURIComponent(order.id)}`,
      },
      payment: {
        amount: money(order.grandTotal),
        currency: String(order.currencyCode).toUpperCase(),
        buyer: {
          name: [order.customerFirstName, order.customerLastName].filter(Boolean).join(" "),
          email: order.customerEmail,
          phone: order.customerPhone,
        },
        shipping_address: {
          city: shipping?.city || shipping?.emirate || "Dubai",
          address:
            [
              shipping?.addressLine1,
              shipping?.addressLine2,
              shipping?.area,
              shipping?.emirate,
            ].filter(Boolean).join(", ") || "United Arab Emirates",
          zip: "00000",
        },
        order: {
          reference_id: order.orderNumber || order.id,
          items: buildItems(order),
          updated_at: new Date(order.updatedAt || Date.now()).toISOString(),
          tax_amount: money(order.taxAmount),
          shipping_amount: money(order.deliveryAmount),
          discount_amount: money(order.discountAmount),
        },

        buyer_history:
          buyerHistory,

        order_history:
          orderHistory,

        description: `MyShops order ${order.orderNumber}`,
        meta: {
          order_id: order.id,
          order_number: order.orderNumber,
          customer: order.customerId || order.customerEmail,
        },
      },
    });

    const paymentId = session?.payment?.id || null;
    const checkoutUrl =
      session?.configuration?.available_products?.installments?.[0]?.web_url || null;

    if (session?.status !== "created" || !paymentId || !checkoutUrl) {
      await savePayment({ order, paymentId, status: "FAILED", payload: session });

      return res.status(409).json({
        success: false,
        eligible: false,
        orderId: order.id,
        message:
          session?.configuration?.products?.installments?.rejection_reason ||
          "Tabby is not available for this order.",
        data: session,
      });
    }

    await savePayment({ order, paymentId, status: "PENDING", payload: session });

    return res.json({
      success: true,
      eligible: true,
      orderId: order.id,
      sessionId: session.id,
      paymentId,
      checkoutUrl,
      status: session.status,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

exports.reconcile = async (req, res, next) => {
  try {
    const {
      orderId,
    } =
      req.body ||
      {};

    if (
      !orderId
    ) {
      return res
        .status(
          400
        )
        .json({
          success:
            false,

          message:
            "orderId is required.",
        });
    }

    const order =
      await loadOrder(
        orderId
      );

    if (
      !order
    ) {
      return res
        .status(
          404
        )
        .json({
          success:
            false,

          message:
            "Order was not found.",
        });
    }

    const result =
      await reconcileAndCapture(
        order
      );

    return res.json({
      success:
        true,

      orderId:
        order.id,

      paymentId:
        result.payment
          .providerReference,

      tabbyStatus:
        result.status,

      paymentStatus:
        result.localPaymentStatus,

      orderStatus:
        result.orderStatus,

      successfulCheckout:
        result.fullyCaptured,

      captured:
        result.fullyCaptured,

      data:
        result.tabbyPayment,
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
| Tabby Webhook
|--------------------------------------------------------------------------
|
| Uses the custom header configured when the webhook is registered.
| The notification itself is NOT trusted as the final payment state.
| We locate the local OrderPayment, retrieve the payment directly from Tabby,
| and run the same immediate reconcile/capture logic used by the success page.
|--------------------------------------------------------------------------
*/

const safeEqual =
  (
    left,
    right
  ) => {
    const crypto =
      require(
        "crypto"
      );

    const a =
      Buffer.from(
        String(
          left ||
          ""
        )
      );

    const b =
      Buffer.from(
        String(
          right ||
          ""
        )
      );

    if (
      a.length !==
      b.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      a,
      b
    );
  };

const extractWebhookPaymentId =
  (
    body
  ) => {
    if (
      !body ||
      typeof body !==
        "object"
    ) {
      return null;
    }

    return (
      body.payment_id ||
      body.paymentId ||
      body.id ||
      body.payment?.id ||
      body.data?.payment_id ||
      body.data?.paymentId ||
      body.data?.id ||
      body.data?.payment?.id ||
      null
    );
  };

exports.webhook =
  async (
    req,
    res
  ) => {
    const expectedSecret =
      String(
        process.env
          .TABBY_WEBHOOK_SECRET ||
        ""
      ).trim();

    const receivedSecret =
      String(
        req.headers[
          "x-tabby-webhook-secret"
        ] ||
        ""
      ).trim();

    if (
      !expectedSecret ||
      !safeEqual(
        receivedSecret,
        expectedSecret
      )
    ) {
      return res
        .status(
          401
        )
        .json({
          success:
            false,

          message:
            "Invalid Tabby webhook signature header.",
        });
    }

    const body =
      req.body ||
      {};

    const paymentId =
      extractWebhookPaymentId(
        body
      );

    let log =
      null;

    try {
      if (
        PaymentWebhookLog
      ) {
        log =
          await PaymentWebhookLog.create({
            provider:
              "TABBY",

            providerReference:
              paymentId
                ? String(
                    paymentId
                  )
                : null,

            eventType:
              String(
                body.event ||
                body.event_type ||
                body.type ||
                "PAYMENT_UPDATE"
              ),

            providerStatus:
              String(
                body.status ||
                body.payment?.status ||
                body.data?.status ||
                body.data?.payment?.status ||
                ""
              ) ||
              null,

            processingStatus:
              "RECEIVED",

            payload:
              body,

            receivedAt:
              new Date(),
          });
      }

      if (
        !paymentId
      ) {
        if (
          log
        ) {
          await log.update({
            processingStatus:
              "IGNORED",

            responseStatus:
              200,

            errorMessage:
              "Webhook did not contain a recognizable payment id.",

            processedAt:
              new Date(),
          });
        }

        /*
         * Return 200 so an unrelated/unsupported Tabby event
         * does not create an endless retry loop.
         */
        return res.json({
          success:
            true,

          ignored:
            true,
        });
      }

      const localPayment =
        await OrderPayment.findOne({
          where: {
            paymentMethod:
              "TABBY",

            providerReference:
              String(
                paymentId
              ),
          },

          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
        });

      if (
        !localPayment
      ) {
        if (
          log
        ) {
          await log.update({
            processingStatus:
              "IGNORED",

            responseStatus:
              200,

            errorMessage:
              "No matching local Tabby OrderPayment was found.",

            processedAt:
              new Date(),
          });
        }

        return res.json({
          success:
            true,

          ignored:
            true,
        });
      }

      const order =
        await loadOrder(
          localPayment
            .orderId
        );

      if (
        !order
      ) {
        throw new Error(
          "The MyShops order linked to the Tabby payment was not found."
        );
      }

      if (
        log
      ) {
        await log.update({
          companyId:
            order.companyId,

          orderId:
            order.id,

          orderPaymentId:
            localPayment.id,
        });
      }

      /*
       * Critical path:
       *
       * Retrieve Tabby payment
       * -> if AUTHORIZED, capture full amount immediately
       * -> retrieve again
       * -> CLOSED means PAID
       */
      const result =
        await reconcileAndCapture(
          order
        );

      if (
        log
      ) {
        await log.update({
          processingStatus:
            "PROCESSED",

          providerStatus:
            result.status,

          responseStatus:
            200,

          processedAt:
            new Date(),
        });
      }

      return res.json({
        success:
          true,

        orderId:
          order.id,

        paymentId:
          String(
            paymentId
          ),

        tabbyStatus:
          result.status,

        paymentStatus:
          result.localPaymentStatus,

        captured:
          result.fullyCaptured,
      });
    } catch (
      error
    ) {
      console.error(
        "Tabby webhook processing failed:",
        error
      );

      if (
        log
      ) {
        try {
          await log.update({
            processingStatus:
              "FAILED",

            responseStatus:
              500,

            errorMessage:
              error instanceof
                Error
                ? error.message
                : String(
                    error
                  ),

            processedAt:
              new Date(),
          });
        } catch (
          logError
        ) {
          console.error(
            "Unable to update Tabby webhook log:",
            logError
          );
        }
      }

      /*
       * Return 500 so Tabby can retry a transient failure.
       */
      return res
        .status(
          500
        )
        .json({
          success:
            false,

          message:
            "Unable to process Tabby webhook.",
        });
    }
  };
