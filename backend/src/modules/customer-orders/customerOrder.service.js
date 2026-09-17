const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
  );

const toNumber = (
  value
) =>
  Number(
    value || 0
  );

const serializeProtectionPlan = (
  plan
) => ({
  id:
    plan.id,

  schemeId:
    plan.schemeId,

  assignmentId:
    plan.assignmentId,

  schemeCode:
    plan.schemeCode,

  schemeName:
    plan.schemeName,

  schemeType:
    plan.schemeType,

  durationMonths:
    plan.durationMonths,

  pricingMethod:
    plan.pricingMethod,

  productUnitPrice:
    toNumber(
      plan.productUnitPrice
    ),

  percentageApplied:
    plan.percentageApplied ===
      null ||
    plan.percentageApplied ===
      undefined
      ? null
      : toNumber(
          plan.percentageApplied
        ),

  protectionUnitPrice:
    toNumber(
      plan.protectionUnitPrice
    ),

  quantity:
    toNumber(
      plan.quantity
    ),

  totalAmount:
    toNumber(
      plan.totalAmount
    ),

  currencyCode:
    plan.currencyCode,

  status:
    plan.status,

  coverageStartMode:
    plan.coverageStartMode,

  coverageStartDate:
    plan.coverageStartDate,

  coverageEndDate:
    plan.coverageEndDate,

  createdAt:
    plan.createdAt,

  updatedAt:
    plan.updatedAt,
});

const serializeOrderListItem =
  (
    order
  ) => {
    const value =
      order.get
        ? order.get({
            plain:
              true,
          })
        : order;

    return {
      id:
        value.id,

      orderNumber:
        value.orderNumber,

      channelCode:
        value.channelCode,

      currencyCode:
        value.currencyCode,

      subtotal:
        toNumber(
          value.subtotal
        ),

      discountAmount:
        toNumber(
          value.discountAmount
        ),

      deliveryAmount:
        toNumber(
          value.deliveryAmount
        ),

      taxAmount:
        toNumber(
          value.taxAmount
        ),

      grandTotal:
        toNumber(
          value.grandTotal
        ),

      deliveryMethod:
        value.deliveryMethod,

      paymentMethod:
        value.paymentMethod,

      paymentStatus:
        value.paymentStatus,

      orderStatus:
        value.orderStatus,

      fulfillmentStatus:
        value.fulfillmentStatus,

      placedAt:
        value.placedAt,

      createdAt:
        value.createdAt,

      itemCount:
        Array.isArray(
          value.items
        )
          ? value.items.reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item.quantity ||
                    0
                ),
              0
            )
          : 0,

      items:
        Array.isArray(
          value.items
        )
          ? value.items.map(
              (
                item
              ) => ({
                id:
                  item.id,

                productId:
                  item.productId,

                productVariantId:
                  item.productVariantId,

                sku:
                  item.sku,

                productName:
                  item.productName,

                variantName:
                  item.variantName,

                quantity:
                  toNumber(
                    item.quantity
                  ),

                unitPrice:
                  toNumber(
                    item.unitPrice
                  ),

                lineTotal:
                  toNumber(
                    item.lineTotal
                  ),
              })
            )
          : [],
    };
  };

const serializeOrderDetails =
  (
    order
  ) => {
    const value =
      order.get
        ? order.get({
            plain:
              true,
          })
        : order;

    return {
      id:
        value.id,

      orderNumber:
        value.orderNumber,

      channelCode:
        value.channelCode,

      customer: {
        firstName:
          value.customerFirstName,

        lastName:
          value.customerLastName,

        email:
          value.customerEmail,

        phone:
          value.customerPhone,
      },

      currencyCode:
        value.currencyCode,

      subtotal:
        toNumber(
          value.subtotal
        ),

      discountAmount:
        toNumber(
          value.discountAmount
        ),

      deliveryAmount:
        toNumber(
          value.deliveryAmount
        ),

      taxAmount:
        toNumber(
          value.taxAmount
        ),

      grandTotal:
        toNumber(
          value.grandTotal
        ),

      couponCode:
        value.couponCode,

      deliveryMethod:
        value.deliveryMethod,

      paymentMethod:
        value.paymentMethod,

      paymentStatus:
        value.paymentStatus,

      orderStatus:
        value.orderStatus,

      fulfillmentStatus:
        value.fulfillmentStatus,

      notes:
        value.notes,

      placedAt:
        value.placedAt,

      createdAt:
        value.createdAt,

      items:
        (
          value.items ||
          []
        ).map(
          (
            item
          ) => ({
            id:
              item.id,

            productId:
              item.productId,

            productVariantId:
              item.productVariantId,

            sku:
              item.sku,

            productName:
              item.productName,

            variantName:
              item.variantName,

            quantity:
              toNumber(
                item.quantity
              ),

            currencyCode:
              item.currencyCode,

            unitPrice:
              toNumber(
                item.unitPrice
              ),

            discountAmount:
              toNumber(
                item.discountAmount
              ),

            taxPercent:
              toNumber(
                item.taxPercent
              ),

            taxAmount:
              toNumber(
                item.taxAmount
              ),

            lineSubtotal:
              toNumber(
                item.lineSubtotal
              ),

            lineTotal:
              toNumber(
                item.lineTotal
              ),

            protectionPlans:
              Array.isArray(
                item.protectionPlans
              )
                ? item.protectionPlans.map(
                    serializeProtectionPlan
                  )
                : [],
          })
        ),

      addresses:
        value.addresses ||
        [],

      payments:
        (
          value.payments ||
          []
        ).map(
          (
            payment
          ) => ({
            ...payment,

            amount:
              toNumber(
                payment.amount
              ),
          })
        ),

      statusHistory:
        value.statusHistory ||
        [],
    };
  };

exports.getOrders =
  async ({
    customerId,
    companyId,
    page = 1,
    pageSize = 20,
  }) => {
    const safePage =
      Math.max(
        1,
        Number(page) ||
          1
      );

    const safePageSize =
      Math.min(
        100,
        Math.max(
          1,
          Number(
            pageSize
          ) || 20
        )
      );

    const {
      count,
      rows,
    } =
      await db.Order.findAndCountAll({
        where: {
          companyId,
          customerId,
        },

        include: [
          {
            model:
              db.OrderItem,

            as:
              "items",

            required:
              false,
          },
        ],

        order: [
          [
            "placedAt",
            "DESC",
          ],
        ],

        distinct:
          true,

        limit:
          safePageSize,

        offset:
          (
            safePage -
            1
          ) *
          safePageSize,
      });

    return {
      orders:
        rows.map(
          serializeOrderListItem
        ),

      pagination: {
        page:
          safePage,

        pageSize:
          safePageSize,

        total:
          count,

        totalPages:
          Math.ceil(
            count /
              safePageSize
          ),
      },
    };
  };

exports.getOrderById =
  async ({
    orderId,
    customerId,
    companyId,
  }) => {
    const order =
      await db.Order.findOne({
        where: {
          id:
            orderId,

          companyId,

          customerId,
        },

        include: [
          {
            model:
              db.OrderItem,

            as:
              "items",

            include: [
              {
                model:
                  db.OrderItemProtectionPlan,

                as:
                  "protectionPlans",

                required:
                  false,
              },
            ],
          },

          {
            model:
              db.OrderAddress,

            as:
              "addresses",
          },

          {
            model:
              db.OrderPayment,

            as:
              "payments",
          },

          {
            model:
              db.OrderStatusHistory,

            as:
              "statusHistory",
          },
        ],

        order: [
          [
            {
              model:
                db.OrderStatusHistory,

              as:
                "statusHistory",
            },

            "createdAt",

            "ASC",
          ],
        ],
      });

    if (
      !order
    ) {
      throw new AppError(
        "Order was not found.",
        404,
        "CUSTOMER_ORDER_NOT_FOUND"
      );
    }

    return serializeOrderDetails(
      order
    );
  };
