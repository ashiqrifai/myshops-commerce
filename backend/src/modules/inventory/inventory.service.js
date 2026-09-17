const { Op } = require("sequelize");
const db = require("../../models");
const AppError = require("../../utils/AppError");

const toNumber = (value) => Number(value || 0);

const serializeBalance = (balance) => {
  const value = balance.get
    ? balance.get({ plain: true })
    : balance;

  const quantityOnHand = toNumber(value.quantityOnHand);
  const quantityReserved = toNumber(value.quantityReserved);

  return {
    ...value,
    quantityOnHand,
    quantityReserved,
    quantityAvailable: Math.max(
      0,
      quantityOnHand - quantityReserved
    ),
  };
};

const findLocationOrThrow = async ({
  companyId,
  inventoryLocationId,
}) => {
  const location = await db.InventoryLocation.findOne({
    where: {
      id: inventoryLocationId,
      companyId,
      isActive: true,
    },
  });

  if (!location) {
    throw new AppError(
      "Active inventory location was not found.",
      404,
      "INVENTORY_LOCATION_NOT_FOUND"
    );
  }

  return location;
};

const findVariantOrThrow = async ({
  companyId,
  productVariantId,
}) => {
  const variant = await db.ProductVariant.findOne({
    where: {
      id: productVariantId,
      companyId,
    },
    include: [
      {
        model: db.Product,
        as: "product",
        required: true,
      },
    ],
  });

  if (!variant) {
    throw new AppError(
      "Product variant was not found.",
      404,
      "PRODUCT_VARIANT_NOT_FOUND"
    );
  }

  return variant;
};

const ensureStockTrackedProduct = (variant) => {
  if (variant.product?.isDirectDelivery) {
    throw new AppError(
      "Direct-delivery products do not use internal inventory balances.",
      409,
      "DIRECT_DELIVERY_INVENTORY_NOT_TRACKED"
    );
  }
};

exports.listInventory = async ({
  companyId,
  page = 1,
  pageSize = 50,
  inventoryLocationId,
  productVariantId,
  productId,
  search,
  onlyAvailable,
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(
    200,
    Math.max(1, Number(pageSize) || 50)
  );

  const where = {
    companyId,
  };

  if (inventoryLocationId) {
    where.inventoryLocationId = inventoryLocationId;
  }

  if (productVariantId) {
    where.productVariantId = productVariantId;
  }

  const variantWhere = {
    companyId,
  };

  if (productId) {
    variantWhere.productId = productId;
  }

  const normalizedSearch = String(search || "").trim();

  if (normalizedSearch) {
    variantWhere[Op.or] = [
      {
        sku: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        name: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        barcode: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
    ];
  }

  const { count, rows } =
    await db.InventoryBalance.findAndCountAll({
      where,
      include: [
        {
          model: db.InventoryLocation,
          as: "location",
          required: true,
        },
        {
          model: db.ProductVariant,
          as: "variant",
          required: true,
          where: variantWhere,
          include: [
            {
              model: db.Product,
              as: "product",
              required: true,
              attributes: [
                "id",
                "name",
                "slug",
                "isDirectDelivery",
              ],
            },
          ],
        },
      ],
      order: [
        [
          {
            model: db.InventoryLocation,
            as: "location",
          },
          "sortOrder",
          "ASC",
        ],
        [
          {
            model: db.ProductVariant,
            as: "variant",
          },
          "sku",
          "ASC",
        ],
      ],
      distinct: true,
      limit: safePageSize,
      offset: (safePage - 1) * safePageSize,
    });

  let serialized = rows.map(serializeBalance);

  if (onlyAvailable === true) {
    serialized = serialized.filter(
      (item) => item.quantityAvailable > 0
    );
  }

  return {
    rows: serialized,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: count,
      totalPages: Math.ceil(count / safePageSize),
    },
  };
};

exports.getVariantAvailability = async ({
  companyId,
  productVariantId,
}) => {
  const variant = await findVariantOrThrow({
    companyId,
    productVariantId,
  });

  if (variant.product?.isDirectDelivery) {
    return {
      productId: variant.productId,
      productVariantId: variant.id,
      fulfillmentType: "DIRECT_DELIVERY",
      inventoryTracked: false,
      status: "AVAILABLE",
      quantity: null,
      locations: [],
    };
  }

  const balances = await db.InventoryBalance.findAll({
    where: {
      companyId,
      productVariantId: variant.id,
    },
    include: [
      {
        model: db.InventoryLocation,
        as: "location",
        required: true,
        where: {
          isActive: true,
        },
      },
    ],
  });

  const locations = balances.map(serializeBalance);

  const quantity = locations.reduce(
    (total, item) => total + item.quantityAvailable,
    0
  );

  return {
    productId: variant.productId,
    productVariantId: variant.id,
    fulfillmentType: "INTERNAL",
    inventoryTracked: true,
    status: quantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
    quantity,
    locations: locations.map((item) => ({
      inventoryLocationId: item.inventoryLocationId,
      locationCode: item.location?.code,
      locationName: item.location?.name,
      locationType: item.location?.locationType,
      isDeliveryEnabled:
        item.location?.isDeliveryEnabled === true,
      isPickupEnabled:
        item.location?.isPickupEnabled === true,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      quantityAvailable: item.quantityAvailable,
    })),
  };
};

exports.upsertBalance = async ({
  companyId,
  userId,
  payload,
}) => {
  const location = await findLocationOrThrow({
    companyId,
    inventoryLocationId: payload.inventoryLocationId,
  });

  const variant = await findVariantOrThrow({
    companyId,
    productVariantId: payload.productVariantId,
  });

  ensureStockTrackedProduct(variant);

  const quantityOnHand = Number(payload.quantityOnHand || 0);

  const quantityReserved =
    payload.quantityReserved === undefined
      ? undefined
      : Number(payload.quantityReserved || 0);

  let balance = await db.InventoryBalance.findOne({
    where: {
      companyId,
      inventoryLocationId: location.id,
      productVariantId: variant.id,
    },
  });

  if (!balance) {
    balance = await db.InventoryBalance.create({
      companyId,
      inventoryLocationId: location.id,
      productVariantId: variant.id,
      quantityOnHand,
      quantityReserved: quantityReserved ?? 0,
      createdBy: userId || null,
      updatedBy: userId || null,
    });
  } else {
    balance.quantityOnHand = quantityOnHand;

    if (quantityReserved !== undefined) {
      balance.quantityReserved = quantityReserved;
    }

    balance.updatedBy = userId || null;

    await balance.save();
  }

  const saved = await db.InventoryBalance.findByPk(
    balance.id,
    {
      include: [
        {
          model: db.InventoryLocation,
          as: "location",
        },
        {
          model: db.ProductVariant,
          as: "variant",
          include: [
            {
              model: db.Product,
              as: "product",
            },
          ],
        },
      ],
    }
  );

  return serializeBalance(saved);
};

exports.adjustOnHand = async ({
  companyId,
  userId,
  payload,
}) => {
  const location = await findLocationOrThrow({
    companyId,
    inventoryLocationId: payload.inventoryLocationId,
  });

  const variant = await findVariantOrThrow({
    companyId,
    productVariantId: payload.productVariantId,
  });

  ensureStockTrackedProduct(variant);

  const adjustment = Number(payload.adjustment);

  return db.sequelize.transaction(async (transaction) => {
    let balance = await db.InventoryBalance.findOne({
      where: {
        companyId,
        inventoryLocationId: location.id,
        productVariantId: variant.id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!balance) {
      if (adjustment < 0) {
        throw new AppError(
          "Inventory cannot be adjusted below zero.",
          409,
          "INSUFFICIENT_ON_HAND_QUANTITY"
        );
      }

      balance = await db.InventoryBalance.create(
        {
          companyId,
          inventoryLocationId: location.id,
          productVariantId: variant.id,
          quantityOnHand: adjustment,
          quantityReserved: 0,
          createdBy: userId || null,
          updatedBy: userId || null,
        },
        {
          transaction,
        }
      );
    } else {
      const nextOnHand =
        toNumber(balance.quantityOnHand) + adjustment;

      if (nextOnHand < 0) {
        throw new AppError(
          "Inventory cannot be adjusted below zero.",
          409,
          "INSUFFICIENT_ON_HAND_QUANTITY"
        );
      }

      if (
        nextOnHand <
        toNumber(balance.quantityReserved)
      ) {
        throw new AppError(
          "On-hand quantity cannot be reduced below reserved quantity.",
          409,
          "ON_HAND_BELOW_RESERVED"
        );
      }

      balance.quantityOnHand = nextOnHand;
      balance.updatedBy = userId || null;

      await balance.save({
        transaction,
      });
    }

    return serializeBalance(balance);
  });
};
