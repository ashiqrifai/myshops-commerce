"use client";

import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem } from "@/store/slices/cartSlice";
import {
  clearWishlist,
  removeWishlistItem,
  selectWishlistHydrated,
  selectWishlistItems,
} from "@/store/slices/wishlistSlice";

const money = (value: number | null, currency: string) => {
  if (value == null) return "Price unavailable";

  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: currency || "AED",
  }).format(value);
};

export default function WishlistContent() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectWishlistItems);
  const hydrated = useAppSelector(selectWishlistHydrated);

  if (!hydrated) {
    return (
      <div className="rounded-[22px] border border-storefront bg-storefront-surface px-6 py-20 text-center text-sm text-storefront-muted">
        Loading wishlist...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-storefront bg-storefront-surface px-6 py-20 text-center">
        <Heart
          size={44}
          className="mx-auto text-storefront-primary"
        />
        <h2 className="mt-5 text-xl font-black text-storefront-text">
          Your wishlist is empty
        </h2>
        <p className="mt-2 text-sm text-storefront-muted">
          Save products and return to them later.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-black text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-storefront-muted">
          {items.length} saved {items.length === 1 ? "product" : "products"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear your wishlist?")) {
              dispatch(clearWishlist());
            }
          }}
          className="text-sm font-bold text-storefront-primary"
        >
          Clear wishlist
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const canMove =
            Boolean(item.variantId && item.sku) &&
            item.unitPrice !== null;

          return (
            <article
              key={item.productId}
              className="flex h-full flex-col overflow-hidden rounded-storefront-card border border-storefront bg-storefront-surface"
            >
              <Link
                href={`/products/${item.productSlug}`}
                className="flex aspect-square items-center justify-center bg-white p-5"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Heart size={40} className="text-storefront-muted" />
                )}
              </Link>

              <div className="flex flex-1 flex-col p-4">
                {item.brandName ? (
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-storefront-muted">
                    {item.brandName}
                  </p>
                ) : null}

                <Link
                  href={`/products/${item.productSlug}`}
                  className="mt-1 line-clamp-2 min-h-11 text-sm font-black text-storefront-text"
                >
                  {item.productName}
                </Link>

                {item.sku ? (
                  <p className="mt-1 text-xs text-storefront-muted">
                    {item.sku}
                  </p>
                ) : null}

                <div className="mt-auto pt-4">
                  <p className="text-lg font-black">
                    {money(item.unitPrice, item.currencyCode)}
                  </p>

                  <div className="mt-4 grid grid-cols-[1fr_44px] gap-2">
                    <button
                      type="button"
                      disabled={!canMove}
                      onClick={() => {
                        if (
                          !item.variantId ||
                          !item.sku ||
                          item.unitPrice === null
                        ) {
                          return;
                        }

                        dispatch(
                          addItem({
                            key: `${item.productId}:${item.variantId}:STANDARD`,
                            productId: item.productId,
                            productSlug: item.productSlug,
                            productName: item.productName,
                            variantId: item.variantId,
                            sku: item.sku,
                            imageUrl: item.imageUrl,
                            unitPrice: item.unitPrice,
                            compareAtPrice: item.compareAtPrice,
                            currencyCode: item.currencyCode,
                            taxPercent: item.taxPercent,
                            isTaxInclusive: item.isTaxInclusive,
                            quantity: 1,
                            extendedWarranty: null,
                            selectedAttributes: [],
                          })
                        );
                      }}
                      className="flex h-11 items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-4 text-xs font-black text-white disabled:opacity-50"
                    >
                      <ShoppingCart size={16} />
                      Move to cart
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        dispatch(removeWishlistItem(item.productId))
                      }
                      className="flex h-11 items-center justify-center rounded-storefront-button border border-storefront text-red-600"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
