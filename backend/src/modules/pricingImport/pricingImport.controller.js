const pricingImportService = require(
  "./pricingImport.service"
);

/*
|--------------------------------------------------------------------------
| Preview Import
|--------------------------------------------------------------------------
*/

exports.previewImport = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await pricingImportService.previewImport({
        companyId:
          req.user.companyId,

        rows:
          req.body.rows,
      });

    res.status(200).json({
      success:
        true,

      message:
        "Pricing import preview generated successfully.",

      data:
        result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Execute Import
|--------------------------------------------------------------------------
*/

exports.executeImport = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await pricingImportService.executeImport({
        companyId:
          req.user.companyId,

        userId:
          req.user.id,

        rows:
          req.body.rows,
      });

    res.status(200).json({
      success:
        true,

      message:
        "Pricing import completed successfully.",

      data:
        result,
    });
  } catch (error) {
    next(error);
  }
};