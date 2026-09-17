const db =
  require(
    "../models"
  );

const AppError =
  require(
    "../utils/AppError"
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
| Load active allocations for an order
|--------------------------------------------------------------------------
*/

const getActiveAllocations =
  async ({
    companyId,
    orderId,
    transaction,
  }) => {
    return db.OrderShipmentAllocation.findAll({
      where: {
        companyId,

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
            companyId,

            orderId,
          },

          attributes: [
            "id",
            "shipmentNumber",
            "status",
          ],
        },

        {
          model:
            db.InventoryLocation,

          as:
            "inventoryLocation",

          required:
            true,

          attributes: [
            "id",
            "code",
            "name",
          ],
        },
      ],

      transaction,
    });
  };

/*
|--------------------------------------------------------------------------
| Release reservations
|--------------------------------------------------------------------------
|
| Used when:
|
| - payment fails
| - payment expires
| - payment is cancelled
| - order is cancelled
|--------------------------------------------------------------------------
*/

const releaseOrderReservations =
  async ({
    companyId,
    orderId,
    reason =
      "RESERVATION_RELEASED",
    allocationStatus =
      "RELEASED",
    shipmentStatus =
      null,
    transaction,
  }) => {
    if (
      !companyId ||
      !orderId
    ) {
      throw new AppError(
        "companyId and orderId are required.",
        400,
        "ORDER_RESERVATION_INPUT_REQUIRED"
      );
    }

    const allocations =
      await getActiveAllocations({
        companyId,
        orderId,
        transaction,
      });

    if (
      allocations.length ===
      0
    ) {
      return {
        orderId,

        releasedAllocations:
          0,

        releasedQuantity:
          0,

        alreadyReleased:
          true,
      };
    }

    let releasedQuantity =
      0;

    const affectedShipmentIds =
      new Set();

    for (
      const allocation of
      allocations
    ) {
      const allocatedQuantity =
        toNumber(
          allocation
            .quantityAllocated
        );

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
              ?.LOCK
              ?.UPDATE ||
            true,
        });

      if (
        balance
      ) {
        const currentReserved =
          toNumber(
            balance
              .quantityReserved
          );

        const newReserved =
          Math.max(
            0,
            currentReserved -
              allocatedQuantity
          );

        await balance.update(
          {
            quantityReserved:
              newReserved,
          },
          {
            transaction,
          }
        );
      }

      await allocation.update(
        {
          status:
            allocationStatus,
        },
        {
          transaction,
        }
      );

      releasedQuantity +=
        allocatedQuantity;

      if (
        allocation
          .orderShipmentId
      ) {
        affectedShipmentIds.add(
          allocation
            .orderShipmentId
        );
      }
    }

    if (
      shipmentStatus &&
      affectedShipmentIds
        .size >
        0
    ) {
      await db.OrderShipment.update(
        {
          status:
            shipmentStatus,
        },
        {
          where: {
            companyId,

            id: [
              ...affectedShipmentIds,
            ],
          },

          transaction,
        }
      );
    }

    console.log(
      "[ORDER RESERVATION RELEASED]",
      {
        orderId,
        reason,
        allocations:
          allocations.length,
        releasedQuantity,
      }
    );

    return {
      orderId,

      releasedAllocations:
        allocations.length,

      releasedQuantity,

      alreadyReleased:
        false,

      reason,
    };
  };

/*
|--------------------------------------------------------------------------
| Cancel order reservations
|--------------------------------------------------------------------------
*/

const cancelOrderReservations =
  async ({
    companyId,
    orderId,
    reason =
      "ORDER_CANCELLED",
    transaction,
  }) => {
    return releaseOrderReservations({
      companyId,
      orderId,
      reason,

      allocationStatus:
        "CANCELLED",

      shipmentStatus:
        "CANCELLED",

      transaction,
    });
  };

/*
|--------------------------------------------------------------------------
| Consume reservations
|--------------------------------------------------------------------------
|
| Used after ERP/Zoho confirms actual stock movement.
|
| Important:
|
| We DO NOT decrease quantityOnHand here.
| Zoho inventory sync is the source of truth for on-hand stock.
|
| We only release the reservation because the physical stock change
| has already been reflected by the ERP stock event/snapshot.
|--------------------------------------------------------------------------
*/

const consumeOrderReservations =
  async ({
    companyId,
    orderId,
    transaction,
  }) => {
    if (
      !companyId ||
      !orderId
    ) {
      throw new AppError(
        "companyId and orderId are required.",
        400,
        "ORDER_RESERVATION_INPUT_REQUIRED"
      );
    }

    const allocations =
      await getActiveAllocations({
        companyId,
        orderId,
        transaction,
      });

    if (
      allocations.length ===
      0
    ) {
      return {
        orderId,

        consumedAllocations:
          0,

        consumedQuantity:
          0,

        alreadyConsumed:
          true,
      };
    }

    let consumedQuantity =
      0;

    const affectedShipmentIds =
      new Set();

    for (
      const allocation of
      allocations
    ) {
      const allocatedQuantity =
        toNumber(
          allocation
            .quantityAllocated
        );

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
              ?.LOCK
              ?.UPDATE ||
            true,
        });

      if (
        balance
      ) {
        const currentReserved =
          toNumber(
            balance
              .quantityReserved
          );

        const newReserved =
          Math.max(
            0,
            currentReserved -
              allocatedQuantity
          );

        await balance.update(
          {
            quantityReserved:
              newReserved,
          },
          {
            transaction,
          }
        );
      }

      await allocation.update(
        {
          quantityFulfilled:
            allocatedQuantity,

          status:
            "FULFILLED",
        },
        {
          transaction,
        }
      );

      consumedQuantity +=
        allocatedQuantity;

      if (
        allocation
          .orderShipmentId
      ) {
        affectedShipmentIds.add(
          allocation
            .orderShipmentId
        );
      }
    }

    if (
      affectedShipmentIds
        .size >
        0
    ) {
      await db.OrderShipment.update(
        {
          status:
            "DELIVERED",
        },
        {
          where: {
            companyId,

            id: [
              ...affectedShipmentIds,
            ],
          },

          transaction,
        }
      );
    }

    console.log(
      "[ORDER RESERVATION CONSUMED]",
      {
        orderId,
        allocations:
          allocations.length,
        consumedQuantity,
      }
    );

    return {
      orderId,

      consumedAllocations:
        allocations.length,

      consumedQuantity,

      alreadyConsumed:
        false,
    };
  };

/*
|--------------------------------------------------------------------------
| Payment failure helper
|--------------------------------------------------------------------------
*/

const releaseForPaymentFailure =
  async ({
    order,
    reason =
      "PAYMENT_FAILED",
    transaction,
  }) => {
    if (!order) {
      throw new AppError(
        "Order is required.",
        400,
        "ORDER_REQUIRED"
      );
    }

    return releaseOrderReservations({
      companyId:
        order.companyId,

      orderId:
        order.id,

      reason,

      allocationStatus:
        "RELEASED",

      shipmentStatus:
        "CANCELLED",

      transaction,
    });
  };

/*
|--------------------------------------------------------------------------
| Public exports
|--------------------------------------------------------------------------
*/

module.exports = {
  releaseOrderReservations,
  cancelOrderReservations,
  consumeOrderReservations,
  releaseForPaymentFailure,
};