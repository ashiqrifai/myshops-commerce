"use client";

import {
  Heart,
  ImageIcon,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import Link from "next/link";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  addItem,
} from "@/store/slices/cartSlice";

import {
  removeRecentlyViewed,
  selectRecentlyViewedHydrated,
  selectRecentlyViewedItems,
} from "@/store/slices/recentlyViewedSlice";

import {
  toggleWishlistItem,
  selectWishlistItems,
} from "@/store/slices/wishlistSlice";

interface RecentlyViewedSectionProps {
  excludeProductId?:
    string;

  title?:
    string;

  maximumItems?:
    number;
}

const formatMoney = (
  value:
    | number
    | null,
  currencyCode:
    string
) => {
  if (
    value === null ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return null;
  }

  return new Intl
    .NumberFormat(
      "en-AE",
      {
        style:
          "currency",

        currency:
          currencyCode ||
          "AED",

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    )
    .format(
      Number(value)
    );
};

export default function RecentlyViewedSection({
  excludeProductId,
  title =
    "Recently Viewed",
  maximumItems =
    6,
}: RecentlyViewedSectionProps) {
  const dispatch =
    useAppDispatch();

  const hydrated =
    useAppSelector(
      selectRecentlyViewedHydrated
    );

  const wishlistItems =
    useAppSelector(
      selectWishlistItems
    );

  const items =
    useAppSelector(
      selectRecentlyViewedItems
    )
      .filter(
        (item) =>
          item.productId !==
          excludeProductId
      )
      .slice(
        0,
        Math.max(
          1,
          maximumItems
        )
      );

  if (
    !hydrated ||
    !items.length
  ) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
            Your browsing history
          </p>

          <h2 className="mt-2 text-2xl font-black text-storefront-text sm:text-3xl">
            {
              title
            }
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {items.map(
          (item) => {
            const isWishlisted =
              wishlistItems.some(
                (
                  wishlistItem
                ) =>
                  wishlistItem.productId ===
                  item.productId
              );

            const productUrl =
              `/products/${item.productSlug}`;

            const sellingPrice =
              formatMoney(
                item.unitPrice,
                item.currencyCode
              );

            const compareAtPrice =
              formatMoney(
                item.compareAtPrice,
                item.currencyCode
              );

            const hasDiscount =
              item.compareAtPrice !==
                null &&
              item.unitPrice !==
                null &&
              item.compareAtPrice >
                item.unitPrice;

            const canAddToCart =
              Boolean(
                item.variantId &&
                item.sku
              ) &&
              item.unitPrice !==
                null;

            return (
              <article
                key={
                  item.productId
                }
                className="group relative flex min-w-0 flex-col overflow-hidden rounded-storefront-card border border-storefront bg-storefront-surface transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative">
                  <Link
                    href={
                      productUrl
                    }
                    className="flex aspect-square items-center justify-center overflow-hidden bg-white p-4"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          item.imageUrl
                        }
                        alt={
                          item.productName
                        }
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImageIcon
                        size={
                          34
                        }
                        className="text-storefront-muted"
                      />
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        toggleWishlistItem({
                          productId:
                            item.productId,

                          productSlug:
                            item.productSlug,

                          productName:
                            item.productName,

                          productType:
                            item.productType,

                          imageUrl:
                            item.imageUrl,

                          brandName:
                            item.brandName,

                          categoryName:
                            item.categoryName,

                          variantId:
                            item.variantId,

                          sku:
                            item.sku,

                          unitPrice:
                            item.unitPrice,

                          compareAtPrice:
                            item.compareAtPrice,

                          currencyCode:
                            item.currencyCode,

                          taxPercent:
                            item.taxPercent,

                          isTaxInclusive:
                            item.isTaxInclusive,

                          addedAt:
                            new Date()
                              .toISOString(),
                        })
                      )
                    }
                    aria-pressed={
                      isWishlisted
                    }
                    aria-label={
                      isWishlisted
                        ? `Remove ${item.productName} from wishlist`
                        : `Add ${item.productName} to wishlist`
                    }
                    className={[
                      "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition",
                      isWishlisted
                        ? "border-storefront-primary bg-storefront-primary text-white"
                        : "border-black/10 bg-white/95 text-storefront-text hover:bg-storefront-primary hover:text-white",
                    ].join(
                      " "
                    )}
                  >
                    <Heart
                      size={
                        17
                      }
                      fill={
                        isWishlisted
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {item.brandName ? (
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-storefront-muted">
                      {
                        item.brandName
                      }
                    </p>
                  ) : null}

                  <Link
                    href={
                      productUrl
                    }
                    className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-storefront-text hover:text-storefront-primary"
                  >
                    {
                      item.productName
                    }
                  </Link>

                  {item.variantName ? (
                    <p className="mt-1 line-clamp-1 text-xs text-storefront-muted">
                      {
                        item.variantName
                      }
                    </p>
                  ) : null}

                  <div className="mt-auto pt-3">
                    {sellingPrice ? (
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-black text-storefront-text">
                          {
                            sellingPrice
                          }
                        </span>

                        {hasDiscount &&
                        compareAtPrice ? (
                          <span className="text-[10px] text-storefront-muted line-through">
                            {
                              compareAtPrice
                            }
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-storefront-muted">
                        Price unavailable
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-[1fr_38px] gap-2">
                      <button
                        type="button"
                        disabled={
                          !canAddToCart
                        }
                        onClick={() => {
                          if (
                            !item.variantId ||
                            !item.sku ||
                            item.unitPrice ===
                              null
                          ) {
                            return;
                          }

                          dispatch(
                            addItem({
                              key:
                                `${item.productId}:${item.variantId}:STANDARD`,

                              productId:
                                item.productId,

                              productSlug:
                                item.productSlug,

                              productName:
                                item.productName,

                              variantId:
                                item.variantId,

                              sku:
                                item.sku,

                              imageUrl:
                                item.imageUrl,

                              unitPrice:
                                item.unitPrice,

                              compareAtPrice:
                                item.compareAtPrice,

                              currencyCode:
                                item.currencyCode,

                              taxPercent:
                                item.taxPercent,

                              isTaxInclusive:
                                item.isTaxInclusive,

                              quantity:
                                1,

                              extendedWarranty:
                                null,

                              selectedAttributes:
                                [],
                            })
                          );
                        }}
                        className="flex h-10 items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-3 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShoppingCart
                          size={
                            15
                          }
                        />

                        Add
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            removeRecentlyViewed(
                              item.productId
                            )
                          )
                        }
                        aria-label={`Remove ${item.productName} from recently viewed`}
                        className="flex h-10 items-center justify-center rounded-storefront-button border border-storefront bg-white text-storefront-muted hover:text-red-600"
                      >
                        <Trash2
                          size={
                            15
                          }
                        />
                      </button>
                    </div>
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
