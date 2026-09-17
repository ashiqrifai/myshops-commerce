const checkoutService =
  require(
    "./publicPreBookingCheckout.service"
  );

const resolveCompanyCode =
  (req) =>
    String(
      req.headers[
        "x-company-code"
      ] ||
        process.env
          .SEED_COMPANY_CODE ||
        "MYSHOPS"
    )
      .trim()
      .toUpperCase();

exports.createCheckoutSession =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await checkoutService
          .createCheckoutSession({
            companyCode:
              resolveCompanyCode(
                req
              ),
            channel:
              req.body.channel ||
              "WEBSITE",
            campaignProductId:
              req.body
                .campaignProductId,
            productVariantId:
              req.body
                .productVariantId,
            allocationId:
              req.body
                .allocationId,
            bundleId:
              req.body.bundleId ||
              null,
            quantity:
              req.body.quantity,
          });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Pre-booking reservation created.",
          data,
        });
    } catch (error) {
      next(error);
    }
  };

exports.getCheckoutSession =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await checkoutService
          .getCheckoutSession({
            companyCode:
              resolveCompanyCode(
                req
              ),
            publicToken:
              req.params
                .publicToken,
          });

      return res
        .status(200)
        .json({
          success: true,
          data,
        });
    } catch (error) {
      next(error);
    }
  };
