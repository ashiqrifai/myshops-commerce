const productService = require(
  "./product.service"
);

exports.listProducts = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await productService.listProducts({
        companyId:
          req.user.companyId,
        page: req.query.page || 1,
        pageSize:
          req.query.pageSize || 30,
        search: req.query.search,
        brandId: req.query.brandId,
        categoryId:
          req.query.categoryId,
        productType:
          req.query.productType,
        status: req.query.status,
        channelCode:
          req.query.channelCode,
        isFeatured:
          req.query.isFeatured,
        sortBy:
          req.query.sortBy || "createdAt",
        sortDirection:
          req.query.sortDirection || "DESC",
      });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination:
        result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await productService.getProductById({
        companyId:
          req.user.companyId,
        productId: req.params.id,
      });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await productService.createProduct({
        companyId:
          req.user.companyId,
        userId: req.user.id,
        payload: req.body,
      });

    res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await productService.updateProduct({
        companyId:
          req.user.companyId,
        productId: req.params.id,
        userId: req.user.id,
        payload: req.body,
      });

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeProductStatus = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await productService.changeProductStatus({
        companyId:
          req.user.companyId,
        productId: req.params.id,
        userId: req.user.id,
        status: req.body.status,
      });

    res.status(200).json({
      success: true,
      message:
        "Product status updated successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateVariants = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await productService.generateVariants({
        companyId:
          req.user.companyId,
        productId: req.params.id,
        userId: req.user.id,
        attributeSelections:
          req.body.attributeSelections,
        replaceExisting:
          req.body.replaceExisting === true,
        skuPrefix:
          req.body.skuPrefix || null,
      });

    res.status(200).json({
      success: true,
      message:
        "Product variants generated successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await productService.deleteProduct({
        companyId:
          req.user.companyId,
        productId: req.params.id,
      });

    res.status(200).json({
      success: true,
      message:
        "Product deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
