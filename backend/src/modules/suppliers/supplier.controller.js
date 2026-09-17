const service = require("./supplier.service");

exports.listSuppliers = async (req, res, next) => {
  try {
    const result = await service.listSuppliers({
      companyId: req.user.companyId,
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 30,
      search: req.query.search,
      isActive: req.query.isActive,
      sortBy: req.query.sortBy || "sortOrder",
      sortDirection: req.query.sortDirection || "ASC",
    });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await service.getSupplierById({
      companyId: req.user.companyId,
      supplierId: req.params.id,
    });

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await service.createSupplier({
      companyId: req.user.companyId,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await service.updateSupplier({
      companyId: req.user.companyId,
      supplierId: req.params.id,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully.",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeSupplierStatus = async (req, res, next) => {
  try {
    const supplier = await service.changeSupplierStatus({
      companyId: req.user.companyId,
      supplierId: req.params.id,
      userId: req.user.id,
      isActive: req.body.isActive,
    });

    res.status(200).json({
      success: true,
      message: req.body.isActive
        ? "Supplier activated successfully."
        : "Supplier deactivated successfully.",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const result = await service.deleteSupplier({
      companyId: req.user.companyId,
      supplierId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
