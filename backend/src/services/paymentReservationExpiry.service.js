const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../models"
    );
  
  const networkInternationalService =
    require(
      "./networkInternationalService"
    );
  
  const tamaraService =
    require(
      "./tamaraService"
    );
  
  const tabbyService =
    require(
      "./tabbyService"
    );
  
  const reservationLifecycleService =
    require(
      "./orderShipmentReservationLifecycle.service"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Configuration
  |--------------------------------------------------------------------------
  */
  
  const RESERVATION_TTL_MINUTES =
    Math.max(
      5,
      Number(
        process.env
          .PAYMENT_RESERVATION_TTL_MINUTES ||
          30
      )
    );
  
  const BATCH_SIZE =
    Math.max(
      1,
      Number(
        process.env
          .PAYMENT_RESERVATION_EXPIRY_BATCH_SIZE ||
          50
      )
    );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const normalize =
    (
      value
    ) =>
      String(
        value ||
          ""
      )
        .trim()
        .toUpperCase();
  
  const cutoffDate =
    () =>
      new Date(
        Date.now() -
          RESERVATION_TTL_MINUTES *
            60 *
            1000
      );
  
  const getLatestPayment =
    async ({
      order,
      transaction,
    }) => {
      return db.OrderPayment.findOne({
        where: {
          companyId:
            order.companyId,
  
          orderId:
            order.id,
        },
  
        order: [
          [
            "createdAt",
            "DESC",
          ],
        ],
  
        transaction,
      });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Terminal / Safe States
  |--------------------------------------------------------------------------
  */
  
  const isSuccessfulState =
    (
      paymentMethod,
      state
    ) => {
      const normalizedState =
        normalize(
          state
        );
  
      if (
        paymentMethod ===
        "CARD"
      ) {
        return [
          "PURCHASED",
          "CAPTURED",
          "AUTHORISED",
          "AUTHORIZED",
        ].includes(
          normalizedState
        );
      }
  
      if (
        paymentMethod ===
        "TAMARA"
      ) {
        return [
          "APPROVED",
          "AUTHORISED",
          "AUTHORIZED",
          "CAPTURED",
          "FULLY_CAPTURED",
          "PARTIALLY_CAPTURED",
        ].includes(
          normalizedState
        );
      }
  
      if (
        paymentMethod ===
        "TABBY"
      ) {
        return [
          "AUTHORIZED",
          "CLOSED",
        ].includes(
          normalizedState
        );
      }
  
      return false;
    };
  
  const isTerminalFailureState =
    (
      paymentMethod,
      state
    ) => {
      const normalizedState =
        normalize(
          state
        );
  
      if (
        paymentMethod ===
        "CARD"
      ) {
        return [
          "FAILED",
          "FAILURE",
          "DECLINED",
          "REJECTED",
          "THREE_DS_FAILURE",
          "CANCELLED",
          "CANCELED",
          "EXPIRED",
          "ABANDONED",
        ].includes(
          normalizedState
        );
      }
  
      if (
        paymentMethod ===
        "TAMARA"
      ) {
        return [
          "DECLINED",
          "EXPIRED",
          "CANCELLED",
          "CANCELED",
        ].includes(
          normalizedState
        );
      }
  
      if (
        paymentMethod ===
        "TABBY"
      ) {
        return [
          "REJECTED",
          "EXPIRED",
          "CANCELLED",
          "CANCELED",
        ].includes(
          normalizedState
        );
      }
  
      return false;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Provider State - CARD
  |--------------------------------------------------------------------------
  */
  
  const getCardState =
    async ({
      order,
      payment,
    }) => {
      /*
       * If provider reference exists, use your existing
       * Network International reconciliation.
       */
      if (
        payment
          ?.providerReference
      ) {
        try {
          const result =
            await networkInternationalService
              .reconcileOrderPayment({
                orderId:
                  order.id,
              });
  
          return {
            state:
              result
                ?.gatewayState ||
              null,
  
            source:
              "NETWORK_INTERNATIONAL",
          };
        } catch (
          error
        ) {
          console.error(
            "[Reservation Expiry] Network International reconciliation failed:",
            {
              orderId:
                order.id,
  
              message:
                error.message,
            }
          );
  
          return {
            state:
              null,
  
            source:
              "NETWORK_INTERNATIONAL",
  
            error,
          };
        }
      }
  
      return {
        state:
          null,
  
        source:
          "NETWORK_INTERNATIONAL",
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Provider State - Tamara
  |--------------------------------------------------------------------------
  */
  
  const getTamaraState =
    async ({
      payment,
    }) => {
      if (
        !payment
          ?.providerReference
      ) {
        return {
          state:
            null,
  
          source:
            "TAMARA",
        };
      }
  
      try {
        const tamaraOrder =
          await tamaraService
            .getOrderDetails(
              payment
                .providerReference
            );
  
        return {
          state:
            tamaraOrder
              ?.status ||
            tamaraOrder
              ?.order_status ||
            null,
  
          source:
            "TAMARA",
  
          payload:
            tamaraOrder,
        };
      } catch (
        error
      ) {
        console.error(
          "[Reservation Expiry] Tamara reconciliation failed:",
          error.message
        );
  
        return {
          state:
            null,
  
          source:
            "TAMARA",
  
          error,
        };
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Provider State - Tabby
  |--------------------------------------------------------------------------
  */
  
  const getTabbyState =
    async ({
      payment,
    }) => {
      if (
        !payment
          ?.providerReference
      ) {
        return {
          state:
            null,
  
          source:
            "TABBY",
        };
      }
  
      try {
        const tabbyPayment =
          await tabbyService
            .getPayment(
              payment
                .providerReference
            );
  
        return {
          state:
            tabbyPayment
              ?.status ||
            null,
  
          source:
            "TABBY",
  
          payload:
            tabbyPayment,
        };
      } catch (
        error
      ) {
        console.error(
          "[Reservation Expiry] Tabby reconciliation failed:",
          error.message
        );
  
        return {
          state:
            null,
  
          source:
            "TABBY",
  
          error,
        };
      }
    };
  
  /*
  |--------------------------------------------------------------------------
  | Provider State Dispatcher
  |--------------------------------------------------------------------------
  */
  
  const getProviderState =
    async ({
      order,
      payment,
    }) => {
      const paymentMethod =
        normalize(
          order.paymentMethod
        );
  
      if (
        paymentMethod ===
        "CARD"
      ) {
        return getCardState({
          order,
          payment,
        });
      }
  
      if (
        paymentMethod ===
        "TAMARA"
      ) {
        return getTamaraState({
          order,
          payment,
        });
      }
  
      if (
        paymentMethod ===
        "TABBY"
      ) {
        return getTabbyState({
          order,
          payment,
        });
      }
  
      return {
        state:
          null,
  
        source:
          paymentMethod,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Mark Checkout Expired + Release Reservation
  |--------------------------------------------------------------------------
  */
  
  const expireOrderReservation =
    async ({
      order,
      payment,
      providerState,
      reason,
    }) => {
      return db.sequelize.transaction(
        async (
          transaction
        ) => {
          /*
           * Lock order so two worker executions cannot expire it together.
           */
          const lockedOrder =
            await db.Order.findOne({
              where: {
                id:
                  order.id,
  
                companyId:
                  order.companyId,
              },
  
              transaction,
  
              lock:
                transaction
                  .LOCK
                  .UPDATE,
            });
  
          if (
            !lockedOrder
          ) {
            return {
              skipped:
                true,
  
              reason:
                "ORDER_NOT_FOUND",
            };
          }
  
          /*
           * Another webhook may have completed payment while
           * the worker was checking the gateway.
           */
          if (
            [
              "PAID",
              "AUTHORIZED",
            ].includes(
              normalize(
                lockedOrder
                  .paymentStatus
              )
            )
          ) {
            return {
              skipped:
                true,
  
              reason:
                "PAYMENT_ALREADY_SUCCESSFUL",
            };
          }
  
          if (
            normalize(
              lockedOrder
                .orderStatus
            ) ===
            "CANCELLED"
          ) {
            return {
              skipped:
                true,
  
              reason:
                "ORDER_ALREADY_CANCELLED",
            };
          }
  
          /*
          |--------------------------------------------------------------------------
          | Release stock
          |--------------------------------------------------------------------------
          */
  
          const releaseResult =
            await reservationLifecycleService
              .releaseForPaymentFailure({
                order:
                  lockedOrder,
  
                reason,
  
                transaction,
              });
  
          /*
          |--------------------------------------------------------------------------
          | Cancel order
          |--------------------------------------------------------------------------
          */
  
          const previousOrderStatus =
            lockedOrder
              .orderStatus;
  
          await lockedOrder.update(
            {
              paymentStatus:
                "FAILED",
  
              orderStatus:
                "CANCELLED",
            },
            {
              transaction,
            }
          );
  
          /*
          |--------------------------------------------------------------------------
          | Update payment audit
          |--------------------------------------------------------------------------
          */
  
          if (
            payment
          ) {
            const currentPayload =
              payment
                .providerPayload &&
              typeof payment
                .providerPayload ===
                "object"
                ? payment
                    .providerPayload
                : {};
  
            await payment.update(
              {
                status:
                  "FAILED",
  
                providerPayload: {
                  ...currentPayload,
  
                  reservationExpired:
                    true,
  
                  reservationExpiredAt:
                    new Date()
                      .toISOString(),
  
                  reservationExpiryReason:
                    reason,
  
                  reservationExpiryProviderState:
                    providerState ||
                    null,
                },
              },
              {
                transaction,
              }
            );
          }
  
          /*
          |--------------------------------------------------------------------------
          | History
          |--------------------------------------------------------------------------
          */
  
          if (
            db.OrderStatusHistory &&
            previousOrderStatus !==
              "CANCELLED"
          ) {
            try {
              await db.OrderStatusHistory.create(
                {
                  companyId:
                    lockedOrder
                      .companyId,
  
                  orderId:
                    lockedOrder
                      .id,
  
                  statusType:
                    "ORDER",
  
                  fromStatus:
                    previousOrderStatus,
  
                  toStatus:
                    "CANCELLED",
  
                  note:
                    `Payment reservation expired after ${RESERVATION_TTL_MINUTES} minutes. ${
                      providerState
                        ? `Provider state: ${providerState}.`
                        : ""
                    }`,
                },
                {
                  transaction,
                }
              );
            } catch (
              historyError
            ) {
              console.error(
                "[Reservation Expiry] Unable to create status history:",
                historyError.message
              );
            }
          }
  
          return {
            skipped:
              false,
  
            releaseResult,
          };
        }
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Process One Order
  |--------------------------------------------------------------------------
  */
  
  const processOrder =
    async (
      order
    ) => {
      const paymentMethod =
        normalize(
          order.paymentMethod
        );
  
      if (
        ![
          "CARD",
          "TAMARA",
          "TABBY",
        ].includes(
          paymentMethod
        )
      ) {
        return {
          orderId:
            order.id,
  
          action:
            "SKIPPED",
  
          reason:
            "PAYMENT_METHOD_NOT_SUPPORTED",
        };
      }
  
      /*
       * Already paid/authorized.
       */
      if (
        [
          "PAID",
          "AUTHORIZED",
        ].includes(
          normalize(
            order.paymentStatus
          )
        )
      ) {
        return {
          orderId:
            order.id,
  
          action:
            "KEPT",
  
          reason:
            "PAYMENT_SUCCESSFUL",
        };
      }
  
      const payment =
        await getLatestPayment({
          order,
        });
  
      const provider =
        await getProviderState({
          order,
          payment,
        });
  
      const providerState =
        normalize(
          provider.state
        );
  
      /*
      |--------------------------------------------------------------------------
      | Provider says payment is successful
      |--------------------------------------------------------------------------
      */
  
      if (
        isSuccessfulState(
          paymentMethod,
          providerState
        )
      ) {
        return {
          orderId:
            order.id,
  
          action:
            "KEPT",
  
          reason:
            "PROVIDER_SUCCESSFUL",
  
          providerState,
        };
      }
  
      /*
      |--------------------------------------------------------------------------
      | Provider explicitly says terminal failure
      |--------------------------------------------------------------------------
      */
  
      if (
        isTerminalFailureState(
          paymentMethod,
          providerState
        )
      ) {
        await expireOrderReservation({
          order,
          payment,
          providerState,
  
          reason:
            `${paymentMethod}_${providerState}`,
        });
  
        return {
          orderId:
            order.id,
  
          action:
            "RELEASED",
  
          reason:
            "PROVIDER_TERMINAL",
  
          providerState,
        };
      }
  
      /*
      |--------------------------------------------------------------------------
      | Gateway check failed
      |--------------------------------------------------------------------------
      |
      | Fail safe:
      | do NOT release inventory if we cannot reach the provider.
      |
      | A temporary provider/network problem must not cause an order that
      | might actually be paid to lose its inventory.
      |--------------------------------------------------------------------------
      */
  
      if (
        provider.error
      ) {
        return {
          orderId:
            order.id,
  
          action:
            "KEPT",
  
          reason:
            "PROVIDER_CHECK_FAILED",
        };
      }
  
      /*
      |--------------------------------------------------------------------------
      | Still pending after TTL
      |--------------------------------------------------------------------------
      */
  
      await expireOrderReservation({
        order,
        payment,
        providerState,
  
        reason:
          `${paymentMethod}_ABANDONED_${RESERVATION_TTL_MINUTES}_MINUTES`,
      });
  
      return {
        orderId:
          order.id,
  
        action:
          "RELEASED",
  
        reason:
          "TTL_EXPIRED",
  
        providerState:
          providerState ||
          null,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Run Expiry Batch
  |--------------------------------------------------------------------------
  */
  
  const expireAbandonedPaymentReservations =
    async () => {
      const cutoff =
        cutoffDate();
  
      console.log(
        "[Reservation Expiry] Starting scan",
        {
          ttlMinutes:
            RESERVATION_TTL_MINUTES,
  
          cutoff:
            cutoff.toISOString(),
  
          batchSize:
            BATCH_SIZE,
        }
      );
  
      /*
       * Only orders which still have an active RESERVED allocation
       * are candidates.
       */
      const orders =
        await db.Order.findAll({
          where: {
            paymentMethod: {
              [Op.in]: [
                "CARD",
                "TAMARA",
                "TABBY",
              ],
            },
  
            paymentStatus: {
              [Op.in]: [
                "PENDING",
                "FAILED",
              ],
            },
  
            orderStatus: {
              [Op.ne]:
                "CANCELLED",
            },
  
            createdAt: {
              [Op.lte]:
                cutoff,
            },
          },
  
          include: [
            {
              model:
                db.OrderShipment,
  
              as:
                "shipments",
  
              required:
                true,
  
              include: [
                {
                  model:
                    db.OrderShipmentAllocation,
  
                  as:
                    "allocations",
  
                  required:
                    true,
  
                  where: {
                    status:
                      "RESERVED",
                  },
  
                  attributes: [
                    "id",
                  ],
                },
              ],
  
              attributes: [
                "id",
              ],
            },
          ],
  
          distinct:
            true,
  
          limit:
            BATCH_SIZE,
  
          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],
        });
  
      const results =
        [];
  
      for (
        const order of
        orders
      ) {
        try {
          const result =
            await processOrder(
              order
            );
  
          results.push(
            result
          );
  
          console.log(
            "[Reservation Expiry]",
            {
              orderId:
                order.id,
  
              orderNumber:
                order.orderNumber,
  
              paymentMethod:
                order.paymentMethod,
  
              ...result,
            }
          );
        } catch (
          error
        ) {
          console.error(
            "[Reservation Expiry] Order processing failed",
            {
              orderId:
                order.id,
  
              orderNumber:
                order.orderNumber,
  
              message:
                error.message,
            }
          );
  
          results.push({
            orderId:
              order.id,
  
            action:
              "ERROR",
  
            error:
              error.message,
          });
        }
      }
  
      return {
        cutoff,
        scanned:
          orders.length,
  
        released:
          results.filter(
            row =>
              row.action ===
              "RELEASED"
          ).length,
  
        kept:
          results.filter(
            row =>
              row.action ===
              "KEPT"
          ).length,
  
        errors:
          results.filter(
            row =>
              row.action ===
              "ERROR"
          ).length,
  
        results,
      };
    };
  
  module.exports = {
    RESERVATION_TTL_MINUTES,
    expireAbandonedPaymentReservations,
  };