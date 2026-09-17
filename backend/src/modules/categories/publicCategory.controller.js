const {
    Op,
  } = require("sequelize");
  
  const db = require("../../models");


  const resolveCompanyId =
  async (req) => {
    /*
     * 1. Existing request context
     */

    if (
      req.context?.companyId
    ) {
      return req.context.companyId;
    }

    /*
     * 2. Explicit companyId query
     *    Kept for backwards compatibility
     */

    if (
      req.query?.companyId
    ) {
      return req.query.companyId;
    }

    /*
     * 3. Public storefront company code
     */

    const companyCode =
      String(
        req.headers[
          "x-company-code"
        ] ||
          ""
      )
        .trim()
        .toUpperCase();

    if (!companyCode) {
      return null;
    }

    const company =
      await db.Company.findOne(
        {
          where: {
            code:
              companyCode,
          },

          attributes: [
            "id",
          ],
        }
      );

    return (
      company?.id ||
      null
    );
  };
  
  const {
    buildCategoryTree,
  } = require(
    "./category.utils"
  );
  
  const getPublicCategoryTree =
    async (
      req,
      res,
      next
    ) => {
      try {
        const companyId =
        await resolveCompanyId(
          req
        );
  
        if (!companyId) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                code:
                  "COMPANY_ID_REQUIRED",
                message:
                  "Company ID is required.",
                details: [],
              },
            });
        }
  
        const where = {
          companyId,
          isActive: true,
        };
  
        if (
          req.query.showInMenu ===
          "true"
        ) {
          where.showInMenu = true;
        }
  
        if (
          req.query.showOnHome ===
          "true"
        ) {
          where.showOnHome = true;
        }
  
        if (
          req.query.isFeatured ===
          "true"
        ) {
          where.isFeatured = true;
        }
  
        const categories =
          await db.Category.findAll(
            {
              where,
              include: [
                {
                  model:
                    db.MediaAsset,
                  as: "thumbnailAsset",
                  required: false,
                },
                {
                  model:
                    db.MediaAsset,
                  as: "imageAsset",
                  required: false,
                },
                {
                  model:
                    db.MediaAsset,
                  as: "bannerAsset",
                  required: false,
                },
              ],
              attributes: {
                exclude: [
                  "createdBy",
                  "updatedBy",
                ],
              },
              order: [
                [
                  "level",
                  "ASC",
                ],
                [
                  "sortOrder",
                  "ASC",
                ],
                ["name", "ASC"],
              ],
            }
          );
  
        res.status(200).json({
          success: true,
          data: {
            categories:
              buildCategoryTree(
                categories
              ),
          },
        });
      } catch (error) {
        next(error);
      }
    };
  
  const getPublicCategoryBySlug =
    async (
      req,
      res,
      next
    ) => {
      try {
        const companyId =
          await resolveCompanyId(
            req
          );
  
        if (!companyId) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                code:
                  "COMPANY_ID_REQUIRED",
                message:
                  "Company ID is required.",
                details: [],
              },
            });
        }
  
        const category =
          await db.Category.findOne(
            {
              where: {
                companyId,
                slug:
                  req.params.slug,
                isActive: true,
              },
              include: [
                {
                  model:
                    db.Category,
                  as: "parent",
                  required: false,
                  attributes: [
                    "id",
                    "name",
                    "slug",
                  ],
                },
                {
                  model:
                    db.MediaAsset,
                  as: "thumbnailAsset",
                  required: false,
                },
                {
                  model:
                    db.MediaAsset,
                  as: "imageAsset",
                  required: false,
                },
                {
                  model:
                    db.MediaAsset,
                  as: "bannerAsset",
                  required: false,
                },
                {
                  model:
                    db.CmsPage,
                  as: "landingPage",
                  required: false,
                },
              ],
              attributes: {
                exclude: [
                  "createdBy",
                  "updatedBy",
                ],
              },
            }
          );
  
        if (!category) {
          return res
            .status(404)
            .json({
              success: false,
              error: {
                code:
                  "CATEGORY_NOT_FOUND",
                message:
                  "Category was not found.",
                details: [],
              },
            });
        }
  
        const children =
          await db.Category.findAll(
            {
              where: {
                companyId,
                parentCategoryId:
                  category.id,
                isActive: true,
              },
              order: [
                [
                  "sortOrder",
                  "ASC",
                ],
                ["name", "ASC"],
              ],
            }
          );
  
        res.status(200).json({
          success: true,
          data: {
            category,
            children,
          },
        });
      } catch (error) {
        next(error);
      }
    };
  
  module.exports = {
    getPublicCategoryTree,
    getPublicCategoryBySlug,
  };