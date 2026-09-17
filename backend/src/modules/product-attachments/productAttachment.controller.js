const productAttachmentService =
  require(
    "./productAttachment.service"
  );

exports.listProductAttachmentRules =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await productAttachmentService
          .listProductAttachmentRules({
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

            scopeType:
              req.query
                .scopeType,

            relationshipType:
              req.query
                .relationshipType,

            displayLocation:
              req.query
                .displayLocation,

            isActive:
              req.query.isActive,

            sortBy:
              req.query.sortBy ||
              "priority",

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
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.getProductAttachmentRuleById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const rule =
        await productAttachmentService
          .getProductAttachmentRuleById({
            companyId:
              req.user.companyId,

            ruleId:
              req.params.id,
          });

      res.status(200).json({
        success:
          true,

        data:
          rule,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.createProductAttachmentRule =
  async (
    req,
    res,
    next
  ) => {
    try {
      const rule =
        await productAttachmentService
          .createProductAttachmentRule({
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
          "Product attachment rule created successfully.",

        data:
          rule,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.updateProductAttachmentRule =
  async (
    req,
    res,
    next
  ) => {
    try {
      const rule =
        await productAttachmentService
          .updateProductAttachmentRule({
            companyId:
              req.user.companyId,

            ruleId:
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
          "Product attachment rule updated successfully.",

        data:
          rule,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.changeProductAttachmentRuleStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const rule =
        await productAttachmentService
          .changeProductAttachmentRuleStatus({
            companyId:
              req.user.companyId,

            ruleId:
              req.params.id,

            userId:
              req.user.id,

            isActive:
              req.body
                .isActive,
          });

      res.status(200).json({
        success:
          true,

        message:
          req.body
            .isActive
            ? "Product attachment rule activated successfully."
            : "Product attachment rule deactivated successfully.",

        data:
          rule,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.deleteProductAttachmentRule =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await productAttachmentService
          .deleteProductAttachmentRule({
            companyId:
              req.user.companyId,

            ruleId:
              req.params.id,
          });

      res.status(200).json({
        success:
          true,

        message:
          "Product attachment rule deleted successfully.",

        data:
          result,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };
