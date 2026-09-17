const { Op } = require("sequelize");
const db = require("../../models");
const AppError = require("../../utils/AppError");

const normalizeNullable = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const generateCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

const findLocationOrThrow = async ({
  companyId,
  locationId,
}) => {
  const location = await db.InventoryLocation.findOne({
    where: {
      id: locationId,
      companyId,
    },
  });

  if (!location) {
    throw new AppError(
      "Inventory location was not found.",
      404,
      "INVENTORY_LOCATION_NOT_FOUND"
    );
  }

  return location;
};

exports.listLocations = async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  locationType,
  isActive,
  isDeliveryEnabled,
  isPickupEnabled,
  sortBy = "sortOrder",
  sortDirection = "ASC",
}) => {
  const safePage = Math.max(1, Number(page) || 1);

  const safePageSize = Math.min(
    200,
    Math.max(1, Number(pageSize) || 30)
  );

  const where = {
    companyId,
  };

  if (locationType) {
    where.locationType = locationType;
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (typeof isDeliveryEnabled === "boolean") {
    where.isDeliveryEnabled = isDeliveryEnabled;
  }

  if (typeof isPickupEnabled === "boolean") {
    where.isPickupEnabled = isPickupEnabled;
  }

  const normalizedSearch = String(search || "").trim();

  if (normalizedSearch) {
    where[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        code: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        emirate: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        city: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        area: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
    ];
  }

  const { count, rows } =
    await db.InventoryLocation.findAndCountAll({
      where,
      order: [
        [
          sortBy,
          String(sortDirection).toUpperCase() === "DESC"
            ? "DESC"
            : "ASC",
        ],
        ["name", "ASC"],
      ],
      limit: safePageSize,
      offset: (safePage - 1) * safePageSize,
    });

  return {
    rows,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: count,
      totalPages: Math.ceil(count / safePageSize),
    },
  };
};

exports.getLocationById = async ({
  companyId,
  locationId,
}) =>
  findLocationOrThrow({
    companyId,
    locationId,
  });

exports.createLocation = async ({
  companyId,
  userId,
  payload,
}) => {
  const name = String(payload.name || "").trim();
  const code = generateCode(payload.code || name);

  if (!code) {
    throw new AppError(
      "Inventory location code could not be generated.",
      400,
      "INVENTORY_LOCATION_CODE_REQUIRED"
    );
  }

  return db.InventoryLocation.create({
    companyId,
    code,
    name,
    locationType: payload.locationType || "STORE",
    countryCode: String(payload.countryCode || "AE")
      .trim()
      .toUpperCase(),
    country: String(
      payload.country || "United Arab Emirates"
    ).trim(),
    emirate: normalizeNullable(payload.emirate),
    city: normalizeNullable(payload.city),
    area: normalizeNullable(payload.area),
    addressLine1: normalizeNullable(payload.addressLine1),
    addressLine2: normalizeNullable(payload.addressLine2),
    landmark: normalizeNullable(payload.landmark),
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    phone: normalizeNullable(payload.phone),
    email: normalizeNullable(payload.email),
    isDeliveryEnabled: payload.isDeliveryEnabled !== false,
    isPickupEnabled: payload.isPickupEnabled === true,
    pickupLeadTimeMinutes: Number(
      payload.pickupLeadTimeMinutes ?? 60
    ),
    pickupInstructions: normalizeNullable(
      payload.pickupInstructions
    ),
    isActive: payload.isActive !== false,
    sortOrder: Number(payload.sortOrder || 0),
    createdBy: userId || null,
    updatedBy: userId || null,
  });
};

exports.updateLocation = async ({
  companyId,
  locationId,
  userId,
  payload,
}) => {
  const location = await findLocationOrThrow({
    companyId,
    locationId,
  });

  if (payload.name !== undefined) {
    location.name = String(payload.name).trim();
  }

  if (payload.code !== undefined) {
    location.code = generateCode(payload.code || location.name);
  }

  if (payload.locationType !== undefined) {
    location.locationType = payload.locationType;
  }

  if (payload.countryCode !== undefined) {
    location.countryCode = String(payload.countryCode || "AE")
      .trim()
      .toUpperCase();
  }

  if (payload.country !== undefined) {
    location.country = String(
      payload.country || "United Arab Emirates"
    ).trim();
  }

  [
    "emirate",
    "city",
    "area",
    "addressLine1",
    "addressLine2",
    "landmark",
    "phone",
    "email",
    "pickupInstructions",
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      location[field] = normalizeNullable(payload[field]);
    }
  });

  if (payload.latitude !== undefined) {
    location.latitude = payload.latitude ?? null;
  }

  if (payload.longitude !== undefined) {
    location.longitude = payload.longitude ?? null;
  }

  [
    "isDeliveryEnabled",
    "isPickupEnabled",
    "isActive",
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      location[field] = Boolean(payload[field]);
    }
  });

  if (payload.pickupLeadTimeMinutes !== undefined) {
    location.pickupLeadTimeMinutes = Number(
      payload.pickupLeadTimeMinutes
    );
  }

  if (payload.sortOrder !== undefined) {
    location.sortOrder = Number(payload.sortOrder);
  }

  location.updatedBy = userId || null;

  await location.save();

  return location;
};

exports.changeLocationStatus = async ({
  companyId,
  locationId,
  userId,
  isActive,
}) => {
  const location = await findLocationOrThrow({
    companyId,
    locationId,
  });

  location.isActive = Boolean(isActive);
  location.updatedBy = userId || null;

  await location.save();

  return location;
};

exports.deleteLocation = async ({
  companyId,
  locationId,
}) => {
  const location = await findLocationOrThrow({
    companyId,
    locationId,
  });

  const balanceCount = await db.InventoryBalance.count({
    where: {
      companyId,
      inventoryLocationId: location.id,
    },
  });

  if (balanceCount > 0) {
    throw new AppError(
      "Inventory location cannot be deleted because inventory balances exist for it.",
      409,
      "INVENTORY_LOCATION_IN_USE"
    );
  }

  await location.destroy();

  return {
    id: locationId,
  };
};
