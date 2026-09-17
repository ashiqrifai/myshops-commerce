"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface CategoryCarouselSectionProps {
  section:
    StorefrontSection;
}

interface MediaAsset {
  publicUrl?:
    string | null;

  previewUrl?:
    string | null;

  thumbnailUrl?:
    string | null;

  variants?: Array<{
    publicUrl?:
      string | null;

    variantType?:
      string | null;

    isPrimary?:
      boolean;
  }>;
}

interface ResolvedCategory {
  id:
    string;

  name:
    string;

  slug:
    string;

  description?:
    string | null;

  shortDescription?:
    string | null;

  image?:
    MediaAsset | null;

  thumbnailAsset?:
    MediaAsset | null;

  imageAsset?:
    MediaAsset | null;

  bannerAsset?:
    MediaAsset | null;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getPositiveInteger = (
  value:
    unknown,

  fallback:
    number
): number => {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    ) ||
    parsed <=
      0
  ) {
    return fallback;
  }

  return Math.floor(
    parsed
  );
};

/*
|--------------------------------------------------------------------------
| Media URL Resolver
|--------------------------------------------------------------------------
*/

const getAssetUrl = (
  asset?:
    MediaAsset |
    null
): string | null => {
  if (!asset) {
    return null;
  }

  const variants =
    Array.isArray(
      asset.variants
    )
      ? asset.variants
      : [];

  const preferredTypes = [
    "THUMBNAIL",
    "SMALL",
    "PREVIEW",
    "MEDIUM",
  ];

  for (
    const type of
      preferredTypes
  ) {
    const match =
      variants.find(
        (
          variant
        ) =>
          String(
            variant.variantType ||
              ""
          )
            .trim()
            .toUpperCase() ===
            type &&
          Boolean(
            variant.publicUrl
          )
      );

    if (
      match?.publicUrl
    ) {
      return match.publicUrl;
    }
  }

  const primary =
    variants.find(
      (
        variant
      ) =>
        variant.isPrimary &&
        Boolean(
          variant.publicUrl
        )
    );

  if (
    primary?.publicUrl
  ) {
    return primary.publicUrl;
  }

  return (
    asset.thumbnailUrl ||
    asset.previewUrl ||
    asset.publicUrl ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Category Image
|--------------------------------------------------------------------------
*/

const getCategoryImageUrl = (
  category:
    ResolvedCategory
): string | null => {
  return (
    getAssetUrl(
      category.thumbnailAsset
    ) ||
    getAssetUrl(
      category.imageAsset
    ) ||
    getAssetUrl(
      category.image
    ) ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CategoryCarouselSection({
  section,
}: CategoryCarouselSectionProps) {
  const scrollRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | Section Settings
  |--------------------------------------------------------------------------
  */

  const settings =
    section.settings &&
    typeof section.settings ===
      "object" &&
    !Array.isArray(
      section.settings
    )
      ? (
          section.settings as Record<
            string,
            unknown
          >
        )
      : {};

  /*
  |--------------------------------------------------------------------------
  | Section Content
  |--------------------------------------------------------------------------
  */

  const content =
    section.content &&
    typeof section.content ===
      "object" &&
    !Array.isArray(
      section.content
    )
      ? (
          section.content as Record<
            string,
            unknown
          >
        )
      : {};

  /*
  |--------------------------------------------------------------------------
  | Resolved Categories
  |--------------------------------------------------------------------------
  */

  const categories =
    useMemo(
      () => {
        if (
          !Array.isArray(
            content.categoryIdsResolved
          )
        ) {
          return [];
        }

        return (
          content.categoryIdsResolved as
            ResolvedCategory[]
        ).filter(
          (
            category
          ) =>
            Boolean(
              category?.id &&
                category?.name &&
                category?.slug
            )
        );
      },
      [
        content.categoryIdsResolved,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Title / Subtitle
  |--------------------------------------------------------------------------
  */


  const subtitle =
    String(
      content.subtitle ||
        ""
    ).trim();

  /*
  |--------------------------------------------------------------------------
  | Behaviour
  |--------------------------------------------------------------------------
  */

  const showArrows =
    settings.showArrows !==
    false;

  const autoplay =
    settings.autoplay ===
    true;

  const itemsDesktop =
    getPositiveInteger(
      settings.itemsDesktop,
      9
    );

  /*
  |--------------------------------------------------------------------------
  | Scroll
  |--------------------------------------------------------------------------
  */

  const scroll = (
    direction:
      "left" |
      "right"
  ) => {
    const node =
      scrollRef.current;

    if (!node) {
      return;
    }

    node.scrollBy({
      left:
        direction ===
        "left"
          ? -node.clientWidth *
            0.8
          : node.clientWidth *
            0.8,

      behavior:
        "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Autoplay
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !autoplay ||
        categories.length <=
          itemsDesktop
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            const node =
              scrollRef.current;

            if (!node) {
              return;
            }

            const reachedEnd =
              node.scrollLeft +
                node.clientWidth >=
              node.scrollWidth -
                20;

            if (
              reachedEnd
            ) {
              node.scrollTo({
                left:
                  0,

                behavior:
                  "smooth",
              });

              return;
            }

            scroll(
              "right"
            );
          },
          4500
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      autoplay,
      categories.length,
      itemsDesktop,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | No Categories
  |--------------------------------------------------------------------------
  */

  if (
    !categories.length
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

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
      className="w-full lg:pt-4"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">

        {/* Header */}

       

        {/* Carousel Wrapper */}

        <div className="relative">

          {/* Left Arrow */}

          {showArrows &&
          categories.length >
            1 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "left"
                )
              }
              aria-label="Previous categories"
              className={[
                "absolute",
                "-left-4",
                "top-1/2",
                "z-20",
                "hidden",
                "h-9",
                "w-9",
                "-translate-y-1/2",
                "items-center",
                "justify-center",
                "rounded-full",
                "border",
                "border-[#D1D5DB]",
                "bg-white",
                "text-black",
                "shadow-md",
                "transition",
                "hover:bg-[#F9FAFB]",
                "hover:shadow-lg",
                "sm:flex",
              ].join(
                " "
              )}
            >
              <ChevronLeft
                size={
                  18
                }
              />
            </button>
          ) : null}

          {/* Category Carousel */}

          <div
            ref={
              scrollRef
            }
            className={[
              "flex",
              "snap-x",
              "snap-mandatory",
              "gap-2.5",
              "overflow-x-auto",
              "pb-0",
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
                const image =
                  getCategoryImageUrl(
                    category
                  );

                return (
                  <Link
                      key={
                        category.id
                      }
                      href={`/category/${encodeURIComponent(
                        category.slug
                      )}`}
                      prefetch={
                        false
                      }
                      className={[
                      "shrink-0",
                      "snap-start",
                    
                      "w-[118px]",
                      "sm:w-[128px]",
                      "md:w-[135px]",
                      "lg:w-[142px]",
                    
                      "rounded-md",
                      "bg-transparent",
                    
                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-storefront-primary",
                      "focus-visible:ring-offset-2",
                    ].join(
                      " "
                    )}
                  >
                    {/* Image */}

                    <div className="flex h-[92px] w-full items-end justify-center px-2">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            image
                          }
                          alt={
                            category.name
                          }
                          loading="lazy"
                          className={[
                            "object-contain",
                          
                            "h-[78px]",
                            "w-[78px]",
                          
                            "sm:h-[84px]",
                            "sm:w-[84px]",
                          
                            "md:h-[88px]",
                            "md:w-[88px]",
                          
                            "lg:h-[92px]",
                            "lg:w-[92px]",
                          ].join(
                            " "
                          )}
                        />
                      ) : (
                        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-lg bg-white text-storefront-muted">
                          <ImageIcon
                            size={
                              27
                            }
                            strokeWidth={
                              1.5
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Category Name */}

                    <div className="-mt-3 flex min-h-[24px] w-full items-start justify-center px-1">
                        <span className="line-clamp-2 w-full text-center text-[12px] font-medium leading-[15px] text-storefront-text sm:text-[13px] sm:leading-4">
                        {
                          category.name
                        }
                      </span>
                    </div>
                  </Link>
                );
              }
            )}
          </div>

          {/* Right Arrow */}

          {showArrows &&
          categories.length >
            1 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "right"
                )
              }
              aria-label="Next categories"
              className={[
                "absolute",
                "-right-4",
                "top-1/2",
                "z-20",
                "hidden",
                "h-9",
                "w-9",
                "-translate-y-1/2",
                "items-center",
                "justify-center",
                "rounded-full",
                "border",
                "border-[#D1D5DB]",
                "bg-white",
                "text-black",
                "shadow-md",
                "transition",
                "hover:bg-[#F9FAFB]",
                "hover:shadow-lg",
                "sm:flex",
              ].join(
                " "
              )}
            >
              <ChevronRight
                size={
                  18
                }
              />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}