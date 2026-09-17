"use client";

import Link from "next/link";

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

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Carousel Scroll
  |--------------------------------------------------------------------------
  */

  const scroll = (
    direction:
      | "left"
      | "right"
  ) => {
    const scroller =
      scrollerRef.current;

    if (!scroller) {
      return;
    }

    const distance =
      Math.max(
        280,
        scroller.clientWidth *
          0.8
      );

    scroller.scrollBy({
      left:
        direction ===
        "left"
          ? -distance
          : distance,

      behavior:
        "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const showNavigation =
    settings.showNavigation !==
      false &&
    visibleProducts.length >
      1;

  /*
  |--------------------------------------------------------------------------
  | View All
  |--------------------------------------------------------------------------
  */

  const showViewAll =
    settings.showViewAll !==
    false;

  const viewAllLabel =
    content.viewAllLabel?.trim() ||
    "View All";

  const viewAllUrl =
    content.viewAllUrl?.trim() ||
    "";

  return (
    <div className="w-full">
      {/*
      |--------------------------------------------------------------------------
      | View All Header
      |--------------------------------------------------------------------------
      */}

      {showViewAll &&
      viewAllUrl ? (
        <div className="mb-4 flex items-center justify-end">
          <Link
            href={
              viewAllUrl
            }
            className={[
              "group/view-all",
              "inline-flex",
              "items-center",
              "gap-1.5",

              "text-sm",
              "font-bold",
              "text-storefront-text",

              "transition",

              "hover:text-storefront-primary",
            ].join(
              " "
            )}
          >
            <span>
              {
                viewAllLabel
              }
            </span>

            <ChevronRight
              size={
                17
              }
              strokeWidth={
                2
              }
              className="transition-transform duration-200 group-hover/view-all:translate-x-0.5"
            />
          </Link>
        </div>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | Carousel
      |--------------------------------------------------------------------------
      */}

      <div
        className={[
          "group/flash-carousel",
          "relative",
          "w-full",
        ].join(
          " "
        )}
      >
        {/*
        |--------------------------------------------------------------------------
        | Left Navigation
        |--------------------------------------------------------------------------
        */}

        {showNavigation ? (
          <button
            type="button"
            onClick={() =>
              scroll(
                "left"
              )
            }
            aria-label="Previous flash deal products"
            className={[
              "absolute",

              /*
               * Keep arrow slightly inside
               * the white product panel.
               */
              "left-2",

              "top-1/2",
              "z-30",

              "-translate-y-1/2",

              "hidden",
              "h-10",
              "w-10",

              "items-center",
              "justify-center",

              "rounded-full",

              "border",
              "border-[#D9DDE3]",

              "bg-white",
              "text-[#202223]",

              "shadow-sm",

              "transition-all",
              "duration-200",

              "hover:border-[#B8BEC6]",
              "hover:bg-[#F8F9FA]",
              "hover:shadow-md",

              "sm:flex",
            ].join(
              " "
            )}
          >
            <ChevronLeft
              size={
                19
              }
              strokeWidth={
                1.8
              }
            />
          </button>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Product Scroller
        |--------------------------------------------------------------------------
        */}

        <div
          ref={
            scrollerRef
          }
          className={[
            "flex",
            "w-full",

            "snap-x",
            "snap-mandatory",

            "gap-3",
            "overflow-x-auto",

            "scroll-smooth",

            "sm:gap-4",

            /*
             * Hide native scrollbar.
             */
            "[scrollbar-width:none]",
            "[-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden",
          ].join(
            " "
          )}
        >
          {visibleProducts.map(
            (
              product
            ) => (
              <div
                key={
                  product.id
                }
                className={[
                  "min-w-0",
                  "shrink-0",
                  "snap-start",

                  getCardWidthClasses(
                    settings
                  ),
                ].join(
                  " "
                )}
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

        {/*
        |--------------------------------------------------------------------------
        | Right Navigation
        |--------------------------------------------------------------------------
        */}

        {showNavigation ? (
          <button
            type="button"
            onClick={() =>
              scroll(
                "right"
              )
            }
            aria-label="Next flash deal products"
            className={[
              "absolute",

              /*
               * Keep arrow slightly inside
               * the white product panel.
               */
              "right-2",

              "top-1/2",
              "z-30",

              "-translate-y-1/2",

              "hidden",
              "h-10",
              "w-10",

              "items-center",
              "justify-center",

              "rounded-full",

              "border",
              "border-[#D9DDE3]",

              "bg-white",
              "text-[#202223]",

              "shadow-sm",

              "transition-all",
              "duration-200",

              "hover:border-[#B8BEC6]",
              "hover:bg-[#F8F9FA]",
              "hover:shadow-md",

              "sm:flex",
            ].join(
              " "
            )}
          >
            <ChevronRight
              size={
                19
              }
              strokeWidth={
                1.8
              }
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}