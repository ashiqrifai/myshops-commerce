const db =
  require(
    "../../models"
  );

const {
  Op,
} = require(
  "sequelize"
);

const AppError =
  require(
    "../../utils/AppError"
  );

const {
  createPublicOrder,
} = require(
  "../../services/publicOrderService"
);

const {
  queueOrderNotification,
} = require(
  "../../services/emailNotificationQueue.service"
);


const getProductAvailability =
  async ({
    device,
    location,
    variantId,
  }) => {

    const safeVariantId =
      String(
        variantId ||
        ""
      ).trim();

    if (!safeVariantId) {
      throw new AppError(
        "Product variant ID is required.",
        400,
        "KIOSK_VARIANT_ID_REQUIRED"
      );
    }

    /*
     * Load the selected variant and its product flags.
     */
    const variant =
      await db.ProductVariant.findOne({
        where: {
          id:
            safeVariantId,

          companyId:
            device.companyId,
        },

        include: [
          {
            model:
              db.Product,

            as:
              "product",

            required:
              true,
          },
        ],
      });

    if (!variant) {
      throw new AppError(
        "Product variant was not found.",
        404,
        "KIOSK_VARIANT_NOT_FOUND"
      );
    }

    const product =
      variant.product;

    /*
     * Available = on hand - reserved.
     *
     * The kiosk's own location is evaluated separately
     * from the rest of the MyShops inventory network.
     */
    const balances =
      await db.InventoryBalance.findAll({
        where: {
          companyId:
            device.companyId,

          productVariantId:
            variant.id,
        },

        attributes: [
          "inventoryLocationId",
          "quantityOnHand",
          "quantityReserved",
        ],

        raw:
          true,
      });

    let localAvailable =
      0;

    let networkAvailable =
      0;

    let otherLocationAvailable =
      0;

    for (const balance of balances) {

      const available =
        Math.max(
          0,
          Number(
            balance.quantityOnHand ||
            0
          ) -
          Number(
            balance.quantityReserved ||
            0
          )
        );

      networkAvailable +=
        available;

      if (
        String(
          balance.inventoryLocationId
        ) ===
        String(
          location.id
        )
      ) {
        localAvailable +=
          available;
      } else {
        otherLocationAvailable +=
          available;
      }
    }

    const isDirectDelivery =
      product
        ?.isDirectDelivery ===
      true;

    const alwaysAvailableForSale =
      product
        ?.alwaysAvailableForSale ===
      true;

    let status;
    let message;

    /*
     * Local stock has first priority.
     */
    if (
      localAvailable >
      0
    ) {

      status =
        "IN_STOCK";

      message =
        "In Stock";

    } else if (
      isDirectDelivery
    ) {

      status =
        "AVAILABLE_FOR_DELIVERY";

      message =
        "Available for Delivery";

    } else if (
      otherLocationAvailable >
      0
    ) {

      status =
        "AVAILABLE_FOR_DELIVERY";

      message =
        "Available for Delivery";

    } else if (
      alwaysAvailableForSale
    ) {

      status =
        "AVAILABLE_TO_ORDER";

      message =
        "Available to Order";

    } else {

      status =
        "OUT_OF_STOCK";

      message =
        "Out of Stock";
    }

    return {
      variantId:
        variant.id,

      sku:
        variant.sku ||
        null,

      status,

      message,

      canOrder:
        status !==
        "OUT_OF_STOCK",

      localAvailable,

      otherLocationAvailable,

      networkAvailable,

      sourceSelectionRequired:
        status ===
        "AVAILABLE_FOR_DELIVERY" &&
        !isDirectDelivery,

      isDirectDelivery,

      alwaysAvailableForSale,

      sellingLocation: {
        id:
          location.id,

        code:
          location.code,

        name:
          location.name,
      },
    };
  };



const createCheckout =
  async ({
    device,
    profile,
    location,
    payload,
  }) => {

    if (
      !device ||
      !profile ||
      !location
    ) {

      throw new AppError(
        "Kiosk checkout context is incomplete.",
        500,
        "KIOSK_CHECKOUT_CONTEXT_MISSING"
      );
    }


    if (
      String(
        device.companyId
      ) !==
      String(
        location.companyId
      )
    ) {

      throw new AppError(
        "Kiosk device and inventory location do not belong to the same company.",
        409,
        "KIOSK_LOCATION_COMPANY_MISMATCH"
      );
    }


    const fulfilmentMode =
      String(
        payload
          ?.fulfillmentMode ||
        "IN_STORE"
      )
        .trim()
        .toUpperCase();


    if (
      ![
        "IN_STORE",
        "DELIVERY",
        "MIXED",
      ].includes(
        fulfilmentMode
      )
    ) {

      throw new AppError(
        "Invalid kiosk fulfillment mode.",
        400,
        "INVALID_KIOSK_FULFILLMENT_MODE"
      );
    }


    const items =
      Array.isArray(
        payload
          ?.items
      )
        ? payload.items
        : [];


    /*
     * Translate kiosk fulfilment into the existing
     * authoritative order fulfilment structure.
     *
     * IN_STORE:
     *   Every item is pickup from THIS kiosk's store.
     *
     * DELIVERY:
     *   Every item is delivered.
     *
     * MIXED:
     *   Each cart line must explicitly state whether
     *   it is PICKUP or DELIVERY.
     */
    let fulfilmentLines;


      if (
        fulfilmentMode ===
        "IN_STORE"
      ) {

        /*
         * KIOSK IN-STORE AVAILABILITY
         *
         * Enough stock at this kiosk location:
         *   PICKUP / IN STOCK.
         *
         * Not enough local stock:
         *   AVAILABLE TO ORDER.
         *
         * The existing delivery planner will then evaluate
         * stock at other eligible locations, direct delivery,
         * and alwaysAvailableForSale.
         */
        fulfilmentLines =
          await Promise.all(
            items.map(
              async item => {

                const requestedQuantity =
                  Number(
                    item.quantity ||
                    0
                  );

                const balance =
                  await db.InventoryBalance.findOne({
                    where: {
                      companyId:
                        device.companyId,

                      productVariantId:
                        item.productVariantId,

                      inventoryLocationId:
                        location.id,
                    },

                    attributes: [
                      "quantityOnHand",
                      "quantityReserved",
                    ],

                    raw:
                      true,
                  });

                const quantityOnHand =
                  Number(
                    balance?.quantityOnHand ||
                    0
                  );

                const quantityReserved =
                  Number(
                    balance?.quantityReserved ||
                    0
                  );

                const available =
                  Math.max(
                    0,
                    quantityOnHand -
                    quantityReserved
                  );

                const localPickup =
                  requestedQuantity > 0 &&
                  available >=
                    requestedQuantity;

                console.log(
                  `[KIOSK AVAILABILITY] variant=${item.productVariantId} location=${location.code} requested=${requestedQuantity} available=${available} mode=${localPickup ? "PICKUP" : "AVAILABLE_TO_ORDER"}`
                );

                return {
                  productId:
                    item.productId,

                  variantId:
                    item.productVariantId,

                  fulfilmentMethod:
                    localPickup
                      ? "PICKUP"
                      : "DELIVERY",

                  pickupLocationId:
                    localPickup
                      ? location.id
                      : null,
                };
              }
            )
          );
    } else if (
      fulfilmentMode ===
      "DELIVERY"
    ) {

      fulfilmentLines =
        items.map(
          item => ({
            productId:
              item.productId,

            variantId:
              item.productVariantId,

            fulfilmentMethod:
              "DELIVERY",

            pickupLocationId:
              null,
          })
        );

    } else {

      const requestedLines =
        Array.isArray(
          payload
            ?.fulfilmentLines
        )
          ? payload.fulfilmentLines
          : [];


      if (
        requestedLines.length !==
        items.length
      ) {

        throw new AppError(
          "Mixed kiosk checkout requires a fulfilment selection for every cart item.",
          400,
          "KIOSK_MIXED_FULFILLMENT_INCOMPLETE"
        );
      }


      fulfilmentLines =
        items.map(
          item => {

            const selected =
              requestedLines.find(
                line =>
                  String(
                    line
                      ?.productId ||
                    ""
                  ) ===
                    String(
                      item.productId
                    ) &&
                  String(
                    line
                      ?.productVariantId ||
                    line
                      ?.variantId ||
                    ""
                  ) ===
                    String(
                      item.productVariantId
                    )
              );


            if (
              !selected
            ) {

              throw new AppError(
                "Mixed kiosk checkout is missing a fulfilment selection.",
                400,
                "KIOSK_MIXED_FULFILLMENT_INCOMPLETE"
              );
            }


            const method =
              String(
                selected
                  ?.fulfilmentMethod ||
                ""
              )
                .trim()
                .toUpperCase();


            if (
              ![
                "PICKUP",
                "DELIVERY",
              ].includes(
                method
              )
            ) {

              throw new AppError(
                "Mixed kiosk items must use PICKUP or DELIVERY.",
                400,
                "INVALID_KIOSK_ITEM_FULFILLMENT"
              );
            }


            return {
              productId:
                item.productId,

              variantId:
                item.productVariantId,

              fulfilmentMethod:
                method,

              /*
               * A kiosk pickup always means collection
               * from the store where this kiosk lives.
               * Ignore any location sent by Android.
               */
              pickupLocationId:
                method ===
                  "PICKUP"
                  ? location.id
                  : null,
            };
          }
        );
    }


    /*
     * Kiosk card checkout always uses AFS.
     *
     * The client is not allowed to choose another
     * payment provider for this endpoint.
     */
    const hasAvailableToOrderLines =
      fulfilmentMode ===
        "IN_STORE" &&
      fulfilmentLines.some(
        line =>
          line.fulfilmentMethod ===
          "DELIVERY"
      );

    const checkoutPayload = {
      ...payload,

      /*
       * Internal server-side flag.
       *
       * This is generated by the authenticated kiosk backend,
       * not trusted from Android.
       */
      kioskAvailableToOrder:
        hasAvailableToOrderLines,

      /*
       * Kiosk AVAILABLE_TO_ORDER:
       *
       * This is still an in-store sale, not a customer
       * request for home delivery.
       *
       * publicOrderService requires a city whenever a
       * STANDARD allocation is present, so use Dubai as
       * the internal allocation city for this Dubai kiosk.
       */
      shippingAddress:
        hasAvailableToOrderLines
          ? {
              ...(
                payload
                  ?.shippingAddress ||
                {}
              ),

              city:
                payload
                  ?.shippingAddress
                  ?.city ||
                "Dubai",
            }
          : payload
              ?.shippingAddress,

      paymentMethod:
        "CARD",

      fulfilmentLines,

      /*
       * Existing order validation uses deliveryMethod
       * as the fallback when there are no per-line
       * selections.
       */
      deliveryMethod:
        fulfilmentMode ===
          "IN_STORE"
          ? "PICKUP"
          : "STANDARD",
    };


    let kioskOrderId =
      null;


    const order =
      await createPublicOrder({
        payload:
          checkoutPayload,

        authenticatedCustomerId:
          null,

        channelCode:
          "KIOSK",

        orderNumberPrefix:
          "KSK",

        paymentProvider:
          "AFS",

        /*
         * IN_STORE lines without local stock must not
         * automatically reserve another MyShops store.
         */
        deferKioskAvailableToOrder:
          hasAvailableToOrderLines,

        withinTransaction:
          async ({
            transaction,
            company,
            order:
              createdOrder,

            orderLines,
          }) => {

            /*
             * Never trust a location sent by Android.
             *
             * Origin location is derived from:
             *
             * device token
             *   -> KioskDevice
             *   -> KioskProfile
             *   -> InventoryLocation
             */

            if (
              String(
                company.id
              ) !==
              String(
                device.companyId
              )
            ) {

              throw new AppError(
                "Checkout company does not match the authenticated kiosk.",
                409,
                "KIOSK_CHECKOUT_COMPANY_MISMATCH"
              );
            }


            const kioskOrder =
              await db.KioskOrder.create(
                {
                  companyId:
                    company.id,

                  orderId:
                    createdOrder.id,

                  inventoryLocationId:
                    location.id,

                  kioskDeviceId:
                    device.id,

                  kioskProfileId:
                    profile.id,

                  fulfillmentMode:
                    fulfilmentMode,

                  deliveryStatus:
                    fulfilmentMode ===
                      "IN_STORE"
                      ? "NOT_REQUIRED"
                      : "REQUIRED",

                  collectionStatus:
                    fulfilmentMode ===
                      "DELIVERY"
                      ? "NOT_REQUIRED"
                      : "PENDING",

                  notes:
                    payload
                      ?.kioskNotes
                      ? String(
                          payload.kioskNotes
                        ).trim() ||
                        null
                      : null,
                },
                {
                  transaction,
                }
              );


            kioskOrderId =
              kioskOrder.id;

            /*
             * -------------------------------------------------
             * Deferred Store Fulfillment
             * -------------------------------------------------
             *
             * For an IN_STORE kiosk sale where the selling
             * location cannot satisfy the requested quantity,
             * do NOT choose another store automatically.
             *
             * Create an AWAITING_ASSIGNMENT task instead.
             */
            if (
              hasAvailableToOrderLines
            ) {

              const deferredOrderLines =
                orderLines.filter(
                  line =>
                    line.id &&
                    line.selectedDeliveryMethod !==
                      "PICKUP"
                );

              for (
                const orderLine of
                deferredOrderLines
              ) {

                await db.KioskFulfillmentAssignment.create(
                  {
                    companyId:
                      company.id,

                    orderId:
                      createdOrder.id,

                    orderItemId:
                      orderLine.id,

                    sellingLocationId:
                      location.id,

                    fulfillmentLocationId:
                      null,

                    productVariantId:
                      orderLine
                        .productVariantId,

                    sku:
                      orderLine.sku,

                    quantity:
                      orderLine.quantity,

                    status:
                      "AWAITING_ASSIGNMENT",
                  },
                  {
                    transaction,
                  }
                );
              }
            }
          },
      });


    /*
     * createPublicOrder has committed by this point.
     * The base Order + KioskOrder were part of the
     * SAME transaction.
     */

    return {
      ...order,

      kioskOrderId,

      channelCode:
        "KIOSK",

      paymentProvider:
        "AFS",

      originLocation: {
        id:
          location.id,

        code:
          location.code,

        name:
          location.name,

        type:
          location.locationType,

        emirate:
          location.emirate ||
          null,

        city:
          location.city ||
          null,
      },

      kiosk: {
        deviceId:
          device.id,

        deviceCode:
          device.deviceCode,

        deviceName:
          device.deviceName,

        profileId:
          profile.id,

        profileCode:
          profile.code,

        profileName:
          profile.name,
      },
    };
  };



const recordPaymentResult =
  async ({
    device,
    orderId,
    payload,
  }) => {

    const paymentId =
      String(
        payload
          ?.paymentId ||
        ""
      ).trim();


    const result =
      String(
        payload
          ?.result ||
        ""
      )
        .trim()
        .toUpperCase();


    if (
      !orderId ||
      !paymentId
    ) {

      throw new AppError(
        "Order ID and payment ID are required.",
        400,
        "KIOSK_PAYMENT_IDENTIFIERS_REQUIRED"
      );
    }


    if (
      ![
        "APPROVED",
        "DECLINED",
        "CANCELLED",
        "TIMEOUT",
        "ERROR",
      ].includes(
        result
      )
    ) {

      throw new AppError(
        "Invalid AFS payment result.",
        400,
        "INVALID_AFS_PAYMENT_RESULT"
      );
    }


    const paymentResult =
      await db.sequelize.transaction(
      async transaction => {

        const order =
          await db.Order.findOne({
            where: {
              id:
                orderId,

              companyId:
                device.companyId,

              channelCode:
                "KIOSK",
            },

            transaction,

            lock:
              transaction.LOCK.UPDATE,
          });


        if (
          !order
        ) {

          throw new AppError(
            "Kiosk order was not found.",
            404,
            "KIOSK_ORDER_NOT_FOUND"
          );
        }


        const kioskOrder =
          await db.KioskOrder.findOne({
            where: {
              companyId:
                device.companyId,

              orderId:
                order.id,

              kioskDeviceId:
                device.id,
            },

            transaction,

            lock:
              transaction.LOCK.UPDATE,
          });


        if (
          !kioskOrder
        ) {

          throw new AppError(
            "This order does not belong to the authenticated kiosk.",
            403,
            "KIOSK_ORDER_DEVICE_MISMATCH"
          );
        }


        const payment =
          await db.OrderPayment.findOne({
            where: {
              id:
                paymentId,

              companyId:
                device.companyId,

              orderId:
                order.id,

              paymentMethod:
                "CARD",

              provider:
                "AFS",
            },

            transaction,

            lock:
              transaction.LOCK.UPDATE,
          });


        if (
          !payment
        ) {

          throw new AppError(
            "AFS payment record was not found.",
            404,
            "AFS_PAYMENT_NOT_FOUND"
          );
        }


        /*
         * An already-paid transaction is idempotent.
         *
         * Never let a later retry/timeout turn a paid
         * transaction back into FAILED.
         */
        if (
          payment.status ===
          "PAID"
        ) {

          return {
            orderId:
              order.id,

            orderNumber:
              order.orderNumber,

            paymentId:
              payment.id,

            paymentStatus:
              payment.status,

            orderStatus:
              order.orderStatus,

            collectionStatus:
              kioskOrder.collectionStatus,

            deliveryStatus:
              kioskOrder.deliveryStatus,

            alreadyProcessed:
              true,
          };
        }


        const previousPaymentStatus =
          order.paymentStatus;

        const previousOrderStatus =
          order.orderStatus;


        const providerReference =
          String(
            payload
              ?.providerReference ||
            payload
              ?.referenceNumber ||
            ""
          ).trim() ||
          null;


        const providerPayload = {
          result,

          responseCode:
            payload
              ?.responseCode ||
            null,

          responseMessage:
            payload
              ?.responseMessage ||
            null,

          approvalCode:
            payload
              ?.approvalCode ||
            null,

          referenceNumber:
            payload
              ?.referenceNumber ||
            null,

          transactionId:
            payload
              ?.transactionId ||
            null,

          cardScheme:
            payload
              ?.cardScheme ||
            null,

          maskedPan:
            payload
              ?.maskedPan ||
            null,

          receipt:
            payload
              ?.receipt ||
            null,

          rawResponse:
            payload
              ?.rawResponse ||
            null,

          reportedAt:
            new Date()
              .toISOString(),
        };


        if (
          result ===
          "APPROVED"
        ) {

          await payment.update(
            {
              status:
                "PAID",

              providerReference,

              providerPayload,

              paidAt:
                new Date(),
            },
            {
              transaction,
            }
          );


          await order.update(
            {
              paymentStatus:
                "PAID",

              orderStatus:
                "CONFIRMED",
            },
            {
              transaction,
            }
          );


          if (
            kioskOrder.fulfillmentMode ===
            "IN_STORE"
          ) {

            /*
             * IN_STORE describes where the sale originated,
             * not necessarily where the stock is physically
             * available.
             *
             * READY:
             *   Every ordered unit has been allocated from
             *   this kiosk's own inventory location.
             *
             * PENDING:
             *   Stock is coming from another location, or
             *   there is no physical allocation
             *   (for example alwaysAvailableForSale).
             */

            const orderItems =
              await db.OrderItem.findAll({
                where: {
                  companyId:
                    order.companyId,

                  orderId:
                    order.id,
                },

                attributes: [
                  "id",
                  "productVariantId",
                  "quantity",
                ],

                transaction,
              });

            const shipmentItems =
              await db.OrderShipmentItem.findAll({
                where: {
                  companyId:
                    order.companyId,

                  orderItemId: {
                    [Op.in]:
                      orderItems.map(
                        item =>
                          item.id
                      ),
                  },
                },

                attributes: [
                  "id",
                  "orderItemId",
                ],

                transaction,
              });

            const allocations =
              shipmentItems.length
                ? await db.OrderShipmentAllocation.findAll({
                    where: {
                      companyId:
                        order.companyId,

                      orderShipmentItemId: {
                        [Op.in]:
                          shipmentItems.map(
                            item =>
                              item.id
                          ),
                      },
                    },

                    attributes: [
                      "orderShipmentItemId",
                      "inventoryLocationId",
                      "quantityAllocated",
                    ],

                    transaction,
                  })
                : [];

            const shipmentItemById =
              new Map(
                shipmentItems.map(
                  item => [
                    String(
                      item.id
                    ),
                    item,
                  ]
                )
              );

            const localAllocatedByOrderItem =
              new Map();

            for (
              const allocation of
              allocations
            ) {

              const shipmentItem =
                shipmentItemById.get(
                  String(
                    allocation
                      .orderShipmentItemId
                  )
                );

              if (
                !shipmentItem
              ) {
                continue;
              }

              if (
                String(
                  allocation
                    .inventoryLocationId
                ) !==
                String(
                  kioskOrder
                    .inventoryLocationId
                )
              ) {
                continue;
              }

              const key =
                String(
                  shipmentItem
                    .orderItemId
                );

              localAllocatedByOrderItem.set(
                key,
                Number(
                  localAllocatedByOrderItem
                    .get(key) ||
                  0
                ) +
                Number(
                  allocation
                    .quantityAllocated ||
                  0
                )
              );
            }

            const allItemsReadyLocally =
              orderItems.length >
                0 &&
              orderItems.every(
                item => {

                  const required =
                    Number(
                      item.quantity ||
                      0
                    );

                  const allocatedLocally =
                    Number(
                      localAllocatedByOrderItem
                        .get(
                          String(
                            item.id
                          )
                        ) ||
                      0
                    );

                  return (
                    required >
                      0 &&
                    allocatedLocally >=
                      required
                  );
                }
              );

            await kioskOrder.update(
              {
                collectionStatus:
                  allItemsReadyLocally
                    ? "READY"
                    : "PENDING",
              },
              {
                transaction,
              }
            );

            console.log(
              "[KIOSK COLLECTION]",
              {
                orderNumber:
                  order.orderNumber,

                sellingLocationId:
                  kioskOrder
                    .inventoryLocationId,

                collectionStatus:
                  allItemsReadyLocally
                    ? "READY"
                    : "PENDING",

                orderItemCount:
                  orderItems.length,

                allocationCount:
                  allocations.length,
              }
            );

          } else if (
            kioskOrder.fulfillmentMode ===
            "DELIVERY"
          ) {

            await kioskOrder.update(
              {
                collectionStatus:
                  "NOT_REQUIRED",

                deliveryStatus:
                  "REQUIRED",
              },
              {
                transaction,
              }
            );

          } else {

            /*
             * MIXED:
             * at least one item may be collected and
             * at least one may require delivery.
             */
            await kioskOrder.update(
              {
                collectionStatus:
                  "READY",

                deliveryStatus:
                  "REQUIRED",
              },
              {
                transaction,
              }
            );
          }


          await db.OrderStatusHistory.bulkCreate(
            [
              {
                companyId:
                  order.companyId,

                orderId:
                  order.id,

                statusType:
                  "PAYMENT",

                fromStatus:
                  previousPaymentStatus,

                toStatus:
                  "PAID",

                note:
                  providerReference
                    ? `AFS payment approved. Reference: ${providerReference}.`
                    : "AFS payment approved.",
              },

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
                  "CONFIRMED",

                note:
                  "Kiosk order confirmed after AFS payment approval.",
              },
            ],
            {
              transaction,
            }
          );

        } else {

          await payment.update(
            {
              status:
                "FAILED",

              providerReference,

              providerPayload,

              paidAt:
                null,
            },
            {
              transaction,
            }
          );


          await order.update(
            {
              paymentStatus:
                "FAILED",
            },
            {
              transaction,
            }
          );


          await db.OrderStatusHistory.create(
            {
              companyId:
                order.companyId,

              orderId:
                order.id,

              statusType:
                "PAYMENT",

              fromStatus:
                previousPaymentStatus,

              toStatus:
                "FAILED",

              note:
                `AFS payment ${result.toLowerCase()}${
                  payload
                    ?.responseMessage
                    ? `: ${String(
                        payload.responseMessage
                      ).slice(
                        0,
                        300
                      )}`
                    : "."
                }`,
            },
            {
              transaction,
            }
          );
        }


        return {
          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          paymentId:
            payment.id,

          paymentStatus:
            result ===
            "APPROVED"
              ? "PAID"
              : "FAILED",

          orderStatus:
            result ===
            "APPROVED"
              ? "CONFIRMED"
              : order.orderStatus,

          collectionStatus:
            kioskOrder.collectionStatus,

          deliveryStatus:
            kioskOrder.deliveryStatus,

          alreadyProcessed:
            false,
        };
      }
    );
      /*
     * Customer order confirmation.
     *
     * IMPORTANT:
     * The payment/order transaction has already committed
     * before we queue the email.
     */
    if (
      paymentResult
        ?.paymentStatus ===
        "PAID"
    ) {

      try {

        const emailQueueResult =
          await queueOrderNotification({
            companyId:
              device.companyId,

            orderId:
              paymentResult.orderId,

            notificationType:
              "ORDER_CONFIRMED",
          });

        console.log(
          "Kiosk order confirmation email queued:",
          {
            orderId:
              paymentResult.orderId,

            orderNumber:
              paymentResult.orderNumber,

            queued:
              emailQueueResult
                ?.queued ===
              true,

            created:
              emailQueueResult
                ?.created ===
              true,

            queueId:
              emailQueueResult
                ?.queueId ||
              null,

            status:
              emailQueueResult
                ?.status ||
              null,
          }
        );

      } catch (
        emailQueueError
      ) {

        /*
         * Never fail an already-approved payment because
         * notification email could not be queued.
         */
        console.error(
          "Kiosk order confirmation email queue failed:",
          {
            orderId:
              paymentResult.orderId,

            orderNumber:
              paymentResult.orderNumber,

            error:
              emailQueueError
                ?.message ||
              String(
                emailQueueError
              ),
          }
        );
      }
    }

    /*
     * Internal kiosk order notifications.
     *
     * Multiple recipients may be configured as:
     *
     * KIOSK_ORDER_NOTIFICATION_EMAILS=
     *   email1@example.com,email2@example.com
     *
     * These are queued only for successfully paid orders.
     */
    if (
      paymentResult
        ?.paymentStatus ===
        "PAID"
    ) {

      const internalRecipients =
        String(
          process.env
            .KIOSK_ORDER_NOTIFICATION_EMAILS ||
          ""
        )
          .split(",")
          .map(
            value =>
              value
                .trim()
                .toLowerCase()
          )
          .filter(
            Boolean
          );

      for (
        const recipientEmail of
        new Set(
          internalRecipients
        )
      ) {

        try {

          const internalQueueResult =
            await queueOrderNotification({
              companyId:
                device.companyId,

              orderId:
                paymentResult.orderId,

              notificationType:
                "ORDER_CONFIRMED",

              recipientEmail,

              metadata: {
                audience:
                  "KIOSK_OPERATIONS",
              },
            });

          console.log(
            "Kiosk internal order email queued:",
            {
              orderNumber:
                paymentResult.orderNumber,

              recipientEmail,

              queued:
                internalQueueResult
                  ?.queued ===
                true,

              created:
                internalQueueResult
                  ?.created ===
                true,

              queueId:
                internalQueueResult
                  ?.queueId ||
                null,
            }
          );

        } catch (
          internalEmailError
        ) {

          console.error(
            "Kiosk internal order email queue failed:",
            {
              orderNumber:
                paymentResult.orderNumber,

              recipientEmail,

              error:
                internalEmailError
                  ?.message ||
                String(
                  internalEmailError
                ),
            }
          );
        }
      }
    }

    return paymentResult;

};


module.exports = {
  createCheckout,
  recordPaymentResult,
  getProductAvailability,
};
