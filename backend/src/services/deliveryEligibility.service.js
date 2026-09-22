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
  
  const toNumber = (
    value
  ) => {
    const n =
      Number(
        value
      );
  
    return Number.isFinite(
      n
    )
      ? n
      : 0;
  };
  
  const normalizeCode = (
    value
  ) =>
    String(
      value ??
        ""
    )
      .trim()
      .toUpperCase()
      .replace(
        /\s+/g,
        "_"
      );
  
  const normalizeCityCode = (
    value
  ) => {
    const code =
      normalizeCode(
        value
      );
  
    if (
      code ===
        "ABUDHABI" ||
      code ===
        "ABU-DHABI"
    ) {
      return "ABU_DHABI";
    }
  
    return code;
  };

  /*
|--------------------------------------------------------------------------
| UAE Express Delivery Cutoffs
|--------------------------------------------------------------------------
|
| Dubai / Sharjah:
| 2-hour delivery is available before 2:00 PM UAE time.
|
| Abu Dhabi:
| 1-hour delivery is available before 5:00 PM UAE time.
|
| IMPORTANT:
| Always calculate using Asia/Dubai.
| Never rely on browser/device time.
|--------------------------------------------------------------------------
*/

const getUaeExpressCutoffs =
() => {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Asia/Dubai",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hourCycle:
          "h23",
      }
    ).formatToParts(
      new Date()
    );

  const hour =
    Number(
      parts.find(
        part =>
          part.type ===
          "hour"
      )?.value || 0
    );

  const minute =
    Number(
      parts.find(
        part =>
          part.type ===
          "minute"
      )?.value || 0
    );

  const currentMinutes =
    hour * 60 +
    minute;

  const dubaiSharjahCutoffMinutes =
    14 * 60;

  const abuDhabiCutoffMinutes =
    17 * 60;

  return {
    timezone:
      "Asia/Dubai",

    currentTime:
      `${String(hour).padStart(
        2,
        "0"
      )}:${String(
        minute
      ).padStart(
        2,
        "0"
      )}`,

    dubaiSharjah: {
      cutoffTime:
        "14:00",

      cutoffPassed:
        currentMinutes >=
        dubaiSharjahCutoffMinutes,

      available:
        currentMinutes <
        dubaiSharjahCutoffMinutes,
    },

    abuDhabi: {
      cutoffTime:
        "17:00",

      cutoffPassed:
        currentMinutes >=
        abuDhabiCutoffMinutes,

      available:
        currentMinutes <
        abuDhabiCutoffMinutes,
    },
  };
};
  
  const getCompany =
    async (
      companyCode
    ) => {
      const code =
        normalizeCode(
          companyCode ||
            "MYSHOPS"
        );
  
      const company =
        await db.Company.findOne({
          where: {
            code,
            isActive:
              true,
          },
        });
  
      if (!company) {
        throw new AppError(
          "Company not found.",
          404,
          "COMPANY_NOT_FOUND"
        );
      }
  
      return company;
    };
  
  const getZonesForCity =
    async ({
      companyId,
      cityCode,
    }) => {
      const normalizedCity =
        normalizeCityCode(
          cityCode
        );
  
      const zones =
        await db.DeliveryZone.findAll({
          where: {
            companyId,
            isActive:
              true,
          },
  
          include: [
            {
              model:
                db.DeliveryZoneCity,
  
              as:
                "cities",
  
              required:
                true,
  
              where: {
                companyId,
  
                cityCode:
                  normalizedCity,
  
                isActive:
                  true,
              },
  
              attributes: [
                "id",
                "cityCode",
                "cityName",
              ],
            },
  
            {
              model:
                db.DeliveryZoneLocation,
  
              as:
                "locations",
  
              required:
                false,
  
              where: {
                companyId,
  
                isActive:
                  true,
              },
  
              include: [
                {
                  model:
                    db.InventoryLocation,
  
                  as:
                    "inventoryLocation",
  
                  required:
                    true,
  
                  where: {
                    companyId,
  
                    isActive:
                      true,
  
                    isDeliveryEnabled:
                      true,
                  },
  
                  attributes: [
                    "id",
                    "code",
                    "name",
                    "emirate",
                    "city",
                  ],
                },
              ],
            },
          ],
  
          order: [
            [
              "priority",
              "ASC",
            ],
  
            [
              {
                model:
                  db.DeliveryZoneLocation,
  
                as:
                  "locations",
              },
  
              "priority",
              "ASC",
            ],
          ],
        });
  
      return zones;
    };

  /*
  |--------------------------------------------------------------------------
  | Get Delivery Zone By Code
  |--------------------------------------------------------------------------
  */

  const getZoneByCode =
    async ({
      companyId,
      zoneCode,
    }) => {
      const normalizedZoneCode =
        normalizeCode(
          zoneCode
        );

      const zone =
        await db.DeliveryZone.findOne({
          where: {
            companyId,
            code:
              normalizedZoneCode,
            isActive:
              true,
          },

          include: [
            {
              model:
                db.DeliveryZoneLocation,
              as:
                "locations",
              required:
                false,
              where: {
                companyId,
                isActive:
                  true,
              },
              include: [
                {
                  model:
                    db.InventoryLocation,
                  as:
                    "inventoryLocation",
                  required:
                    true,
                  where: {
                    companyId,
                    isActive:
                      true,
                    isDeliveryEnabled:
                      true,
                  },
                  attributes: [
                    "id",
                    "code",
                    "name",
                    "emirate",
                    "city",
                  ],
                },
              ],
            },
          ],

          order: [
            [
              {
                model:
                  db.DeliveryZoneLocation,
                as:
                  "locations",
              },
              "priority",
              "ASC",
            ],
          ],
        });

      return zone;
    };

  const STANDARD_ONLY_UAE_CITIES =
    new Set([
      "AJMAN",
      "UMM_AL_QUWAIN",
      "RAS_AL_KHAIMAH",
      "FUJAIRAH",
    ]);


  
  const getVariantMap =
    async ({
      companyId,
      items,
    }) => {
      const variantIds =
        [
          ...new Set(
            items
              .map(
                item =>
                  String(
                    item.productVariantId ||
                      ""
                  ).trim()
              )
              .filter(
                Boolean
              )
          ),
        ];
  
      if (
        variantIds.length ===
        0
      ) {
        throw new AppError(
          "At least one productVariantId is required.",
          400,
          "DELIVERY_ITEMS_REQUIRED"
        );
      }
  
      const variants =
        await db.ProductVariant.findAll({
          where: {
            companyId,
  
            id: {
              [Op.in]:
                variantIds,
            },
  
            status:
              "ACTIVE",
          },
  
          attributes: [
            "id",
            "productId",
            "sku",
            "name",
          ],
  
          include: [
            {
              model:
                db.Product,
  
              as:
                "product",
  
              required:
                true,
  
                attributes: [
                  "id",
                  "name",
                  "isDirectDelivery",
                  "alwaysAvailableForSale",
                ],
            },
          ],
        });
  
      const map =
        new Map();
  
      for (
        const variant of
        variants
      ) {
        map.set(
          variant.id,
          variant
        );
      }
  
      return map;
    };
  
  const getBalanceMap =
    async ({
      companyId,
      variantIds,
      locationIds,
    }) => {
      if (
        variantIds.length ===
          0 ||
        locationIds.length ===
          0
      ) {
        return new Map();
      }
  
      const balances =
        await db.InventoryBalance.findAll({
          where: {
            companyId,
  
            productVariantId: {
              [Op.in]:
                variantIds,
            },
  
            inventoryLocationId: {
              [Op.in]:
                locationIds,
            },
          },
  
          attributes: [
            "productVariantId",
            "inventoryLocationId",
            "quantityOnHand",
            "quantityReserved",
          ],
  
          raw:
            true,
        });
  
      const map =
        new Map();
  
      for (
        const balance of
        balances
      ) {
        const available =
          Math.max(
            0,
            toNumber(
              balance.quantityOnHand
            ) -
              toNumber(
                balance.quantityReserved
              )
          );
  
        map.set(
          `${balance.productVariantId}:${balance.inventoryLocationId}`,
          available
        );
      }
  
      return map;
    };
  
  const allocateFromZone =
    ({
      zone,
      variant,
      requestedQty,
      balanceMap,
      workingStock,
    }) => {
      let remaining =
        requestedQty;
  
      const allocations =
        [];
  
      const zoneLocations =
        Array.isArray(
          zone.locations
        )
          ? zone.locations
          : [];
  
      for (
        const assignment of
        zoneLocations
      ) {
        if (
          remaining <=
          0
        ) {
          break;
        }
  
        const location =
          assignment
            .inventoryLocation;
  
        if (!location) {
          continue;
        }
  
        const key =
          `${variant.id}:${location.id}`;
  
        let available;
  
        if (
          workingStock.has(
            key
          )
        ) {
          available =
            workingStock.get(
              key
            );
        } else {
          available =
            balanceMap.get(
              key
            ) ||
            0;
  
          workingStock.set(
            key,
            available
          );
        }
  
        if (
          available <=
          0
        ) {
          continue;
        }
  
        const allocated =
          Math.min(
            remaining,
            available
          );
  
        allocations.push({
          productVariantId:
            variant.id,
  
          sku:
            variant.sku,
  
          quantity:
            allocated,
  
          inventoryLocationId:
            location.id,
  
          inventoryLocationCode:
            location.code,
  
          inventoryLocationName:
            location.name,
        });
  
        workingStock.set(
          key,
          available -
            allocated
        );
  
        remaining -=
          allocated;
      }
  
      return {
        allocations,
        allocatedQuantity:
          requestedQty -
          remaining,
        remainingQuantity:
          remaining,
      };
    };
  
  const getPickupLocation =
    async ({
      companyId,
      pickupLocationId,
    }) => {
      const id =
        String(
          pickupLocationId ||
          ""
        ).trim();

      if (!id) {
        return null;
      }

      return db.InventoryLocation.findOne({
        where: {
          id,
          companyId,
          isActive:
            true,
        },
        attributes: [
          "id",
          "code",
          "name",
          "emirate",
          "city",
        ],
      });
    };

  const getPickupAvailableQuantity =
    async ({
      companyId,
      productVariantId,
      inventoryLocationId,
    }) => {
      const balance =
        await db.InventoryBalance.findOne({
          where: {
            companyId,
            productVariantId,
            inventoryLocationId,
          },
          attributes: [
            "quantityOnHand",
            "quantityReserved",
          ],
          raw:
            true,
        });

      if (!balance) {
        return 0;
      }

      return Math.max(
        0,
        toNumber(
          balance.quantityOnHand
        ) -
        toNumber(
          balance.quantityReserved
        )
      );
    };

  const buildDeliveryPlan =
    async ({
      companyCode =
        "MYSHOPS",
      cityCode,
      items,
    }) => {
      if (
        !Array.isArray(
          items
        ) ||
        items.length ===
          0
      ) {
        throw new AppError(
          "Cart items are required.",
          400,
          "DELIVERY_ITEMS_REQUIRED"
        );
      }
  
      const company =
        await getCompany(
          companyCode
        );
  
      const normalizedCity =
        normalizeCityCode(
          cityCode
        );

      const hasNonPickupItems =
        items.some(
          item =>
            normalizeCode(
              item?.selectedDeliveryMethod ||
              "STANDARD"
            ) !==
            "PICKUP"
        );

      if (
        hasNonPickupItems &&
        !normalizedCity
      ) {
        throw new AppError(
          "cityCode is required for delivery items.",
          400,
          "CITY_REQUIRED"
        );
      }

      let zones =
        hasNonPickupItems
          ? await getZonesForCity({
              companyId:
                company.id,

              cityCode:
                normalizedCity,
            })
          : [];

/*
|--------------------------------------------------------------------------
| Apply UAE Express Delivery Cutoffs
|--------------------------------------------------------------------------
|
| Remove an express zone once its same-day cutoff has passed.
|
| Standard delivery zones remain untouched, allowing the existing
| allocation logic to fall back naturally to UAE_STANDARD.
|--------------------------------------------------------------------------
*/

const expressCutoffs =
  getUaeExpressCutoffs();

if (
  hasNonPickupItems &&
  zones.length >
    0
) {
  zones =
    zones.filter(
      zone => {
        const zoneCode =
          normalizeCode(
            zone.code
          );

        /*
         * Dubai / Sharjah
         * 2-hour delivery only before 2:00 PM.
         */

        if (
          zoneCode ===
          "DXB_SHJ_2H"
        ) {
          return (
            expressCutoffs
              .dubaiSharjah
              .available ===
            true
          );
        }

        /*
         * Abu Dhabi
         * 1-hour delivery only before 5:00 PM.
         */

        if (
          zoneCode ===
          "AUH_1H"
        ) {
          return (
            expressCutoffs
              .abuDhabi
              .available ===
            true
          );
        }

        /*
         * UAE_STANDARD and any other
         * non-express zones remain available.
         */

        return true;
      }
    );
}          
      /*
      |--------------------------------------------------------------------------
      | UAE Standard Delivery Fallback
      |--------------------------------------------------------------------------
      |
      | Dubai / Sharjah:
      | DXB_SHJ_2H -> UAE_STANDARD
      |
      | Abu Dhabi:
      | AUH_1H -> UAE_STANDARD
      |
      | Ajman / UAQ / RAK / Fujairah:
      | UAE_STANDARD
      |
      |--------------------------------------------------------------------------
      */

      if (
        hasNonPickupItems &&
        zones.length ===
          0 &&
        STANDARD_ONLY_UAE_CITIES.has(
          normalizedCity
        )
      ) {
        const standardZone =
          await getZoneByCode({
            companyId:
              company.id,

            zoneCode:
              "UAE_STANDARD",
          });

        if (
          standardZone
        ) {
          zones = [
            standardZone,
          ];
        }
      }

      if (
        hasNonPickupItems &&
        zones.length ===
        0
      ) {
        throw new AppError(
          `No delivery zone is configured for ${normalizedCity}.`,
          400,
          "DELIVERY_ZONE_NOT_FOUND"
        );
      }
  
      const variantMap =
        await getVariantMap({
          companyId:
            company.id,
  
          items,
        });
  
      const locationIds =
        [
          ...new Set(
            zones.flatMap(
              zone =>
                (
                  zone.locations ||
                  []
                )
                  .map(
                    assignment =>
                      assignment
                        .inventoryLocation
                        ?.id
                  )
                  .filter(
                    Boolean
                  )
            )
          ),
        ];
  
      const variantIds =
        [
          ...variantMap.keys(),
        ];
  
      const balanceMap =
        await getBalanceMap({
          companyId:
            company.id,
  
          variantIds,
  
          locationIds,
        });
  
      const workingStock =
        new Map();
  
      const shipmentMap =
        new Map();
  
      const pickupShipmentMap =
        new Map();
  
      const unfulfilled =
        [];
  
      const directDeliveryItems =
        [];
      
        const alwaysAvailableItems =
        [];
  
      const addShipmentAllocation =
        (
          zone,
          allocation
        ) => {
          let shipment =
            shipmentMap.get(
              zone.id
            );
  
          if (!shipment) {
            shipment = {
              deliveryZoneId:
                zone.id,
  
              deliveryZoneCode:
                zone.code,
  
              deliveryLabel:
                zone.name,
  
              deliveryMethod:
                zone.deliveryMethod,
  
              deliveryHours:
                zone.deliveryHours,
  
              deliveryMinDays:
                zone.deliveryMinDays,
  
              deliveryMaxDays:
                zone.deliveryMaxDays,
  
              deliveryAmount:
                toNumber(
                  zone.deliveryAmount
                ),
  
              allocations:
                [],
            };
  
            shipmentMap.set(
              zone.id,
              shipment
            );
          }
  
          shipment.allocations.push(
            allocation
          );
        };
  
      const addPickupAllocation =
        ({
          location,
          allocation,
        }) => {
          const key =
            `PICKUP:${location.id}`;

          let shipment =
            pickupShipmentMap.get(
              key
            );

          if (!shipment) {
            shipment = {
              deliveryZoneId:
                null,
              deliveryZoneCode:
                "STORE_PICKUP",
              deliveryLabel:
                `Store Pickup - ${location.name || location.code}`,
              deliveryMethod:
                "PICKUP",
              deliveryHours:
                null,
              deliveryMinDays:
                null,
              deliveryMaxDays:
                null,
              deliveryAmount:
                0,
              allocations:
                [],
            };

            pickupShipmentMap.set(
              key,
              shipment
            );
          }

          shipment.allocations.push(
            allocation
          );
        };

      for (
        const requestItem of
        items
      ) {
        const productVariantId =
          String(
            requestItem
              .productVariantId ||
              ""
          ).trim();
  
        const requestedQuantity =
          toNumber(
            requestItem.quantity
          );
  
        if (
          !productVariantId ||
          requestedQuantity <=
            0
        ) {
          unfulfilled.push({
            productVariantId:
              productVariantId ||
              null,
  
            requestedQuantity,
  
            reason:
              "INVALID_ITEM",
          });
  
          continue;
        }
  
        const variant =
          variantMap.get(
            productVariantId
          );
  
        if (!variant) {
          unfulfilled.push({
            productVariantId,
  
            requestedQuantity,
  
            reason:
              "PRODUCT_VARIANT_NOT_FOUND",
          });
  
          continue;
        }
  
        const selectedDeliveryMethod =
          normalizeCode(
            requestItem
              .selectedDeliveryMethod ||
            "STANDARD"
          );

        /*
        |--------------------------------------------------------------------------
        | Store Pickup Overrides Express
        |--------------------------------------------------------------------------
        */

        if (
          selectedDeliveryMethod ===
          "PICKUP"
        ) {
          const selectedPickupLocationId =
            String(
              requestItem
                .selectedPickupLocationId ||
              ""
            ).trim();

          if (!selectedPickupLocationId) {
            unfulfilled.push({
              productVariantId:
                variant.id,
              sku:
                variant.sku,
              requestedQuantity,
              unfulfilledQuantity:
                requestedQuantity,
              reason:
                "PICKUP_LOCATION_REQUIRED",
            });

            continue;
          }

          const pickupLocation =
            await getPickupLocation({
              companyId:
                company.id,
              pickupLocationId:
                selectedPickupLocationId,
            });

          if (!pickupLocation) {
            unfulfilled.push({
              productVariantId:
                variant.id,
              sku:
                variant.sku,
              requestedQuantity,
              unfulfilledQuantity:
                requestedQuantity,
              reason:
                "PICKUP_LOCATION_NOT_FOUND",
            });

            continue;
          }

          const available =
            await getPickupAvailableQuantity({
              companyId:
                company.id,
              productVariantId:
                variant.id,
              inventoryLocationId:
                pickupLocation.id,
            });

          if (
            available <
            requestedQuantity
          ) {
            unfulfilled.push({
              productVariantId:
                variant.id,
              sku:
                variant.sku,
              requestedQuantity,
              unfulfilledQuantity:
                Math.max(
                  0,
                  requestedQuantity -
                  available
                ),
              pickupLocationId:
                pickupLocation.id,
              pickupLocationCode:
                pickupLocation.code,
              pickupLocationName:
                pickupLocation.name,
              reason:
                "INSUFFICIENT_PICKUP_STOCK",
            });

            continue;
          }

          addPickupAllocation({
            location:
              pickupLocation,
            allocation: {
              productVariantId:
                variant.id,
              sku:
                variant.sku,
              quantity:
                requestedQuantity,
              inventoryLocationId:
                pickupLocation.id,
              inventoryLocationCode:
                pickupLocation.code,
              inventoryLocationName:
                pickupLocation.name,
            },
          });

          continue;
        }

        /*
        |--------------------------------------------------------------------------
        | Direct Delivery
        |--------------------------------------------------------------------------
        |
        | Direct-delivery stock is not allocated from InventoryBalance.
        |--------------------------------------------------------------------------
        */
  
        if (
          variant.product
            ?.isDirectDelivery ===
          true
        ) {
          directDeliveryItems.push({
            productVariantId:
              variant.id,
  
            sku:
              variant.sku,
  
            productName:
              variant.product
                ?.name ||
              variant.name,
  
            quantity:
              requestedQuantity,
  
            fulfillmentType:
              "DIRECT_DELIVERY",
          });
  
          continue;
        }
  
        let remaining =
          requestedQuantity;
        
        /*
|--------------------------------------------------------------------------
| Always Available For Sale
|--------------------------------------------------------------------------
|
| For these products:
|
| 1. If physical inventory can satisfy the ENTIRE requested quantity,
|    continue through the normal allocator below.
|
| 2. If physical inventory cannot satisfy the ENTIRE quantity,
|    do not reserve partial stock.
|
|    Put the entire requested quantity into standard non-stock
|    fulfillment instead.
|
| This prevents one order line from becoming partly physical stock and
| partly backorder/non-stock fulfillment.
|--------------------------------------------------------------------------
*/

if (
  variant.product
    ?.alwaysAvailableForSale ===
  true
) {
  /*
   * Simulate allocation without modifying the real workingStock map.
   */

  const simulatedStock =
    new Map(
      workingStock
    );

  let simulatedRemaining =
    requestedQuantity;

  for (
    const zone of
    zones
  ) {
    if (
      simulatedRemaining <=
      0
    ) {
      break;
    }

    const simulatedResult =
      allocateFromZone({
        zone,
        variant,
        requestedQty:
          simulatedRemaining,
        balanceMap,
        workingStock:
          simulatedStock,
      });

    simulatedRemaining =
      simulatedResult
        .remainingQuantity;
  }

  /*
   * Real physical stock cannot satisfy the whole line.
   *
   * Do NOT perform partial physical allocation.
   */

  if (
    simulatedRemaining >
    0
  ) {
    alwaysAvailableItems.push({
      productVariantId:
        variant.id,

      sku:
        variant.sku,

      productName:
        variant.product
          ?.name ||
        variant.name,

      quantity:
        requestedQuantity,

      fulfillmentType:
        "ALWAYS_AVAILABLE",

      deliveryMethod:
        "STANDARD",
    });

    continue;
  }
}
  
        /*
        |--------------------------------------------------------------------------
        | Zones are already sorted by priority.
        |
        | AUH:
        | AUH_1H -> UAE_STANDARD
        |
        | Dubai / Sharjah:
        | DXB_SHJ_2H -> UAE_STANDARD
        |--------------------------------------------------------------------------
        */
  
        for (
          const zone of
          zones
        ) {
          if (
            remaining <=
            0
          ) {
            break;
          }
  
          const result =
            allocateFromZone({
              zone,
              variant,
              requestedQty:
                remaining,
              balanceMap,
              workingStock,
            });
  
          for (
            const allocation of
            result.allocations
          ) {
            addShipmentAllocation(
              zone,
              allocation
            );
          }
  
          remaining =
            result
              .remainingQuantity;
        }
  
        if (
          remaining >
          0
        ) {
          unfulfilled.push({
            productVariantId:
              variant.id,
  
            sku:
              variant.sku,
  
            productName:
              variant.name,
  
            requestedQuantity,
  
            unfulfilledQuantity:
              remaining,
  
            reason:
              "INSUFFICIENT_STOCK",
          });
        }
      }
  
      const shipments =
        [
          ...shipmentMap.values(),
          ...pickupShipmentMap.values(),
        ].map(
          (
            shipment,
            index
          ) => ({
            shipmentKey:
              `SHIPMENT-${index + 1}`,
  
            ...shipment,
  
            totalQuantity:
              shipment.allocations.reduce(
                (
                  total,
                  allocation
                ) =>
                  total +
                  toNumber(
                    allocation.quantity
                  ),
                0
              ),
          })
        );
  
        return {
          cityCode:
            normalizedCity,
        
          splitShipment:
            shipments.length >
              1 ||
            directDeliveryItems.length >
              0 ||
            alwaysAvailableItems.length >
              0,
        
          fullyFulfillable:
            unfulfilled.length ===
            0,
        
          shipments,
        
          directDeliveryItems,
        
          alwaysAvailableItems,
        
          unfulfilled,
        };
    };
  
  /*
|--------------------------------------------------------------------------
| Bulk Storefront Delivery Eligibility
|--------------------------------------------------------------------------
|
| This method is intended for:
|
| - Product cards
| - Category pages
| - Search results
| - PDP
|
| IMPORTANT:
|
| Each product is evaluated independently.
|
| We intentionally do NOT share workingStock between products here because
| this endpoint is informational. Product A being displayed on a category
| page must not consume Product B's simulated availability.
|
|--------------------------------------------------------------------------
*/

const buildDeliveryEligibility =
  async ({
    companyCode =
      "MYSHOPS",

    items,
  }) => {
    if (
      !Array.isArray(
        items
      ) ||
      items.length ===
        0
    ) {
      throw new AppError(
        "Items are required.",
        400,
        "DELIVERY_ITEMS_REQUIRED"
      );
    }

    const company =
      await getCompany(
        companyCode
      );
    
      const expressCutoffs =
      getUaeExpressCutoffs();

    const variantMap =
      await getVariantMap({
        companyId:
          company.id,

        items,
      });

    /*
    |--------------------------------------------------------------------------
    | Express Pools
    |--------------------------------------------------------------------------
    */

    const expressLocationCodes = [
      "DXB_WAREHOUSE",
      "DXB_WAFI",
      "DXB_DEIRA_CC",
      "AUH_SAJ",
    ];

    const locations =
      await db.InventoryLocation.findAll({
        where: {
          companyId:
            company.id,

          code: {
            [Op.in]:
              expressLocationCodes,
          },

          isActive:
            true,

          isDeliveryEnabled:
            true,
        },

        attributes: [
          "id",
          "code",
          "name",
        ],

        raw:
          true,
      });

    const locationByCode =
      new Map(
        locations.map(
          (
            location
          ) => [
            location.code,
            location,
          ]
        )
      );

    const variantIds = [
      ...variantMap.keys(),
    ];

    const locationIds =
      locations.map(
        (
          location
        ) =>
          location.id
      );

    const balanceMap =
      await getBalanceMap({
        companyId:
          company.id,

        variantIds,

        locationIds,
      });

    const getAvailableForLocation =
      (
        variantId,
        locationCode
      ) => {
        const location =
          locationByCode.get(
            locationCode
          );

        if (
          !location
        ) {
          return 0;
        }

        return (
          balanceMap.get(
            `${variantId}:${location.id}`
          ) ||
          0
        );
      };

    const results =
      [];

    for (
      const requestItem of
      items
    ) {
      const productVariantId =
        String(
          requestItem
            ?.productVariantId ||
          ""
        ).trim();

      const requestedQuantity =
        Math.max(
          1,

          toNumber(
            requestItem
              ?.quantity ||
            1
          )
        );

      if (
        !productVariantId
      ) {
        results.push({
          productVariantId:
            null,

          quantity:
            requestedQuantity,

          dubaiSharjah: {
            eligible:
              false,

            hours:
              2,

            availableQuantity:
              0,
          },

          abuDhabi: {
            eligible:
              false,

            hours:
              1,

            availableQuantity:
              0,
          },

          reason:
            "INVALID_ITEM",
        });

        continue;
      }

      const variant =
        variantMap.get(
          productVariantId
        );

      if (
        !variant
      ) {
        results.push({
          productVariantId,

          quantity:
            requestedQuantity,

          dubaiSharjah: {
            eligible:
              false,

            hours:
              2,

            availableQuantity:
              0,
          },

          abuDhabi: {
            eligible:
              false,

            hours:
              1,

            availableQuantity:
              0,
          },

          reason:
            "PRODUCT_VARIANT_NOT_FOUND",
        });

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Direct Delivery
      |--------------------------------------------------------------------------
      */

      if (
        variant.product
          ?.isDirectDelivery ===
        true
      ) {
        results.push({
          productVariantId:
            variant.id,

          sku:
            variant.sku,

          productName:
            variant.product
              ?.name ||
            variant.name,

          quantity:
            requestedQuantity,

          directDelivery:
            true,

          dubaiSharjah: {
            eligible:
              false,

            hours:
              2,

            availableQuantity:
              0,
          },

          abuDhabi: {
            eligible:
              false,

            hours:
              1,

            availableQuantity:
              0,
          },

          reason:
            null,
        });

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Dubai / Sharjah Pool
      |--------------------------------------------------------------------------
      */

      const dxbWarehouse =
        getAvailableForLocation(
          variant.id,
          "DXB_WAREHOUSE"
        );

      const dxbWafi =
        getAvailableForLocation(
          variant.id,
          "DXB_WAFI"
        );

      const dxbDeira =
        getAvailableForLocation(
          variant.id,
          "DXB_DEIRA_CC"
        );

      const dubaiSharjahAvailable =
        dxbWarehouse +
        dxbWafi +
        dxbDeira;

      /*
      |--------------------------------------------------------------------------
      | Abu Dhabi Pool
      |--------------------------------------------------------------------------
      */

      const abuDhabiAvailable =
        getAvailableForLocation(
          variant.id,
          "AUH_SAJ"
        );

      results.push({
        productVariantId:
          variant.id,

        sku:
          variant.sku,

        productName:
          variant.product
            ?.name ||
          variant.name,

        quantity:
          requestedQuantity,

        directDelivery:
          false,

          dubaiSharjah: {
            eligible:
              expressCutoffs
                .dubaiSharjah
                .available ===
                true &&
              dubaiSharjahAvailable >=
                requestedQuantity,
          
            hours:
              2,
          
            cutoffTime:
              expressCutoffs
                .dubaiSharjah
                .cutoffTime,
          
            cutoffPassed:
              expressCutoffs
                .dubaiSharjah
                .cutoffPassed,
          
            availableQuantity:
              dubaiSharjahAvailable,

          locations: {
            DXB_WAREHOUSE:
              dxbWarehouse,

            DXB_WAFI:
              dxbWafi,

            DXB_DEIRA_CC:
              dxbDeira,
          },
        },

        abuDhabi: {
          eligible:
            expressCutoffs
              .abuDhabi
              .available ===
              true &&
            abuDhabiAvailable >=
              requestedQuantity,
        
          hours:
            1,
        
          cutoffTime:
            expressCutoffs
              .abuDhabi
              .cutoffTime,
        
          cutoffPassed:
            expressCutoffs
              .abuDhabi
              .cutoffPassed,
        
          availableQuantity:
            abuDhabiAvailable,
        },

        reason:
          null,
      });
    }

    return {
      items:
        results,
    };
  };
  
  module.exports = {
    buildDeliveryPlan,
    buildDeliveryEligibility,
  };