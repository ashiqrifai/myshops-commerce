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
  section: StorefrontSection;
}

interface ProductCarouselSettings {
  maximumProducts?: number;
  itemLimit?: number;
  limit?: number;

  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;

  showPrice?: boolean;
  showBrand?: boolean;
  showWishlist?: boolean;
  showAddToCart?: boolean;

  showNavigation?: boolean;
}

interface ProductCarouselContent {
  title?: string;
  subtitle?: string;

  productIdsResolved?: Array<
    Record<string, unknown> & {
      id: string;
    }
  >;
}

function getCardWidthClasses(
  settings:
    ProductCarouselSettings
) {
  const mobileItems =
    Math.max(
      1,
      Number(
        settings.mobileItems ||
          1
      )
    );

  const tabletItems =
    Math.max(
      1,
      Number(
        settings.tabletItems ||
          3
      )
    );

  const desktopItems =
    Math.max(
      1,
      Number(
        settings.desktopItems ||
          5
      )
    );

  const mobileClass =
    mobileItems >= 2
      ? "basis-[calc(50%-0.375rem)]"
      : "basis-[82%]";

  const tabletClass =
    tabletItems >= 4
      ? "sm:basis-[calc(25%-0.75rem)]"
      : tabletItems === 3
        ? "sm:basis-[calc(33.333%-0.75rem)]"
        : "sm:basis-[calc(50%-0.5rem)]";

  const desktopClass =
    desktopItems >= 6
      ? "lg:basis-[calc(16.666%-1rem)]"
      : desktopItems === 5
        ? "lg:basis-[calc(20%-1rem)]"
        : desktopItems === 4
          ? "lg:basis-[calc(25%-0.9375rem)]"
          : desktopItems === 3
            ? "lg:basis-[calc(33.333%-0.875rem)]"
            : "lg:basis-[calc(50%-0.625rem)]";

  return [
    mobileClass,
    tabletClass,
    desktopClass,
  ].join(" ");
}

export default function ProductCarouselSection({
  section,
}: ProductCarouselSectionProps) {
  const scrollerRef =
    useRef<HTMLDivElement>(
      null
    );

  const content =
    (section.content ||
      {}) as ProductCarouselContent;

  const settings =
    (section.settings ||
      {}) as ProductCarouselSettings;

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
        direction === "left"
          ? -distance
          : distance,

      behavior: "smooth",
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
      className="w-full py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-storefront-primary">
              Explore products
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-storefront-text sm:text-3xl">
              {content.title ||
                "Products"}
            </h2>

            {content.subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted sm:text-base">
                {content.subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/products"
              className="mr-1 hidden text-sm font-bold text-storefront-primary transition hover:opacity-75 sm:inline"
            >
              View all
            </Link>

            {settings.showNavigation !==
            false ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    scroll("left")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-storefront bg-storefront-surface text-storefront-text transition hover:bg-storefront-muted/10"
                  aria-label="Previous products"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-storefront bg-storefront-surface text-storefront-text transition hover:bg-storefront-muted/10"
                  aria-label="Next products"
                >
                  <ChevronRight
                    size={20}
                  />
                </button>
              </>
            ) : null}
          </div>
        </div>

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
                ].join(" ")}
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

        <div className="mt-3 sm:hidden">
          <Link
            href="/products"
            className="text-sm font-bold text-storefront-primary"
          >
            View all products
          </Link>
        </div>
      </div>
    </section>
  );
}
