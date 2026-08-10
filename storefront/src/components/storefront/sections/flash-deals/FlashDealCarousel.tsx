"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useRef,
} from "react";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import {
  getCardWidthClasses,
} from "./flashDeals.utils";

import type {
  FlashDealsContent,
  FlashDealsSettings,
} from "./flashDeals.utils";

interface FlashDealCarouselProps {
  content:
    FlashDealsContent;

  settings:
    FlashDealsSettings;
}

export default function FlashDealCarousel({
  content,
  settings,
}: FlashDealCarouselProps) {
  const scrollerRef =
    useRef<HTMLDivElement>(
      null
    );

  const products =
    Array.isArray(
      content.productIdsResolved
    )
      ? content.productIdsResolved
      : [];

  const maximumProducts =
    Math.max(
      1,
      Number(
        settings.maximumProducts ||
          products.length ||
          10
      )
    );

  const visibleProducts =
    products.slice(
      0,
      maximumProducts
    );

  if (
    visibleProducts.length ===
    0
  ) {
    return null;
  }

  const scroll = (
    direction:
      | "left"
      | "right"
  ) => {
    const element =
      scrollerRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left:
        direction === "left"
          ? -element.clientWidth *
            0.85
          : element.clientWidth *
            0.85,

      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {settings.showNavigation !==
      false ? (
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              scroll("left")
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-storefront bg-storefront-surface text-storefront-text shadow-sm transition hover:-translate-y-0.5"
            aria-label="Previous flash deals"
          >
            <ChevronLeft
              size={20}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              scroll("right")
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-storefront bg-storefront-surface text-storefront-text shadow-sm transition hover:-translate-y-0.5"
            aria-label="Next flash deals"
          >
            <ChevronRight
              size={20}
            />
          </button>
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4 lg:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleProducts.map(
          (product) => (
            <div
              key={product.id}
              className={[
                "min-w-0 shrink-0 snap-start",
                getCardWidthClasses(
                  settings
                ),
                settings.cardStyle ===
                "SQUARE"
                  ? "[&>*]:rounded-none"
                  : "",
              ].join(" ")}
            >
              <StorefrontProductCard
                product={
                  product as never
                }
                showPrice
                showBrand
                showWishlist
                showAddToCart
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
