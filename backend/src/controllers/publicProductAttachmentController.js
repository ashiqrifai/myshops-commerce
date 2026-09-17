const db =
  require(
    "../models"
  );

const {
  resolveProductAttachments,
} = require(
  "../services/productAttachmentResolver.service"
);

exports.getProductAttachments =
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
              .companyCode ||
            "MYSHOPS"
        )
          .trim()
          .toUpperCase();

      const company =
        await db.Company
          .findOne({
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
            .productId ||
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

      const excludeProductIds =
        String(
          req.query
            .excludeProductIds ||
            ""
        )
          .split(",")
          .map(
            (
              value
            ) =>
              value.trim()
          )
          .filter(
            Boolean
          );

      const result =
        await resolveProductAttachments({
          companyId:
            company.id,

          productId,

          displayLocation:
            req.query
              .displayLocation ||
            "PRODUCT_DETAIL",

          channelCode:
            req.query
              .channelCode ||
            "WEBSITE",

          currencyCode:
            req.query
              .currencyCode ||
            "AED",

          excludeProductIds,

          limit:
            Math.min(
              Math.max(
                Number(
                  req.query
                    .limit ||
                    8
                ),
                1
              ),
              24
            ),
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