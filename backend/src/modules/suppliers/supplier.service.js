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

const findSupplierOrThrow = async ({
  companyId,
  supplierId,
}) => {
  const supplier = await db.Supplier.findOne({
    where: {
      id: supplierId,
      companyId,
    },
  });

  if (!supplier) {
    throw new AppError(
      "Supplier was not found.",
      404,
      "SUPPLIER_NOT_FOUND"
    );
  }

  return supplier;
};

exports.listSuppliers = async ({
  companyId,
  page = 1,
  pageSize = 30,
  search,
  isActive,
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

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
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
        contactPerson: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
      {
        email: {
          [Op.iLike]: `%${normalizedSearch}%`,
        },
      },
    ];
  }

  const { count, rows } = await db.Supplier.findAndCountAll({
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

exports.getSupplierById = async ({
  companyId,
  supplierId,
}) =>
  findSupplierOrThrow({
    companyId,
    supplierId,
  });

exports.createSupplier = async ({
  companyId,
  userId,
  payload,
}) => {
  const name = String(payload.name || "").trim();
  const code = generateCode(payload.code || name);

  if (!code) {
    throw new AppError(
      "Supplier code could not be generated.",
      400,
      "SUPPLIER_CODE_REQUIRED"
    );
  }

  return db.Supplier.create({
    companyId,
    code,
    name,
    contactPerson: normalizeNullable(payload.contactPerson),
    email: normalizeNullable(payload.email),
    phone: normalizeNullable(payload.phone),
    websiteUrl: normalizeNullable(payload.websiteUrl),
    notes: normalizeNullable(payload.notes),
    isActive: payload.isActive !== false,
    sortOrder: Number(payload.sortOrder || 0),
    createdBy: userId || null,
    updatedBy: userId || null,
  });
};

exports.updateSupplier = async ({
  companyId,
  supplierId,
  userId,
  payload,
}) => {
  const supplier = await findSupplierOrThrow({
    companyId,
    supplierId,
  });

  if (payload.name !== undefined) {
    supplier.name = String(payload.name).trim();
  }

  if (payload.code !== undefined) {
    supplier.code = generateCode(payload.code || supplier.name);
  }

  [
    "contactPerson",
    "email",
    "phone",
    "websiteUrl",
    "notes",
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      supplier[field] = normalizeNullable(payload[field]);
    }
  });

  if (payload.isActive !== undefined) {
    supplier.isActive = Boolean(payload.isActive);
  }

  if (payload.sortOrder !== undefined) {
    supplier.sortOrder = Number(payload.sortOrder);
  }

  supplier.updatedBy = userId || null;

  await supplier.save();

  return supplier;
};

exports.changeSupplierStatus = async ({
  companyId,
  supplierId,
  userId,
  isActive,
}) => {
  const supplier = await findSupplierOrThrow({
    companyId,
    supplierId,
  });

  supplier.isActive = Boolean(isActive);
  supplier.updatedBy = userId || null;

  await supplier.save();

  return supplier;
};

exports.deleteSupplier = async ({
  companyId,
  supplierId,
}) => {
  const supplier = await findSupplierOrThrow({
    companyId,
    supplierId,
  });

  const productCount = await db.Product.count({
    where: {
      companyId,
      directDeliverySupplierId: supplier.id,
    },
  });

  if (productCount > 0) {
    throw new AppError(
      "Supplier cannot be deleted because it is assigned to direct-delivery products.",
      409,
      "SUPPLIER_IN_USE"
    );
  }

  await supplier.destroy();

  return {
    id: supplierId,
  };
};
