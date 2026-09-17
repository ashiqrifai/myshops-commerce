const db =
  require(
    "../models"
  );

const {
  getItemLinkStatus,
} =
  require(
    "../services/zohoItemLinkStatus.service"
  );

const {
  syncItems,
} =
  require(
    "../services/zohoItemSync.service"
  );

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeCompanyCode =
  (
    value
  ) =>
    String(
      value ||
      "MYSHOPS"
    )
      .trim()
      .toUpperCase();

/*
|--------------------------------------------------------------------------
| Resolve Company
|--------------------------------------------------------------------------
*/

const getCompany =
  async (
    companyCode
  ) => {
    const code =
      normalizeCompanyCode(
        companyCode
      );

    const company =
      await db.Company.findOne({
        where: {
          code,

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
      const error =
        new Error(
          `Company ${code} was not found.`
        );

      error.statusCode =
        404;

      error.errorCode =
        "COMPANY_NOT_FOUND";

      throw error;
    }

    return company;
  };

/*
|--------------------------------------------------------------------------
| GET /api/v1/admin/zoho/item-link-status
|--------------------------------------------------------------------------
|
| Local database only.
|
| This endpoint does NOT contact Zoho.
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
        normalizeCompanyCode(
          req.query
            ?.companyCode ||
          req.headers[
            "x-company-code"
          ] ||
          "MYSHOPS"
        );

      const company =
        await getCompany(
          companyCode
        );

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
            20,

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

/*
|--------------------------------------------------------------------------
| POST /api/v1/admin/zoho/sync-items
|--------------------------------------------------------------------------
|
| Runs the same safe SKU sync used by the server-to-server integration.
|
| The browser never receives or sends ZOHO_INVENTORY_INTEGRATION_KEY.
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
        normalizeCompanyCode(
          req.body
            ?.companyCode ||
          req.headers[
            "x-company-code"
          ] ||
          "MYSHOPS"
        );

      const dryRun =
        req.body
          ?.dryRun ===
        true;

      const company =
        await getCompany(
          companyCode
        );

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