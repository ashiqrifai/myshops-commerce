const db =
  require(
    "../models"
  );

const {
  validateCoupon,
} = require(
    "../services/couponService"
  );

exports.validate =
  async (
    req,
    res,
    next
  ) => {
    try {
      const company =
        await db.Company.findOne({
          where: {
            code:
              String(
                req.headers[
                  "x-company-code"
                ] ||
                  req.body
                    ?.companyCode ||
                  "MYSHOPS"
              )
                .trim()
                .toUpperCase(),

            isActive:
              true,
          },
        });

      if (
        !company
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            error: {
              code:
                "COMPANY_NOT_FOUND",

              message:
                "Company was not found.",

              details:
                [],
            },
          });
      }

      const {
        result,
      } =
        await validateCoupon({
          companyId:
            company.id,

          code:
            req.body.code,

          currencyCode:
            req.body.currencyCode ||
            "AED",

          channelCode:
            "WEBSITE",

          merchandiseTotal:
            Number(
              req.body
                .merchandiseTotal ||
                0
            ),

          deliveryAmount:
            Number(
              req.body
                .deliveryAmount ||
                0
            ),

          customerId:
            req.customer
              ?.id ||
            null,

          customerEmail:
            req.body
              ?.customerEmail ||
            req.customer
              ?.email ||
            null,
        });

      return res.json({
        success:
          true,

        data: {
          coupon:
            result,
        },
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };