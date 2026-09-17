const {
  Op,
} =
  require(
    "sequelize"
  );

const db =
  require(
    "../models"
  );

const money =
  (
    value,
    currencyCode =
      "AED"
  ) =>
    `${currencyCode} ${Number(
      value ||
      0
    ).toFixed(
      2
    )}`;

const escapeHtml =
  (
    value
  ) =>
    String(
      value ??
      ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

const loadOrderNotificationData =
  async ({
    companyId,
    orderId,
  }) => {
    const order =
      await db.Order.findOne({
        where: {
          id:
            orderId,

          companyId,
        },
      });

    if (!order) {
      throw new Error(
        "Order was not found."
      );
    }

    const items =
      await db.OrderItem.findAll({
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

    const addresses =
      db.OrderAddress
        ? await db.OrderAddress.findAll({
            where: {
              companyId,
              orderId,
            },
          })
        : [];

    const shipments =
      db.OrderShipment
        ? await db.OrderShipment.findAll({
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
          })
        : [];

    const shipmentIds =
      shipments.map(
        row =>
          row.id
      );

    const shipmentItems =
      (
        shipmentIds.length &&
        db.OrderShipmentItem
      )
        ? await db.OrderShipmentItem.findAll({
            where: {
              companyId,

              orderShipmentId: {
                [Op.in]:
                  shipmentIds,
              },
            },
          })
        : [];

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
          })
        : [];

    const locationIds =
      Array.from(
        new Set(
          allocations
            .map(
              row =>
                row
                  .inventoryLocationId
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
          row
            .orderItemId
        );

      if (
        !shipmentItemsByOrderItem
          .has(
            key
          )
      ) {
        shipmentItemsByOrderItem
          .set(
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
          row
            .orderShipmentItemId
        );

      if (
        !allocationsByShipmentItem
          .has(
            key
          )
      ) {
        allocationsByShipmentItem
          .set(
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

    const enrichedItems =
      items.map(
        item => {
          const related =
            shipmentItemsByOrderItem
              .get(
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
            related
          ) {
            shipment =
              shipmentById.get(
                String(
                  shipmentItem
                    .orderShipmentId
                )
              ) ||
              null;

            const itemAllocations =
              allocationsByShipmentItem
                .get(
                  String(
                    shipmentItem.id
                  )
                ) ||
              [];

            allocation =
              itemAllocations.find(
                row =>
                  ![
                    "RELEASED",
                    "CANCELLED",
                  ].includes(
                    String(
                      row.status ||
                      ""
                    )
                      .trim()
                      .toUpperCase()
                  )
              ) ||
              itemAllocations[0] ||
              null;

            if (
              allocation
                ?.inventoryLocationId
            ) {
              location =
                locationById.get(
                  String(
                    allocation
                      .inventoryLocationId
                  )
                ) ||
                null;
            }

            if (shipment) {
              break;
            }
          }

          const method =
            String(
              shipment
                ?.deliveryMethod ||
              item
                .selectedDeliveryMethod ||
              "STANDARD"
            )
              .trim()
              .toUpperCase();

          let fulfillmentLabel =
            shipment
              ?.deliveryLabel ||
            null;

          if (!fulfillmentLabel) {
            if (
              method ===
              "PICKUP"
            ) {
              fulfillmentLabel =
                location
                  ?.name
                  ? `Store Pickup - ${location.name}`
                  : "Store Pickup";
            } else if (
              method ===
              "EXPRESS"
            ) {
              fulfillmentLabel =
                Number(
                  shipment
                    ?.deliveryHours
                ) >
                0
                  ? `Express ${Number(
                      shipment
                        .deliveryHours
                    )}-Hour Delivery`
                  : "Express Delivery";
            } else if (
              method ===
              "DIRECT_DELIVERY"
            ) {
              fulfillmentLabel =
                "Direct Delivery";
            } else {
              fulfillmentLabel =
                "Standard Delivery";
            }
          }

          return {
            ...(
              item.toJSON
                ? item.toJSON()
                : item
            ),

            fulfillmentMethod:
              method,

            fulfillmentLabel,

            fulfillmentLocation:
              location
                ?.name ||
              null,

            shipmentNumber:
              shipment
                ?.shipmentNumber ||
              null,
          };
        }
      );

    return {
      order:
        order.toJSON
          ? order.toJSON()
          : order,

      items:
        enrichedItems,

      addresses:
        addresses.map(
          row =>
            row.toJSON
              ? row.toJSON()
              : row
        ),
    };
  };

const getNotificationCopy =
  ({
    type,
    order,
  }) => {
    const orderNumber =
      order.orderNumber;

    const map = {
      ORDER_CONFIRMED: {
        subject:
          `Order confirmed - ${orderNumber}`,

        heading:
          "Your order is confirmed",

        intro:
          "Thank you for shopping with MyShops. We have received your order and it is now confirmed.",
      },

      PAYMENT_SUCCESSFUL: {
        subject:
          `Payment received - ${orderNumber}`,

        heading:
          "Payment received",

        intro:
          "Your payment was successful. We are now preparing your order.",
      },

      READY_FOR_PICKUP: {
        subject:
          `Ready for pickup - ${orderNumber}`,

        heading:
          "Your order is ready for pickup",

        intro:
          "Your pickup item(s) are ready. Please check the pickup store details below before visiting.",
      },

      ORDER_DISPATCHED: {
        subject:
          `Order dispatched - ${orderNumber}`,

        heading:
          "Your order is on the way",

        intro:
          "Your delivery item(s) have been dispatched.",
      },

      ORDER_DELIVERED: {
        subject:
          `Order delivered - ${orderNumber}`,

        heading:
          "Your order has been delivered",

        intro:
          "Your order has been marked as delivered. Thank you for shopping with MyShops.",
      },

      ORDER_CANCELLED: {
        subject:
          `Order cancelled - ${orderNumber}`,

        heading:
          "Your order has been cancelled",

        intro:
          "Your order has been cancelled. If a payment was collected, any applicable refund will be handled separately.",
      },

      REFUND_PROCESSED: {
        subject:
          `Refund processed - ${orderNumber}`,

        heading:
          "Your refund has been processed",

        intro:
          "Your refund has been processed. The time it takes to appear may depend on your payment provider or bank.",
      },
    };

    return (
      map[
        type
      ] ||
      map.ORDER_CONFIRMED
    );
  };

const getTrackOrderUrl =
  (
    order
  ) => {
    const storefrontUrl =
      String(
        process.env
          .STOREFRONT_URL ||
        process.env
          .NEXT_PUBLIC_SITE_URL ||
        "https://myshops.ae"
      )
        .trim()
        .replace(
          /\/+$/,
          ""
        );

    const params =
      new URLSearchParams({
        order:
          String(
            order.orderNumber ||
            ""
          ),

        email:
          String(
            order.customerEmail ||
            ""
          ),
      });

    return `${storefrontUrl}/track-order?${params.toString()}`;
  };

const buildOrderNotificationEmail =
  ({
    type,
    data,
  }) => {
    const {
      order,
      items,
      addresses,
    } =
      data;

    const copy =
      getNotificationCopy({
        type,
        order,
      });

    const trackOrderUrl =
      getTrackOrderUrl(
        order
      );

    const customerName =
      [
        order
          .customerFirstName,
        order
          .customerLastName,
      ]
        .filter(
          Boolean
        )
        .join(
          " "
        ) ||
      "Customer";

    const shippingAddress =
      addresses.find(
        row =>
          row.addressType ===
          "SHIPPING"
      ) ||
      null;

    const itemRows =
      items.map(
        item => {
          const locationLine =
            item
              .fulfillmentMethod ===
              "PICKUP"
              ? (
                  item
                    .fulfillmentLocation
                    ? `Pickup Store: ${item.fulfillmentLocation}`
                    : null
                )
              : (
                  item
                    .fulfillmentLocation
                    ? `Source: ${item.fulfillmentLocation}`
                    : null
                );

          return `
            <tr>
              <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
                <div style="font-weight:700;color:#111827;">
                  ${escapeHtml(
                    item.productName
                  )}
                </div>
                <div style="margin-top:4px;font-size:13px;color:#6b7280;">
                  SKU: ${escapeHtml(
                    item.sku
                  )}
                </div>
                <div style="margin-top:8px;font-size:13px;color:#111827;">
                  <strong>Fulfillment:</strong>
                  ${escapeHtml(
                    item.fulfillmentLabel
                  )}
                </div>
                ${
                  locationLine
                    ? `<div style="margin-top:4px;font-size:13px;color:#6b7280;">${escapeHtml(
                        locationLine
                      )}</div>`
                    : ""
                }
                ${
                  item.shipmentNumber
                    ? `<div style="margin-top:4px;font-size:12px;color:#9ca3af;">Shipment Ref: ${escapeHtml(
                        item.shipmentNumber
                      )}</div>`
                    : ""
                }
              </td>
              <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;text-align:center;vertical-align:top;">
                ${escapeHtml(
                  item.quantity
                )}
              </td>
              <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;">
                ${escapeHtml(
                  money(
                    item.lineTotal,
                    order.currencyCode
                  )
                )}
              </td>
            </tr>
          `;
        }
      )
        .join(
          ""
        );

    const addressHtml =
      shippingAddress
        ? `
          <div style="margin-top:24px;">
            <div style="font-size:13px;font-weight:700;color:#111827;">Delivery Address</div>
            <div style="margin-top:6px;font-size:13px;line-height:1.6;color:#4b5563;">
              ${[
                shippingAddress
                  .addressLine1,
                shippingAddress
                  .addressLine2,
                shippingAddress
                  .area,
                shippingAddress
                  .city,
                shippingAddress
                  .emirate,
              ]
                .filter(
                  Boolean
                )
                .map(
                  escapeHtml
                )
                .join(
                  ", "
                )}
            </div>
          </div>
        `
        : "";

    const html =
      `<!doctype html>
      <html>
      <body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:14px;padding:28px;">
            <div style="font-size:26px;font-weight:800;">MyShops</div>

            <h1 style="margin:24px 0 10px;font-size:24px;">
              ${escapeHtml(
                copy.heading
              )}
            </h1>

            <p style="font-size:15px;line-height:1.7;color:#4b5563;">
              Hi ${escapeHtml(
                customerName
              )},<br/>
              ${escapeHtml(
                copy.intro
              )}
            </p>

            <div style="margin-top:22px;padding:14px 16px;background:#f9fafb;border-radius:10px;">
              <div style="font-size:13px;color:#6b7280;">Order</div>
              <div style="margin-top:3px;font-size:16px;font-weight:700;">
                ${escapeHtml(
                  order.orderNumber
                )}
              </div>
            </div>

            <div style="margin-top:18px;">
              <a
                href="${escapeHtml(
                  trackOrderUrl
                )}"
                style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;"
              >
                Track your order
              </a>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-top:24px;">
              <thead>
                <tr>
                  <th style="padding-bottom:10px;text-align:left;font-size:12px;color:#6b7280;">ITEM</th>
                  <th style="padding-bottom:10px;text-align:center;font-size:12px;color:#6b7280;">QTY</th>
                  <th style="padding-bottom:10px;text-align:right;font-size:12px;color:#6b7280;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:18px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#6b7280;">Subtotal</span>
                <strong>${escapeHtml(
                  money(
                    order.subtotal,
                    order.currencyCode
                  )
                )}</strong>
              </div>

              ${
                Number(
                  order.discountAmount ||
                  0
                ) >
                0
                  ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                       <span style="color:#6b7280;">Discount</span>
                       <strong>-${escapeHtml(
                         money(
                           order.discountAmount,
                           order.currencyCode
                         )
                       )}</strong>
                     </div>`
                  : ""
              }

              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#6b7280;">Delivery</span>
                <strong>${Number(
                  order.deliveryAmount ||
                  0
                ) ===
                0
                  ? "FREE"
                  : escapeHtml(
                      money(
                        order.deliveryAmount,
                        order.currencyCode
                      )
                    )}</strong>
              </div>

              <div style="display:flex;justify-content:space-between;font-size:18px;margin-top:12px;">
                <span style="font-weight:700;">Grand Total</span>
                <strong>${escapeHtml(
                  money(
                    order.grandTotal,
                    order.currencyCode
                  )
                )}</strong>
              </div>
            </div>

            ${addressHtml}

            <div style="margin-top:28px;font-size:12px;line-height:1.6;color:#9ca3af;">
              This is an automated transactional message from MyShops.
            </div>
          </div>
        </div>
      </body>
      </html>`;

    const textLines =
      [
        copy.heading,
        "",
        `Hi ${customerName},`,
        copy.intro,
        "",
        `Order: ${order.orderNumber}`,
        "",
        ...items.flatMap(
          item => [
            item.productName,
            `SKU: ${item.sku}`,
            `Fulfillment: ${item.fulfillmentLabel}`,
            item.fulfillmentLocation
              ? (
                  item.fulfillmentMethod ===
                  "PICKUP"
                    ? `Pickup Store: ${item.fulfillmentLocation}`
                    : `Source: ${item.fulfillmentLocation}`
                )
              : null,
            item.shipmentNumber
              ? `Shipment Ref: ${item.shipmentNumber}`
              : null,
            "",
          ]
            .filter(
              value =>
                value !==
                null
            )
        ),
        `Grand Total: ${money(
          order.grandTotal,
          order.currencyCode
        )}`,
      ];

    return {
      subject:
        copy.subject,

      html,

      text:
        textLines.join(
          "\n"
        ),
    };
  };

module.exports = {
  loadOrderNotificationData,
  buildOrderNotificationEmail,
};
