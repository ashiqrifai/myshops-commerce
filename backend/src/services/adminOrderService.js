const {
    Op,
  } = require("sequelize");
  
  const db =
    require("../models");

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
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const clean = (
    value
  ) =>
    value === undefined ||
    value === null
      ? ""
      : String(value).trim();
  
  const cleanUpper = (
    value
  ) =>
    clean(value).toUpperCase();
  
  const toNumber = (
    value,
    fallback
  ) => {
    const number =
      Number(value);
  
    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  };
  
  const parseDate = (
    value
  ) => {
    if (!value) {
      return null;
    }
  
    const date =
      new Date(value);
  
    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  };
  
  const getAttributes = (
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
      getAttributes(Model)[field]
    );
  
  const getEnumValues = (
    Model,
    field
  ) => {
    const attribute =
      getAttributes(Model)[
        field
      ];
  
    if (!attribute) {
      return [];
    }
  
    return (
      attribute.values ||
      attribute.type?.values ||
      []
    );
  };
  
  const getModelField = (
    row,
    field,
    fallback = null
  ) => {
    if (
      row?.[field] !==
        undefined &&
      row?.[field] !==
        null
    ) {
      return row[field];
    }
  
    return fallback;
  };
  
  const money = (
    value
  ) => {
    const number =
      Number(value || 0);
  
    return Number(
      number.toFixed(2)
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */
  
  const createServiceError = ({
    message,
    statusCode = 400,
    code =
      "ADMIN_ORDER_ERROR",
    details = [],
  }) => {
    const error =
      new Error(message);
  
    error.statusCode =
      statusCode;
  
    error.code =
      code;
  
    error.details =
      details;
  
    return error;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Order Serialization
  |--------------------------------------------------------------------------
  */
  
  const serializeOrderListRow = (
    order
  ) => ({
    id:
      order.id,
  
    orderNumber:
      order.orderNumber,
  
    customerId:
      order.customerId ||
      null,
  
    customerName:
      [
        order.customerFirstName,
        order.customerLastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
  
    customerFirstName:
      order.customerFirstName ||
      "",
  
    customerLastName:
      order.customerLastName ||
      "",
  
    customerEmail:
      order.customerEmail ||
      "",
  
    customerPhone:
      order.customerPhone ||
      "",
  
    channelCode:
      order.channelCode ||
      null,
  
    currencyCode:
      order.currencyCode ||
      "AED",
  
    subtotal:
      money(
        order.subtotal
      ),
  
    discountAmount:
      money(
        order.discountAmount
      ),
  
    deliveryAmount:
      money(
        order.deliveryAmount
      ),
  
    taxAmount:
      money(
        order.taxAmount
      ),
  
    grandTotal:
      money(
        order.grandTotal
      ),
  
    couponCode:
      order.couponCode ||
      null,
  
    deliveryMethod:
      order.deliveryMethod,
  
    paymentMethod:
      order.paymentMethod,
  
    paymentStatus:
      order.paymentStatus,
  
    orderStatus:
      order.orderStatus,
  
    fulfillmentStatus:
      order.fulfillmentStatus,
  
    

    zohoSalesOrderId:
      order.zohoSalesOrderId ||
      null,

    zohoSalesOrderNumber:
      order.zohoSalesOrderNumber ||
      null,

    zohoSyncStatus:
      order.zohoSyncStatus ||
      null,

    zohoSyncError:
      order.zohoSyncError ||
      null,

    zohoSyncedAt:
      order.zohoSyncedAt ||
      null,
notes:
      order.notes ||
      null,
  
    placedAt:
      order.placedAt,
  
    createdAt:
      order.createdAt,
  
    updatedAt:
      order.updatedAt,
  });
  
  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */
  
  const buildOrderWhere = ({
    companyId,
    search,
    orderStatus,
    paymentStatus,
    paymentMethod,
    fulfillmentStatus,
    deliveryMethod,
    dateFrom,
    dateTo,
  }) => {
    const where = {
      companyId,
    };
  
    const normalizedSearch =
      clean(search);
  
    if (normalizedSearch) {
      where[Op.or] = [
        {
          orderNumber: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },
        {
          customerFirstName: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },
        {
          customerLastName: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },
        {
          customerEmail: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },
        {
          customerPhone: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },
      ];
    }
  
    if (
      clean(orderStatus)
    ) {
      where.orderStatus =
        cleanUpper(
          orderStatus
        );
    }
  
    if (
      clean(paymentStatus)
    ) {
      where.paymentStatus =
        cleanUpper(
          paymentStatus
        );
    }
  
    if (
      clean(paymentMethod)
    ) {
      where.paymentMethod =
        cleanUpper(
          paymentMethod
        );
    }
  
    if (
      clean(
        fulfillmentStatus
      )
    ) {
      where.fulfillmentStatus =
        cleanUpper(
          fulfillmentStatus
        );
    }
  
    if (
      clean(deliveryMethod)
    ) {
      where.deliveryMethod =
        cleanUpper(
          deliveryMethod
        );
    }
  
    const from =
      parseDate(dateFrom);
  
    const to =
      parseDate(dateTo);
  
    if (
      dateFrom &&
      !from
    ) {
      throw createServiceError({
        message:
          "dateFrom is invalid.",
        code:
          "INVALID_DATE_FROM",
      });
    }
  
    if (
      dateTo &&
      !to
    ) {
      throw createServiceError({
        message:
          "dateTo is invalid.",
        code:
          "INVALID_DATE_TO",
      });
    }
  
    if (
      from ||
      to
    ) {
      where.placedAt = {};
  
      if (from) {
        from.setHours(
          0,
          0,
          0,
          0
        );
  
        where.placedAt[
          Op.gte
        ] = from;
      }
  
      if (to) {
        to.setHours(
          23,
          59,
          59,
          999
        );
  
        where.placedAt[
          Op.lte
        ] = to;
      }
    }
  
    return where;
  };
  
  /*
  |--------------------------------------------------------------------------
  | List Admin Orders
  |--------------------------------------------------------------------------
  */
  
  const listAdminOrders =
    async ({
      companyId,
  
      search,
  
      orderStatus,
  
      paymentStatus,
  
      paymentMethod,
  
      fulfillmentStatus,
  
      deliveryMethod,
  
      dateFrom,
  
      dateTo,
  
      page = 1,
  
      pageSize = 25,
  
      sortBy =
        "placedAt",
  
      sortDirection =
        "DESC",
    }) => {
      if (!companyId) {
        throw createServiceError({
          message:
            "companyId is required.",
          statusCode:
            401,
          code:
            "COMPANY_CONTEXT_REQUIRED",
        });
      }
  
      const safePage =
        Math.max(
          1,
          toNumber(
            page,
            1
          )
        );
  
      const safePageSize =
        Math.min(
          100,
          Math.max(
            1,
            toNumber(
              pageSize,
              25
            )
          )
        );
  
      const allowedSortFields =
        new Set([
          "placedAt",
          "createdAt",
          "updatedAt",
          "orderNumber",
          "grandTotal",
          "orderStatus",
          "paymentStatus",
          "fulfillmentStatus",
        ]);
  
      const safeSortBy =
        allowedSortFields.has(
          sortBy
        )
          ? sortBy
          : "placedAt";
  
      const safeSortDirection =
        cleanUpper(
          sortDirection
        ) ===
        "ASC"
          ? "ASC"
          : "DESC";
  
      const where =
        buildOrderWhere({
          companyId,
          search,
          orderStatus,
          paymentStatus,
          paymentMethod,
          fulfillmentStatus,
          deliveryMethod,
          dateFrom,
          dateTo,
        });
  
      const {
        rows,
        count,
      } =
        await db.Order
          .findAndCountAll({
            where,
  
            limit:
              safePageSize,
  
            offset:
              (
                safePage -
                1
              ) *
              safePageSize,
  
            order: [
              [
                safeSortBy,
                safeSortDirection,
              ],
            ],
          });
  
      const totalPages =
        Math.max(
          1,
          Math.ceil(
            count /
              safePageSize
          )
        );
  
      return {
        rows:
          rows.map(
            serializeOrderListRow
          ),
  
        pagination: {
          page:
            safePage,
  
          pageSize:
            safePageSize,
  
          total:
            count,
  
          totalPages,
  
          hasPreviousPage:
            safePage > 1,
  
          hasNextPage:
            safePage <
            totalPages,
        },
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Load Order Related Records
  |--------------------------------------------------------------------------
  */
  
  const loadOrderItems =
    async ({
      companyId,
      orderId,
    }) => {
      if (!db.OrderItem) {
        return [];
      }
  
      return db.OrderItem
        .findAll({
          where: {
            companyId,
            orderId,
          },
  
          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],
        });
    };
  
  const loadOrderAddresses =
    async ({
      companyId,
      orderId,
    }) => {
      if (!db.OrderAddress) {
        return [];
      }
  
      return db.OrderAddress
        .findAll({
          where: {
            companyId,
            orderId,
          },
  
          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],
        });
    };
  
  const loadOrderPayments =
    async ({
      companyId,
      orderId,
    }) => {
      if (!db.OrderPayment) {
        return [];
      }
  
      return db.OrderPayment
        .findAll({
          where: {
            companyId,
            orderId,
          },
  
          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],
        });
    };
  
  const loadStatusHistory =
    async ({
      companyId,
      orderId,
    }) => {
      if (
        !db.OrderStatusHistory
      ) {
        return [];
      }
  
      return db.OrderStatusHistory
        .findAll({
          where: {
            companyId,
            orderId,
          },
  
          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],
        });
    };
  
  const loadWebhookLogs =
    async ({
      companyId,
      orderId,
    }) => {
      if (
        !db.PaymentWebhookLog
      ) {
        return [];
      }
  
      return db.PaymentWebhookLog
        .findAll({
          where: {
            companyId,
            orderId,
          },
  
          order: [
            [
              "receivedAt",
              "DESC",
            ],
            [
              "createdAt",
              "DESC",
            ],
          ],
        });
    };
  
  const loadCustomer =
    async (
      order
    ) => {
      if (
        !order.customerId ||
        !db.Customer
      ) {
        return null;
      }
  
      return db.Customer
        .findByPk(
          order.customerId
        );
    };
  
  
/*
|--------------------------------------------------------------------------
| Fulfillment Detail
|--------------------------------------------------------------------------
*/

const loadFulfillmentDetail =
  async ({
    companyId,
    orderId,
    items,
  }) => {
    if (
      !db.OrderShipment ||
      !db.OrderShipmentItem
    ) {
      return items;
    }

    const shipments =
      await db.OrderShipment.findAll({
        where: {
          companyId,
          orderId,
        },

        order: [
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    if (
      !shipments.length
    ) {
      return items;
    }

    const shipmentIds =
      shipments.map(
        shipment =>
          shipment.id
      );

    const shipmentItems =
      await db.OrderShipmentItem.findAll({
        where: {
          companyId,

          orderShipmentId: {
            [Op.in]:
              shipmentIds,
          },
        },

        order: [
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    const shipmentItemIds =
      shipmentItems.map(
        row =>
          row.id
      );

    const allocations =
      (
        shipmentItemIds.length &&
        db.OrderShipmentAllocation
      )
        ? await db.OrderShipmentAllocation.findAll({
            where: {
              companyId,

              orderShipmentItemId: {
                [Op.in]:
                  shipmentItemIds,
              },
            },

            order: [
              [
                "createdAt",
                "ASC",
              ],
            ],
          })
        : [];

    const locationIds =
      Array.from(
        new Set(
          allocations
            .map(
              row =>
                row.inventoryLocationId
            )
            .filter(
              Boolean
            )
        )
      );

    const locations =
      (
        locationIds.length &&
        db.InventoryLocation
      )
        ? await db.InventoryLocation.findAll({
            where: {
              companyId,

              id: {
                [Op.in]:
                  locationIds,
              },
            },
          })
        : [];

    const shipmentById =
      new Map(
        shipments.map(
          row => [
            String(
              row.id
            ),
            row,
          ]
        )
      );

    const locationById =
      new Map(
        locations.map(
          row => [
            String(
              row.id
            ),
            row,
          ]
        )
      );

    const shipmentItemsByOrderItem =
      new Map();

    for (
      const row of
      shipmentItems
    ) {
      const key =
        String(
          row.orderItemId
        );

      if (
        !shipmentItemsByOrderItem.has(
          key
        )
      ) {
        shipmentItemsByOrderItem.set(
          key,
          []
        );
      }

      shipmentItemsByOrderItem
        .get(
          key
        )
        .push(
          row
        );
    }

    const allocationsByShipmentItem =
      new Map();

    for (
      const row of
      allocations
    ) {
      const key =
        String(
          row.orderShipmentItemId
        );

      if (
        !allocationsByShipmentItem.has(
          key
        )
      ) {
        allocationsByShipmentItem.set(
          key,
          []
        );
      }

      allocationsByShipmentItem
        .get(
          key
        )
        .push(
          row
        );
    }

    return items.map(
      item => {
        const plainItem =
          item.toJSON
            ? item.toJSON()
            : item;

        const relatedShipmentItems =
          shipmentItemsByOrderItem.get(
            String(
              item.id
            )
          ) ||
          [];

        let shipment =
          null;

        let allocation =
          null;

        let location =
          null;

        for (
          const shipmentItem of
          relatedShipmentItems
        ) {
          shipment =
            shipmentById.get(
              String(
                shipmentItem.orderShipmentId
              )
            ) ||
            null;

          const relatedAllocations =
            allocationsByShipmentItem.get(
              String(
                shipmentItem.id
              )
            ) ||
            [];

          allocation =
            relatedAllocations.find(
              row =>
                ![
                  "RELEASED",
                  "CANCELLED",
                ].includes(
                  cleanUpper(
                    row.status
                  )
                )
            ) ||
            relatedAllocations[0] ||
            null;

          if (
            allocation
              ?.inventoryLocationId
          ) {
            location =
              locationById.get(
                String(
                  allocation.inventoryLocationId
                )
              ) ||
              null;
          }

          if (
            shipment
          ) {
            break;
          }
        }

        const method =
          cleanUpper(
            item.selectedDeliveryMethod ||
            shipment
              ?.deliveryMethod ||
            "STANDARD"
          );

        const fulfillmentLabel =
          shipment
            ?.deliveryLabel ||
          (
            method ===
              "PICKUP"
              ? (
                  location
                    ?.name
                    ? `Store Pickup - ${location.name}`
                    : "Store Pickup"
                )
              : (
                  method ===
                    "EXPRESS"
                    ? "Express Delivery"
                    : "Standard Delivery"
                )
          );

        return {
          ...plainItem,

          selectedDeliveryMethod:
            method,

          fulfillmentMethod:
            method,

          fulfillmentLabel,

          deliveryLabel:
            shipment
              ?.deliveryLabel ||
            null,

          shipmentId:
            shipment
              ?.id ||
            null,

          shipmentNumber:
            shipment
              ?.shipmentNumber ||
            null,

          shipmentStatus:
            shipment
              ?.status ||
            null,

          deliveryHours:
            shipment
              ?.deliveryHours ??
            null,

          pickupLocationId:
            method ===
              "PICKUP"
              ? (
                  location
                    ?.id ||
                  item
                    .selectedPickupLocationId ||
                  null
                )
              : null,

          pickupLocationCode:
            method ===
              "PICKUP"
              ? (
                  location
                    ?.code ||
                  null
                )
              : null,

          pickupLocationName:
            method ===
              "PICKUP"
              ? (
                  location
                    ?.name ||
                  null
                )
              : null,

          allocatedLocationId:
            location
              ?.id ||
            null,

          allocatedLocationCode:
            location
              ?.code ||
            null,

          allocatedLocationName:
            location
              ?.name ||
            null,
        };
      }
    );
  };

/*
  |--------------------------------------------------------------------------
  | Get Admin Order Detail
  |--------------------------------------------------------------------------
  */
  
  const getAdminOrderDetail =
    async ({
      companyId,
      orderId,
    }) => {
      if (!companyId) {
        throw createServiceError({
          message:
            "companyId is required.",
          statusCode:
            401,
          code:
            "COMPANY_CONTEXT_REQUIRED",
        });
      }
  
      if (!orderId) {
        throw createServiceError({
          message:
            "orderId is required.",
          code:
            "ORDER_ID_REQUIRED",
        });
      }
  
      const order =
        await db.Order
          .findOne({
            where: {
              id:
                orderId,
  
              companyId,
            },
          });
  
      if (!order) {
        throw createServiceError({
          message:
            "Order was not found.",
          statusCode:
            404,
          code:
            "ORDER_NOT_FOUND",
        });
      }
  
      const [
        items,
        addresses,
        payments,
        statusHistory,
        webhookLogs,
        customer,
      ] =
        await Promise.all([
          loadOrderItems({
            companyId,
            orderId:
              order.id,
          }),
  
          loadOrderAddresses({
            companyId,
            orderId:
              order.id,
          }),
  
          loadOrderPayments({
            companyId,
            orderId:
              order.id,
          }),
  
          loadStatusHistory({
            companyId,
            orderId:
              order.id,
          }),
  
          loadWebhookLogs({
            companyId,
            orderId:
              order.id,
          }),
  
          loadCustomer(
            order
          ),
        ]);
  
      const enrichedItems =

  
        await loadFulfillmentDetail({

  
          companyId,

  
          orderId:

  
            order.id,

  
          items,

  
        });


  
      return {

  
        order,


  
        customer,


  
        items:

  
          enrichedItems,


  
        addresses,
  
        payments,
  
        statusHistory,
  
        webhookLogs,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Validate Status
  |--------------------------------------------------------------------------
  */
  
  const validateEnumStatus = ({
    Model,
    field,
    value,
  }) => {
    const normalized =
      cleanUpper(value);
  
    if (!normalized) {
      return null;
    }
  
    const allowedValues =
      getEnumValues(
        Model,
        field
      );
  
    /*
     * If Sequelize field is not ENUM,
     * don't invent restrictions here.
     */
    if (
      allowedValues.length &&
      !allowedValues.includes(
        normalized
      )
    ) {
      throw createServiceError({
        message:
          `${field} must be one of: ${allowedValues.join(
            ", "
          )}.`,
  
        code:
          `INVALID_${field.toUpperCase()}`,
      });
    }
  
    return normalized;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Update Admin Order Status
  |--------------------------------------------------------------------------
  |
  | Payment status is intentionally NOT manually editable here.
  |
  | CARD / TAMARA payment status must be controlled by their payment flows.
  |--------------------------------------------------------------------------
  */
  
  const updateAdminOrderStatus =
    async ({
      companyId,
      orderId,
  
      orderStatus,
  
      fulfillmentStatus,
  
      note,
  
      changedBy,
    }) => {
      if (!companyId) {
        throw createServiceError({
          message:
            "companyId is required.",
          statusCode:
            401,
          code:
            "COMPANY_CONTEXT_REQUIRED",
        });
      }
  
      if (!orderId) {
        throw createServiceError({
          message:
            "orderId is required.",
          code:
            "ORDER_ID_REQUIRED",
        });
      }
  
      const normalizedOrderStatus =
        validateEnumStatus({
          Model:
            db.Order,
  
          field:
            "orderStatus",
  
          value:
            orderStatus,
        });
  
      const normalizedFulfillmentStatus =
        validateEnumStatus({
          Model:
            db.Order,
  
          field:
            "fulfillmentStatus",
  
          value:
            fulfillmentStatus,
        });
  
      if (
        !normalizedOrderStatus &&
        !normalizedFulfillmentStatus
      ) {
        throw createServiceError({
          message:
            "Provide orderStatus or fulfillmentStatus.",
          code:
            "NO_STATUS_CHANGE_REQUESTED",
        });
      }
  
      return db.sequelize
        .transaction(
          async (
            transaction
          ) => {
            const order =
              await db.Order
                .findOne({
                  where: {
                    id:
                      orderId,
  
                    companyId,
                  },
  
                  transaction,
  
                  lock:
                    transaction
                      .LOCK
                      .UPDATE,
                });
  
            if (!order) {
              throw createServiceError({
                message:
                  "Order was not found.",
                statusCode:
                  404,
                code:
                  "ORDER_NOT_FOUND",
              });
            }
  
            const updateValues =
              {};
  
            const historyRows =
              [];
  
            if (
              normalizedOrderStatus &&
              normalizedOrderStatus !==
                order.orderStatus
            ) {
              historyRows.push({
                companyId,
  
                orderId:
                  order.id,
  
                statusType:
                  "ORDER",
  
                fromStatus:
                  order.orderStatus ||
                  null,
  
                toStatus:
                  normalizedOrderStatus,
  
                note:
                  clean(note) ||
                  "Order status updated from Admin.",
  
                changedBy:
                  changedBy ||
                  null,
              });
  
              updateValues.orderStatus =
                normalizedOrderStatus;
            }
  
            if (
              normalizedFulfillmentStatus &&
              normalizedFulfillmentStatus !==
                order.fulfillmentStatus
            ) {
              historyRows.push({
                companyId,
  
                orderId:
                  order.id,
  
                statusType:
                  "FULFILLMENT",
  
                fromStatus:
                  order.fulfillmentStatus ||
                  null,
  
                toStatus:
                  normalizedFulfillmentStatus,
  
                note:
                  clean(note) ||
                  "Fulfillment status updated from Admin.",
  
                changedBy:
                  changedBy ||
                  null,
              });
  
              updateValues.fulfillmentStatus =
                normalizedFulfillmentStatus;
            }
  
            if (
              !Object.keys(
                updateValues
              ).length
            ) {
              return order;
            }
  
            await order.update(
              updateValues,
              {
                transaction,
              }
            );
  
            if (
              historyRows.length
            ) {
              await db.OrderStatusHistory
                .bulkCreate(
                  historyRows,
                  {
                    transaction,
                  }
                );
            }
  
            return order;
          }
        );
    };
  


/*
|--------------------------------------------------------------------------
| Shipment Status Helpers
|--------------------------------------------------------------------------
*/

const SHIPMENT_STATUS_TRANSITIONS = {
  PENDING: [
    "READY",
  ],

  ALLOCATED: [
    "READY",
  ],

  READY: [
    "DISPATCHED",
    "DELIVERED",
  ],

  DISPATCHED: [
    "DELIVERED",
  ],

  DELIVERED: [],

  CANCELLED: [],
};

const getOverallFulfillmentStatus =
  (
    shipments
  ) => {
    const activeShipments =
      shipments.filter(
        shipment =>
          cleanUpper(
            shipment.status
          ) !==
          "CANCELLED"
      );

    if (
      !activeShipments.length
    ) {
      return shipments.length
        ? "CANCELLED"
        : "UNFULFILLED";
    }

    const deliveredCount =
      activeShipments.filter(
        shipment =>
          cleanUpper(
            shipment.status
          ) ===
          "DELIVERED"
      ).length;

    if (
      deliveredCount ===
      activeShipments.length
    ) {
      return "FULFILLED";
    }

    if (
      deliveredCount >
      0
    ) {
      return "PARTIALLY_FULFILLED";
    }

    return "UNFULFILLED";
  };

const queueShipmentNotification =
  async ({
    order,
    shipment,
    status,
  }) => {
    if (
      !db.EmailNotificationQueue ||
      typeof queueOrderNotification !==
        "function"
    ) {
      return;
    }

    const method =
      cleanUpper(
        shipment.deliveryMethod
      );

    let notificationType =
      null;

    if (
      status ===
        "READY" &&
      method ===
        "PICKUP"
    ) {
      notificationType =
        "READY_FOR_PICKUP";
    } else if (
      status ===
      "DISPATCHED"
    ) {
      notificationType =
        "ORDER_DISPATCHED";
    } else if (
      status ===
        "DELIVERED" &&
      cleanUpper(
        order.fulfillmentStatus
      ) ===
        "FULFILLED"
    ) {
      notificationType =
        "ORDER_DELIVERED";
    }

    if (
      !notificationType
    ) {
      return;
    }

    try {
      await queueOrderNotification({
        companyId:
          order.companyId,

        orderId:
          order.id,

        notificationType,
      });
    } catch (
      error
    ) {
      console.error(
        "[Admin Orders] Unable to queue shipment notification:",
        {
          orderId:
            order.id,

          shipmentId:
            shipment.id,

          status,

          notificationType,

          error:
            error
              ?.message ||
            String(
              error
            ),
        }
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Update Shipment Status
|--------------------------------------------------------------------------
|
| Delivery:
|   PENDING / ALLOCATED -> READY -> DISPATCHED -> DELIVERED
|
| Pickup:
|   PENDING / ALLOCATED -> READY -> DELIVERED
|
| The Order.fulfillmentStatus is recalculated automatically from all
| shipment statuses. It must not be manually guessed in the browser.
|--------------------------------------------------------------------------
*/

const updateAdminShipmentStatus =
  async ({
    companyId,
    orderId,
    shipmentId,
    status,
    note,
    changedBy,
  }) => {
    if (
      !companyId
    ) {
      throw createServiceError({
        message:
          "companyId is required.",

        statusCode:
          401,

        code:
          "COMPANY_CONTEXT_REQUIRED",
      });
    }

    if (
      !orderId
    ) {
      throw createServiceError({
        message:
          "orderId is required.",

        code:
          "ORDER_ID_REQUIRED",
      });
    }

    if (
      !shipmentId
    ) {
      throw createServiceError({
        message:
          "shipmentId is required.",

        code:
          "SHIPMENT_ID_REQUIRED",
      });
    }

    const normalizedStatus =
      validateEnumStatus({
        Model:
          db.OrderShipment,

        field:
          "status",

        value:
          status,
      });

    if (
      !normalizedStatus
    ) {
      throw createServiceError({
        message:
          "Shipment status is required.",

        code:
          "SHIPMENT_STATUS_REQUIRED",
      });
    }

    let notificationContext =
      null;

    await db.sequelize
      .transaction(
        async (
          transaction
        ) => {
          const order =
            await db.Order.findOne({
              where: {
                id:
                  orderId,

                companyId,
              },

              transaction,

              lock:
                transaction
                  .LOCK
                  .UPDATE,
            });

          if (
            !order
          ) {
            throw createServiceError({
              message:
                "Order was not found.",

              statusCode:
                404,

              code:
                "ORDER_NOT_FOUND",
            });
          }

          const shipment =
            await db.OrderShipment.findOne({
              where: {
                id:
                  shipmentId,

                orderId:
                  order.id,

                companyId,
              },

              transaction,

              lock:
                transaction
                  .LOCK
                  .UPDATE,
            });

          if (
            !shipment
          ) {
            throw createServiceError({
              message:
                "Shipment was not found for this order.",

              statusCode:
                404,

              code:
                "SHIPMENT_NOT_FOUND",
            });
          }

          const currentStatus =
            cleanUpper(
              shipment.status
            );

          if (
            currentStatus ===
            normalizedStatus
          ) {
            notificationContext = {
              order,
              shipment,
              status:
                normalizedStatus,
              changed:
                false,
            };

            return;
          }

          const method =
            cleanUpper(
              shipment.deliveryMethod
            );

          const allowedNext =
            SHIPMENT_STATUS_TRANSITIONS[
              currentStatus
            ] ||
            [];

          /*
           * Pickup has no DISPATCHED step.
           * READY -> DELIVERED means "Collected".
           */
          if (
            method ===
              "PICKUP" &&
            normalizedStatus ===
              "DISPATCHED"
          ) {
            throw createServiceError({
              message:
                "Store Pickup shipments cannot be marked DISPATCHED. Mark the shipment DELIVERED when the customer collects it.",

              statusCode:
                409,

              code:
                "INVALID_PICKUP_SHIPMENT_STATUS",
            });
          }

          if (
            !allowedNext.includes(
              normalizedStatus
            )
          ) {
            throw createServiceError({
              message:
                `Shipment status cannot change from ${currentStatus} to ${normalizedStatus}.`,

              statusCode:
                409,

              code:
                "INVALID_SHIPMENT_STATUS_TRANSITION",
            });
          }

          await shipment.update(
            {
              status:
                normalizedStatus,
            },
            {
              transaction,
            }
          );

          /*
           * Once delivered/collected, the physical reservation is fulfilled.
           */
          if (
            normalizedStatus ===
              "DELIVERED" &&
            db.OrderShipmentAllocation
          ) {
            const shipmentItems =
              await db.OrderShipmentItem.findAll({
                where: {
                  companyId,

                  orderShipmentId:
                    shipment.id,
                },

                attributes: [
                  "id",
                ],

                transaction,
              });

            const shipmentItemIds =
              shipmentItems.map(
                row =>
                  row.id
              );

            if (
              shipmentItemIds.length
            ) {
              const allocations =
                await db.OrderShipmentAllocation.findAll({
                  where: {
                    companyId,

                    orderShipmentItemId: {
                      [Op.in]:
                        shipmentItemIds,
                    },
                  },

                  transaction,

                  lock:
                    transaction
                      .LOCK
                      .UPDATE,
                });

              for (
                const allocation of
                allocations
              ) {
                if (
                  [
                    "CANCELLED",
                    "RELEASED",
                  ].includes(
                    cleanUpper(
                      allocation.status
                    )
                  )
                ) {
                  continue;
                }

                const values = {
                  status:
                    "FULFILLED",
                };

                if (
                  hasAttribute(
                    db.OrderShipmentAllocation,
                    "quantityFulfilled"
                  )
                ) {
                  values.quantityFulfilled =
                    allocation.quantityAllocated;
                }

                await allocation.update(
                  values,
                  {
                    transaction,
                  }
                );
              }
            }
          }

          const shipments =
            await db.OrderShipment.findAll({
              where: {
                companyId,

                orderId:
                  order.id,
              },

              transaction,
            });

          const nextFulfillmentStatus =
            getOverallFulfillmentStatus(
              shipments
            );

          const previousFulfillmentStatus =
            cleanUpper(
              order.fulfillmentStatus
            );

          if (
            nextFulfillmentStatus !==
            previousFulfillmentStatus
          ) {
            await order.update(
              {
                fulfillmentStatus:
                  nextFulfillmentStatus,
              },
              {
                transaction,
              }
            );
          }

          if (
            db.OrderStatusHistory
          ) {
            const shipmentLabel =
              shipment.deliveryLabel ||
              shipment.shipmentNumber ||
              shipment.id;

            const actionLabel =
              method ===
                "PICKUP" &&
              normalizedStatus ===
                "READY"
                ? "Ready for Pickup"
                : (
                    method ===
                      "PICKUP" &&
                    normalizedStatus ===
                      "DELIVERED"
                      ? "Collected"
                      : normalizedStatus
                  );

            await db.OrderStatusHistory.create(
              {
                companyId,

                orderId:
                  order.id,

                statusType:
                  "FULFILLMENT",

                fromStatus:
                  currentStatus,

                toStatus:
                  normalizedStatus,

                note:
                  clean(
                    note
                  ) ||
                  `${shipmentLabel}: ${actionLabel}.`,

                changedBy:
                  changedBy ||
                  null,
              },
              {
                transaction,
              }
            );
          }

          notificationContext = {
            order,
            shipment,
            status:
              normalizedStatus,
            changed:
              true,
          };
        }
      );

    if (
      notificationContext
        ?.changed
    ) {
      await notificationContext
        .order
        .reload();

      await notificationContext
        .shipment
        .reload();

      await queueShipmentNotification({
        order:
          notificationContext
            .order,

        shipment:
          notificationContext
            .shipment,

        status:
          notificationContext
            .status,
      });
    }

    return getAdminOrderDetail({
      companyId,
      orderId,
    });
  };

  
/*
|--------------------------------------------------------------------------
| Retry Zoho Sales Order
|--------------------------------------------------------------------------
*/

const retryZohoSalesOrder =
  async ({
    companyId,
    orderId,
    changedBy,
  }) => {
    if (
      !companyId
    ) {
      throw createServiceError({
        message:
          "companyId is required.",

        statusCode:
          401,

        code:
          "COMPANY_CONTEXT_REQUIRED",
      });
    }

    if (
      !orderId
    ) {
      throw createServiceError({
        message:
          "orderId is required.",

        code:
          "ORDER_ID_REQUIRED",
      });
    }

    const order =
      await db.Order.findOne({
        where: {
          id:
            orderId,

          companyId,
        },
      });

    if (
      !order
    ) {
      throw createServiceError({
        message:
          "Order was not found.",

        statusCode:
          404,

        code:
          "ORDER_NOT_FOUND",
      });
    }

    if (
      order.zohoSalesOrderId
    ) {
      return {
        alreadyPosted:
          true,

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        zohoSalesOrderId:
          order.zohoSalesOrderId,

        zohoSalesOrderNumber:
          order.zohoSalesOrderNumber,

        zohoSyncStatus:
          order.zohoSyncStatus,

        message:
          "This order has already been posted to Zoho.",
      };
    }

    if (
      cleanUpper(
        order.paymentStatus
      ) !==
      "PAID"
    ) {
      throw createServiceError({
        message:
          "Only PAID orders can be pushed to Zoho.",

        statusCode:
          409,

        code:
          "ORDER_NOT_PAID",
      });
    }

    if (
      cleanUpper(
        order.orderStatus
      ) !==
      "CONFIRMED"
    ) {
      throw createServiceError({
        message:
          "Only CONFIRMED orders can be pushed to Zoho.",

        statusCode:
          409,

        code:
          "ORDER_NOT_CONFIRMED",
      });
    }

    const result =
      await zohoSalesOrderService
        .createZohoSalesOrder({
          orderId:
            order.id,
        });

    if (
      db.OrderStatusHistory
    ) {
      await db.OrderStatusHistory.create({
        companyId,

        orderId:
          order.id,

        statusType:
          "ORDER",

        fromStatus:
          order.orderStatus,

        toStatus:
          order.orderStatus,

        note:
          result
            ?.alreadyPosted
            ? "Zoho Sales Order retry requested from Admin; order was already posted."
            : `Zoho Sales Order manually re-pushed from Admin${
                result
                  ?.zohoSalesOrderNumber
                  ? ` as ${result.zohoSalesOrderNumber}`
                  : ""
              }.`,

        changedBy:
          changedBy ||
          null,
      });
    }

    return {
      ...result,

      zohoSyncStatus:
        "POSTED",

      message:
        result
          ?.alreadyPosted
          ? "This order was already posted to Zoho."
          : "Zoho Sales Order posted successfully.",
    };
  };

/*
  |--------------------------------------------------------------------------
  | Dashboard Counts
  |--------------------------------------------------------------------------
  */
  
  const getAdminOrderSummary =
    async ({
      companyId,
    }) => {
      if (!companyId) {
        throw createServiceError({
          message:
            "companyId is required.",
          statusCode:
            401,
          code:
            "COMPANY_CONTEXT_REQUIRED",
        });
      }
  
      const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        paidOrders,
        unfulfilledOrders,
        tamaraOrders,
      ] =
        await Promise.all([
          db.Order.count({
            where: {
              companyId,
            },
          }),
  
          db.Order.count({
            where: {
              companyId,
              orderStatus:
                "PENDING",
            },
          }),
  
          db.Order.count({
            where: {
              companyId,
              orderStatus:
                "CONFIRMED",
            },
          }),
  
          db.Order.count({
            where: {
              companyId,
              paymentStatus:
                "PAID",
            },
          }),
  
          db.Order.count({
            where: {
              companyId,
              fulfillmentStatus:
                "UNFULFILLED",
            },
          }),
  
          db.Order.count({
            where: {
              companyId,
              paymentMethod:
                "TAMARA",
            },
          }),
        ]);
  
      return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        paidOrders,
        unfulfilledOrders,
        tamaraOrders,
      };
    };
  
  module.exports = {
    listAdminOrders,
    getAdminOrderDetail,
    updateAdminOrderStatus,
    getAdminOrderSummary,
    retryZohoSalesOrder,
    updateAdminShipmentStatus,
    
  };