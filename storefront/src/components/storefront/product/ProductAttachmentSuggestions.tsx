"use client";

import Link from "next/link";

import {
  Check,
  ExternalLink,
  LoaderCircle,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAssetUrl,
  getPublicProductAttachments,
} from "@/lib/storefront/product-attachment-api";

import type {
  PublicProductAttachmentSuggestion,
} from "@/lib/storefront/product-attachment-api";

import ExtendedWarrantyDrawer from "@/components/storefront/product/ExtendedWarrantyDrawer";

import type {
  ExtendedWarrantySelection,
} from "@/components/storefront/product/ExtendedWarrantyDrawer";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  addItem,
  selectCartItems,
} from "@/store/slices/cartSlice";

interface ProductAttachmentSuggestionsProps {
  productId:
    string;

  currencyCode?:
    string;

  maximumItems?:
    number;
}

const DIRHAM_SYMBOL_URL =
  "https://api.vkposme.tech/media/eba8444b-69bb-4d13-84cb-1c0a63313075/2137d1fb-2abf-4fa3-b9cb-93b334e16530/original/uae-dirham-1544af84feeea415.png";

const formatAmount = (
  value:
    number
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ||
        0
    )
  );

function StorefrontMoney({
  value,
  currencyCode,
  className =
    "",
}: {
  value:
    number;

  currencyCode:
    string;

  className?:
    string;
}) {
  const normalizedCurrency =
    String(
      currencyCode ||
        "AED"
    )
      .trim()
      .toUpperCase();

  if (
    normalizedCurrency ===
    "AED"
  ) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1",
          className,
        ].join(
          " "
        )}
      >
        <img
          src={
            DIRHAM_SYMBOL_URL
          }
          alt="AED"
          aria-hidden="true"
          className="h-[0.9em] w-auto shrink-0 object-contain"
        />

        <span>
          {
            formatAmount(
              value
            )
          }
        </span>
      </span>
    );
  }

  return (
    <span
      className={
        className
      }
    >
      {new Intl.NumberFormat(
        "en-AE",
        {
          style:
            "currency",

          currency:
            normalizedCurrency,

          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        }
      ).format(
        Number(
          value ||
            0
        )
      )}
    </span>
  );
}

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

export default function ProductAttachmentSuggestions({
  productId,
  currencyCode =
    "AED",
  maximumItems =
    8,
}: ProductAttachmentSuggestionsProps) {
  const dispatch =
    useAppDispatch();

  const cartItems =
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
      true
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

  const [
    pendingSuggestion,
    setPendingSuggestion,
  ] =
    useState<
      PublicProductAttachmentSuggestion |
      null
    >(
      null
    );

  const [
    warrantyDrawerOpen,
    setWarrantyDrawerOpen,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      const load =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              null
            );

            const response =
              await getPublicProductAttachments({
                productId,

                displayLocation:
                  "PRODUCT_DETAIL",

                channelCode:
                  "WEBSITE",

                currencyCode,

                limit:
                  maximumItems,

                signal:
                  controller
                    .signal,
              });

            setSuggestions(
              response
                .data
                .suggestions ||
                []
            );
          } catch (
            requestError
          ) {
            if (
              controller
                .signal
                .aborted
            ) {
              return;
            }

            setError(
              requestError instanceof
                Error
                ? requestError
                    .message
                : "Unable to load recommendations."
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
      productId,
      currencyCode,
      maximumItems,
    ]
  );

  const cartQuantityByVariant =
    useMemo(
      () =>
        new Map(
          cartItems.map(
            (
              item
            ) => [
              item.variantId,
              item.quantity,
            ]
          )
        ),
      [
        cartItems,
      ]
    );

  const markAdded =
    (
      variantId:
        string
    ) => {
      setAddedVariantId(
        variantId
      );

      window.setTimeout(
        () => {
          setAddedVariantId(
            (
              current
            ) =>
              current ===
                variantId
                ? null
                : current
          );
        },
        1800
      );
    };

  const addSuggestionToCart =
    (
      suggestion:
        PublicProductAttachmentSuggestion,

      extendedWarranty:
        ExtendedWarrantySelection |
        null
    ) => {
      const product =
        suggestion.product;

      const variant =
        product.variant;

      const price =
        product.price;

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
            getAssetUrl(
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
            currencyCode,

          taxPercent:
            Number(
              product.taxPercent ||
                0
            ),

          isTaxInclusive:
            price.isTaxInclusive !==
            false,

          quantity:
            Math.max(
              1,
              Number(
                suggestion
                  .minimumQuantity ||
                  1
              )
            ),

          extendedWarranty,

          selectedAttributes:
            [],
        })
      );

      markAdded(
        variant.id
      );
    };

  const addSuggestion =
    (
      suggestion:
        PublicProductAttachmentSuggestion
    ) => {
      setPendingSuggestion(
        suggestion
      );

      setWarrantyDrawerOpen(
        true
      );
    };

  const closeWarrantyDrawer =
    () => {
      setWarrantyDrawerOpen(
        false
      );

      setPendingSuggestion(
        null
      );
    };

  const continueWithoutWarranty =
    () => {
      if (
        pendingSuggestion
      ) {
        addSuggestionToCart(
          pendingSuggestion,
          null
        );
      }

      closeWarrantyDrawer();
    };

  const addWithWarranty =
    (
      selection:
        ExtendedWarrantySelection
    ) => {
      if (
        pendingSuggestion
      ) {
        addSuggestionToCart(
          pendingSuggestion,
          selection
        );
      }

      closeWarrantyDrawer();
    };

  if (
    loading
  ) {
    return (
      <section className="mt-8 rounded-[22px] border border-[#d9dde3] bg-storefront-surface px-5 py-7 sm:px-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-storefront-muted">
          <LoaderCircle
            size={
              18
            }
            className="animate-spin"
          />

          Loading recommendations…
        </div>
      </section>
    );
  }

  if (
    error
  ) {
    /*
     * Recommendations should never block
     * the product purchase experience.
     * Hide the section on API failure.
     */
    return null;
  }

  if (
    !suggestions.length
  ) {
    return null;
  }

  const pendingProduct =
    pendingSuggestion
      ?.product ||
    null;

  const pendingPrice =
    pendingProduct
      ?.price ||
    null;

  const pendingImageUrl =
    pendingProduct
      ? getAssetUrl(
          pendingProduct.image
        )
      : null;

  const pendingQuantity =
    pendingSuggestion
      ? Math.max(
          1,
          Number(
            pendingSuggestion
              .minimumQuantity ||
              1
          )
        )
      : 1;

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-[18px] border border-[#d9dde3] bg-storefront-surface">
        <div className="border-b border-[#d9dde3] px-4 py-3.5 sm:px-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
              <Sparkles
                size={
                  19
                }
              />
            </div>

            <div>
              <h2 className="text-base font-black text-storefront-text">
                Complete your
                setup
              </h2>

              <p className="mt-1 text-sm leading-6 text-storefront-muted">
                Recommended
                products that
                work well with
                your selection.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">
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
                getAssetUrl(
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
                  className="flex min-w-0 max-w-[260px] flex-col rounded-[14px] border border-[#d9dde3] bg-storefront-background p-2.5 transition hover:shadow-sm"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[14px] bg-white">
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

                  <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-storefront-primary">
                      {relationshipLabel(
                        suggestion
                          .relationshipType
                      )}
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
                      <p className="mt-1 text-xs text-storefront-muted">
                        {
                          product
                            .brand
                            .name
                        }
                      </p>
                    ) : null}

                    <div className="mt-3">
                      <span className="text-base font-black text-storefront-text">
                        <StorefrontMoney
                          value={
                            Number(
                              price.sellingPrice
                            )
                          }
                          currencyCode={
                            price.currencyCode ||
                            currencyCode
                          }
                        />
                      </span>

                      {price.compareAtPrice !==
                        null &&
                      Number(
                        price.compareAtPrice
                      ) >
                        Number(
                          price.sellingPrice
                        ) ? (
                        <span className="ml-2 text-xs font-semibold text-storefront-muted line-through">
                          <StorefrontMoney
                            value={
                              Number(
                                price.compareAtPrice
                              )
                            }
                            currencyCode={
                              price.currencyCode ||
                              currencyCode
                            }
                          />
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
                          "flex h-10 flex-1 items-center justify-center gap-2 rounded-storefront-button px-3 text-xs font-black transition",
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
                                15
                              }
                            />

                            Added
                          </>
                        ) : reachedMaximum ? (
                          <>
                            <Check
                              size={
                                15
                              }
                            />

                            In cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart
                              size={
                                15
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-storefront-button border border-[#d9dde3] bg-storefront-surface text-storefront-text transition hover:border-[#bfc5cc] hover:text-storefront-primary"
                      >
                        <ExternalLink
                          size={
                            15
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

      {pendingSuggestion &&
      pendingProduct &&
      pendingPrice ? (
        <ExtendedWarrantyDrawer
          open={
            warrantyDrawerOpen
          }
          onClose={
            closeWarrantyDrawer
          }
          onContinueWithoutWarranty={
            continueWithoutWarranty
          }
          onWarrantyAdded={
            addWithWarranty
          }
          productId={
            pendingProduct.id
          }
          variantId={
            pendingProduct
              .variant
              .id
          }
          productName={
            pendingProduct.name
          }
          imageUrl={
            pendingImageUrl
          }
          productPrice={
            Number(
              pendingPrice
                .sellingPrice
            )
          }
          currencyCode={
            pendingPrice
              .currencyCode ||
            currencyCode
          }
          quantity={
            pendingQuantity
          }
        />
      ) : null}
    </>
  );
}
