const db =
  require(
    "../models"
  );

const {
  syncItems,
} =
  require(
    "../services/zohoItemSync.service"
  );


  const {
    createZohoSalesOrder,
  } =
    require(
      "../services/zohoSalesOrder.service"
    );
  
  const zohoInventoryPullService =
    require(
      "../services/zohoInventoryPull.service"
    );

    const {
      getItemLinkStatus,
    } =
      require(
        "../services/zohoItemLinkStatus.service"
      );

/*
|--------------------------------------------------------------------------
| Sync Zoho Items
|--------------------------------------------------------------------------
*/

exports.syncItems =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        String(
          req.body
            ?.companyCode ||
          req.headers[
            "x-company-code"
          ] ||
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
            },
          });
      }

      const dryRun =
        req.body
          ?.dryRun ===
          true;

      const result =
        await syncItems({
          companyId:
            company.id,

          dryRun,
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

  const {
    getLocations,
  } =
    require(
      "../services/zohoLocation.service"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Get Zoho Locations
  |--------------------------------------------------------------------------
  */
  
  exports.getLocations =
    async (
      req,
      res,
      next
    ) => {
      try {
        const locations =
          await getLocations();
  
        return res
          .status(
            200
          )
          .json({
            success:
              true,
  
            data: {
              locations,
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

    exports.postSalesOrder =
    async (
      req,
      res,
      next
    ) => {
      try {
        const orderId =
          String(
            req.params
              ?.orderId ||
            ""
          ).trim();
  
        if (
          !orderId
        ) {
          return res
            .status(
              400
            )
            .json({
              success:
                false,
  
              error: {
                code:
                  "ORDER_ID_REQUIRED",
  
                message:
                  "orderId is required.",
              },
            });
        }
  
        const result =
          await createZohoSalesOrder({
            orderId,
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


    exports.syncInventory =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        String(
          req.body
            ?.companyCode ||
          ""
        ).trim();

      if (
        !companyCode
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            error: {
              code:
                "COMPANY_CODE_REQUIRED",

              message:
                "companyCode is required.",
            },
          });
      }

      const result =
        await zohoInventoryPullService
          .syncInventory({
            companyCode,

            zeroMissingLocations:
              req.body
                ?.zeroMissingLocations !==
              false,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            "Zoho inventory synchronized successfully.",

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
| Zoho Item Link Status
|--------------------------------------------------------------------------
*/

exports.getItemLinkStatus =
async (
  req,
  res,
  next
) => {
  try {
    const companyCode =
      String(
        req.query
          ?.companyCode ||
        req.headers[
          "x-company-code"
        ] ||
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

        attributes: [
          "id",
          "name",
          "code",
        ],
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
          },
        });
    }

    const result =
      await getItemLinkStatus({
        companyId:
          company.id,

        page:
          req.query
            ?.page ||
          1,

        pageSize:
          req.query
            ?.pageSize ||
          50,

        search:
          req.query
            ?.search ||
          "",
      });

    return res
      .status(200)
      .json({
        success:
          true,

        data: {
          company: {
            id:
              company.id,

            name:
              company.name,

            code:
              company.code,
          },

          ...result,
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