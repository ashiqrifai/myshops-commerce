const service = require(
  "./inventoryImport.service"
);

exports.downloadTemplate = async (
  req,
  res,
  next
) => {
  try {
    const csv =
      service.getTemplateCsv();

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="inventory-location-stock-template.csv"'
    );

    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

exports.previewUploadedCsv = async (
  req,
  res,
  next
) => {
  try {
    const parsed =
      service.parseUploadedCsv({
        file: req.file,
      });

    const result =
      await service.previewImport({
        companyId:
          req.user.companyId,
        rows: parsed.rows,
      });

    res.status(200).json({
      success: true,
      message:
        "Inventory import preview generated successfully.",
      data: {
        headers:
          parsed.headers,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.executeImport = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.executeImport({
        companyId:
          req.user.companyId,
        userId: req.user.id,
        rows: req.body.rows,
      });

    res.status(200).json({
      success: true,
      message:
        "Inventory stock import completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.exportInventory = async (
  req,
  res,
  next
) => {
  try {
    const csv =
      await service.exportCsv({
        companyId:
          req.user.companyId,
      });

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="inventory-location-stock.csv"'
    );

    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
