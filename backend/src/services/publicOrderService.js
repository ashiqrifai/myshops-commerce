const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../models"
  );

const {
  validateCoupon,
} = require(
  "./couponService"
);

const {
  resolveProtectionScheme,
} = require(
  "./protectionResolver.service"
);

const pricingFacadeService =
  require(
    "../modules/pricing/pricingFacade.service"
  );

const orderShipmentReservationService =
  require(
    "./orderShipmentReservation.service"
  );

const {
  resolveBundleSelections,
} = require(
  "./bundleCheckoutResolver.service"
);

const WEBSITE_CHANNEL =
  "WEBSITE";

const DELIVERY_AMOUNTS = {
  STANDARD: 0,
  EXPRESS: 0,
  PICKUP: 0,
};

const roundMoney = (
  value
) =>
  Number(
    Number(
      value ||
      0
    ).toFixed(
      4
    )
  );

const normalizeEmail = (
  value
) =>
  String(
    value ||
    ""
  )
    .trim()
    .toLowerCase();

const normalizePhone = (
  value
) =>
  String(
    value ||
    ""
  ).trim();

const normalizeDeliveryCityCode =
  (
    value
  ) => {
    const normalized =
      String(
        value ||
        ""
      )
        .trim()
        .toUpperCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    if (
      normalized ===
      "ABUDHABI"
    ) {
      return "ABU_DHABI";
    }

    return normalized;
  };

const getRequestedProtection = (
  item
) => {
  const protection =
    item
      ?.protection ||
    item
      ?.extendedWarranty ||
    item
      ?.warranty ||
    null;

  if (
    !protection
  ) {
    return null;
  }

  return {
    schemeId:
      String(
        protection
          ?.schemeId ||
          ""
      ).trim(),
  };
};

const makeOrderNumber =
  () => {
    const stamp =
      new Date()
        .toISOString()
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          14
        );

    const random =
      Math.floor(
        1000 +
          Math.random() *
            9000
      );

    return `WEB-${stamp}-${random}`;
  };

const getActiveCompany =
  async (
    companyCode,
    transaction
  ) => {
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
          isActive:
            true,
        },

        transaction,
      });

    if (
      !company
    ) {
      const error =
        new Error(
          `Active company ${code} was not found.`
        );

      error.statusCode =
        404;

      error.code =
        "COMPANY_NOT_FOUND";

      throw error;
    }

    return company;
  };

const getPublishedVariant =
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

          productId,

          companyId,

          status:
            "ACTIVE",
        },

        include: [
          {
            model:
              db.Product,

            as:
              "product",

            required:
              true,

            where: {
              id:
                productId,

              companyId,

              status:
                "ACTIVE",
            },

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
                    WEBSITE_CHANNEL,

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

          {
            model:
              db.ProductVariantChannel,

            as:
              "channels",

            required:
              true,

            where: {
              companyId,

              channelCode:
                WEBSITE_CHANNEL,

              isVisible:
                true,
            },

            attributes: [
              "id",
            ],
          },
        ],

        transaction,
      });

    if (
      !variant
    ) {
      const error =
        new Error(
          "One or more products in your cart are no longer available on the website."
        );

      error.statusCode =
        409;

      error.code =
        "PRODUCT_NOT_AVAILABLE";

      throw error;
    }

    return variant;
  };

const getEligiblePriceLists =
  async ({
    companyId,
    currencyCode,
    transaction,
  }) => {
    const now =
      new Date();

    return db.PriceList.findAll({
      where: {
        companyId,

        currencyCode,

        isActive:
          true,

        channelCode: {
          [Op.in]: [
            WEBSITE_CHANNEL,
            "ALL",
          ],
        },

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
      ],

      transaction,
    });
  };

const resolveVariantPrice =
  async ({
    companyId,
    productVariantId,
    quantity,
    currencyCode,
    transaction,
  }) => {
    const priceLists =
      await getEligiblePriceLists({
        companyId,
        currencyCode,
        transaction,
      });

    if (
      !priceLists.length
    ) {
      const error =
        new Error(
          `No active ${currencyCode} website price list is configured.`
        );

      error.statusCode =
        409;

      error.code =
        "PRICE_LIST_NOT_FOUND";

      throw error;
    }

    const now =
      new Date();

    for (
      const priceList of
      priceLists
    ) {
      const price =
        await db.ProductVariantPrice.findOne({
          where: {
            companyId,

            priceListId:
              priceList.id,

            productVariantId,

            isActive:
              true,

            minimumQuantity: {
              [Op.lte]:
                quantity,
            },

            [Op.and]: [
              {
                [Op.or]: [
                  {
                    maximumQuantity:
                      null,
                  },

                  {
                    maximumQuantity: {
                      [Op.gte]:
                        quantity,
                    },
                  },
                ],
              },

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
          },

          order: [
            [
              "priority",
              "ASC",
            ],

            [
              "minimumQuantity",
              "DESC",
            ],
          ],

          transaction,
        });

      if (
        price
      ) {
        return {
          priceList,
          price,
        };
      }
    }

    const error =
      new Error(
        "A current website price could not be resolved for one or more products."
      );

    error.statusCode =
      409;

    error.code =
      "VARIANT_PRICE_NOT_FOUND";

    throw error;
  };

const calculateLine =
  ({
    unitPrice,
    quantity,
    taxPercent,
    isTaxInclusive,
  }) => {
    const gross =
      roundMoney(
        unitPrice *
          quantity
      );

    const rate =
      Number(
        taxPercent ||
          0
      ) /
      100;

    if (
      rate <=
      0
    ) {
      return {
        lineSubtotal:
          gross,

        taxAmount:
          0,

        lineTotal:
          gross,
      };
    }

    if (
      isTaxInclusive
    ) {
      const net =
        roundMoney(
          gross /
            (
              1 +
              rate
            )
        );

      const tax =
        roundMoney(
          gross -
            net
        );

      return {
        lineSubtotal:
          net,

        taxAmount:
          tax,

        lineTotal:
          gross,
      };
    }

    const tax =
      roundMoney(
        gross *
          rate
      );

    return {
      lineSubtotal:
        gross,

      taxAmount:
        tax,

      lineTotal:
        roundMoney(
          gross +
            tax
        ),
    };
  };

const validatePayload =
  (
    payload
  ) => {
    const customer =
      payload
        ?.customer ||
      {};

    const items =
      Array.isArray(
        payload
          ?.items
      )
        ? payload.items
        : [];

    const fulfilmentLines =
      Array.isArray(
        payload
          ?.fulfilmentLines
      )
        ? payload.fulfilmentLines
        : [];

    const errors =
      [];

    if (
      !String(
        customer
          .firstName ||
          ""
      ).trim()
    ) {
      errors.push(
        "First name is required."
      );
    }

    const email =
      normalizeEmail(
        customer
          .email
      );

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      errors.push(
        "A valid email address is required."
      );
    }

    const phone =
      normalizePhone(
        customer
          .phone
      );

    if (
      phone
        .replace(
          /\D/g,
          ""
        )
        .length <
      9
    ) {
      errors.push(
        "A valid mobile number is required."
      );
    }

    if (
      !items.length
    ) {
      errors.push(
        "Your cart is empty."
      );
    }

    for (
      const item of
      items
    ) {
      if (
        !item
          ?.productId ||
        !item
          ?.productVariantId
      ) {
        errors.push(
          "Every cart line must include productId and productVariantId."
        );

        continue;
      }

      const quantity =
        Number(
          item
            .quantity
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <=
          0
      ) {
        errors.push(
          "Every cart line must have a quantity greater than zero."
        );
      }

      const protection =
        getRequestedProtection(
          item
        );

      if (
        protection &&
        !protection
          .schemeId
      ) {
        errors.push(
          "Every selected protection plan must include schemeId."
        );
      }

      if (
        protection
          ?.schemeId &&
        protection
          .schemeId
          .length >
          100
      ) {
        errors.push(
          "Protection scheme ID is invalid."
        );
      }

      if (
        item.bundleSelections !==
          undefined &&
        !Array.isArray(
          item.bundleSelections
        )
      ) {
        errors.push(
          "bundleSelections must be an array."
        );
      }

      if (
        Array.isArray(
          item.bundleSelections
        )
      ) {
        for (
          const selection of
          item.bundleSelections
        ) {
          if (
            !String(
              selection
                ?.bundlePromotionId ||
              ""
            ).trim()
          ) {
            errors.push(
              "Every bundle selection must include bundlePromotionId."
            );
          }

          const selectionQuantity =
            Number(
              selection
                ?.selectionQuantity ??
              1
            );

          if (
            !Number.isInteger(
              selectionQuantity
            ) ||
            selectionQuantity <
              1
          ) {
            errors.push(
              "Every bundle selection must have a valid selectionQuantity."
            );
          }
        }
      }
    }

    for (const line of fulfilmentLines) {
      const method =
        String(
          line?.fulfilmentMethod ||
          "DELIVERY"
        ).trim().toUpperCase();

      if (
        ![
          "DELIVERY",
          "STANDARD",
          "EXPRESS",
          "PICKUP",
        ].includes(method)
      ) {
        errors.push(
          "Invalid per-item fulfilment method."
        );
      }

      if (
        method === "PICKUP" &&
        !String(
          line?.pickupLocationId ||
          ""
        ).trim()
      ) {
        errors.push(
          "Pickup location is required for every store-pickup item."
        );
      }
    }

    const deliveryMethod =
      String(
        payload
          ?.deliveryMethod ||
          "STANDARD"
      ).toUpperCase();

    if (
      !Object
        .prototype
        .hasOwnProperty
        .call(
          DELIVERY_AMOUNTS,
          deliveryMethod
        )
    ) {
      errors.push(
        "Invalid delivery method."
      );
    }

    const paymentMethod =
      String(
        payload
          ?.paymentMethod ||
          "COD"
      ).toUpperCase();

      if (
        ![
          "COD",
          "CARD",
          "TABBY",
          "TAMARA",
        ].includes(
          paymentMethod
        )
      ) {
        errors.push(
          "Invalid payment method."
        );
      }

    if (
      payload
        ?.couponCode &&
      String(
        payload
          .couponCode
      )
        .trim()
        .length >
        100
    ) {
      errors.push(
        "Coupon code is invalid."
      );
    }

    const hasDeliveryFulfilment =
      fulfilmentLines.length > 0
        ? fulfilmentLines.some(
            line =>
              String(
                line?.fulfilmentMethod ||
                "DELIVERY"
              ).trim().toUpperCase() !==
              "PICKUP"
          )
        : deliveryMethod !==
          "PICKUP";

    if (
      hasDeliveryFulfilment
    ) {
      const address =
        payload
          ?.shippingAddress ||
        {};

      if (
        !String(
          address
            .addressLine1 ||
            ""
        ).trim()
      ) {
        errors.push(
          "Delivery address is required."
        );
      }

      if (
        !String(
          address
            .emirate ||
            ""
        ).trim()
      ) {
        errors.push(
          "Emirate is required."
        );
      }

      if (
        !String(
          address
            .city ||
            ""
        ).trim()
      ) {
        errors.push(
          "City is required."
        );
      }

      if (
        !String(
          address
            .area ||
            ""
        ).trim()
      ) {
        errors.push(
          "Area is required."
        );
      }
    }

    if (
      errors.length
    ) {
      const error =
        new Error(
          errors.join(
            " "
          )
        );

      error.statusCode =
        400;

      error.code =
        "VALIDATION_ERROR";

      error.details =
        errors;

      throw error;
    }
  };

const createPublicOrder =
  async ({
    payload,
    authenticatedCustomerId =
      null,
  }) => {
    validatePayload(
      payload
    );

    return db.sequelize.transaction(
      async (
        transaction
      ) => {
        const company =
          await getActiveCompany(
            payload
              .companyCode,
            transaction
          );

        const customer =
          payload
            .customer;

        const currencyCode =
          String(
            payload
              .currencyCode ||
              "AED"
          )
            .trim()
            .toUpperCase();

        if (
          currencyCode !==
          "AED"
        ) {
          const error =
            new Error(
              "Only AED checkout is currently supported."
            );

          error.statusCode =
            400;

          error.code =
            "UNSUPPORTED_CURRENCY";

          throw error;
        }

        let linkedCustomer =
          null;

        if (
          authenticatedCustomerId
        ) {
          linkedCustomer =
            await db.Customer.findOne({
              where: {
                id:
                  authenticatedCustomerId,

                companyId:
                  company
                    .id,

                isActive:
                  true,

                status:
                  "ACTIVE",
              },

              transaction,
            });

          if (
            !linkedCustomer
          ) {
            const error =
              new Error(
                "Authenticated customer account was not found."
              );

            error.statusCode =
              401;

            error.code =
              "CUSTOMER_NOT_FOUND";

            throw error;
          }
        }

        const orderLines =
          [];

        const fulfilmentLines =
          Array.isArray(
            payload?.fulfilmentLines
          )
            ? payload.fulfilmentLines
            : [];

        let subtotal =
          0;

        let taxAmount =
          0;

        let merchandiseTotal =
          0;

        for (
          const requestedItem of
          payload
            .items
        ) {
          const quantity =
            Number(
              requestedItem
                .quantity
            );

          const variant =
            await getPublishedVariant({
              companyId:
                company
                  .id,

              productId:
                requestedItem
                  .productId,

              productVariantId:
                requestedItem
                  .productVariantId,

              transaction,
            });

          /*
          |--------------------------------------------------------------------------
          | Authoritative Checkout Pricing
          |--------------------------------------------------------------------------
          |
          | Never trust the browser cart price when creating an order.
          | Re-resolve the current website price and all active adjustments,
          | including Gift Voucher promotions, inside the SAME order transaction.
          |--------------------------------------------------------------------------
          */

          const quotedPrice =
            await pricingFacadeService.quoteItem({
              companyId:
                company
                  .id,

              productVariantId:
                variant
                  .id,

              quantity,

              channelCode:
                WEBSITE_CHANNEL,

              currencyCode,

              effectiveDate:
                new Date(),

              customerId:
                linkedCustomer
                  ?.id ||
                null,

              transaction,
            });

          const regularUnitPrice =
            roundMoney(
              Number(
                quotedPrice
                  .regularPrice ??
                quotedPrice
                  .finalUnitPrice ??
                quotedPrice
                  .sellingPrice ??
                0
              )
            );

          const baseSellingUnitPrice =
            roundMoney(
              Number(
                quotedPrice
                  .baseSellingPrice ??
                quotedPrice
                  .sellingPrice ??
                quotedPrice
                  .finalUnitPrice ??
                0
              )
            );

          const unitPrice =
            roundMoney(
              Number(
                quotedPrice
                  .finalUnitPrice ??
                quotedPrice
                  .sellingPrice ??
                0
              )
            );

          if (
            !Number.isFinite(
              unitPrice
            ) ||
            unitPrice <
              0
          ) {
            const error =
              new Error(
                `A valid checkout price could not be resolved for SKU ${variant.sku}.`
              );

            error.statusCode =
              409;

            error.code =
              "CHECKOUT_PRICE_INVALID";

            throw error;
          }

          const priceDiscountUnit =
            roundMoney(
              Number(
                quotedPrice
                  .priceDiscountUnit ??
                Math.max(
                  0,
                  regularUnitPrice -
                    baseSellingUnitPrice
                )
              )
            );

          const giftVoucherDiscountUnit =
            roundMoney(
              Number(
                quotedPrice
                  .giftVoucherUnitDiscount ??
                Math.max(
                  0,
                  baseSellingUnitPrice -
                    unitPrice
                )
              )
            );

          const totalDiscountUnit =
            roundMoney(
              Math.max(
                0,
                regularUnitPrice -
                  unitPrice
              )
            );

          const totalDiscountPercent =
            Number.isFinite(
              Number(
                quotedPrice
                  .totalDiscountPercent
              )
            )
              ? Number(
                  quotedPrice
                    .totalDiscountPercent
                )
              : regularUnitPrice >
                  0
                ? Number(
                    (
                      (
                        totalDiscountUnit /
                        regularUnitPrice
                      ) *
                      100
                    ).toFixed(
                      4
                    )
                  )
                : 0;

          const regularLineAmount =
            roundMoney(
              regularUnitPrice *
                quantity
            );

          const baseSellingLineAmount =
            roundMoney(
              baseSellingUnitPrice *
                quantity
            );

          const priceDiscountAmount =
            roundMoney(
              priceDiscountUnit *
                quantity
            );

          const giftVoucherDiscountAmount =
            roundMoney(
              giftVoucherDiscountUnit *
                quantity
            );

          const totalDiscountAmount =
            roundMoney(
              totalDiscountUnit *
                quantity
            );

          const giftVoucher =
            quotedPrice
              .giftVoucher ||
            null;

          const giftVoucherInternalUnit =
            giftVoucher
              ? roundMoney(
                  Number(
                    giftVoucher
                      .internalValue ||
                    0
                  )
                )
              : 0;

          const giftVoucherExternalUnit =
            giftVoucher
              ? roundMoney(
                  Number(
                    giftVoucher
                      .externalValue ||
                    0
                  )
                )
              : 0;

          const giftVoucherInternalAmount =
            roundMoney(
              giftVoucherInternalUnit *
                quantity
            );

          const giftVoucherExternalAmount =
            roundMoney(
              giftVoucherExternalUnit *
                quantity
            );

          const taxPercent =
            Number(
              variant
                .product
                .taxPercent ||
                quotedPrice
                  .taxPercent ||
                0
            );

          const totals =
            calculateLine({
              unitPrice,

              quantity,

              taxPercent,

              isTaxInclusive:
                quotedPrice
                  .isTaxInclusive !==
                false,
            });

          const requestedProtection =
            getRequestedProtection(
              requestedItem
            );

          let protection =
            null;

          if (
            requestedProtection
              ?.schemeId
          ) {
            const protectionResult =
              await resolveProtectionScheme({
                companyId:
                  company
                    .id,

                productId:
                  variant
                    .product
                    .id,

                productVariantId:
                  variant
                    .id,

                schemeId:
                  requestedProtection
                    .schemeId,

                channelCode:
                  WEBSITE_CHANNEL,

                currencyCode,

                quantity,

                effectiveDate:
                  new Date(),
              });

            const plan =
              protectionResult
                .plan;

            if (
              !plan
            ) {
              const error =
                new Error(
                  "The selected protection plan could not be resolved."
                );

              error.statusCode =
                409;

              error.code =
                "PROTECTION_SCHEME_NOT_AVAILABLE";

              throw error;
            }

            const protectionUnitPrice =
              Number(
                plan
                  .unitPrice
              );

            if (
              !Number.isFinite(
                protectionUnitPrice
              ) ||
              protectionUnitPrice <=
                0
            ) {
              const error =
                new Error(
                  "The selected protection plan does not have a valid price."
                );

              error.statusCode =
                409;

              error.code =
                "PROTECTION_PRICE_INVALID";

              throw error;
            }

            const protectionTotals =
              calculateLine({
                unitPrice:
                  protectionUnitPrice,

                quantity,

                /*
                 * Protection currently follows the
                 * product VAT treatment.
                 *
                 * If protection later needs its own
                 * tax code/rate, move this to the
                 * protection scheme configuration.
                 */
                taxPercent,

                isTaxInclusive:
                  quotedPrice
                    .isTaxInclusive !==
                  false,
              });

            protection = {
              schemeId:
                plan
                  .schemeId,

              assignmentId:
                plan
                  .assignmentId ||
                null,

              code:
                plan
                  .code,

              name:
                plan
                  .name,

              schemeType:
                plan
                  .schemeType,

              durationMonths:
                plan
                  .durationMonths ??
                null,

              pricingMethod:
                plan
                  .pricingMethod,

              percentage:
                plan
                  .percentage ??
                null,

              fixedAmount:
                plan
                  .fixedAmount ??
                null,

              pricingSource:
                plan
                  .pricingSource ||
                "DEFAULT",

              coverageStartMode:
                plan
                  .coverageStartMode ||
                "AFTER_MANUFACTURER_WARRANTY",

              currencyCode:
                plan
                  .currencyCode ||
                currencyCode,

              productUnitPrice:
                roundMoney(
                  unitPrice
                ),

              unitPrice:
                roundMoney(
                  protectionUnitPrice
                ),

              subtotal:
                protectionTotals
                  .lineSubtotal,

              taxAmount:
                protectionTotals
                  .taxAmount,

              totalPrice:
                protectionTotals
                  .lineTotal,

              quantity,

              termsAndConditions:
                plan
                  .termsAndConditions ||
                null,
            };
          }

          /*
          |--------------------------------------------------------------------------
          | Regular Sales Bundle Promotion
          |--------------------------------------------------------------------------
          |
          | Resolve selected bundle IDs against current server-side promotion
          | configuration. Browser-supplied bundle prices are never trusted.
          |--------------------------------------------------------------------------
          */

          const bundleResolution =
            await resolveBundleSelections({
              companyId:
                company.id,

              productId:
                variant.product.id,

              productVariantId:
                variant.id,

              mainQuantity:
                quantity,

              requestedItem,

              mainUnitPrice:
                unitPrice,

              currencyCode,

              channelCode:
                WEBSITE_CHANNEL,

              effectiveDate:
                new Date(),

              transaction,
            });

          const bundleChargeAmount =
            roundMoney(
              bundleResolution
                .bundleChargeAmount ??
              0
            );

          /*
           * Bundle charge follows the main product VAT treatment.
           * The bundled protection plan itself is NOT priced separately.
           */
          const bundleTotals =
            calculateLine({
              unitPrice:
                bundleChargeAmount,

              quantity:
                1,

              taxPercent,

              isTaxInclusive:
                quotedPrice
                  .isTaxInclusive !==
                false,
            });

          subtotal =
            roundMoney(
              subtotal +
                totals
                  .lineSubtotal +
                (
                  protection
                    ?.subtotal ||
                  0
                ) +
                bundleTotals
                  .lineSubtotal
            );

          taxAmount =
            roundMoney(
              taxAmount +
                totals
                  .taxAmount +
                (
                  protection
                    ?.taxAmount ||
                  0
                ) +
                bundleTotals
                  .taxAmount
            );

          merchandiseTotal =
            roundMoney(
              merchandiseTotal +
                totals
                  .lineTotal +
                (
                  protection
                    ?.totalPrice ||
                  0
                ) +
                bundleTotals
                  .lineTotal
            );

          const fulfilmentLine =
            fulfilmentLines.find(
              line =>
                String(
                  line?.variantId ||
                  ""
                ) ===
                String(
                  requestedItem
                    .productVariantId ||
                  ""
                )
            ) ||
            null;

          const requestedFulfilmentMethod =
            String(
              fulfilmentLine
                ?.fulfilmentMethod ||
              "DELIVERY"
            ).trim().toUpperCase();

          let selectedDeliveryMethod =
            "STANDARD";

          if (
            requestedFulfilmentMethod ===
            "PICKUP"
          ) {
            selectedDeliveryMethod =
              "PICKUP";
          } else if (
            requestedFulfilmentMethod ===
            "EXPRESS"
          ) {
            selectedDeliveryMethod =
              "EXPRESS";
          }

          const selectedPickupLocationId =
            selectedDeliveryMethod ===
            "PICKUP"
              ? (
                  String(
                    fulfilmentLine
                      ?.pickupLocationId ||
                    ""
                  ).trim() ||
                  null
                )
              : null;

          if (
            selectedDeliveryMethod ===
              "PICKUP" &&
            !selectedPickupLocationId
          ) {
            const error =
              new Error(
                `Pickup location is required for SKU ${variant.sku}.`
              );

            error.statusCode = 400;
            error.code =
              "PICKUP_LOCATION_REQUIRED";
            throw error;
          }

          orderLines.push({
            companyId:
              company
                .id,

            productId:
              variant
                .product
                .id,

            productVariantId:
              variant
                .id,

            sku:
              variant
                .sku,

            productName:
              variant
                .product
                .name,

            variantName:
              variant
                .name,

            quantity,

            currencyCode,

            /*
            |--------------------------------------------------------------------------
            | Immutable Pricing Snapshot
            |--------------------------------------------------------------------------
            */

            regularUnitPrice,

            baseSellingUnitPrice,

            unitPrice,

            priceDiscountUnit,

            giftVoucherDiscountUnit,

            totalDiscountUnit,

            totalDiscountPercent,

            regularLineAmount,

            baseSellingLineAmount,

            priceDiscountAmount,

            giftVoucherDiscountAmount,

            totalDiscountAmount,

            /*
             * Preserve existing generic discountAmount behaviour.
             * Product/GV discount details live in the explicit snapshot fields
             * above; order-level coupon discount remains separate.
             */
            discountAmount:
              0,

            giftVoucherPromotionId:
              giftVoucher
                ?.promotionId ||
              null,

            giftVoucherPromotionCode:
              giftVoucher
                ?.code ||
              null,

            giftVoucherPromotionName:
              giftVoucher
                ?.name ||
              null,

            giftVoucherFundingType:
              giftVoucher
                ?.fundingType ||
              null,

            giftVoucherFundingSource:
              giftVoucher
                ?.fundingSource ||
              null,

            giftVoucherInternalUnit,

            giftVoucherExternalUnit,

            giftVoucherInternalAmount,

            giftVoucherExternalAmount,

            giftVoucherValidFrom:
              giftVoucher
                ?.validFrom ||
              null,

            giftVoucherValidUntil:
              giftVoucher
                ?.validUntil ||
              null,

            taxPercent,

            taxAmount:
              totals
                .taxAmount,

            lineSubtotal:
              totals
                .lineSubtotal,

            lineTotal:
              totals
                .lineTotal,

            priceListId:
              quotedPrice
                .priceListId ||
              null,

            productVariantPriceId:
              quotedPrice
                .source
                ?.id ||
              null,

            selectedDeliveryMethod,

            selectedPickupLocationId,

            protection,

            bundleResolution,
          });
        }

        const deliveryMethod =
        String(
          payload
            .deliveryMethod ||
            "STANDARD"
        )
          .trim()
          .toUpperCase();
      
      const paymentMethod =
        String(
          payload
            .paymentMethod ||
            "COD"
        )
          .trim()
          .toUpperCase();
      
      const deliveryAmount =
        DELIVERY_AMOUNTS[
          deliveryMethod
        ];

        let merchandiseDiscountAmount =
          0;

        let couponBenefitAmount =
          0;

        let finalDeliveryAmount =
          deliveryAmount;

        let appliedCoupon =
          null;

        if (
          payload
            .couponCode &&
          String(
            payload
              .couponCode
          ).trim()
        ) {
          const couponValidation =
            await validateCoupon({
              companyId:
                company
                  .id,

              code:
                payload
                  .couponCode,

              currencyCode,

              channelCode:
                WEBSITE_CHANNEL,

              merchandiseTotal,

              deliveryAmount,

              customerId:
                linkedCustomer
                  ?.id ||
                null,

              customerEmail:
                customer
                  .email,

              transaction,
            });

          appliedCoupon =
            couponValidation
              .coupon;

          merchandiseDiscountAmount =
            roundMoney(
              couponValidation
                .result
                .merchandiseDiscount
            );

          couponBenefitAmount =
            roundMoney(
              couponValidation
                .result
                .discountAmount
            );

          finalDeliveryAmount =
            roundMoney(
              couponValidation
                .result
                .finalDeliveryAmount
            );
        }

        /*
         * Order.discountAmount stores merchandise
         * discount only.
         *
         * FREE_SHIPPING is reflected through the
         * reduced finalDeliveryAmount.
         *
         * This prevents double-discounting.
         */
        const discountAmount =
          merchandiseDiscountAmount;

        const grandTotal =
          roundMoney(
            merchandiseTotal +
              finalDeliveryAmount -
              discountAmount
          );

        let order =
          null;

        for (
          let attempt =
            0;
          attempt <
          5;
          attempt +=
            1
        ) {
          try {
            order =
              await db.Order.create(
                {
                  companyId:
                    company
                      .id,

                  orderNumber:
                    makeOrderNumber(),

                  customerId:
                    linkedCustomer
                      ?.id ||
                    null,

                  channelCode:
                    WEBSITE_CHANNEL,

                  customerFirstName:
                    String(
                      customer
                        .firstName ||
                        ""
                    ).trim(),

                  customerLastName:
                    String(
                      customer
                        .lastName ||
                        ""
                    ).trim() ||
                    null,

                  customerEmail:
                    normalizeEmail(
                      customer
                        .email
                    ),

                  customerPhone:
                    normalizePhone(
                      customer
                        .phone
                    ),

                  currencyCode,

                  subtotal,

                  discountAmount,

                  deliveryAmount:
                    finalDeliveryAmount,

                  taxAmount,

                  grandTotal,

                  couponCode:
                    appliedCoupon
                      ?.code ||
                    null,

                  deliveryMethod,

                  paymentMethod,

                  paymentStatus:
                    "PENDING",

                  orderStatus:
                    paymentMethod ===
                    "COD"
                      ? "CONFIRMED"
                      : "PENDING",

                  fulfillmentStatus:
                    "UNFULFILLED",

                  notes:
                    String(
                      payload
                        .notes ||
                        ""
                    ).trim() ||
                    null,

                  placedAt:
                    new Date(),
                },

                {
                  transaction,
                }
              );

            break;
          } catch (
            error
          ) {
            if (
              error
                .name !==
                "SequelizeUniqueConstraintError" ||
              attempt ===
                4
            ) {
              throw error;
            }
          }
        }

        for (
          const line of
          orderLines
        ) {
          const {
            protection,
            bundleResolution,
            ...orderItemData
          } = line;

          const orderItem =
            await db.OrderItem.create(
              {
                ...orderItemData,

                orderId:
                  order
                    .id,
              },

              {
                transaction,
              }
            );

          if (
            protection
          ) {
            if (
              !db
                .OrderItemProtectionPlan
            ) {
              const error =
                new Error(
                  "OrderItemProtectionPlan model is not configured."
                );

              error.statusCode =
                500;

              error.code =
                "PROTECTION_MODEL_NOT_CONFIGURED";

              throw error;
            }

            await db.OrderItemProtectionPlan.create(
              {
                companyId:
                  company
                    .id,

                orderId:
                  order
                    .id,

                orderItemId:
                  orderItem
                    .id,

                schemeId:
                  protection
                    .schemeId,
                
                zohoItemId:
                    protection
                      .zohoItemId ||
                    null,

                assignmentId:
                  protection
                    .assignmentId,

                schemeCode:
                  protection
                    .code,

                schemeName:
                  protection
                    .name,

                schemeType:
                  protection
                    .schemeType,

                zohoItemId:
                    protection
                      .zohoItemId ||
                    null,                    
                
                durationMonths:
                  protection
                    .durationMonths,

                pricingMethod:
                  protection
                    .pricingMethod,

                productUnitPrice:
                  protection
                    .productUnitPrice,

                percentageApplied:
                  protection
                    .percentage,

                protectionUnitPrice:
                  protection
                    .unitPrice,

                quantity:
                  protection
                    .quantity,

                totalAmount:
                  roundMoney(
                    protection
                      .unitPrice *
                      protection
                        .quantity
                  ),

                currencyCode:
                  protection
                    .currencyCode,

                status:
                  "PENDING",

                coverageStartMode:
                  protection
                    .coverageStartMode,

                coverageStartDate:
                  null,

                coverageEndDate:
                  null,
              },

              {
                transaction,
              }
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Bundle Promotion Order Snapshot
          |--------------------------------------------------------------------------
          */

          for (
            const bundle of
            bundleResolution
              ?.selections ||
            []
          ) {
            const orderItemBundle =
              await db.OrderItemBundle.create(
                {
                  companyId:
                    company.id,

                  orderId:
                    order.id,

                  orderItemId:
                    orderItem.id,

                  bundlePromotionConfigId:
                    bundle.configId,

                  bundlePromotionId:
                    bundle.bundlePromotionId,

                  bundleCode:
                    bundle.bundleCode,

                  bundleName:
                    bundle.bundleName,

                  bundleDescription:
                    bundle.bundleDescription,

                  priceMode:
                    bundle.priceMode,

                  priceAmount:
                    bundle.priceAmount,

                  chargedUnitAmount:
                    bundle.chargedUnitAmount,

                  selectionQuantity:
                    bundle.selectionQuantity,

                  chargedAmount:
                    bundle.chargedAmount,

                  currencyCode:
                    bundle.currencyCode,

                  source:
                    bundle.source,

                  badgeText:
                    bundle.badgeText,

                  startsAt:
                    bundle.startsAt,

                  endsAt:
                    bundle.endsAt,
                },
                {
                  transaction,
                }
              );

            for (
              const bundleItem of
              bundle.items ||
              []
            ) {
              await db.OrderItemBundleItem.create(
                {
                  companyId:
                    company.id,

                  orderId:
                    order.id,

                  orderItemId:
                    orderItem.id,

                  orderItemBundleId:
                    orderItemBundle.id,

                  ...bundleItem,
                },
                {
                  transaction,
                }
              );

              /*
               * A protection plan contained in a bundle receives an
               * OrderItemProtectionPlan coverage snapshot, but its monetary
               * charge remains zero here because the bundle price already
               * contributed to the order totals.
               */
              if (
                bundleItem.itemType ===
                  "PROTECTION_PLAN" &&
                bundleItem
                  .protectionSchemeId
              ) {
                const scheme =
                  await db.ProtectionScheme.findOne({
                    where: {
                      id:
                        bundleItem
                          .protectionSchemeId,

                      companyId:
                        company.id,
                    },

                    transaction,
                  });

                if (!scheme) {
                  const error =
                    new Error(
                      "Bundled protection scheme is no longer available."
                    );

                  error.statusCode =
                    409;

                  error.code =
                    "BUNDLE_PROTECTION_SCHEME_NOT_AVAILABLE";

                  throw error;
                }

                await db.OrderItemProtectionPlan.create(
                  {
                    companyId:
                      company.id,

                    orderId:
                      order.id,

                    orderItemId:
                      orderItem.id,

                    schemeId:
                      scheme.id,

                    zohoItemId:
                      scheme.zohoItemId ||
                      null,

                    assignmentId:
                      null,

                    schemeCode:
                      scheme.code,

                    schemeName:
                      scheme.name,

                    schemeType:
                      scheme.schemeType,

                    durationMonths:
                      scheme.durationMonths,

                    pricingMethod:
                      scheme.pricingMethod,

                    productUnitPrice:
                      line.unitPrice,

                    percentageApplied:
                      scheme.percentage,

                    protectionUnitPrice:
                      0,

                    quantity:
                      bundleItem
                        .totalQuantity,

                    totalAmount:
                      0,

                    currencyCode:
                      scheme.currencyCode ||
                      currencyCode,

                    status:
                      "PENDING",

                    coverageStartMode:
                      scheme.coverageStartMode,

                    coverageStartDate:
                      null,

                    coverageEndDate:
                      null,
                  },
                  {
                    transaction,
                  }
                );
              }
            }
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Delivery Plan + Inventory Reservation
        |--------------------------------------------------------------------------
        |
        | Recalculate the delivery plan on the backend using current
        | InventoryBalance values and reserve the physical location stock.
        |
        | This runs inside the SAME database transaction as the order,
        | order items, address, payment, coupon and protection records.
        |--------------------------------------------------------------------------
        */

        let deliveryReservation =
          null;

        const hasDeliveryItems =
          orderLines.some(
            line =>
              line.selectedDeliveryMethod !==
              "PICKUP"
          );

        const shippingCityCode =
          normalizeDeliveryCityCode(
            payload
              ?.shippingAddress
              ?.city
          );

        if (
          hasDeliveryItems &&
          !shippingCityCode
        ) {
          const error =
            new Error(
              "Shipping city is required for delivery allocation."
            );

          error.statusCode = 400;
          error.code =
            "DELIVERY_CITY_REQUIRED";
          throw error;
        }

        deliveryReservation =
          await orderShipmentReservationService
            .reserveOrderDelivery({
              order,
              cityCode:
                shippingCityCode ||
                null,
              transaction,
            });

        const shippingAddress =
          payload
            .shippingAddress ||
          {};

        await db.OrderAddress.create(
          {
            companyId:
              company
                .id,

            orderId:
              order
                .id,

            addressType:
              "SHIPPING",

            firstName:
              String(
                customer
                  .firstName ||
                  ""
              ).trim(),

            lastName:
              String(
                customer
                  .lastName ||
                  ""
              ).trim() ||
              null,

            email:
              normalizeEmail(
                customer
                  .email
              ),

            mobile:
              normalizePhone(
                customer
                  .phone
              ),

            countryCode:
              "AE",

            country:
              "United Arab Emirates",

            emirate:
              !hasDeliveryItems
                ? null
                : String(
                    shippingAddress
                      .emirate ||
                      ""
                  ).trim(),

            city:
              !hasDeliveryItems
                ? null
                : String(
                    shippingAddress
                      .city ||
                      ""
                  ).trim(),

            area:
              !hasDeliveryItems
                ? null
                : String(
                    shippingAddress
                      .area ||
                      ""
                  ).trim(),

            addressLine1:
              !hasDeliveryItems
                ? null
                : String(
                    shippingAddress
                      .addressLine1 ||
                      ""
                  ).trim(),

            addressLine2:
              !hasDeliveryItems
                ? null
                : String(
                    shippingAddress
                      .addressLine2 ||
                      ""
                  ).trim() ||
                  null,

            landmark:
              !hasDeliveryItems
                ? null
                : String(
                    shippingAddress
                      .landmark ||
                      ""
                  ).trim() ||
                  null,

            deliveryInstructions:
              String(
                payload
                  .notes ||
                  ""
              ).trim() ||
              null,
          },

          {
            transaction,
          }
        );

        await db.OrderPayment.create(
          {
            companyId:
              company
                .id,

            orderId:
              order
                .id,

            paymentMethod,

            status:
              "PENDING",

            amount:
              grandTotal,

            currencyCode,

            provider:
              paymentMethod ===
              "CARD"
                ? "NETWORK_INTERNATIONAL"
                : paymentMethod ===
                  "TAMARA"
                  ? "TAMARA"
                  : "CASH_ON_DELIVERY",
          },

          {
            transaction,
          }
        );

        await db.OrderStatusHistory.bulkCreate(
          [
            {
              companyId:
                company
                  .id,

              orderId:
                order
                  .id,

              statusType:
                "ORDER",

              fromStatus:
                null,

              toStatus:
                paymentMethod ===
                "COD"
                  ? "CONFIRMED"
                  : "PENDING",

              note:
                paymentMethod ===
                "CARD"
                  ? appliedCoupon
                    ? `Card order created from website checkout using coupon ${appliedCoupon.code}. Awaiting payment.`
                    : "Card order created from website checkout. Awaiting payment."
                  : appliedCoupon
                    ? `Order placed from website checkout using coupon ${appliedCoupon.code}.`
                    : "Order placed from website checkout.",
            },

            {
              companyId:
                company
                  .id,

              orderId:
                order
                  .id,

              statusType:
                "PAYMENT",

              fromStatus:
                null,

              toStatus:
                "PENDING",

                note:
                paymentMethod ===
                "CARD"
                  ? "Network International card payment pending."
                  : paymentMethod ===
                    "TABBY"
                    ? "Tabby payment pending."
                    : paymentMethod ===
                      "TAMARA"
                      ? "Tamara payment pending."
                      : paymentMethod ===
                        "COD"
                        ? "Cash on delivery selected."
                        : "Payment pending.",
            },
          ],

          {
            transaction,
          }
        );

        /*
         * Coupon redemption is recorded only after
         * the order has been created.
         *
         * It uses the same database transaction.
         * Therefore an order failure also rolls back
         * the redemption automatically.
         */
        if (
          appliedCoupon &&
          paymentMethod ===
            "COD"
        ) {
          await db.CouponRedemption.create(
            {
              companyId:
                company
                  .id,

              couponId:
                appliedCoupon
                  .id,

              orderId:
                order
                  .id,

              customerId:
                linkedCustomer
                  ?.id ||
                null,

              customerEmail:
                normalizeEmail(
                  customer
                    .email
                ),

              couponCode:
                appliedCoupon
                  .code,

              discountType:
                appliedCoupon
                  .discountType,

              discountValue:
                Number(
                  appliedCoupon
                    .discountValue
                ),

              /*
               * For normal coupons this is the
               * merchandise discount.
               *
               * For FREE_SHIPPING this records the
               * value of the delivery benefit.
               */
              discountAmount:
                couponBenefitAmount,

              redeemedAt:
                new Date(),
            },

            {
              transaction,
            }
          );
        }

        return {
          id:
            order
              .id,

          orderNumber:
            order
              .orderNumber,

          orderStatus:
            order
              .orderStatus,

          paymentStatus:
            order
              .paymentStatus,

          fulfillmentStatus:
            order
              .fulfillmentStatus,

          paymentMethod:
            order
              .paymentMethod,

          deliveryMethod:
            order
              .deliveryMethod,

          deliveryPlan:
            deliveryReservation
              ?.plan ||
            null,

          currencyCode,

          subtotal:
            Number(
              order
                .subtotal
            ),

          taxAmount:
            Number(
              order
                .taxAmount
            ),

          discountAmount:
            Number(
              order
                .discountAmount
            ),

          deliveryAmount:
            Number(
              order
                .deliveryAmount
            ),

          grandTotal:
            Number(
              order
                .grandTotal
            ),

          couponCode:
            order
              .couponCode,

          couponBenefitAmount,

          items:
            orderLines.map(
              (
                line
              ) => ({
                productId:
                  line
                    .productId,

                productVariantId:
                  line
                    .productVariantId,

                sku:
                  line
                    .sku,

                productName:
                  line
                    .productName,

                variantName:
                  line
                    .variantName,

                quantity:
                  line
                    .quantity,

                regularUnitPrice:
                  line
                    .regularUnitPrice,

                baseSellingUnitPrice:
                  line
                    .baseSellingUnitPrice,

                unitPrice:
                  line
                    .unitPrice,

                priceDiscountUnit:
                  line
                    .priceDiscountUnit,

                giftVoucherDiscountUnit:
                  line
                    .giftVoucherDiscountUnit,

                totalDiscountUnit:
                  line
                    .totalDiscountUnit,

                totalDiscountPercent:
                  line
                    .totalDiscountPercent,

                priceDiscountAmount:
                  line
                    .priceDiscountAmount,

                giftVoucherDiscountAmount:
                  line
                    .giftVoucherDiscountAmount,

                totalDiscountAmount:
                  line
                    .totalDiscountAmount,

                giftVoucher:
                  line
                    .giftVoucherPromotionCode
                    ? {
                        promotionId:
                          line
                            .giftVoucherPromotionId,

                        code:
                          line
                            .giftVoucherPromotionCode,

                        name:
                          line
                            .giftVoucherPromotionName,

                        fundingType:
                          line
                            .giftVoucherFundingType,

                        fundingSource:
                          line
                            .giftVoucherFundingSource,

                        internalUnit:
                          line
                            .giftVoucherInternalUnit,

                        externalUnit:
                          line
                            .giftVoucherExternalUnit,

                        internalAmount:
                          line
                            .giftVoucherInternalAmount,

                        externalAmount:
                          line
                            .giftVoucherExternalAmount,

                        validFrom:
                          line
                            .giftVoucherValidFrom,

                        validUntil:
                          line
                            .giftVoucherValidUntil,
                      }
                    : null,

                taxAmount:
                  line
                    .taxAmount,

                lineTotal:
                  line
                    .lineTotal,

                bundlePromotions:
                  line
                    .bundleResolution
                    ?.selections ||
                  [],

                protection:
                  line
                    .protection
                    ? {
                        schemeId:
                          line
                            .protection
                            .schemeId,

                        assignmentId:
                          line
                            .protection
                            .assignmentId,

                        code:
                          line
                            .protection
                            .code,

                        name:
                          line
                            .protection
                            .name,

                        schemeType:
                          line
                            .protection
                            .schemeType,

                        durationMonths:
                          line
                            .protection
                            .durationMonths,

                        pricingMethod:
                          line
                            .protection
                            .pricingMethod,

                        percentage:
                          line
                            .protection
                            .percentage,

                        unitPrice:
                          line
                            .protection
                            .unitPrice,

                        subtotal:
                          line
                            .protection
                            .subtotal,

                        taxAmount:
                          line
                            .protection
                            .taxAmount,

                        totalPrice:
                          line
                            .protection
                            .totalPrice,

                        currencyCode:
                          line
                            .protection
                            .currencyCode,

                        pricingSource:
                          line
                            .protection
                            .pricingSource,
                      }
                    : null,
              })
            ),

          placedAt:
            order
              .placedAt,
        };
      }
    );
  };

module.exports = {
  createPublicOrder,
};