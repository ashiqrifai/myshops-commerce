const productMergeService = require("./productMerge.service");

exports.previewProductMerge = async (req, res, next) => {
  try {
    const result = await productMergeService.previewProductMerge({
      companyId: req.user.companyId,
      payload: req.body,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.executeProductMerge = async (req, res, next) => {
  try {
    const result = await productMergeService.executeProductMerge({
      companyId: req.user.companyId,
      userId: req.user.id,
      payload: req.body,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
