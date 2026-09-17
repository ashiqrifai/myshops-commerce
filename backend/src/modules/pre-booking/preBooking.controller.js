const service =
  require(
    "./preBooking.service"
  );

/*
|--------------------------------------------------------------------------
| Campaigns
|--------------------------------------------------------------------------
*/

exports.listCampaigns =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .listCampaigns({
            companyId:
              req.user
                .companyId,

            page:
              req.query.page ||
              1,

            pageSize:
              req.query.pageSize ||
              30,

            search:
              req.query.search,

            status:
              req.query.status,

            isActive:
              req.query.isActive,

            sortBy:
              req.query.sortBy ||
              "createdAt",

            sortDirection:
              req.query
                .sortDirection ||
              "DESC",
          });

      res.status(
        200
      ).json({
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

exports.getCampaignById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .getCampaignById({
            companyId:
              req.user
                .companyId,

            campaignId:
              req.params.id,
          });

      res.status(
        200
      ).json({
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

exports.createCampaign =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .createCampaign({
            companyId:
              req.user
                .companyId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        201
      ).json({
        success:
          true,

        message:
          "Pre-booking campaign created successfully.",

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

exports.updateCampaign =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .updateCampaign({
            companyId:
              req.user
                .companyId,

            campaignId:
              req.params.id,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking campaign updated successfully.",

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

exports.changeCampaignStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .changeCampaignStatus({
            companyId:
              req.user
                .companyId,

            campaignId:
              req.params.id,

            userId:
              req.user.id,

            status:
              req.body.status,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking campaign status updated successfully.",

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

exports.deleteCampaign =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .deleteCampaign({
            companyId:
              req.user
                .companyId,

            campaignId:
              req.params.id,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking campaign deleted successfully.",

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
| Campaign Products
|--------------------------------------------------------------------------
*/

exports.createCampaignProduct =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .createCampaignProduct({
            companyId:
              req.user
                .companyId,

            campaignId:
              req.params.id,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        201
      ).json({
        success:
          true,

        message:
          "Product added to pre-booking campaign successfully.",

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

exports.updateCampaignProduct =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .updateCampaignProduct({
            companyId:
              req.user
                .companyId,

            campaignProductId:
              req.params
                .campaignProductId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking campaign product updated successfully.",

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

exports.deleteCampaignProduct =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .deleteCampaignProduct({
            companyId:
              req.user
                .companyId,

            campaignProductId:
              req.params
                .campaignProductId,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Product removed from pre-booking campaign successfully.",

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
| Bundles
|--------------------------------------------------------------------------
*/

exports.createBundle =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .createBundle({
            companyId:
              req.user
                .companyId,

            campaignProductId:
              req.params
                .campaignProductId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        201
      ).json({
        success:
          true,

        message:
          "Pre-booking bundle created successfully.",

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

exports.updateBundle =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .updateBundle({
            companyId:
              req.user
                .companyId,

            bundleId:
              req.params.bundleId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking bundle updated successfully.",

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

exports.deleteBundle =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .deleteBundle({
            companyId:
              req.user
                .companyId,

            bundleId:
              req.params.bundleId,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking bundle deleted successfully.",

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
| Bundle Items
|--------------------------------------------------------------------------
*/

exports.createBundleItem =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .createBundleItem({
            companyId:
              req.user
                .companyId,

            bundleId:
              req.params.bundleId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        201
      ).json({
        success:
          true,

        message:
          "Bundle item created successfully.",

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

exports.updateBundleItem =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .updateBundleItem({
            companyId:
              req.user
                .companyId,

            bundleItemId:
              req.params
                .bundleItemId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Bundle item updated successfully.",

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

exports.deleteBundleItem =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .deleteBundleItem({
            companyId:
              req.user
                .companyId,

            bundleItemId:
              req.params
                .bundleItemId,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Bundle item deleted successfully.",

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
| Product-Level Allocations
|--------------------------------------------------------------------------
|
| Used when a pre-booking product does NOT require a bundle.
|--------------------------------------------------------------------------
*/

exports.createProductAllocation =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .createProductAllocation({
            companyId:
              req.user
                .companyId,

            campaignProductId:
              req.params
                .campaignProductId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        201
      ).json({
        success:
          true,

        message:
          "Pre-booking product allocation created successfully.",

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
| Bundle Allocations
|--------------------------------------------------------------------------
|
| Used when allocation belongs to a selected bundle.
|--------------------------------------------------------------------------
*/

exports.createAllocation =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .createAllocation({
            companyId:
              req.user
                .companyId,

            bundleId:
              req.params.bundleId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        201
      ).json({
        success:
          true,

        message:
          "Pre-booking bundle allocation created successfully.",

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
| Update Allocation
|--------------------------------------------------------------------------
|
| Works for both product-level and bundle-level allocations.
|--------------------------------------------------------------------------
*/

exports.updateAllocation =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .updateAllocation({
            companyId:
              req.user
                .companyId,

            allocationId:
              req.params
                .allocationId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking allocation updated successfully.",

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
| Delete Allocation
|--------------------------------------------------------------------------
*/

exports.deleteAllocation =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .deleteAllocation({
            companyId:
              req.user
                .companyId,

            allocationId:
              req.params
                .allocationId,
          });

      res.status(
        200
      ).json({
        success:
          true,

        message:
          "Pre-booking allocation deleted successfully.",

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