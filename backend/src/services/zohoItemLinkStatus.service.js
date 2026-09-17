const db =
  require(
    "../models"
  );

const {
  Op,
} =
  require(
    "sequelize"
  );

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizePositiveInteger =
  (
    value,
    fallback,
    maximum
  ) => {
    const parsed =
      Number.parseInt(
        String(
          value || ""
        ),
        10
      );

    if (
      !Number.isFinite(
        parsed
      ) ||
      parsed <= 0
    ) {
      return fallback;
    }

    return Math.min(
      parsed,
      maximum
    );
  };

/*
|--------------------------------------------------------------------------
| Get Zoho Item Link Status
|--------------------------------------------------------------------------
|
| This service does NOT contact Zoho.
|
| It reports the current local linkage status for active variants belonging
| to active products published and visible on the WEBSITE channel.
|--------------------------------------------------------------------------
*/

const getItemLinkStatus =
  async ({
    companyId,
    page =
      1,
    pageSize =
      50,
    search =
      "",
  }) => {
    if (
      !companyId
    ) {
      throw new Error(
        "companyId is required."
      );
    }

    const normalizedPage =
      normalizePositiveInteger(
        page,
        1,
        1000000
      );

    const normalizedPageSize =
      normalizePositiveInteger(
        pageSize,
        50,
        200
      );

    const normalizedSearch =
      String(
        search || ""
      ).trim();

    /*
    |--------------------------------------------------------------------------
    | Website Product Filter
    |--------------------------------------------------------------------------
    */

    const productWhere = {
      companyId,

      status:
        "ACTIVE",
    };

    /*
    |--------------------------------------------------------------------------
    | Variant Filter
    |--------------------------------------------------------------------------
    |
    | Only active variants with a usable SKU are relevant to SKU-based
    | Zoho item linking.
    |--------------------------------------------------------------------------
    */

    const variantWhere = {
      companyId,

      status:
        "ACTIVE",

      sku: {
        [Op.and]: [
          {
            [Op.ne]:
              null,
          },

          {
            [Op.ne]:
              "",
          },
        ],
      },
    };

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (
      normalizedSearch
    ) {
      variantWhere[
        Op.or
      ] = [
        {
          sku: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },

        {
          name: {
            [Op.iLike]:
              `%${normalizedSearch}%`,
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Website Variants
    |--------------------------------------------------------------------------
    |
    | ProductChannel is required so only products actually published to the
    | WEBSITE channel participate in the dashboard counts.
    |--------------------------------------------------------------------------
    */

    const websiteVariants =
      await db.ProductVariant
        .findAll({
          where:
            variantWhere,

          attributes: [
            "id",
            "productId",
            "sku",
            "name",
            "status",
            "zohoItemId",
            "zohoItemCode",
            "zohoLastSyncedAt",
          ],

          include: [
            {
              model:
                db.Product,

              as:
                "product",

              required:
                true,

              where:
                productWhere,

              attributes: [
                "id",
                "name",
                "slug",
                "status",
              ],

              include: [
                {
                  model:
                    db.ProductChannel,

                  as:
                    "channels",

                  required:
                    true,

                  where: {
                    companyId,

                    channelCode:
                      "WEBSITE",

                    isVisible:
                      true,

                    publishStatus:
                      "PUBLISHED",
                  },

                  attributes: [
                    "id",
                  ],
                },
              ],
            },
          ],

          order: [
            [
              {
                model:
                  db.Product,

                as:
                  "product",
              },

              "name",
              "ASC",
            ],

            [
              "name",
              "ASC",
            ],

            [
              "sku",
              "ASC",
            ],
          ],
        });

    /*
    |--------------------------------------------------------------------------
    | De-duplicate
    |--------------------------------------------------------------------------
    |
    | Defensive protection in case more than one WEBSITE ProductChannel row
    | ever exists for the same product.
    |--------------------------------------------------------------------------
    */

    const variantMap =
      new Map();

    for (
      const variantModel of
      websiteVariants
    ) {
      const variant =
        typeof variantModel.get ===
        "function"
          ? variantModel.get({
              plain:
                true,
            })
          : variantModel;

      if (
        !variantMap.has(
          String(
            variant.id
          )
        )
      ) {
        variantMap.set(
          String(
            variant.id
          ),
          variant
        );
      }
    }

    const variants =
      Array.from(
        variantMap.values()
      );

    /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    */

    const linked =
      variants.filter(
        (
          variant
        ) =>
          Boolean(
            String(
              variant
                .zohoItemId ||
                ""
            ).trim()
          )
      );

    const notLinked =
      variants.filter(
        (
          variant
        ) =>
          !String(
            variant
              .zohoItemId ||
              ""
          ).trim()
      );

    const total =
      variants.length;

    const linkedCount =
      linked.length;

    const notLinkedCount =
      notLinked.length;

    const linkedPercent =
      total > 0
        ? Number(
            (
              (
                linkedCount /
                total
              ) *
              100
            ).toFixed(
              2
            )
          )
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Only the NOT LINKED list is paginated.
    |--------------------------------------------------------------------------
    */

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          notLinkedCount /
            normalizedPageSize
        )
      );

    const safePage =
      Math.min(
        normalizedPage,
        totalPages
      );

    const offset =
      (
        safePage -
        1
      ) *
      normalizedPageSize;

    const pageItems =
      notLinked.slice(
        offset,
        offset +
          normalizedPageSize
      );

      /*
|--------------------------------------------------------------------------
| Latest Zoho Check Status
|--------------------------------------------------------------------------
*/

const pageVariantIds =
pageItems.map(
  (
    variant
  ) =>
    variant.id
);

const statusRows =
pageVariantIds.length
  ? await db.ZohoItemLinkStatus
      .findAll({
        where: {
          companyId,

          productVariantId: {
            [Op.in]:
              pageVariantIds,
          },
        },

        attributes: [
          "productVariantId",
          "status",
          "message",
          "lastCheckedAt",
        ],
      })
  : [];

const statusByVariantId =
new Map(
  statusRows.map(
    (
      row
    ) => {
      const plain =
        typeof row.get ===
        "function"
          ? row.get({
              plain:
                true,
            })
          : row;

      return [
        String(
          plain.productVariantId
        ),
        plain,
      ];
    }
  )
);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return {
      summary: {
        websiteVariants:
          total,

        linked:
          linkedCount,

        notLinked:
          notLinkedCount,

        linkedPercent,
      },

      items:
        pageItems.map(
          (
            variant
          ) => ({
            productId:
              variant.product
                ?.id ||
              variant.productId,

            productName:
              variant.product
                ?.name ||
              null,

            productSlug:
              variant.product
                ?.slug ||
              null,

            productVariantId:
              variant.id,

            variantName:
              variant.name ||
              null,

            sku:
              variant.sku ||
              null,

            zohoItemId:
              variant.zohoItemId ||
              null,

            zohoItemCode:
              variant.zohoItemCode ||
              null,

              zohoLastSyncedAt:
              variant.zohoLastSyncedAt ||
              null,
            
            zohoStatus:
              statusByVariantId.get(
                String(
                  variant.id
                )
              )?.status ||
              "NOT_CHECKED",
            
            zohoStatusMessage:
              statusByVariantId.get(
                String(
                  variant.id
                )
              )?.message ||
              null,
            
            zohoLastCheckedAt:
              statusByVariantId.get(
                String(
                  variant.id
                )
              )?.lastCheckedAt ||
              null,
          })
        ),

      pagination: {
        page:
          safePage,

        pageSize:
          normalizedPageSize,

        totalItems:
          notLinkedCount,

        totalPages,

        hasPreviousPage:
          safePage >
          1,

        hasNextPage:
          safePage <
          totalPages,
      },

      filters: {
        search:
          normalizedSearch ||
          null,
      },
    };
  };

module.exports = {
  getItemLinkStatus,
};