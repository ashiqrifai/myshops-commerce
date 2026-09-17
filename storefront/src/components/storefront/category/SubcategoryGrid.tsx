"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

import {
  useRef,
} from "react";

import type {
  PublicCategory,
} from "@/types/publicCategory";

const getImageUrl = (
  category: PublicCategory
) =>
  category.thumbnailAsset
    ?.variants?.find(
      (variant) =>
        variant.variantType ===
        "SMALL"
    )?.publicUrl ||
  category.thumbnailAsset
    ?.variants?.find(
      (variant) =>
        variant.variantType ===
        "THUMBNAIL"
    )?.publicUrl ||
  category.thumbnailAsset
    ?.publicUrl ||
  category.image
    ?.publicUrl ||
  null;

export default function SubcategoryGrid({
  categories,
}: {
  categories:
    PublicCategory[];
}) {
  const carouselRef =
    useRef<HTMLDivElement | null>(
      null
    );

  if (
    !categories.length
  ) {
    return null;
  }

  const scrollCarousel = (
    direction:
      | "LEFT"
      | "RIGHT"
  ) => {
    const element =
      carouselRef.current;

    if (!element) {
      return;
    }

    /*
     * Smaller cards mean we can
     * comfortably move around
     * 5-6 cards at a time.
     */
    const scrollAmount =
      Math.min(
        element.clientWidth *
          0.75,
        680
      );

    element.scrollBy({
      left:
        direction ===
        "LEFT"
          ? -scrollAmount
          : scrollAmount,

      behavior:
        "smooth",
    });
  };

  return (
    <section className="mt-8">
      {/*
      |--------------------------------------------------------------------------
      | Header
      |--------------------------------------------------------------------------
      */}

      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-storefront-primary">
            Explore more
          </p>

          <h2 className="mt-1 text-[22px] font-bold leading-tight text-storefront-text">
            Subcategories
          </h2>
        </div>

        {categories.length >
        1 ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                scrollCarousel(
                  "LEFT"
                )
              }
              aria-label="Previous subcategories"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-storefront-border-light bg-storefront-surface text-storefront-text transition hover:bg-storefront-secondary"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                scrollCarousel(
                  "RIGHT"
                )
              }
              aria-label="Next subcategories"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-storefront-border-light bg-storefront-surface text-storefront-text transition hover:bg-storefront-secondary"
            >
              <ChevronRight
                size={17}
              />
            </button>
          </div>
        ) : null}
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Subcategory Carousel
      |--------------------------------------------------------------------------
      */}

      <div
        ref={
          carouselRef
        }
        className={[
          "flex gap-2.5 overflow-x-auto pb-2",
          "scroll-smooth",
          "[scrollbar-width:none]",
          "[-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden",
        ].join(
          " "
        )}
      >
        {categories.map(
          (
            category
          ) => {
            const imageUrl =
              getImageUrl(
                category
              );

            return (
              <Link
                key={
                  category.id
                }
                href={`/category/${category.slug}`}
                prefetch={
                  false
                }
                className={[
                  "group shrink-0",

                  /*
                   * Compact card width
                   */
                  "w-[120px]",
                  "sm:w-[128px]",
                  "lg:w-[136px]",

                  "overflow-hidden",
                  "rounded-xl",

                  "border",
                  "border-storefront-border-light",

                  "bg-storefront-surface",

                  "transition",
                  "duration-200",

                  "hover:-translate-y-0.5",
                  "hover:border-[#D8DDE3]",
                  "hover:shadow-sm",
                ].join(
                  " "
                )}
              >
                {/*
                |--------------------------------------------------------------------------
                | Image
                |--------------------------------------------------------------------------
                */}

                <div
                  className={[
                    "flex",
                    "h-[76px]",
                    "items-center",
                    "justify-center",
                    "overflow-hidden",
                    "bg-white",

                    "sm:h-[80px]",
                    "lg:h-[84px]",
                  ].join(
                    " "
                  )}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        imageUrl
                      }
                      alt={
                        category.name
                      }
                      className="h-full w-full object-contain p-2.5 transition duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <ImageIcon
                      size={
                        22
                      }
                      className="text-storefront-muted"
                    />
                  )}
                </div>

                {/*
                |--------------------------------------------------------------------------
                | Label
                |--------------------------------------------------------------------------
                */}

                <div className="flex min-h-[44px] items-center justify-center px-2 py-2">
                  <p className="line-clamp-2 text-center text-[11px] font-bold leading-[14px] text-storefront-text sm:text-xs">
                    {
                      category.name
                    }
                  </p>
                </div>
              </Link>
            );
          }
        )}
      </div>
    </section>
  );
}