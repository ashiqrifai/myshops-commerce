const fs = require("fs");
const path = require("path");

const target = path.resolve(
  process.cwd(),
  "src/modules/public-storefront/publicStorefront.service.js"
);

if (!fs.existsSync(target)) {
  throw new Error(
    `Target file not found: ${target}\nRun this script from /var/www/myshops-commerce/backend`
  );
}

let source = fs.readFileSync(target, "utf8");

const backup =
  `${target}.bak-prebooking-variant-cards-${Date.now()}`;

fs.copyFileSync(target, backup);

const imageAnchor = `      /*
      |--------------------------------------------------------------------------
      | 5. Bundles
      |--------------------------------------------------------------------------
`;

if (!source.includes(imageAnchor)) {
  throw new Error(
    "Could not find PRE_BOOKING Bundles anchor. No changes were written."
  );
}

if (!source.includes("const preBookingVariantImagesByVariantId =")) {
  const imageBlock = `      /*
      |--------------------------------------------------------------------------
      | 4B. Variant-Specific Images For Pre-Booking Cards
      |--------------------------------------------------------------------------
      |
      | Product carousel queries already load variants, prices and attributes.
      | For PRE_BOOKING only, load images assigned directly to those variants.
      |--------------------------------------------------------------------------
      */

      const preBookingVariantIds =
        Array.from(
          new Set(
            productModels
              .flatMap(
                (
                  productModel
                ) => {
                  const product =
                    toPlainObject(
                      productModel
                    );

                  return (
                    product.variants ||
                    []
                  ).map(
                    (
                      variant
                    ) =>
                      variant.id
                  );
                }
              )
              .filter(
                Boolean
              )
          )
        );

      const preBookingVariantImageModels =
        preBookingVariantIds.length
          ? await db.ProductImage.findAll({
              where: {
                companyId,

                variantId: {
                  [Op.in]:
                    preBookingVariantIds,
                },

                isActive:
                  true,
              },

              include: [
                {
                  model:
                    db.MediaAsset,

                  as:
                    "mediaAsset",

                  required:
                    true,

                  where: {
                    companyId,

                    status:
                      "READY",

                    isPublic:
                      true,

                    isActive:
                      true,
                  },

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
                        [
                          "variantType",
                          "ASC",
                        ],
                        [
                          "createdAt",
                          "ASC",
                        ],
                      ],

                      where: {
                        companyId,

                        isActive:
                          true,
                      },
                    },
                  ],
                },
              ],

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
            })
          : [];

      const preBookingVariantImagesByVariantId =
        new Map();

      for (
        const imageModel of
        preBookingVariantImageModels
      ) {
        const image =
          toPlainObject(
            imageModel
          );

        const variantKey =
          String(
            image.variantId ||
              ""
          );

        if (
          !variantKey ||
          !image.mediaAsset
        ) {
          continue;
        }

        if (
          !preBookingVariantImagesByVariantId.has(
            variantKey
          )
        ) {
          preBookingVariantImagesByVariantId.set(
            variantKey,
            []
          );
        }

        preBookingVariantImagesByVariantId
          .get(
            variantKey
          )
          .push({
            id:
              image.id,

            imageRole:
              image.imageRole ||
              null,

            altText:
              image.altText ||
              image.mediaAsset
                ?.altText ||
              null,

            title:
              image.title ||
              image.mediaAsset
                ?.title ||
              null,

            mediaAsset:
              buildPublicMediaAsset(
                image.mediaAsset,
                apiBaseUrl
              ),
          });
      }

`;

  source = source.replace(
    imageAnchor,
    imageBlock + imageAnchor
  );
}

const allocationAnchor = `              /*
              |--------------------------------------------------------------------------
              | Bundles
              |--------------------------------------------------------------------------
`;

if (!source.includes(allocationAnchor)) {
  throw new Error(
    "Could not find PRE_BOOKING product Bundles anchor. No changes were written."
  );
}

if (!source.includes("const preBookingPublicVariants =")) {
  const variantBlock = `              /*
              |--------------------------------------------------------------------------
              | Public Pre-Booking Variants
              |--------------------------------------------------------------------------
              |
              | Expose the full variant card payload only inside PRE_BOOKING.
              | The normal PRODUCT_CAROUSEL response remains unchanged.
              |--------------------------------------------------------------------------
              */

              const productPlain =
                toPlainObject(
                  productModel
                );

              const productVariants =
                Array.isArray(
                  productPlain.variants
                )
                  ? productPlain.variants
                  : [];

              const directAllocationPlain =
                directAllocations.map(
                  (
                    allocation
                  ) =>
                    toPlainObject(
                      allocation
                    )
                );

              const preBookingPublicVariants =
                productVariants.map(
                  (
                    variant
                  ) => {
                    const variantAllocations =
                      directAllocationPlain.filter(
                        (
                          allocation
                        ) =>
                          String(
                            allocation.productVariantId ||
                              allocation.variant
                                ?.id ||
                              ""
                          ) ===
                          String(
                            variant.id
                          )
                      );

                    const allocationQuantity =
                      variantAllocations.reduce(
                        (
                          total,
                          allocation
                        ) =>
                          total +
                          Number(
                            allocation.allocationQuantity ||
                              0
                          ),
                        0
                      );

                    const reservedQuantity =
                      variantAllocations.reduce(
                        (
                          total,
                          allocation
                        ) =>
                          total +
                          Number(
                            allocation.reservedQuantity ||
                              0
                          ),
                        0
                      );

                    const confirmedQuantity =
                      variantAllocations.reduce(
                        (
                          total,
                          allocation
                        ) =>
                          total +
                          Number(
                            allocation.confirmedQuantity ||
                              0
                          ),
                        0
                      );

                    const availableQuantity =
                      Math.max(
                        0,
                        allocationQuantity -
                          reservedQuantity -
                          confirmedQuantity
                      );

                    const attributeValues =
                      Array.isArray(
                        variant.attributeValues
                      )
                        ? variant.attributeValues
                        : [];

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
                        attributeValues.map(
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
                                  value.sortOrder ||
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
                        preBookingVariantImagesByVariantId.get(
                          String(
                            variant.id
                          )
                        ) || [],

                      price:
                        getPublicVariantPrice(
                          variant
                        ),

                      allocationSummary: {
                        hasAllocation:
                          variantAllocations.length >
                          0,

                        availableQuantity,

                        isAvailable:
                          availableQuantity >
                          0,
                      },

                      allocations:
                        variantAllocations,
                    };
                  }
                );

`;

  source = source.replace(
    allocationAnchor,
    variantBlock + allocationAnchor
  );
}

const responseAnchor = `                price:
                  resolvedPrice,

                preBooking: {`;

if (!source.includes(responseAnchor)) {
  throw new Error(
    "Could not find PRE_BOOKING response price anchor. No changes were written."
  );
}

if (!source.includes("variants:\n                  preBookingPublicVariants")) {
  const responseReplacement = `                price:
                  resolvedPrice,

                /*
                 * Full variants are intentionally exposed only for the
                 * PRE_BOOKING CMS section so the storefront can render one
                 * card per available Color + Storage combination.
                 */
                variants:
                  preBookingPublicVariants,

                preBooking: {`;

  source = source.replace(
    responseAnchor,
    responseReplacement
  );
}

fs.writeFileSync(
  target,
  source,
  "utf8"
);

console.log(
  "Pre-booking variant resolver patch applied successfully."
);
console.log(
  `Backup created: ${backup}`
);
console.log(
  `Updated: ${target}`
);
