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

/*
|--------------------------------------------------------------------------
| Category Image
|--------------------------------------------------------------------------
|
| Prefer the original/public category image so the larger cards do not
| stretch the SMALL/THUMBNAIL variant unnecessarily.
|
|--------------------------------------------------------------------------
*/

const getImageUrl = (
  category: PublicCategory
) =>
  category.thumbnailAsset
    ?.publicUrl ||
  category.image
    ?.publicUrl ||
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

    const scrollAmount =
      Math.min(
        element.clientWidth *
          0.75,
        760
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
                   * Keep the wider card
                   * introduced in the
                   * previous version.
                   */
                  "w-[132px]",
                  "sm:w-[142px]",
                  "lg:w-[152px]",

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
                |
                | The image remains large,
                | but the image section is
                | shorter so there is less
                | empty vertical whitespace
                | before the category name.
                |
                |--------------------------------------------------------------------------
                */}

                <div
                  className={[
                    "flex",

                    /*
                     * Reduced from
                     * 118 / 125 / 132
                     */
                    "h-[106px]",
                    "sm:h-[112px]",
                    "lg:h-[116px]",

                    /*
                     * Keep image visually
                     * closer to the label.
                     */
                    "items-end",
                    "justify-center",

                    "overflow-hidden",
                    "bg-white",
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
                      className={[
                        "h-full",
                        "w-full",

                        "object-contain",

                        /*
                         * Small horizontal/top
                         * breathing room with
                         * almost no bottom gap.
                         */
                        "px-1",
                        "pt-1",
                        "pb-0",

                        "transition",
                        "duration-200",

                        "group-hover:scale-105",
                      ].join(
                        " "
                      )}
                    />
                  ) : (
                    <ImageIcon
                      size={
                        30
                      }
                      className="mb-2 text-storefront-muted"
                    />
                  )}
                </div>

                {/*
                |--------------------------------------------------------------------------
                | Label
                |--------------------------------------------------------------------------
                |
                | Reduced label height and
                | top/bottom padding.
                |
                |--------------------------------------------------------------------------
                */}

                <div
                  className={[
                    "flex",
                    "min-h-[40px]",
                    "items-center",
                    "justify-center",

                    "px-2",
                    "py-1",
                  ].join(
                    " "
                  )}
                >
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