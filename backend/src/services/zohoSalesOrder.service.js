const db =
  require(
    "../models"
  );

const {
  getAccessToken,
} =
  require(
    "./zohoAuth.service"
  );

const {
  resolveZohoCustomer,
} =
  require(
    "./zohoCustomer.service"
  );

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const getRequiredEnv =
  (
    key,
    fallback =
      ""
  ) => {
    const value =
      String(
        process.env[
          key
        ] ||
        fallback ||
        ""
      ).trim();

    if (!value) {
      throw new Error(
        `${key} is not configured.`
      );
    }

    return value;
  };

const getConfig =
  () => {
    const organizationId =
      getRequiredEnv(
        "ZOHO_ORGANIZATION_ID"
      );

    const currencyId =
      getRequiredEnv(
        "ZOHO_CURRENCY_ID"
      );

    const standardTaxId =
      getRequiredEnv(
        "ZOHO_STANDARD_TAX_ID"
      );

    const onlineSalesLocationId =
      getRequiredEnv(
        "ZOHO_ONLINE_SALES_LOCATION_ID",
        "6275457000032063818"
      );

    const giftVoucherItemId =
      getRequiredEnv(
        "ZOHO_GIFT_VOUCHER_ITEM_ID",
        "6275457000002467955"
      );

    const apiBaseUrl =
      String(
        process.env
          .ZOHO_API_BASE_URL ||
        "https://www.zohoapis.com"
      )
        .trim()
        .replace(
          /\/+$/,
          ""
        );

    return {
      organizationId,
      currencyId,
      standardTaxId,
      onlineSalesLocationId,
      giftVoucherItemId,
      apiBaseUrl,
    };
  };

/*
|--------------------------------------------------------------------------
| Money Helpers
|--------------------------------------------------------------------------
*/

const toNumber =
  (
    value
  ) => {
    const number =
      Number(
        value ||
        0
      );

    return Number.isFinite(
      number
    )
      ? number
      : 0;
  };

const roundMoney =
  (
    value
  ) =>
    Number(
      toNumber(
        value
      ).toFixed(
        2
      )
    );

/*
|--------------------------------------------------------------------------
| Load Order
|--------------------------------------------------------------------------
*/

const loadOrder =
  async (
    orderId
  ) => {
    const order =
      await db.Order.findByPk(
        orderId,
        {
          include: [
            {
              model:
                db.Customer,

              as:
                "customer",

              required:
                false,
            },

            {
              model:
                db.OrderItem,

              as:
                "items",

              required:
                true,

              include: [
                {
                  model:
                    db.ProductVariant,

                  as:
                    "variant",

                  required:
                    true,
                },

                {
                  model:
                    db.OrderItemProtectionPlan,

                  as:
                    "protectionPlans",

                  required:
                    false,

                  include: [
                    {
                      model:
                        db.ProtectionScheme,

                      as:
                        "scheme",

                      required:
                        false,
                    },
                  ],
                },
              ],
            },

            {
              model:
                db.OrderAddress,

              as:
                "addresses",

              required:
                false,
            },
          ],
        }
      );

    if (
      !order
    ) {
      throw new Error(
        "Order was not found."
      );
    }

    /*
     * Load shipment/allocation/location data with separate queries.
     * This avoids fragile deep Sequelize aliases and gives Zoho an exact
     * per-order-item fulfillment source.
     */
    const shipments =
      await db.OrderShipment.findAll({
        where: {
          orderId:
            order.id,

          companyId:
            order.companyId,
        },

        order: [
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    const shipmentIds =
      shipments.map(
        shipment =>
          shipment.id
      );

    const shipmentItems =
      shipmentIds.length
        ? await db.OrderShipmentItem.findAll({
            where: {
              companyId:
                order.companyId,

              orderShipmentId:
                shipmentIds,
            },

            order: [
              [
                "createdAt",
                "ASC",
              ],
            ],
          })
        : [];

    const shipmentItemIds =
      shipmentItems.map(
        shipmentItem =>
          shipmentItem.id
      );

    const allocations =
      shipmentItemIds.length
        ? await db.OrderShipmentAllocation.findAll({
            where: {
              companyId:
                order.companyId,

              orderShipmentItemId:
                shipmentItemIds,
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
              allocation =>
                allocation
                  .inventoryLocationId
            )
            .filter(
              Boolean
            )
        )
      );

    const locations =
      locationIds.length
        ? await db.InventoryLocation.findAll({
            where: {
              companyId:
                order.companyId,

              id:
                locationIds,
            },
          })
        : [];

    order.setDataValue(
      "shipments",
      shipments
    );

    order.setDataValue(
      "shipmentItems",
      shipmentItems
    );

    order.setDataValue(
      "shipmentAllocations",
      allocations
    );

    order.setDataValue(
      "shipmentLocations",
      locations
    );

    return order;
  };

/*
|--------------------------------------------------------------------------
| Fulfillment Helpers
|--------------------------------------------------------------------------
*/

const getFulfillmentContext =
  (
    order,
    orderItemId
  ) => {
    const shipments =
      order.getDataValue(
        "shipments"
      ) ||
      [];

    const shipmentItems =
      order.getDataValue(
        "shipmentItems"
      ) ||
      [];

    const allocations =
      order.getDataValue(
        "shipmentAllocations"
      ) ||
      [];

    const locations =
      order.getDataValue(
        "shipmentLocations"
      ) ||
      [];

    const shipmentItem =
      shipmentItems.find(
        row =>
          String(
            row.orderItemId
          ) ===
          String(
            orderItemId
          )
      ) ||
      null;

    const shipment =
      shipmentItem
        ? shipments.find(
            row =>
              String(
                row.id
              ) ===
              String(
                shipmentItem
                  .orderShipmentId
              )
          ) ||
          null
        : null;

    const itemAllocations =
      shipmentItem
        ? allocations.filter(
            row =>
              String(
                row.orderShipmentItemId
              ) ===
              String(
                shipmentItem.id
              )
          )
        : [];

    const activeAllocation =
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

    const location =
      activeAllocation
        ?.inventoryLocationId
        ? locations.find(
            row =>
              String(
                row.id
              ) ===
              String(
                activeAllocation
                  .inventoryLocationId
              )
          ) ||
          null
        : null;

    const method =
      String(
        shipment
          ?.deliveryMethod ||
        order.items
          ?.find(
            row =>
              String(
                row.id
              ) ===
              String(
                orderItemId
              )
          )
          ?.selectedDeliveryMethod ||
        "STANDARD"
      )
        .trim()
        .toUpperCase();

    let label;

    if (
      method ===
      "PICKUP"
    ) {
      label =
        location
          ?.name
          ? `Store Pickup - ${location.name}`
          : (
              shipment
                ?.deliveryLabel ||
              "Store Pickup"
            );
    } else if (
      method ===
      "EXPRESS"
    ) {
      label =
        shipment
          ?.deliveryLabel ||
        (
          Number(
            shipment
              ?.deliveryHours
          ) >
          0
            ? `Express ${Number(
                shipment.deliveryHours
              )}-Hour Delivery`
            : "Express Delivery"
        );
    } else if (
      method ===
      "DIRECT_DELIVERY"
    ) {
      label =
        shipment
          ?.deliveryLabel ||
        "Direct Delivery";
    } else {
      label =
        shipment
          ?.deliveryLabel ||
        "Standard Delivery";
    }

    return {
      method,
      label,
      shipment,
      shipmentItem,
      allocation:
        activeAllocation,
      location,
    };
  };

const buildLineFulfillmentDescription =
  ({
    order,
    item,
  }) => {
    const context =
      getFulfillmentContext(
        order,
        item.id
      );

    const lines = [
      `Fulfillment: ${context.label}`,
    ];

    if (
      context.method ===
        "PICKUP" &&
      context.location
        ?.name
    ) {
      lines.push(
        `Pickup Store: ${context.location.name}`
      );
    } else if (
      context.location
        ?.name
    ) {
      lines.push(
        `Source: ${context.location.name}`
      );
    }

    if (
      context.shipment
        ?.shipmentNumber
    ) {
      lines.push(
        `Shipment Ref: ${context.shipment.shipmentNumber}`
      );
    }

    return {
      context,
      text:
        lines.join(
          "\n"
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| Fulfillment Notes
|--------------------------------------------------------------------------
*/

const buildFulfillmentNotes =
  (
    order
  ) => {
    const itemLines =
      order.items.map(
        (
          item,
          index
        ) => {
          const {
            context,
          } =
            buildLineFulfillmentDescription({
              order,
              item,
            });

          const details = [
            `${index + 1}. ${item.productName}`,
            `SKU: ${item.sku}`,
            `Fulfillment: ${context.label}`,
          ];

          if (
            context.method ===
              "PICKUP" &&
            context.location
              ?.name
          ) {
            details.push(
              `Pickup Store: ${context.location.name}`
            );
          } else if (
            context.location
              ?.name
          ) {
            details.push(
              `Source: ${context.location.name}`
            );
          }

          if (
            context.shipment
              ?.shipmentNumber
          ) {
            details.push(
              `Shipment Ref: ${context.shipment.shipmentNumber}`
            );
          }

          return details.join(
            "\n"
          );
        }
      );

    return [
      `MyShops Order: ${order.orderNumber}`,

      `Payment Method: ${order.paymentMethod}`,

      `Payment Status: ${order.paymentStatus}`,

      order.couponCode
        ? `Coupon: ${order.couponCode}`
        : null,

      toNumber(
        order.discountAmount
      ) > 0
        ? `Coupon Discount: AED ${roundMoney(
            order.discountAmount
          ).toFixed(
            2
          )}`
        : null,

      itemLines.length
        ? `FULFILLMENT DETAILS\n\n${itemLines.join(
            "\n\n"
          )}`
        : null,

      order.notes ||
        null,
    ]
      .filter(
        Boolean
      )
      .join(
        "\n\n"
      );
  };

/*
|--------------------------------------------------------------------------
| Validate Order
|--------------------------------------------------------------------------
*/

const validateOrderForZoho =
  (
    order
  ) => {
    if (
      !Array.isArray(
        order.items
      ) ||
      !order.items.length
    ) {
      throw new Error(
        "Order has no line items."
      );
    }

    const missingProducts =
      order.items.filter(
        (
          item
        ) =>
          !item.variant
            ?.zohoItemId
      );

    if (
      missingProducts.length
    ) {
      const skus =
        missingProducts
          .map(
            (
              item
            ) =>
              item.sku
          )
          .join(
            ", "
          );

      throw new Error(
        `Zoho item mapping is missing for SKU(s): ${skus}`
      );
    }

    for (
      const item of
      order.items
    ) {
      const plans =
        Array.isArray(
          item.protectionPlans
        )
          ? item.protectionPlans
          : [];

      for (
        const plan of
        plans
      ) {
        if (
          [
            "CANCELLED",
            "REFUNDED",
          ].includes(
            String(
              plan.status ||
              ""
            ).toUpperCase()
          )
        ) {
          continue;
        }

        const zohoItemId =
          plan.zohoItemId ||
          plan.scheme
            ?.zohoItemId;

        if (
          !zohoItemId
        ) {
          throw new Error(
            `Zoho item mapping is missing for protection scheme: ${
              plan.schemeName ||
              plan.schemeCode ||
              plan.id
            }`
          );
        }
      }
    }
  };

/*
|--------------------------------------------------------------------------
| Build Internal Sales Lines
|--------------------------------------------------------------------------
|
| Important business rules:
|
| 1. OrderItem.unitPrice is already the actual website selling price.
|    Normal product markdowns are therefore NOT sent as a second discount.
|
| 2. Order.discountAmount is treated as the coupon/order discount.
|
| 3. Extended warranty/protection is posted as a separate Zoho item line.
| 4. Charged delivery is posted as a separate Zoho service-item line.
|--------------------------------------------------------------------------
*/

const buildSalesLines =
  (
    order
  ) => {
    const lines =
      [];

    for (
      const item of
      order.items
    ) {
      const quantity =
        toNumber(
          item.quantity
        );

      const rate =
        roundMoney(
          item.unitPrice
        );

      const fulfillment =
        buildLineFulfillmentDescription({
          order,
          item,
        });

      lines.push({
        type:
          "PRODUCT",

        orderItemId:
          item.id,

        zohoItemId:
          String(
            item.variant
              .zohoItemId
          ),

        name:
          item.productName,

        description:
          [
            item.variantName ||
              item.productName,

            fulfillment.text,
          ]
            .filter(
              Boolean
            )
            .join(
              "\n"
            ),

        productType:
          "goods",

        quantity,

        rate,

        grossAmount:
          roundMoney(
            rate *
            quantity
          ),

        couponEligible:
          true,

        couponDiscount:
          0,
      });

      const protectionPlans =
        Array.isArray(
          item.protectionPlans
        )
          ? item.protectionPlans
          : [];

      for (
        const protection of
        protectionPlans
      ) {
        if (
          [
            "CANCELLED",
            "REFUNDED",
          ].includes(
            String(
              protection.status ||
              ""
            ).toUpperCase()
          )
        ) {
          continue;
        }

        const zohoItemId =
          protection.zohoItemId ||
          protection.scheme
            ?.zohoItemId;

        if (
          !zohoItemId
        ) {
          throw new Error(
            `Zoho item mapping is missing for protection scheme: ${
              protection.schemeName ||
              protection.schemeCode ||
              protection.id
            }`
          );
        }

        const protectionQuantity =
          Math.max(
            toNumber(
              protection.quantity ||
              quantity ||
              1
            ),
            1
          );

        const protectionRate =
          roundMoney(
            protection
              .protectionUnitPrice
          );

        lines.push({
          type:
            "PROTECTION",

          orderItemId:
            item.id,

          protectionPlanId:
            protection.id,

          zohoItemId:
            String(
              zohoItemId
            ),

          name:
            protection.schemeName,

          description:
            [
              `${protection.schemeName} - ${item.productName}`,

              fulfillment.text,
            ]
              .filter(
                Boolean
              )
              .join(
                "\n"
              ),

          productType:
            "service",

          quantity:
            protectionQuantity,

          rate:
            protectionRate,

          grossAmount:
            roundMoney(
              protectionRate *
              protectionQuantity
            ),

          /*
           * Current agreed business rule:
           * coupon applies to merchandise only,
           * not extended warranty.
           */
          couponEligible:
            false,

          couponDiscount:
            0,
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Delivery Charge
    |--------------------------------------------------------------------------
    |
    | Zoho UAE VAT setup rejects shipping_charge for this organization.
    | Therefore any charged delivery is posted as a separate service item.
    |
    | Current business rule:
    | - coupon does NOT apply to delivery
    | - delivery price is VAT inclusive
    |--------------------------------------------------------------------------
    */

    const deliveryAmount =
      roundMoney(
        order.deliveryAmount
      );

    if (
      deliveryAmount >
      0
    ) {
      const expressDeliveryItemId =
        getRequiredEnv(
          "ZOHO_EXPRESS_DELIVERY_ITEM_ID"
        );

      lines.push({
        type:
          "DELIVERY",

        orderItemId:
          null,

        zohoItemId:
          expressDeliveryItemId,

        name:
          "Express Delivery",

        description:
          order.deliveryMethod ===
          "EXPRESS"
            ? "MyShops Express Delivery"
            : "MyShops Delivery",

        productType:
          "service",

        quantity:
          1,

        rate:
          deliveryAmount,

        grossAmount:
          deliveryAmount,

        couponEligible:
          false,

        couponDiscount:
          0,
      });
    }

    return lines;
  };

/*
|--------------------------------------------------------------------------
| Append Gift Voucher Informational Lines
|--------------------------------------------------------------------------
|
| Business rule:
| - The parent product is already posted at the FINAL customer price.
| - The Gift Voucher Zoho item is therefore always posted at AED 0.
| - The voucher value is informational and appears in the description.
| - The description identifies the parent product and SKU.
| - The GV line is not coupon eligible and must never change order totals.
|--------------------------------------------------------------------------
*/

const appendGiftVoucherLines =
  ({
    lines,
    order,
    giftVoucherItemId,
  }) => {
    const result =
      [];

    const itemsById =
      new Map(
        (order.items || [])
          .map(
            item => [
              String(
                item.id
              ),
              item,
            ]
          )
      );

    for (
      const line of
      lines
    ) {
      result.push(
        line
      );

      if (
        line.type !==
        "PRODUCT"
      ) {
        continue;
      }

      const item =
        itemsById.get(
          String(
            line.orderItemId
          )
        );

      if (
        !item
      ) {
        continue;
      }

      const voucherUnitValue =
        roundMoney(
          item
            .giftVoucherDiscountUnit
        );

      const voucherTotalValue =
        roundMoney(
          item
            .giftVoucherDiscountAmount
        );

      if (
        voucherUnitValue <=
          0 &&
        voucherTotalValue <=
          0
      ) {
        continue;
      }

      const parentQuantity =
        Math.max(
          toNumber(
            item.quantity
          ),
          1
        );

      const effectiveTotalValue =
        voucherTotalValue >
          0
          ? voucherTotalValue
          : roundMoney(
              voucherUnitValue *
              parentQuantity
            );

      const promotionCode =
        String(
          item
            .giftVoucherPromotionCode ||
          ""
        ).trim();

      const fundingSource =
        String(
          item
            .giftVoucherFundingSource ||
          ""
        ).trim();

      const valueDescription =
        parentQuantity >
          1
          ? `Gift Voucher AED ${voucherUnitValue.toFixed(
              2
            )} per unit x ${parentQuantity} = AED ${effectiveTotalValue.toFixed(
              2
            )} applied for:`
          : `Gift Voucher AED ${effectiveTotalValue.toFixed(
              2
            )} applied for:`;

      const description =
        [
          valueDescription,

          item.productName,

          `SKU: ${item.sku}`,

          promotionCode
            ? `Promotion: ${promotionCode}`
            : null,

          fundingSource
            ? `Funded by: ${fundingSource}`
            : null,
        ]
          .filter(
            Boolean
          )
          .join(
            "\n"
          );

      result.push({
        type:
          "GIFT_VOUCHER",

        orderItemId:
          item.id,

        parentOrderItemId:
          item.id,

        parentSku:
          item.sku,

        zohoItemId:
          String(
            giftVoucherItemId
          ),

        name:
          "Gift Voucher",

        description,

        productType:
          "goods",

        /*
         * One informational GV line per parent order item.
         * Quantity stays 1 even if the parent quantity is greater than 1.
         * The full voucher benefit is explained in the description.
         */
        quantity:
          1,

        rate:
          0,

        grossAmount:
          0,

        couponEligible:
          false,

        couponDiscount:
          0,

        giftVoucherUnitValue:
          voucherUnitValue,

        giftVoucherTotalValue:
          effectiveTotalValue,

        giftVoucherPromotionCode:
          promotionCode ||
          null,
      });
    }

    return result;
  };

/*
|--------------------------------------------------------------------------
| Allocate Coupon Discount
|--------------------------------------------------------------------------
|
| The coupon discount is allocated proportionally across eligible merchandise
| lines. The final eligible line receives the rounding difference so that the
| sum of Zoho line discounts equals Order.discountAmount exactly.
|--------------------------------------------------------------------------
*/

const allocateCouponDiscount =
  ({
    lines,
    discountAmount,
  }) => {
    const totalDiscount =
      roundMoney(
        discountAmount
      );

    if (
      totalDiscount <=
      0
    ) {
      return lines;
    }

    const eligibleEntries =
      lines
        .map(
          (
            line,
            index
          ) => ({
            line,
            index,
          })
        )
        .filter(
          (
            entry
          ) =>
            entry.line
              .couponEligible &&
            entry.line
              .grossAmount >
              0
        );

    if (
      !eligibleEntries.length
    ) {
      throw new Error(
        "Order contains a coupon discount but there are no coupon-eligible Zoho lines."
      );
    }

    const eligibleGross =
      roundMoney(
        eligibleEntries.reduce(
          (
            total,
            entry
          ) =>
            total +
            entry.line
              .grossAmount,
          0
        )
      );

    if (
      eligibleGross <=
      0
    ) {
      throw new Error(
        "Coupon discount cannot be allocated because eligible merchandise total is zero."
      );
    }

    if (
      totalDiscount >
      eligibleGross
    ) {
      throw new Error(
        `Coupon discount AED ${totalDiscount.toFixed(
          2
        )} exceeds eligible merchandise amount AED ${eligibleGross.toFixed(
          2
        )}.`
      );
    }

    let allocated =
      0;

    eligibleEntries.forEach(
      (
        entry,
        position
      ) => {
        const isLast =
          position ===
          eligibleEntries.length -
            1;

        let allocation;

        if (
          isLast
        ) {
          allocation =
            roundMoney(
              totalDiscount -
              allocated
            );
        } else {
          allocation =
            roundMoney(
              totalDiscount *
              (
                entry.line
                  .grossAmount /
                eligibleGross
              )
            );

          allocated =
            roundMoney(
              allocated +
              allocation
            );
        }

        lines[
          entry.index
        ].couponDiscount =
          allocation;
      }
    );

    const allocatedTotal =
      roundMoney(
        lines.reduce(
          (
            total,
            line
          ) =>
            total +
            toNumber(
              line.couponDiscount
            ),
          0
        )
      );

    if (
      allocatedTotal !==
      totalDiscount
    ) {
      throw new Error(
        `Coupon allocation mismatch. Expected AED ${totalDiscount.toFixed(
          2
        )}, allocated AED ${allocatedTotal.toFixed(
          2
        )}.`
      );
    }

    return lines;
  };

/*
|--------------------------------------------------------------------------
| Build Zoho Line Items
|--------------------------------------------------------------------------
*/

const buildZohoLineItems =
  ({
    lines,
    standardTaxId,
  }) =>
    lines.map(
      (
        line,
        index
      ) => {
        const result = {
          item_id:
            line.zohoItemId,

          product_type:
            line.productType,

          name:
            line.name,

          description:
            line.description,

          item_order:
            index,

          rate:
            line.rate,

          quantity:
            line.quantity,

          tax_id:
            standardTaxId,
        };

        if (
          line.couponDiscount >
          0
        ) {
          /*
           * Zoho Books accepts a flat line discount.
           */
          result.discount =
            String(
              roundMoney(
                line.couponDiscount
              )
            );
        }

        return result;
      }
    );

/*
|--------------------------------------------------------------------------
| Expected Total Check
|--------------------------------------------------------------------------
|
| This is a PRE-POST sanity check based on the MyShops-side values.
| Zoho still remains the final VAT calculator because prices are inclusive.
|--------------------------------------------------------------------------
*/

const validateExpectedGrossTotal =
  ({
    order,
    salesLines,
  }) => {
    const grossBeforeCoupon =
      roundMoney(
        salesLines.reduce(
          (
            total,
            line
          ) =>
            total +
            line.grossAmount,
          0
        )
      );

    const couponDiscount =
      roundMoney(
        order.discountAmount
      );

    const expectedFromLines =
      roundMoney(
        grossBeforeCoupon -
        couponDiscount
      );

    const myShopsGrandTotal =
      roundMoney(
        order.grandTotal
      );

    /*
     * Allow 1 fils tolerance for decimal normalization.
     */
    if (
      Math.abs(
        expectedFromLines -
        myShopsGrandTotal
      ) >
      0.01
    ) {
      throw new Error(
        `Zoho pre-post total mismatch. Lines after coupon = AED ${expectedFromLines.toFixed(
          2
        )}, MyShops grandTotal = AED ${myShopsGrandTotal.toFixed(
          2
        )}.`
      );
    }
  };

/*
|--------------------------------------------------------------------------
| Create Zoho Sales Order
|--------------------------------------------------------------------------
*/

const createZohoSalesOrder =
  async ({
    orderId,
  }) => {
    const order =
      await loadOrder(
        orderId
      );

    /*
    |--------------------------------------------------------------------------
    | Idempotency
    |--------------------------------------------------------------------------
    */

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
      };
    }

    validateOrderForZoho(
      order
    );

    await order.update({
      zohoSyncStatus:
        "PROCESSING",

      zohoSyncError:
        null,
    });

    try {
      const shippingAddress =
        order.addresses?.find(
          (
            address
          ) =>
            address.addressType ===
            "SHIPPING"
        ) ||
        order.addresses?.[0] ||
        null;

      /*
      |--------------------------------------------------------------------------
      | Resolve Zoho Customer
      |--------------------------------------------------------------------------
      |
      | Resolver flow:
      |
      | 1. Existing local zohoCustomerId
      | 2. Search Zoho by email
      | 3. Search Zoho by mobile
      | 4. Create Zoho customer
      |--------------------------------------------------------------------------
      */

      const customer =
        await resolveZohoCustomer({
          order,
          address:
            shippingAddress,
        });

      const {
        organizationId,
        currencyId,
        standardTaxId,
        onlineSalesLocationId,
        giftVoucherItemId,
        apiBaseUrl,
      } =
        getConfig();

      /*
      |--------------------------------------------------------------------------
      | Product + Protection Lines
      |--------------------------------------------------------------------------
      */

      let salesLines =
        buildSalesLines(
          order
        );

      /*
      |--------------------------------------------------------------------------
      | Coupon Allocation
      |--------------------------------------------------------------------------
      */

      salesLines =
        allocateCouponDiscount({
          lines:
            salesLines,

          discountAmount:
            order.discountAmount,
        });

      /*
      |--------------------------------------------------------------------------
      | Reconciliation Before API Call
      |--------------------------------------------------------------------------
      */

      validateExpectedGrossTotal({
        order,
        salesLines,
      });

      /*
      |--------------------------------------------------------------------------
      | Gift Voucher Informational Lines
      |--------------------------------------------------------------------------
      |
      | Add these only AFTER coupon allocation and total reconciliation.
      | They are AED 0 lines and must never affect the MyShops/Zoho total.
      |--------------------------------------------------------------------------
      */

      salesLines =
        appendGiftVoucherLines({
          lines:
            salesLines,

          order,

          giftVoucherItemId,
        });

      /*
      |--------------------------------------------------------------------------
      | Final Zoho Lines
      |--------------------------------------------------------------------------
      */

      const lineItems =
        buildZohoLineItems({
          lines:
            salesLines,

          standardTaxId,
        });

      /*
      |--------------------------------------------------------------------------
      | Zoho Books v3 Sales Order Payload
      |--------------------------------------------------------------------------
      */

      const payload = {
        customer_id:
          customer.customerId,

        currency_id:
          currencyId,

        reference_number:
          order.orderNumber,

        date:
          new Date(
            order.placedAt
          )
            .toISOString()
            .slice(
              0,
              10
            ),

        is_discount_before_tax:
          true,

        discount_type:
          "item_level",

        /*
         * Website selling prices include UAE VAT.
         */
        is_inclusive_tax:
          true,

        exchange_rate:
          1,

        location_id:
          onlineSalesLocationId,

        line_items:
          lineItems,

        notes:
          buildFulfillmentNotes(
            order
          ),
      };

      const token =
        await getAccessToken();

      const response =
        await fetch(
          `${apiBaseUrl}/books/v3/salesorders?organization_id=${encodeURIComponent(
            organizationId
          )}`,
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Zoho-oauthtoken ${token}`,
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const responsePayload =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        Number(
          responsePayload
            ?.code
        ) !==
          0
      ) {
        throw new Error(
          responsePayload
            ?.message ||
          `Zoho Sales Order API returned HTTP ${response.status}.`
        );
      }

      const salesOrder =
        responsePayload
          ?.salesorder;

      if (
        !salesOrder
          ?.salesorder_id
      ) {
        throw new Error(
          "Zoho Sales Order response did not contain salesorder_id."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Post-response Reconciliation
      |--------------------------------------------------------------------------
      */

      const zohoTotal =
        roundMoney(
          salesOrder.total
        );

      const myShopsGrandTotal =
        roundMoney(
          order.grandTotal
        );

      if (
        Math.abs(
          zohoTotal -
          myShopsGrandTotal
        ) >
        0.01
      ) {
        /*
         * The Sales Order already exists in Zoho at this point, so we MUST
         * store its ID to preserve idempotency and then flag the mismatch.
         */
        await order.update({
          zohoSalesOrderId:
            String(
              salesOrder
                .salesorder_id
            ),

          zohoSalesOrderNumber:
            salesOrder
              .salesorder_number ||
            null,

          zohoSyncStatus:
            "FAILED",

          zohoSyncError:
            `Zoho Sales Order was created but total mismatch occurred. Zoho AED ${zohoTotal.toFixed(
              2
            )}, MyShops AED ${myShopsGrandTotal.toFixed(
              2
            )}.`,

          zohoSyncedAt:
            new Date(),
        });

        throw new Error(
          `Zoho Sales Order ${salesOrder.salesorder_number || salesOrder.salesorder_id} was created, but total mismatch occurred. Zoho AED ${zohoTotal.toFixed(
            2
          )}, MyShops AED ${myShopsGrandTotal.toFixed(
            2
          )}.`
        );
      }

      await order.update({
        zohoSalesOrderId:
          String(
            salesOrder
              .salesorder_id
          ),

        zohoSalesOrderNumber:
          salesOrder
            .salesorder_number ||
          null,

        zohoSyncStatus:
          "POSTED",

        zohoSyncError:
          null,

        zohoSyncedAt:
          new Date(),
      });

      return {
        alreadyPosted:
          false,

        orderId:
          order.id,

        orderNumber:
          order.orderNumber,

        zohoCustomerId:
          customer.customerId,

        customerSource:
          customer.source,

        zohoSalesOrderId:
          String(
            salesOrder
              .salesorder_id
          ),

        zohoSalesOrderNumber:
          salesOrder
            .salesorder_number ||
          null,

        zohoLocationId:
          onlineSalesLocationId,

        zohoTotal,

        myShopsGrandTotal,

        zohoStatus:
          salesOrder.status ||
          null,

        couponCode:
          order.couponCode ||
          null,

        couponDiscount:
          roundMoney(
            order.discountAmount
          ),

        lines:
          salesLines.map(
            (
              line
            ) => ({
              type:
                line.type,

              name:
                line.name,

              zohoItemId:
                line.zohoItemId,

              quantity:
                line.quantity,

              rate:
                line.rate,

              couponDiscount:
                line.couponDiscount,

              description:
                line.description,
            })
          ),
      };
    } catch (
      error
    ) {
      /*
       * If a Zoho Sales Order ID was already saved by the post-response
       * mismatch protection above, preserve it and only update the error.
       */
      const freshOrder =
        await db.Order.findByPk(
          order.id,
          {
            attributes: [
              "zohoSalesOrderId",
            ],

            raw:
              true,
          }
        );

      await order.update({
        zohoSyncStatus:
          freshOrder
            ?.zohoSalesOrderId
            ? "FAILED"
            : "FAILED",

        zohoSyncError:
          String(
            error.message ||
            error
          ).slice(
            0,
            5000
          ),
      });

      throw error;
    }
  };

module.exports = {
  createZohoSalesOrder,

  /*
   * Export helpers for unit/integration testing.
   */
  buildSalesLines,
  appendGiftVoucherLines,
  allocateCouponDiscount,
  buildZohoLineItems,
};
