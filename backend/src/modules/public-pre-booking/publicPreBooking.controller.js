const service =
  require(
    "./publicPreBooking.service"
  );

const resolveCompanyCode =
  (
    req
  ) =>
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

const resolveApiBaseUrl =
      (req) =>
        String(
          process.env
            .PUBLIC_API_BASE_URL ||
          process.env
            .NEXT_PUBLIC_API_URL ||
          `${req.protocol}://${req.get(
            "host"
          )}`
        )
          .trim()
          .replace(
            /\/+$/,
            ""
          );

/*
|--------------------------------------------------------------------------
| Public Campaign List
|--------------------------------------------------------------------------
*/

exports.getCampaigns =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await service
          .getCampaigns({
            companyCode:
              resolveCompanyCode(
                req
              ),

            channel:
              req.query.channel ||
              "WEBSITE",
          });

      return res
        .status(200)
        .json({
          success:
            true,

          data,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };


exports.getCampaign =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await service
          .getCampaign({
            companyCode:
              resolveCompanyCode(
                req
              ),

            campaignSlug:
              req.params.slug,

            channel:
              req.query.channel ||
              "WEBSITE",

              apiBaseUrl:
              resolveApiBaseUrl(
                req
              ),
          });

      return res
        .status(200)
        .json({
          success:
            true,

          data,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.getCampaignProduct =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await service
          .getCampaignProduct({
            companyCode:
              resolveCompanyCode(
                req
              ),

            campaignSlug:
              req.params.slug,

            productSlug:
              req.params
                .productSlug,

            channel:
              req.query.channel ||
              "WEBSITE",

              apiBaseUrl:
              resolveApiBaseUrl(
                req
              ),
          });

      return res
        .status(200)
        .json({
          success:
            true,

          data,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };