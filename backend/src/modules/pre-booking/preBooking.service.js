const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db =
    require(
      "../../models"
    );
  
  const AppError =
    require(
      "../../utils/AppError"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const normalizeNullable = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }
  
    const normalized =
      String(
        value
      ).trim();
  
    return normalized ||
      null;
  };
  
  const normalizeCurrencyCode = (
    value
  ) =>
    String(
      value ||
      "AED"
    )
      .trim()
      .toUpperCase();
  
  const validateDateRange = ({
    start,
    end,
    message,
    code,
  }) => {
    if (
      !start ||
      !end
    ) {
      return;
    }
  
    if (
      new Date(
        end
      ) <
      new Date(
        start
      )
    ) {
      throw new AppError(
        message,
        400,
        code
      );
    }
  };
  
  const validateAvailabilityRanges = (
    payload
  ) => {
    validateDateRange({
      start:
        payload.availableFrom,
  
      end:
        payload.availableUntil,
  
      message:
        "Availability end date cannot be earlier than availability start date.",
  
      code:
        "INVALID_PRE_BOOKING_AVAILABILITY_WINDOW",
    });
  
    validateDateRange({
      start:
        payload.expectedStockFrom,
  
      end:
        payload.expectedStockUntil,
  
      message:
        "Expected stock end date cannot be earlier than expected stock start date.",
  
      code:
        "INVALID_PRE_BOOKING_STOCK_WINDOW",
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | Find Campaign
  |--------------------------------------------------------------------------
  */
  
  const findCampaignOrThrow =
    async ({
      companyId,
      campaignId,
      transaction,
    }) => {
      const campaign =
        await db.PreBookingCampaign.findOne({
          where: {
            id:
              campaignId,
  
            companyId,
          },
  
          transaction,
        });
  
      if (
        !campaign
      ) {
        throw new AppError(
          "Pre-booking campaign was not found.",
          404,
          "PRE_BOOKING_CAMPAIGN_NOT_FOUND"
        );
      }
  
      return campaign;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Find Campaign Product
  |--------------------------------------------------------------------------
  */
  
  const findCampaignProductOrThrow =
    async ({
      companyId,
      campaignProductId,
      transaction,
    }) => {
      const record =
        await db.PreBookingCampaignProduct.findOne({
          where: {
            id:
              campaignProductId,
  
            companyId,
          },
  
          transaction,
        });
  
      if (
        !record
      ) {
        throw new AppError(
          "Pre-booking campaign product was not found.",
          404,
          "PRE_BOOKING_CAMPAIGN_PRODUCT_NOT_FOUND"
        );
      }
  
      return record;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Find Bundle
  |--------------------------------------------------------------------------
  */
  
  const findBundleOrThrow =
    async ({
      companyId,
      bundleId,
      transaction,
    }) => {
      const record =
        await db.PreBookingBundle.findOne({
          where: {
            id:
              bundleId,
  
            companyId,
          },
  
          transaction,
        });
  
      if (
        !record
      ) {
        throw new AppError(
          "Pre-booking bundle was not found.",
          404,
          "PRE_BOOKING_BUNDLE_NOT_FOUND"
        );
      }
  
      return record;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Find Bundle Item
  |--------------------------------------------------------------------------
  */
  
  const findBundleItemOrThrow =
    async ({
      companyId,
      bundleItemId,
      transaction,
    }) => {
      const record =
        await db.PreBookingBundleItem.findOne({
          where: {
            id:
              bundleItemId,
  
            companyId,
          },
  
          transaction,
        });
  
      if (
        !record
      ) {
        throw new AppError(
          "Pre-booking bundle item was not found.",
          404,
          "PRE_BOOKING_BUNDLE_ITEM_NOT_FOUND"
        );
      }
  
      return record;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Find Allocation
  |--------------------------------------------------------------------------
  */
  
  const findAllocationOrThrow =
    async ({
      companyId,
      allocationId,
      transaction,
    }) => {
      const record =
        await db.PreBookingAllocation.findOne({
          where: {
            id:
              allocationId,
  
            companyId,
          },
  
          transaction,
        });
  
      if (
        !record
      ) {
        throw new AppError(
          "Pre-booking allocation was not found.",
          404,
          "PRE_BOOKING_ALLOCATION_NOT_FOUND"
        );
      }
  
      return record;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Validate Product
  |--------------------------------------------------------------------------
  */
  
  const findProductOrThrow =
    async ({
      companyId,
      productId,
      transaction,
    }) => {
      const product =
        await db.Product.findOne({
          where: {
            id:
              productId,
  
            companyId,
          },
  
          transaction,
        });
  
      if (
        !product
      ) {
        throw new AppError(
          "Product was not found.",
          404,
          "PRODUCT_NOT_FOUND"
        );
      }
  
      return product;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Validate Variant Belongs To Product
  |--------------------------------------------------------------------------
  */
  
  const findProductVariantOrThrow =
    async ({
      companyId,
      productId,
      productVariantId,
      transaction,
    }) => {
      const variant =
        await db.ProductVariant.findOne({
          where: {
            id:
              productVariantId,
  
            companyId,
  
            productId,
          },
  
          transaction,
        });
  
      if (
        !variant
      ) {
        throw new AppError(
          "Selected variant does not belong to this product.",
          400,
          "INVALID_PRE_BOOKING_VARIANT"
        );
      }
  
      return variant;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Validate Protection Scheme
  |--------------------------------------------------------------------------
  */
  
  const findProtectionSchemeOrThrow =
    async ({
      companyId,
      protectionSchemeId,
      transaction,
    }) => {
      const scheme =
        await db.ProtectionScheme.findOne({
          where: {
            id:
              protectionSchemeId,
  
            companyId,
  
            isActive:
              true,
          },
  
          transaction,
        });
  
      if (
        !scheme
      ) {
        throw new AppError(
          "Active protection scheme was not found.",
          404,
          "PROTECTION_SCHEME_NOT_FOUND"
        );
      }
  
      return scheme;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Complete Campaign Include
  |--------------------------------------------------------------------------
  */
  
  /*
  |--------------------------------------------------------------------------
  | Complete Campaign Include - Optimized
  |--------------------------------------------------------------------------
  |
  | Independent hasMany associations are loaded separately to avoid the
  | Cartesian row multiplication caused by one giant joined Sequelize query.
  |--------------------------------------------------------------------------
  */

  const buildCampaignInclude =
    () => [
      {
        model:
          db.PreBookingCampaignProduct,

        as:
          "products",

        required:
          false,

        separate:
          true,

        order: [
          ["sortOrder", "ASC"],
          ["createdAt", "ASC"],
        ],

        include: [
          {
            model:
              db.Product,

            as:
              "product",

            required:
              false,

            include: [
              {
                model:
                  db.Brand,

                as:
                  "brand",

                required:
                  false,
              },

              {
                model:
                  db.ProductVariant,

                as:
                  "variants",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],
              },

              {
                model:
                  db.ProductImage,

                as:
                  "images",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["displayOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],

                include: [
                  {
                    model:
                      db.MediaAsset,

                    as:
                      "mediaAsset",

                    required:
                      false,

                    include: [
                      {
                        model:
                          db.MediaAssetVariant,

                        as:
                          "variants",

                        required:
                          false,

                        separate:
                          true,

                        order: [
                          ["variantType", "ASC"],
                          ["createdAt", "ASC"],
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            model:
              db.PreBookingBundle,

            as:
              "bundles",

            required:
              false,

            separate:
              true,

            order: [
              ["sortOrder", "ASC"],
              ["createdAt", "ASC"],
            ],

            include: [
              {
                model:
                  db.PreBookingBundleItem,

                as:
                  "items",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],
              },

              {
                model:
                  db.ProtectionScheme,

                as:
                  "protectionScheme",

                required:
                  false,
              },

              {
                model:
                  db.PreBookingAllocation,

                as:
                  "allocations",

                required:
                  false,

                separate:
                  true,

                order: [
                  ["sortOrder", "ASC"],
                  ["createdAt", "ASC"],
                ],

                include: [
                  {
                    model:
                      db.ProductVariant,

                    as:
                      "variant",

                    required:
                      false,
                  },
                ],
              },
            ],
          },

          {
            model:
              db.PreBookingAllocation,

            as:
              "allocations",

            required:
              false,

            separate:
              true,

            order: [
              ["sortOrder", "ASC"],
              ["createdAt", "ASC"],
            ],

            include: [
              {
                model:
                  db.ProductVariant,

                as:
                  "variant",

                required:
                  false,
              },
            ],
          },
        ],
      },
    ];

  /*
  |--------------------------------------------------------------------------
  | Serialize Allocation
  |--------------------------------------------------------------------------
  */
  
  const serializeAllocation = (
    value
  ) => {
    if (
      !value
    ) {
      return value;
    }
  
    const allocation =
      value.get
        ? value.get({
            plain:
              true,
          })
        : value;
  
    const allocationQuantity =
      Number(
        allocation
          .allocationQuantity ||
        0
      );
  
    const reservedQuantity =
      Number(
        allocation
          .reservedQuantity ||
        0
      );
  
    const confirmedQuantity =
      Number(
        allocation
          .confirmedQuantity ||
        0
      );
  
    return {
      ...allocation,
  
      allocationQuantity,
  
      reservedQuantity,
  
      confirmedQuantity,
  
      availableQuantity:
        Math.max(
          0,
  
          allocationQuantity -
            reservedQuantity -
            confirmedQuantity
        ),
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Serialize Campaign
  |--------------------------------------------------------------------------
  */
  
  const serializeCampaign = (
    campaign
  ) => {
    const value =
      campaign?.get
        ? campaign.get({
            plain:
              true,
          })
        : campaign;
  
    if (
      !value
    ) {
      return value;
    }
  
    return {
      ...value,
  
      products:
        (
          value.products ||
          []
        ).map(
          (
            campaignProduct
          ) => ({
            ...campaignProduct,
  
            bundles:
              (
                campaignProduct
                  .bundles ||
                []
              ).map(
                (
                  bundle
                ) => ({
                  ...bundle,
  
                  allocations:
                    (
                      bundle
                        .allocations ||
                      []
                    ).map(
                      serializeAllocation
                    ),
                })
              ),
  
            allocations:
              (
                campaignProduct
                  .allocations ||
                []
              ).map(
                serializeAllocation
              ),
          })
        ),
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | List Campaigns
  |--------------------------------------------------------------------------
  */
  
  exports.listCampaigns =
    async ({
      companyId,
      page = 1,
      pageSize = 30,
      search,
      status,
      isActive,
      sortBy =
        "createdAt",
      sortDirection =
        "DESC",
    }) => {
      const safePage =
        Math.max(
          1,
          Number(
            page
          ) || 1
        );
  
      const safePageSize =
        Math.min(
          200,
          Math.max(
            1,
            Number(
              pageSize
            ) || 30
          )
        );
  
      const where = {
        companyId,
      };
  
      if (
        status
      ) {
        where.status =
          status;
      }
  
      if (
        typeof isActive ===
        "boolean"
      ) {
        where.isActive =
          isActive;
      }
  
      const normalizedSearch =
        String(
          search ||
          ""
        ).trim();
  
      if (
        normalizedSearch
      ) {
        where[
          Op.or
        ] = [
          {
            name: {
              [Op.iLike]:
                `%${normalizedSearch}%`,
            },
          },
  
          {
            code: {
              [Op.iLike]:
                `%${normalizedSearch}%`,
            },
          },
  
          {
            slug: {
              [Op.iLike]:
                `%${normalizedSearch}%`,
            },
          },
        ];
      }
  
      const allowedSortFields =
        new Set([
          "name",
          "code",
          "bookingStartAt",
          "bookingEndAt",
          "sortOrder",
          "status",
          "createdAt",
          "updatedAt",
        ]);
  
      const safeSortBy =
        allowedSortFields.has(
          sortBy
        )
          ? sortBy
          : "createdAt";
  
      const safeSortDirection =
        String(
          sortDirection
        ).toUpperCase() ===
        "ASC"
          ? "ASC"
          : "DESC";
  
      const {
        count,
        rows,
      } =
        await db.PreBookingCampaign
          .findAndCountAll({
            where,
  
            order: [
              [
                safeSortBy,
                safeSortDirection,
              ],
  
              [
                "name",
                "ASC",
              ],
            ],
  
            limit:
              safePageSize,
  
            offset:
              (
                safePage -
                1
              ) *
              safePageSize,
          });
  
      return {
        rows,
  
        pagination: {
          page:
            safePage,
  
          pageSize:
            safePageSize,
  
          totalItems:
            count,
  
          totalPages:
            Math.ceil(
              count /
              safePageSize
            ),
        },
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Campaign
  |--------------------------------------------------------------------------
  */
  
  exports.getCampaignById =
    async ({
      companyId,
      campaignId,
    }) => {
      const campaign =
        await db.PreBookingCampaign.findOne({
          where: {
            id:
              campaignId,

            companyId,
          },

          include:
            buildCampaignInclude(),
        });

      if (
        !campaign
      ) {
        throw new AppError(
          "Pre-booking campaign was not found.",
          404,
          "PRE_BOOKING_CAMPAIGN_NOT_FOUND"
        );
      }

      return serializeCampaign(
        campaign
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Create Campaign
  |--------------------------------------------------------------------------
  */
  
  exports.createCampaign =
    async ({
      companyId,
      userId,
      payload,
    }) => {
      validateDateRange({
        start:
          payload.bookingStartAt,
  
        end:
          payload.bookingEndAt,
  
        message:
          "Booking end date cannot be earlier than booking start date.",
  
        code:
          "INVALID_BOOKING_WINDOW",
      });
  
      const campaign =
        await db.PreBookingCampaign.create({
          companyId,
  
          code:
            payload.code,
  
          name:
            payload.name,
  
          slug:
            payload.slug,
  
          description:
            normalizeNullable(
              payload.description
            ),
  
          status:
            payload.status ||
            "DRAFT",
  
          bookingStartAt:
            payload.bookingStartAt ||
            null,
  
          bookingEndAt:
            payload.bookingEndAt ||
            null,
  
          /*
           * Pre-booking is always prepaid.
           */
          paymentPolicy:
            "FULL_PREPAID",
  
          allowCard:
            payload.allowCard !==
            false,
  
          allowTabby:
            payload.allowTabby ===
            true,
  
          allowTamara:
            payload.allowTamara ===
            true,
  
          allowCoupons:
            payload.allowCoupons ===
            true,
  
          allowGiftVouchers:
            payload.allowGiftVouchers ===
            true,
  
          checkoutSessionMinutes:
            Number(
              payload
                .checkoutSessionMinutes ||
              15
            ),
  
          isActive:
            payload.isActive !==
            false,
  
          sortOrder:
            Number(
              payload.sortOrder ||
              0
            ),
  
          createdBy:
            userId ||
            null,
  
          updatedBy:
            userId ||
            null,
        });
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaign.id,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Update Campaign
  |--------------------------------------------------------------------------
  */
  
  exports.updateCampaign =
    async ({
      companyId,
      campaignId,
      userId,
      payload,
    }) => {
      const campaign =
        await findCampaignOrThrow({
          companyId,
          campaignId,
        });
  
      const nextStartAt =
        payload.bookingStartAt !==
        undefined
          ? payload.bookingStartAt
          : campaign.bookingStartAt;
  
      const nextEndAt =
        payload.bookingEndAt !==
        undefined
          ? payload.bookingEndAt
          : campaign.bookingEndAt;
  
      validateDateRange({
        start:
          nextStartAt,
  
        end:
          nextEndAt,
  
        message:
          "Booking end date cannot be earlier than booking start date.",
  
        code:
          "INVALID_BOOKING_WINDOW",
      });
  
      [
        "name",
        "code",
        "slug",
        "status",
        "bookingStartAt",
        "bookingEndAt",
        "allowCard",
        "allowTabby",
        "allowTamara",
        "allowCoupons",
        "allowGiftVouchers",
        "checkoutSessionMinutes",
        "isActive",
        "sortOrder",
      ].forEach(
        (
          field
        ) => {
          if (
            payload[field] !==
            undefined
          ) {
            campaign[field] =
              payload[field];
          }
        }
      );
  
      if (
        payload.description !==
        undefined
      ) {
        campaign.description =
          normalizeNullable(
            payload.description
          );
      }
  
      /*
       * Never allow COD / unpaid
       * pre-booking through this field.
       */
      campaign.paymentPolicy =
        "FULL_PREPAID";
  
      campaign.updatedBy =
        userId ||
        null;
  
      await campaign.save();
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaign.id,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Change Campaign Status
  |--------------------------------------------------------------------------
  */
  
  exports.changeCampaignStatus =
    async ({
      companyId,
      campaignId,
      userId,
      status,
    }) => {
      const campaign =
        await findCampaignOrThrow({
          companyId,
          campaignId,
        });
  
      campaign.status =
        status;
  
      campaign.updatedBy =
        userId ||
        null;
  
      await campaign.save();
  
      return campaign;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Delete Campaign
  |--------------------------------------------------------------------------
  */
  
  exports.deleteCampaign =
    async ({
      companyId,
      campaignId,
    }) => {
      const campaign =
        await findCampaignOrThrow({
          companyId,
          campaignId,
        });
  
      const checkoutSessionCount =
        await db.PreBookingCheckoutSession.count({
          where: {
            companyId,
  
            campaignId:
              campaign.id,
          },
        });
  
      if (
        checkoutSessionCount >
        0
      ) {
        throw new AppError(
          "This pre-booking campaign already has checkout sessions and cannot be deleted. Archive it instead.",
          409,
          "PRE_BOOKING_CAMPAIGN_IN_USE"
        );
      }
  
      await campaign.destroy();
  
      return {
        id:
          campaignId,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Create Campaign Product
  |--------------------------------------------------------------------------
  */
  
  exports.createCampaignProduct =
    async ({
      companyId,
      campaignId,
      userId,
      payload,
    }) => {
      await findCampaignOrThrow({
        companyId,
        campaignId,
      });
  
      const product =
        await findProductOrThrow({
          companyId,
  
          productId:
            payload.productId,
        });
  
      const existing =
        await db.PreBookingCampaignProduct.findOne({
          where: {
            companyId,
  
            campaignId,
  
            productId:
              product.id,
          },
        });
  
      if (
        existing
      ) {
        throw new AppError(
          "This product is already included in the pre-booking campaign.",
          409,
          "PRE_BOOKING_PRODUCT_ALREADY_EXISTS"
        );
      }
  
      const minimumQuantity =
        Math.max(
          1,
          Number(
            payload.minimumQuantity ||
            1
          )
        );
  
      const maximumQuantityPerOrder =
        Math.max(
          1,
          Number(
            payload.maximumQuantityPerOrder ||
            1
          )
        );
  
      if (
        maximumQuantityPerOrder <
        minimumQuantity
      ) {
        throw new AppError(
          "Maximum quantity per order cannot be lower than minimum quantity.",
          400,
          "INVALID_PRE_BOOKING_QUANTITY_LIMIT"
        );
      }
  
      await db.PreBookingCampaignProduct.create({
        companyId,
  
        campaignId,
  
        productId:
          product.id,
  
        displayTitle:
          normalizeNullable(
            payload.displayTitle
          ),
  
        shortDescription:
          normalizeNullable(
            payload.shortDescription
          ),
  
        badgeText:
          normalizeNullable(
            payload.badgeText
          ),
  
        minimumQuantity,
  
        maximumQuantityPerOrder,
  
        priceOverride:
          payload.priceOverride ??
          null,
  
        currencyCode:
          normalizeCurrencyCode(
            payload.currencyCode
          ),
  
        isActive:
          payload.isActive !==
          false,
  
        sortOrder:
          Number(
            payload.sortOrder ||
            0
          ),
  
        createdBy:
          userId ||
          null,
  
        updatedBy:
          userId ||
          null,
      });
  
      return exports
        .getCampaignById({
          companyId,
          campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Update Campaign Product
  |--------------------------------------------------------------------------
  */
  
  exports.updateCampaignProduct =
    async ({
      companyId,
      campaignProductId,
      userId,
      payload,
    }) => {
      const record =
        await findCampaignProductOrThrow({
          companyId,
          campaignProductId,
        });
  
      const minimumQuantity =
        payload.minimumQuantity !==
        undefined
          ? Number(
              payload.minimumQuantity
            )
          : Number(
              record.minimumQuantity ||
              1
            );
  
      const maximumQuantityPerOrder =
        payload.maximumQuantityPerOrder !==
        undefined
          ? Number(
              payload.maximumQuantityPerOrder
            )
          : Number(
              record.maximumQuantityPerOrder ||
              1
            );
  
      if (
        maximumQuantityPerOrder <
        minimumQuantity
      ) {
        throw new AppError(
          "Maximum quantity per order cannot be lower than minimum quantity.",
          400,
          "INVALID_PRE_BOOKING_QUANTITY_LIMIT"
        );
      }
  
      if (
        payload.displayTitle !==
        undefined
      ) {
        record.displayTitle =
          normalizeNullable(
            payload.displayTitle
          );
      }
  
      if (
        payload.shortDescription !==
        undefined
      ) {
        record.shortDescription =
          normalizeNullable(
            payload.shortDescription
          );
      }
  
      if (
        payload.badgeText !==
        undefined
      ) {
        record.badgeText =
          normalizeNullable(
            payload.badgeText
          );
      }
  
      if (
        payload.minimumQuantity !==
        undefined
      ) {
        record.minimumQuantity =
          minimumQuantity;
      }
  
      if (
        payload.maximumQuantityPerOrder !==
        undefined
      ) {
        record.maximumQuantityPerOrder =
          maximumQuantityPerOrder;
      }
  
      if (
        payload.priceOverride !==
        undefined
      ) {
        record.priceOverride =
          payload.priceOverride;
      }
  
      if (
        payload.currencyCode !==
        undefined
      ) {
        record.currencyCode =
          normalizeCurrencyCode(
            payload.currencyCode
          );
      }
  
      if (
        payload.isActive !==
        undefined
      ) {
        record.isActive =
          Boolean(
            payload.isActive
          );
      }
  
      if (
        payload.sortOrder !==
        undefined
      ) {
        record.sortOrder =
          Number(
            payload.sortOrder
          );
      }
  
      record.updatedBy =
        userId ||
        null;
  
      await record.save();
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            record.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Delete Campaign Product
  |--------------------------------------------------------------------------
  */
  
  exports.deleteCampaignProduct =
    async ({
      companyId,
      campaignProductId,
    }) => {
      const record =
        await findCampaignProductOrThrow({
          companyId,
          campaignProductId,
        });
  
      const checkoutCount =
        await db.PreBookingCheckoutSession.count({
          where: {
            companyId,
  
            campaignProductId:
              record.id,
          },
        });
  
      if (
        checkoutCount >
        0
      ) {
        throw new AppError(
          "This pre-booking product has checkout activity and cannot be deleted.",
          409,
          "PRE_BOOKING_PRODUCT_IN_USE"
        );
      }
  
      const campaignId =
        record.campaignId;
  
      await record.destroy();
  
      return exports
        .getCampaignById({
          companyId,
          campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Create Bundle
  |--------------------------------------------------------------------------
  |
  | Bundles are optional.
  |--------------------------------------------------------------------------
  */
  
  exports.createBundle =
    async ({
      companyId,
      campaignProductId,
      userId,
      payload,
    }) => {
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
          campaignProductId,
        });
  
      if (
        payload.protectionSchemeId
      ) {
        await findProtectionSchemeOrThrow({
          companyId,
  
          protectionSchemeId:
            payload.protectionSchemeId,
        });
      }
  
      const existingCode =
        await db.PreBookingBundle.findOne({
          where: {
            companyId,
  
            campaignProductId,
  
            code:
              payload.code,
          },
        });
  
      if (
        existingCode
      ) {
        throw new AppError(
          "A bundle with this code already exists for this pre-booking product.",
          409,
          "PRE_BOOKING_BUNDLE_CODE_EXISTS"
        );
      }
  
      const bundle =
        await db.sequelize.transaction(
          async (
            transaction
          ) => {
            const created =
              await db.PreBookingBundle.create(
                {
                  companyId,
  
                  campaignProductId,
  
                  code:
                    payload.code,
  
                  name:
                    payload.name,
  
                  description:
                    normalizeNullable(
                      payload.description
                    ),
  
                  priceMode:
                    payload.priceMode ||
                    "INHERIT_PRODUCT",
  
                  priceAmount:
                    payload.priceAmount ??
                    null,
  
                  currencyCode:
                    normalizeCurrencyCode(
                      payload.currencyCode
                    ),
  
                  /*
                   * Protection is optional.
                   */
                  protectionSchemeId:
                    payload.protectionSchemeId ||
                    null,
  
                  protectionIncluded:
                    payload.protectionIncluded ===
                    true,
  
                  badgeText:
                    normalizeNullable(
                      payload.badgeText
                    ),
  
                  isDefault:
                    payload.isDefault ===
                    true,
  
                  isActive:
                    payload.isActive !==
                    false,
  
                  sortOrder:
                    Number(
                      payload.sortOrder ||
                      0
                    ),
  
                  createdBy:
                    userId ||
                    null,
  
                  updatedBy:
                    userId ||
                    null,
                },
                {
                  transaction,
                }
              );
  
            if (
              created.isDefault
            ) {
              await db.PreBookingBundle.update(
                {
                  isDefault:
                    false,
                },
                {
                  where: {
                    companyId,
  
                    campaignProductId,
  
                    id: {
                      [Op.ne]:
                        created.id,
                    },
                  },
  
                  transaction,
                }
              );
            }
  
            return created;
          }
        );
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Update Bundle
  |--------------------------------------------------------------------------
  */
  
  exports.updateBundle =
    async ({
      companyId,
      bundleId,
      userId,
      payload,
    }) => {
      const bundle =
        await findBundleOrThrow({
          companyId,
          bundleId,
        });
  
      if (
        payload.protectionSchemeId
      ) {
        await findProtectionSchemeOrThrow({
          companyId,
  
          protectionSchemeId:
            payload.protectionSchemeId,
        });
      }
  
      if (
        payload.code !==
          undefined &&
        payload.code !==
          bundle.code
      ) {
        const existingCode =
          await db.PreBookingBundle.findOne({
            where: {
              companyId,
  
              campaignProductId:
                bundle.campaignProductId,
  
              code:
                payload.code,
  
              id: {
                [Op.ne]:
                  bundle.id,
              },
            },
          });
  
        if (
          existingCode
        ) {
          throw new AppError(
            "A bundle with this code already exists for this pre-booking product.",
            409,
            "PRE_BOOKING_BUNDLE_CODE_EXISTS"
          );
        }
      }
  
      await db.sequelize.transaction(
        async (
          transaction
        ) => {
          const lockedBundle =
            await findBundleOrThrow({
              companyId,
              bundleId,
              transaction,
            });
  
          [
            "code",
            "name",
            "priceMode",
            "priceAmount",
            "protectionIncluded",
            "isDefault",
            "isActive",
            "sortOrder",
          ].forEach(
            (
              field
            ) => {
              if (
                payload[field] !==
                undefined
              ) {
                lockedBundle[field] =
                  payload[field];
              }
            }
          );
  
          if (
            payload.description !==
            undefined
          ) {
            lockedBundle.description =
              normalizeNullable(
                payload.description
              );
          }
  
          if (
            payload.badgeText !==
            undefined
          ) {
            lockedBundle.badgeText =
              normalizeNullable(
                payload.badgeText
              );
          }
  
          if (
            payload.currencyCode !==
            undefined
          ) {
            lockedBundle.currencyCode =
              normalizeCurrencyCode(
                payload.currencyCode
              );
          }
  
          /*
           * Null removes protection from
           * the bundle.
           */
          if (
            payload.protectionSchemeId !==
            undefined
          ) {
            lockedBundle.protectionSchemeId =
              payload.protectionSchemeId ||
              null;
  
            if (
              !payload.protectionSchemeId
            ) {
              lockedBundle.protectionIncluded =
                false;
            }
          }
  
          lockedBundle.updatedBy =
            userId ||
            null;
  
          await lockedBundle.save({
            transaction,
          });
  
          if (
            lockedBundle.isDefault
          ) {
            await db.PreBookingBundle.update(
              {
                isDefault:
                  false,
              },
              {
                where: {
                  companyId,
  
                  campaignProductId:
                    lockedBundle.campaignProductId,
  
                  id: {
                    [Op.ne]:
                      lockedBundle.id,
                  },
                },
  
                transaction,
              }
            );
          }
        }
      );
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            bundle.campaignProductId,
        });
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Delete Bundle
  |--------------------------------------------------------------------------
  */
  
  exports.deleteBundle =
    async ({
      companyId,
      bundleId,
    }) => {
      const bundle =
        await findBundleOrThrow({
          companyId,
          bundleId,
        });
  
      const checkoutCount =
        await db.PreBookingCheckoutSession.count({
          where: {
            companyId,
  
            bundleId:
              bundle.id,
          },
        });
  
      if (
        checkoutCount >
        0
      ) {
        throw new AppError(
          "This bundle has checkout activity and cannot be deleted.",
          409,
          "PRE_BOOKING_BUNDLE_IN_USE"
        );
      }
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            bundle.campaignProductId,
        });
  
      await bundle.destroy();
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Create Bundle Item
  |--------------------------------------------------------------------------
  */
  
  exports.createBundleItem =
    async ({
      companyId,
      bundleId,
      userId,
      payload,
    }) => {
      const bundle =
        await findBundleOrThrow({
          companyId,
          bundleId,
        });
  
      const itemType =
        payload.itemType ||
        (
          payload.productId
            ? "PRODUCT"
            : "TEXT"
        );
  
      if (
        itemType ===
          "PRODUCT" &&
        !payload.productId
      ) {
        throw new AppError(
          "productId is required for a PRODUCT bundle item.",
          400,
          "BUNDLE_PRODUCT_REQUIRED"
        );
      }
  
      if (
        payload.productId
      ) {
        await findProductOrThrow({
          companyId,
  
          productId:
            payload.productId,
        });
      }
  
      if (
        payload.productVariantId
      ) {
        if (
          !payload.productId
        ) {
          throw new AppError(
            "productId is required when productVariantId is supplied.",
            400,
            "BUNDLE_PRODUCT_REQUIRED"
          );
        }
  
        await findProductVariantOrThrow({
          companyId,
  
          productId:
            payload.productId,
  
          productVariantId:
            payload.productVariantId,
        });
      }
  
      await db.PreBookingBundleItem.create({
        companyId,
  
        bundleId,
  
        itemType,
  
        productId:
          itemType ===
          "PRODUCT"
            ? payload.productId
            : null,
  
        productVariantId:
          itemType ===
          "PRODUCT"
            ? (
                payload.productVariantId ||
                null
              )
            : null,
  
        label:
          String(
            payload.label
          ).trim(),
  
        description:
          normalizeNullable(
            payload.description
          ),
  
        quantity:
          Math.max(
            1,
            Number(
              payload.quantity ||
              1
            )
          ),
  
        isIncluded:
          payload.isIncluded !==
          false,
  
        sortOrder:
          Number(
            payload.sortOrder ||
            0
          ),
  
        isActive:
          payload.isActive !==
          false,
  
        createdBy:
          userId ||
          null,
  
        updatedBy:
          userId ||
          null,
      });
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            bundle.campaignProductId,
        });
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Update Bundle Item
  |--------------------------------------------------------------------------
  */
  
  exports.updateBundleItem =
    async ({
      companyId,
      bundleItemId,
      userId,
      payload,
    }) => {
      const item =
        await findBundleItemOrThrow({
          companyId,
          bundleItemId,
        });
  
      const nextItemType =
        payload.itemType !==
        undefined
          ? payload.itemType
          : item.itemType;
  
      const nextProductId =
        payload.productId !==
        undefined
          ? payload.productId
          : item.productId;
  
      const nextVariantId =
        payload.productVariantId !==
        undefined
          ? payload.productVariantId
          : item.productVariantId;
  
      if (
        nextItemType ===
          "PRODUCT" &&
        !nextProductId
      ) {
        throw new AppError(
          "productId is required for a PRODUCT bundle item.",
          400,
          "BUNDLE_PRODUCT_REQUIRED"
        );
      }
  
      if (
        nextItemType ===
        "PRODUCT"
      ) {
        await findProductOrThrow({
          companyId,
  
          productId:
            nextProductId,
        });
  
        if (
          nextVariantId
        ) {
          await findProductVariantOrThrow({
            companyId,
  
            productId:
              nextProductId,
  
            productVariantId:
              nextVariantId,
          });
        }
      }
  
      if (
        payload.label !==
        undefined
      ) {
        item.label =
          String(
            payload.label
          ).trim();
      }
  
      if (
        payload.description !==
        undefined
      ) {
        item.description =
          normalizeNullable(
            payload.description
          );
      }
  
      if (
        payload.quantity !==
        undefined
      ) {
        item.quantity =
          Math.max(
            1,
            Number(
              payload.quantity
            )
          );
      }
  
      if (
        payload.isIncluded !==
        undefined
      ) {
        item.isIncluded =
          Boolean(
            payload.isIncluded
          );
      }
  
      if (
        payload.sortOrder !==
        undefined
      ) {
        item.sortOrder =
          Number(
            payload.sortOrder
          );
      }
  
      if (
        payload.isActive !==
        undefined
      ) {
        item.isActive =
          Boolean(
            payload.isActive
          );
      }
  
      if (
        nextItemType ===
        "TEXT"
      ) {
        item.itemType =
          "TEXT";
  
        item.productId =
          null;
  
        item.productVariantId =
          null;
      } else {
        item.itemType =
          "PRODUCT";
  
        item.productId =
          nextProductId;
  
        item.productVariantId =
          nextVariantId ||
          null;
      }
  
      item.updatedBy =
        userId ||
        null;
  
      await item.save();
  
      const bundle =
        await findBundleOrThrow({
          companyId,
  
          bundleId:
            item.bundleId,
        });
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            bundle.campaignProductId,
        });
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Delete Bundle Item
  |--------------------------------------------------------------------------
  */
  
  exports.deleteBundleItem =
    async ({
      companyId,
      bundleItemId,
    }) => {
      const item =
        await findBundleItemOrThrow({
          companyId,
          bundleItemId,
        });
  
      const bundle =
        await findBundleOrThrow({
          companyId,
  
          bundleId:
            item.bundleId,
        });
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            bundle.campaignProductId,
        });
  
      await item.destroy();
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Create Product-Level Allocation
  |--------------------------------------------------------------------------
  |
  | This is the allocation flow when NO BUNDLE is required.
  |
  | Example:
  |
  | iPhone 18 Pro Max
  | allocationQuantity = 20
  | bundleId = null
  |--------------------------------------------------------------------------
  */
  
  exports.createProductAllocation =
    async ({
      companyId,
      campaignProductId,
      userId,
      payload,
    }) => {
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
          campaignProductId,
        });
  
      validateAvailabilityRanges(
        payload
      );
  
      if (
        payload.productVariantId
      ) {
        await findProductVariantOrThrow({
          companyId,
  
          productId:
            campaignProduct.productId,
  
          productVariantId:
            payload.productVariantId,
        });
      }
  
      await db.PreBookingAllocation.create({
        companyId,
  
        campaignProductId:
          campaignProduct.id,
  
        /*
         * Bundle is deliberately null.
         */
        bundleId:
          null,
  
        productVariantId:
          payload.productVariantId ||
          null,
  
        allocationQuantity:
          Number(
            payload.allocationQuantity ||
            0
          ),
  
        reservedQuantity:
          0,
  
        confirmedQuantity:
          0,
  
        availableFrom:
          payload.availableFrom ||
          null,
  
        availableUntil:
          payload.availableUntil ||
          null,
  
        expectedStockFrom:
          payload.expectedStockFrom ||
          null,
  
        expectedStockUntil:
          payload.expectedStockUntil ||
          null,
  
        note:
          normalizeNullable(
            payload.note
          ),
  
        isActive:
          payload.isActive !==
          false,
  
        sortOrder:
          Number(
            payload.sortOrder ||
            0
          ),
  
        createdBy:
          userId ||
          null,
  
        updatedBy:
          userId ||
          null,
      });
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Create Bundle Allocation
  |--------------------------------------------------------------------------
  |
  | Used only when a bundle exists.
  |
  | Example:
  |
  | Blue Pebble = 10
  | MyX         = 10
  |--------------------------------------------------------------------------
  */
  
  exports.createAllocation =
    async ({
      companyId,
      bundleId,
      userId,
      payload,
    }) => {
      const bundle =
        await findBundleOrThrow({
          companyId,
          bundleId,
        });
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            bundle.campaignProductId,
        });
  
      validateAvailabilityRanges(
        payload
      );
  
      if (
        payload.productVariantId
      ) {
        await findProductVariantOrThrow({
          companyId,
  
          productId:
            campaignProduct.productId,
  
          productVariantId:
            payload.productVariantId,
        });
      }
  
      await db.PreBookingAllocation.create({
        companyId,
  
        campaignProductId:
          campaignProduct.id,
  
        bundleId:
          bundle.id,
  
        productVariantId:
          payload.productVariantId ||
          null,
  
        allocationQuantity:
          Number(
            payload.allocationQuantity ||
            0
          ),
  
        reservedQuantity:
          0,
  
        confirmedQuantity:
          0,
  
        availableFrom:
          payload.availableFrom ||
          null,
  
        availableUntil:
          payload.availableUntil ||
          null,
  
        expectedStockFrom:
          payload.expectedStockFrom ||
          null,
  
        expectedStockUntil:
          payload.expectedStockUntil ||
          null,
  
        note:
          normalizeNullable(
            payload.note
          ),
  
        isActive:
          payload.isActive !==
          false,
  
        sortOrder:
          Number(
            payload.sortOrder ||
            0
          ),
  
        createdBy:
          userId ||
          null,
  
        updatedBy:
          userId ||
          null,
      });
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Update Allocation
  |--------------------------------------------------------------------------
  |
  | Works for both:
  |
  | bundleId = null     -> product-level allocation
  | bundleId = UUID     -> bundle allocation
  |--------------------------------------------------------------------------
  */
  
  exports.updateAllocation =
    async ({
      companyId,
      allocationId,
      userId,
      payload,
    }) => {
      const allocation =
        await findAllocationOrThrow({
          companyId,
          allocationId,
        });
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            allocation.campaignProductId,
        });
  
      const nextAllocationQuantity =
        payload.allocationQuantity !==
        undefined
          ? Number(
              payload.allocationQuantity
            )
          : Number(
              allocation.allocationQuantity ||
              0
            );
  
      const committedQuantity =
        Number(
          allocation.reservedQuantity ||
          0
        ) +
        Number(
          allocation.confirmedQuantity ||
          0
        );
  
      if (
        nextAllocationQuantity <
        committedQuantity
      ) {
        throw new AppError(
          "Allocation quantity cannot be lower than the already reserved and confirmed quantity.",
          409,
          "ALLOCATION_BELOW_COMMITTED_QUANTITY"
        );
      }
  
      const nextAvailableFrom =
        payload.availableFrom !==
        undefined
          ? payload.availableFrom
          : allocation.availableFrom;
  
      const nextAvailableUntil =
        payload.availableUntil !==
        undefined
          ? payload.availableUntil
          : allocation.availableUntil;
  
      const nextExpectedStockFrom =
        payload.expectedStockFrom !==
        undefined
          ? payload.expectedStockFrom
          : allocation.expectedStockFrom;
  
      const nextExpectedStockUntil =
        payload.expectedStockUntil !==
        undefined
          ? payload.expectedStockUntil
          : allocation.expectedStockUntil;
  
      validateAvailabilityRanges({
        availableFrom:
          nextAvailableFrom,
  
        availableUntil:
          nextAvailableUntil,
  
        expectedStockFrom:
          nextExpectedStockFrom,
  
        expectedStockUntil:
          nextExpectedStockUntil,
      });
  
      if (
        payload.productVariantId !==
        undefined &&
        payload.productVariantId !==
        null
      ) {
        await findProductVariantOrThrow({
          companyId,
  
          productId:
            campaignProduct.productId,
  
          productVariantId:
            payload.productVariantId,
        });
      }
  
      if (
        payload.productVariantId !==
        undefined
      ) {
        allocation.productVariantId =
          payload.productVariantId ||
          null;
      }
  
      if (
        payload.allocationQuantity !==
        undefined
      ) {
        allocation.allocationQuantity =
          nextAllocationQuantity;
      }
  
      if (
        payload.availableFrom !==
        undefined
      ) {
        allocation.availableFrom =
          payload.availableFrom ||
          null;
      }
  
      if (
        payload.availableUntil !==
        undefined
      ) {
        allocation.availableUntil =
          payload.availableUntil ||
          null;
      }
  
      if (
        payload.expectedStockFrom !==
        undefined
      ) {
        allocation.expectedStockFrom =
          payload.expectedStockFrom ||
          null;
      }
  
      if (
        payload.expectedStockUntil !==
        undefined
      ) {
        allocation.expectedStockUntil =
          payload.expectedStockUntil ||
          null;
      }
  
      if (
        payload.note !==
        undefined
      ) {
        allocation.note =
          normalizeNullable(
            payload.note
          );
      }
  
      if (
        payload.isActive !==
        undefined
      ) {
        allocation.isActive =
          Boolean(
            payload.isActive
          );
      }
  
      if (
        payload.sortOrder !==
        undefined
      ) {
        allocation.sortOrder =
          Number(
            payload.sortOrder
          );
      }
  
      allocation.updatedBy =
        userId ||
        null;
  
      await allocation.save();
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };
  
  /*
  |--------------------------------------------------------------------------
  | Delete Allocation
  |--------------------------------------------------------------------------
  */
  
  exports.deleteAllocation =
    async ({
      companyId,
      allocationId,
    }) => {
      const allocation =
        await findAllocationOrThrow({
          companyId,
          allocationId,
        });
  
      const reservedQuantity =
        Number(
          allocation.reservedQuantity ||
          0
        );
  
      const confirmedQuantity =
        Number(
          allocation.confirmedQuantity ||
          0
        );
  
      if (
        reservedQuantity >
          0 ||
        confirmedQuantity >
          0
      ) {
        throw new AppError(
          "Allocation cannot be deleted because quantity has already been reserved or confirmed.",
          409,
          "PRE_BOOKING_ALLOCATION_IN_USE"
        );
      }
  
      const checkoutCount =
        await db.PreBookingCheckoutSession.count({
          where: {
            companyId,
  
            allocationId:
              allocation.id,
          },
        });
  
      if (
        checkoutCount >
        0
      ) {
        throw new AppError(
          "Allocation has checkout activity and cannot be deleted.",
          409,
          "PRE_BOOKING_ALLOCATION_IN_USE"
        );
      }
  
      const campaignProduct =
        await findCampaignProductOrThrow({
          companyId,
  
          campaignProductId:
            allocation.campaignProductId,
        });
  
      await allocation.destroy();
  
      return exports
        .getCampaignById({
          companyId,
  
          campaignId:
            campaignProduct.campaignId,
        });
    };