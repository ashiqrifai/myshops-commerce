const service = require("./inventory.service");

exports.listInventory = async (req, res, next) => {
  try {
    const result = await service.listInventory({
      companyId: req.user.companyId,
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 50,
      inventoryLocationId: req.query.inventoryLocationId,
      productVariantId: req.query.productVariantId,
      productId: req.query.productId,
      search: req.query.search,
      onlyAvailable: req.query.onlyAvailable,
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

exports.getVariantAvailability = async (req, res, next) => {
  try {
    const result = await service.getVariantAvailability({
      companyId: req.user.companyId,
      productVariantId: req.params.variantId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.upsertBalance = async (req, res, next) => {
  try {
    const result = await service.upsertBalance({
      companyId: req.user.companyId,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Inventory balance saved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.adjustOnHand = async (req, res, next) => {
  try {
    const result = await service.adjustOnHand({
      companyId: req.user.companyId,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Inventory adjusted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
