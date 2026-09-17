const giftVoucherPromotionService =
  require(
    "./giftVoucherPromotion.service"
  );

const giftVoucherPromotionImportService =
  require(
    "./giftVoucherPromotionImport.service"
  );

exports.listGiftVoucherPromotions =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await giftVoucherPromotionService
          .listGiftVoucherPromotions({
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

            fundingType:
              req.query.fundingType,

            discountType:
              req.query.discountType,

            channelCode:
              req.query.channelCode,

            isActive:
              req.query.isActive,

            validOn:
              req.query.validOn,

            sortBy:
              req.query.sortBy ||
              "priority",

            sortDirection:
              req.query.sortDirection ||
              "ASC",
          });

      return res
        .status(
          200
        )
        .json({
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

exports.getGiftVoucherPromotionById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await giftVoucherPromotionService
          .getGiftVoucherPromotionById({
            companyId:
              req.user.companyId,

            promotionId:
              req.params.id,
          });

      return res
        .status(
          200
        )
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

exports.createGiftVoucherPromotion =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await giftVoucherPromotionService
          .createGiftVoucherPromotion({
            companyId:
              req.user.companyId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      return res
        .status(
          201
        )
        .json({
          success:
            true,

          message:
            "Gift voucher promotion created successfully.",

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

exports.updateGiftVoucherPromotion =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await giftVoucherPromotionService
          .updateGiftVoucherPromotion({
            companyId:
              req.user.companyId,

            promotionId:
              req.params.id,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            "Gift voucher promotion updated successfully.",

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

exports.changeGiftVoucherPromotionStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await giftVoucherPromotionService
          .changeGiftVoucherPromotionStatus({
            companyId:
              req.user.companyId,

            promotionId:
              req.params.id,

            userId:
              req.user.id,

            isActive:
              req.body.isActive,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            req.body.isActive
              ? "Gift voucher promotion activated successfully."
              : "Gift voucher promotion deactivated successfully.",

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

exports.deleteGiftVoucherPromotion =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await giftVoucherPromotionService
          .deleteGiftVoucherPromotion({
            companyId:
              req.user.companyId,

            promotionId:
              req.params.id,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            "Gift voucher promotion deleted successfully.",

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

/*
|--------------------------------------------------------------------------
| Download CSV Import Template
|--------------------------------------------------------------------------
*/

exports.downloadImportTemplate =
  async (
    _req,
    res,
    next
  ) => {
    try {
      const csv =
        giftVoucherPromotionImportService
          .getTemplateCsv();

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="gift-voucher-promotions-import-template.csv"'
      );

      return res
        .status(
          200
        )
        .send(
          csv
        );
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| CSV Import
|--------------------------------------------------------------------------
*/

exports.importGiftVoucherPromotions =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !req.file
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "CSV file is required.",
          });
      }

      const csvText =
        req.file
          .buffer
          .toString(
            "utf8"
          );

      const result =
        await giftVoucherPromotionImportService
          .importGiftVoucherPromotions({
            companyId:
              req.user.companyId,

            userId:
              req.user.id,

            csvText,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            result.failedRows >
            0
              ? "Gift voucher CSV import completed with some errors."
              : "Gift voucher CSV import completed successfully.",

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
