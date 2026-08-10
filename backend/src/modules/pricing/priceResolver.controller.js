const priceResolverService = require(
    "./priceResolver.service"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Single Price
  |--------------------------------------------------------------------------
  */
  
  exports.resolvePrice = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await priceResolverService.resolvePrice({
          companyId:
            req.user.companyId,
  
          productVariantId:
            req.body.productVariantId,
  
          priceListId:
            req.body.priceListId,
  
          channelCode:
            req.body.channelCode,
  
          currencyCode:
            req.body.currencyCode,
  
          quantity:
            req.body.quantity ??
            1,
  
          effectiveDate:
            req.body.effectiveDate ??
            new Date(),
  
          includeInactive:
            req.body.includeInactive ===
            true,
        });
  
      res.status(200).json({
        success: true,
  
        message:
          "Price resolved successfully.",
  
        data:
          result,
      });
    } catch (error) {
      next(error);
    }
  };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Multiple Prices
  |--------------------------------------------------------------------------
  */
  
  exports.resolvePrices = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await priceResolverService.resolvePrices({
          companyId:
            req.user.companyId,
  
          items:
            req.body.items,
  
          priceListId:
            req.body.priceListId,
  
          channelCode:
            req.body.channelCode,
  
          currencyCode:
            req.body.currencyCode,
  
          effectiveDate:
            req.body.effectiveDate ??
            new Date(),
  
          includeInactive:
            req.body.includeInactive ===
            true,
        });
  
      res.status(200).json({
        success: true,
  
        message:
          "Prices resolved successfully.",
  
        data:
          result,
      });
    } catch (error) {
      next(error);
    }
  };