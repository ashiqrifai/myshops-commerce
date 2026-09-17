"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  LoaderCircle,
  PackageSearch,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getAssetUrl,
  getPublicProductAttachments,
} from "@/lib/storefront/product-attachment-api";

import type {
  PublicProductAttachmentSuggestion,
} from "@/lib/storefront/product-attachment-api";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  addItem,
  selectCartItems,
} from "@/store/slices/cartSlice";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

const MAXIMUM_RECOMMENDATIONS =
  6;

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/+$/,
  ""
);

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

const getAutomaticCartRecommendations =
  async ({
    productIds,
    limit,
    signal,
  }: {
    productIds:
      string[];

    limit:
      number;

    signal?:
      AbortSignal;
  }): Promise<
    PublicProductAttachmentSuggestion[]
  > => {
    const response =
      await fetch(
        `${API_BASE_URL}/public/storefront/recommendations/cart`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-company-code":
              COMPANY_CODE,
          },

          body:
            JSON.stringify({
              productIds,
              channel:
                "WEBSITE",
              limit,
            }),

          signal,

          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `Automatic cart recommendations failed (${response.status}).`
      );
    }

    const payload =
      (await response.json()) as {
        success?:
          boolean;

        data?: {
          suggestions?:
            PublicProductAttachmentSuggestion[];
        };
      };

    return (
      payload.data
        ?.suggestions ||
      []
    );
  };



const relationshipLabel =
  (
    value:
      string
  ) => {
    switch (
      value
    ) {
      case "UPSELL":
        return "Recommended upgrade";

      case "CROSS_SELL":
        return "You may also like";

      case "ADD_ON":
        return "Useful add-on";

      case "BUNDLE_SUGGESTION":
        return "Bundle suggestion";

      case "COMPATIBLE_PRODUCT":
        return "Compatible product";

      default:
        return "Recommended accessory";
    }
  };

const sourceRank =
  (
    value:
      string
  ) => {
    if (
      value ===
      "PRODUCT"
    ) {
      return 1;
    }

    if (
      value ===
      "BRAND"
    ) {
      return 2;
    }

    return 3;
  };

const compareSuggestions =
  (
    first:
      PublicProductAttachmentSuggestion,
    second:
      PublicProductAttachmentSuggestion
  ) =>
    sourceRank(
      first.source
    ) -
      sourceRank(
        second.source
      ) ||
    Number(
      first.priority ||
        100
    ) -
      Number(
        second.priority ||
          100
      ) ||
    Number(
      first.sortOrder ||
        0
    ) -
      Number(
        second.sortOrder ||
          0
      );

/*
|--------------------------------------------------------------------------
| Recommendation Image
|--------------------------------------------------------------------------
|
| Manual attachment recommendations and automatic recommendations can expose
| the image in slightly different shapes:
|
| manual:    product.image -> MediaAsset
| automatic: product.image -> ProductImage { mediaAsset: MediaAsset }
|
| Normalize both shapes before calling getAssetUrl().
|--------------------------------------------------------------------------
*/

const getRecommendationImageUrl = (
  image: unknown
): string | null => {
  if (
    !image ||
    typeof image !== "object"
  ) {
    return null;
  }

  const imageRecord =
    image as Record<
      string,
      unknown
    >;

  const rawMediaAsset =
    imageRecord.mediaAsset;

  const mediaAsset =
    rawMediaAsset &&
    typeof rawMediaAsset ===
      "object" &&
    !Array.isArray(
      rawMediaAsset
    )
      ? (rawMediaAsset as Record<
          string,
          unknown
        >)
      : imageRecord;

  const variants =
    Array.isArray(
      mediaAsset.variants
    )
      ? mediaAsset.variants
      : [];

  const preferredVariant =
    variants.find(
      (item) => {
        if (
          !item ||
          typeof item !==
            "object"
        ) {
          return false;
        }

        const variant =
          item as Record<
            string,
            unknown
          >;

        return (
          variant.variantType ===
            "MEDIUM" &&
          typeof variant.publicUrl ===
            "string"
        );
      }
    ) ||
    variants.find(
      (item) => {
        if (
          !item ||
          typeof item !==
            "object"
        ) {
          return false;
        }

        const variant =
          item as Record<
            string,
            unknown
          >;

        return (
          variant.variantType ===
            "SMALL" &&
          typeof variant.publicUrl ===
            "string"
        );
      }
    ) ||
    variants.find(
      (item) => {
        if (
          !item ||
          typeof item !==
            "object"
        ) {
          return false;
        }

        const variant =
          item as Record<
            string,
            unknown
          >;

        return (
          variant.variantType ===
            "THUMBNAIL" &&
          typeof variant.publicUrl ===
            "string"
        );
      }
    );

  if (
    preferredVariant &&
    typeof preferredVariant ===
      "object"
  ) {
    const variant =
      preferredVariant as Record<
        string,
        unknown
      >;

    if (
      typeof variant.publicUrl ===
        "string"
    ) {
      return getAssetUrl(
        variant.publicUrl
      );
    }
  }

  if (
    typeof mediaAsset.publicUrl ===
      "string"
  ) {
    return getAssetUrl(
      mediaAsset.publicUrl
    );
  }

  if (
    typeof mediaAsset.previewUrl ===
      "string"
  ) {
    return getAssetUrl(
      mediaAsset.previewUrl
    );
  }

  if (
    typeof mediaAsset.thumbnailUrl ===
      "string"
  ) {
    return getAssetUrl(
      mediaAsset.thumbnailUrl
    );
  }

  return null;
};

type RecommendationMode =
  | "ATTACHMENT"
  | "AUTOMATIC";

interface CartRecommendationsProps {
  mode?: RecommendationMode;
}

export default function CartRecommendations({
  mode = "AUTOMATIC",
}: CartRecommendationsProps) {
  const dispatch =
    useAppDispatch();

  const carouselRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const items =
    useAppSelector(
      selectCartItems
    );

  const [
    suggestions,
    setSuggestions,
  ] =
    useState<
      PublicProductAttachmentSuggestion[]
    >(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    addedVariantId,
    setAddedVariantId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const cartProductIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            items
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
        ),
      [
        items,
      ]
    );

  const cartCurrencyCode =
    items[0]
      ?.currencyCode ||
    "AED";

  const cartQuantityByVariant =
    useMemo(
      () =>
        new Map(
          items.map(
            (
              item
            ) => [
              item.variantId,
              item.quantity,
            ]
          )
        ),
      [
        items,
      ]
    );

  useEffect(
    () => {
      if (
        !cartProductIds
          .length
      ) {
        setSuggestions(
          []
        );

        return;
      }

      const controller =
        new AbortController();

      const load =
        async () => {
          setLoading(
            true
          );

          setError(
            null
          );

          try {
            let nextSuggestions:
              PublicProductAttachmentSuggestion[] =
              [];

            if (
              mode ===
              "ATTACHMENT"
            ) {
              const attachmentResponses =
                await Promise.all(
                  cartProductIds.map(
                    (
                      productId
                    ) =>
                      getPublicProductAttachments({
                        productId,

                        displayLocation:
                          "CART",

                        channelCode:
                          "WEBSITE",

                        currencyCode:
                          cartCurrencyCode,

                        excludeProductIds:
                          cartProductIds,

                        limit:
                          MAXIMUM_RECOMMENDATIONS,

                        signal:
                          controller
                            .signal,
                      })
                  )
                );

              const manualMap =
                new Map<
                  string,
                  PublicProductAttachmentSuggestion
                >();

              for (
                const response of
                attachmentResponses
              ) {
                for (
                  const suggestion of
                  response.data
                    .suggestions ||
                  []
                ) {
                  const existing =
                    manualMap.get(
                      suggestion
                        .attachmentProductId
                    );

                  if (
                    !existing ||
                    compareSuggestions(
                      suggestion,
                      existing
                    ) < 0
                  ) {
                    manualMap.set(
                      suggestion
                        .attachmentProductId,
                      suggestion
                    );
                  }
                }
              }

              nextSuggestions =
                Array.from(
                  manualMap.values()
                )
                  .filter(
                    (
                      suggestion
                    ) =>
                      !cartProductIds.includes(
                        suggestion
                          .attachmentProductId
                      )
                  )
                  .sort(
                    compareSuggestions
                  )
                  .slice(
                    0,
                    MAXIMUM_RECOMMENDATIONS
                  );
            } else {
              const automaticSuggestions =
                await getAutomaticCartRecommendations({
                  productIds:
                    cartProductIds,

                  limit:
                    MAXIMUM_RECOMMENDATIONS,

                  signal:
                    controller
                      .signal,
                });

              nextSuggestions =
                automaticSuggestions
                  .filter(
                    (
                      suggestion
                    ) =>
                      !cartProductIds.includes(
                        suggestion
                          .attachmentProductId
                      )
                  )
                  .slice(
                    0,
                    MAXIMUM_RECOMMENDATIONS
                  );
            }

            setSuggestions(
              nextSuggestions
            );
          } catch (
            caughtError
          ) {
            if (
              controller
                .signal
                .aborted
            ) {
              return;
            }

            setSuggestions(
              []
            );

            setError(
              caughtError instanceof
              Error
                ? caughtError
                    .message
                : "Unable to load cart recommendations."
            );
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void load();

      return () => {
        controller
          .abort();
      };
    },
    [
      cartCurrencyCode,
      cartProductIds,
      mode,
    ]
  );

  const scrollCarousel =
    (
      direction:
        "LEFT" |
        "RIGHT"
    ) => {
      const element =
        carouselRef.current;

      if (
        !element
      ) {
        return;
      }

      element.scrollBy({
        left:
          direction ===
          "LEFT"
            ? -520
            : 520,

        behavior:
          "smooth",
      });
    };

  const addSuggestion =
    (
      suggestion:
        PublicProductAttachmentSuggestion
    ) => {
      const product =
        suggestion.product;

      const variant =
        product.variant;

      const price =
        product.price;

      const existingQuantity =
        cartQuantityByVariant
          .get(
            variant.id
          ) ||
        0;

      const maximumQuantity =
        suggestion
          .maximumQuantity;

      if (
        maximumQuantity !==
          null &&
        existingQuantity >=
          maximumQuantity
      ) {
        return;
      }

      const requestedQuantity =
        Math.max(
          1,
          Number(
            suggestion
              .minimumQuantity ||
              1
          )
        );

      const allowedQuantity =
        maximumQuantity ===
        null
          ? requestedQuantity
          : Math.max(
              0,
              Math.min(
                requestedQuantity,
                maximumQuantity -
                  existingQuantity
              )
            );

      if (
        allowedQuantity <=
        0
      ) {
        return;
      }

      dispatch(
        addItem({
          key:
            `${product.id}:${variant.id}`,

          productId:
            product.id,

          productSlug:
            product.slug,

          productName:
            product.name,

          variantId:
            variant.id,

          sku:
            variant.sku,

          imageUrl:
            getRecommendationImageUrl(
              product.image
            ),

          unitPrice:
            Number(
              price.sellingPrice
            ),

          compareAtPrice:
            price.compareAtPrice ===
              null ||
            price.compareAtPrice ===
              undefined
              ? null
              : Number(
                  price.compareAtPrice
                ),

          currencyCode:
            price.currencyCode ||
            cartCurrencyCode,

          taxPercent:
            Number(
              product.taxPercent ||
                0
            ),

          isTaxInclusive:
            price.isTaxInclusive !==
            false,

          quantity:
            allowedQuantity,

          extendedWarranty:
            null,

          selectedAttributes:
            [],
        })
      );

      setAddedVariantId(
        variant.id
      );

      window.setTimeout(
        () => {
          setAddedVariantId(
            (
              current
            ) =>
              current ===
              variant.id
                ? null
                : current
          );
        },
        1800
      );
    };

  if (
    !items.length
  ) {
    return null;
  }

  if (
    loading
  ) {
    return (
      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-storefront-text sm:text-3xl">
            {mode ===
            "ATTACHMENT"
              ? "Complete your setup"
              : "You may also need"}
          </h2>

          <p className="mt-1 text-sm text-storefront-muted">
            {mode ===
            "ATTACHMENT"
              ? "Accessories and add-ons selected for the products in your cart."
              : "Smart recommendations based on your cart."}
          </p>
        </div>

        <div className="flex min-h-52 items-center justify-center rounded-[22px] border border-[#D8DDE3] bg-white">
          <div className="flex items-center gap-3 text-sm font-bold text-storefront-muted">
            <LoaderCircle
              size={
                20
              }
              className="animate-spin"
            />

            Loading
            recommendations…
          </div>
        </div>
      </section>
    );
  }

  if (
    error
  ) {
    return (
      <section className="mt-8">
        <div className="flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-[#D8DDE3] bg-white px-6 text-center">
          <PackageSearch
            size={
              30
            }
            className="text-storefront-muted"
          />

          <p className="mt-3 text-sm font-black text-storefront-text">
            Recommendations
            are temporarily
            unavailable
          </p>

          <p className="mt-2 text-xs text-storefront-muted">
            {
              error
            }
          </p>
        </div>
      </section>
    );
  }

  if (
    !suggestions.length
  ) {
    /*
     * No relevant manual or automatic recommendations
     * were found for the current cart.
     */
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              size={
                18
              }
              className="text-storefront-primary"
            />

            <p className="text-xs font-black uppercase tracking-[0.15em] text-storefront-primary">
              {mode ===
              "ATTACHMENT"
                ? "Recommended add-ons"
                : "Smart suggestions"}
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-black text-storefront-text sm:text-3xl">
            {mode ===
            "ATTACHMENT"
              ? "Complete your setup"
              : "You may also need"}
          </h2>

          <p className="mt-1 text-sm text-storefront-muted">
            {mode ===
            "ATTACHMENT"
              ? "Accessories and add-ons selected for the products in your cart."
              : "Recommended products automatically selected based on your cart."}
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() =>
              scrollCarousel(
                "LEFT"
              )
            }
            aria-label="Previous recommendations"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8DDE3] bg-white text-storefront-text transition hover:border-storefront-primary hover:text-storefront-primary"
          >
            <ArrowLeft
              size={
                16
              }
            />
          </button>

          <button
            type="button"
            onClick={() =>
              scrollCarousel(
                "RIGHT"
              )
            }
            aria-label="Next recommendations"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8DDE3] bg-white text-storefront-text transition hover:border-storefront-primary hover:text-storefront-primary"
          >
            <ArrowRight
              size={
                16
              }
            />
          </button>
        </div>
      </div>

      <div
        ref={
          carouselRef
        }
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {suggestions.map(
          (
            suggestion
          ) => {
            const product =
              suggestion
                .product;

            const price =
              product.price;

              const imageUrl =
              mode ===
              "ATTACHMENT"
                ? getAssetUrl(
                    product.image
                  )
                : getRecommendationImageUrl(
                    product.image
                  );

            const currentCartQuantity =
              cartQuantityByVariant
                .get(
                  product
                    .variant
                    .id
                ) ||
              0;

            const maximumQuantity =
              suggestion
                .maximumQuantity;

            const reachedMaximum =
              maximumQuantity !==
                null &&
              currentCartQuantity >=
                maximumQuantity;

            const wasJustAdded =
              addedVariantId ===
              product
                .variant
                .id;

            return (
              <article
                key={
                  `${suggestion.ruleId}:${product.id}`
                }
                className={[
                  "flex shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[#D8DDE3] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  mode ===
                  "ATTACHMENT"
                    ? "w-[210px] sm:w-[225px]"
                    : "w-[210px] sm:w-[230px] lg:w-[240px]",
                ].join(
                  " "
                )}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-square overflow-hidden bg-storefront-background">
                    {imageUrl ? (
                      <img
                        src={
                          imageUrl
                        }
                        alt={
                          product.name
                        }
                        loading="lazy"
                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-storefront-muted">
                        No product
                        image
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-storefront-primary">
                    {mode ===
                    "ATTACHMENT"
                      ? relationshipLabel(
                          suggestion
                            .relationshipType
                        )
                      : "You may also like"}
                  </p>

                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-5 text-storefront-text hover:text-storefront-primary"
                  >
                    {
                      product.name
                    }
                  </Link>

                  {product.brand
                    ?.name ? (
                    <p className="mt-1 truncate text-xs text-storefront-muted">
                      {
                        product
                          .brand
                          .name
                      }
                    </p>
                  ) : null}

                  <div className="mt-3">
                  <StorefrontMoney
                        amount={
                          Number(
                            price.sellingPrice
                          )
                        }
                        currencyCode={
                          price.currencyCode ||
                          cartCurrencyCode
                        }
                        className="text-sm font-black text-storefront-text sm:text-base"
                      />

                    {price.compareAtPrice !==
                      null &&
                    Number(
                      price.compareAtPrice
                    ) >
                      Number(
                        price.sellingPrice
                      ) ? (
                      <span className="mt-1 block text-xs font-semibold text-storefront-muted line-through">
                        {price.compareAtPrice !==
                                      null &&
                                    Number(
                                      price.compareAtPrice
                                    ) >
                                      Number(
                                        price.sellingPrice
                                      ) ? (
                                      <StorefrontMoney
                                        amount={
                                          Number(
                                            price.compareAtPrice
                                          )
                                        }
                                        currencyCode={
                                          price.currencyCode ||
                                          cartCurrencyCode
                                        }
                                        className="mt-1 block text-xs font-semibold text-storefront-muted line-through"
                                      />
                                    ) : null}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <button
                      type="button"
                      disabled={
                        reachedMaximum
                      }
                      onClick={() =>
                        addSuggestion(
                          suggestion
                        )
                      }
                      className={[
                        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-storefront-button px-2 text-xs font-black transition",
                        reachedMaximum
                          ? "cursor-not-allowed bg-storefront-secondary text-storefront-muted"
                          : wasJustAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-storefront-primary text-white hover:opacity-90",
                      ].join(
                        " "
                      )}
                    >
                      {wasJustAdded ? (
                        <>
                          <Check
                            size={
                              14
                            }
                          />

                          Added
                        </>
                      ) : reachedMaximum ? (
                        <>
                          <Check
                            size={
                              14
                            }
                          />

                          In cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart
                            size={
                              14
                            }
                          />

                          Add
                        </>
                      )}
                    </button>

                    <Link
                      href={`/products/${product.slug}`}
                      aria-label={`View ${product.name}`}
                      title="View product"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-storefront-button border border-[#D8DDE3] bg-white text-storefront-text transition hover:border-storefront-primary hover:text-storefront-primary"
                    >
                      <ExternalLink
                        size={
                          14
                        }
                      />
                    </Link>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}
