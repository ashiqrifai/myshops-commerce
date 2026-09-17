const {
  Order,
  OrderPayment,
  OrderStatusHistory,
} = require("../models");

const crypto =
  require("crypto");

const tamaraService =
  require(
    "../services/tamaraService"
  );

const reservationLifecycleService =
  require(
    "../services/orderShipmentReservationLifecycle.service"
  );

const latePaymentRecoveryService =
  require(
    "../services/latePaymentRecovery.service"
  );

const {
  queueOrderNotification,
} =
  require(
    "../services/emailNotificationQueue.service"
  );

const PaymentWebhookLog =
  require("../models/PaymentWebhookLog");

/*
|--------------------------------------------------------------------------
| General Helpers
|--------------------------------------------------------------------------
*/

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getModelAttributes = (
  Model
) => {
  if (
    Model &&
    typeof Model.getAttributes ===
      "function"
  ) {
    return Model.getAttributes();
  }

  return (
    Model?.rawAttributes ||
    {}
  );
};

const hasAttribute = (
  Model,
  field
) =>
  Boolean(
    getModelAttributes(Model)[
      field
    ]
  );

const setIfExists = (
  Model,
  object,
  field,
  value
) => {
  if (
    value !== undefined &&
    hasAttribute(
      Model,
      field
    )
  ) {
    object[field] = value;
  }
};

const getValue = (
  source,
  fields,
  fallback = null
) => {
  for (const field of fields) {
    const value =
      source?.[field];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const money = (
  value
) => {
  const n = Number(value || 0);

  return Number(
    n.toFixed(2)
  );
};



const getOrderNumber = (
  order
) =>
  String(
    getValue(
      order,
      [
        "orderNumber",
        "orderNo",
        "orderCode",
        "number",
        "id",
      ],
      order.id
    )
  );

const getOrderCurrency = (
  order
) =>
  String(
    getValue(
      order,
      [
        "currency",
        "currencyCode",
      ],
      "AED"
    )
  ).toUpperCase();

const getOrderTotal = (
  order
) => {
  const value =
    getValue(
      order,
      [
        "grandTotal",
        "totalAmount",
        "payableAmount",
        "netAmount",
        "total",
        "amount",
      ]
    );

  const total =
    Number(value);

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    throw new Error(
      "Unable to determine the MyShops order total"
    );
  }

  return total;
};

const getCurrentOrderStatus = (
  order
) =>
  getValue(
    order,
    [
      "orderStatus",
      "status",
    ],
    "PENDING"
  );

/*
|--------------------------------------------------------------------------
| Provider Payload
|--------------------------------------------------------------------------
*/

const getProviderPayload = (
  payment
) => {
  const value =
    payment?.providerPayload;

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const mergeProviderPayload = (
  payment,
  values
) => ({
  ...getProviderPayload(
    payment
  ),
  ...values,
});

/*
|--------------------------------------------------------------------------
| Find Tamara Payment
|--------------------------------------------------------------------------
*/

const findTamaraPayment = async ({
  orderId,
  tamaraOrderId,
  transaction,
}) => {
  if (tamaraOrderId) {
    const payment =
      await OrderPayment.findOne(
        {
          where: {
            provider:
              "TAMARA",

            providerReference:
              tamaraOrderId,
          },

          transaction,
        }
      );

    if (payment) {
      return payment;
    }
  }

  if (orderId) {
    return OrderPayment.findOne({
      where: {
        orderId,
        provider:
          "TAMARA",
      },

      transaction,
    });
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Tamara -> MyShops Status Mapping
|--------------------------------------------------------------------------
|
| Tamara integration document says:
|
| Approved      = successful status
| Authorised    = successful status
| Fully Captured = successful status
|
| Because Tamara auto-authorisation is enabled for this integration,
| do NOT call Authorise API on Approved.
|--------------------------------------------------------------------------
*/

const mapTamaraStatus = (
  input
) => {
  const status =
    normalizeStatus(input);

  switch (status) {
    case "approved":
      return {
        tamaraStatus:
          "approved",

        paymentStatus:
          "AUTHORIZED",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,
      };

    case "authorised":
    case "authorized":
      return {
        tamaraStatus:
          "authorised",

        paymentStatus:
          "AUTHORIZED",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,
      };

    case "captured":
    case "fully_captured":
      return {
        tamaraStatus:
          status,

        paymentStatus:
          "PAID",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,
      };

    case "partially_captured":
      return {
        tamaraStatus:
          status,

        paymentStatus:
          "PARTIALLY_PAID",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,
      };

    case "declined":
      return {
        tamaraStatus:
          "declined",

        paymentStatus:
          "FAILED",

        orderStatus:
          "CANCELLED",

        successfulCheckout:
          false,
      };

    case "expired":
      return {
        tamaraStatus:
          "expired",

        paymentStatus:
          "FAILED",

        orderStatus:
          "CANCELLED",

        successfulCheckout:
          false,
      };

    case "canceled":
    case "cancelled":
      return {
        tamaraStatus:
          "canceled",

        paymentStatus:
          "CANCELLED",

        orderStatus:
          "CANCELLED",

        successfulCheckout:
          false,
      };

      case "refunded":
        case "fully_refunded":
          return {
            tamaraStatus:
              status,
        
            paymentStatus:
              "REFUNDED",
        
            /*
             * Refund is a PAYMENT state.
             *
             * Keep the operational order confirmed.
             * We should not write REFUNDED into
             * Order.orderStatus because that value
             * is not part of the Order enum.
             */
            orderStatus:
              "CONFIRMED",
        
            successfulCheckout:
              false,
          };

    case "partially_refunded":
      return {
        tamaraStatus:
          status,

        paymentStatus:
          "PARTIALLY_REFUNDED",

        orderStatus:
          "CONFIRMED",

        successfulCheckout:
          true,
      };

    case "new":
    default:
      return {
        tamaraStatus:
          status || "new",

        paymentStatus:
          "PENDING",

        orderStatus:
          "PENDING",

        successfulCheckout:
          false,
      };
  }
};

/*
|--------------------------------------------------------------------------
| Order Status History
|--------------------------------------------------------------------------
*/

const addOrderStatusHistory =
  async ({
    order,
    previousStatus,
    newStatus,
    tamaraStatus,
    transaction,
  }) => {
    if (!OrderStatusHistory) {
      return;
    }

    if (
      !newStatus ||
      previousStatus ===
        newStatus
    ) {
      return;
    }

    if (!order?.id) {
      throw new Error(
        "Cannot create OrderStatusHistory without orderId"
      );
    }

    if (!order?.companyId) {
      throw new Error(
        `Cannot create OrderStatusHistory: companyId missing for order ${order.id}`
      );
    }

    await OrderStatusHistory.create(
      {
        companyId:
          order.companyId,

        orderId:
          order.id,

        statusType:
          "ORDER",

        fromStatus:
          previousStatus ||
          null,

        toStatus:
          newStatus,

        note:
          `Tamara status changed to ${tamaraStatus}`,

        changedBy:
          null,
      },
      {
        transaction,
      }
    );
  };
/*
|--------------------------------------------------------------------------
| Apply Status
|--------------------------------------------------------------------------
*/

const applyTamaraStatus =
  async ({
    order,
    payment,
    tamaraStatus,
    payloadPatch = {},
    transaction,
  }) => {
    const mapped =
      mapTamaraStatus(
        tamaraStatus
      );

    const previousOrderStatus =
      getCurrentOrderStatus(
        order
      );

    /*
    |--------------------------------------------------------------------------
    | Update OrderPayment
    |--------------------------------------------------------------------------
    */

    const paymentUpdate =
      {};

    setIfExists(
      OrderPayment,
      paymentUpdate,
      "provider",
      "TAMARA"
    );

    if (
      hasAttribute(
        OrderPayment,
        "paymentStatus"
      )
    ) {
      paymentUpdate.paymentStatus =
        mapped.paymentStatus;
    } else {
      setIfExists(
        OrderPayment,
        paymentUpdate,
        "status",
        mapped.paymentStatus
      );
    }

    setIfExists(
      OrderPayment,
      paymentUpdate,
      "providerPayload",
      mergeProviderPayload(
        payment,
        {
          ...payloadPatch,

          tamaraStatus:
            mapped.tamaraStatus,

          lastStatusSyncAt:
            new Date().toISOString(),
        }
      )
    );

    await payment.update(
      paymentUpdate,
      {
        transaction,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Update Order
    |--------------------------------------------------------------------------
    */

    const orderUpdate =
      {};

    setIfExists(
      Order,
      orderUpdate,
      "paymentStatus",
      mapped.paymentStatus
    );

    if (
      hasAttribute(
        Order,
        "orderStatus"
      )
    ) {
      orderUpdate.orderStatus =
        mapped.orderStatus;
    } else {
      setIfExists(
        Order,
        orderUpdate,
        "status",
        mapped.orderStatus
      );
    }

    await order.update(
      orderUpdate,
      {
        transaction,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Late Successful Payment Recovery
    |--------------------------------------------------------------------------
    |
    | Approved / authorised / captured payments arriving after the reservation
    | expiry window must re-reserve CURRENT inventory before fulfillment.
    |--------------------------------------------------------------------------
    */

    const lateSuccessStatuses =
      new Set([
        "approved",
        "authorised",
        "authorized",
        "captured",
        "fully_captured",
        "partially_captured",
      ]);

    let latePaymentRecovery =
      null;

    if (
      lateSuccessStatuses.has(
        mapped.tamaraStatus
      )
    ) {
      latePaymentRecovery =
        await latePaymentRecoveryService
          .handleLateSuccessfulPayment({
            order,
            payment,

            provider:
              "TAMARA",

            providerState:
              mapped.tamaraStatus,

            transaction,
          });

      await order.reload({
        transaction,
      });

      await payment.reload({
        transaction,
      });
    }

    const newOrderStatus =
      getCurrentOrderStatus(
        order
      );

    await addOrderStatusHistory({
      order,
      previousStatus:
        previousOrderStatus,
      newStatus:
        newOrderStatus,
      tamaraStatus:
        mapped.tamaraStatus,
      transaction,
    });

    /*
    |--------------------------------------------------------------------------
    | Release Inventory Reservation For Terminal Tamara Failures
    |--------------------------------------------------------------------------
    |
    | Approved / authorised / captured states KEEP the reservation.
    |
    | Declined / expired / cancelled are terminal checkout outcomes and
    | therefore release any active stock reservations for the order.
    |
    | Refunded states are intentionally NOT handled here. Refund/return
    | inventory is a separate fulfillment flow.
    |--------------------------------------------------------------------------
    */

    const shouldReleaseReservation =
      mapped.tamaraStatus ===
        "declined" ||
      mapped.tamaraStatus ===
        "expired" ||
      mapped.tamaraStatus ===
        "canceled";

    if (
      shouldReleaseReservation
    ) {
      await reservationLifecycleService
        .releaseForPaymentFailure({
          order,

          reason:
            `TAMARA_${String(
              mapped.tamaraStatus
            )
              .trim()
              .toUpperCase()}`,

          transaction,
        });
    }

    return {
      ...mapped,

      latePaymentRecovery,
    };
  };



/*
|--------------------------------------------------------------------------
| Build Checkout Line
|--------------------------------------------------------------------------
*/

const buildTamaraItem = ({
  item,
  index,
  currency,
  orderNumber,
}) => {
  const quantity =
    Number(
      item.quantity ??
        item.qty ??
        1
    );

  const unitPrice =
    Number(
      item.unitPrice ??
        item.price ??
        item.sellingPrice ??
        0
    );

  const totalAmount =
    Number(
      item.totalAmount ??
        item.netAmount ??
        item.amount ??
        unitPrice * quantity
    );

  return {
    reference_id:
      String(
        item.referenceId ??
          item.itemId ??
          item.id ??
          `${orderNumber}-${index + 1}`
      ),

    type:
      item.type ||
      "Physical",

    name:
      String(
        item.name ??
          item.itemName ??
          item.productName ??
          "Product"
      ),

    sku:
      String(
        item.sku ??
          item.itemCode ??
          item.code ??
          ""
      ),

    quantity,

    unit_price: {
      amount:
        money(unitPrice),
      currency,
    },

    total_amount: {
      amount:
        money(totalAmount),
      currency,
    },

    tax_amount: {
      amount:
        money(
          item.taxAmount ||
            item.vatAmount ||
            0
        ),

      currency,
    },

    discount_amount: {
      amount:
        money(
          item.discountAmount ||
            0
        ),

      currency,
    },
  };
};

/*
|--------------------------------------------------------------------------
| POST /public/eligibility
|--------------------------------------------------------------------------
*/

exports.checkEligibility =
  async (req, res) => {
    try {
      const {
        amount,
        currency =
          "AED",
        phoneNumber,
      } = req.body || {};

      if (
        amount === undefined ||
        amount === null
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            eligible:
              false,

            message:
              "amount is required",
          });
      }

      const result =
        await tamaraService.checkEligibility(
          {
            amount,
            currency,
            phoneNumber,
          }
        );

      const eligible =
        result?.is_eligible ===
        true;

      return res.json({
        success:
          true,

        eligible,

        data:
          result,
      });
    } catch (error) {
      console.error(
        "[Tamara eligibility]",
        error
      );

      return res
        .status(
          error.status ||
            500
        )
        .json({
          success:
            false,

          eligible:
            false,

          message:
            error.message,

          tamara:
            error
              .tamaraResponse ||
            undefined,
        });
    }
  };

/*
|--------------------------------------------------------------------------
| POST /public/checkout
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The MyShops order must already exist.
|
| Do not call this before placePublicOrder() succeeds.
|--------------------------------------------------------------------------
*/

exports.createCheckout =
  async (req, res) => {
    try {
      const {
        orderId,

        /*
         * At this stage these customer/address/item values may still
         * come from checkout because we don't know your exact Sequelize
         * associations yet.
         *
         * The monetary grand total is ALWAYS loaded from MyShops Order.
         */
        consumer,
        billingAddress,
        shippingAddress,
        items = [],

        taxAmount = 0,
        shippingAmount = 0,

        discountName,
        discountAmount = 0,

        locale =
          "en_US",

        paymentType =
          "PAY_BY_INSTALMENTS",
      } = req.body || {};

      if (!orderId) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "orderId is required",
          });
      }

      const order =
        await Order.findByPk(
          orderId
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "MyShops order not found",
          });
      }

      const paymentMethod =
        String(
          getValue(
            order,
            [
              "paymentMethod",
            ],
            ""
          )
        ).toUpperCase();

      if (
        paymentMethod !==
        "TAMARA"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "This order is not a Tamara order",
          });
      }

      let payment =
        await findTamaraPayment(
          {
            orderId:
              order.id,
          }
        );

      if (!payment) {
        const values = {};

        setIfExists(
          OrderPayment,
          values,
          "orderId",
          order.id
        );

        setIfExists(
          OrderPayment,
          values,
          "paymentMethod",
          "TAMARA"
        );

        setIfExists(
          OrderPayment,
          values,
          "provider",
          "TAMARA"
        );

        if (
          hasAttribute(
            OrderPayment,
            "paymentStatus"
          )
        ) {
          values.paymentStatus =
            "PENDING";
        } else {
          setIfExists(
            OrderPayment,
            values,
            "status",
            "PENDING"
          );
        }

        setIfExists(
          OrderPayment,
          values,
          "providerPayload",
          {
            tamaraStatus:
              "pending",
          }
        );

        payment =
          await OrderPayment.create(
            values
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent duplicate checkout sessions
      |--------------------------------------------------------------------------
      */

      const existingPayload =
        getProviderPayload(
          payment
        );

      if (
        payment.providerReference &&
        existingPayload.checkoutUrl
      ) {
        return res.json({
          success: true,

          reused: true,

          orderId:
            order.id,

          tamaraOrderId:
            payment.providerReference,

          checkoutId:
            existingPayload.checkoutId,

          checkoutUrl:
            existingPayload.checkoutUrl,

          status:
            existingPayload.tamaraStatus ||
            "new",
        });
      }

      const total =
        getOrderTotal(
          order
        );

      const currency =
        getOrderCurrency(
          order
        );

      const orderNumber =
        getOrderNumber(
          order
        );

      if (!consumer?.email) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Consumer email is required for Tamara",
          });
      }

      if (
        !consumer?.phoneNumber &&
        !consumer?.phone_number
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Consumer phone number is required for Tamara",
          });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Order items are required for Tamara checkout",
          });
      }

      const tamaraItems =
        items.map(
          (
            item,
            index
          ) =>
            buildTamaraItem({
              item,
              index,
              currency,
              orderNumber,
            })
        );

        const successUrl =
        `${process.env.TAMARA_SUCCESS_URL}?myshopsOrderId=${encodeURIComponent(
          order.id
        )}`;
      
      const failureUrl =
        `${process.env.TAMARA_FAILURE_URL}?myshopsOrderId=${encodeURIComponent(
          order.id
        )}`;
      
      const cancelUrl =
        `${process.env.TAMARA_CANCEL_URL}?myshopsOrderId=${encodeURIComponent(
          order.id
        )}`;

      /*
      |--------------------------------------------------------------------------
      | Tamara Checkout Request
      |--------------------------------------------------------------------------
      */

      const checkoutPayload =
        {
          order_reference_id:
            orderNumber,

          order_number:
            orderNumber,

          total_amount: {
            amount:
              money(total),

            currency,
          },

          description:
            `MyShops Order ${orderNumber}`,

          country_code:
            process.env
              .TAMARA_COUNTRY_CODE ||
            "AE",

          payment_type:
            paymentType,

          locale,

          items:
            tamaraItems,

          consumer: {
            first_name:
              consumer.firstName ??
              consumer.first_name ??
              "",

            last_name:
              consumer.lastName ??
              consumer.last_name ??
              "",

            phone_number:
              consumer.phoneNumber ??
              consumer.phone_number ??
              "",

            email:
              consumer.email,
          },

          billing_address: {
            first_name:
              billingAddress?.firstName ??
              billingAddress?.first_name ??
              consumer.firstName ??
              "",

            last_name:
              billingAddress?.lastName ??
              billingAddress?.last_name ??
              consumer.lastName ??
              "",

            line1:
              billingAddress?.line1 ??
              billingAddress?.addressLine1 ??
              "",

            line2:
              billingAddress?.line2 ??
              billingAddress?.addressLine2 ??
              "",

            region:
              billingAddress?.region ??
              billingAddress?.emirate ??
              "",

            city:
              billingAddress?.city ??
              "",

            country_code:
              billingAddress?.countryCode ??
              billingAddress?.country_code ??
              "AE",

            phone_number:
              billingAddress?.phoneNumber ??
              billingAddress?.phone_number ??
              consumer.phoneNumber ??
              consumer.phone_number ??
              "",
          },

          shipping_address: {
            first_name:
              shippingAddress?.firstName ??
              shippingAddress?.first_name ??
              consumer.firstName ??
              "",

            last_name:
              shippingAddress?.lastName ??
              shippingAddress?.last_name ??
              consumer.lastName ??
              "",

            line1:
              shippingAddress?.line1 ??
              shippingAddress?.addressLine1 ??
              "",

            line2:
              shippingAddress?.line2 ??
              shippingAddress?.addressLine2 ??
              "",

            region:
              shippingAddress?.region ??
              shippingAddress?.emirate ??
              "",

            city:
              shippingAddress?.city ??
              "",

            country_code:
              shippingAddress?.countryCode ??
              shippingAddress?.country_code ??
              "AE",

            phone_number:
              shippingAddress?.phoneNumber ??
              shippingAddress?.phone_number ??
              consumer.phoneNumber ??
              consumer.phone_number ??
              "",
          },

          tax_amount: {
            amount:
              money(taxAmount),

            currency,
          },

          shipping_amount: {
            amount:
              money(
                shippingAmount
              ),

            currency,
          },

          discount: {
            name:
              discountName ||
              "MyShops Discount",

            amount: {
              amount:
                money(
                  discountAmount
                ),

              currency,
            },
          },

          merchant_url: {
            success:
              successUrl,

            failure:
              failureUrl,

            cancel:
              cancelUrl,

            notification:
              process.env
                .TAMARA_WEBHOOK_URL ||
              "https://api.vkposme.tech/api/v1/payments/tamara/webhook",
          },

          platform:
            "MyShops",

          is_mobile:
            false,
        };

      const tamaraResponse =
        await tamaraService.createCheckoutSession(
          checkoutPayload
        );

      const tamaraOrderId =
        tamaraResponse?.order_id;

      const checkoutId =
        tamaraResponse?.checkout_id;

      const checkoutUrl =
        tamaraResponse?.checkout_url;

      const tamaraStatus =
        normalizeStatus(
          tamaraResponse?.status ||
            "new"
        );

      if (
        !tamaraOrderId ||
        !checkoutId ||
        !checkoutUrl
      ) {
        console.error(
          "[Tamara] Invalid checkout response",
          tamaraResponse
        );

        return res
          .status(502)
          .json({
            success:
              false,

            message:
              "Tamara did not return a valid checkout session",

            tamara:
              tamaraResponse,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Save Tamara references
      |--------------------------------------------------------------------------
      */

      const paymentUpdate =
        {};

      setIfExists(
        OrderPayment,
        paymentUpdate,
        "provider",
        "TAMARA"
      );

      setIfExists(
        OrderPayment,
        paymentUpdate,
        "providerReference",
        tamaraOrderId
      );

      if (
        hasAttribute(
          OrderPayment,
          "paymentStatus"
        )
      ) {
        paymentUpdate.paymentStatus =
          "PENDING";
      } else {
        setIfExists(
          OrderPayment,
          paymentUpdate,
          "status",
          "PENDING"
        );
      }

      setIfExists(
        OrderPayment,
        paymentUpdate,
        "providerPayload",
        mergeProviderPayload(
          payment,
          {
            checkoutId,

            checkoutUrl,

            tamaraStatus,

            checkoutResponse:
              tamaraResponse,

            /*
             * Keep the exact Tamara checkout request.
             * We reuse its validated item/tax/shipping
             * breakdown for immediate capture.
             */
            checkoutRequest:
              checkoutPayload,

            checkoutCreatedAt:
              new Date().toISOString(),
          }
        )
      );

      await payment.update(
        paymentUpdate
      );

      return res.json({
        success: true,

        orderId:
          order.id,

        tamaraOrderId,

        checkoutId,

        checkoutUrl,

        status:
          tamaraStatus,
      });
    } catch (error) {
      console.error(
        "[Tamara checkout]",
        error
      );

      return res
        .status(
          error.status ||
            500
        )
        .json({
          success:
            false,

          message:
            error.message,

          tamara:
            error.tamaraResponse ||
            undefined,
        });
    }
  };


/*
|--------------------------------------------------------------------------
| POST /refund
|--------------------------------------------------------------------------
|
| Admin-only Tamara refund.
|
| Request:
|
| {
|   orderId: "MYSHOPS-ORDER-UUID",
|   amount: 100,
|   comment: "Customer returned item"
| }
|--------------------------------------------------------------------------
*/

exports.refund =
  async (req, res) => {
    try {
      const {
        orderId,
        amount,
        comment,
      } = req.body || {};

      /*
      |--------------------------------------------------------------------------
      | Validate request
      |--------------------------------------------------------------------------
      */

      if (!orderId) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "orderId is required",
          });
      }

      const normalizedOrderId =
        String(
          orderId
        )
          .split(",")[0]
          .trim();

      const refundAmount =
        Number(
          Number(
            amount
          ).toFixed(
            2
          )
        );

      if (
        !Number.isFinite(
          refundAmount
        ) ||
        refundAmount <= 0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "A valid refund amount is required",
          });
      }

      const refundComment =
        String(
          comment || ""
        ).trim();

      if (!refundComment) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Refund reason is required",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Find MyShops order
      |--------------------------------------------------------------------------
      */

      const order =
        await Order.findByPk(
          normalizedOrderId
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "MyShops order was not found",
          });
      }

      if (
        String(
          order.paymentMethod ||
            ""
        ).toUpperCase() !==
        "TAMARA"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "This is not a Tamara order",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Find Tamara payment
      |--------------------------------------------------------------------------
      */

      const payment =
        await findTamaraPayment({
          orderId:
            order.id,
        });

      if (!payment) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Tamara payment record was not found",
          });
      }

      if (
        !payment.providerReference
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "Tamara order ID is missing",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Fetch authoritative Tamara order
      |--------------------------------------------------------------------------
      */

      const tamaraOrder =
        await tamaraService
          .getOrderDetails(
            payment.providerReference
          );

      const currentTamaraStatus =
        normalizeStatus(
          getValue(
            tamaraOrder,
            [
              "status",
              "order_status",
            ],
            ""
          )
        );

      if (
        currentTamaraStatus ===
          "fully_refunded" ||
        currentTamaraStatus ===
          "refunded"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "This Tamara order has already been fully refunded",
          });
      }

      /*
       * Because MyShops captures immediately,
       * normally we expect fully_captured.
       *
       * partially_refunded is also valid because
       * another partial refund can follow.
       */
      const refundableStatuses =
        new Set([
          "captured",
          "fully_captured",
          "partially_captured",
          "partially_refunded",
        ]);

      if (
        !refundableStatuses.has(
          currentTamaraStatus
        )
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              `Tamara order cannot be refunded while status is ${currentTamaraStatus}`,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Calculate local refundable balance
      |--------------------------------------------------------------------------
      */

      const orderTotal =
        Number(
          Number(
            order.grandTotal ||
              0
          ).toFixed(
            2
          )
        );

      const providerPayload =
        payment.providerPayload &&
        typeof payment.providerPayload ===
          "object"
          ? payment.providerPayload
          : {};

      const existingRefunds =
        Array.isArray(
          providerPayload.refunds
        )
          ? providerPayload.refunds
          : [];

      const alreadyRefunded =
        Number(
          existingRefunds
            .filter(
              (refund) =>
                refund &&
                refund.accepted ===
                  true
            )
            .reduce(
              (
                total,
                refund
              ) =>
                total +
                Number(
                  refund.amount ||
                    0
                ),
              0
            )
            .toFixed(
              2
            )
        );

      const refundableBalance =
        Number(
          Math.max(
            0,
            orderTotal -
              alreadyRefunded
          ).toFixed(
            2
          )
        );

      if (
        refundAmount >
        refundableBalance
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              `Refund amount cannot exceed refundable balance of ${refundableBalance} ${
                order.currencyCode ||
                "AED"
              }`,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Send refund to Tamara
      |--------------------------------------------------------------------------
      */

      const merchantRefundId =
        crypto.randomUUID();

      const currency =
        String(
          order.currencyCode ||
            "AED"
        ).toUpperCase();

      console.log(
        "[Tamara refund request]",
        {
          myshopsOrderId:
            order.id,

          tamaraOrderId:
            payment.providerReference,

          merchantRefundId,

          amount:
            refundAmount,

          currency,
        }
      );

      const refundResponse =
        await tamaraService
          .refundOrder({
            tamaraOrderId:
              payment.providerReference,

            amount:
              refundAmount,

            currency,

            comment:
              refundComment,

            merchantRefundId,
          });

      /*
      |--------------------------------------------------------------------------
      | Store refund audit in OrderPayment
      |--------------------------------------------------------------------------
      */

      await payment.reload();

      const latestPayload =
        payment.providerPayload &&
        typeof payment.providerPayload ===
          "object"
          ? {
              ...payment.providerPayload,
            }
          : {};

      const latestRefunds =
        Array.isArray(
          latestPayload.refunds
        )
          ? latestPayload.refunds
          : [];

      await payment.update({
        providerPayload: {
          ...latestPayload,

          refunds: [
            ...latestRefunds,

            {
              merchantRefundId,

              amount:
                refundAmount,

              currency,

              comment:
                refundComment,

              accepted:
                true,

              response:
                refundResponse,

              acceptedAt:
                new Date()
                  .toISOString(),
            },
          ],

          lastRefund:
            refundResponse,

          lastRefundAt:
            new Date()
              .toISOString(),
        },
      });

      /*
      |--------------------------------------------------------------------------
      | Reconcile immediately
      |--------------------------------------------------------------------------
      */

      const updatedTamaraOrder =
        await tamaraService
          .getOrderDetails(
            payment.providerReference
          );

      const updatedTamaraStatus =
        getValue(
          updatedTamaraOrder,
          [
            "status",
            "order_status",
          ],
          currentTamaraStatus
        );

      const mapped =
        await applyTamaraStatus({
          order,
          payment,

          tamaraStatus:
            updatedTamaraStatus,

          payloadPatch: {
            lastRefundResponse:
              refundResponse,

            lastRefundReconcile:
              updatedTamaraOrder,

            lastRefundReconcileAt:
              new Date()
                .toISOString(),
          },
        });

      console.log(
        "[Tamara refund processed]",
        {
          myshopsOrderId:
            order.id,

          tamaraOrderId:
            payment.providerReference,

          merchantRefundId,

          refundAmount,

          tamaraStatus:
            mapped.tamaraStatus,

          paymentStatus:
            mapped.paymentStatus,

          orderStatus:
            mapped.orderStatus,
        }
      );

      return res.json({
        success:
          true,

        orderId:
          order.id,

        tamaraOrderId:
          payment.providerReference,

        merchantRefundId,

        refundedAmount:
          refundAmount,

        refundableBalance:
          Number(
            Math.max(
              0,
              refundableBalance -
                refundAmount
            ).toFixed(
              2
            )
          ),

        currency,

        tamaraStatus:
          mapped.tamaraStatus,

        paymentStatus:
          mapped.paymentStatus,

        orderStatus:
          mapped.orderStatus,

        refund:
          refundResponse,

        tamaraOrder:
          updatedTamaraOrder,
      });
    } catch (error) {
      console.error(
        "[Tamara refund error]",
        error
      );

      return res
        .status(
          error.status ||
            500
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to refund Tamara payment",

          tamara:
            error.tamaraResponse ||
            undefined,
        });
    }
  };



/*
|--------------------------------------------------------------------------
| Queue Order Confirmation Email
|--------------------------------------------------------------------------
*/

const queueTamaraOrderConfirmation =
  async ({
    order,
    mapped,
    source,
  }) => {
    const paymentStatus =
      String(
        mapped?.paymentStatus ||
        order?.paymentStatus ||
        ""
      ).trim().toUpperCase();

    const orderStatus =
      String(
        mapped?.orderStatus ||
        getCurrentOrderStatus(order) ||
        ""
      ).trim().toUpperCase();

    if (
      paymentStatus !== "PAID" ||
      orderStatus !== "CONFIRMED"
    ) {
      return {
        queued: false,
        reason: "ORDER_NOT_PAID_CONFIRMED",
      };
    }

    try {
      const result =
        await queueOrderNotification({
          companyId: order.companyId,
          orderId: order.id,
          notificationType: "ORDER_CONFIRMED",
        });

      console.log(
        "[Tamara] Order confirmation email queued",
        {
          source: source || null,
          orderId: order.id,
          orderNumber: getOrderNumber(order),
          queued: result?.queued === true,
          created: result?.created === true,
          queueId: result?.queueId || null,
          status: result?.status || null,
        }
      );

      return result;
    } catch (error) {
      console.error(
        "[Tamara] Order confirmation email queue failed",
        {
          source: source || null,
          orderId: order.id,
          orderNumber: getOrderNumber(order),
          error: error?.message || String(error),
        }
      );

      return {
        queued: false,
        reason: "QUEUE_ERROR",
      };
    }
  };

/*
|--------------------------------------------------------------------------
| Reconciliation Core
|--------------------------------------------------------------------------
*/

const reconcileTamaraOrder =
  async ({
    order,
    payment,
  }) => {
    const tamaraOrder =
      await tamaraService.getOrderDetails(
        payment.providerReference
      );

    const tamaraStatus =
      getValue(
        tamaraOrder,
        [
          "status",
          "order_status",
        ],
        "new"
      );

    const mapped =
      await applyTamaraStatus(
        {
          order,
          payment,
          tamaraStatus,

          payloadPatch: {
            lastReconcile:
              tamaraOrder,

            lastReconcileAt:
              new Date().toISOString(),
          },
        }
      );

    return {
      tamaraOrder,
      mapped,
    };
  };

/*
|--------------------------------------------------------------------------
| POST /public/reconcile
|--------------------------------------------------------------------------
|
| Called by the Tamara success/failure/cancel return pages.
|--------------------------------------------------------------------------
*/

exports.reconcile =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | 1. Read MyShops order ID
      |--------------------------------------------------------------------------
      */

      const {
        orderId,
      } = req.body || {};

      if (!orderId) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "orderId is required",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | 2. Normalize order ID
      |--------------------------------------------------------------------------
      |
      | New storefront sends only the MyShops order ID.
      |
      | split(",")[0] is kept as a defensive fallback for older
      | Tamara checkout sessions which may contain duplicate
      | orderId query parameters.
      |--------------------------------------------------------------------------
      */

      const normalizedOrderId =
        String(orderId)
          .split(",")[0]
          .trim();

      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (
        !UUID_REGEX.test(
          normalizedOrderId
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid MyShops orderId",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | 3. Find MyShops order
      |--------------------------------------------------------------------------
      */

      const order =
        await Order.findByPk(
          normalizedOrderId
        );

      if (!order) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Order not found",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | 4. Find Tamara OrderPayment
      |--------------------------------------------------------------------------
      */

      const payment =
        await findTamaraPayment(
          {
            orderId:
              normalizedOrderId,
          }
        );

      if (!payment) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Tamara payment record not found",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | 5. Make sure checkout exists
      |--------------------------------------------------------------------------
      */

      if (
        !payment.providerReference
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "Tamara checkout has not been created for this order",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | 6. Re-fetch authoritative Tamara order
      |--------------------------------------------------------------------------
      |
      | providerReference contains Tamara order_id.
      |--------------------------------------------------------------------------
      */

      const {
        tamaraOrder,
        mapped,
      } =
        await reconcileTamaraOrder(
          {
            order,
            payment,
          }
        );

      await order.reload();
      await payment.reload();

      await queueTamaraOrderConfirmation({
        order,
        mapped,
        source: "RECONCILE",
      });

      /*
      |--------------------------------------------------------------------------
      | 7. Return authoritative result
      |--------------------------------------------------------------------------
      */

      console.log(
        "[Tamara reconcile processed]",
        {
          myshopsOrderId:
            order.id,

          tamaraOrderId:
            payment.providerReference,

          tamaraStatus:
            mapped.tamaraStatus,

          paymentStatus:
            mapped.paymentStatus,

          orderStatus:
            mapped.orderStatus,

          successfulCheckout:
            mapped.successfulCheckout,
        }
      );

      return res.json({
        success:
          true,

        orderId:
          order.id,

        tamaraOrderId:
          payment.providerReference,

        tamaraStatus:
          mapped.tamaraStatus,

        paymentStatus:
          mapped.paymentStatus,

        orderStatus:
          mapped.orderStatus,

        successfulCheckout:
          mapped.successfulCheckout,

        data:
          tamaraOrder,
      });
    } catch (error) {
      console.error(
        "[Tamara reconcile]",
        error
      );

      return res
        .status(
          error.status ||
            500
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to reconcile Tamara payment",
        });
    }
  };


/*
|--------------------------------------------------------------------------
| Tamara Capture Helpers
|--------------------------------------------------------------------------
|
| MyShops business rule:
| Once Tamara reaches AUTHORISED, immediately request a FULL capture.
|--------------------------------------------------------------------------
*/

const getTamaraWebhookEventType =
  (body) => {
    if (!body) {
      return null;
    }

    return (
      body.event_type ||
      body.eventType ||
      body.event ||
      body.type ||
      null
    );
  };

const createWebhookLog =
  async ({
    body,
    tamaraOrderId = null,
  }) => {
    return PaymentWebhookLog.create({
      provider: "TAMARA",
      providerReference:
        tamaraOrderId,
      eventType:
        getTamaraWebhookEventType(
          body
        ),
      providerStatus:
        getValue(
          body,
          [
            "status",
            "order_status",
          ],
          null
        ),
      processingStatus:
        "RECEIVED",
      payload:
        body || {},
      responseStatus:
        null,
      errorMessage:
        null,
      receivedAt:
        new Date(),
      processedAt:
        null,
    });
  };

const updateWebhookLog =
  async (
    webhookLog,
    values
  ) => {
    if (!webhookLog) {
      return;
    }

    await webhookLog.update(
      values
    );
  };

const buildTamaraShippingInfo =
  (order) => ({
    shipping_company:
      "MyShops",

    tracking_number:
      String(
        getValue(
          order,
          [
            "orderNumber",
            "orderNo",
            "orderCode",
            "id",
          ],
          order.id
        )
      ),

    tracking_url:
      process.env
        .TAMARA_TRACKING_URL ||
      `https://vkposme.tech/account/orders/${encodeURIComponent(
        order.id
      )}`,
  });

const buildImmediateCapturePayload =
  ({
    order,
    payment,
  }) => {
    if (
      !payment?.providerReference
    ) {
      throw new Error(
        "Tamara providerReference is missing"
      );
    }

    const providerPayload =
      getProviderPayload(
        payment
      );

    const checkoutRequest =
      providerPayload
        .checkoutRequest &&
      typeof providerPayload
        .checkoutRequest ===
        "object"
        ? providerPayload
            .checkoutRequest
        : {};

    const currency =
      getOrderCurrency(
        order
      );

    const capturePayload = {
      order_id:
        payment.providerReference,

      total_amount: {
        amount:
          money(
            getOrderTotal(
              order
            )
          ),
        currency,
      },

      shipping_info:
        buildTamaraShippingInfo(
          order
        ),
    };

    if (
      Array.isArray(
        checkoutRequest.items
      ) &&
      checkoutRequest.items.length >
        0
    ) {
      capturePayload.items =
        checkoutRequest.items;
    }

    if (
      checkoutRequest
        .shipping_amount &&
      typeof checkoutRequest
        .shipping_amount ===
        "object"
    ) {
      capturePayload.shipping_amount =
        checkoutRequest
          .shipping_amount;
    }

    if (
      checkoutRequest.tax_amount &&
      typeof checkoutRequest
        .tax_amount ===
        "object"
    ) {
      capturePayload.tax_amount =
        checkoutRequest.tax_amount;
    }

    if (
      checkoutRequest
        .discount?.amount &&
      typeof checkoutRequest
        .discount.amount ===
        "object"
    ) {
      capturePayload.discount_amount =
        checkoutRequest
          .discount.amount;
    }

    return capturePayload;
  };

const markCaptureConfirmed =
  async ({
    payment,
    tamaraStatus,
    tamaraOrder,
  }) => {
    const normalizedStatus =
      normalizeStatus(
        tamaraStatus
      );

    if (
      ![
        "captured",
        "fully_captured",
        "partially_captured",
      ].includes(
        normalizedStatus
      )
    ) {
      return;
    }

    await payment.reload();

    await payment.update({
      providerPayload:
        mergeProviderPayload(
          payment,
          {
            captureInProgress:
              false,

            captureRequestAccepted:
              true,

            captureCompleted:
              normalizedStatus ===
                "captured" ||
              normalizedStatus ===
                "fully_captured",

            captureStatus:
              normalizedStatus,

            captureConfirmedAt:
              new Date()
                .toISOString(),

            captureAuthoritativeResponse:
              tamaraOrder ||
              null,
          }
        ),
    });
  };

const captureTamaraOrderImmediately =
  async ({
    order,
    payment,
    tamaraStatus,
  }) => {
    const normalizedStatus =
      normalizeStatus(
        tamaraStatus
      );

    if (
      normalizedStatus !==
        "authorised" &&
      normalizedStatus !==
        "authorized"
    ) {
      return {
        attempted: false,
        reason:
          "NOT_AUTHORISED",
      };
    }

    await payment.reload();

    const currentPayload =
      getProviderPayload(
        payment
      );

    if (
      currentPayload
        .captureCompleted ===
        true
    ) {
      return {
        attempted: false,
        reason:
          "ALREADY_CAPTURED",
      };
    }

    if (
      currentPayload
        .captureRequestAccepted ===
        true
    ) {
      return {
        attempted: false,
        reason:
          "CAPTURE_ALREADY_ACCEPTED",
      };
    }

    if (
      currentPayload
        .captureInProgress ===
        true
    ) {
      const startedAt =
        Date.parse(
          currentPayload
            .captureInProgressAt ||
          ""
        );

      if (
        Number.isFinite(
          startedAt
        ) &&
        Date.now() -
          startedAt <
          2 * 60 * 1000
      ) {
        return {
          attempted: false,
          reason:
            "CAPTURE_ALREADY_IN_PROGRESS",
        };
      }
    }

    const capturePayload =
      buildImmediateCapturePayload(
        {
          order,
          payment,
        }
      );

    await payment.update({
      providerPayload:
        mergeProviderPayload(
          payment,
          {
            captureInProgress:
              true,

            captureInProgressAt:
              new Date()
                .toISOString(),

            captureRequestedAt:
              new Date()
                .toISOString(),

            captureRequest:
              capturePayload,

            captureError:
              null,
          }
        ),
    });

    try {
      console.log(
        "[Tamara capture request]",
        {
          myshopsOrderId:
            order.id,
          tamaraOrderId:
            payment
              .providerReference,
          amount:
            capturePayload
              .total_amount
              .amount,
          currency:
            capturePayload
              .total_amount
              .currency,
        }
      );

      const captureResponse =
        await tamaraService
          .captureOrder(
            capturePayload
          );

      await payment.reload();

      await payment.update({
        providerPayload:
          mergeProviderPayload(
            payment,
            {
              captureInProgress:
                false,

              captureRequestAccepted:
                true,

              captureCompleted:
                false,

              captureResponse,

              captureAcceptedAt:
                new Date()
                  .toISOString(),
            }
          ),
      });

      console.log(
        "[Tamara capture accepted]",
        {
          myshopsOrderId:
            order.id,
          tamaraOrderId:
            payment
              .providerReference,
        }
      );

      /*
       * Immediately re-fetch Tamara so MyShops can move
       * AUTHORIZED -> PAID without waiting for the next webhook.
       */
      const tamaraOrder =
        await tamaraService
          .getOrderDetails(
            payment
              .providerReference
          );

      const postCaptureStatus =
        getValue(
          tamaraOrder,
          [
            "status",
            "order_status",
          ],
          "authorised"
        );

      const mapped =
        await applyTamaraStatus(
          {
            order,
            payment,
            tamaraStatus:
              postCaptureStatus,

            payloadPatch: {
              lastCaptureReconcile:
                tamaraOrder,

              lastCaptureReconcileAt:
                new Date()
                  .toISOString(),
            },
          }
        );

      await markCaptureConfirmed({
        payment,
        tamaraStatus:
          mapped.tamaraStatus,
        tamaraOrder,
      });

      return {
        attempted: true,
        success: true,
        response:
          captureResponse,
        tamaraOrder,
        mapped,
      };
    } catch (error) {
      await payment.reload();

      await payment.update({
        providerPayload:
          mergeProviderPayload(
            payment,
            {
              captureInProgress:
                false,

              captureRequestAccepted:
                false,

              captureCompleted:
                false,

              captureError: {
                message:
                  error.message,

                tamaraResponse:
                  error
                    .tamaraResponse ||
                  null,

                occurredAt:
                  new Date()
                    .toISOString(),
              },
            }
          ),
      });

      console.error(
        "[Tamara capture error]",
        error
      );

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| POST /webhook
|--------------------------------------------------------------------------
|
| No customer authentication middleware here.
| Authentication comes from Tamara tamaraToken JWT.
|--------------------------------------------------------------------------
*/

exports.webhook =
  async (req, res) => {
    let webhookLog =
      null;

    try {
      const token =
        tamaraService
          .extractWebhookToken(
            req
          );

      tamaraService
        .verifyWebhookToken(
          token
        );

      const body =
        req.body || {};

      const tamaraOrderId =
        getValue(
          body,
          [
            "order_id",
            "orderId",
          ],
          null
        );

      webhookLog =
        await createWebhookLog({
          body,
          tamaraOrderId,
        });

      if (!tamaraOrderId) {
        await updateWebhookLog(
          webhookLog,
          {
            processingStatus:
              "FAILED",
            responseStatus:
              400,
            errorMessage:
              "Tamara order_id is missing",
            processedAt:
              new Date(),
          }
        );

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Tamara order_id is missing",
          });
      }

      const payment =
        await findTamaraPayment(
          {
            tamaraOrderId,
          }
        );

      if (!payment) {
        console.error(
          "[Tamara webhook] Unknown Tamara order",
          tamaraOrderId
        );

        await updateWebhookLog(
          webhookLog,
          {
            providerReference:
              tamaraOrderId,
            processingStatus:
              "IGNORED",
            responseStatus:
              200,
            errorMessage:
              "Tamara payment was not found",
            processedAt:
              new Date(),
          }
        );

        return res.json({
          success: true,
          ignored: true,
          message:
            "Tamara payment was not found",
        });
      }

      const order =
        await Order.findByPk(
          payment.orderId
        );

      if (!order) {
        await updateWebhookLog(
          webhookLog,
          {
            orderPaymentId:
              payment.id,
            providerReference:
              tamaraOrderId,
            processingStatus:
              "FAILED",
            responseStatus:
              404,
            errorMessage:
              "MyShops order was not found",
            processedAt:
              new Date(),
          }
        );

        return res
          .status(404)
          .json({
            success: false,
            message:
              "MyShops order was not found",
          });
      }

      await updateWebhookLog(
        webhookLog,
        {
          companyId:
            order.companyId ||
            null,
          orderId:
            order.id,
          orderPaymentId:
            payment.id,
          providerReference:
            tamaraOrderId,
        }
      );

      const webhookStatus =
        getValue(
          body,
          [
            "status",
            "order_status",
          ],
          null
        );

      const tamaraOrder =
        await tamaraService
          .getOrderDetails(
            tamaraOrderId
          );

      const authoritativeStatus =
        getValue(
          tamaraOrder,
          [
            "status",
            "order_status",
          ],
          webhookStatus ||
            "new"
        );

      let mapped =
        await applyTamaraStatus(
          {
            order,
            payment,

            tamaraStatus:
              authoritativeStatus,

            payloadPatch: {
              lastWebhook:
                body,

              lastWebhookAt:
                new Date()
                  .toISOString(),

              lastWebhookEvent:
                getTamaraWebhookEventType(
                  body
                ),

              lastWebhookAuthoritativeResponse:
                tamaraOrder,
            },
          }
        );

      let captureResult =
        null;

      if (
        mapped.tamaraStatus ===
          "authorised" ||
        mapped.tamaraStatus ===
          "authorized"
      ) {
        try {
          captureResult =
            await captureTamaraOrderImmediately(
              {
                order,
                payment,
                tamaraStatus:
                  mapped.tamaraStatus,
              }
            );

          if (
            captureResult?.mapped
          ) {
            mapped =
              captureResult
                .mapped;
          }
        } catch (
          captureError
        ) {
          console.error(
            "[Tamara immediate capture failed]",
            captureError
          );

          captureResult = {
            attempted: true,
            success: false,
            message:
              captureError.message,
          };
        }
      } else {
        await markCaptureConfirmed({
          payment,
          tamaraStatus:
            mapped.tamaraStatus,
          tamaraOrder,
        });
      }

      await order.reload();
      await payment.reload();

      await queueTamaraOrderConfirmation({
        order,
        mapped,
        source: "WEBHOOK",
      });

      await updateWebhookLog(
        webhookLog,
        {
          eventType:
            getTamaraWebhookEventType(
              body
            ),

          providerStatus:
            mapped.tamaraStatus,

          processingStatus:
            "PROCESSED",

          responseStatus:
            200,

          errorMessage:
            captureResult?.success ===
              false
              ? `Authorised successfully; immediate capture failed: ${captureResult.message}`
              : null,

          processedAt:
            new Date(),
        }
      );

      console.log(
        "[Tamara webhook processed]",
        {
          webhookLogId:
            webhookLog.id,
          tamaraOrderId,
          eventType:
            getTamaraWebhookEventType(
              body
            ),
          tamaraStatus:
            mapped.tamaraStatus,
          myshopsOrderId:
            order.id,
          paymentStatus:
            mapped.paymentStatus,
          orderStatus:
            mapped.orderStatus,
          captureResult:
            captureResult
              ? {
                  attempted:
                    captureResult
                      .attempted,
                  success:
                    captureResult
                      .success,
                  reason:
                    captureResult
                      .reason,
                }
              : null,
        }
      );

      return res.json({
        success: true,
        webhookLogId:
          webhookLog.id,
        tamaraOrderId,
        tamaraStatus:
          mapped.tamaraStatus,
        paymentStatus:
          mapped.paymentStatus,
        orderStatus:
          mapped.orderStatus,
        capture:
          captureResult
            ? {
                attempted:
                  captureResult
                    .attempted,
                success:
                  captureResult
                    .success,
                reason:
                  captureResult
                    .reason,
              }
            : null,
      });
    } catch (error) {
      console.error(
        "[Tamara webhook error]",
        error
      );

      if (webhookLog) {
        try {
          await updateWebhookLog(
            webhookLog,
            {
              processingStatus:
                "FAILED",
              responseStatus:
                error.status ||
                500,
              errorMessage:
                error.message ||
                "Tamara webhook processing failed",
              processedAt:
                new Date(),
            }
          );
        } catch (
          logError
        ) {
          console.error(
            "[Tamara webhook log update error]",
            logError
          );
        }
      }

      return res
        .status(
          error.status ||
            500
        )
        .json({
          success: false,
          message:
            error.message ||
            "Tamara webhook processing failed",
        });
    }
  };
