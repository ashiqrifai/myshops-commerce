const { Op } = require("sequelize");
const db = require("../../models");

const getPickupLocations = async ({
  companyCode,
  variantId,
  quantity = 1,
}) => {
  const company = await db.Company.findOne({
    where: {
      code: String(companyCode || "").trim(),
      isActive: true,
    },
    attributes: ["id"],
  });

  if (!company) {
    const error = new Error("Storefront company was not found.");
    error.statusCode = 404;
    throw error;
  }

  const requestedQuantity = Math.max(
    1,
    Math.floor(Number(quantity) || 1)
  );

  const variant = await db.ProductVariant.findOne({
    where: {
      id: variantId,
      companyId: company.id,
      status: "ACTIVE",
    },
    attributes: ["id"],
  });

  if (!variant) {
    const error = new Error("Active product variant was not found.");
    error.statusCode = 404;
    throw error;
  }

  const locations = await db.InventoryLocation.findAll({
    where: {
      companyId: company.id,
      isActive: true,
      isPickupEnabled: true,
      locationType: {
        [Op.in]: ["STORE", "HUB"],
      },
    },
    attributes: [
      "id",
      "code",
      "name",
      "locationType",
      "emirate",
      "city",
      "area",
      "addressLine1",
      "addressLine2",
      "landmark",
      "phone",
      "pickupLeadTimeMinutes",
      "pickupInstructions",
      "sortOrder",
    ],
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
    ],
  });

  if (!locations.length) {
    return [];
  }

  const balances = await db.InventoryBalance.findAll({
    where: {
      companyId: company.id,
      productVariantId: variantId,
      inventoryLocationId: {
        [Op.in]: locations.map((location) => location.id),
      },
    },
    attributes: [
      "inventoryLocationId",
      "quantityOnHand",
      "quantityReserved",
    ],
  });

  const availableByLocation = new Map();

  for (const balance of balances) {
    const available = Math.max(
      0,
      Number(balance.quantityOnHand || 0) -
        Number(balance.quantityReserved || 0)
    );

    availableByLocation.set(
      balance.inventoryLocationId,
      (availableByLocation.get(balance.inventoryLocationId) || 0) +
        available
    );
  }

  return locations.map((locationModel) => {
    const location = locationModel.get({
      plain: true,
    });

    const availableQuantity =
      availableByLocation.get(location.id) || 0;

    return {
      ...location,
      availableQuantity,
      available:
        availableQuantity >= requestedQuantity,
      requestedQuantity,
    };
  });
};

module.exports = {
  getPickupLocations,
};
