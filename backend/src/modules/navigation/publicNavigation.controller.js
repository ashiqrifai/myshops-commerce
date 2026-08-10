const db = require(
  "../../models"
);

const AppError = require(
  "../../utils/AppError"
);

const navigationService =
  require(
    "./navigation.service"
  );

const findCompanyByCode =
  async (
    companyCode
  ) => {
    const normalizedCode =
      String(
        companyCode || ""
      )
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      throw new AppError(
        "companyCode is required.",
        400,
        "COMPANY_CODE_REQUIRED"
      );
    }

    /*
     * IMPORTANT:
     * Change `code` below only if your
     * Company model uses a different field,
     * such as companyCode.
     */
    const company =
      await db.Company.findOne({
        where: {
          code:
            normalizedCode,

          isActive:
            true,
        },

        attributes: [
          "id",
          "name",
          "code",
        ],
      });

    if (!company) {
      throw new AppError(
        "Company not found.",
        404,
        "COMPANY_NOT_FOUND"
      );
    }

    return company;
  };

exports.getPublicNavigation =
  async (
    req,
    res,
    next
  ) => {
    try {
      const company =
        await findCompanyByCode(
          req.query.companyCode
        );

      const menu =
        await navigationService
          .getPublicNavigationByCode({
            companyId:
              company.id,

            code:
              req.params.code,

            channel:
              req.query.channel,

            device:
              req.query.device,

            authenticated:
              req.query.authenticated,

            now:
              req.query.now ||
              new Date(),
          });

      res.status(200).json({
        success:
          true,

        data:
          menu,

        context: {
          company: {
            id:
              company.id,

            name:
              company.name,

            code:
              company.code,
          },

          channel:
            String(
              req.query.channel ||
                "WEBSITE"
            ).toUpperCase(),

          device:
            String(
              req.query.device ||
                "DESKTOP"
            ).toUpperCase(),

          authenticated:
            [
              "true",
              "1",
              "yes",
            ].includes(
              String(
                req.query.authenticated ||
                  ""
              ).toLowerCase()
            ),
        },
      });
    } catch (error) {
      next(error);
    }
  };