/*
|--------------------------------------------------------------------------
| Public Storefront Availability Service
|--------------------------------------------------------------------------
|
| Centralized storefront inventory availability resolver.
|
| Internal products:
|   available = SUM(quantityOnHand - quantityReserved)
|   across ACTIVE inventory locations.
|
| Direct-delivery products:
|   do not consume internal inventory balances.
|--------------------------------------------------------------------------
*/

const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../../models"
  );

const toPlain = (
  value
) =>
  value &&
  typeof value.get ===
    "function"
    ? value.get({
        plain:
          true,
      })
    : value;

const toNumber = (
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

const directDeliveryAvailability =
  () => ({
    fulfillmentType:
      "DIRECT_DELIVERY",

    inventoryTracked:
      false,

    trackQuantity:
      false,

    status:
      "AVAILABLE",

    quantity:
      null,

    message:
      "Available to order",
  });

const internalAvailability = (
  quantity
) => {
  const availableQuantity =
    Math.max(
      0,
      toNumber(
        quantity
      )
    );

  const available =
    availableQuantity >
    0;

  return {
    fulfillmentType:
      "INTERNAL",

    inventoryTracked:
      true,

    trackQuantity:
      true,

    status:
      available
        ? "AVAILABLE"
        : "OUT_OF_STOCK",

    quantity:
      availableQuantity,

    message:
      available
        ? "In stock"
        : "Out of stock",
  };
};

/*
|--------------------------------------------------------------------------
| Always Available For Sale
|--------------------------------------------------------------------------
|
| Product remains purchasable even when physical inventory is zero.
|
| IMPORTANT:
|
| - quantity remains the real physical available quantity
| - inventory remains tracked
| - this does NOT create virtual inventory
| - express delivery continues to use physical location stock
| - store pickup continues to use physical location stock
|--------------------------------------------------------------------------
*/

const alwaysAvailableForSaleAvailability = (
  quantity = 0
) => {
  const availableQuantity =
    Math.max(
      0,
      toNumber(
        quantity
      )
    );

  return {
    fulfillmentType:
      "INTERNAL",

    inventoryTracked:
      true,

    trackQuantity:
      true,

    status:
      "AVAILABLE",

    quantity:
      availableQuantity,

    message:
      availableQuantity > 0
        ? "In stock"
        : "Available to order",

    alwaysAvailableForSale:
      true,
  };
};

const collectVariantEntries = (
  products
) => {
  const entries =
    [];

  for (
    const productModel of
    products ||
    []
  ) {
    const product =
      toPlain(
        productModel
      );

    if (!product) {
      continue;
    }

    const variants =
      Array.isArray(
        product.variants
      )
        ? product.variants
        : [];

    for (
      const variantModel of
      variants
    ) {
      const variant =
        toPlain(
          variantModel
        );

      if (!variant?.id) {
        continue;
      }

      entries.push({
        productVariantId:
          variant.id,

        isDirectDelivery:
          product.isDirectDelivery ===
          true,
      });
    }
  }

  return entries;
};

const getVariantAvailabilityMap =
  async ({
    companyId,
    products,
  }) => {
    const entries =
      collectVariantEntries(
        products
      );

    const availabilityMap =
      new Map();

    if (
      !entries.length
    ) {
      return availabilityMap;
    }

    const internalVariantIds =
      [];

    for (
      const entry of
      entries
    ) {
      if (
        entry.isDirectDelivery
      ) {
        availabilityMap.set(
          entry.productVariantId,
          directDeliveryAvailability()
        );

        continue;
      }

      /*
       * Seed normal inventory-tracked variants at zero.
       * A missing InventoryBalance record therefore means
       * OUT_OF_STOCK, never AVAILABLE.
       */
      availabilityMap.set(
        entry.productVariantId,
        internalAvailability(
          0
        )
      );

      internalVariantIds.push(
        entry.productVariantId
      );
    }

    if (
      !internalVariantIds.length
    ) {
      return availabilityMap;
    }

    const balances =
      await db.InventoryBalance.findAll({
        where: {
          companyId,

          productVariantId: {
            [Op.in]:
              internalVariantIds,
          },
        },

        attributes: [
          "productVariantId",
          "quantityOnHand",
          "quantityReserved",
        ],

        include: [
          {
            model:
              db.InventoryLocation,

            as:
              "location",

            required:
              true,

            attributes: [
              "id",
            ],

            where: {
              companyId,

              isActive:
                true,
            },
          },
        ],
      });

    const quantities =
      new Map();

    for (
      const balanceModel of
      balances
    ) {
      const balance =
        toPlain(
          balanceModel
        );

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

      quantities.set(
        balance.productVariantId,
        (
          quantities.get(
            balance.productVariantId
          ) ||
          0
        ) +
          available
      );
    }

    for (
      const productVariantId of
      internalVariantIds
    ) {
      availabilityMap.set(
        productVariantId,
        internalAvailability(
          quantities.get(
            productVariantId
          ) ||
          0
        )
      );
    }

    return availabilityMap;
  };

const getAvailabilityForVariant =
  ({
    availabilityByVariant,
    productVariantId,
    isDirectDelivery = false,
  }) => {
    if (
      productVariantId &&
      availabilityByVariant instanceof
        Map &&
      availabilityByVariant.has(
        productVariantId
      )
    ) {
      return availabilityByVariant.get(
        productVariantId
      );
    }

    return isDirectDelivery
      ? directDeliveryAvailability()
      : internalAvailability(
          0
        );
  };

/*
|--------------------------------------------------------------------------
| Product-level availability
|--------------------------------------------------------------------------
|
| A product is AVAILABLE when:
|
| - it is direct delivery
| OR
| - at least one active variant has available inventory
|
| A product is OUT_OF_STOCK only when every active variant is out of stock.
|--------------------------------------------------------------------------
*/

const getAvailabilityForProduct =
  ({
    product,
    availabilityByVariant,
  }) => {
    const plainProduct =
      toPlain(
        product
      );

    if (!plainProduct) {
      return internalAvailability(
        0
      );
    }

    /*
     * Direct-delivery products do not
     * depend on internal inventory.
     */
    if (
      plainProduct.isDirectDelivery ===
      true
    ) {
      return directDeliveryAvailability();
    }

    const variants =
      Array.isArray(
        plainProduct.variants
      )
        ? plainProduct.variants
            .map(
              toPlain
            )
            .filter(
              (
                variant
              ) =>
                variant &&
                variant.id &&
                variant.isActive !==
                  false
            )
        : [];

        if (
          !variants.length
        ) {
          if (
            plainProduct
              .alwaysAvailableForSale ===
            true
          ) {
            return alwaysAvailableForSaleAvailability(
              0
            );
          }
        
          return internalAvailability(
            0
          );
        }

    let totalAvailableQuantity =
      0;

    let anyAvailable =
      false;

    for (
      const variant of
      variants
    ) {
      const availability =
        getAvailabilityForVariant({
          availabilityByVariant,

          productVariantId:
            variant.id,

          isDirectDelivery:
            false,
        });

      const quantity =
        toNumber(
          availability?.quantity
        );

      totalAvailableQuantity +=
        quantity;

      if (
        availability?.status ===
          "AVAILABLE"
      ) {
        anyAvailable =
          true;
      }
    }

    if (
      anyAvailable
    ) {
      return {
        fulfillmentType:
          "INTERNAL",
    
        inventoryTracked:
          true,
    
        trackQuantity:
          true,
    
        status:
          "AVAILABLE",
    
        quantity:
          totalAvailableQuantity,
    
        message:
          "In stock",
    
        alwaysAvailableForSale:
          plainProduct
            .alwaysAvailableForSale ===
          true,
      };
    }
    
    /*
    |--------------------------------------------------------------------------
    | Always Available For Sale
    |--------------------------------------------------------------------------
    |
    | No physical inventory exists across the active variants.
    |
    | The product may nevertheless remain purchasable when explicitly enabled.
    | Physical inventory remains zero.
    |--------------------------------------------------------------------------
    */
    
    if (
      plainProduct
        .alwaysAvailableForSale ===
      true
    ) {
      return alwaysAvailableForSaleAvailability(
        totalAvailableQuantity
      );
    }
    
    return internalAvailability(
      0
    );
  };

/*
|--------------------------------------------------------------------------
| Public product visibility
|--------------------------------------------------------------------------
*/

const isPublicProductAvailable =
  (
    product
  ) => {
    if (!product) {
      return false;
    }

    return (
      product.availability
        ?.status ===
      "AVAILABLE"
    );
  };

const filterAvailablePublicProducts =
  (
    products
  ) => {
    if (
      !Array.isArray(
        products
      )
    ) {
      return [];
    }

    return products.filter(
      isPublicProductAvailable
    );
  };

  module.exports = {
    getVariantAvailabilityMap,
    getAvailabilityForVariant,
    getAvailabilityForProduct,
    isPublicProductAvailable,
    filterAvailablePublicProducts,
  };