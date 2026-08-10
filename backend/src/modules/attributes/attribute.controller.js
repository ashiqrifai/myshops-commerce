const attributeService = require(
  "./attribute.service"
);

exports.listAttributes = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await attributeService.listAttributes({
        companyId:
          req.user.companyId,
        page:
          req.query.page || 1,
        pageSize:
          req.query.pageSize || 30,
        search:
          req.query.search,
        inputType:
          req.query.inputType,
        dataType:
          req.query.dataType,
        isVariantDefining:
          req.query.isVariantDefining,
        isFilterable:
          req.query.isFilterable,
        isActive:
          req.query.isActive,
        categoryId:
          req.query.categoryId,
        sortBy:
          req.query.sortBy ||
          "displayOrder",
        sortDirection:
          req.query.sortDirection ||
          "ASC",
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

exports.getAttributeById = async (
  req,
  res,
  next
) => {
  try {
    const attribute =
      await attributeService.getAttributeById({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
      });

    res.status(200).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    next(error);
  }
};

exports.createAttribute = async (
  req,
  res,
  next
) => {
  try {
    const attribute =
      await attributeService.createAttribute({
        companyId:
          req.user.companyId,
        userId:
          req.user.id,
        payload:
          req.body,
      });

    res.status(201).json({
      success: true,
      message:
        "Attribute created successfully.",
      data: attribute,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAttribute = async (
  req,
  res,
  next
) => {
  try {
    const attribute =
      await attributeService.updateAttribute({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
        userId:
          req.user.id,
        payload:
          req.body,
      });

    res.status(200).json({
      success: true,
      message:
        "Attribute updated successfully.",
      data: attribute,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeAttributeStatus = async (
  req,
  res,
  next
) => {
  try {
    const attribute =
      await attributeService.changeAttributeStatus({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
        userId:
          req.user.id,
        isActive:
          req.body.isActive,
      });

    res.status(200).json({
      success: true,
      message:
        req.body.isActive
          ? "Attribute activated successfully."
          : "Attribute deactivated successfully.",
      data: attribute,
    });
  } catch (error) {
    next(error);
  }
};

exports.createOption = async (
  req,
  res,
  next
) => {
  try {
    const option =
      await attributeService.createOption({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
        userId:
          req.user.id,
        payload:
          req.body,
      });

    res.status(201).json({
      success: true,
      message:
        "Attribute option created successfully.",
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOption = async (
  req,
  res,
  next
) => {
  try {
    const option =
      await attributeService.updateOption({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
        optionId:
          req.params.optionId,
        userId:
          req.user.id,
        payload:
          req.body,
      });

    res.status(200).json({
      success: true,
      message:
        "Attribute option updated successfully.",
      data: option,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOption = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await attributeService.deleteOption({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
        optionId:
          req.params.optionId,
      });

    res.status(200).json({
      success: true,
      message:
        "Attribute option deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.replaceAssignments = async (
  req,
  res,
  next
) => {
  try {
    const attribute =
      await attributeService.replaceAssignments({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
        userId:
          req.user.id,
        categoryAssignments:
          req.body.categoryAssignments,
      });

    res.status(200).json({
      success: true,
      message:
        "Category assignments updated successfully.",
      data: attribute,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAttribute = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await attributeService.deleteAttribute({
        companyId:
          req.user.companyId,
        attributeId:
          req.params.id,
      });

    res.status(200).json({
      success: true,
      message:
        "Attribute deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
