const variantPriceService = require(
    "./variantPrice.service"
  );
  
  exports.listVariantPrices = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await variantPriceService.listVariantPrices({
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
  
          productVariantId:
            req.query.productVariantId,
  
          productId:
            req.query.productId,
  
          priceListId:
            req.query.priceListId,
  
          isActive:
            req.query.isActive,
  
          validOn:
            req.query.validOn,
  
          quantity:
            req.query.quantity,
  
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
  
  exports.getVariantPriceById = async (
    req,
    res,
    next
  ) => {
    try {
      const variantPrice =
        await variantPriceService.getVariantPriceById({
          companyId:
            req.user.companyId,
  
          variantPriceId:
            req.params.id,
        });
  
      res.status(200).json({
        success: true,
  
        data:
          variantPrice,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createVariantPrice = async (
    req,
    res,
    next
  ) => {
    try {
      const variantPrice =
        await variantPriceService.createVariantPrice({
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
          "Variant price created successfully.",
  
        data:
          variantPrice,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateVariantPrice = async (
    req,
    res,
    next
  ) => {
    try {
      const variantPrice =
        await variantPriceService.updateVariantPrice({
          companyId:
            req.user.companyId,
  
          variantPriceId:
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
          "Variant price updated successfully.",
  
        data:
          variantPrice,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changeVariantPriceStatus =
    async (
      req,
      res,
      next
    ) => {
      try {
        const variantPrice =
          await variantPriceService.changeVariantPriceStatus({
            companyId:
              req.user.companyId,
  
            variantPriceId:
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
              ? "Variant price activated successfully."
              : "Variant price deactivated successfully.",
  
          data:
            variantPrice,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.deleteVariantPrice = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await variantPriceService.deleteVariantPrice({
          companyId:
            req.user.companyId,
  
          variantPriceId:
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
          "Variant price deleted successfully.",
  
        data:
          result,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPricesByVariant = async (
    req,
    res,
    next
  ) => {
    try {
      const prices =
        await variantPriceService.getPricesByVariant({
          companyId:
            req.user.companyId,
  
          variantId:
            req.params.variantId,
  
          priceListId:
            req.query.priceListId,
  
          isActive:
            req.query.isActive,
  
          validOn:
            req.query.validOn,
  
          quantity:
            req.query.quantity,
        });
  
      res.status(200).json({
        success: true,
  
        data:
          prices,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPricesByProduct = async (
    req,
    res,
    next
  ) => {
    try {
      const prices =
        await variantPriceService.getPricesByProduct({
          companyId:
            req.user.companyId,
  
          productId:
            req.params.productId,
  
          priceListId:
            req.query.priceListId,
  
          isActive:
            req.query.isActive,
  
          validOn:
            req.query.validOn,
  
          quantity:
            req.query.quantity,
        });
  
      res.status(200).json({
        success: true,
  
        data:
          prices,
      });
    } catch (error) {
      next(error);
    }
  };