const brandService = require(
  "./brand.service"
);

exports.listBrands = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await brandService
        .listBrands({
          companyId:
            req.user.companyId,

          page:
            req.query.page ||
            1,

          pageSize:
            req.query.pageSize ||
            30,

          search:
            req.query.search,

          isActive:
            req.query.isActive,

          isFeatured:
            req.query
              .isFeatured,

          sortBy:
            req.query.sortBy ||
            "sortOrder",

          sortDirection:
            req.query
              .sortDirection ||
            "ASC",
        });

    res.status(200).json({
      success:
        true,

      data:
        result.rows,

      pagination:
        result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBrandById = async (
  req,
  res,
  next
) => {
  try {
    const brand =
      await brandService
        .getBrandById({
          companyId:
            req.user.companyId,

          brandId:
            req.params.id,
        });

    res.status(200).json({
      success:
        true,

      data:
        brand,
    });
  } catch (error) {
    next(error);
  }
};

exports.createBrand = async (
  req,
  res,
  next
) => {
  try {
    const brand =
      await brandService
        .createBrand({
          companyId:
            req.user.companyId,

          userId:
            req.user.id,

          payload:
            req.body,
        });

    res.status(201).json({
      success:
        true,

      message:
        "Brand created successfully.",

      data:
        brand,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBrand = async (
  req,
  res,
  next
) => {
  try {
    const brand =
      await brandService
        .updateBrand({
          companyId:
            req.user.companyId,

          brandId:
            req.params.id,

          userId:
            req.user.id,

          payload:
            req.body,
        });

    res.status(200).json({
      success:
        true,

      message:
        "Brand updated successfully.",

      data:
        brand,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeBrandStatus = async (
  req,
  res,
  next
) => {
  try {
    const brand =
      await brandService
        .changeBrandStatus({
          companyId:
            req.user.companyId,

          brandId:
            req.params.id,

          userId:
            req.user.id,

          isActive:
            req.body.isActive,
        });

    res.status(200).json({
      success:
        true,

      message:
        req.body.isActive
          ? "Brand activated successfully."
          : "Brand deactivated successfully.",

      data:
        brand,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBrand = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await brandService
        .deleteBrand({
          companyId:
            req.user.companyId,

          brandId:
            req.params.id,
        });

    res.status(200).json({
      success:
        true,

      message:
        "Brand deleted successfully.",

      data:
        result,
    });
  } catch (error) {
    next(error);
  }
};
