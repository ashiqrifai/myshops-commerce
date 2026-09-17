"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

import {
  useRef,
} from "react";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface ProductCarouselSectionProps {
  section:
    StorefrontSection;
}

interface ProductCarouselSettings {
  maximumProducts?:
    number;

  itemLimit?:
    number;

  limit?:
    number;

  showPrice?:
    boolean;

  showBrand?:
    boolean;

  showWishlist?:
    boolean;

  showAddToCart?:
    boolean;

  showNavigation?:
    boolean;
}

interface ProductCarouselContent {
  title?:
    string;

  subtitle?:
    string;

  /*
  |--------------------------------------------------------------------------
  | View All
  |--------------------------------------------------------------------------
  |
  | viewAllResolvedUrl can be supplied by the backend.
  | viewAllUrl can be configured directly in the CMS section content.
  |
  | Example:
  | Bestsellers -> /products/bestsellers
  |--------------------------------------------------------------------------
  */

  viewAllUrl?:
    string | null;

  viewAllResolvedUrl?:
    string | null;

  productIdsResolved?: Array<
    Record<
      string,
      unknown
    > & {
      id:
        string;
    }
  >;
}

/*
|--------------------------------------------------------------------------
| Responsive Product Card Width
|--------------------------------------------------------------------------
|
| Mobile       = 2 cards
| Small        = 2 cards
| Tablet       = 3 cards
| Desktop      = 6 cards
|--------------------------------------------------------------------------
*/

function getCardWidthClasses() {
  return [
    /*
     * Mobile:
     * 2 compact cards visible.
     */
    "basis-[calc(50%-0.375rem)]",

    /*
     * Small screens:
     * still 2 cards.
     */
    "sm:basis-[calc(50%-0.5rem)]",

    /*
     * Tablet:
     * 3 cards.
     */
    "md:basis-[calc(33.333%-0.75rem)]",

    /*
     * Desktop:
     * 6 cards.
     */
    "lg:basis-[calc(16.666%-0.84rem)]",
  ].join(
    " "
  );
}

export default function ProductCarouselSection({
  section,
}: ProductCarouselSectionProps) {
  const scrollerRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | Content
  |--------------------------------------------------------------------------
  */

  const content =
    (section.content ||
      {}) as ProductCarouselContent;

  /*
  |--------------------------------------------------------------------------
  | Settings
  |--------------------------------------------------------------------------
  */

  const settings =
    (section.settings ||
      {}) as ProductCarouselSettings;

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
          settings.itemLimit ||
          settings.limit ||
          products.length ||
          12
      )
    );

  const visibleProducts =
    products.slice(
      0,
      maximumProducts
    );

  /*
  |--------------------------------------------------------------------------
  | View All URL
  |--------------------------------------------------------------------------
  |
  | Priority:
  |
  | 1. Backend resolved URL
  | 2. CMS configured URL
  | 3. Existing /products fallback
  |
  | Your Bestsellers CMS section now contains:
  |
  | viewAllUrl: "/products/bestsellers"
  |
  | Therefore only Bestsellers will use that URL.
  | Other carousels without a configured URL continue to /products.
  |--------------------------------------------------------------------------
  */

  const viewAllUrl =
    content
      .viewAllResolvedUrl
      ?.trim() ||
    content
      .viewAllUrl
      ?.trim() ||
    "/products";

  /*
  |--------------------------------------------------------------------------
  | Empty Section
  |--------------------------------------------------------------------------
  */

  if (
    visibleProducts.length ===
    0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Scroll
  |--------------------------------------------------------------------------
  */

  const scroll = (
    direction:
      | "left"
      | "right"
  ) => {
    const scroller =
      scrollerRef.current;

    if (
      !scroller
    ) {
      return;
    }

    /*
     * Scroll approximately one visible page.
     */

    const distance =
      Math.max(
        280,

        scroller.clientWidth *
          0.9
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

  return (
    <section
      data-section-id={
        section.id
      }
      data-section-code={
        section.code
      }
      data-section-type={
        section.type.code
      }
      className="w-full min-w-0 overflow-hidden"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1440px] px-3 sm:px-6 lg:px-8">
        {/*
        |--------------------------------------------------------------------------
        | Header
        |--------------------------------------------------------------------------
        */}

        <div className="mb-3 flex min-w-0 items-center justify-between gap-3 sm:mb-4">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-tight text-storefront-text sm:text-[22px]">
              {content.title ||
                "Products"}
            </h2>

            {content.subtitle ? (
              <p className="mt-1 max-w-2xl text-xs leading-5 text-storefront-muted sm:mt-1.5 sm:text-sm">
                {
                  content.subtitle
                }
              </p>
            ) : null}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Desktop / Tablet View All
          |--------------------------------------------------------------------------
          */}

          <Link
            href={
              viewAllUrl
            }
            className="hidden shrink-0 text-sm font-bold text-storefront-primary transition hover:opacity-75 sm:inline"
          >
            View all
          </Link>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Carousel
        |--------------------------------------------------------------------------
        */}

        <div className="group/carousel relative min-w-0 overflow-hidden">
          {/*
          |--------------------------------------------------------------------------
          | Left Arrow
          |--------------------------------------------------------------------------
          */}

          {settings.showNavigation !==
            false &&
          visibleProducts.length >
            1 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "left"
                )
              }
              aria-label="Previous products"
              className={[
                "absolute",
                "left-2",
                "top-1/2",
                "z-20",
                "-translate-y-1/2",

                "hidden",
                "h-10",
                "w-10",
                "items-center",
                "justify-center",

                "rounded-full",
                "border",
                "border-[#D1D5DB]",

                "bg-white/95",
                "text-black",

                "shadow-md",
                "backdrop-blur",

                "transition",
                "hover:scale-105",
                "hover:bg-white",

                /*
                 * Hide carousel arrows on phone.
                 * Finger swipe is cleaner.
                 */
                "sm:flex",
              ].join(
                " "
              )}
            >
              <ChevronLeft
                size={
                  20
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
              "min-w-0",

              "snap-x",
              "snap-mandatory",

              "gap-3",

              "overflow-x-auto",
              "overscroll-x-contain",

              "scroll-smooth",

              "sm:gap-4",

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

                    /*
                     * Mobile card must never
                     * exceed carousel width.
                     */
                    "max-w-full",

                    getCardWidthClasses(),
                  ].join(
                    " "
                  )}
                >
                  <StorefrontProductCard
                    product={
                      product as never
                    }
                    showPrice={
                      settings.showPrice !==
                      false
                    }
                    showBrand={
                      settings.showBrand !==
                      false
                    }
                    showWishlist={
                      settings.showWishlist !==
                      false
                    }
                    showAddToCart={
                      settings.showAddToCart !==
                      false
                    }
                  />
                </div>
              )
            )}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Right Arrow
          |--------------------------------------------------------------------------
          */}

          {settings.showNavigation !==
            false &&
          visibleProducts.length >
            1 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "right"
                )
              }
              aria-label="Next products"
              className={[
                "absolute",
                "right-2",
                "top-1/2",
                "z-20",
                "-translate-y-1/2",

                "hidden",
                "h-10",
                "w-10",
                "items-center",
                "justify-center",

                "rounded-full",
                "border",
                "border-[#D1D5DB]",

                "bg-white/95",
                "text-black",

                "shadow-md",
                "backdrop-blur",

                "transition",
                "hover:scale-105",
                "hover:bg-white",

                "sm:flex",
              ].join(
                " "
              )}
            >
              <ChevronRight
                size={
                  20
                }
              />
            </button>
          ) : null}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Mobile View All
        |--------------------------------------------------------------------------
        |
        | Uses exactly the same resolved CMS URL as desktop.
        |--------------------------------------------------------------------------
        */}

        <div className="mt-3 sm:hidden">
          <Link
            href={
              viewAllUrl
            }
            className="inline-flex text-[13px] font-bold text-storefront-primary"
          >
            View all products
          </Link>
        </div>
      </div>
    </section>
  );
}