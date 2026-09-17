"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useEffect,
  useRef,
} from "react";

import {
  StorefrontSection,
  StorefrontBrand,
} from "@/types/storefront";

interface Props {
  section:
    StorefrontSection;
}

export default function BrandCarouselSection({
  section,
}: Props) {
  const scrollRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | Content / Settings
  |--------------------------------------------------------------------------
  */

  const content =
    section.content as any;

  const settings =
    section.settings as any;

  const brands:
    StorefrontBrand[] =
    content?.brandIdsResolved ??
    [];

  const autoplay =
    settings?.autoplay ===
    true;

  const showArrows =
    settings?.showArrows !==
    false;

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
        brands.length <=
          8
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
      brands.length,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Empty
  |--------------------------------------------------------------------------
  */

  if (
    !brands.length
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
      className="-mt-12 w-full sm:mt-0"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">

        {/*
        |--------------------------------------------------------------------------
        | Carousel Wrapper
        |--------------------------------------------------------------------------
        */}

        <div className="relative">

          {/*
          |--------------------------------------------------------------------------
          | Left Arrow
          |--------------------------------------------------------------------------
          |
          | Hidden on mobile.
          | Mobile uses native finger swipe.
          |--------------------------------------------------------------------------
          */}

          {showArrows &&
          brands.length >
            1 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "left"
                )
              }
              aria-label="Previous brands"
              className={[
                "absolute",
                "-left-4",
                "top-1/2",
                "z-30",

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

          {/*
          |--------------------------------------------------------------------------
          | Brand Carousel
          |--------------------------------------------------------------------------
          |
          | IMPORTANT:
          |
          | This now behaves like CategoryCarouselSection.
          |
          | No custom pointer capture.
          | No manual drag calculations.
          | No JavaScript interception during touch.
          |
          | Mobile uses native browser horizontal scrolling.
          |--------------------------------------------------------------------------
          */}

          <div
            ref={
              scrollRef
            }
            className={[
              "flex",

              /*
               * Snap behaviour.
               */
              "snap-x",
              "snap-mandatory",

              /*
               * Same spacing pattern
               * as category carousel.
               */
              "gap-2.5",

              /*
               * Native horizontal scroll.
               */
              "overflow-x-auto",

              /*
               * Prevent page-level horizontal
               * overscroll while swiping brands.
               */
              "overscroll-x-contain",

              "pb-0",

              /*
               * Smooth programmatic scrolling.
               */
              "scroll-smooth",

              /*
               * Allow natural horizontal
               * finger swiping.
               *
               * Do NOT use custom pointer handlers.
               */
              "touch-pan-x",

              /*
               * Hide scrollbar.
               */
              "[scrollbar-width:none]",
              "[-ms-overflow-style:none]",
              "[&::-webkit-scrollbar]:hidden",
            ].join(
              " "
            )}
          >
            {brands.map(
              (
                brand
              ) => {
                /*
                |--------------------------------------------------------------------------
                | Brand Image
                |--------------------------------------------------------------------------
                */

                const image =
                  brand.logoAsset
                    ?.publicUrl ||
                  brand.logoAsset
                    ?.previewUrl ||
                  brand.logoAsset
                    ?.thumbnailUrl ||
                  brand.image
                    ?.publicUrl ||
                  brand.image
                    ?.previewUrl ||
                  brand.image
                    ?.thumbnailUrl;

                /*
                |--------------------------------------------------------------------------
                | Brand URL
                |--------------------------------------------------------------------------
                */

                const brandUrl =
                  `/brands/${encodeURIComponent(
                    brand.slug
                  )}`;

                return (
                  <Link
                    key={
                      brand.id
                    }
                    href={
                      brandUrl
                    }
                    draggable={
                      false
                    }
                    prefetch={
                      false
                    }
                    className={[
                      "group",

                      /*
                       * Carousel item.
                       */
                      "flex",
                      "shrink-0",
                      "snap-start",

                      "flex-col",
                      "items-center",
                      "justify-center",

                      /*
                       * IMPORTANT:
                       *
                       * Same responsive widths
                       * as Category Carousel.
                       */
                      "w-[118px]",
                      "sm:w-[128px]",
                      "md:w-[135px]",
                      "lg:w-[142px]",

                      /*
                       * Height.
                       */
                      settings
                        ?.showNames
                        ? "min-h-[112px]"
                        : "h-[96px]",

                      /*
                       * Card.
                       */
                      "rounded-lg",

                      "border",
                      "border-[#E5E7EB]",

                      "bg-white",

                      "px-3",
                      "py-3",

                      /*
                       * Interaction.
                       */
                      "transition",
                      "duration-200",

                      "hover:-translate-y-0.5",
                      "hover:border-[#D1D5DB]",
                      "hover:shadow-sm",

                      /*
                       * Keyboard focus.
                       */
                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-storefront-primary",
                      "focus-visible:ring-offset-2",
                    ].join(
                      " "
                    )}
                  >
                    {/*
                    |--------------------------------------------------------------------------
                    | Brand Logo
                    |--------------------------------------------------------------------------
                    */}

                    <div className="flex h-[58px] w-full items-center justify-center">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            image
                          }
                          alt={
                            brand.name
                          }
                          loading="lazy"
                          draggable={
                            false
                          }
                          className={[
                            /*
                             * Size.
                             */
                            "max-h-[52px]",
                            "max-w-[100px]",
                            "object-contain",

                            "sm:max-w-[108px]",
                            "md:max-w-[112px]",

                            /*
                             * Default grey appearance.
                             */
                            "grayscale",
                            "opacity-70",

                            /*
                             * Animation.
                             */
                            "transition-all",
                            "duration-300",

                            /*
                             * Restore original logo colour
                             * when hovering desktop.
                             */
                            "group-hover:grayscale-0",
                            "group-hover:opacity-100",

                            /*
                             * Slight desktop hover zoom.
                             */
                            "group-hover:scale-[1.05]",
                          ].join(
                            " "
                          )}
                        />
                      ) : (
                        <span className="text-xs font-bold text-storefront-muted transition-colors group-hover:text-storefront-text">
                          {
                            brand.name
                          }
                        </span>
                      )}
                    </div>

                    {/*
                    |--------------------------------------------------------------------------
                    | Optional Brand Name
                    |--------------------------------------------------------------------------
                    */}

                    {settings
                      ?.showNames ? (
                      <span className="mt-2 line-clamp-1 w-full text-center text-xs font-medium text-storefront-muted transition-colors group-hover:text-storefront-text">
                        {
                          brand.name
                        }
                      </span>
                    ) : null}
                  </Link>
                );
              }
            )}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Right Arrow
          |--------------------------------------------------------------------------
          */}

          {showArrows &&
          brands.length >
            1 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "right"
                )
              }
              aria-label="Next brands"
              className={[
                "absolute",
                "-right-4",
                "top-1/2",
                "z-30",

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