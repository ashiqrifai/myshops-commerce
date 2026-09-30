const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../models"
  );

const AppError =
  require(
    "../utils/AppError"
  );


const number =
  value =>
    Number(
      value ||
      0
    );


const available =
  balance =>
    Math.max(
      0,
      number(
        balance?.quantityOnHand
      ) -
      number(
        balance?.quantityReserved
      )
    );


const getUserLocationIds =
  async ({
    companyId,
    userId,
    transaction =
      null,
  }) => {

    if (!userId) {
      return [];
    }

    const rows =
      await db.UserInventoryLocation.findAll({
        where: {
          companyId,
          userId,
        },

        attributes: [
          "inventoryLocationId",
        ],

        transaction,
      });

    return rows.map(
      row =>
        String(
          row.inventoryLocationId
        )
    );
  };


const loadAssignment =
  async ({
    companyId,
    orderId,
    assignmentId,
    transaction =
      null,
    lock =
      false,
  }) => {

    const options = {
      where: {
        id:
          assignmentId,

        companyId,

        orderId,
      },

      include: [
        {
          model:
            db.InventoryLocation,

          as:
            "sellingLocation",

          required:
            true,

          attributes: [
            "id",
            "code",
            "name",
          ],
        },

        {
          model:
            db.InventoryLocation,

          as:
            "fulfillmentLocation",

          required:
            false,

          attributes: [
            "id",
            "code",
            "name",
          ],
        },
      ],

      transaction,
    };

    if (
      lock &&
      transaction
    ) {
      options.lock =
        transaction
          .LOCK
          .UPDATE;
    }

    return db.KioskFulfillmentAssignment
      .findOne(
        options
      );
  };


const assertSellingStoreAccess =
  async ({
    companyId,
    assignment,
    userId,
    isSuperAdmin,
    transaction =
      null,
  }) => {

    if (
      isSuperAdmin ===
      true
    ) {
      return;
    }

    const locationIds =
      await getUserLocationIds({
        companyId,
        userId,
        transaction,
      });

    if (
      !locationIds.includes(
        String(
          assignment
            .sellingLocationId
        )
      )
    ) {
      throw new AppError(
        "You do not have access to assign fulfillment for this selling store.",
        403,
        "KIOSK_FULFILLMENT_ASSIGNMENT_FORBIDDEN"
      );
    }
  };


const listAssignments =
  async ({
    companyId,
    orderId,
    userId,
    isSuperAdmin =
      false,
  }) => {

    const order =
      await db.Order.findOne({
        where: {
          id:
            orderId,

          companyId,

          channelCode:
            "KIOSK",
        },

        attributes: [
          "id",
          "orderNumber",
          "paymentStatus",
          "orderStatus",
        ],
      });

    if (!order) {
      throw new AppError(
        "Kiosk order was not found.",
        404,
        "KIOSK_ORDER_NOT_FOUND"
      );
    }

    const assignments =
      await db.KioskFulfillmentAssignment.findAll({
        where: {
          companyId,
          orderId,
        },

        include: [
          {
            model:
              db.InventoryLocation,

            as:
              "sellingLocation",

            required:
              true,

            attributes: [
              "id",
              "code",
              "name",
            ],
          },

          {
            model:
              db.InventoryLocation,

            as:
              "fulfillmentLocation",

            required:
              false,

            attributes: [
              "id",
              "code",
              "name",
            ],
          },
        ],

        order: [
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    if (
      isSuperAdmin !==
      true
    ) {

      const locationIds =
        await getUserLocationIds({
          companyId,
          userId,
        });

      const allowed =
        assignments.every(
          assignment =>
            locationIds.includes(
              String(
                assignment
                  .sellingLocationId
              )
            ) ||
            (
              assignment
                .fulfillmentLocationId &&
              locationIds.includes(
                String(
                  assignment
                    .fulfillmentLocationId
                )
              )
            )
        );

      if (!allowed) {
        throw new AppError(
          "You do not have access to this kiosk fulfillment.",
          403,
          "KIOSK_FULFILLMENT_FORBIDDEN"
        );
      }
    }

    return assignments.map(
      assignment => ({
        id:
          assignment.id,

        orderId:
          assignment.orderId,

        orderItemId:
          assignment.orderItemId,

        productVariantId:
          assignment.productVariantId,

        sku:
          assignment.sku,

        quantity:
          number(
            assignment.quantity
          ),

        status:
          assignment.status,

        sellingLocation:
          assignment.sellingLocation,

        fulfillmentLocation:
          assignment.fulfillmentLocation ||
          null,

        assignedAt:
          assignment.assignedAt ||
          null,

        reservedAt:
          assignment.reservedAt ||
          null,

        notes:
          assignment.notes ||
          null,
      })
    );
  };


const listCandidateLocations =
  async ({
    companyId,
    orderId,
    assignmentId,
    userId,
    isSuperAdmin =
      false,
  }) => {

    const assignment =
      await loadAssignment({
        companyId,
        orderId,
        assignmentId,
      });

    if (!assignment) {
      throw new AppError(
        "Kiosk fulfillment assignment was not found.",
        404,
        "KIOSK_FULFILLMENT_ASSIGNMENT_NOT_FOUND"
      );
    }

    await assertSellingStoreAccess({
      companyId,
      assignment,
      userId,
      isSuperAdmin,
    });

    if (
      ![
        "AWAITING_ASSIGNMENT",
        "RESERVED",
      ].includes(
        assignment.status
      )
    ) {
      throw new AppError(
        "This fulfillment assignment can no longer be changed.",
        409,
        "KIOSK_FULFILLMENT_ASSIGNMENT_LOCKED"
      );
    }

    const balances =
      await db.InventoryBalance.findAll({
        where: {
          companyId,

          productVariantId:
            assignment.productVariantId,
        },

        include: [
          {
            model:
              db.InventoryLocation,

            as:
              "location",

            required:
              true,

            where: {
              companyId,
              isActive:
                true,
            },

            attributes: [
              "id",
              "code",
              "name",
              "locationType",
              "emirate",
              "city",
            ],
          },
        ],
      });

    const requiredQuantity =
      number(
        assignment.quantity
      );

    const locations =
      balances
        .filter(
          balance =>
            String(
              balance.inventoryLocationId
            ) !==
            String(
              assignment
                .sellingLocationId
            )
        )
        .map(
          balance => {

            const qty =
              available(
                balance
              );

            return {
              id:
                balance
                  .location
                  .id,

              code:
                balance
                  .location
                  .code,

              name:
                balance
                  .location
                  .name,

              locationType:
                balance
                  .location
                  .locationType ||
                null,

              emirate:
                balance
                  .location
                  .emirate ||
                null,

              city:
                balance
                  .location
                  .city ||
                null,

              quantityOnHand:
                number(
                  balance
                    .quantityOnHand
                ),

              quantityReserved:
                number(
                  balance
                    .quantityReserved
                ),

              available:
                qty,

              canFulfill:
                qty >=
                requiredQuantity,
            };
          }
        )
        .sort(
          (a, b) => {

            if (
              a.canFulfill !==
              b.canFulfill
            ) {
              return a.canFulfill
                ? -1
                : 1;
            }

            return (
              b.available -
              a.available
            );
          }
        );

    return {
      assignmentId:
        assignment.id,

      sku:
        assignment.sku,

      productVariantId:
        assignment.productVariantId,

      requiredQuantity,

      sellingLocation:
        assignment.sellingLocation,

      currentFulfillmentLocation:
        assignment.fulfillmentLocation ||
        null,

      locations,
    };
  };


const assignLocation =
  async ({
    companyId,
    orderId,
    assignmentId,
    fulfillmentLocationId,
    userId,
    isSuperAdmin =
      false,
    notes =
      null,
  }) => {

    if (
      !fulfillmentLocationId
    ) {
      throw new AppError(
        "Fulfillment location is required.",
        400,
        "FULFILLMENT_LOCATION_REQUIRED"
      );
    }

    return db.sequelize.transaction(
      async transaction => {

        const assignment =
          await loadAssignment({
            companyId,
            orderId,
            assignmentId,
            transaction,
            lock:
              true,
          });

        if (!assignment) {
          throw new AppError(
            "Kiosk fulfillment assignment was not found.",
            404,
            "KIOSK_FULFILLMENT_ASSIGNMENT_NOT_FOUND"
          );
        }

        await assertSellingStoreAccess({
          companyId,
          assignment,
          userId,
          isSuperAdmin,
          transaction,
        });

        if (
          assignment.status !==
          "AWAITING_ASSIGNMENT"
        ) {
          throw new AppError(
            "This fulfillment assignment has already been processed.",
            409,
            "KIOSK_FULFILLMENT_ALREADY_ASSIGNED"
          );
        }

        if (
          String(
            fulfillmentLocationId
          ) ===
          String(
            assignment
              .sellingLocationId
          )
        ) {
          throw new AppError(
            "Select another store for this fulfillment.",
            400,
            "FULFILLMENT_LOCATION_MUST_BE_REMOTE"
          );
        }

        const location =
          await db.InventoryLocation.findOne({
            where: {
              id:
                fulfillmentLocationId,

              companyId,

              isActive:
                true,
            },

            transaction,
          });

        if (!location) {
          throw new AppError(
            "Selected fulfillment location is unavailable.",
            404,
            "FULFILLMENT_LOCATION_NOT_FOUND"
          );
        }

        /*
         * Lock the exact inventory row.
         *
         * Concurrent administrators selecting the same
         * last unit will serialize here.
         */
        const balance =
          await db.InventoryBalance.findOne({
            where: {
              companyId,

              inventoryLocationId:
                location.id,

              productVariantId:
                assignment
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
            "The selected store has no inventory for this item.",
            409,
            "FULFILLMENT_STOCK_UNAVAILABLE"
          );
        }

        const requiredQuantity =
          number(
            assignment.quantity
          );

        const availableQuantity =
          available(
            balance
          );

        if (
          availableQuantity <
          requiredQuantity
        ) {
          throw new AppError(
            "The selected store no longer has enough available stock.",
            409,
            "FULFILLMENT_STOCK_CHANGED"
          );
        }

        /*
         * Create a dedicated shipment for this deferred
         * kiosk item.
         */
        const order =
          await db.Order.findOne({
            where: {
              id:
                orderId,

              companyId,

              channelCode:
                "KIOSK",
            },

            transaction,

            lock:
              transaction
                .LOCK
                .UPDATE,
          });

        if (!order) {
          throw new AppError(
            "Kiosk order was not found.",
            404,
            "KIOSK_ORDER_NOT_FOUND"
          );
        }

        if (
          order.paymentStatus !==
          "PAID"
        ) {
          throw new AppError(
            "Fulfillment store can only be assigned after payment is confirmed.",
            409,
            "KIOSK_ORDER_NOT_PAID"
          );
        }


        const shipment =
          await db.OrderShipment.create(
            {
              companyId,

              orderId,

              shipmentNumber:
                `${order.orderNumber}-KFA-${String(assignment.id).slice(0, 8)}`,

              deliveryZoneId:
                null,

              deliveryZoneCode:
                "KIOSK_STORE_FULFILLMENT",

              deliveryLabel:
                `Store Fulfillment - ${location.name}`,

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

              cityCode:
                location.city ||
                null,

              status:
                "ALLOCATED",

              notes:
                "Kiosk fulfillment store assignment",
            },
            {
              transaction,
            }
          );

        const shipmentItem =
          await db.OrderShipmentItem.create(
            {
              companyId,

              orderShipmentId:
                shipment.id,

              orderItemId:
                assignment.orderItemId,

              productVariantId:
                assignment
                  .productVariantId,

              sku:
                assignment.sku,

              quantity:
                requiredQuantity,
            },
            {
              transaction,
            }
          );

        await db.OrderShipmentAllocation.create(
          {
            companyId,

            orderShipmentId:
              shipment.id,

            orderShipmentItemId:
              shipmentItem.id,

            inventoryLocationId:
              location.id,

            productVariantId:
              assignment
                .productVariantId,

            quantityAllocated:
              requiredQuantity,

            quantityFulfilled:
              0,

            status:
              "RESERVED",
          },
          {
            transaction,
          }
        );

        await balance.update(
          {
            quantityReserved:
              number(
                balance
                  .quantityReserved
              ) +
              requiredQuantity,
          },
          {
            transaction,
          }
        );

        await assignment.update(
          {
            fulfillmentLocationId:
              location.id,

            status:
              "RESERVED",

            assignedBy:
              userId ||
              null,

            assignedAt:
              new Date(),

            reservedAt:
              new Date(),

            notes:
              notes ||
              null,
          },
          {
            transaction,
          }
        );

        return {
          id:
            assignment.id,

          status:
            "RESERVED",

          sku:
            assignment.sku,

          quantity:
            requiredQuantity,

          sellingLocation:
            assignment.sellingLocation,

          fulfillmentLocation: {
            id:
              location.id,

            code:
              location.code,

            name:
              location.name,
          },

          shipmentId:
            shipment.id,

          reserved:
            true,
        };
      }
    );
  };


module.exports = {
  listAssignments,
  listCandidateLocations,
  assignLocation,
};
