const service = require(
  "../services/zohoInventoryIntegration.service"
);

exports.upsertLocationMapping = async (
  req,
  res,
  next
) => {
  try {
    const result = await service.upsertLocationMapping(
      req.body || {}
    );

    res.status(200).json({
      success: true,
      data: {
        id: result.mapping.id,
        zohoLocationId:
          result.mapping.zohoLocationId,
        zohoLocationCode:
          result.mapping.zohoLocationCode,
        zohoLocationName:
          result.mapping.zohoLocationName,
        inventoryLocation: {
          id: result.inventoryLocation.id,
          code: result.inventoryLocation.code,
          name: result.inventoryLocation.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.listLocationMappings = async (
  req,
  res,
  next
) => {
  try {
    const rows = await service.listLocationMappings({
      companyCode: req.query.companyCode,
    });

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.applyStockSnapshot = async (
  req,
  res,
  next
) => {
  try {
    const result = await service.applyStockSnapshot(
      req.body || {}
    );

    res.status(200).json({
      success: true,
      message:
        "Zoho stock snapshot processed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.processTransaction = async (
  req,
  res,
  next
) => {
  try {
    const result = await service.processTransactionEvent(
      req.body || {}
    );

    res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? "Zoho event was already processed."
        : "Zoho inventory event processed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
