const {
  Op,
} = require("sequelize");

const db =
  require("../../models");

const AppError =
  require("../../utils/AppError");

const publicAvailabilityService =
  require(
    "./publicAvailability.service"
  );

const {
  buildPublicProduct,
  getProductStorefrontIncludes,
  findStorefrontPriceList,
  applyGiftVoucherPricingToProducts,
} = require(
  "./publicStorefront.service"
);


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeUrl = (
  value
) => {

  const raw =
    String(
      value || ""
    ).trim();

  if (!raw) {
    return "";
  }

  try {

    if (
      /^https?:\/\//i.test(
        raw
      )
    ) {

      return normalizeUrl(
        new URL(
          raw
        ).pathname
      );
    }

  } catch (_) {}

  const path =
    raw
      .split("?")[0]
      .split("#")[0];

  const normalized =
    (
      path.startsWith("/")
        ? path
        : `/${path}`
    )
      .replace(
        /\/+/g,
        "/"
      )
      .replace(
        /\/$/,
        ""
      )
      .toLowerCase();

  return normalized ||
    "/";
};


const csv = (
  value
) =>
  String(
    value || ""
  )
    .split(",")
    .map(
      item =>
        item.trim()
    )
    .filter(
      Boolean
    );


const publishWindowWhere = (
  now
) => ({
  [Op.and]: [
    {
      [Op.or]: [
        {
          publishStartAt:
            null,
        },
        {
          publishStartAt: {
            [Op.lte]:
              now,
          },
        },
      ],
    },
    {
      [Op.or]: [
        {
          publishEndAt:
            null,
        },
        {
          publishEndAt: {
            [Op.gte]:
              now,
          },
        },
      ],
    },
  ],
});


const plain = (
  value
) => {

  if (!value) {
    return value;
  }

  return typeof value.get ===
    "function"
    ? value.get({
        plain:
          true,
      })
    : value;
};


/*
|--------------------------------------------------------------------------
| Resolve CMS Product Carousel from viewAllUrl
|--------------------------------------------------------------------------
*/

const findListingSection =
  async ({
    companyId,
    url,
    channel,
    now,
  }) => {

    const normalizedUrl =
      normalizeUrl(
        url
      );

    if (!normalizedUrl) {

      throw new AppError(
        "Product listing URL is required.",
        400
      );
    }

    const pages =
      await db.CmsPage.findAll({
        where: {
          companyId,

          status:
            "PUBLISHED",

          isActive:
            true,

          channel: {
            [Op.in]: [
              channel,
              "BOTH",
            ],
          },

          ...publishWindowWhere(
            now
          ),
        },

        attributes: [
          "id",
        ],

        raw:
          true,
      });

    const pageIds =
      pages.map(
        page =>
          page.id
      );

    if (
      !pageIds.length
    ) {

      throw new AppError(
        "Product listing not found.",
        404
      );
    }

    const sectionType =
      await db.CmsSectionType.findOne({
        where: {
          companyId,

          code:
            "PRODUCT_CAROUSEL",

          isActive:
            true,
        },

        attributes: [
          "id",
        ],

        raw:
          true,
      });

    if (!sectionType) {

      throw new AppError(
        "Product listing not found.",
        404
      );
    }

    const sections =
      await db.CmsPageSection.findAll({
        where: {
          companyId,

          cmsPageId: {
            [Op.in]:
              pageIds,
          },

          sectionTypeId:
            sectionType.id,

          isEnabled:
            true,

          isActive:
            true,

          ...publishWindowWhere(
            now
          ),
        },

        attributes: [
          "id",
          "name",
          "code",
          "content",
          "settings",
        ],

        raw:
          true,
      });

    const section =
      sections.find(
        candidate => {

          const content =
            candidate.content &&
            typeof candidate.content ===
              "object" &&
            !Array.isArray(
              candidate.content
            )
              ? candidate.content
              : {};

          return (
            normalizeUrl(
              content.viewAllUrl
            ) ===
            normalizedUrl
          );
        }
      );

    if (!section) {

      throw new AppError(
        "Product listing not found.",
        404
      );
    }

    return {
      section,
      normalizedUrl,
    };
  };


/*
 * Remaining listing implementation is appended next.
 */


/*
|--------------------------------------------------------------------------
| Resolve Public Listing
|--------------------------------------------------------------------------
*/

const getPublicProductListing =
  async ({
    companyCode,
    url,
    channel = "WEBSITE",
    apiBaseUrl,
    query = {},
  }) => {

    /*
    |--------------------------------------------------------------------------
    | Company + Channel
    |--------------------------------------------------------------------------
    */

    const normalizedCompanyCode =
      String(
        companyCode || ""
      )
        .trim()
        .toUpperCase();

    if (
      !normalizedCompanyCode
    ) {

      throw new AppError(
        "Company code is required.",
        400
      );
    }

    const normalizedChannel =
      String(
        channel || "WEBSITE"
      )
        .trim()
        .toUpperCase();

    if (
      ![
        "WEBSITE",
        "KIOSK",
      ].includes(
        normalizedChannel
      )
    ) {

      throw new AppError(
        "Invalid storefront channel.",
        400
      );
    }

    const companyModel =
      await db.Company.findOne({
        where: {
          code:
            normalizedCompanyCode,

          isActive:
            true,
        },
      });

    if (!companyModel) {

      throw new AppError(
        "Company not found.",
        404
      );
    }

    const company =
      plain(
        companyModel
      );

    const now =
      new Date();

    /*
    |--------------------------------------------------------------------------
    | Resolve PRODUCT_CAROUSEL by CMS viewAllUrl
    |--------------------------------------------------------------------------
    */

    const {
      section,
      normalizedUrl,
    } =
      await findListingSection({
        companyId:
          company.id,

        url,

        channel:
          normalizedChannel,

        now,
      });

    const content =
      section.content &&
      typeof section.content ===
        "object" &&
      !Array.isArray(
        section.content
      )
        ? section.content
        : {};

    /*
     * The Product Carousel URL and its configured products
     * are the source of truth.
     *
     * There is NO special handling for:
     *
     * - New Arrivals
     * - Best Sellers
     * - Featured
     * - any future carousel title
     */

    const configuredIds =
      Array.isArray(
        content.productIds
      )
        ? content.productIds
            .filter(
              productId =>
                typeof productId ===
                  "string" &&
                productId.trim()
            )
            .map(
              productId =>
                productId.trim()
            )
        : [];

    /*
    |--------------------------------------------------------------------------
    | Price List
    |--------------------------------------------------------------------------
    */

    const priceListModel =
      await findStorefrontPriceList({
        companyId:
          company.id,

        channel:
          normalizedChannel,

        now,
      });

    const priceList =
      plain(
        priceListModel
      );

    /*
    |--------------------------------------------------------------------------
    | Load Eligible Products
    |--------------------------------------------------------------------------
    */

    const search =
      String(
        query.search ||
        ""
      ).trim();

    const productModels =
      configuredIds.length
        ? await db.Product.findAll({
            where: {
              companyId:
                company.id,

              id: {
                [Op.in]:
                  configuredIds,
              },

              status:
                "ACTIVE",

              isSearchable:
                true,

              ...(search
                ? {
                    [Op.or]: [
                      {
                        name: {
                          [Op.iLike]:
                            `%${search}%`,
                        },
                      },

                      {
                        parentSku: {
                          [Op.iLike]:
                            `%${search}%`,
                        },
                      },

                      {
                        shortDescription: {
                          [Op.iLike]:
                            `%${search}%`,
                        },
                      },
                    ],
                  }
                : {}),
            },

            include:
              getProductStorefrontIncludes({
                companyId:
                  company.id,

                priceListId:
                  priceList?.id ||
                  null,

                now,
              }),

            distinct:
              true,
          })
        : [];

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    const availabilityByVariant =
      await publicAvailabilityService
        .getVariantAvailabilityMap({
          companyId:
            company.id,

          products:
            productModels,
        });

    let products =
      publicAvailabilityService
        .filterAvailablePublicProducts(
          productModels.map(
            productModel =>
              buildPublicProduct(
                productModel,
                apiBaseUrl,
                availabilityByVariant
              )
          )
        );

    /*
    |--------------------------------------------------------------------------
    | Gift Voucher / Customer-facing Pricing
    |--------------------------------------------------------------------------
    */

    products =
      await applyGiftVoucherPricingToProducts({
        companyId:
          company.id,

        channelCode:
          normalizedChannel,

        effectiveDate:
          now,

        products,
      });

    /*
    |--------------------------------------------------------------------------
    | Restore CMS Product Order
    |--------------------------------------------------------------------------
    */

    const productMap =
      new Map(
        products.map(
          product => [
            String(
              product.id
            ),
            product,
          ]
        )
      );

    products =
      configuredIds
        .map(
          productId =>
            productMap.get(
              String(
                productId
              )
            ) ||
            null
        )
        .filter(
          Boolean
        );

    /*
     * Search was already applied by PostgreSQL.
     *
     * Restoring CMS order above is intentional.
     */

    /*
    |--------------------------------------------------------------------------
    | Build Facets BEFORE User Facet Filters
    |--------------------------------------------------------------------------
    */

    const brandMap =
      new Map();

    const categoryMap =
      new Map();

    const prices =
      [];

    let currencyCode =
      priceList
        ?.currencyCode ||
      company.currency ||
      "AED";

    for (
      const product of
      products
    ) {

      /*
       * Brand facet
       */
      if (
        product.brand?.id
      ) {

        const id =
          String(
            product.brand.id
          );

        const existing =
          brandMap.get(
            id
          );

        if (existing) {

          existing.count +=
            1;

        } else {

          brandMap.set(
            id,
            {
              id,

              label:
                product.brand.name,

              slug:
                product.brand.slug ||
                null,

              count:
                1,
            }
          );
        }
      }

      /*
       * Category facet
       */
      if (
        product
          .primaryCategory
          ?.id
      ) {

        const id =
          String(
            product
              .primaryCategory
              .id
          );

        const existing =
          categoryMap.get(
            id
          );

        if (existing) {

          existing.count +=
            1;

        } else {

          categoryMap.set(
            id,
            {
              id,

              label:
                product
                  .primaryCategory
                  .name,

              slug:
                product
                  .primaryCategory
                  .slug ||
                null,

              count:
                1,
            }
          );
        }
      }

      /*
       * Price facet
       */
      const sellingPrice =
        Number(
          product
            .price
            ?.sellingPrice
        );

      if (
        Number.isFinite(
          sellingPrice
        )
      ) {

        prices.push(
          sellingPrice
        );
      }

      if (
        product
          .price
          ?.currencyCode
      ) {

        currencyCode =
          product
            .price
            .currencyCode;
      }
    }

    const filters = [
      {
        code:
          "BRAND",

        label:
          "Brand",

        type:
          "MULTI_SELECT",

        options:
          Array.from(
            brandMap.values()
          )
            .sort(
              (a, b) =>
                String(
                  a.label ||
                  ""
                )
                  .localeCompare(
                    String(
                      b.label ||
                      ""
                    )
                  )
            ),
      },

      {
        code:
          "CATEGORY",

        label:
          "Category",

        type:
          "MULTI_SELECT",

        options:
          Array.from(
            categoryMap.values()
          )
            .sort(
              (a, b) =>
                String(
                  a.label ||
                  ""
                )
                  .localeCompare(
                    String(
                      b.label ||
                      ""
                    )
                  )
            ),
      },

      {
        code:
          "PRICE",

        label:
          "Price",

        type:
          "RANGE",

        minimum:
          prices.length
            ? Math.min(
                ...prices
              )
            : null,

        maximum:
          prices.length
            ? Math.max(
                ...prices
              )
            : null,

        currencyCode,
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | Apply Brand / Category / Price Filters
    |--------------------------------------------------------------------------
    */

    const brandIds =
      csv(
        query.brandIds
      );

    const categoryIds =
      csv(
        query.categoryIds
      );

    const brandIdSet =
      new Set(
        brandIds
      );

    const categoryIdSet =
      new Set(
        categoryIds
      );

    const minPrice =
      query.minPrice !==
        undefined &&
      query.minPrice !==
        null &&
      query.minPrice !==
        ""
        ? Number(
            query.minPrice
          )
        : null;

    const maxPrice =
      query.maxPrice !==
        undefined &&
      query.maxPrice !==
        null &&
      query.maxPrice !==
        ""
        ? Number(
            query.maxPrice
          )
        : null;

    products =
      products.filter(
        product => {

          /*
           * Brand
           */
          if (
            brandIdSet.size
          ) {

            const brandId =
              product
                .brand
                ?.id;

            if (
              !brandId ||
              !brandIdSet.has(
                String(
                  brandId
                )
              )
            ) {

              return false;
            }
          }

          /*
           * Category
           */
          if (
            categoryIdSet.size
          ) {

            const categoryId =
              product
                .primaryCategory
                ?.id;

            if (
              !categoryId ||
              !categoryIdSet.has(
                String(
                  categoryId
                )
              )
            ) {

              return false;
            }
          }

          /*
           * Price
           */
          const sellingPrice =
            Number(
              product
                .price
                ?.sellingPrice
            );

          if (
            Number.isFinite(
              minPrice
            ) &&
            (
              !Number.isFinite(
                sellingPrice
              ) ||
              sellingPrice <
                minPrice
            )
          ) {

            return false;
          }

          if (
            Number.isFinite(
              maxPrice
            ) &&
            (
              !Number.isFinite(
                sellingPrice
              ) ||
              sellingPrice >
                maxPrice
            )
          ) {

            return false;
          }

          return true;
        }
      );

    /*
     * Chunk 3 continues with:
     *
     * - sorting
     * - pagination
     * - response
     * - module export
     */


    /*
    |--------------------------------------------------------------------------
    | Sort
    |--------------------------------------------------------------------------
    */

    const sort =
      String(
        query.sort ||
        "FEATURED"
      )
        .trim()
        .toUpperCase();

    const productPrice =
      (
        product
      ) => {

        const value =
          Number(
            product
              .price
              ?.sellingPrice
          );

        return Number.isFinite(
          value
        )
          ? value
          : Number
              .POSITIVE_INFINITY;
      };

    if (
      sort ===
        "PRICE_ASC" ||
      sort ===
        "PRICE_LOW_TO_HIGH"
    ) {

      products.sort(
        (
          a,
          b
        ) =>
          productPrice(a) -
          productPrice(b)
      );

    } else if (
      sort ===
        "PRICE_DESC" ||
      sort ===
        "PRICE_HIGH_TO_LOW"
    ) {

      products.sort(
        (
          a,
          b
        ) =>
          productPrice(b) -
          productPrice(a)
      );

    } else if (
      sort ===
      "NAME_ASC"
    ) {

      products.sort(
        (
          a,
          b
        ) =>
          String(
            a.name ||
            ""
          ).localeCompare(
            String(
              b.name ||
              ""
            )
          )
      );

    } else if (
      sort ===
      "NAME_DESC"
    ) {

      products.sort(
        (
          a,
          b
        ) =>
          String(
            b.name ||
            ""
          ).localeCompare(
            String(
              a.name ||
              ""
            )
          )
      );

    } else if (
      sort ===
      "NEWEST"
    ) {

      /*
       * Public product cards do not currently expose createdAt.
       * Keep the CMS order rather than inventing another ordering.
       */
    } else {

      /*
       * FEATURED / default:
       * preserve the CMS-configured product order.
       */
    }


    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const requestedPage =
      Number(
        query.page ||
        1
      );

    const requestedPageSize =
      Number(
        query.pageSize ||
        12
      );

    const pageSize =
      Math.min(
        Math.max(
          Number.isFinite(
            requestedPageSize
          )
            ? Math.floor(
                requestedPageSize
              )
            : 12,
          1
        ),
        100
      );

    const totalItems =
      products.length;

    const totalPages =
      Math.ceil(
        totalItems /
        pageSize
      );

    const page =
      Math.max(
        Number.isFinite(
          requestedPage
        )
          ? Math.floor(
              requestedPage
            )
          : 1,
        1
      );

    const listedProducts =
      products.slice(
        (
          page -
          1
        ) *
          pageSize,

        page *
          pageSize
      );


    /*
    |--------------------------------------------------------------------------
    | Listing Metadata
    |--------------------------------------------------------------------------
    */

    const title =
      String(
        content.title ||
        section.name ||
        "Products"
      ).trim() ||
      "Products";

    const subtitle =
      content.subtitle
        ? String(
            content.subtitle
          ).trim() ||
          null
        : null;


    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return {
      company: {
        id:
          company.id,

        name:
          company.name,

        code:
          company.code,

        currency:
          company.currency,
      },

      listing: {
        id:
          section.id,

        code:
          section.code,

        title,

        subtitle,

        url:
          normalizedUrl,
      },

      products:
        listedProducts,

      filters,

      sortOptions: [
        {
          value:
            "FEATURED",

          label:
            "Featured",
        },

        {
          value:
            "PRICE_LOW_TO_HIGH",

          label:
            "Price: Low to High",
        },

        {
          value:
            "PRICE_HIGH_TO_LOW",

          label:
            "Price: High to Low",
        },

        {
          value:
            "NAME_ASC",

          label:
            "Name: A to Z",
        },

        {
          value:
            "NAME_DESC",

          label:
            "Name: Z to A",
        },
      ],

      pagination: {
        page,

        pageSize,

        totalItems,

        totalPages,

        hasPreviousPage:
          page >
          1,

        hasNextPage:
          page <
          totalPages,
      },

      appliedFilters: {
        search:
          search ||
          null,

        brandIds,

        categoryIds,

        minPrice:
          Number.isFinite(
            minPrice
          )
            ? minPrice
            : null,

        maxPrice:
          Number.isFinite(
            maxPrice
          )
            ? maxPrice
            : null,

        sort,
      },

      resolvedPriceList:
        priceList
          ? {
              id:
                priceList.id,

              code:
                priceList.code,

              name:
                priceList.name,

              currencyCode:
                priceList
                  .currencyCode,

              isTaxInclusive:
                priceList
                  .isTaxInclusive,
            }
          : null,

      meta: {
        channel:
          normalizedChannel,

        source:
          "CMS_PRODUCT_CAROUSEL",

        generatedAt:
          new Date()
            .toISOString(),
      },
    };
  };


module.exports = {
  getPublicProductListing,
};
