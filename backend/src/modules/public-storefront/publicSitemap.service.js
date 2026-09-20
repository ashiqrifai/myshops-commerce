const {
    Op,
  } = require("sequelize");
  
  const db =
    require("../../models");
  
  const AppError =
    require("../../utils/AppError");
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Company
  |--------------------------------------------------------------------------
  */
  
  const getCompany = async (
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
        "Company code is required.",
        400,
        "COMPANY_CODE_REQUIRED"
      );
    }
  
    const company =
      await db.Company.findOne({
        attributes: [
          "id",
          "code",
        ],
        where: {
          code:
            normalizedCode,
          isActive:
            true,
        },
        raw: true,
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
  
  /*
  |--------------------------------------------------------------------------
  | Sitemap Data
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | This endpoint deliberately does NOT use the normal storefront product,
  | search, availability, pricing, media or promotion services.
  |
  | Sitemap generation needs URLs only.
  |
  |--------------------------------------------------------------------------
  */
  
  const getSitemapData =
    async ({
      companyCode,
    }) => {
      const company =
        await getCompany(
          companyCode
        );
  
      const now =
        new Date();
  
      /*
      |--------------------------------------------------------------------------
      | Run lightweight queries in parallel
      |--------------------------------------------------------------------------
      */
  
      const [
        products,
        categories,
        brands,
        collections,
      ] =
        await Promise.all([
          /*
          |--------------------------------------------------------------------------
          | Products
          |--------------------------------------------------------------------------
          */
  
          db.Product.findAll({
            attributes: [
              "slug",
              "updatedAt",
            ],
          
            where: {
              companyId:
                company.id,
          
              status:
                "ACTIVE",
          
              isSearchable:
                true,
          
              slug: {
                [Op.ne]:
                  null,
              },
            },
          
            include: [
              /*
              |--------------------------------------------------------------------------
              | Product must be published to WEBSITE
              |--------------------------------------------------------------------------
              */
          
              {
                model:
                  db.ProductChannel,
          
                as:
                  "channels",
          
                attributes: [],
          
                required:
                  true,
          
                where: {
                  companyId:
                    company.id,
          
                  channelCode:
                    "WEBSITE",
          
                  isVisible:
                    true,
          
                  publishStatus:
                    "PUBLISHED",
                },
              },
          
              /*
              |--------------------------------------------------------------------------
              | Product must have at least one WEBSITE-visible active variant
              |--------------------------------------------------------------------------
              */
          
              {
                model:
                  db.ProductVariant,
          
                as:
                  "variants",
          
                attributes: [],
          
                required:
                  true,
          
                where: {
                  companyId:
                    company.id,
          
                  status:
                    "ACTIVE",
                },
          
                include: [
                  {
                    model:
                      db.ProductVariantChannel,
          
                    as:
                      "channels",
          
                    attributes: [],
          
                    required:
                      true,
          
                    where: {
                      companyId:
                        company.id,
          
                      channelCode:
                        "WEBSITE",
          
                      isVisible:
                        true,
                    },
                  },
                ],
              },
            ],
          
            /*
            |--------------------------------------------------------------------------
            | JOINs may otherwise duplicate products with multiple valid variants.
            |--------------------------------------------------------------------------
            */
          
            distinct:
              true,
          
            order: [
              [
                "updatedAt",
                "DESC",
              ],
            ],
          
            raw:
              true,
          }),
  
          /*
          |--------------------------------------------------------------------------
          | Categories
          |--------------------------------------------------------------------------
          */
  
          db.Category.findAll({
            attributes: [
              "slug",
              "updatedAt",
            ],
            where: {
              companyId:
                company.id,
              isActive:
                true,
              isSearchable:
                true,
              robotsIndex:
                true,
              slug: {
                [Op.ne]:
                  null,
              },
            },
            order: [
              [
                "sortOrder",
                "ASC",
              ],
              [
                "name",
                "ASC",
              ],
            ],
            raw: true,
          }),
  
          /*
          |--------------------------------------------------------------------------
          | Brands
          |--------------------------------------------------------------------------
          */
  
          db.Brand.findAll({
            attributes: [
              "slug",
              "updatedAt",
            ],
            where: {
              companyId:
                company.id,
              isActive:
                true,
              slug: {
                [Op.ne]:
                  null,
              },
            },
            order: [
              [
                "sortOrder",
                "ASC",
              ],
              [
                "name",
                "ASC",
              ],
            ],
            raw: true,
          }),
  
          /*
          |--------------------------------------------------------------------------
          | Collections
          |--------------------------------------------------------------------------
          */
  
          db.Collection.findAll({
            attributes: [
              "slug",
              "updatedAt",
            ],
            where: {
              companyId:
                company.id,
  
              isActive:
                true,
  
              isSearchable:
                true,
  
              slug: {
                [Op.ne]:
                  null,
              },
  
              [Op.and]: [
                {
                  [Op.or]: [
                    {
                      publishedFrom:
                        null,
                    },
                    {
                      publishedFrom: {
                        [Op.lte]:
                          now,
                      },
                    },
                  ],
                },
                {
                  [Op.or]: [
                    {
                      publishedUntil:
                        null,
                    },
                    {
                      publishedUntil: {
                        [Op.gte]:
                          now,
                      },
                    },
                  ],
                },
              ],
            },
            order: [
              [
                "sortOrder",
                "ASC",
              ],
              [
                "name",
                "ASC",
              ],
            ],
            raw: true,
          }),
        ]);
  
      /*
      |--------------------------------------------------------------------------
      | Return minimal payload
      |--------------------------------------------------------------------------
      */
  
      return {
        company: {
          id:
            company.id,
          code:
            company.code,
        },
  
        products,
        categories,
        brands,
        collections,
  
        meta: {
          generatedAt:
            new Date()
              .toISOString(),
  
          counts: {
            products:
              products.length,
            categories:
              categories.length,
            brands:
              brands.length,
            collections:
              collections.length,
          },
        },
      };
    };
  
  module.exports = {
    getSitemapData,
  };