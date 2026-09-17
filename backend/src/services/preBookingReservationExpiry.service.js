const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../models"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Pre-Booking Reservation Expiry
  |--------------------------------------------------------------------------
  |
  | Processes checkout sessions whose expiresAt has passed.
  |
  | RESERVED / OPEN / PAYMENT_PENDING:
  |
  |   If linked order is PAID/AUTHORIZED:
  |     reservedQuantity  -= quantity
  |     confirmedQuantity += quantity
  |     session.status     = COMPLETED
  |
  |   Otherwise:
  |     reservedQuantity  -= quantity
  |     session.status     = EXPIRED
  |
  | Each session and allocation is locked inside the same transaction.
  |--------------------------------------------------------------------------
  */
  
  const EXPIRABLE_STATUSES = [
    "OPEN",
    "RESERVED",
    "PAYMENT_PENDING",
  ];
  
  const PAID_STATUSES = [
    "PAID",
    "AUTHORIZED",
  ];
  
  const processSession =
    async ({
      sessionId,
    }) =>
      db.sequelize.transaction(
        async (
          transaction
        ) => {
          /*
          |--------------------------------------------------------------------------
          | Lock Session
          |--------------------------------------------------------------------------
          */
  
          const session =
            await db.PreBookingCheckoutSession.findOne({
              where: {
                id:
                  sessionId,
              },
  
              transaction,
  
              lock:
                transaction.LOCK.UPDATE,
            });
  
          if (!session) {
            return {
              sessionId,
              action:
                "SKIPPED",
              reason:
                "SESSION_NOT_FOUND",
            };
          }
  
          /*
           * Another process may have completed/expired it after
           * the worker selected the candidate.
           */
  
          if (
            !EXPIRABLE_STATUSES.includes(
              String(
                session.status
              )
            )
          ) {
            return {
              sessionId:
                session.id,
  
              publicToken:
                session.publicToken,
  
              action:
                "KEPT",
  
              reason:
                `STATUS_${session.status}`,
            };
          }
  
          const now =
            new Date();
  
          if (
            !session.expiresAt ||
            new Date(
              session.expiresAt
            ).getTime() >
              now.getTime()
          ) {
            return {
              sessionId:
                session.id,
  
              publicToken:
                session.publicToken,
  
              action:
                "KEPT",
  
              reason:
                "NOT_EXPIRED",
            };
          }
  
          /*
          |--------------------------------------------------------------------------
          | Check Linked Order
          |--------------------------------------------------------------------------
          |
          | Critical race protection:
          |
          | A customer may have completed payment while the reservation
          | technically reached expiresAt.
          |
          | Never release an allocation if its order is already
          | PAID/AUTHORIZED.
          |--------------------------------------------------------------------------
          */
  
          let order =
            null;
  
          if (
            session.orderId
          ) {
            order =
              await db.Order.findOne({
                where: {
                  id:
                    session.orderId,
  
                  companyId:
                    session.companyId,
                },
  
                transaction,
  
                lock:
                  transaction.LOCK.UPDATE,
              });
          }
  
          const paymentConfirmed =
            Boolean(
              order &&
              PAID_STATUSES.includes(
                String(
                  order.paymentStatus ||
                    ""
                )
                  .trim()
                  .toUpperCase()
              )
            );
  
          /*
          |--------------------------------------------------------------------------
          | Lock Allocation
          |--------------------------------------------------------------------------
          */
  
          const allocation =
            await db.PreBookingAllocation.findOne({
              where: {
                id:
                  session.allocationId,
  
                companyId:
                  session.companyId,
              },
  
              transaction,
  
              lock:
                transaction.LOCK.UPDATE,
            });
  
          if (!allocation) {
            /*
             * Do not mark the session expired if we cannot safely
             * adjust its allocation.
             */
  
            throw new Error(
              `Allocation ${session.allocationId} was not found for pre-booking session ${session.id}.`
            );
          }
  
          const quantity =
            Number(
              session.quantity ||
                0
            );
  
          const reservedQuantity =
            Number(
              allocation.reservedQuantity ||
                0
            );
  
          const confirmedQuantity =
            Number(
              allocation.confirmedQuantity ||
                0
            );
  
          /*
          |--------------------------------------------------------------------------
          | Paid Order → Confirm Booking
          |--------------------------------------------------------------------------
          */
  
          if (
            paymentConfirmed
          ) {
            /*
             * Idempotency is primarily guaranteed by the session row lock
             * and the status check above.
             */
  
            if (
              reservedQuantity <
              quantity
            ) {
              throw new Error(
                `Reserved quantity mismatch for paid pre-booking session ${session.id}. Reserved=${reservedQuantity}, Required=${quantity}.`
              );
            }
  
            allocation.reservedQuantity =
              reservedQuantity -
              quantity;
  
            allocation.confirmedQuantity =
              confirmedQuantity +
              quantity;
  
            await allocation.save({
              transaction,
            });
  
            session.status =
              "COMPLETED";
  
            await session.save({
              transaction,
            });
  
            return {
              sessionId:
                session.id,
  
              publicToken:
                session.publicToken,
  
              orderId:
                session.orderId,
  
              action:
                "CONFIRMED",
  
              quantity,
  
              paymentStatus:
                order.paymentStatus,
            };
          }
  
          /*
          |--------------------------------------------------------------------------
          | Unpaid → Release Reservation
          |--------------------------------------------------------------------------
          */
  
          allocation.reservedQuantity =
            Math.max(
              0,
              reservedQuantity -
                quantity
            );
  
          await allocation.save({
            transaction,
          });
  
          session.status =
            "EXPIRED";
  
          await session.save({
            transaction,
          });
  
          return {
            sessionId:
              session.id,
  
            publicToken:
              session.publicToken,
  
            orderId:
              session.orderId ||
              null,
  
            action:
              "RELEASED",
  
            quantity,
          };
        }
      );
  
  /*
  |--------------------------------------------------------------------------
  | Scan Expired Sessions
  |--------------------------------------------------------------------------
  */
  
  const expireAbandonedPreBookingReservations =
    async () => {
      const now =
        new Date();
  
      /*
       * Only retrieve IDs here.
       *
       * We deliberately do NOT load allocations/variants/products in the
       * discovery query. Each candidate is processed individually with
       * row-level locks.
       */
  
      const candidates =
        await db.PreBookingCheckoutSession.findAll({
          where: {
            status: {
              [Op.in]:
                EXPIRABLE_STATUSES,
            },
  
            expiresAt: {
              [Op.lte]:
                now,
            },
          },
  
          attributes: [
            "id",
          ],
  
          order: [
            [
              "expiresAt",
              "ASC",
            ],
          ],
  
          limit:
            250,
        });
  
      const results =
        [];
  
      for (
        const candidate of
        candidates
      ) {
        try {
          const result =
            await processSession({
              sessionId:
                candidate.id,
            });
  
          results.push(
            result
          );
  
          console.log(
            "[Pre-Booking Expiry]",
            result
          );
        } catch (
          error
        ) {
          console.error(
            "[Pre-Booking Expiry] Session processing failed",
            {
              sessionId:
                candidate.id,
  
              message:
                error.message,
            }
          );
  
          results.push({
            sessionId:
              candidate.id,
  
            action:
              "ERROR",
  
            error:
              error.message,
          });
        }
      }
  
      return {
        scanned:
          candidates.length,
  
        released:
          results.filter(
            row =>
              row.action ===
              "RELEASED"
          ).length,
  
        confirmed:
          results.filter(
            row =>
              row.action ===
              "CONFIRMED"
          ).length,
  
        kept:
          results.filter(
            row =>
              row.action ===
              "KEPT" ||
              row.action ===
              "SKIPPED"
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
    expireAbandonedPreBookingReservations,
  };