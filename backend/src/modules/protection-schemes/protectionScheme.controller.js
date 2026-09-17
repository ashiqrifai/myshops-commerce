const protectionSchemeService =
  require(
    "./protectionScheme.service"
  );

exports.listProtectionSchemes =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await protectionSchemeService
          .listProtectionSchemes({
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

            schemeType:
              req.query
                .schemeType,

            pricingMethod:
              req.query
                .pricingMethod,

            currencyCode:
              req.query
                .currencyCode,

            isActive:
              req.query.isActive,

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
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.getProtectionSchemeById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const scheme =
        await protectionSchemeService
          .getProtectionSchemeById({
            companyId:
              req.user.companyId,

            schemeId:
              req.params.id,
          });

      res.status(200).json({
        success:
          true,

        data:
          scheme,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.createProtectionScheme =
  async (
    req,
    res,
    next
  ) => {
    try {
      const scheme =
        await protectionSchemeService
          .createProtectionScheme({
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
          "Protection scheme created successfully.",

        data:
          scheme,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.updateProtectionScheme =
  async (
    req,
    res,
    next
  ) => {
    try {
      const scheme =
        await protectionSchemeService
          .updateProtectionScheme({
            companyId:
              req.user.companyId,

            schemeId:
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
          "Protection scheme updated successfully.",

        data:
          scheme,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.changeProtectionSchemeStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const scheme =
        await protectionSchemeService
          .changeProtectionSchemeStatus({
            companyId:
              req.user.companyId,

            schemeId:
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
            ? "Protection scheme activated successfully."
            : "Protection scheme deactivated successfully.",

        data:
          scheme,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.deleteProtectionScheme =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await protectionSchemeService
          .deleteProtectionScheme({
            companyId:
              req.user.companyId,

            schemeId:
              req.params.id,
          });

      res.status(200).json({
        success:
          true,

        message:
          "Protection scheme deleted successfully.",

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
