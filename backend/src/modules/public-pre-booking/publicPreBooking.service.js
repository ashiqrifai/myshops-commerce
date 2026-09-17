const {
  Op,
} = require("sequelize");

const db =
  require("../../models");

const AppError =
  require("../../utils/AppError");

/*
|--------------------------------------------------------------------------
| Public Pre-Booking Service
|--------------------------------------------------------------------------
|
| Performance rules:
|
| 1. Never load Campaign -> Products -> Bundles -> Items -> Allocations
|    using one deep Sequelize include tree.
|
| 2. Load each hasMany collection independently and combine it with Maps.
|
| 3. Only use small belongsTo-style lookups or lightweight master queries.
|
|--------------------------------------------------------------------------
*/

const toPlain = (value) =>
  value &&
  typeof value.get === "function"
    ? value.get({
        plain: true,
      })
    : value;

const normalizeChannel = (
  channel
) => {
  const value =
    String(
      channel ||
        "WEBSITE"
    )
      .trim()
      .toUpperCase();

  if (
    ![
      "WEBSITE",
      "KIOSK",
    ].includes(
      value
    )
  ) {
    throw new AppError(
      "Channel must be WEBSITE or KIOSK.",
      400,
      "INVALID_STOREFRONT_CHANNEL"
    );
  }

  return value;
};

const numberOrNull = (
  value
) => {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return null;
  }

  const result =
    Number(
      value
    );

  return Number.isFinite(
    result
  )
    ? result
    : null;
};

const absoluteUrl = (
  value,
  apiBaseUrl
) => {
  if (!value) {
    return null;
  }

  const url =
    String(
      value
    ).trim();

  if (!url) {
    return null;
  }

  if (
    /^https?:\/\//i.test(
      url
    )
  ) {
    return url;
  }

  const base =
    String(
      apiBaseUrl ||
        ""
    ).replace(
      /\/+$/,
      ""
    );

  const path =
    url.startsWith(
      "/"
    )
      ? url
      : `/${url}`;

  return base
    ? `${base}${path}`
    : path;
};

const validityWindow = (
  now
) => ({
  [Op.and]: [
    {
      [Op.or]: [
        {
          validFrom:
            null,
        },
        {
          validFrom: {
            [Op.lte]:
              now,
          },
        },
      ],
    },

    {
      [Op.or]: [
        {
          validUntil:
            null,
        },
        {
          validUntil: {
            [Op.gte]:
              now,
          },
        },
      ],
    },
  ],
});

const groupPlainRows = (
  rows,
  fieldName
) => {
  const map =
    new Map();

  for (
    const rowModel of
    rows || []
  ) {
    const row =
      toPlain(
        rowModel
      );

    const key =
      row?.[
        fieldName
      ];

    if (!key) {
      continue;
    }

    const normalizedKey =
      String(
        key
      );

    if (
      !map.has(
        normalizedKey
      )
    ) {
      map.set(
        normalizedKey,
        []
      );
    }

    map
      .get(
        normalizedKey
      )
      .push(
        row
      );
  }

  return map;
};

const mapPlainRows = (
  rows,
  fieldName =
    "id"
) =>
  new Map(
    (
      rows ||
      []
    ).map(
      (
        rowModel
      ) => {
        const row =
          toPlain(
            rowModel
          );

        return [
          String(
            row[
              fieldName
            ]
          ),
          row,
        ];
      }
    )
  );

/*
|--------------------------------------------------------------------------
| Company
|--------------------------------------------------------------------------
*/

const getCompany = async (
  companyCode
) => {
  const code =
    String(
      companyCode ||
        ""
    )
      .trim()
      .toUpperCase();

  if (!code) {
    throw new AppError(
      "Company code is required.",
      400,
      "COMPANY_CODE_REQUIRED"
    );
  }

  const company =
    await db.Company.findOne({
      where: {
        code,
        isActive:
          true,
      },
    });

  if (!company) {
    throw new AppError(
      "Storefront company was not found.",
      404,
      "STOREFRONT_COMPANY_NOT_FOUND"
    );
  }

  return toPlain(
    company
  );
};

/*
|--------------------------------------------------------------------------
| Price List
|--------------------------------------------------------------------------
*/

const findPriceList =
  async ({
    companyId,
    channel,
    now,
  }) => {
    const priceLists =
      await db.PriceList.findAll(
        {
          where: {
            companyId,
            isActive:
              true,
            channelCode: {
              [Op.in]: [
                channel,
                "ALL",
              ],
            },
            ...validityWindow(
              now
            ),
          },

          order: [
            [
              "priority",
              "ASC",
            ],
            [
              "isDefault",
              "DESC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return (
      priceLists.find(
        (
          priceList
        ) =>
          String(
            priceList.channelCode ||
              ""
          )
            .trim()
            .toUpperCase() ===
          channel
      ) ||
      priceLists[0] ||
      null
    );
  };

/*
|--------------------------------------------------------------------------
| Campaign
|--------------------------------------------------------------------------
*/

const findCampaign =
  async ({
    companyId,
    campaignSlug,
  }) => {
    const slug =
      String(
        campaignSlug ||
          ""
      )
        .trim()
        .toLowerCase();

    const campaign =
      await db.PreBookingCampaign.findOne(
        {
          where: {
            companyId,
            slug,
            isActive:
              true,
          },
        }
      );

    if (
      !campaign
    ) {
      throw new AppError(
        "Pre-booking campaign was not found.",
        404,
        "PRE_BOOKING_CAMPAIGN_NOT_FOUND"
      );
    }

    return toPlain(
      campaign
    );
  };

const resolveBookingStatus =
  (
    campaign,
    now
  ) => {
    const status =
      String(
        campaign.status ||
          ""
      )
        .trim()
        .toUpperCase();

    if (
      [
        "CLOSED",
        "ARCHIVED",
      ].includes(
        status
      )
    ) {
      return "CLOSED";
    }

    if (
      status ===
      "PAUSED"
    ) {
      return "PAUSED";
    }

    if (
      status ===
      "DRAFT"
    ) {
      return "UNAVAILABLE";
    }

    if (
      status !==
      "ACTIVE"
    ) {
      return "UNAVAILABLE";
    }

    const startAt =
      campaign.bookingStartAt
        ? new Date(
            campaign.bookingStartAt
          )
        : null;

    const endAt =
      campaign.bookingEndAt
        ? new Date(
            campaign.bookingEndAt
          )
        : null;

    if (
      startAt &&
      !Number.isNaN(
        startAt.getTime()
      ) &&
      startAt.getTime() >
        now.getTime()
    ) {
      return "UPCOMING";
    }

    if (
      endAt &&
      !Number.isNaN(
        endAt.getTime()
      ) &&
      endAt.getTime() <=
        now.getTime()
    ) {
      return "CLOSED";
    }

    return "ACTIVE";
  };

/*
|--------------------------------------------------------------------------
| Campaign Products
|--------------------------------------------------------------------------
*/

const loadCampaignProducts =
  async ({
    companyId,
    campaignId,
  }) => {
    const rows =
      await db.PreBookingCampaignProduct.findAll(
        {
          where: {
            companyId,
            campaignId,
            isActive:
              true,
          },

          order: [
            [
              "sortOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return rows.map(
      toPlain
    );
  };

/*
|--------------------------------------------------------------------------
| Catalogue Products
|--------------------------------------------------------------------------
*/

const loadCatalogueProducts =
  async ({
    companyId,
    productIds,
  }) => {
    if (
      !productIds.length
    ) {
      return [];
    }

    return db.Product.findAll(
      {
        where: {
          companyId,

          id: {
            [Op.in]:
              productIds,
          },

          status:
            "ACTIVE",

          isSearchable:
            true,
        },

        attributes: [
          "id",
          "companyId",
          "brandId",
          "primaryCategoryId",
          "name",
          "slug",
          "productType",
          "parentSku",
          "shortDescription",
          "taxPercent",
          "isFeatured",
          "createdAt",
          "updatedAt",
        ],
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Product Publication
|--------------------------------------------------------------------------
*/

const loadPublishedProductIds =
  async ({
    companyId,
    productIds,
    channel,
  }) => {
    if (
      !productIds.length
    ) {
      return new Set();
    }

    const channels =
      await db.ProductChannel.findAll(
        {
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },

            channelCode:
              channel,

            isVisible:
              true,

            publishStatus:
              "PUBLISHED",
          },

          attributes: [
            "productId",
            "channelTitle",
            "channelDescription",
          ],

          raw:
            true,
        }
      );

    return {
      ids:
        new Set(
          channels.map(
            (
              row
            ) =>
              String(
                row.productId
              )
          )
        ),

      channelsByProductId:
        new Map(
          channels.map(
            (
              row
            ) => [
              String(
                row.productId
              ),
              row,
            ]
          )
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| Brands
|--------------------------------------------------------------------------
*/

const loadBrands =
  async ({
    companyId,
    brandIds,
  }) => {
    const ids =
      Array.from(
        new Set(
          brandIds.filter(
            Boolean
          )
        )
      );

    if (
      !ids.length
    ) {
      return new Map();
    }

    const rows =
      await db.Brand.findAll(
        {
          where: {
            companyId,

            id: {
              [Op.in]:
                ids,
            },

            isActive:
              true,
          },

          attributes: [
            "id",
            "name",
            "slug",
          ],
        }
      );

    return mapPlainRows(
      rows
    );
  };

/*
|--------------------------------------------------------------------------
| Product Images
|--------------------------------------------------------------------------
*/

const loadProductImages =
  async ({
    companyId,
    productIds,
    apiBaseUrl,
  }) => {
    const result =
      new Map();

    if (
      !productIds.length
    ) {
      return result;
    }

    const imageRows =
      await db.ProductImage.findAll(
        {
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },

            variantId:
              null,

            isActive:
              true,
          },

          order: [
            [
              "productId",
              "ASC",
            ],
            [
              "displayOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    const images =
      imageRows.map(
        toPlain
      );

    const mediaAssetIds =
      Array.from(
        new Set(
          images
            .map(
              (
                image
              ) =>
                image.mediaAssetId
            )
            .filter(
              Boolean
            )
        )
      );

    const mediaAssets =
      mediaAssetIds.length
        ? await db.MediaAsset.findAll(
            {
              where: {
                companyId,

                id: {
                  [Op.in]:
                    mediaAssetIds,
                },

                status:
                  "READY",

                isPublic:
                  true,

                isActive:
                  true,
              },

              attributes: [
                "id",
                "title",
                "altText",
                "publicUrl",
                "storagePath",
                "thumbnailPath",
                "previewPath",
              ],
            }
          )
        : [];

    const mediaById =
      mapPlainRows(
        mediaAssets
      );

    for (
      const image of
      images
    ) {
      const productKey =
        String(
          image.productId
        );

      if (
        result.has(
          productKey
        )
      ) {
        continue;
      }

      const media =
        mediaById.get(
          String(
            image.mediaAssetId ||
              ""
          )
        );

      if (!media) {
        continue;
      }

      result.set(
        productKey,
        {
          id:
            image.id,

          imageRole:
            image.imageRole,

          altText:
            image.altText ||
            media.altText ||
            null,

          title:
            image.title ||
            media.title ||
            null,

          mediaAsset: {
            id:
              media.id,

            publicUrl:
              absoluteUrl(
                media.publicUrl ||
                  media.storagePath,
                apiBaseUrl
              ),

            thumbnailUrl:
              absoluteUrl(
                media.thumbnailPath
                  ? `/media/${media.thumbnailPath}`
                  : null,
                apiBaseUrl
              ),

            previewUrl:
              absoluteUrl(
                media.previewPath
                  ? `/media/${media.previewPath}`
                  : null,
                apiBaseUrl
              ),
          },
        }
      );
    }

    return result;
  };

/*
|--------------------------------------------------------------------------
| Variants
|--------------------------------------------------------------------------
*/

const loadVariants =
  async ({
    companyId,
    productIds,
  }) => {
    if (
      !productIds.length
    ) {
      return [];
    }

    const rows =
      await db.ProductVariant.findAll(
        {
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },

            status:
              "ACTIVE",
          },

          attributes: [
            "id",
            "productId",
            "sku",
            "barcode",
            "name",
            "isDefault",
            "sortOrder",
            "status",
            "createdAt",
          ],

          order: [
            [
              "productId",
              "ASC",
            ],
            [
              "isDefault",
              "DESC",
            ],
            [
              "sortOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return rows.map(
      toPlain
    );
  };


/*
|--------------------------------------------------------------------------
| Variant Attributes
|--------------------------------------------------------------------------
|
| Load variant-defining attributes independently so the public API can
| expose Storage / Version / Color selectors without creating a large
| Sequelize join tree.
|
|--------------------------------------------------------------------------
*/

const loadVariantAttributes =
  async ({
    companyId,
    variantIds,
  }) => {
    if (
      !variantIds.length
    ) {
      return [];
    }

    const rows =
      await db.ProductVariantAttributeValue.findAll({
        where: {
          companyId,

          productVariantId: {
            [Op.in]:
              variantIds,
          },
        },

        attributes: [
          "id",
          "productVariantId",
          "attributeId",
          "optionId",
          "displayValue",
          "sortOrder",
        ],

        include: [
          {
            model:
              db.Attribute,

            as:
              "attribute",

            required:
              false,

            where: {
              companyId,
              isActive:
                true,
            },

            attributes: [
              "id",
              "code",
              "name",
              "displayOrder",
              "isVariantDefining",
            ],
          },

          {
            model:
              db.AttributeOption,

            as:
              "option",

            required:
              false,

            where: {
              companyId,
              isActive:
                true,
            },

            attributes: [
              "id",
              "label",
              "value",
              "swatchValue",
              "displayOrder",
            ],
          },
        ],

        order: [
          [
            "productVariantId",
            "ASC",
          ],
          [
            "sortOrder",
            "ASC",
          ],
        ],
      });

    return rows.map(
      toPlain
    );
  };

/*
|--------------------------------------------------------------------------
| Variant Images
|--------------------------------------------------------------------------
|
| Variant-specific images are loaded separately and grouped in memory.
| When a shopper changes Color / Storage / Version, the storefront can
| immediately swap to that variant's gallery.
|
|--------------------------------------------------------------------------
*/

const loadVariantImages =
  async ({
    companyId,
    variantIds,
    apiBaseUrl,
  }) => {
    const result =
      new Map();

    if (
      !variantIds.length
    ) {
      return result;
    }

    const imageRows =
      await db.ProductImage.findAll({
        where: {
          companyId,

          variantId: {
            [Op.in]:
              variantIds,
          },

          isActive:
            true,
        },

        order: [
          [
            "variantId",
            "ASC",
          ],
          [
            "displayOrder",
            "ASC",
          ],
          [
            "createdAt",
            "ASC",
          ],
        ],
      });

    const images =
      imageRows.map(
        toPlain
      );

    const mediaAssetIds =
      Array.from(
        new Set(
          images
            .map(
              (
                image
              ) =>
                image.mediaAssetId
            )
            .filter(
              Boolean
            )
        )
      );

    const mediaAssets =
      mediaAssetIds.length
        ? await db.MediaAsset.findAll({
            where: {
              companyId,

              id: {
                [Op.in]:
                  mediaAssetIds,
              },

              status:
                "READY",

              isPublic:
                true,

              isActive:
                true,
            },

            attributes: [
              "id",
              "title",
              "altText",
              "publicUrl",
              "storagePath",
              "thumbnailPath",
              "previewPath",
            ],
          })
        : [];

    const mediaById =
      mapPlainRows(
        mediaAssets
      );

    for (
      const image of
      images
    ) {
      const variantKey =
        String(
          image.variantId
        );

      const media =
        mediaById.get(
          String(
            image.mediaAssetId ||
              ""
          )
        );

      if (!media) {
        continue;
      }

      if (
        !result.has(
          variantKey
        )
      ) {
        result.set(
          variantKey,
          []
        );
      }

      result
        .get(
          variantKey
        )
        .push({
          id:
            image.id,

          imageRole:
            image.imageRole,

          altText:
            image.altText ||
            media.altText ||
            null,

          title:
            image.title ||
            media.title ||
            null,

          mediaAsset: {
            id:
              media.id,

            publicUrl:
              absoluteUrl(
                media.publicUrl ||
                  media.storagePath,
                apiBaseUrl
              ),

            thumbnailUrl:
              absoluteUrl(
                media.thumbnailPath
                  ? `/media/${media.thumbnailPath}`
                  : null,
                apiBaseUrl
              ),

            previewUrl:
              absoluteUrl(
                media.previewPath
                  ? `/media/${media.previewPath}`
                  : null,
                apiBaseUrl
              ),
          },
        });
    }

    return result;
  };

/*
|--------------------------------------------------------------------------
| Variant Prices
|--------------------------------------------------------------------------
*/

const loadVariantPrices =
  async ({
    companyId,
    variantIds,
    priceListId,
    now,
  }) => {
    if (
      !variantIds.length
    ) {
      return [];
    }

    const rows =
      await db.ProductVariantPrice.findAll(
        {
          where: {
            companyId,

            productVariantId: {
              [Op.in]:
                variantIds,
            },

            isActive:
              true,

            ...(priceListId
              ? {
                  priceListId,
                }
              : {}),

            ...validityWindow(
              now
            ),
          },

          order: [
            [
              "productVariantId",
              "ASC",
            ],
            [
              "priority",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return rows.map(
      toPlain
    );
  };

const chooseVariantPrice =
  ({
    variantId,
    pricesByVariantId,
    priceList,
  }) => {
    const prices =
      pricesByVariantId.get(
        String(
          variantId
        )
      ) || [];

    const price =
      prices[0];

    if (!price) {
      return null;
    }

    return {
      id:
        price.id,

      priceListId:
        price.priceListId,

      currencyCode:
        priceList
          ?.currencyCode ||
        "AED",

      isTaxInclusive:
        priceList
          ?.isTaxInclusive !==
        false,

      sellingPrice:
        numberOrNull(
          price.sellingPrice
        ),

      regularPrice:
        numberOrNull(
          price.regularPrice
        ),

      compareAtPrice:
        numberOrNull(
          price.compareAtPrice
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| Allocations
|--------------------------------------------------------------------------
*/

const loadAllocations =
  async ({
    companyId,
    campaignProductIds,
  }) => {
    if (
      !campaignProductIds.length
    ) {
      return [];
    }

    const rows =
      await db.PreBookingAllocation.findAll(
        {
          where: {
            companyId,

            campaignProductId: {
              [Op.in]:
                campaignProductIds,
            },

            isActive:
              true,
          },

          order: [
            [
              "campaignProductId",
              "ASC",
            ],
            [
              "bundleId",
              "ASC",
            ],
            [
              "sortOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return rows.map(
      toPlain
    );
  };

const publicAllocation =
  ({
    allocation,
    now,
    variant,
  }) => {
    const allocated =
      Number(
        allocation
          .allocationQuantity ||
          0
      );

    const reserved =
      Number(
        allocation
          .reservedQuantity ||
          0
      );

    const confirmed =
      Number(
        allocation
          .confirmedQuantity ||
          0
      );

    const remaining =
      Math.max(
        0,
        allocated -
          reserved -
          confirmed
      );

    const availableFrom =
      allocation.availableFrom
        ? new Date(
            allocation.availableFrom
          )
        : null;

    const availableUntil =
      allocation.availableUntil
        ? new Date(
            allocation.availableUntil
          )
        : null;

    const windowOpen =
      (
        !availableFrom ||
        Number.isNaN(
          availableFrom.getTime()
        ) ||
        availableFrom.getTime() <=
          now.getTime()
      ) &&
      (
        !availableUntil ||
        Number.isNaN(
          availableUntil.getTime()
        ) ||
        availableUntil.getTime() >
          now.getTime()
      );

    const availableQuantity =
      windowOpen
        ? remaining
        : 0;

    return {
      id:
        allocation.id,

      campaignProductId:
        allocation.campaignProductId,

      bundleId:
        allocation.bundleId ||
        null,

      productVariantId:
        allocation.productVariantId ||
        null,

      variant:
        variant
          ? {
              id:
                variant.id,

              sku:
                variant.sku,

              barcode:
                variant.barcode ||
                null,

              name:
                variant.name,

              isDefault:
                variant.isDefault ===
                true,
            }
          : null,

      allocationQuantity:
        allocated,

      reservedQuantity:
        reserved,

      confirmedQuantity:
        confirmed,

      availableQuantity,

      isAvailable:
        availableQuantity >
        0,

      windowOpen,

      availableFrom:
        allocation.availableFrom ||
        null,

      availableUntil:
        allocation.availableUntil ||
        null,

      expectedStockFrom:
        allocation.expectedStockFrom ||
        null,

      expectedStockUntil:
        allocation.expectedStockUntil ||
        null,

      note:
        allocation.note ||
        null,
    };
  };

const summarizeAllocations =
  (
    allocations
  ) => {
    const availableQuantity =
      allocations.reduce(
        (
          total,
          allocation
        ) =>
          total +
          Number(
            allocation
              .availableQuantity ||
              0
          ),
        0
      );

    return {
      hasAllocation:
        allocations.length >
        0,

      availableQuantity,

      isAvailable:
        availableQuantity >
        0,
    };
  };

/*
|--------------------------------------------------------------------------
| Bundles
|--------------------------------------------------------------------------
*/

const loadBundles =
  async ({
    companyId,
    campaignProductIds,
  }) => {
    if (
      !campaignProductIds.length
    ) {
      return [];
    }

    const rows =
      await db.PreBookingBundle.findAll(
        {
          where: {
            companyId,

            campaignProductId: {
              [Op.in]:
                campaignProductIds,
            },

            isActive:
              true,
          },

          order: [
            [
              "campaignProductId",
              "ASC",
            ],
            [
              "sortOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return rows.map(
      toPlain
    );
  };

const loadBundleItems =
  async ({
    companyId,
    bundleIds,
  }) => {
    if (
      !bundleIds.length
    ) {
      return [];
    }

    const rows =
      await db.PreBookingBundleItem.findAll(
        {
          where: {
            companyId,

            bundleId: {
              [Op.in]:
                bundleIds,
            },

            isActive:
              true,
          },

          order: [
            [
              "bundleId",
              "ASC",
            ],
            [
              "sortOrder",
              "ASC",
            ],
            [
              "createdAt",
              "ASC",
            ],
          ],
        }
      );

    return rows.map(
      toPlain
    );
  };

/*
|--------------------------------------------------------------------------
| Bundle Item Catalogue Lookups
|--------------------------------------------------------------------------
*/

const loadBundleItemCatalogue =
  async ({
    companyId,
    bundleItems,
  }) => {
    const productIds =
      Array.from(
        new Set(
          bundleItems
            .map(
              (
                item
              ) =>
                item.productId
            )
            .filter(
              Boolean
            )
        )
      );

    const variantIds =
      Array.from(
        new Set(
          bundleItems
            .map(
              (
                item
              ) =>
                item.productVariantId
            )
            .filter(
              Boolean
            )
        )
      );

    const [
      productRows,
      variantRows,
    ] =
      await Promise.all([
        productIds.length
          ? db.Product.findAll(
              {
                where: {
                  companyId,

                  id: {
                    [Op.in]:
                      productIds,
                  },
                },

                attributes: [
                  "id",
                  "name",
                  "slug",
                  "parentSku",
                  "status",
                ],
              }
            )
          : [],

        variantIds.length
          ? db.ProductVariant.findAll(
              {
                where: {
                  companyId,

                  id: {
                    [Op.in]:
                      variantIds,
                  },
                },

                attributes: [
                  "id",
                  "productId",
                  "sku",
                  "barcode",
                  "name",
                  "status",
                ],
              }
            )
          : [],
      ]);

    return {
      productsById:
        mapPlainRows(
          productRows
        ),

      variantsById:
        mapPlainRows(
          variantRows
        ),
    };
  };

/*
|--------------------------------------------------------------------------
| Protection
|--------------------------------------------------------------------------
*/

const loadProtectionSchemes =
  async ({
    companyId,
    protectionSchemeIds,
  }) => {
    const ids =
      Array.from(
        new Set(
          protectionSchemeIds.filter(
            Boolean
          )
        )
      );

    if (
      !ids.length
    ) {
      return new Map();
    }

    const rows =
      await db.ProtectionScheme.findAll(
        {
          where: {
            companyId,

            id: {
              [Op.in]:
                ids,
            },

            isActive:
              true,
          },
        }
      );

    return mapPlainRows(
      rows
    );
  };

/*
|--------------------------------------------------------------------------
| Public Campaign Summary
|--------------------------------------------------------------------------
*/

const buildCampaignSummary =
  ({
    campaign,
    bookingStatus,
    productCount,
  }) => ({
    id:
      campaign.id,

    code:
      campaign.code,

    name:
      campaign.name,

    slug:
      campaign.slug,

    description:
      campaign.description ||
      null,

    status:
      campaign.status,

    bookingStatus,

    bookingStartAt:
      campaign.bookingStartAt ||
      null,

    bookingEndAt:
      campaign.bookingEndAt ||
      null,

    paymentPolicy:
      campaign.paymentPolicy,

    paymentMethods: {
      card:
        campaign.allowCard ===
        true,

      tabby:
        campaign.allowTabby ===
        true,

      tamara:
        campaign.allowTamara ===
        true,
    },

    allowCoupons:
      campaign.allowCoupons ===
      true,

    allowGiftVouchers:
      campaign.allowGiftVouchers ===
      true,

    checkoutSessionMinutes:
      Number(
        campaign.checkoutSessionMinutes ||
          15
      ),

    productCount:
      Number(
        productCount ||
          0
      ),
  });

/*
|--------------------------------------------------------------------------
| Core Loader
|--------------------------------------------------------------------------
*/

const loadCampaignContext =
  async ({
    companyCode,
    campaignSlug,
    productSlug,
    channel,
    apiBaseUrl,
  }) => {
    const now =
      new Date();

    const normalizedChannel =
      normalizeChannel(
        channel
      );

    const company =
      await getCompany(
        companyCode
      );

    const campaign =
      await findCampaign({
        companyId:
          company.id,

        campaignSlug,
      });

    const bookingStatus =
      resolveBookingStatus(
        campaign,
        now
      );

    const campaignProducts =
      await loadCampaignProducts(
        {
          companyId:
            company.id,

          campaignId:
            campaign.id,
        }
      );

    if (
      !campaignProducts.length
    ) {
      return {
        now,
        company,
        campaign,
        bookingStatus,
        channel:
          normalizedChannel,
        priceList:
          null,
        campaignProducts:
          [],
        products:
          [],
        variants:
          [],
        variantAttributes:
          [],
        variantImagesByVariantId:
          new Map(),
        bundles:
          [],
        bundleItems:
          [],
        allocations:
          [],
        imagesByProductId:
          new Map(),
        brandsById:
          new Map(),
        published:
          {
            ids:
              new Set(),

            channelsByProductId:
              new Map(),
          },
        protectionById:
          new Map(),
        bundleItemCatalogue: {
          productsById:
            new Map(),

          variantsById:
            new Map(),
        },
      };
    }

    const allProductIds =
      Array.from(
        new Set(
          campaignProducts.map(
            (
              item
            ) =>
              item.productId
          )
        )
      );

    const catalogueProducts =
      (
        await loadCatalogueProducts({
          companyId:
            company.id,

          productIds:
            allProductIds,
        })
      ).map(
        toPlain
      );

    const published =
      await loadPublishedProductIds(
        {
          companyId:
            company.id,

          productIds:
            allProductIds,

          channel:
            normalizedChannel,
        }
      );

    let products =
      catalogueProducts.filter(
        (
          product
        ) =>
          published.ids.has(
            String(
              product.id
            )
          )
      );

    if (
      productSlug
    ) {
      const normalizedProductSlug =
        String(
          productSlug
        )
          .trim()
          .toLowerCase();

      products =
        products.filter(
          (
            product
          ) =>
            String(
              product.slug ||
                ""
            )
              .trim()
              .toLowerCase() ===
            normalizedProductSlug
        );
    }

    const visibleProductIds =
      products.map(
        (
          product
        ) =>
          product.id
      );

    const visibleCampaignProducts =
      campaignProducts.filter(
        (
          item
        ) =>
          visibleProductIds.includes(
            item.productId
          )
      );

    const campaignProductIds =
      visibleCampaignProducts.map(
        (
          item
        ) =>
          item.id
      );

    const brandIds =
      products
        .map(
          (
            product
          ) =>
            product.brandId
        )
        .filter(
          Boolean
        );

    const priceListModel =
      await findPriceList({
        companyId:
          company.id,

        channel:
          normalizedChannel,

        now,
      });

    const priceList =
      priceListModel
        ? toPlain(
            priceListModel
          )
        : null;

    const [
      brandsById,
      imagesByProductId,
      variants,
      bundles,
      allocations,
    ] =
      await Promise.all([
        loadBrands({
          companyId:
            company.id,

          brandIds,
        }),

        loadProductImages({
          companyId:
            company.id,

          productIds:
            visibleProductIds,

          apiBaseUrl,
        }),

        loadVariants({
          companyId:
            company.id,

          productIds:
            visibleProductIds,
        }),

        loadBundles({
          companyId:
            company.id,

          campaignProductIds,
        }),

        loadAllocations({
          companyId:
            company.id,

          campaignProductIds,
        }),
      ]);

    const variantIds =
      variants.map(
        (
          variant
        ) =>
          variant.id
      );

    const bundleIds =
      bundles.map(
        (
          bundle
        ) =>
          bundle.id
      );

    const [
      prices,
      bundleItems,
      variantAttributes,
      variantImagesByVariantId,
    ] =
      await Promise.all([
        loadVariantPrices({
          companyId:
            company.id,

          variantIds,

          priceListId:
            priceList?.id ||
            null,

          now,
        }),

        loadBundleItems({
          companyId:
            company.id,

          bundleIds,
        }),

        loadVariantAttributes({
          companyId:
            company.id,

          variantIds,
        }),

        loadVariantImages({
          companyId:
            company.id,

          variantIds,

          apiBaseUrl,
        }),
      ]);

    const protectionSchemeIds =
      bundles
        .map(
          (
            bundle
          ) =>
            bundle.protectionSchemeId
        )
        .filter(
          Boolean
        );

    const [
      protectionById,
      bundleItemCatalogue,
    ] =
      await Promise.all([
        loadProtectionSchemes({
          companyId:
            company.id,

          protectionSchemeIds,
        }),

        loadBundleItemCatalogue({
          companyId:
            company.id,

          bundleItems,
        }),
      ]);

    return {
      now,
      company,
      campaign,
      bookingStatus,
      channel:
        normalizedChannel,
      priceList,
      campaignProducts:
        visibleCampaignProducts,
      products,
      brandsById,
      imagesByProductId,
      variants,
      prices,
      variantAttributes,
      variantImagesByVariantId,
      bundles,
      bundleItems,
      allocations,
      protectionById,
      bundleItemCatalogue,
      published,
    };
  };

/*
|--------------------------------------------------------------------------
| Build Public Products
|--------------------------------------------------------------------------
*/

const buildPublicProducts =
  (
    context
  ) => {
    const {
      now,
      campaign,
      bookingStatus,
      campaignProducts,
      products,
      brandsById,
      imagesByProductId,
      variants,
      prices,
      variantAttributes,
      variantImagesByVariantId,
      bundles,
      bundleItems,
      allocations,
      protectionById,
      bundleItemCatalogue,
      published,
      priceList,
    } =
      context;

    const productById =
      new Map(
        products.map(
          (
            product
          ) => [
            String(
              product.id
            ),
            product,
          ]
        )
      );

    const campaignProductByProductId =
      new Map(
        campaignProducts.map(
          (
            campaignProduct
          ) => [
            String(
              campaignProduct.productId
            ),
            campaignProduct,
          ]
        )
      );

    const variantsByProductId =
      groupPlainRows(
        variants,
        "productId"
      );

    const variantById =
      mapPlainRows(
        variants
      );

    const pricesByVariantId =
      groupPlainRows(
        prices,
        "productVariantId"
      );

    const attributesByVariantId =
      groupPlainRows(
        variantAttributes,
        "productVariantId"
      );

    const bundlesByCampaignProductId =
      groupPlainRows(
        bundles,
        "campaignProductId"
      );

    const itemsByBundleId =
      groupPlainRows(
        bundleItems,
        "bundleId"
      );

    const allocationsByCampaignProductId =
      groupPlainRows(
        allocations,
        "campaignProductId"
      );

    const publicProducts =
      [];

    for (
      const campaignProduct of
      campaignProducts
    ) {
      const product =
        productById.get(
          String(
            campaignProduct.productId
          )
        );

      if (!product) {
        continue;
      }

      const channelRow =
        published
          .channelsByProductId
          .get(
            String(
              product.id
            )
          );

      const productVariants =
        variantsByProductId.get(
          String(
            product.id
          )
        ) || [];

      const publicVariants =
        productVariants.map(
          (
            variant
          ) => {
            const price =
              chooseVariantPrice({
                variantId:
                  variant.id,

                pricesByVariantId,

                priceList,
              });

            const directAllocations =
              (
                allocationsByCampaignProductId.get(
                  String(
                    campaignProduct.id
                  )
                ) || []
              )
                .filter(
                  (
                    allocation
                  ) =>
                    !allocation.bundleId &&
                    (
                      !allocation.productVariantId ||
                      String(
                        allocation.productVariantId
                      ) ===
                        String(
                          variant.id
                        )
                    )
                )
                .map(
                  (
                    allocation
                  ) =>
                    publicAllocation({
                      allocation,
                      now,
                      variant:
                        variantById.get(
                          String(
                            allocation.productVariantId ||
                              variant.id
                          )
                        ) ||
                        null,
                    })
                );

            return {
              id:
                variant.id,

              sku:
                variant.sku,

              barcode:
                variant.barcode ||
                null,

              name:
                variant.name,

              isDefault:
                variant.isDefault ===
                true,

              sortOrder:
                Number(
                  variant.sortOrder ||
                    0
                ),

              attributes:
                (
                  attributesByVariantId.get(
                    String(
                      variant.id
                    )
                  ) || []
                ).map(
                  (
                    value
                  ) => ({
                    id:
                      value.id,

                    attributeId:
                      value.attributeId,

                    optionId:
                      value.optionId ||
                      null,

                    code:
                      value.attribute
                        ?.code ||
                      null,

                    name:
                      value.attribute
                        ?.name ||
                      null,

                    displayOrder:
                      Number(
                        value.attribute
                          ?.displayOrder ||
                          0
                      ),

                    value:
                      value.option
                        ?.value ||
                      value.displayValue ||
                      null,

                    label:
                      value.option
                        ?.label ||
                      value.displayValue ||
                      null,

                    swatchValue:
                      value.option
                        ?.swatchValue ||
                      null,
                  })
                ),

              images:
                variantImagesByVariantId.get(
                  String(
                    variant.id
                  )
                ) || [],

              price,

              allocationSummary:
                summarizeAllocations(
                  directAllocations
                ),

              allocations:
                directAllocations,
            };
          }
        );

      const defaultVariant =
        publicVariants.find(
          (
            variant
          ) =>
            variant.isDefault ===
            true
        ) ||
        publicVariants[0] ||
        null;

      const priceOverride =
        numberOrNull(
          campaignProduct.priceOverride
        );

      const basePrice =
        priceOverride !==
        null
          ? {
              ...(defaultVariant
                ?.price ||
                {}),

              currencyCode:
                campaignProduct.currencyCode ||
                defaultVariant
                  ?.price
                  ?.currencyCode ||
                priceList
                  ?.currencyCode ||
                "AED",

              sellingPrice:
                priceOverride,

              campaignPriceOverride:
                true,
            }
          : defaultVariant
              ?.price ||
            null;

      const productBundles =
        (
          bundlesByCampaignProductId.get(
            String(
              campaignProduct.id
            )
          ) || []
        ).map(
          (
            bundle
          ) => {
            const rawItems =
              itemsByBundleId.get(
                String(
                  bundle.id
                )
              ) || [];

            const publicItems =
              rawItems.map(
                (
                  item
                ) => {
                  const itemProduct =
                    item.productId
                      ? bundleItemCatalogue
                          .productsById
                          .get(
                            String(
                              item.productId
                            )
                          )
                      : null;

                  const itemVariant =
                    item.productVariantId
                      ? bundleItemCatalogue
                          .variantsById
                          .get(
                            String(
                              item.productVariantId
                            )
                          )
                      : null;

                  return {
                    id:
                      item.id,

                    itemType:
                      item.itemType,

                    productId:
                      item.productId ||
                      null,

                    productVariantId:
                      item.productVariantId ||
                      null,

                    label:
                      item.label,

                    description:
                      item.description ||
                      null,

                    quantity:
                      Number(
                        item.quantity ||
                          1
                      ),

                    isIncluded:
                      item.isIncluded !==
                      false,

                    sortOrder:
                      Number(
                        item.sortOrder ||
                          0
                      ),

                    product:
                      itemProduct
                        ? {
                            id:
                              itemProduct.id,

                            name:
                              itemProduct.name,

                            slug:
                              itemProduct.slug,

                            parentSku:
                              itemProduct.parentSku ||
                              null,
                          }
                        : null,

                    variant:
                      itemVariant
                        ? {
                            id:
                              itemVariant.id,

                            sku:
                              itemVariant.sku,

                            barcode:
                              itemVariant.barcode ||
                              null,

                            name:
                              itemVariant.name,
                          }
                        : null,
                  };
                }
              );

            const bundleAllocations =
              (
                allocationsByCampaignProductId.get(
                  String(
                    campaignProduct.id
                  )
                ) || []
              )
                .filter(
                  (
                    allocation
                  ) =>
                    String(
                      allocation.bundleId ||
                        ""
                    ) ===
                    String(
                      bundle.id
                    )
                )
                .map(
                  (
                    allocation
                  ) =>
                    publicAllocation({
                      allocation,
                      now,
                      variant:
                        allocation.productVariantId
                          ? variantById.get(
                              String(
                                allocation.productVariantId
                              )
                            ) ||
                            null
                          : null,
                    })
                );

            const protection =
              bundle.protectionSchemeId
                ? protectionById.get(
                    String(
                      bundle.protectionSchemeId
                    )
                  ) ||
                  null
                : null;

            const priceAmount =
              numberOrNull(
                bundle.priceAmount
              );

            return {
              id:
                bundle.id,

              code:
                bundle.code,

              name:
                bundle.name,

              description:
                bundle.description ||
                null,

              priceMode:
                bundle.priceMode,

              priceAmount,

              currencyCode:
                bundle.currencyCode ||
                campaignProduct.currencyCode ||
                "AED",

              badgeText:
                bundle.badgeText ||
                null,

              isDefault:
                bundle.isDefault ===
                true,

              protectionIncluded:
                bundle.protectionIncluded ===
                true,

              protectionSchemeId:
                bundle.protectionSchemeId ||
                null,

              protectionScheme:
                protection,

              items:
                publicItems,

              allocationSummary:
                summarizeAllocations(
                  bundleAllocations
                ),

              allocations:
                bundleAllocations,
            };
          }
        );

      const directAllocations =
        (
          allocationsByCampaignProductId.get(
            String(
              campaignProduct.id
            )
          ) || []
        )
          .filter(
            (
              allocation
            ) =>
              !allocation.bundleId
          )
          .map(
            (
              allocation
            ) =>
              publicAllocation({
                allocation,
                now,
                variant:
                  allocation.productVariantId
                    ? variantById.get(
                        String(
                          allocation.productVariantId
                        )
                      ) ||
                      null
                    : null,
              })
          );

      const availableQuantity =
        directAllocations.reduce(
          (
            total,
            allocation
          ) =>
            total +
            Number(
              allocation.availableQuantity ||
                0
            ),
          0
        );

      publicProducts.push({
        id:
          product.id,

        campaignProductId:
          campaignProduct.id,

        name:
          campaignProduct.displayTitle ||
          channelRow
            ?.channelTitle ||
          product.name,

        slug:
          product.slug,

        parentSku:
          product.parentSku ||
          null,

        productType:
          product.productType,

        shortDescription:
          campaignProduct.shortDescription ||
          channelRow
            ?.channelDescription ||
          product.shortDescription ||
          null,

        badgeText:
          campaignProduct.badgeText ||
          null,

        brand:
          product.brandId
            ? brandsById.get(
                String(
                  product.brandId
                )
              ) ||
              null
            : null,

        image:
          imagesByProductId.get(
            String(
              product.id
            )
          ) ||
          null,

        taxPercent:
          Number(
            product.taxPercent ||
              0
          ),

        minimumQuantity:
          Number(
            campaignProduct.minimumQuantity ||
              1
          ),

        maximumQuantityPerOrder:
          Number(
            campaignProduct.maximumQuantityPerOrder ||
              1
          ),

        priceOverride,

        currencyCode:
          campaignProduct.currencyCode ||
          priceList
            ?.currencyCode ||
          "AED",

        price:
          basePrice,

        defaultVariantId:
          defaultVariant?.id ||
          null,

        variants:
          publicVariants,

        bundles:
          productBundles,

        hasBundles:
          productBundles.length >
          0,

        allocationSummary:
          {
            hasAllocation:
              directAllocations.length >
              0,

            availableQuantity,

            isAvailable:
              availableQuantity >
              0,
          },

        allocations:
          directAllocations,

        preBooking: {
          campaignId:
            campaign.id,

          campaignCode:
            campaign.code,

          campaignName:
            campaign.name,

          campaignSlug:
            campaign.slug,

          bookingStatus,

          bookingStartAt:
            campaign.bookingStartAt ||
            null,

          bookingEndAt:
            campaign.bookingEndAt ||
            null,

          paymentPolicy:
            campaign.paymentPolicy,
        },

        productUrl:
          `/products/${product.slug}`,

        preBookingUrl:
          `/pre-booking/${campaign.slug}/${product.slug}`,
      });
    }

    return publicProducts;
  };


  /*
|--------------------------------------------------------------------------
| GET /campaigns
|--------------------------------------------------------------------------
|
| Lightweight public campaign listing.
|
| Important:
| - Does not hydrate products
| - Does not hydrate variants
| - Does not hydrate allocations
| - Does not hydrate media
|
| The campaign detail endpoint remains responsible for the complete
| pre-booking product experience.
|--------------------------------------------------------------------------
*/

const getCampaigns =
async ({
  companyCode,
  channel =
    "WEBSITE",
}) => {
  const now =
    new Date();

  const normalizedChannel =
    normalizeChannel(
      channel
    );

  const company =
    await getCompany(
      companyCode
    );

  /*
  |--------------------------------------------------------------------------
  | Active Public Campaigns
  |--------------------------------------------------------------------------
  */

  const campaigns =
    await db.PreBookingCampaign
      .findAll({
        where: {
          companyId:
            company.id,

          status:
            "ACTIVE",

          isActive:
            true,
        },

        attributes: [
          "id",
          "code",
          "name",
          "slug",
          "description",
          "status",
          "bookingStartAt",
          "bookingEndAt",
          "paymentPolicy",
          "allowCard",
          "allowTabby",
          "allowTamara",
          "allowCoupons",
          "allowGiftVouchers",
          "checkoutSessionMinutes",
          "sortOrder",
        ],

        order: [
          [
            "sortOrder",
            "ASC",
          ],

          [
            "bookingStartAt",
            "DESC",
          ],

          [
            "createdAt",
            "DESC",
          ],
        ],
      });

  if (
    !campaigns.length
  ) {
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

      campaigns:
        [],

      meta: {
        channel:
          normalizedChannel,

        count:
          0,

        generatedAt:
          new Date()
            .toISOString(),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Product Counts
  |--------------------------------------------------------------------------
  |
  | Count campaign-product rows without loading the actual product graph.
  |--------------------------------------------------------------------------
  */

  const campaignIds =
    campaigns.map(
      (campaign) =>
        campaign.id
    );

  const productCounts =
    await db
      .PreBookingCampaignProduct
      .findAll({
        where: {
          companyId:
            company.id,

          campaignId: {
            [Op.in]:
              campaignIds,
          },

          isActive:
            true,
        },

        attributes: [
          "campaignId",

          [
            db.sequelize.fn(
              "COUNT",
              db.sequelize.col(
                "id"
              )
            ),
            "productCount",
          ],
        ],

        group: [
          "campaignId",
        ],

        raw:
          true,
      });

  const productCountByCampaignId =
    new Map(
      productCounts.map(
        (row) => [
          String(
            row.campaignId
          ),

          Number(
            row.productCount ||
              0
          ),
        ]
      )
    );

  /*
  |--------------------------------------------------------------------------
  | Public Summaries
  |--------------------------------------------------------------------------
  */

  const publicCampaigns =
    campaigns.map(
      (campaignModel) => {
        const campaign =
          typeof campaignModel.get ===
          "function"
            ? campaignModel.get({
                plain:
                  true,
              })
            : campaignModel;

        const bookingStatus =
          resolveBookingStatus(
            campaign,
            now
          );

        const productCount =
          productCountByCampaignId
            .get(
              String(
                campaign.id
              )
            ) ||
          0;

        return {
          ...buildCampaignSummary({
            campaign,

            bookingStatus,

            productCount,
          }),

          sortOrder:
            Number(
              campaign.sortOrder ||
                0
            ),

          campaignUrl:
            `/pre-booking/${campaign.slug}`,
        };
      }
    );

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

    campaigns:
      publicCampaigns,

    meta: {
      channel:
        normalizedChannel,

      count:
        publicCampaigns.length,

      generatedAt:
        new Date()
          .toISOString(),
    },
  };
};

/*
|--------------------------------------------------------------------------
| GET /campaigns/:slug
|--------------------------------------------------------------------------
*/

const getCampaign =
  async ({
    companyCode,
    campaignSlug,
    channel =
      "WEBSITE",
    apiBaseUrl,
  }) => {
    const context =
      await loadCampaignContext({
        companyCode,
        campaignSlug,
        channel,
        apiBaseUrl,
      });

    const products =
      buildPublicProducts(
        context
      );

    return {
      company: {
        id:
          context.company.id,

        name:
          context.company.name,

        code:
          context.company.code,

        currency:
          context.company.currency,
      },

      campaign:
        buildCampaignSummary({
          campaign:
            context.campaign,

          bookingStatus:
            context.bookingStatus,

          productCount:
            products.length,
        }),

      products,

      resolvedPriceList:
        context.priceList
          ? {
              id:
                context.priceList.id,

              code:
                context.priceList.code,

              name:
                context.priceList.name,

              currencyCode:
                context.priceList.currencyCode,

              isTaxInclusive:
                context.priceList.isTaxInclusive,
            }
          : null,

      meta: {
        channel:
          context.channel,

        generatedAt:
          new Date()
            .toISOString(),
      },
    };
  };

/*
|--------------------------------------------------------------------------
| GET /campaigns/:slug/products/:productSlug
|--------------------------------------------------------------------------
*/

const getCampaignProduct =
  async ({
    companyCode,
    campaignSlug,
    productSlug,
    channel =
      "WEBSITE",
    apiBaseUrl,
  }) => {
    const context =
      await loadCampaignContext({
        companyCode,
        campaignSlug,
        productSlug,
        channel,
        apiBaseUrl,
      });

    const products =
      buildPublicProducts(
        context
      );

    const product =
      products[0];

    if (!product) {
      throw new AppError(
        "Pre-booking product was not found in this campaign.",
        404,
        "PRE_BOOKING_PRODUCT_NOT_FOUND"
      );
    }

    return {
      company: {
        id:
          context.company.id,

        name:
          context.company.name,

        code:
          context.company.code,

        currency:
          context.company.currency,
      },

      campaign:
        buildCampaignSummary({
          campaign:
            context.campaign,

          bookingStatus:
            context.bookingStatus,

          productCount:
            context
              .campaignProducts
              .length,
        }),

      product,

      resolvedPriceList:
        context.priceList
          ? {
              id:
                context.priceList.id,

              code:
                context.priceList.code,

              name:
                context.priceList.name,

              currencyCode:
                context.priceList.currencyCode,

              isTaxInclusive:
                context.priceList.isTaxInclusive,
            }
          : null,

      meta: {
        channel:
          context.channel,

        generatedAt:
          new Date()
            .toISOString(),
      },
    };
  };

  module.exports = {
    getCampaigns,
    getCampaign,
    getCampaignProduct,
  };