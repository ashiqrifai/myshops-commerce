const pricingFacadeService = require(
  "./pricingFacade.service"
);

/*
|--------------------------------------------------------------------------
| Get Price Matrix
|--------------------------------------------------------------------------
*/

exports.getPriceMatrix = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await pricingFacadeService.getPriceMatrix({
        companyId:
          req.user.companyId,

        productId:
          req.query.productId,

        quantity:
          req.query.quantity ?? 1,

        effectiveDate:
          req.query.effectiveDate ??
          new Date(),

        currencyCode:
          req.query.currencyCode,

        channelCode:
          req.query.channelCode,

        includeInactive:
          req.query.includeInactive === true,
      });

    res.status(200).json({
      success: true,

      message:
        "Price matrix retrieved successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Quote One Item
|--------------------------------------------------------------------------
*/

exports.quoteItem = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await pricingFacadeService.quoteItem({
        companyId:
          req.user.companyId,

        productVariantId:
          req.body.productVariantId,

        quantity:
          req.body.quantity ?? 1,

        priceListId:
          req.body.priceListId,

        channelCode:
          req.body.channelCode,

        currencyCode:
          req.body.currencyCode,

        effectiveDate:
          req.body.effectiveDate,

        includeInactive:
          req.body.includeInactive === true,

        customerId:
          req.body.customerId,

        customerGroupCode:
          req.body.customerGroupCode,

        couponCodes:
          req.body.couponCodes,

        metadata:
          req.body.metadata,
      });

    res.status(200).json({
      success: true,

      message:
        "Item quoted successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Quote Cart
|--------------------------------------------------------------------------
*/

exports.quoteCart = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await pricingFacadeService.quoteCart({
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
          req.body.effectiveDate,

        includeInactive:
          req.body.includeInactive === true,

        customerId:
          req.body.customerId,

        customerGroupCode:
          req.body.customerGroupCode,

        couponCodes:
          req.body.couponCodes,

        metadata:
          req.body.metadata,
      });

    res.status(200).json({
      success: true,

      message:
        "Cart quoted successfully.",

      data: result,
    });
  } catch (error) {
    next(error);
  }
};