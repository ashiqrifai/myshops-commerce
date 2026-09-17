const {
  Op,
} = require("sequelize");

const db =
  require("../../models");

const AppError =
  require("../../utils/AppError");

const toPlain = (
  value
) =>
  value &&
  typeof value.get ===
    "function"
    ? value.get({
        plain: true,
      })
    : value;

const numberOrNull = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
};

const round4 = (
  value
) =>
  Math.round(
    (Number(value) +
      Number.EPSILON) *
      10000
  ) / 10000;

const normalizeChannel = (
  value
) => {
  const channel =
    String(
      value ||
        "WEBSITE"
    )
      .trim()
      .toUpperCase();

  if (
    ![
      "WEBSITE",
      "KIOSK",
    ].includes(
      channel
    )
  ) {
    throw new AppError(
      "Channel must be WEBSITE or KIOSK.",
      400,
      "INVALID_STOREFRONT_CHANNEL"
    );
  }

  return channel;
};

const buildValidityWindow = (
  now
) => ({
  [Op.and]: [
    {
      [Op.or]: [
        {
          validFrom: null,
        },
        {
          validFrom: {
            [Op.lte]: now,
          },
        },
      ],
    },
    {
      [Op.or]: [
        {
          validUntil: null,
        },
        {
          validUntil: {
            [Op.gte]: now,
          },
        },
      ],
    },
  ],
});

const getCompany =
  async ({
    companyCode,
    transaction,
  }) => {
    const code =
      String(
        companyCode ||
          "MYSHOPS"
      )
        .trim()
        .toUpperCase();

    const company =
      await db.Company.findOne({
        where: {
          code,
          isActive: true,
        },
        transaction,
      });

    if (!company) {
      throw new AppError(
        "Storefront company was not found.",
        404,
        "STOREFRONT_COMPANY_NOT_FOUND"
      );
    }

    return company;
  };

const findStorefrontPriceList =
  async ({
    companyId,
    channel,
    now,
    transaction,
  }) => {
    const priceLists =
      await db.PriceList.findAll({
        where: {
          companyId,
          isActive: true,
          channelCode: {
            [Op.in]: [
              channel,
              "ALL",
            ],
          },
          ...buildValidityWindow(
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
        transaction,
      });

    if (!priceLists.length) {
      return null;
    }

    const channelSpecific =
      priceLists.find(
        (priceListModel) => {
          const priceList =
            toPlain(
              priceListModel
            );

          return (
            String(
              priceList.channelCode ||
                ""
            )
              .trim()
              .toUpperCase() ===
            channel
          );
        }
      );

    return (
      channelSpecific ||
      priceLists[0]
    );
  };

const ensureCampaignOpen = ({
  campaign,
  now,
}) => {
  const status =
    String(
      campaign.status ||
        ""
    )
      .trim()
      .toUpperCase();

  if (
    status !== "ACTIVE" ||
    campaign.isActive ===
      false
  ) {
    throw new AppError(
      "This pre-booking campaign is not accepting bookings.",
      409,
      "PRE_BOOKING_CAMPAIGN_NOT_ACTIVE"
    );
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
    throw new AppError(
      "Pre-booking has not opened yet.",
      409,
      "PRE_BOOKING_NOT_STARTED"
    );
  }

  if (
    endAt &&
    !Number.isNaN(
      endAt.getTime()
    ) &&
    endAt.getTime() <=
      now.getTime()
  ) {
    throw new AppError(
      "Pre-booking has closed.",
      409,
      "PRE_BOOKING_CLOSED"
    );
  }
};

const ensureAllocationWindow = ({
  allocation,
  now,
}) => {
  if (
    allocation.isActive !==
    true
  ) {
    throw new AppError(
      "The selected pre-booking allocation is not active.",
      409,
      "PRE_BOOKING_ALLOCATION_INACTIVE"
    );
  }

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

  if (
    availableFrom &&
    !Number.isNaN(
      availableFrom.getTime()
    ) &&
    availableFrom.getTime() >
      now.getTime()
  ) {
    throw new AppError(
      "The selected allocation is not available yet.",
      409,
      "PRE_BOOKING_ALLOCATION_NOT_STARTED"
    );
  }

  if (
    availableUntil &&
    !Number.isNaN(
      availableUntil.getTime()
    ) &&
    availableUntil.getTime() <=
      now.getTime()
  ) {
    throw new AppError(
      "The selected allocation is no longer available.",
      409,
      "PRE_BOOKING_ALLOCATION_CLOSED"
    );
  }
};

const resolveVariantPrice =
  async ({
    companyId,
    variantId,
    priceListId,
    now,
    transaction,
  }) => {
    if (!priceListId) {
      return null;
    }

    const price =
      await db.ProductVariantPrice.findOne({
        where: {
          companyId,
          productVariantId:
            variantId,
          priceListId,
          isActive: true,
          ...buildValidityWindow(
            now
          ),
        },
        order: [
          [
            "priority",
            "ASC",
          ],
          [
            "createdAt",
            "ASC",
          ],
        ],
        transaction,
      });

    return price
      ? toPlain(price)
      : null;
  };

const resolveProtection =
  async ({
    companyId,
    bundle,
    transaction,
  }) => {
    if (
      !bundle ||
      bundle.protectionIncluded !==
        true ||
      !bundle.protectionSchemeId
    ) {
      return {
        protectionScheme: null,
        protectionSchemeId:
          null,
        protectionAmount: 0,
      };
    }

    const protectionScheme =
      await db.ProtectionScheme.findOne({
        where: {
          id:
            bundle.protectionSchemeId,
          companyId,
          isActive: true,
        },
        transaction,
      });

    if (!protectionScheme) {
      throw new AppError(
        "The protection scheme configured for this bundle is unavailable.",
        409,
        "PRE_BOOKING_PROTECTION_UNAVAILABLE"
      );
    }

    return {
      protectionScheme:
        toPlain(
          protectionScheme
        ),
      protectionSchemeId:
        protectionScheme.id,
      protectionAmount: 0,
    };
  };

const calculatePricing = ({
  productUnitPrice,
  bundle,
  protectionAmount,
  quantity,
  taxPercent,
  isTaxInclusive,
}) => {
  const baseUnit =
    round4(
      productUnitPrice
    );

  let bundleAdjustment =
    0;

  let unitPriceBeforeTax =
    baseUnit;

  if (bundle) {
    const configuredBundleAmount =
      numberOrNull(
        bundle.priceAmount
      ) || 0;

    switch (
      String(
        bundle.priceMode ||
          "INHERIT_PRODUCT"
      )
        .trim()
        .toUpperCase()
    ) {
      case "FIXED_TOTAL":
        bundleAdjustment =
          round4(
            configuredBundleAmount -
              baseUnit
          );
        unitPriceBeforeTax =
          round4(
            configuredBundleAmount
          );
        break;

      case "ADD_ON":
        bundleAdjustment =
          round4(
            configuredBundleAmount
          );
        unitPriceBeforeTax =
          round4(
            baseUnit +
              bundleAdjustment
          );
        break;

      case "INHERIT_PRODUCT":
      default:
        bundleAdjustment = 0;
        unitPriceBeforeTax =
          baseUnit;
        break;
    }
  }

  const protectionUnit =
    round4(
      protectionAmount ||
        0
    );

  const unitBeforeTax =
    round4(
      unitPriceBeforeTax +
        protectionUnit
    );

  const quantityNumber =
    Number(quantity);

  const rate =
    Math.max(
      0,
      Number(
        taxPercent ||
          0
      )
    ) / 100;

  let totalAmount =
    round4(
      unitBeforeTax *
        quantityNumber
    );

  let taxAmount = 0;

  if (rate > 0) {
    if (isTaxInclusive) {
      const netAmount =
        totalAmount /
        (1 + rate);

      taxAmount =
        round4(
          totalAmount -
            netAmount
        );
    } else {
      taxAmount =
        round4(
          totalAmount *
            rate
        );

      totalAmount =
        round4(
          totalAmount +
            taxAmount
        );
    }
  }

  return {
    productUnitPrice:
      baseUnit,
    bundleAmount:
      bundleAdjustment,
    protectionAmount:
      protectionUnit,
    taxAmount,
    totalAmount,
    unitPayableAmount:
      round4(
        totalAmount /
          quantityNumber
      ),
  };
};

const buildPublicSession = ({
  session,
  campaign,
}) => ({
  publicToken:
    session.publicToken,
  status:
    session.status,

  campaign: {
    id:
      campaign.id,
    code:
      campaign.code,
    name:
      campaign.name,
    slug:
      campaign.slug,
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
  },

  selection: {
    campaignProductId:
      session.campaignProductId,
    productId:
      session.productId,
    productVariantId:
      session.productVariantId,
    bundleId:
      session.bundleId ||
      null,
    allocationId:
      session.allocationId,
    protectionSchemeId:
      session.protectionSchemeId ||
      null,
    quantity:
      Number(
        session.quantity
      ),
    productName:
      session.productName,
    variantName:
      session.variantName,
    sku:
      session.sku,
    bundleName:
      session.bundleName,
  },

  pricing: {
    productUnitPrice:
      Number(
        session.productUnitPrice
      ),
    bundleAmount:
      Number(
        session.bundleAmount
      ),
    protectionAmount:
      Number(
        session.protectionAmount
      ),
    taxAmount:
      Number(
        session.taxAmount
      ),
    totalAmount:
      Number(
        session.totalAmount
      ),
    currencyCode:
      session.currencyCode,
  },

  expectedStock: {
    from:
      session.expectedStockFrom ||
      null,
    until:
      session.expectedStockUntil ||
      null,
  },

  reservedAt:
    session.reservedAt ||
    null,
  expiresAt:
    session.expiresAt,
  createdAt:
    session.createdAt,
});

const releaseExpiredSession = async ({companyId,publicToken}) =>
  db.sequelize.transaction(async transaction => {
    const session=await db.PreBookingCheckoutSession.findOne({where:{companyId,publicToken},transaction,lock:transaction.LOCK.UPDATE});
    if(!session)return null;

    if(session.orderId){
      const order=await db.Order.findOne({where:{id:session.orderId,companyId},transaction,lock:transaction.LOCK.UPDATE});
      if(order&&["PAID","AUTHORIZED"].includes(String(order.paymentStatus||"").toUpperCase())){
        if(String(session.status)!=="COMPLETED"){
          const allocation=await db.PreBookingAllocation.findOne({where:{id:session.allocationId,companyId},transaction,lock:transaction.LOCK.UPDATE});
          if(!allocation)throw new AppError("Pre-booking allocation was not found.",409,"PRE_BOOKING_ALLOCATION_NOT_FOUND");
          const qty=Number(session.quantity||0),reserved=Number(allocation.reservedQuantity||0);
          if(reserved<qty)throw new AppError("Reserved pre-booking quantity mismatch.",409,"PRE_BOOKING_RESERVED_QUANTITY_MISMATCH");
          allocation.reservedQuantity=reserved-qty;
          allocation.confirmedQuantity=Number(allocation.confirmedQuantity||0)+qty;
          await allocation.save({transaction});
          session.status="COMPLETED";
          await session.save({transaction});
        }
        return session;
      }
    }

    const expired=["OPEN","RESERVED","PAYMENT_PENDING"].includes(String(session.status))&&new Date(session.expiresAt).getTime()<=Date.now();
    if(!expired)return session;
    const allocation=await db.PreBookingAllocation.findOne({where:{id:session.allocationId,companyId},transaction,lock:transaction.LOCK.UPDATE});
    if(allocation){allocation.reservedQuantity=Math.max(0,Number(allocation.reservedQuantity||0)-Number(session.quantity||0));await allocation.save({transaction});}
    session.status="EXPIRED";await session.save({transaction});return session;
  });


const createCheckoutSession =
  async ({
    companyCode,
    channel = "WEBSITE",
    campaignProductId,
    productVariantId,
    bundleId = null,
    allocationId,
    quantity,
  }) => {
    const normalizedChannel =
      normalizeChannel(
        channel
      );

    const requestedQuantity =
      Number(quantity);

    if (
      !Number.isInteger(
        requestedQuantity
      ) ||
      requestedQuantity < 1
    ) {
      throw new AppError(
        "Quantity must be a positive whole number.",
        400,
        "PRE_BOOKING_INVALID_QUANTITY"
      );
    }

    return db.sequelize.transaction(
      async (
        transaction
      ) => {
        const now =
          new Date();

        const company =
          await getCompany({
            companyCode,
            transaction,
          });

        const campaignProduct =
          await db.PreBookingCampaignProduct.findOne({
            where: {
              id:
                campaignProductId,
              companyId:
                company.id,
              isActive: true,
            },
            transaction,
          });

        if (!campaignProduct) {
          throw new AppError(
            "Pre-booking product was not found.",
            404,
            "PRE_BOOKING_CAMPAIGN_PRODUCT_NOT_FOUND"
          );
        }

        const campaign =
          await db.PreBookingCampaign.findOne({
            where: {
              id:
                campaignProduct.campaignId,
              companyId:
                company.id,
              isActive: true,
            },
            transaction,
          });

        if (!campaign) {
          throw new AppError(
            "Pre-booking campaign was not found.",
            404,
            "PRE_BOOKING_CAMPAIGN_NOT_FOUND"
          );
        }

        ensureCampaignOpen({
          campaign,
          now,
        });

        const minimumQuantity =
          Math.max(
            1,
            Number(
              campaignProduct.minimumQuantity ||
                1
            )
          );

        const maximumQuantity =
          Math.max(
            minimumQuantity,
            Number(
              campaignProduct.maximumQuantityPerOrder ||
                minimumQuantity
            )
          );

        if (
          requestedQuantity <
            minimumQuantity ||
          requestedQuantity >
            maximumQuantity
        ) {
          throw new AppError(
            `Quantity must be between ${minimumQuantity} and ${maximumQuantity}.`,
            400,
            "PRE_BOOKING_QUANTITY_OUT_OF_RANGE"
          );
        }

        const product =
          await db.Product.findOne({
            where: {
              id:
                campaignProduct.productId,
              companyId:
                company.id,
              status: "ACTIVE",
              isSearchable: true,
            },
            transaction,
          });

        if (!product) {
          throw new AppError(
            "The selected product is unavailable.",
            409,
            "PRE_BOOKING_PRODUCT_UNAVAILABLE"
          );
        }

        const channelRow =
          await db.ProductChannel.findOne({
            where: {
              companyId:
                company.id,
              productId:
                product.id,
              channelCode:
                normalizedChannel,
              isVisible: true,
              publishStatus:
                "PUBLISHED",
            },
            transaction,
          });

        if (!channelRow) {
          throw new AppError(
            "The selected product is not published for this channel.",
            409,
            "PRE_BOOKING_PRODUCT_NOT_PUBLISHED"
          );
        }

        const variant =
          await db.ProductVariant.findOne({
            where: {
              id:
                productVariantId,
              companyId:
                company.id,
              productId:
                product.id,
              status: "ACTIVE",
            },
            transaction,
          });

        if (!variant) {
          throw new AppError(
            "The selected product variant is unavailable.",
            409,
            "PRE_BOOKING_VARIANT_UNAVAILABLE"
          );
        }

        let bundle = null;

        if (bundleId) {
          bundle =
            await db.PreBookingBundle.findOne({
              where: {
                id: bundleId,
                companyId:
                  company.id,
                campaignProductId:
                  campaignProduct.id,
                isActive: true,
              },
              transaction,
            });

          if (!bundle) {
            throw new AppError(
              "The selected pre-booking bundle is unavailable.",
              409,
              "PRE_BOOKING_BUNDLE_UNAVAILABLE"
            );
          }
        }

        const allocation =
          await db.PreBookingAllocation.findOne({
            where: {
              id:
                allocationId,
              companyId:
                company.id,
              campaignProductId:
                campaignProduct.id,
            },
            transaction,
            lock:
              transaction.LOCK.UPDATE,
          });

        if (!allocation) {
          throw new AppError(
            "The selected pre-booking allocation was not found.",
            409,
            "PRE_BOOKING_ALLOCATION_NOT_FOUND"
          );
        }

        ensureAllocationWindow({
          allocation,
          now,
        });

        const allocationBundleId =
          allocation.bundleId
            ? String(
                allocation.bundleId
              )
            : null;

        const requestedBundleId =
          bundle
            ? String(bundle.id)
            : null;

        if (
          allocationBundleId !==
          requestedBundleId
        ) {
          throw new AppError(
            "The selected allocation does not belong to the selected bundle.",
            409,
            "PRE_BOOKING_ALLOCATION_BUNDLE_MISMATCH"
          );
        }

        if (
          allocation.productVariantId &&
          String(
            allocation.productVariantId
          ) !==
            String(variant.id)
        ) {
          throw new AppError(
            "The selected allocation does not belong to the selected product variant.",
            409,
            "PRE_BOOKING_ALLOCATION_VARIANT_MISMATCH"
          );
        }

        const allocated =
          Number(
            allocation.allocationQuantity ||
              0
          );

        const reserved =
          Number(
            allocation.reservedQuantity ||
              0
          );

        const confirmed =
          Number(
            allocation.confirmedQuantity ||
              0
          );

        const availableQuantity =
          Math.max(
            0,
            allocated -
              reserved -
              confirmed
          );

        if (
          availableQuantity <
          requestedQuantity
        ) {
          throw new AppError(
            availableQuantity > 0
              ? `Only ${availableQuantity} unit(s) remain available for pre-booking.`
              : "This pre-booking allocation is sold out.",
            409,
            "PRE_BOOKING_INSUFFICIENT_ALLOCATION"
          );
        }

        const priceList =
          await findStorefrontPriceList({
            companyId:
              company.id,
            channel:
              normalizedChannel,
            now,
            transaction,
          });

        const campaignPriceOverride =
          numberOrNull(
            campaignProduct.priceOverride
          );

        let productUnitPrice =
          campaignPriceOverride;

        let priceRow = null;

        if (
          productUnitPrice ===
          null
        ) {
          if (!priceList) {
            throw new AppError(
              "No active storefront price list is available.",
              409,
              "PRE_BOOKING_PRICE_LIST_UNAVAILABLE"
            );
          }

          priceRow =
            await resolveVariantPrice({
              companyId:
                company.id,
              variantId:
                variant.id,
              priceListId:
                priceList.id,
              now,
              transaction,
            });

          productUnitPrice =
            numberOrNull(
              priceRow?.sellingPrice
            );

          if (
            productUnitPrice ===
            null
          ) {
            throw new AppError(
              "The selected variant does not have an active storefront price.",
              409,
              "PRE_BOOKING_PRICE_UNAVAILABLE"
            );
          }
        }

        if (
          productUnitPrice < 0
        ) {
          throw new AppError(
            "The selected product has an invalid pre-booking price.",
            409,
            "PRE_BOOKING_INVALID_PRICE"
          );
        }

        const protection =
          await resolveProtection({
            companyId:
              company.id,
            bundle,
            transaction,
          });

        const isTaxInclusive =
          priceList
            ? priceList.isTaxInclusive !==
              false
            : true;

        const pricing =
          calculatePricing({
            productUnitPrice,
            bundle:
              bundle
                ? toPlain(bundle)
                : null,
            protectionAmount:
              protection.protectionAmount,
            quantity:
              requestedQuantity,
            taxPercent:
              product.taxPercent,
            isTaxInclusive,
          });

        const currencyCode =
          String(
            campaignProduct.currencyCode ||
              bundle?.currencyCode ||
              priceList?.currencyCode ||
              "AED"
          )
            .trim()
            .toUpperCase();

        allocation.reservedQuantity =
          reserved +
          requestedQuantity;

        await allocation.save({
          transaction,
        });

        const checkoutMinutes =
          Math.max(
            5,
            Math.min(
              120,
              Number(
                campaign.checkoutSessionMinutes ||
                  15
              )
            )
          );

        const expiresAt =
          new Date(
            now.getTime() +
              checkoutMinutes *
                60 *
                1000
          );

        const session =
          await db.PreBookingCheckoutSession.create(
            {
              companyId:
                company.id,
              campaignId:
                campaign.id,
              campaignProductId:
                campaignProduct.id,
              productId:
                product.id,
              productVariantId:
                variant.id,
              bundleId:
                bundle?.id ||
                null,
              allocationId:
                allocation.id,
              protectionSchemeId:
                protection.protectionSchemeId,
              customerId: null,
              orderId: null,
              quantity:
                requestedQuantity,
              productName:
                campaignProduct.displayTitle ||
                channelRow.channelTitle ||
                product.name,
              variantName:
                variant.name,
              sku:
                variant.sku,
              bundleName:
                bundle?.name ||
                "Product Only",
              productUnitPrice:
                pricing.productUnitPrice,
              bundleAmount:
                pricing.bundleAmount,
              protectionAmount:
                pricing.protectionAmount,
              taxAmount:
                pricing.taxAmount,
              totalAmount:
                pricing.totalAmount,
              currencyCode,
              expectedStockFrom:
                allocation.expectedStockFrom ||
                null,
              expectedStockUntil:
                allocation.expectedStockUntil ||
                null,
              status: "RESERVED",
              reservedAt: now,
              expiresAt,
              metadata: {
                channel:
                  normalizedChannel,
                campaignPriceOverride:
                  campaignPriceOverride !==
                  null,
                priceList:
                  priceList
                    ? {
                        id:
                          priceList.id,
                        code:
                          priceList.code,
                        name:
                          priceList.name,
                        currencyCode:
                          priceList.currencyCode,
                        isTaxInclusive:
                          priceList.isTaxInclusive,
                      }
                    : null,
                variantPriceId:
                  priceRow?.id ||
                  null,
                bundle:
                  bundle
                    ? {
                        id:
                          bundle.id,
                        code:
                          bundle.code,
                        priceMode:
                          bundle.priceMode,
                        priceAmount:
                          numberOrNull(
                            bundle.priceAmount
                          ),
                      }
                    : null,
                taxPercent:
                  numberOrNull(
                    product.taxPercent
                  ) || 0,
                isTaxInclusive,
                unitPayableAmount:
                  pricing.unitPayableAmount,
              },
            },
            {
              transaction,
            }
          );

        return {
          session:
            buildPublicSession({
              session:
                toPlain(session),
              campaign:
                toPlain(campaign),
            }),
          allocation: {
            id:
              allocation.id,
            availableQuantity:
              Math.max(
                0,
                availableQuantity -
                  requestedQuantity
              ),
          },
        };
      }
    );
  };

const getCheckoutSession =
  async ({
    companyCode,
    publicToken,
  }) => {
    const company =
      await getCompany({
        companyCode,
      });

    let session =
      await db.PreBookingCheckoutSession.findOne({
        where: {
          companyId:
            company.id,
          publicToken,
        },
      });

    if (!session) {
      throw new AppError(
        "Pre-booking checkout session was not found.",
        404,
        "PRE_BOOKING_CHECKOUT_SESSION_NOT_FOUND"
      );
    }

    const now =
      new Date();

    if (
      [
        "OPEN",
        "RESERVED",
        "PAYMENT_PENDING",
      ].includes(
        String(
          session.status
        )
      ) &&
      new Date(
        session.expiresAt
      ).getTime() <=
        now.getTime()
    ) {
      session =
        await releaseExpiredSession({
          companyId:
            company.id,
          publicToken,
        });
    }

    const campaign =
      await db.PreBookingCampaign.findOne({
        where: {
          id:
            session.campaignId,
          companyId:
            company.id,
        },
      });

    if (!campaign) {
      throw new AppError(
        "Pre-booking campaign was not found.",
        404,
        "PRE_BOOKING_CAMPAIGN_NOT_FOUND"
      );
    }

    return buildPublicSession({
      session:
        toPlain(session),
      campaign:
        toPlain(campaign),
    });
  };

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
  releaseExpiredSession,
};
