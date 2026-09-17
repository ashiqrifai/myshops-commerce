const db =
  require(
    "../models"
  );

const {
  resolveProtectionPlans,
} = require(
  "../services/protectionResolver.service"
);

exports.getProtectionPlans =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        String(
          req.headers[
            "x-company-code"
          ] ||
          req.query
            ?.companyCode ||
          "MYSHOPS"
        )
          .trim()
          .toUpperCase();

      const company =
        await db.Company.findOne({
          where: {
            code:
              companyCode,

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

      const productId =
        String(
          req.query
            ?.productId ||
          ""
        ).trim();

      const productVariantId =
        String(
          req.query
            ?.productVariantId ||
          ""
        ).trim();

      if (
        !productId
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "PRODUCT_ID_REQUIRED",

              message:
                "Product ID is required.",

              details:
                [],
            },
          });
      }

      if (
        !productVariantId
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "PRODUCT_VARIANT_ID_REQUIRED",

              message:
                "Product variant ID is required.",

              details:
                [],
            },
          });
      }

      const result =
        await resolveProtectionPlans({
          companyId:
            company.id,

          productId,

          productVariantId,

          channelCode:
            String(
              req.query
                ?.channelCode ||
              "WEBSITE"
            )
              .trim()
              .toUpperCase(),

          currencyCode:
            String(
              req.query
                ?.currencyCode ||
              company.currencyCode ||
              "AED"
            )
              .trim()
              .toUpperCase(),

          quantity:
            Number(
              req.query
                ?.quantity ||
              1
            ),

          effectiveDate:
            req.query
              ?.effectiveDate ||
            new Date(),
        });

      return res
        .status(200)
        .json({
          success:
            true,

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