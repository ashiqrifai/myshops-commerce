"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
  TouchEvent,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface ResolvedMediaAsset {
  publicUrl?: string | null;
  altText?: string | null;
  title?: string | null;
}

interface DesktopSlide {
  id?: string;

  desktopAssetIdResolved?:
    | ResolvedMediaAsset
    | null;

  linkUrl?: string;
  altText?: string;
  isActive?: boolean;
}

interface MobileSlide {
  id?: string;

  assetIdResolved?:
    | ResolvedMediaAsset
    | null;

  linkUrl?: string;
  altText?: string;
  isActive?: boolean;
}

interface BrandItem {
  id?: string;

  assetIdResolved?:
    | ResolvedMediaAsset
    | null;

  linkUrl?: string;
  altText?: string;
  isActive?: boolean;
}

/*
|--------------------------------------------------------------------------
| Media URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/api\/v1\/?$/,
  ""
);

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

/*
|--------------------------------------------------------------------------
| Desktop Image
|--------------------------------------------------------------------------
*/

function DesktopImage({
  item,
  fit =
    "cover",
}: {
  item: DesktopSlide;

  fit?:
    | "cover"
    | "contain"
    | "fill";
}) {
  const imageUrl =
    resolveMediaUrl(
      item
        .desktopAssetIdResolved
        ?.publicUrl
    );

  const altText =
    item.altText ||
    item
      .desktopAssetIdResolved
      ?.altText ||
    item
      .desktopAssetIdResolved
      ?.title ||
    "Promotion";

  if (
    !imageUrl
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-storefront-secondary px-4 text-center text-sm font-semibold text-storefront-muted">
        Promotion image
      </div>
    );
  }

  return (
    <img
      src={
        imageUrl
      }
      alt={
        altText
      }
      loading="eager"
      className={[
        "block",
        "h-full",
        "w-full",

        fit ===
        "contain"
          ? "object-contain"
          : fit ===
              "fill"
            ? "object-fill"
            : "object-cover",
      ].join(
        " "
      )}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Mobile Image
|--------------------------------------------------------------------------
*/

function MobileImage({
  item,
}: {
  item: MobileSlide;
}) {
  const imageUrl =
    resolveMediaUrl(
      item
        .assetIdResolved
        ?.publicUrl
    );

  const altText =
    item.altText ||
    item
      .assetIdResolved
      ?.altText ||
    item
      .assetIdResolved
      ?.title ||
    "Mobile promotion";

  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-storefront-secondary px-4 text-center text-sm font-semibold text-storefront-muted">
        Mobile promotion
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={altText}
      loading="eager"
      className="block h-auto w-full object-contain"
    />
  );
}

/*
|--------------------------------------------------------------------------
| Desktop Promo Card
|--------------------------------------------------------------------------
*/

function DesktopPromoCard({
  item,
  fit =
    "cover",
}: {
  item: DesktopSlide;

  fit?:
    | "cover"
    | "contain"
    | "fill";
}) {
  const content = (
    <DesktopImage
      item={
        item
      }
      fit={
        fit
      }
    />
  );

  if (
    item.linkUrl
  ) {
    return (
      <Link
        href={
          item.linkUrl
        }
        className="block h-full w-full"
      >
        {
          content
        }
      </Link>
    );
  }

  return content;
}
/*
|--------------------------------------------------------------------------
| Mobile Promo Card
|--------------------------------------------------------------------------
*/

function MobilePromoCard({
  item,
}: {
  item: MobileSlide;
}) {
  const content = (
    <MobileImage item={item} />
  );

  if (item.linkUrl) {
    return (
      <Link
        href={item.linkUrl}
        className="block h-full w-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function HeroPromoGridSection({
  section,
}: {
  section: StorefrontSection;
}) {
  /*
  |--------------------------------------------------------------------------
  | Desktop Main Slides
  |--------------------------------------------------------------------------
  */

  const desktopSlides =
    useMemo(
      () =>
        (
          Array.isArray(
            section.content.slides
          )
            ? section.content.slides
            : []
        ).filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (
              item as {
                isActive?: boolean;
              }
            ).isActive !== false
        ) as DesktopSlide[],
      [
        section.content.slides,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Desktop Side Promos
  |--------------------------------------------------------------------------
  */

  const desktopPromos =
    useMemo(
      () =>
        (
          Array.isArray(
            section.content.promoCards
          )
            ? section.content.promoCards
            : []
        ).filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (
              item as {
                isActive?: boolean;
              }
            ).isActive !== false
        ) as DesktopSlide[],
      [
        section.content.promoCards,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Side Promo Pages
  |--------------------------------------------------------------------------
  */

  const desktopPromoPages =
    useMemo(
      () => {
        const pages:
          DesktopSlide[][] =
          [];

        for (
          let index = 0;
          index < desktopPromos.length;
          index += 2
        ) {
          pages.push(
            desktopPromos.slice(
              index,
              index + 2
            )
          );
        }

        return pages;
      },
      [
        desktopPromos,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Mobile Slides
  |--------------------------------------------------------------------------
  */

  const mobileSlides =
    useMemo(
      () =>
        (
          Array.isArray(
            section.content.mobileSlides
          )
            ? section.content.mobileSlides
            : []
        ).filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (
              item as {
                isActive?: boolean;
              }
            ).isActive !== false
        ) as MobileSlide[],
      [
        section.content.mobileSlides,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Brand Strip
  |--------------------------------------------------------------------------
  */

  const brandItems =
    useMemo(
      () =>
        (
          Array.isArray(
            section.content.brandItems
          )
            ? section.content.brandItems
            : []
        ).filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (
              item as {
                isActive?: boolean;
              }
            ).isActive !== false
        ) as BrandItem[],
      [
        section.content.brandItems,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Desktop Hero Settings
  |--------------------------------------------------------------------------
  */

  const desktopAutoplay =
    section.settings.autoplay !==
    false;

  const desktopAutoplayDelay =
    Math.max(
      2000,
      Number(
        section.settings
          .autoplayDelayMs ||
          5000
      )
    );

  const desktopShowArrows =
    section.settings.showArrows !==
    false;

  const desktopShowDots =
    section.settings.showDots !==
    false;

  /*
  |--------------------------------------------------------------------------
  | Side Promo Settings
  |--------------------------------------------------------------------------
  */

  const sidePromoAutoplay =
    section.settings
      .sidePromoAutoplay !==
    false;

  const sidePromoDelay =
    Math.max(
      2000,
      Number(
        section.settings
          .sidePromoDelayMs ||
          5000
      )
    );

  const sidePromoShowArrows =
    section.settings
      .sidePromoShowArrows !==
    false;

  const sidePromoShowDots =
    section.settings
      .sidePromoShowDots !==
    false;

  /*
  |--------------------------------------------------------------------------
  | Sizes
  |--------------------------------------------------------------------------
  */

  const desktopHeight =
    Math.max(
      280,
      Number(
        section.settings
          .heroHeightDesktop ||
          450
      )
    );

  /*
  |--------------------------------------------------------------------------
  | Mobile Settings
  |--------------------------------------------------------------------------
  */

  const mobileAutoplay =
    section.settings
      .mobileAutoplay !==
    false;

  const mobileAutoplayDelay =
    Math.max(
      2000,
      Number(
        section.settings
          .mobileAutoplayDelayMs ||
          4000
      )
    );

  const mobileShowDots =
    section.settings
      .mobileShowDots !==
    false;

  const mobileHeight =
    Math.max(
      160,
      Number(
        section.settings
          .mobileHeight ||
          220
      )
    );

  const showBrandStrip =
    section.settings
      .showBrandStrip !==
    false;

  /*
  |--------------------------------------------------------------------------
  | Desktop Main Carousel
  |--------------------------------------------------------------------------
  */

  const [
    desktopIndex,
    setDesktopIndex,
  ] =
    useState(0);

  useEffect(
    () => {
      if (
        !desktopAutoplay ||
        desktopSlides.length <= 1
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setDesktopIndex(
              (current) =>
                (
                  current + 1
                ) %
                desktopSlides.length
            );
          },
          desktopAutoplayDelay
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      desktopAutoplay,
      desktopAutoplayDelay,
      desktopSlides.length,
    ]
  );

  useEffect(
    () => {
      if (
        desktopIndex >=
        desktopSlides.length
      ) {
        setDesktopIndex(0);
      }
    },
    [
      desktopIndex,
      desktopSlides.length,
    ]
  );

  const activeDesktopSlide =
    desktopSlides[
      desktopIndex
    ] ||
    null;

  const goDesktopPrevious =
    () => {
      if (!desktopSlides.length) {
        return;
      }

      setDesktopIndex(
        (current) =>
          (
            current -
            1 +
            desktopSlides.length
          ) %
          desktopSlides.length
      );
    };

  const goDesktopNext =
    () => {
      if (!desktopSlides.length) {
        return;
      }

      setDesktopIndex(
        (current) =>
          (
            current + 1
          ) %
          desktopSlides.length
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Side Promo Carousel
  |--------------------------------------------------------------------------
  */

  const [
    sidePromoIndex,
    setSidePromoIndex,
  ] =
    useState(0);

  useEffect(
    () => {
      if (
        !sidePromoAutoplay ||
        desktopPromoPages.length <= 1
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setSidePromoIndex(
              (current) =>
                (
                  current + 1
                ) %
                desktopPromoPages.length
            );
          },
          sidePromoDelay
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      sidePromoAutoplay,
      sidePromoDelay,
      desktopPromoPages.length,
    ]
  );

  useEffect(
    () => {
      if (
        sidePromoIndex >=
        desktopPromoPages.length
      ) {
        setSidePromoIndex(0);
      }
    },
    [
      sidePromoIndex,
      desktopPromoPages.length,
    ]
  );

  const goSidePromoPrevious =
    () => {
      if (
        !desktopPromoPages.length
      ) {
        return;
      }

      setSidePromoIndex(
        (current) =>
          (
            current -
            1 +
            desktopPromoPages.length
          ) %
          desktopPromoPages.length
      );
    };

  const goSidePromoNext =
    () => {
      if (
        !desktopPromoPages.length
      ) {
        return;
      }

      setSidePromoIndex(
        (current) =>
          (
            current + 1
          ) %
          desktopPromoPages.length
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Mobile Carousel
  |--------------------------------------------------------------------------
  */

  const [
    mobileIndex,
    setMobileIndex,
  ] =
    useState(0);

  const touchStartX =
    useRef<
      number |
      null
    >(null);

  useEffect(
    () => {
      if (
        !mobileAutoplay ||
        mobileSlides.length <= 1
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setMobileIndex(
              (current) =>
                (
                  current + 1
                ) %
                mobileSlides.length
            );
          },
          mobileAutoplayDelay
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      mobileAutoplay,
      mobileAutoplayDelay,
      mobileSlides.length,
    ]
  );

  useEffect(
    () => {
      if (
        mobileIndex >=
        mobileSlides.length
      ) {
        setMobileIndex(0);
      }
    },
    [
      mobileIndex,
      mobileSlides.length,
    ]
  );

  const onMobileTouchStart =
    (
      event:
        TouchEvent<
          HTMLDivElement
        >
    ) => {
      touchStartX.current =
        event.touches[
          0
        ]?.clientX ??
        null;
    };

  const onMobileTouchEnd =
    (
      event:
        TouchEvent<
          HTMLDivElement
        >
    ) => {
      if (
        touchStartX.current ===
          null ||
        mobileSlides.length <= 1
      ) {
        return;
      }

      const endX =
        event.changedTouches[
          0
        ]?.clientX ??
        touchStartX.current;

      const difference =
        endX -
        touchStartX.current;

      touchStartX.current =
        null;

      if (
        Math.abs(
          difference
        ) <
        40
      ) {
        return;
      }

      if (
        difference < 0
      ) {
        setMobileIndex(
          (current) =>
            (
              current + 1
            ) %
            mobileSlides.length
        );
      } else {
        setMobileIndex(
          (current) =>
            (
              current -
              1 +
              mobileSlides.length
            ) %
            mobileSlides.length
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CSS Variables
  |--------------------------------------------------------------------------
  */

  const desktopStyle =
    {
      "--hero-desktop-height":
        `${desktopHeight}px`,
    } as CSSProperties;


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
      className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8"
    >
    {/* Mobile */}

<div className="lg:hidden">
  <div
    className="relative w-full overflow-hidden rounded-[18px] bg-storefront-secondary"
    onTouchStart={
      onMobileTouchStart
    }
    onTouchEnd={
      onMobileTouchEnd
    }
  >
    {mobileSlides.length > 0 ? (
      <div
        className="flex w-full transition-transform duration-500 ease-out"
        style={{
          transform:
            `translateX(-${mobileIndex * 100}%)`,
        }}
      >
        {mobileSlides.map(
          (
            slide,
            index
          ) => (
            <div
              key={
                slide.id ||
                index
              }
              className="w-full shrink-0"
            >
              <MobilePromoCard
                item={
                  slide
                }
              />
            </div>
          )
        )}
      </div>
    ) : (
      <div className="flex min-h-[180px] items-center justify-center px-6 text-center text-sm font-medium text-storefront-muted">
        Add mobile carousel slides in CMS.
      </div>
    )}

    {mobileShowDots &&
    mobileSlides.length > 1 ? (
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1.5 backdrop-blur-sm">
        {mobileSlides.map(
          (
            slide,
            index
          ) => (
            <button
              key={
                slide.id ||
                index
              }
              type="button"
              aria-label={`Go to mobile slide ${index + 1}`}
              onClick={() =>
                setMobileIndex(
                  index
                )
              }
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                index ===
                mobileIndex
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/60",
              ].join(
                " "
              )}
            />
          )
        )}
      </div>
    ) : null}
  </div>
</div>

      {/* Desktop */}

      <div
        className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,2.15fr)_minmax(0,1.65fr)]"
        style={desktopStyle}
      >
        {/* Main Desktop Hero */}

        <div className="relative h-[var(--hero-desktop-height)] overflow-hidden rounded-[22px] bg-white">
            {activeDesktopSlide ? (
              <DesktopPromoCard
                item={
                  activeDesktopSlide
                }
                fit="fill"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-storefront-muted">
                Add desktop hero slides.
              </div>
            )}


          {desktopShowArrows &&
          desktopSlides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={
                  goDesktopPrevious
                }
                aria-label="Previous desktop slide"
                className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#111111] shadow-md backdrop-blur transition hover:bg-white"
              >
                <ChevronLeft
                  size={20}
                />
              </button>

              <button
                type="button"
                onClick={
                  goDesktopNext
                }
                aria-label="Next desktop slide"
                className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#111111] shadow-md backdrop-blur transition hover:bg-white"
              >
                <ChevronRight
                  size={20}
                />
              </button>
            </>
          ) : null}

          {desktopShowDots &&
          desktopSlides.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1.5 backdrop-blur-sm">
              {desktopSlides.map(
                (
                  slide,
                  index
                ) => (
                  <button
                    key={
                      slide.id ||
                      index
                    }
                    type="button"
                    aria-label={`Go to desktop slide ${index + 1}`}
                    onClick={() =>
                      setDesktopIndex(
                        index
                      )
                    }
                    className={[
                      "h-2 rounded-full transition-all duration-300",
                      index ===
                      desktopIndex
                        ? "w-6 bg-white"
                        : "w-2 bg-white/60",
                    ].join(" ")}
                  />
                )
              )}
            </div>
          ) : null}
        </div>

        {/* Side Promo Carousel */}

        <div className="relative h-[var(--hero-desktop-height)] overflow-hidden">
          {desktopPromoPages.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{
                transform:
                  `translateX(-${sidePromoIndex * 100}%)`,
              }}
            >
              {desktopPromoPages.map(
                (
                  promoPage,
                  pageIndex
                ) => (
                  <div
                    key={
                      pageIndex
                    }
                    className="h-[var(--hero-desktop-height)] w-full shrink-0"
                  >
                    <div className="grid h-[var(--hero-desktop-height)] min-w-0 grid-cols-2 gap-4">
                      {promoPage[0] ? (
                        <div className="relative h-full min-h-0 overflow-hidden rounded-[20px] bg-white">
                          <DesktopPromoCard
                            item={
                              promoPage[0]
                            }
                            fit="fill"
                          />
                        </div>
                      ) : (
                        <div className="h-full rounded-[20px] bg-storefront-secondary" />
                      )}

                      {promoPage[1] ? (
                        <div className="relative h-full min-h-0 overflow-hidden rounded-[20px] bg-white">
                          <DesktopPromoCard
                            item={
                              promoPage[1]
                            }
                            fit="fill"
                          />
                        </div>
                      ) : (
                        <div className="h-full rounded-[20px] bg-transparent" />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="grid h-full min-w-0 grid-cols-2 gap-4">
              <div className="flex h-full items-center justify-center rounded-[20px] bg-storefront-secondary text-xs font-semibold text-storefront-muted">
                Side promotion 1
              </div>

              <div className="flex h-full items-center justify-center rounded-[20px] bg-storefront-secondary text-xs font-semibold text-storefront-muted">
                Side promotion 2
              </div>
            </div>
          )}

          {sidePromoShowArrows &&
          desktopPromoPages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={
                  goSidePromoPrevious
                }
                aria-label="Previous side promotions"
                className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111111] shadow-md backdrop-blur transition hover:bg-white"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <button
                type="button"
                onClick={
                  goSidePromoNext
                }
                aria-label="Next side promotions"
                className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111111] shadow-md backdrop-blur transition hover:bg-white"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </>
          ) : null}

          {sidePromoShowDots &&
          desktopPromoPages.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1.5 backdrop-blur-sm">
              {desktopPromoPages.map(
                (
                  _,
                  pageIndex
                ) => (
                  <button
                    key={
                      pageIndex
                    }
                    type="button"
                    aria-label={`Go to side promotion page ${pageIndex + 1}`}
                    onClick={() =>
                      setSidePromoIndex(
                        pageIndex
                      )
                    }
                    className={[
                      "h-2 rounded-full transition-all duration-300",
                      pageIndex ===
                      sidePromoIndex
                        ? "w-6 bg-white"
                        : "w-2 bg-white/60 hover:bg-white/90",
                    ].join(" ")}
                  />
                )
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Brand Strip */}

      {showBrandStrip &&
      brandItems.length > 0 ? (
        <div className="mt-4">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {brandItems.map(
              (
                brand,
                index
              ) => {
                const logoUrl =
                  resolveMediaUrl(
                    brand
                      .assetIdResolved
                      ?.publicUrl
                  );

                const altText =
                  brand.altText ||
                  brand
                    .assetIdResolved
                    ?.altText ||
                  brand
                    .assetIdResolved
                    ?.title ||
                  "Brand";

                const card = (
                  <div className="flex h-[72px] w-[118px] shrink-0 snap-start items-center justify-center rounded-[16px] border border-[#E4E7EB] bg-white px-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:h-[82px] sm:w-[140px]">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={altText}
                        loading="lazy"
                        className="max-h-[38px] max-w-full object-contain sm:max-h-[44px]"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-storefront-muted">
                        Brand
                      </span>
                    )}
                  </div>
                );

                if (
                  brand.linkUrl
                ) {
                  return (
                    <Link
                      key={
                        brand.id ||
                        index
                      }
                      href={
                        brand.linkUrl
                      }
                      className="shrink-0"
                    >
                      {card}
                    </Link>
                  );
                }

                return (
                  <div
                    key={
                      brand.id ||
                      index
                    }
                    className="shrink-0"
                  >
                    {card}
                  </div>
                );
              }
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}