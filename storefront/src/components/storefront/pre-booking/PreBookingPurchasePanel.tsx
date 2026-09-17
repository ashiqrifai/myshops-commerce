"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  createPreBookingCheckoutSession,
} from "@/lib/storefront/public-pre-booking-checkout-api";

import type {
  PublicPreBookingBundle,
  PublicPreBookingCampaign,
  PublicPreBookingImage,
  PublicPreBookingProduct,
  PublicPreBookingVariant,
  PublicPreBookingVariantAttribute,
} from "@/lib/storefront/public-pre-booking-api";

interface PreBookingPurchasePanelProps {
  product:
    PublicPreBookingProduct;

  campaign:
    PublicPreBookingCampaign;
}

const formatMoney = (
  value:
    | number
    | null
    | undefined,
  currency =
    "AED"
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
};

const getImageUrl = (
  image:
    | PublicPreBookingImage
    | null
    | undefined
) =>
  image?.mediaAsset
    ?.publicUrl ||
  image?.mediaAsset
    ?.previewUrl ||
  image?.mediaAsset
    ?.thumbnailUrl ||
  null;

const normalizeAttributeKey = (
  attribute:
    PublicPreBookingVariantAttribute
) =>
  String(
    attribute.code ||
      attribute.name ||
      attribute.attributeId
  )
    .trim()
    .toUpperCase();

const normalizeAttributeLabel = (
  attribute:
    PublicPreBookingVariantAttribute
) =>
  String(
    attribute.name ||
      attribute.code ||
      "Option"
  ).trim();

const classifyAttribute = (
  attribute:
    PublicPreBookingVariantAttribute
) => {
  const haystack =
    `${attribute.code || ""} ${attribute.name || ""}`
      .trim()
      .toUpperCase();

  if (
    haystack.includes(
      "STORAGE"
    ) ||
    haystack.includes(
      "CAPACITY"
    ) ||
    haystack.includes(
      "MEMORY"
    )
  ) {
    return 10;
  }

  if (
    haystack.includes(
      "VERSION"
    ) ||
    haystack.includes(
      "REGION"
    ) ||
    haystack.includes(
      "SIM"
    )
  ) {
    return 20;
  }

  if (
    haystack.includes(
      "COLOR"
    ) ||
    haystack.includes(
      "COLOUR"
    )
  ) {
    return 30;
  }

  return (
    100 +
    Number(
      attribute.displayOrder ||
        0
    )
  );
};

const isColorAttribute = (
  attribute:
    PublicPreBookingVariantAttribute
) => {
  const text =
    `${attribute.code || ""} ${attribute.name || ""}`
      .toUpperCase();

  return (
    text.includes(
      "COLOR"
    ) ||
    text.includes(
      "COLOUR"
    )
  );
};

const getVariantBasePrice = (
  variant:
    PublicPreBookingVariant,
  product:
    PublicPreBookingProduct
) => {
  if (
    product.priceOverride !==
      null &&
    product.priceOverride !==
      undefined
  ) {
    return Number(
      product.priceOverride
    );
  }

  return Number(
    variant.price
      ?.sellingPrice ||
      0
  );
};

const getBundleTotal = ({
  bundle,
  variant,
  product,
}: {
  bundle:
    | PublicPreBookingBundle
    | null;

  variant:
    PublicPreBookingVariant;

  product:
    PublicPreBookingProduct;
}) => {
  const basePrice =
    getVariantBasePrice(
      variant,
      product
    );

  if (!bundle) {
    return basePrice;
  }

  const bundleAmount =
    Number(
      bundle.priceAmount ||
        0
    );

  if (
    bundle.priceMode ===
    "FIXED_TOTAL"
  ) {
    return bundleAmount;
  }

  if (
    bundle.priceMode ===
    "ADD_ON"
  ) {
    return (
      basePrice +
      bundleAmount
    );
  }

  return basePrice;
};

const variantMatchesChoices = (
  variant:
    PublicPreBookingVariant,
  choices:
    Record<
      string,
      string
    >
) => {
  for (
    const [
      key,
      value,
    ] of Object.entries(
      choices
    )
  ) {
    const match =
      variant.attributes.find(
        (
          attribute
        ) =>
          normalizeAttributeKey(
            attribute
          ) ===
          key
      );

    const matchValue =
      String(
        match?.optionId ||
          match?.value ||
          match?.label ||
          ""
      );

    if (
      matchValue !==
      value
    ) {
      return false;
    }
  }

  return true;
};

export default function PreBookingPurchasePanel({
  product,
  campaign,
}: PreBookingPurchasePanelProps) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const requestedVariantId =
    searchParams
      .get(
        "variant"
      )
      ?.trim() ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Initial Variant
  |--------------------------------------------------------------------------
  |
  | When the customer opens the product from a variant campaign card,
  | ?variant=<uuid> selects that variant first. Storage/color controls remain
  | fully interactive and can still switch to any other available variant.
  |--------------------------------------------------------------------------
  */

  const initialVariant =
    useMemo(
      () =>
        (
          requestedVariantId
            ? product.variants.find(
                (
                  variant
                ) =>
                  variant.id ===
                    requestedVariantId &&
                  variant
                    .allocationSummary
                    .isAvailable
              )
            : null
        ) ||
        product.variants.find(
          (
            variant
          ) =>
            variant.id ===
              product.defaultVariantId &&
            variant
              .allocationSummary
              .isAvailable
        ) ||
        product.variants.find(
          (
            variant
          ) =>
            variant
              .allocationSummary
              .isAvailable
        ) ||
        product.variants.find(
          (
            variant
          ) =>
            variant.id ===
            product.defaultVariantId
        ) ||
        product.variants[0] ||
        null,
      [
        product.defaultVariantId,
        product.variants,
        requestedVariantId,
      ]
    );

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] =
    useState<
      string |
      null
    >(
      initialVariant?.id ||
        null
    );

  useEffect(
    () => {
      if (
        initialVariant?.id &&
        initialVariant.id !==
          selectedVariantId
      ) {
        setSelectedVariantId(
          initialVariant.id
        );
      }
    },
    [
      initialVariant?.id,
      selectedVariantId,
    ]
  );

  const [
    selectedBundleId,
    setSelectedBundleId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] =
    useState(
      0
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(
      Math.max(
        1,
        Number(
          product.minimumQuantity ||
            1
        )
      )
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    submitError,
    setSubmitError,
  ] =
    useState<
      string |
      null
    >(null);

  const selectedVariant =
    useMemo(
      () =>
        product.variants.find(
          (
            variant
          ) =>
            variant.id ===
            selectedVariantId
        ) ||
        initialVariant,
      [
        initialVariant,
        product.variants,
        selectedVariantId,
      ]
    );

  const selectedBundle =
    useMemo(
      () =>
        product.bundles.find(
          (
            bundle
          ) =>
            bundle.id ===
            selectedBundleId
        ) ||
        null,
      [
        product.bundles,
        selectedBundleId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Attribute Definitions
  |--------------------------------------------------------------------------
  */

  const attributeDefinitions =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            {
              key:
                string;

              name:
                string;

              sample:
                PublicPreBookingVariantAttribute;

              options:
                Map<
                  string,
                  PublicPreBookingVariantAttribute
                >;
            }
          >();

        for (
          const variant of
          product.variants
        ) {
          for (
            const attribute of
            variant.attributes ||
            []
          ) {
            const key =
              normalizeAttributeKey(
                attribute
              );

            if (
              !map.has(
                key
              )
            ) {
              map.set(
                key,
                {
                  key,

                  name:
                    normalizeAttributeLabel(
                      attribute
                    ),

                  sample:
                    attribute,

                  options:
                    new Map(),
                }
              );
            }

            const optionKey =
              String(
                attribute.optionId ||
                  attribute.value ||
                  attribute.label ||
                  ""
              );

            if (
              optionKey
            ) {
              map
                .get(
                  key
                )
                ?.options.set(
                  optionKey,
                  attribute
                );
            }
          }
        }

        return Array.from(
          map.values()
        ).sort(
          (
            first,
            second
          ) =>
            classifyAttribute(
              first.sample
            ) -
            classifyAttribute(
              second.sample
            )
        );
      },
      [
        product.variants,
      ]
    );

  const selectedChoices =
    useMemo(
      () => {
        const choices:
          Record<
            string,
            string
          > =
          {};

        for (
          const attribute of
          selectedVariant
            ?.attributes ||
          []
        ) {
          choices[
            normalizeAttributeKey(
              attribute
            )
          ] =
            String(
              attribute.optionId ||
                attribute.value ||
                attribute.label ||
                ""
            );
        }

        return choices;
      },
      [
        selectedVariant,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Gallery
  |--------------------------------------------------------------------------
  */

  const gallery =
    useMemo(
      () => {
        const variantImages =
          selectedVariant
            ?.images ||
          [];

        if (
          variantImages.length
        ) {
          return variantImages;
        }

        return product.image
          ? [
              product.image,
            ]
          : [];
      },
      [
        product.image,
        selectedVariant,
      ]
    );

  useEffect(
    () => {
      setSelectedImageIndex(
        0
      );
    },
    [
      selectedVariantId,
    ]
  );

  const selectedImage =
    gallery[
      selectedImageIndex
    ] ||
    gallery[0] ||
    null;

  const selectedImageUrl =
    getImageUrl(
      selectedImage
    );

  const moveImage = (
    direction:
      | -1
      | 1
  ) => {
    if (
      gallery.length <=
      1
    ) {
      return;
    }

    setSelectedImageIndex(
      (
        current
      ) =>
        (
          current +
          direction +
          gallery.length
        ) %
        gallery.length
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Selection
  |--------------------------------------------------------------------------
  */

  const selectAttributeOption =
    (
      attributeKey:
        string,
      optionValue:
        string
    ) => {
      const nextChoices = {
        ...selectedChoices,
        [attributeKey]:
          optionValue,
      };

      let match =
        product.variants.find(
          (
            variant
          ) =>
            variant
              .allocationSummary
              .isAvailable &&
            variantMatchesChoices(
              variant,
              nextChoices
            )
        );

      if (!match) {
        /*
         * If current selections conflict with the newly selected option,
         * keep the clicked option and choose the first available compatible
         * variant. This mirrors a normal ecommerce variant selector.
         */
        match =
          product.variants.find(
            (
              variant
            ) => {
              if (
                !variant
                  .allocationSummary
                  .isAvailable
              ) {
                return false;
              }

              const attribute =
                variant.attributes.find(
                  (
                    item
                  ) =>
                    normalizeAttributeKey(
                      item
                    ) ===
                    attributeKey
                );

              const value =
                String(
                  attribute?.optionId ||
                    attribute?.value ||
                    attribute?.label ||
                    ""
                );

              return (
                value ===
                optionValue
              );
            }
          );
      }

      if (match) {
        setSelectedVariantId(
          match.id
        );
      }
    };

  const isOptionAvailable =
    (
      attributeKey:
        string,
      optionValue:
        string
    ) => {
      const otherChoices =
        Object.fromEntries(
          Object.entries(
            selectedChoices
          ).filter(
            (
              [
                key,
              ]
            ) =>
              key !==
              attributeKey
          )
        ) as Record<
          string,
          string
        >;

      return product.variants.some(
        (
          variant
        ) => {
          if (
            !variant
              .allocationSummary
              .isAvailable
          ) {
            return false;
          }

          if (
            !variantMatchesChoices(
              variant,
              otherChoices
            )
          ) {
            return false;
          }

          const attribute =
            variant.attributes.find(
              (
                item
              ) =>
                normalizeAttributeKey(
                  item
                ) ===
                attributeKey
            );

          const value =
            String(
              attribute?.optionId ||
                attribute?.value ||
                attribute?.label ||
                ""
            );

          return (
            value ===
            optionValue
          );
        }
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Pricing / Availability
  |--------------------------------------------------------------------------
  */

  const currencyCode =
    selectedVariant
      ?.price
      ?.currencyCode ||
    product.currencyCode ||
    "AED";

  const resolvedUnitTotal =
    selectedVariant
      ? getBundleTotal({
          bundle:
            selectedBundle,

          variant:
            selectedVariant,

          product,
        })
      : null;

  const resolvedTotal =
    resolvedUnitTotal !==
    null
      ? resolvedUnitTotal *
        quantity
      : null;

  const selectedDirectAllocation =
    useMemo(
      () =>
        selectedVariant
          ?.allocations.find(
            (allocation) =>
              allocation.isAvailable &&
              !allocation.bundleId
          ) ||
        null,
      [selectedVariant]
    );

  const selectedBundleAllocation =
    useMemo(
      () => {
        if (
          !selectedBundle ||
          !selectedVariant
        ) {
          return null;
        }

        return (
          selectedBundle.allocations.find(
            (allocation) =>
              allocation.isAvailable &&
              (
                !allocation.productVariantId ||
                allocation.productVariantId ===
                  selectedVariant.id
              )
          ) ||
          null
        );
      },
      [
        selectedBundle,
        selectedVariant,
      ]
    );

  const selectedAllocation =
    selectedBundle
      ? selectedBundleAllocation
      : selectedDirectAllocation;

  const selectedAvailableQuantity =
    selectedAllocation
      ?.availableQuantity ||
    0;

  const maximumQuantity =
    Math.max(
      Number(
        product.minimumQuantity ||
          1
      ),
      Math.min(
        Number(
          product.maximumQuantityPerOrder ||
            1
        ),
        selectedAvailableQuantity ||
          Number(
            product.maximumQuantityPerOrder ||
              1
          )
      )
    );

  useEffect(
    () => {
      const minimum =
        Math.max(
          1,
          Number(
            product.minimumQuantity ||
              1
          )
        );

      if (
        quantity <
        minimum
      ) {
        setQuantity(minimum);
        return;
      }

      if (
        selectedAllocation &&
        quantity >
          maximumQuantity
      ) {
        setQuantity(
          maximumQuantity
        );
      }
    },
    [
      maximumQuantity,
      product.minimumQuantity,
      quantity,
      selectedAllocation,
    ]
  );

  const canPreBook =
    campaign.bookingStatus ===
      "ACTIVE" &&
    Boolean(selectedVariant) &&
    Boolean(selectedAllocation) &&
    selectedAvailableQuantity >=
      quantity &&
    quantity >=
      Number(
        product.minimumQuantity ||
          1
      ) &&
    quantity <=
      maximumQuantity;

  const handlePreBook =
    async () => {
      if (
        !selectedVariant ||
        !selectedAllocation ||
        !canPreBook ||
        submitting
      ) {
        return;
      }

      setSubmitting(true);
      setSubmitError(null);

      try {
        const result =
          await createPreBookingCheckoutSession({
            campaignProductId:
              product.campaignProductId,
            productVariantId:
              selectedVariant.id,
            allocationId:
              selectedAllocation.id,
            bundleId:
              selectedBundle?.id ||
              null,
            quantity,
            channel:
              "WEBSITE",
          });

        router.push(
          `/pre-booking/checkout/${result.session.publicToken}`
        );
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to start pre-booking checkout."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      {/*
      |--------------------------------------------------------------------------
      | LEFT — Variant Gallery
      |--------------------------------------------------------------------------
      */}

      <section>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[22px] border border-storefront-border bg-white">
          {selectedImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                selectedImageUrl
              }
              alt={
                selectedImage
                  ?.altText ||
                selectedVariant
                  ?.name ||
                product.name
              }
              className="h-full w-full object-contain p-8 sm:p-10"
            />
          ) : (
            <div className="text-sm text-storefront-muted">
              No image
            </div>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
            Pre-Booking
          </span>

          {gallery.length >
          1 ? (
            <>
              <button
                type="button"
                onClick={() =>
                  moveImage(
                    -1
                  )
                }
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
                aria-label="Previous image"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  moveImage(
                    1
                  )
                }
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
                aria-label="Next image"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </>
          ) : null}
        </div>

        {gallery.length >
        1 ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {gallery.map(
              (
                image,
                index
              ) => {
                const url =
                  getImageUrl(
                    image
                  );

                if (!url) {
                  return null;
                }

                return (
                  <button
                    key={
                      image.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex(
                        index
                      )
                    }
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white p-2 transition ${
                      index ===
                      selectedImageIndex
                        ? "border-[#28ABB5] ring-1 ring-[#28ABB5]"
                        : "border-storefront-border hover:border-slate-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        url
                      }
                      alt={
                        image.altText ||
                        product.name
                      }
                      className="h-full w-full object-contain"
                    />
                  </button>
                );
              }
            )}
          </div>
        ) : null}
      </section>

      {/*
      |--------------------------------------------------------------------------
      | RIGHT — Product / Variant Selector
      |--------------------------------------------------------------------------
      */}

      <section className="min-w-0">
        {product.brand
          ?.name ? (
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#28ABB5]">
            {
              product
                .brand
                .name
            }
          </p>
        ) : null}

        <h1 className="mt-2 text-3xl font-black tracking-tight text-storefront-text sm:text-4xl">
          {
            product.name
          }
        </h1>

        {product.shortDescription ? (
          <p className="mt-3 text-sm leading-6 text-storefront-muted">
            {
              product.shortDescription
            }
          </p>
        ) : null}

        <div className="mt-5">
          <p className="text-3xl font-black text-storefront-text">
            {formatMoney(
              resolvedUnitTotal,
              currencyCode
            ) ||
              "Price coming soon"}
          </p>

          {selectedVariant
            ?.price
            ?.isTaxInclusive ? (
            <p className="mt-2 text-sm font-semibold text-storefront-muted">
              All prices include VAT
            </p>
          ) : null}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Quantity
        |--------------------------------------------------------------------------
        */}

        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm font-bold text-storefront-text">
            Quantity:
          </span>

          <div className="inline-flex items-center overflow-hidden rounded-lg border border-storefront-border bg-white">
            <button
              type="button"
              onClick={() =>
                setQuantity(
                  (
                    current
                  ) =>
                    Math.max(
                      Number(
                        product.minimumQuantity ||
                          1
                      ),
                      current -
                        1
                    )
                )
              }
              disabled={
                quantity <=
                Number(
                  product.minimumQuantity ||
                    1
                )
              }
              className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
            >
              <Minus
                size={16}
              />
            </button>

            <span className="min-w-10 text-center text-sm font-bold">
              {
                quantity
              }
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity(
                  (
                    current
                  ) =>
                    Math.min(
                      maximumQuantity,
                      current +
                        1
                    )
                )
              }
              disabled={
                !selectedAllocation ||
                quantity >=
                  maximumQuantity
              }
              className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
            >
              <Plus
                size={16}
              />
            </button>
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Availability
        |--------------------------------------------------------------------------
        */}

        <div className="mt-5 flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              selectedAllocation
                ? "bg-emerald-500"
                : "bg-slate-300"
            }`}
          />

          <span
            className={`text-sm font-bold ${
              selectedAllocation
                ? "text-emerald-600"
                : "text-storefront-muted"
            }`}
          >
            {selectedAllocation
              ? `${selectedAvailableQuantity} available for pre-booking`
              : selectedBundle
                ? "Selected bundle is unavailable for this variant"
                : "Currently unavailable"}
          </span>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Grouped Variant Attributes
        |--------------------------------------------------------------------------
        */}

        {attributeDefinitions.length >
        0 ? (
          <div className="mt-7 border-t border-storefront-border pt-6">
            <div className="space-y-5">
              {attributeDefinitions.map(
                (
                  definition
                ) => {
                  const currentOption =
                    selectedChoices[
                      definition.key
                    ] ||
                    "";

                  const selectedAttribute =
                    selectedVariant
                      ?.attributes
                      .find(
                        (
                          item
                        ) =>
                          normalizeAttributeKey(
                            item
                          ) ===
                          definition.key
                      );

                  const color =
                    isColorAttribute(
                      definition.sample
                    );

                  return (
                    <div
                      key={
                        definition.key
                      }
                    >
                      <div className="mb-2 flex flex-wrap items-baseline gap-2">
                        <p className="text-sm font-black text-storefront-text">
                          {
                            definition.name
                          }
                          :
                        </p>

                        {selectedAttribute
                          ?.label ? (
                          <p className="text-xs text-storefront-muted">
                            {
                              selectedAttribute.label
                            }
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          definition.options.entries()
                        ).map(
                          (
                            [
                              optionValue,
                              option,
                            ]
                          ) => {
                            const available =
                              isOptionAvailable(
                                definition.key,
                                optionValue
                              );

                            const selected =
                              currentOption ===
                              optionValue;

                            return (
                              <button
                                key={
                                  optionValue
                                }
                                type="button"
                                disabled={
                                  !available
                                }
                                onClick={() =>
                                  selectAttributeOption(
                                    definition.key,
                                    optionValue
                                  )
                                }
                                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                                  selected
                                    ? "border-[#28ABB5] bg-[#28ABB5]/5 text-storefront-text ring-1 ring-[#28ABB5]"
                                    : available
                                      ? "border-storefront-border bg-white text-storefront-text hover:border-[#28ABB5]/50"
                                      : "cursor-not-allowed border-storefront-border bg-slate-50 text-slate-400 opacity-60"
                                }`}
                              >
                                {color ? (
                                  <span
                                    className="h-4 w-4 rounded-full border border-slate-300"
                                    style={{
                                      background:
                                        option.swatchValue ||
                                        option.value ||
                                        undefined,
                                    }}
                                  />
                                ) : null}

                                <span>
                                  {
                                    option.label ||
                                    option.value ||
                                    "Option"
                                  }
                                </span>

                                {selected ? (
                                  <Check
                                    size={14}
                                    className="text-[#28ABB5]"
                                  />
                                ) : null}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        ) : (
          /*
           * Fallback for legacy products with no variant attributes.
           */
          <div className="mt-7 border-t border-storefront-border pt-6">
            <p className="mb-3 text-sm font-black text-storefront-text">
              Choose your variant
            </p>

            <div className="space-y-2">
              {product.variants.map(
                (
                  variant
                ) => {
                  const available =
                    variant
                      .allocationSummary
                      .isAvailable;

                  const selected =
                    selectedVariant?.id ===
                    variant.id;

                  return (
                    <button
                      key={
                        variant.id
                      }
                      type="button"
                      disabled={
                        !available
                      }
                      onClick={() =>
                        setSelectedVariantId(
                          variant.id
                        )
                      }
                      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left ${
                        selected
                          ? "border-[#28ABB5] bg-[#28ABB5]/5 ring-1 ring-[#28ABB5]"
                          : available
                            ? "border-storefront-border bg-white"
                            : "cursor-not-allowed border-storefront-border bg-slate-50 opacity-50"
                      }`}
                    >
                      <span className="font-bold">
                        {
                          variant.name
                        }
                      </span>

                      <span className="font-bold">
                        {formatMoney(
                          variant
                            .price
                            ?.sellingPrice,
                          currencyCode
                        ) ||
                          "—"}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/*
        |--------------------------------------------------------------------------
        | Bundles
        |--------------------------------------------------------------------------
        */}

        {product.hasBundles ? (
          <div className="mt-7 border-t border-storefront-border pt-6">
            <h2 className="text-base font-black text-storefront-text">
              Choose a bundle
            </h2>

            <p className="mt-1 text-sm text-storefront-muted">
              Bundle selection is optional.
            </p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedBundleId(
                    null
                  )
                }
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedBundleId ===
                  null
                    ? "border-[#28ABB5] bg-[#28ABB5]/5 ring-1 ring-[#28ABB5]"
                    : "border-storefront-border bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">
                      Product only
                    </p>

                    <p className="mt-1 text-xs text-storefront-muted">
                      No additional bundle
                    </p>
                  </div>

                  {selectedBundleId ===
                  null ? (
                    <CheckCircle2
                      size={18}
                      className="text-[#28ABB5]"
                    />
                  ) : null}
                </div>
              </button>

              {product.bundles.map(
                (
                  bundle
                ) => {
                  const available =
                    bundle
                      .allocationSummary
                      .isAvailable;

                  const selected =
                    bundle.id ===
                    selectedBundleId;

                  return (
                    <button
                      key={
                        bundle.id
                      }
                      type="button"
                      disabled={
                        !available
                      }
                      onClick={() =>
                        setSelectedBundleId(
                          bundle.id
                        )
                      }
                      className={`w-full rounded-xl border p-4 text-left ${
                        selected
                          ? "border-[#28ABB5] bg-[#28ABB5]/5 ring-1 ring-[#28ABB5]"
                          : available
                            ? "border-storefront-border bg-white"
                            : "cursor-not-allowed border-storefront-border bg-slate-50 opacity-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">
                              {
                                bundle.name
                              }
                            </p>

                            {bundle.protectionIncluded ? (
                              <ShieldCheck
                                size={16}
                                className="text-emerald-600"
                              />
                            ) : null}
                          </div>

                          {bundle.description ? (
                            <p className="mt-1 text-xs text-storefront-muted">
                              {
                                bundle.description
                              }
                            </p>
                          ) : null}
                        </div>

                        <p className="font-black">
                          {bundle.priceMode ===
                          "INHERIT_PRODUCT"
                            ? "Included"
                            : formatMoney(
                                bundle.priceAmount,
                                bundle.currencyCode
                              ) ||
                              "—"}
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Total + CTA
        |--------------------------------------------------------------------------
        */}

        <div className="mt-7 border-t border-storefront-border pt-6">
          {quantity >
          1 ? (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-storefront-muted">
                Total for{" "}
                {
                  quantity
                }{" "}
                units
              </span>

              <span className="text-xl font-black">
                {formatMoney(
                  resolvedTotal,
                  currencyCode
                ) ||
                  "—"}
              </span>
            </div>
          ) : null}

          {submitError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {submitError}
            </div>
          ) : null}

          <button
            type="button"
            disabled={
              !canPreBook ||
              submitting
            }
            onClick={
              handlePreBook
            }
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#28ABB5] px-5 text-sm font-black text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Reserving...
              </>
            ) : campaign.bookingStatus !==
              "ACTIVE" ? (
              campaign.bookingStatus ===
              "UPCOMING"
                ? "Booking opening soon"
                : "Booking closed"
            ) : canPreBook ? (
              "Pre-book now"
            ) : (
              "Currently unavailable"
            )}
          </button>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-storefront-muted">
            <PackageCheck
              size={14}
            />

            Secure your unit before the official launch
          </div>
        </div>
      </section>
    </div>
  );
}
