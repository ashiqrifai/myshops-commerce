const priceListService = require(
    "./priceList.service"
  );
  
  exports.listPriceLists = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await priceListService.listPriceLists({
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
  
          priceListType:
            req.query.priceListType,
  
          channelCode:
            req.query.channelCode,
  
          currencyCode:
            req.query.currencyCode,
  
          isActive:
            req.query.isActive,
  
          isDefault:
            req.query.isDefault,
  
          sortBy:
            req.query.sortBy ||
            "priority",
  
          sortDirection:
            req.query.sortDirection ||
            "ASC",
        });
  
      res.status(200).json({
        success: true,
  
        data:
          result.rows,
  
        pagination:
          result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPriceListById = async (
    req,
    res,
    next
  ) => {
    try {
      const priceList =
        await priceListService.getPriceListById({
          companyId:
            req.user.companyId,
  
          priceListId:
            req.params.id,
        });
  
      res.status(200).json({
        success: true,
  
        data:
          priceList,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createPriceList = async (
    req,
    res,
    next
  ) => {
    try {
      const priceList =
        await priceListService.createPriceList({
          companyId:
            req.user.companyId,
  
          userId:
            req.user.id,
  
          payload:
            req.body,
  
          ipAddress:
            req.ip,
  
          userAgent:
            req.get(
              "user-agent"
            ),
        });
  
      res.status(201).json({
        success: true,
  
        message:
          "Price list created successfully.",
  
        data:
          priceList,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updatePriceList = async (
    req,
    res,
    next
  ) => {
    try {
      const priceList =
        await priceListService.updatePriceList({
          companyId:
            req.user.companyId,
  
          priceListId:
            req.params.id,
  
          userId:
            req.user.id,
  
          payload:
            req.body,
  
          ipAddress:
            req.ip,
  
          userAgent:
            req.get(
              "user-agent"
            ),
        });
  
      res.status(200).json({
        success: true,
  
        message:
          "Price list updated successfully.",
  
        data:
          priceList,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changePriceListStatus =
    async (
      req,
      res,
      next
    ) => {
      try {
        const priceList =
          await priceListService.changePriceListStatus({
            companyId:
              req.user.companyId,
  
            priceListId:
              req.params.id,
  
            userId:
              req.user.id,
  
            isActive:
              req.body.isActive,
  
            ipAddress:
              req.ip,
  
            userAgent:
              req.get(
                "user-agent"
              ),
          });
  
        res.status(200).json({
          success: true,
  
          message:
            req.body.isActive
              ? "Price list activated successfully."
              : "Price list deactivated successfully.",
  
          data:
            priceList,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.deletePriceList = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await priceListService.deletePriceList({
          companyId:
            req.user.companyId,
  
          priceListId:
            req.params.id,
  
          userId:
            req.user.id,
  
          ipAddress:
            req.ip,
  
          userAgent:
            req.get(
              "user-agent"
            ),
        });
  
      res.status(200).json({
        success: true,
  
        message:
          "Price list deleted successfully.",
  
        data:
          result,
      });
    } catch (error) {
      next(error);
    }
  };