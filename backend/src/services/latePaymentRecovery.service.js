const db =
  require(
    "../models"
  );

const AppError =
  require(
    "../utils/AppError"
  );

const orderShipmentReservationService =
  require(
    "./orderShipmentReservation.service"
  );

const paymentExceptionService =
  require(
    "./paymentException.service"
  );

const getProviderPayload =
  (
    payment
  ) => {
    const payload =
      payment
        ?.providerPayload;

    if (
      payload &&
      typeof payload ===
        "object" &&
      !Array.isArray(
        payload
      )
    ) {
      return payload;
    }

    return {};
  };

const hasExpiredReservation =
  (
    payment
  ) => {
    return (
      getProviderPayload(
        payment
      )
        .reservationExpired ===
      true
    );
  };

const normalizeCityCode =
  (
    value
  ) => {
    const normalized =
      String(
        value ||
        ""
      )
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    if (
      normalized ===
      "ABUDHABI"
    ) {
      return "ABU_DHABI";
    }

    return normalized;
  };

const getShippingCityCode =
  async ({
    order,
    transaction,
  }) => {
    const address =
      await db.OrderAddress.findOne({
        where: {
          companyId:
            order.companyId,

          orderId:
            order.id,

          addressType:
            "SHIPPING",
        },

        transaction,
      });

    const city =
      address?.city ||
      address?.emirate ||
      null;

    const cityCode =
      normalizeCityCode(
        city
      );

    if (
      !cityCode
    ) {
      throw new AppError(
        "Shipping city could not be determined for late payment recovery.",
        409,
        "LATE_PAYMENT_CITY_MISSING"
      );
    }

    return cityCode;
  };

const markRecoveryFailure =
  async ({
    order,
    payment,
    provider,
    providerState,
    error,
    transaction,
  }) => {
    const currentPayload =
      getProviderPayload(
        payment
      );

    await payment.update(
      {
        providerPayload: {
          ...currentPayload,

          reservationRecoveryFailed:
            true,

          reservationRecoveryFailedAt:
            new Date()
              .toISOString(),

          reservationRecoveryProvider:
            provider,

          reservationRecoveryProviderState:
            providerState ||
            null,

          paymentException:
            "PAID_AFTER_RESERVATION_EXPIRY",

          reservationRecoveryError:
            error?.message ||
            "Stock could not be re-reserved.",
        },
      },
      {
        transaction,
      }
    );

    await paymentExceptionService
      .upsertPaidAfterExpiryException({
        order,
        payment,
        provider,
        providerState,

        message:
          error?.message ||
          "Stock could not be re-reserved.",

        transaction,
      });

    if (
      order.orderStatus !==
      "CANCELLED"
    ) {
      await order.update(
        {
          orderStatus:
            "CANCELLED",
        },
        {
          transaction,
        }
      );
    }
  };

const handleLateSuccessfulPayment =
  async ({
    order,
    payment,
    provider,
    providerState,
    transaction:
      externalTransaction =
        null,
  }) => {
    if (
      !order ||
      !payment
    ) {
      throw new AppError(
        "Order and payment are required for late payment recovery.",
        400,
        "LATE_PAYMENT_RECOVERY_INPUT_REQUIRED"
      );
    }

    if (
      !hasExpiredReservation(
        payment
      )
    ) {
      return {
        latePayment:
          false,

        recovered:
          false,

        recoveryRequired:
          false,
      };
    }

    const execute =
      async (
        transaction
      ) => {
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

        const lockedPayment =
          await db.OrderPayment.findOne({
            where: {
              id:
                payment.id,

              companyId:
                order.companyId,

              orderId:
                order.id,
            },

            transaction,

            lock:
              transaction
                .LOCK
                .UPDATE,
          });

        if (
          !lockedOrder ||
          !lockedPayment
        ) {
          throw new AppError(
            "Order or payment disappeared during late payment recovery.",
            409,
            "LATE_PAYMENT_RECOVERY_RECORD_MISSING"
          );
        }

        const payload =
          getProviderPayload(
            lockedPayment
          );

        if (
          payload
            .reservationRecovered ===
          true
        ) {
          return {
            latePayment:
              true,

            recovered:
              true,

            recoveryRequired:
              false,

            alreadyRecovered:
              true,
          };
        }

        const activeAllocation =
          await db.OrderShipmentAllocation.findOne({
            where: {
              companyId:
                lockedOrder
                  .companyId,

              status:
                "RESERVED",
            },

            include: [
              {
                model:
                  db.OrderShipment,

                as:
                  "shipment",

                required:
                  true,

                where: {
                  companyId:
                    lockedOrder
                      .companyId,

                  orderId:
                    lockedOrder
                      .id,
                },

                attributes: [
                  "id",
                ],
              },
            ],

            transaction,
          });

        if (
          activeAllocation
        ) {
          await lockedPayment.update(
            {
              providerPayload: {
                ...payload,

                reservationRecovered:
                  true,

                reservationRecoveredAt:
                  new Date()
                    .toISOString(),

                reservationRecoveryProvider:
                  provider,

                reservationRecoveryProviderState:
                  providerState ||
                  null,

                reservationRecoveryNote:
                  "An active stock reservation already existed when the late payment was processed.",
              },
            },
            {
              transaction,
            }
          );

          await lockedOrder.update(
            {
              orderStatus:
                "CONFIRMED",
            },
            {
              transaction,
            }
          );

          return {
            latePayment:
              true,

            recovered:
              true,

            recoveryRequired:
              false,

            activeReservationAlreadyExists:
              true,
          };
        }

        const cityCode =
          await getShippingCityCode({
            order:
              lockedOrder,

            transaction,
          });

        try {
          const reservation =
            await orderShipmentReservationService
              .reserveOrderDelivery({
                order:
                  lockedOrder,

                cityCode,

                transaction,
              });

          const latestPayload =
            getProviderPayload(
              lockedPayment
            );

          await lockedPayment.update(
            {
              providerPayload: {
                ...latestPayload,

                reservationRecovered:
                  true,

                reservationRecoveredAt:
                  new Date()
                    .toISOString(),

                reservationRecoveryFailed:
                  false,

                reservationRecoveryProvider:
                  provider,

                reservationRecoveryProviderState:
                  providerState ||
                  null,

                paymentException:
                  null,
              },
            },
            {
              transaction,
            }
          );

          await lockedOrder.update(
            {
              orderStatus:
                "CONFIRMED",
            },
            {
              transaction,
            }
          );

          await paymentExceptionService
            .resolvePaidAfterExpiryException({
              order:
                lockedOrder,

              transaction,

              note:
                "Inventory successfully reallocated after late payment.",
            });

          return {
            latePayment:
              true,

            recovered:
              true,

            recoveryRequired:
              true,

            deliveryPlan:
              reservation.plan,
          };
        } catch (
          error
        ) {
          await markRecoveryFailure({
            order:
              lockedOrder,

            payment:
              lockedPayment,

            provider,

            providerState,

            error,

            transaction,
          });

          return {
            latePayment:
              true,

            recovered:
              false,

            recoveryRequired:
              true,

            paymentException:
              "PAID_AFTER_RESERVATION_EXPIRY",

            error:
              error.message,
          };
        }
      };

    if (
      externalTransaction
    ) {
      return execute(
        externalTransaction
      );
    }

    return db.sequelize.transaction(
      execute
    );
  };

module.exports = {
  hasExpiredReservation,
  handleLateSuccessfulPayment,
};
