"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface TrustBenefitsSectionProps {
  section: StorefrontSection;
}

interface ResolvedMediaAsset {
  id?: string;
  publicUrl?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  altText?: string | null;
  title?: string | null;
  variants?: Array<{
    variantType?: string;
    publicUrl?: string | null;
    isPrimary?: boolean;
  }>;
}

interface TrustBenefitItem {
  id?: string;
  title?: string;
  subtitle?: string;
  iconAssetId?: string | null;
  iconAssetIdResolved?: ResolvedMediaAsset | null;
  isActive?: boolean;
}

interface TrustBenefitsSettings {
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  desktopDisplay?: "GRID" | "CAROUSEL";
  mobileDisplay?: "GRID" | "CAROUSEL";
  autoScroll?: boolean;
  autoScrollInterval?: number;
  infiniteLoop?: boolean;
  showArrows?: boolean;
  showBorder?: boolean;
  gap?: number;
  cardHeight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

const getAssetUrl = (
  asset?: ResolvedMediaAsset | null
): string | null => {
  if (!asset) return null;

  const preferred =
    asset.variants?.find(
      (item) => item.variantType === "SMALL"
    ) ||
    asset.variants?.find(
      (item) => item.variantType === "THUMBNAIL"
    ) ||
    asset.variants?.find(
      (item) => item.variantType === "MEDIUM"
    ) ||
    asset.variants?.find(
      (item) => item.isPrimary
    );

  return resolveMediaUrl(
    preferred?.publicUrl ||
      asset.publicUrl ||
      asset.previewUrl ||
      asset.thumbnailUrl ||
      null
  );
};

const clampColumns = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const safePixels = (
  value: unknown,
  fallback: number
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(parsed, 200));
};

export default function TrustBenefitsSection({
  section,
}: TrustBenefitsSectionProps) {
  const desktopCarouselRef =
    useRef<HTMLDivElement | null>(null);

  const mobileCarouselRef =
    useRef<HTMLDivElement | null>(null);

  const content =
    section.content &&
    typeof section.content === "object"
      ? section.content
      : {};

  const settings =
    section.settings &&
    typeof section.settings === "object"
      ? (section.settings as TrustBenefitsSettings)
      : {};

  const items = useMemo(() => {
    const raw = Array.isArray(
      (content as Record<string, unknown>).items
    )
      ? ((content as Record<string, unknown>)
          .items as TrustBenefitItem[])
      : [];

    return raw.filter(
      (item) => item && item.isActive !== false
    );
  }, [content]);

  if (items.length === 0) {
    return null;
  }

  const desktopColumns = clampColumns(
    settings.columnsDesktop,
    4,
    1,
    4
  );

  const tabletColumns = clampColumns(
    settings.columnsTablet,
    2,
    1,
    4
  );

  const mobileColumns = clampColumns(
    settings.columnsMobile,
    1,
    1,
    2
  );

  const desktopDisplay =
    settings.desktopDisplay === "CAROUSEL"
      ? "CAROUSEL"
      : "GRID";

  const mobileDisplay =
    settings.mobileDisplay === "CAROUSEL"
      ? "CAROUSEL"
      : "GRID";

  const autoScroll =
    settings.autoScroll === true;

  const autoScrollInterval = Math.max(
    2000,
    Math.min(
      30000,
      (Number(settings.autoScrollInterval) || 4) * 1000
    )
  );

  const infiniteLoop =
    settings.infiniteLoop !== false;

  const showArrows =
    settings.showArrows !== false;

  const showBorder =
    settings.showBorder !== false;

  const gap = safePixels(settings.gap, 12);
  const cardHeight = safePixels(
    settings.cardHeight,
    88
  );
  const paddingTop = safePixels(
    settings.paddingTop,
    12
  );
  const paddingBottom = safePixels(
    settings.paddingBottom,
    12
  );

  const gridColumnClass = [
    mobileColumns === 2
      ? "grid-cols-2"
      : "grid-cols-1",
    tabletColumns === 4
      ? "md:grid-cols-4"
      : tabletColumns === 3
        ? "md:grid-cols-3"
        : tabletColumns === 2
          ? "md:grid-cols-2"
          : "md:grid-cols-1",
    desktopColumns === 4
      ? "lg:grid-cols-4"
      : desktopColumns === 3
        ? "lg:grid-cols-3"
        : desktopColumns === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1",
  ].join(" ");

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "LEFT" | "RIGHT"
  ) => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const maxLeft =
      element.scrollWidth -
      element.clientWidth;

    const nearStart =
      element.scrollLeft <= 8;

    const nearEnd =
      element.scrollLeft >=
      maxLeft - 8;

    if (
      infiniteLoop &&
      direction === "LEFT" &&
      nearStart
    ) {
      element.scrollTo({
        left: maxLeft,
        behavior: "smooth",
      });

      return;
    }

    if (
      infiniteLoop &&
      direction === "RIGHT" &&
      nearEnd
    ) {
      element.scrollTo({
        left: 0,
        behavior: "smooth",
      });

      return;
    }

    const amount = Math.max(
      element.clientWidth * 0.8,
      220
    );

    element.scrollBy({
      left:
        direction === "RIGHT"
          ? amount
          : -amount,
      behavior: "smooth",
    });
  };

  const renderCard = (
    item: TrustBenefitItem,
    index: number
  ) => {
    const iconUrl = getAssetUrl(
      item.iconAssetIdResolved
    );

    return (
      <article
      className={[
        "flex h-full items-center gap-2 rounded-lg bg-white px-3 py-1",
        "md:min-h-[88px] md:gap-4 md:rounded-xl md:px-5 md:py-4",
        showBorder
          ? "border border-[#E1E3E5]"
          : "",
      ].join(" ")}
    >
        <div className="flex size-9 shrink-0 items-center justify-center md:size-12">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUrl}
              alt={item.title || "Benefit"}
              className="h-8 w-8 object-contain md:h-10 md:w-10"
            />
          ) : null}
        </div>
    
        <div className="min-w-0">
          {item.title ? (
            <h3
              className="
                text-[13px]
                font-bold
                leading-tight
                text-storefront-text
    
                md:text-[16px]
                lg:text-[18px]
              "
            >
              {item.title}
            </h3>
          ) : null}
    
          {item.subtitle ? (
            <p
              className="
                mt-1
                hidden
                text-storefront-muted
    
                md:block
                md:text-[12px]
                md:leading-4
                lg:text-[13px]
              "
            >
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </article>
    );
  };

  useEffect(() => {
    if (
      !autoScroll ||
      desktopDisplay !== "CAROUSEL" ||
      items.length <= desktopColumns
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      const element = desktopCarouselRef.current;

      if (!element) {
        return;
      }

      const maxLeft =
        element.scrollWidth -
        element.clientWidth;

      const nearEnd =
        element.scrollLeft >=
        maxLeft - 8;

      if (nearEnd) {
        if (infiniteLoop) {
          element.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        }
      } else {
        element.scrollBy({
          left: Math.max(
            element.clientWidth * 0.8,
            220
          ),
          behavior: "smooth",
        });
      }
    }, autoScrollInterval);

    return () =>
      window.clearInterval(timer);
  }, [
    autoScroll,
    desktopDisplay,
    desktopColumns,
    items.length,
    autoScrollInterval,
    infiniteLoop,
  ]);

  useEffect(() => {
    if (
      !autoScroll ||
      mobileDisplay !== "CAROUSEL" ||
      items.length <= mobileColumns
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      const element = mobileCarouselRef.current;

      if (!element) {
        return;
      }

      const maxLeft =
        element.scrollWidth -
        element.clientWidth;

      const nearEnd =
        element.scrollLeft >=
        maxLeft - 8;

      if (nearEnd) {
        if (infiniteLoop) {
          element.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        }
      } else {
        element.scrollBy({
          left: Math.max(
            element.clientWidth * 0.8,
            220
          ),
          behavior: "smooth",
        });
      }
    }, autoScrollInterval);

    return () =>
      window.clearInterval(timer);
  }, [
    autoScroll,
    mobileDisplay,
    mobileColumns,
    items.length,
    autoScrollInterval,
    infiniteLoop,
  ]);

  const desktopBasis = `calc((100% - ${
    gap * (desktopColumns - 1)
  }px) / ${desktopColumns})`;

  const mobileBasis =
    mobileColumns === 2
      ? `calc((100% - ${gap}px) / 2)`
      : "88%";

  return (
    <section
      data-section-id={section.id}
      data-section-code={section.code}
      data-section-type={section.type.code}
      className="w-full"
      style={{
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
      }}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="md:hidden">
          {mobileDisplay === "CAROUSEL" ? (
            <div className="relative">
              <div
                ref={mobileCarouselRef}
                className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ gap: `${gap}px` }}
              >
                {items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="shrink-0 snap-start"
                    style={{ flexBasis: mobileBasis }}
                  >
                    {renderCard(item, index)}
                  </div>
                ))}
              </div>

              {showArrows &&
              items.length > mobileColumns ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      scrollCarousel(
                        mobileCarouselRef,
                        "LEFT"
                      )
                    }
                    aria-label="Previous benefits"
                    className="absolute left-1 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9dde3] bg-white text-[#111827] shadow-md transition hover:bg-[#f8fafc]"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scrollCarousel(
                        mobileCarouselRef,
                        "RIGHT"
                      )
                    }
                    aria-label="Next benefits"
                    className="absolute right-1 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9dde3] bg-white text-[#111827] shadow-md transition hover:bg-[#f8fafc]"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div
              className={[
                "grid",
                mobileColumns === 2
                  ? "grid-cols-2"
                  : "grid-cols-1",
              ].join(" ")}
              style={{ gap: `${gap}px` }}
            >
              {items.map((item, index) => (
                <div key={item.id || index}>
                  {renderCard(item, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          {desktopDisplay === "CAROUSEL" ? (
            <div className="relative">
              <div
                ref={desktopCarouselRef}
                className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ gap: `${gap}px` }}
              >
                {items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="shrink-0 snap-start"
                    style={{ flexBasis: desktopBasis }}
                  >
                    {renderCard(item, index)}
                  </div>
                ))}
              </div>

              {showArrows &&
              items.length > desktopColumns ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      scrollCarousel(
                        desktopCarouselRef,
                        "LEFT"
                      )
                    }
                    aria-label="Previous benefits"
                    className="absolute left-2 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9dde3] bg-white text-[#111827] shadow-md transition hover:bg-[#f8fafc] lg:left-3"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scrollCarousel(
                        desktopCarouselRef,
                        "RIGHT"
                      )
                    }
                    aria-label="Next benefits"
                    className="absolute right-2 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9dde3] bg-white text-[#111827] shadow-md transition hover:bg-[#f8fafc] lg:right-3"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div
              className={`grid ${gridColumnClass}`}
              style={{ gap: `${gap}px` }}
            >
              {items.map((item, index) => (
                <div key={item.id || index}>
                  {renderCard(item, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
