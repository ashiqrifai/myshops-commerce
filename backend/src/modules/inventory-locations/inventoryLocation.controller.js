const service = require("./inventoryLocation.service");

exports.listLocations = async (req, res, next) => {
  try {
    const result = await service.listLocations({
      companyId: req.user.companyId,
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 30,
      search: req.query.search,
      locationType: req.query.locationType,
      isActive: req.query.isActive,
      isDeliveryEnabled: req.query.isDeliveryEnabled,
      isPickupEnabled: req.query.isPickupEnabled,
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

exports.getLocationById = async (req, res, next) => {
  try {
    const location = await service.getLocationById({
      companyId: req.user.companyId,
      locationId: req.params.id,
    });

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

exports.createLocation = async (req, res, next) => {
  try {
    const location = await service.createLocation({
      companyId: req.user.companyId,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(201).json({
      success: true,
      message: "Inventory location created successfully.",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const location = await service.updateLocation({
      companyId: req.user.companyId,
      locationId: req.params.id,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Inventory location updated successfully.",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeLocationStatus = async (req, res, next) => {
  try {
    const location = await service.changeLocationStatus({
      companyId: req.user.companyId,
      locationId: req.params.id,
      userId: req.user.id,
      isActive: req.body.isActive,
    });

    res.status(200).json({
      success: true,
      message: req.body.isActive
        ? "Inventory location activated successfully."
        : "Inventory location deactivated successfully.",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteLocation = async (req, res, next) => {
  try {
    const result = await service.deleteLocation({
      companyId: req.user.companyId,
      locationId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Inventory location deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
