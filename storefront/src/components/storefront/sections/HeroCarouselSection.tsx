  "use client";

  import type {
    CSSProperties,
  } from "react";

  import {
    useEffect,
    useMemo,
    useState,
  } from "react";

  import Link from "next/link";

  import {
    ChevronLeft,
    ChevronRight,
  } from "lucide-react";

  import type {
    StorefrontSection,
  } from "@/types/storefront";

  interface HeroCarouselSectionProps {
    section: StorefrontSection;
  }

  interface ResolvedMediaAsset {
    id?: string;
    publicUrl?: string | null;
    altText?: string | null;
    title?: string | null;
    originalFileName?: string | null;
  }

  type HeroTextAlignment =
    | "LEFT"
    | "CENTER"
    | "RIGHT";

  type HeroTextPosition =
    | "TOP_LEFT"
    | "TOP_CENTER"
    | "TOP_RIGHT"
    | "CENTER_LEFT"
    | "CENTER"
    | "CENTER_RIGHT"
    | "BOTTOM_LEFT"
    | "BOTTOM_CENTER"
    | "BOTTOM_RIGHT";

  type HeroImagePosition =
    | "CENTER"
    | "LEFT"
    | "RIGHT"
    | "TOP"
    | "BOTTOM"
    | "TOP_LEFT"
    | "TOP_RIGHT"
    | "BOTTOM_LEFT"
    | "BOTTOM_RIGHT";

  interface HeroCarouselSlide {
    id?: string;

    desktopAssetId?: string | null;
    mobileAssetId?: string | null;

    desktopAssetIdResolved?:
      | ResolvedMediaAsset
      | null;

    mobileAssetIdResolved?:
      | ResolvedMediaAsset
      | null;

    eyebrow?: string;
    title?: string;
    description?: string;

    buttonLabel?: string;
    buttonUrl?: string;

    secondaryButtonLabel?: string;
    secondaryButtonUrl?: string;

    textAlignment?: HeroTextAlignment;
    textPosition?: HeroTextPosition;

    mobileTextAlignment?: HeroTextAlignment;
    mobileTextPosition?: HeroTextPosition;

    desktopImagePosition?: HeroImagePosition;
    mobileImagePosition?: HeroImagePosition;

    textColor?: string;

    openInNewTab?: boolean;
    isActive?: boolean;

    hideDescriptionOnMobile?: boolean;
    hideSecondaryButtonOnMobile?: boolean;
  }

  interface HeroCarouselSettings {
    autoplay?: boolean;
    autoPlay?: boolean;

    autoplayInterval?: number;
    interval?: number;

    showArrows?: boolean;
    showDots?: boolean;
    loop?: boolean;

    height?: number | string;
    desktopHeight?: number | string;
    tabletHeight?: number | string;
    mobileHeight?: number | string;
    smallMobileHeight?: number | string;

    overlayOpacity?: number;
    desktopOverlayOpacity?: number;
    mobileOverlayOpacity?: number;

    contentMaxWidth?: number | string;
  }

  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5080/api/v1"
  ).replace(/\/api\/v1\/?$/, "");

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

  const normalizeNumber = (
    value: unknown,
    fallback: number
  ): number => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  };

  const normalizeHeight = (
    value: unknown,
    fallback: string
  ): string => {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return `${value}px`;
    }

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      const trimmed =
        value.trim();

      if (/^\d+$/.test(trimmed)) {
        return `${trimmed}px`;
      }

      return trimmed;
    }

    return fallback;
  };

  const normalizeWidth = (
    value: unknown,
    fallback: string
  ): string => {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return `${value}px`;
    }

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      const trimmed =
        value.trim();

      if (/^\d+$/.test(trimmed)) {
        return `${trimmed}px`;
      }

      return trimmed;
    }

    return fallback;
  };

  const normalizeOpacity = (
    value: unknown,
    fallback: number
  ): number => {
    return Math.min(
      Math.max(
        normalizeNumber(
          value,
          fallback
        ),
        0
      ),
      0.9
    );
  };

  const getDesktopPositionClasses = (
    position?: HeroTextPosition
  ): string => {
    switch (position) {
      case "TOP_LEFT":
        return "md:items-start md:justify-start";

      case "TOP_CENTER":
        return "md:items-start md:justify-center";

      case "TOP_RIGHT":
        return "md:items-start md:justify-end";

      case "CENTER":
        return "md:items-center md:justify-center";

      case "CENTER_RIGHT":
        return "md:items-center md:justify-end";

      case "BOTTOM_LEFT":
        return "md:items-end md:justify-start";

      case "BOTTOM_CENTER":
        return "md:items-end md:justify-center";

      case "BOTTOM_RIGHT":
        return "md:items-end md:justify-end";

      case "CENTER_LEFT":
      default:
        return "md:items-center md:justify-start";
    }
  };

  const getMobilePositionClasses = (
    position?: HeroTextPosition
  ): string => {
    switch (position) {
      case "TOP_LEFT":
        return "items-start justify-start";

      case "TOP_CENTER":
        return "items-start justify-center";

      case "TOP_RIGHT":
        return "items-start justify-end";

      case "CENTER_LEFT":
        return "items-center justify-start";

      case "CENTER_RIGHT":
        return "items-center justify-end";

      case "BOTTOM_LEFT":
        return "items-end justify-start";

      case "BOTTOM_CENTER":
        return "items-end justify-center";

      case "BOTTOM_RIGHT":
        return "items-end justify-end";

      case "CENTER":
      default:
        return "items-center justify-center";
    }
  };

  const getDesktopAlignmentClasses = (
    alignment?: HeroTextAlignment
  ): string => {
    switch (alignment) {
      case "CENTER":
        return "md:items-center md:text-center";

      case "RIGHT":
        return "md:items-end md:text-right";

      case "LEFT":
      default:
        return "md:items-start md:text-left";
    }
  };

  const getMobileAlignmentClasses = (
    alignment?: HeroTextAlignment
  ): string => {
    switch (alignment) {
      case "LEFT":
        return "items-start text-left";

      case "RIGHT":
        return "items-end text-right";

      case "CENTER":
      default:
        return "items-center text-center";
    }
  };

  const getObjectPositionClass = (
    position?: HeroImagePosition
  ): string => {
    switch (position) {
      case "LEFT":
        return "object-left";

      case "RIGHT":
        return "object-right";

      case "TOP":
        return "object-top";

      case "BOTTOM":
        return "object-bottom";

      case "TOP_LEFT":
        return "object-left-top";

      case "TOP_RIGHT":
        return "object-right-top";

      case "BOTTOM_LEFT":
        return "object-left-bottom";

      case "BOTTOM_RIGHT":
        return "object-right-bottom";

      case "CENTER":
      default:
        return "object-center";
    }
  };

  const isExternalUrl = (
    url: string
  ): boolean => {
    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:")
    );
  };

  interface HeroButtonProps {
    label?: string;
    url?: string;
    secondary?: boolean;
    openInNewTab?: boolean;
    mobileHidden?: boolean;
  }

  function HeroButton({
    label,
    url,
    secondary = false,
    openInNewTab = false,
    mobileHidden = false,
  }: HeroButtonProps) {
    if (
      !label?.trim() ||
      !url?.trim()
    ) {
      return null;
    }

    const className = [
      "inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition sm:w-auto",
      mobileHidden
        ? "hidden sm:inline-flex"
        : "",
      secondary
        ? "border border-white/70 bg-black/15 text-white backdrop-blur-sm hover:bg-white hover:text-black"
        : "bg-white text-black shadow-sm hover:bg-white/90",
    ].join(" ");

    const target =
      openInNewTab
        ? "_blank"
        : undefined;

    const rel =
      openInNewTab
        ? "noopener noreferrer"
        : undefined;

    if (isExternalUrl(url)) {
      return (
        <a
          href={url}
          target={target}
          rel={rel}
          className={className}
        >
          {label}
        </a>
      );
    }

    return (
      <Link
        href={url}
        target={target}
        rel={rel}
        className={className}
      >
        {label}
      </Link>
    );
  }

  export default function HeroCarouselSection({
    section,
  }: HeroCarouselSectionProps) {
    const content =
      section.content &&
      typeof section.content ===
        "object"
        ? section.content
        : {};

    const settings =
      section.settings &&
      typeof section.settings ===
        "object"
        ? (section.settings as HeroCarouselSettings)
        : {};

    const slides = useMemo(() => {
      const rawSlides =
        Array.isArray(
          (
            content as Record<
              string,
              unknown
            >
          ).slides
        )
          ? ((
              content as Record<
                string,
                unknown
              >
            ).slides as HeroCarouselSlide[])
          : [];

      return rawSlides.filter(
        (slide) =>
          slide &&
          slide.isActive !== false &&
          Boolean(
            slide
              .desktopAssetIdResolved
              ?.publicUrl ||
              slide
                .mobileAssetIdResolved
                ?.publicUrl
          )
      );
    }, [content]);

    const [
      activeIndex,
      setActiveIndex,
    ] = useState(0);

    const [
      paused,
      setPaused,
    ] = useState(false);

    const autoplay =
      settings.autoplay ??
      settings.autoPlay ??
      true;

    const autoplayInterval =
      Math.max(
        normalizeNumber(
          settings.autoplayInterval ??
            settings.interval,
          5000
        ),
        1500
      );

    const showArrows =
      settings.showArrows !== false;

    const showDots =
      settings.showDots !== false;

    const loop =
      settings.loop !== false;

    const desktopOverlayOpacity =
      normalizeOpacity(
        settings.desktopOverlayOpacity ??
          settings.overlayOpacity,
        0.3
      );

    const mobileOverlayOpacity =
      normalizeOpacity(
        settings.mobileOverlayOpacity ??
          settings.overlayOpacity,
        0.42
      );

    const desktopHeight =
      normalizeHeight(
        settings.desktopHeight ??
          settings.height,
        "680px"
      );

    const tabletHeight =
      normalizeHeight(
        settings.tabletHeight,
        "580px"
      );

    const mobileHeight =
      normalizeHeight(
        settings.mobileHeight,
        "560px"
      );

    const smallMobileHeight =
      normalizeHeight(
        settings.smallMobileHeight,
        "520px"
      );

    const contentMaxWidth =
      normalizeWidth(
        settings.contentMaxWidth,
        "720px"
      );

    useEffect(() => {
      if (
        slides.length <= 1 ||
        !autoplay ||
        paused
      ) {
        return;
      }

      const timer =
        window.setInterval(() => {
          setActiveIndex(
            (current) => {
              if (
                current <
                slides.length - 1
              ) {
                return current + 1;
              }

              return loop
                ? 0
                : current;
            }
          );
        }, autoplayInterval);

      return () => {
        window.clearInterval(timer);
      };
    }, [
      autoplay,
      autoplayInterval,
      loop,
      paused,
      slides.length,
    ]);

    useEffect(() => {
      if (
        activeIndex >=
        slides.length
      ) {
        setActiveIndex(0);
      }
    }, [
      activeIndex,
      slides.length,
    ]);

    const goPrevious = () => {
      setActiveIndex(
        (current) => {
          if (current > 0) {
            return current - 1;
          }

          return loop
            ? slides.length - 1
            : current;
        }
      );
    };

    const goNext = () => {
      setActiveIndex(
        (current) => {
          if (
            current <
            slides.length - 1
          ) {
            return current + 1;
          }

          return loop
            ? 0
            : current;
        }
      );
    };

    if (slides.length === 0) {
      return null;
    }

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
        onMouseEnter={() =>
          setPaused(true)
        }
        onMouseLeave={() =>
          setPaused(false)
        }
        onFocusCapture={() =>
          setPaused(true)
        }
        onBlurCapture={() =>
          setPaused(false)
        }
        className="relative w-full overflow-hidden bg-black"
        style={
          {
            "--hero-desktop-height":
              desktopHeight,

            "--hero-tablet-height":
              tabletHeight,

            "--hero-mobile-height":
              mobileHeight,

            "--hero-small-mobile-height":
              smallMobileHeight,

            "--hero-content-max-width":
              contentMaxWidth,

            "--hero-desktop-overlay":
              desktopOverlayOpacity,

            "--hero-mobile-overlay":
              mobileOverlayOpacity,
          } as CSSProperties
        }
      >
        <div className="relative h-[var(--hero-small-mobile-height)] min-h-[440px] overflow-hidden min-[480px]:h-[var(--hero-mobile-height)] md:h-[var(--hero-tablet-height)] lg:h-[var(--hero-desktop-height)]">
          {slides.map(
            (
              slide,
              index
            ) => {
              const desktopUrl =
                resolveMediaUrl(
                  slide
                    .desktopAssetIdResolved
                    ?.publicUrl
                );

              const mobileUrl =
                resolveMediaUrl(
                  slide
                    .mobileAssetIdResolved
                    ?.publicUrl
                );

              const fallbackUrl =
                mobileUrl ||
                desktopUrl;

              const altText =
                slide
                  .desktopAssetIdResolved
                  ?.altText ||
                slide
                  .mobileAssetIdResolved
                  ?.altText ||
                slide.title ||
                slide
                  .desktopAssetIdResolved
                  ?.title ||
                "Hero banner";

              const visible =
                index ===
                activeIndex;

              const desktopImagePosition =
                getObjectPositionClass(
                  slide.desktopImagePosition
                );

              const mobileImagePosition =
                getObjectPositionClass(
                  slide.mobileImagePosition ??
                    slide.desktopImagePosition
                );

              const mobileTextPosition =
                slide.mobileTextPosition ??
                "BOTTOM_CENTER";

              const mobileTextAlignment =
                slide.mobileTextAlignment ??
                "CENTER";

              return (
                <article
                  key={
                    slide.id ||
                    `${section.id}-${index}`
                  }
                  aria-hidden={
                    !visible
                  }
                  className={[
                    "absolute inset-0 transition-opacity duration-700 ease-in-out",
                    visible
                      ? "z-10 opacity-100"
                      : "pointer-events-none z-0 opacity-0",
                  ].join(" ")}
                >
                  <picture>
                    {mobileUrl ? (
                      <source
                        media="(max-width: 767px)"
                        srcSet={
                          mobileUrl
                        }
                      />
                    ) : null}

                    {desktopUrl ? (
                      <source
                        media="(min-width: 768px)"
                        srcSet={
                          desktopUrl
                        }
                      />
                    ) : null}

                    {fallbackUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          fallbackUrl
                        }
                        alt={altText}
                        className={[
                          "absolute inset-0 h-full w-full object-cover",
                          mobileImagePosition,
                          "md:" +
                            desktopImagePosition,
                        ].join(" ")}
                        loading={
                          index === 0
                            ? "eager"
                            : "lazy"
                        }
                        fetchPriority={
                          index === 0
                            ? "high"
                            : "auto"
                        }
                      />
                    ) : null}
                  </picture>

                  <div className="absolute inset-0 bg-black opacity-[var(--hero-mobile-overlay)] md:opacity-[var(--hero-desktop-overlay)]" />

                  <div
                    className={[
                      "relative z-10 mx-auto flex h-full w-full max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-10 md:px-10 md:py-14 lg:px-14 lg:py-16",
                      getMobilePositionClasses(
                        mobileTextPosition
                      ),
                      getDesktopPositionClasses(
                        slide.textPosition
                      ),
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex w-full max-w-[var(--hero-content-max-width)] flex-col",
                        getMobileAlignmentClasses(
                          mobileTextAlignment
                        ),
                        getDesktopAlignmentClasses(
                          slide.textAlignment
                        ),
                      ].join(" ")}
                      style={{
                        color:
                          slide.textColor ||
                          "#FFFFFF",
                      }}
                    >
                      {slide.eyebrow ? (
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] sm:text-xs sm:tracking-[0.22em] lg:text-sm">
                          {
                            slide.eyebrow
                          }
                        </p>
                      ) : null}

                      {slide.title ? (
                        <h2 className="mt-2 max-w-full text-balance text-[clamp(2rem,9vw,3.25rem)] font-bold leading-[1.05] tracking-tight sm:mt-3 sm:text-[clamp(2.5rem,7vw,4rem)] md:text-[clamp(2.75rem,5vw,4.5rem)] lg:text-[clamp(3rem,4.4vw,5rem)]">
                          {
                            slide.title
                          }
                        </h2>
                      ) : null}

                      {slide.description ? (
                        <p
                          className={[
                            "mt-3 max-w-xl text-sm leading-6 opacity-95 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg",
                            slide.hideDescriptionOnMobile
                              ? "hidden sm:block"
                              : "",
                          ].join(" ")}
                        >
                          {
                            slide.description
                          }
                        </p>
                      ) : null}

                      {slide.buttonLabel ||
                      slide.secondaryButtonLabel ? (
                        <div className="mt-5 flex w-full flex-col gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:flex-wrap">
                          <HeroButton
                            label={
                              slide.buttonLabel
                            }
                            url={
                              slide.buttonUrl
                            }
                            openInNewTab={
                              slide.openInNewTab
                            }
                          />

                          <HeroButton
                            label={
                              slide.secondaryButtonLabel
                            }
                            url={
                              slide.secondaryButtonUrl
                            }
                            secondary
                            openInNewTab={
                              slide.openInNewTab
                            }
                            mobileHidden={
                              slide.hideSecondaryButtonOnMobile
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            }
          )}

          {showArrows &&
          slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={
                  goPrevious
                }
                disabled={
                  !loop &&
                  activeIndex === 0
                }
                aria-label="Previous slide"
                className="absolute left-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-30 sm:flex md:left-4 md:h-11 md:w-11 lg:left-6"
              >
                <ChevronLeft
                  size={22}
                />
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={
                  !loop &&
                  activeIndex ===
                    slides.length - 1
                }
                aria-label="Next slide"
                className="absolute right-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-30 sm:flex md:right-4 md:h-11 md:w-11 lg:right-6"
              >
                <ChevronRight
                  size={22}
                />
              </button>
            </>
          ) : null}

          {showDots &&
          slides.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm sm:bottom-5">
              {slides.map(
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
                    onClick={() =>
                      setActiveIndex(
                        index
                      )
                    }
                    aria-label={`Go to slide ${
                      index + 1
                    }`}
                    aria-current={
                      index ===
                      activeIndex
                        ? "true"
                        : undefined
                    }
                    className={[
                      "h-2.5 rounded-full bg-white transition-all",
                      index ===
                      activeIndex
                        ? "w-7 opacity-100"
                        : "w-2.5 opacity-55 hover:opacity-85",
                    ].join(" ")}
                  />
                )
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  }