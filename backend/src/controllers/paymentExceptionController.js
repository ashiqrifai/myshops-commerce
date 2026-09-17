const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../models"
  );

const latePaymentRecoveryService =
  require(
    "../services/latePaymentRecovery.service"
  );

const list =
  async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        Math.max(
          1,
          Number(
            req.query.page ||
            1
          )
        );

      const pageSize =
        Math.min(
          100,
          Math.max(
            1,
            Number(
              req.query.pageSize ||
              25
            )
          )
        );

      const where =
        {};

      if (
        req.query.companyId
      ) {
        where.companyId =
          req.query.companyId;
      }

      if (
        req.query.status
      ) {
        where.status =
          String(
            req.query.status
          )
            .trim()
            .toUpperCase();
      }

      if (
        req.query.provider
      ) {
        where.provider =
          String(
            req.query.provider
          )
            .trim()
            .toUpperCase();
      }

      const search =
        String(
          req.query.search ||
          ""
        ).trim();

      const orderWhere =
        search
          ? {
              [Op.or]: [
                {
                  orderNumber: {
                    [Op.iLike]:
                      `%${search}%`,
                  },
                },
                {
                  customerEmail: {
                    [Op.iLike]:
                      `%${search}%`,
                  },
                },
                {
                  customerPhone: {
                    [Op.iLike]:
                      `%${search}%`,
                  },
                },
              ],
            }
          : undefined;

      const {
        rows,
        count,
      } =
        await db.PaymentException.findAndCountAll({
          where,

          include: [
            {
              model:
                db.Order,

              as:
                "order",

              required:
                Boolean(
                  orderWhere
                ),

              where:
                orderWhere,

              attributes: [
                "id",
                "orderNumber",
                "customerFirstName",
                "customerLastName",
                "customerEmail",
                "customerPhone",
                "grandTotal",
                "currencyCode",
                "paymentMethod",
                "paymentStatus",
                "orderStatus",
                "deliveryMethod",
                "createdAt",
              ],
            },

            {
              model:
                db.OrderPayment,

              as:
                "payment",

              required:
                false,
            },
          ],

          distinct:
            true,

          limit:
            pageSize,

          offset:
            (page - 1) *
            pageSize,

          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
        });

      res.json({
        success:
          true,

        data: {
          items:
            rows,

          pagination: {
            page,
            pageSize,
            total:
              count,
            pages:
              Math.ceil(
                count /
                  pageSize
              ),
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

const detail =
  async (
    req,
    res,
    next
  ) => {
    try {
      const exception =
        await db.PaymentException.findByPk(
          req.params.id,
          {
            include: [
              {
                model:
                  db.Order,

                as:
                  "order",

                include: [
                  {
                    model:
                      db.OrderItem,

                    as:
                      "items",
                  },

                  {
                    model:
                      db.OrderShipment,

                    as:
                      "shipments",

                    include: [
                      {
                        model:
                          db.OrderShipmentItem,

                        as:
                          "items",
                      },

                      {
                        model:
                          db.OrderShipmentAllocation,

                        as:
                          "allocations",

                        include: [
                          {
                            model:
                              db.InventoryLocation,

                            as:
                              "inventoryLocation",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              {
                model:
                  db.OrderPayment,

                as:
                  "payment",
              },
            ],
          }
        );

      if (
        !exception
      ) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Payment exception was not found.",
          });
      }

      res.json({
        success:
          true,

        data:
          exception,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

const retryAllocation =
  async (
    req,
    res,
    next
  ) => {
    const transaction =
      await db.sequelize.transaction();

    try {
      const exception =
        await db.PaymentException.findByPk(
          req.params.id,
          {
            transaction,

            lock:
              transaction
                .LOCK
                .UPDATE,
          }
        );

      if (
        !exception
      ) {
        await transaction.rollback();

        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Payment exception was not found.",
          });
      }

      const order =
        await db.Order.findByPk(
          exception.orderId,
          {
            transaction,
          }
        );

      const payment =
        exception.orderPaymentId
          ? await db.OrderPayment.findByPk(
              exception
                .orderPaymentId,
              {
                transaction,
              }
            )
          : await db.OrderPayment.findOne({
              where: {
                orderId:
                  exception.orderId,
              },

              order: [
                [
                  "createdAt",
                  "DESC",
                ],
              ],

              transaction,
            });

      if (
        !order ||
        !payment
      ) {
        throw new Error(
          "Order/payment records required for retry were not found."
        );
      }

      await exception.update(
        {
          status:
            "RETRYING",

          retryCount:
            Number(
              exception.retryCount ||
              0
            ) +
            1,

          lastRetryAt:
            new Date(),
        },
        {
          transaction,
        }
      );

      const result =
        await latePaymentRecoveryService
          .handleLateSuccessfulPayment({
            order,
            payment,

            provider:
              exception.provider,

            providerState:
              exception.providerState,

            transaction,
          });

      await exception.reload({
        transaction,
      });

      if (
        !result.recovered &&
        exception.status ===
          "RETRYING"
      ) {
        await exception.update(
          {
            status:
              "OPEN",

            metadata: {
              ...(
                exception.metadata ||
                {}
              ),

              lastAdminRetryResult:
                result,

              lastAdminRetryAt:
                new Date()
                  .toISOString(),
            },
          },
          {
            transaction,
          }
        );
      }

      await transaction.commit();

      res.json({
        success:
          true,

        data: {
          exceptionId:
            exception.id,

          recovery:
            result,
        },
      });
    } catch (
      error
    ) {
      if (
        !transaction.finished
      ) {
        await transaction.rollback();
      }

      next(
        error
      );
    }
  };

const updateStatus =
  (
    status
  ) =>
    async (
      req,
      res,
      next
    ) => {
      try {
        const exception =
          await db.PaymentException.findByPk(
            req.params.id
          );

        if (
          !exception
        ) {
          return res
            .status(
              404
            )
            .json({
              success:
                false,

              message:
                "Payment exception was not found.",
            });
        }

        await exception.update({
          status,

          resolvedAt:
            status ===
              "RESOLVED" ||
            status ===
              "REFUNDED"
              ? new Date()
              : null,

          resolutionNote:
            String(
              req.body?.note ||
              ""
            ).trim() ||
            exception
              .resolutionNote,
        });

        res.json({
          success:
            true,

          data:
            exception,
        });
      } catch (
        error
      ) {
        next(
          error
        );
      }
    };

module.exports = {
  list,
  detail,
  retryAllocation,
  markManualReview:
    updateStatus(
      "MANUAL_REVIEW"
    ),
  resolve:
    updateStatus(
      "RESOLVED"
    ),
  markRefundRequired:
    updateStatus(
      "REFUND_REQUIRED"
    ),
  markRefunded:
    updateStatus(
      "REFUNDED"
    ),
};
