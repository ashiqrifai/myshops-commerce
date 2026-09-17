const db =
  require(
    "../models"
  );

const AppError =
  require(
    "../utils/AppError"
  );

const deliveryEligibilityService =
  require(
    "./deliveryEligibility.service"
  );

const toNumber = (
  value
) => {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

/*
|--------------------------------------------------------------------------
| Find Order Item
|--------------------------------------------------------------------------
|
| Delivery plan operates using productVariantId.
|
| We need to connect each allocation back to the actual OrderItem.
|--------------------------------------------------------------------------
*/

const findOrderItem =
  (
    orderItems,
    productVariantId
  ) => {
    return (
      orderItems.find(
        item =>
          String(
            item.productVariantId
          ) ===
          String(
            productVariantId
          )
      ) ||
      null
    );
  };

/*
|--------------------------------------------------------------------------
| Reserve One Inventory Allocation
|--------------------------------------------------------------------------
|
| SELECT ... FOR UPDATE protects this balance while we reserve it.
|--------------------------------------------------------------------------
*/

const reserveAllocation =
  async ({
    companyId,
    allocation,
    transaction,
  }) => {
    const balance =
      await db.InventoryBalance.findOne({
        where: {
          companyId,

          inventoryLocationId:
            allocation
              .inventoryLocationId,

          productVariantId:
            allocation
              .productVariantId,
        },

        transaction,

        lock:
          transaction
            .LOCK
            .UPDATE,
      });

    if (!balance) {
      throw new AppError(
        `Inventory balance no longer exists for SKU ${allocation.sku}.`,
        409,
        "DELIVERY_PLAN_STALE"
      );
    }

    const quantityOnHand =
      toNumber(
        balance
          .quantityOnHand
      );

    const quantityReserved =
      toNumber(
        balance
          .quantityReserved
      );

    const available =
      Math.max(
        0,
        quantityOnHand -
          quantityReserved
      );

    const requiredQuantity =
      toNumber(
        allocation
          .quantity
      );

    if (
      available <
      requiredQuantity
    ) {
      throw new AppError(
        `Available stock changed for SKU ${allocation.sku}. Required ${requiredQuantity}, available ${available}.`,
        409,
        "DELIVERY_PLAN_STALE"
      );
    }

    const newReserved =
      quantityReserved +
      requiredQuantity;

    await balance.update(
      {
        quantityReserved:
          newReserved,
      },
      {
        transaction,
      }
    );

    return {
      balance,

      quantityOnHand,

      quantityReservedBefore:
        quantityReserved,

      quantityReservedAfter:
        newReserved,

      quantityAllocated:
        requiredQuantity,
    };
  };

/*
|--------------------------------------------------------------------------
| Create Shipment
|--------------------------------------------------------------------------
*/

const createShipment =
  async ({
    companyId,
    order,
    cityCode,
    shipmentPlan,
    shipmentIndex,
    orderItems,
    transaction,
  }) => {
    const shipmentNumber =
      `${order.orderNumber}-S${shipmentIndex + 1}`;

    const shipment =
      await db.OrderShipment.create(
        {
          companyId,

          orderId:
            order.id,

          deliveryZoneId:
            shipmentPlan
              .deliveryZoneId ||
            null,

          shipmentNumber,

          deliveryZoneCode:
            shipmentPlan
              .deliveryZoneCode ||
            null,

          deliveryLabel:
            shipmentPlan
              .deliveryLabel ||
            null,

          deliveryMethod:
            shipmentPlan
              .deliveryMethod,

          deliveryHours:
            shipmentPlan
              .deliveryHours ??
            null,

          deliveryMinDays:
            shipmentPlan
              .deliveryMinDays ??
            null,

          deliveryMaxDays:
            shipmentPlan
              .deliveryMaxDays ??
            null,

          deliveryAmount:
            toNumber(
              shipmentPlan
                .deliveryAmount
            ),

          cityCode,

          status:
            "ALLOCATED",
        },
        {
          transaction,
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Group allocations by OrderItem
    |--------------------------------------------------------------------------
    |
    | One order item can be allocated from:
    |
    | WAFI 9
    | DCC  13
    |
    | but we only need one OrderShipmentItem for the SKU in this shipment.
    |--------------------------------------------------------------------------
    */

    const allocationGroups =
      new Map();

    for (
      const allocation of
      shipmentPlan
        .allocations ||
      []
    ) {
      const orderItem =
        findOrderItem(
          orderItems,
          allocation
            .productVariantId
        );

      if (!orderItem) {
        throw new AppError(
          `Order item was not found for SKU ${allocation.sku}.`,
          500,
          "ORDER_ITEM_NOT_FOUND"
        );
      }

      const key =
        orderItem.id;

      if (
        !allocationGroups.has(
          key
        )
      ) {
        allocationGroups.set(
          key,
          {
            orderItem,

            allocations:
              [],
          }
        );
      }

      allocationGroups
        .get(
          key
        )
        .allocations
        .push(
          allocation
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Shipment Items + Allocations
    |--------------------------------------------------------------------------
    */

    for (
      const group of
      allocationGroups.values()
    ) {
      const orderItem =
        group.orderItem;

      const shipmentItemQuantity =
        group.allocations.reduce(
          (
            total,
            allocation
          ) =>
            total +
            toNumber(
              allocation
                .quantity
            ),
          0
        );

      const shipmentItem =
        await db.OrderShipmentItem.create(
          {
            companyId,

            orderShipmentId:
              shipment.id,

            orderItemId:
              orderItem.id,

            productVariantId:
              orderItem
                .productVariantId,

            sku:
              orderItem.sku,

            quantity:
              shipmentItemQuantity,
          },
          {
            transaction,
          }
        );

      /*
      |--------------------------------------------------------------------------
      | Physical Inventory Allocations
      |--------------------------------------------------------------------------
      */

      for (
        const allocation of
        group.allocations
      ) {
        /*
         * Lock and reserve actual inventory first.
         */
        await reserveAllocation({
          companyId,

          allocation,

          transaction,
        });

        await db.OrderShipmentAllocation.create(
          {
            companyId,

            orderShipmentId:
              shipment.id,

            orderShipmentItemId:
              shipmentItem.id,

            inventoryLocationId:
              allocation
                .inventoryLocationId,

            productVariantId:
              allocation
                .productVariantId,

            quantityAllocated:
              toNumber(
                allocation
                  .quantity
              ),

            quantityFulfilled:
              0,

            status:
              "RESERVED",
          },
          {
            transaction,
          }
        );
      }
    }

    return shipment;
  };

/*
|--------------------------------------------------------------------------
| Create Direct Delivery Shipment
|--------------------------------------------------------------------------
|
| Direct-delivery products don't reserve InventoryBalance.
|--------------------------------------------------------------------------
*/

const createDirectDeliveryShipment =
  async ({
    companyId,
    order,
    cityCode,
    items,
    orderItems,
    sequenceNumber,
    transaction,
  }) => {
    if (
      !Array.isArray(
        items
      ) ||
      items.length ===
        0
    ) {
      return null;
    }

    const shipment =
      await db.OrderShipment.create(
        {
          companyId,

          orderId:
            order.id,

          deliveryZoneId:
            null,

          shipmentNumber:
            `${order.orderNumber}-S${sequenceNumber}`,

          deliveryZoneCode:
            "DIRECT_DELIVERY",

          deliveryLabel:
            "Direct Delivery",

          deliveryMethod:
            "DIRECT_DELIVERY",

          deliveryHours:
            null,

          deliveryMinDays:
            null,

          deliveryMaxDays:
            null,

          deliveryAmount:
            0,

          cityCode,

          status:
            "ALLOCATED",
        },
        {
          transaction,
        }
      );

    for (
      const item of
      items
    ) {
      const orderItem =
        findOrderItem(
          orderItems,
          item.productVariantId
        );

      if (!orderItem) {
        throw new AppError(
          `Order item was not found for direct-delivery SKU ${item.sku || ""}.`,
          500,
          "ORDER_ITEM_NOT_FOUND"
        );
      }

      await db.OrderShipmentItem.create(
        {
          companyId,

          orderShipmentId:
            shipment.id,

          orderItemId:
            orderItem.id,

          productVariantId:
            orderItem
              .productVariantId,

          sku:
            orderItem.sku,

          quantity:
            toNumber(
              item.quantity
            ),
        },
        {
          transaction,
        }
      );
    }

    return shipment;
  };

  /*
|--------------------------------------------------------------------------
| Create Always Available Standard Shipment
|--------------------------------------------------------------------------
|
| Always Available products can be sold even when physical inventory does
| not satisfy the requested quantity.
|
| IMPORTANT:
|
| - This creates OrderShipment + OrderShipmentItem records.
| - It does NOT create OrderShipmentAllocation records.
| - It does NOT reserve InventoryBalance.
| - Delivery method remains STANDARD.
|--------------------------------------------------------------------------
*/

const createAlwaysAvailableShipment =
async ({
  companyId,
  order,
  cityCode,
  items,
  orderItems,
  sequenceNumber,
  transaction,
}) => {
  if (
    !Array.isArray(
      items
    ) ||
    items.length ===
      0
  ) {
    return null;
  }

  const shipment =
    await db.OrderShipment.create(
      {
        companyId,

        orderId:
          order.id,

        deliveryZoneId:
          null,

        shipmentNumber:
          `${order.orderNumber}-S${sequenceNumber}`,

        deliveryZoneCode:
          "ALWAYS_AVAILABLE_STANDARD",

        deliveryLabel:
          "Standard Delivery",

        deliveryMethod:
          "STANDARD",

        deliveryHours:
          null,

        deliveryMinDays:
          null,

        deliveryMaxDays:
          null,

        deliveryAmount:
          0,

        cityCode,

        status:
          "ALLOCATED",
      },
      {
        transaction,
      }
    );

  for (
    const item of
    items
  ) {
    const orderItem =
      findOrderItem(
        orderItems,
        item.productVariantId
      );

    if (!orderItem) {
      throw new AppError(
        `Order item was not found for always-available SKU ${item.sku || ""}.`,
        500,
        "ORDER_ITEM_NOT_FOUND"
      );
    }

    await db.OrderShipmentItem.create(
      {
        companyId,

        orderShipmentId:
          shipment.id,

        orderItemId:
          orderItem.id,

        productVariantId:
          orderItem
            .productVariantId,

        sku:
          orderItem.sku,

        quantity:
          toNumber(
            item.quantity
          ),
      },
      {
        transaction,
      }
    );
  }

  return shipment;
};

/*
|--------------------------------------------------------------------------
| Reserve Delivery Plan For Order
|--------------------------------------------------------------------------
*/

const reserveOrderDelivery =
  async ({
    order,
    cityCode,
    transaction,
  }) => {
    if (!order) {
      throw new AppError(
        "Order is required.",
        400,
        "ORDER_REQUIRED"
      );
    }

    const company =
      await db.Company.findByPk(
        order.companyId,
        {
          transaction,
        }
      );

    if (!company) {
      throw new AppError(
        "Company not found.",
        404,
        "COMPANY_NOT_FOUND"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Load Order Items
    |--------------------------------------------------------------------------
    */

    const orderItems =
      await db.OrderItem.findAll({
        where: {
          companyId:
            order.companyId,

          orderId:
            order.id,
        },

        transaction,
      });

    if (
      orderItems.length ===
      0
    ) {
      throw new AppError(
        "Order has no items.",
        400,
        "ORDER_ITEMS_REQUIRED"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Build Fresh Delivery Plan
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | We do not trust the delivery plan sent by the browser.
    |
    | The backend recalculates it from current InventoryBalance.
    |--------------------------------------------------------------------------
    */

    const plan =
      await deliveryEligibilityService
        .buildDeliveryPlan({
          companyCode:
            company.code,

          cityCode,

          items:
            orderItems.map(
              item => ({
                productVariantId:
                  item.productVariantId,

                quantity:
                  toNumber(
                    item.quantity
                  ),

                selectedDeliveryMethod:
                  item.selectedDeliveryMethod ||
                  "STANDARD",

                selectedPickupLocationId:
                  item.selectedPickupLocationId ||
                  null,
              })
            ),
        });

    /*
    |--------------------------------------------------------------------------
    | Reject Insufficient Stock
    |--------------------------------------------------------------------------
    */

    if (
      !plan.fullyFulfillable
    ) {
      throw new AppError(
        "One or more items are no longer available in the required quantity.",
        409,
        "ORDER_NOT_FULLY_FULFILLABLE"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Reservation
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Active Reservation
    |--------------------------------------------------------------------------
    |
    | Old CANCELLED / RELEASED shipment records may remain after a payment
    | reservation expires. They must not block late-payment recovery.
    |
    | Only an active RESERVED allocation prevents a new reservation.
    |--------------------------------------------------------------------------
    */

    const activeAllocation =
      await db.OrderShipmentAllocation.findOne({
        where: {
          companyId:
            order.companyId,

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
                order.companyId,

              orderId:
                order.id,
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
      throw new AppError(
        "Delivery stock has already been reserved for this order.",
        409,
        "ORDER_ALREADY_ALLOCATED"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Remove Previous Inactive Shipment Plan
    |--------------------------------------------------------------------------
    |
    | Late-payment recovery recalculates delivery using CURRENT stock.
    | Old released/cancelled shipment rows are removed before creating
    | the replacement plan. This also avoids shipmentNumber conflicts.
    |--------------------------------------------------------------------------
    */

    const oldShipments =
      await db.OrderShipment.findAll({
        where: {
          companyId:
            order.companyId,

          orderId:
            order.id,
        },

        attributes: [
          "id",
        ],

        transaction,

        lock:
          transaction
            .LOCK
            .UPDATE,
      });

    const oldShipmentIds =
      oldShipments.map(
        shipment =>
          shipment.id
      );

    if (
      oldShipmentIds.length >
      0
    ) {
      const oldShipmentItems =
        await db.OrderShipmentItem.findAll({
          where: {
            companyId:
              order.companyId,

            orderShipmentId:
              oldShipmentIds,
          },

          attributes: [
            "id",
          ],

          transaction,
        });

      const oldShipmentItemIds =
        oldShipmentItems.map(
          item =>
            item.id
        );

      if (
        oldShipmentItemIds.length >
        0
      ) {
        await db.OrderShipmentAllocation.destroy({
          where: {
            companyId:
              order.companyId,

            orderShipmentItemId:
              oldShipmentItemIds,
          },

          transaction,
        });
      }

      await db.OrderShipmentItem.destroy({
        where: {
          companyId:
            order.companyId,

          orderShipmentId:
            oldShipmentIds,
        },

        transaction,
      });

      await db.OrderShipment.destroy({
        where: {
          companyId:
            order.companyId,

          id:
            oldShipmentIds,
        },

        transaction,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Normal Shipments
    |--------------------------------------------------------------------------
    */

    const createdShipments =
      [];

    for (
      let index = 0;
      index <
      plan.shipments.length;
      index += 1
    ) {
      const shipment =
        await createShipment({
          companyId:
            order.companyId,

          order,

          cityCode:
            plan.cityCode,

          shipmentPlan:
            plan.shipments[
              index
            ],

          shipmentIndex:
            index,

          orderItems,

          transaction,
        });

      createdShipments.push(
        shipment
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Direct Delivery Shipment
    |--------------------------------------------------------------------------
    */

    if (
      plan.directDeliveryItems
        ?.length >
      0
    ) {
      const directShipment =
        await createDirectDeliveryShipment({
          companyId:
            order.companyId,

          order,

          cityCode:
            plan.cityCode,

          items:
            plan.directDeliveryItems,

          orderItems,

          sequenceNumber:
            createdShipments.length +
            1,

          transaction,
        });

      if (
        directShipment
      ) {
        createdShipments.push(
          directShipment
        );
      }
    }

    /*
|--------------------------------------------------------------------------
| Always Available Standard Shipment
|--------------------------------------------------------------------------
*/

if (
  plan.alwaysAvailableItems
    ?.length >
  0
) {
  const alwaysAvailableShipment =
    await createAlwaysAvailableShipment({
      companyId:
        order.companyId,

      order,

      cityCode:
        plan.cityCode,

      items:
        plan.alwaysAvailableItems,

      orderItems,

      sequenceNumber:
        createdShipments.length +
        1,

      transaction,
    });

  if (
    alwaysAvailableShipment
  ) {
    createdShipments.push(
      alwaysAvailableShipment
    );
  }
}

    /*
    |--------------------------------------------------------------------------
    | Set High-Level Order Delivery Method
    |--------------------------------------------------------------------------
    |
    | If any shipment is EXPRESS, keep order deliveryMethod as EXPRESS.
    |
    | Shipment records hold the real split detail.
    |--------------------------------------------------------------------------
    */

    const hasExpress =
      plan.shipments.some(
        shipment =>
          shipment
            .deliveryMethod ===
          "EXPRESS"
      );

    const hasPickup =
      plan.shipments.some(
        shipment =>
          shipment
            .deliveryMethod ===
          "PICKUP"
      );

      const hasDelivery =
      plan.shipments.some(
        shipment =>
          [
            "STANDARD",
            "EXPRESS",
          ].includes(
            shipment
              .deliveryMethod
          )
      ) ||
      (
        plan.directDeliveryItems
          ?.length >
        0
      ) ||
      (
        plan.alwaysAvailableItems
          ?.length >
        0
      );

    await order.update(
      {
        deliveryMethod:
          hasExpress
            ? "EXPRESS"
            : (
                hasPickup &&
                !hasDelivery
                  ? "PICKUP"
                  : "STANDARD"
              ),
      },
      {
        transaction,
      }
    );

    return {
      plan,

      shipmentIds:
        createdShipments.map(
          shipment =>
            shipment.id
        ),
    };
  };

module.exports = {
  reserveOrderDelivery,
};