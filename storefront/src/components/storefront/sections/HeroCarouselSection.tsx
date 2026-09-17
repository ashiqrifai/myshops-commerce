"use client";

import type {
  CSSProperties,
} from "react";

import {
  useEffect,
  useMemo,
  useRef,
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

interface ResolvedMediaAssetVariant {
  variantType?: string;
  format?: string;
  mimeType?: string | null;
  publicUrl?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
}

interface ResolvedMediaAsset {
  id?: string;

  assetType?:
    | "IMAGE"
    | "VIDEO"
    | "PDF";

  mimeType?: string | null;

  publicUrl?: string | null;

  altText?: string | null;
  title?: string | null;
  originalFileName?: string | null;

  variants?:
    ResolvedMediaAssetVariant[];
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

  slideLinkUrl?: string;
  slideLinkNewTab?: boolean;

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

const getVideoUrl = (
  asset?:
    | ResolvedMediaAsset
    | null
): string | null => {
  if (
    !asset ||
    asset.assetType !==
      "VIDEO"
  ) {
    return null;
  }

  const previewVariant =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "PREVIEW" &&
        variant.isActive !==
          false &&
        Boolean(
          variant.publicUrl
        ) &&
        String(
          variant.mimeType ||
            ""
        ).startsWith(
          "video/"
        )
    );

  return resolveMediaUrl(
    previewVariant
      ?.publicUrl ||
      asset.publicUrl
  );
};

const getImageVariantUrl = (
  asset: ResolvedMediaAsset | null | undefined,
  preferredTypes: string[],
  preferredFormat?: string
): string | null => {
  if (!asset || asset.assetType === "VIDEO") {
    return null;
  }

  const variants = Array.isArray(asset.variants)
    ? asset.variants.filter(
        (variant) =>
          variant.isActive !== false && Boolean(variant.publicUrl)
      )
    : [];

  for (const variantType of preferredTypes) {
    const match = variants.find((variant) => {
      const type = String(variant.variantType || "")
        .trim()
        .toUpperCase();

      const format = String(variant.format || "")
        .trim()
        .toUpperCase();

      return (
        type === variantType &&
        (!preferredFormat || format === preferredFormat)
      );
    });

    if (match?.publicUrl) {
      return resolveMediaUrl(match.publicUrl);
    }
  }

  return null;
};

const getDesktopImageSources = (
  asset?: ResolvedMediaAsset | null
) => {
  const preferredTypes = ["DESKTOP", "LARGE", "MEDIUM"];

  return {
    avif: getImageVariantUrl(asset, preferredTypes, "AVIF"),
    webp: getImageVariantUrl(asset, preferredTypes, "WEBP"),
    fallback:
      getImageVariantUrl(asset, preferredTypes) ||
      resolveMediaUrl(asset?.publicUrl),
  };
};

const getMobileImageSources = (
  asset?: ResolvedMediaAsset | null
) => {
  const preferredTypes = ["MOBILE", "SMALL", "MEDIUM"];

  return {
    avif: getImageVariantUrl(asset, preferredTypes, "AVIF"),
    webp: getImageVariantUrl(asset, preferredTypes, "WEBP"),
    fallback:
      getImageVariantUrl(asset, preferredTypes) ||
      resolveMediaUrl(asset?.publicUrl),
  };
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

interface HeroVideoProps {
  src: string;
  active: boolean;
  className: string;
  preload?: "none" | "metadata" | "auto";
}

function HeroVideo({
  src,
  active,
  className,
  preload = "metadata",
}: HeroVideoProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    if (active) {
      /*
       * The carousel renders every slide at
       * once. A video on a non-first slide is
       * therefore mounted while inactive.
       *
       * Changing the autoplay attribute later
       * does not reliably start playback in
       * every browser, so explicitly call play()
       * when the slide becomes active.
       */
      const playPromise =
        video.play();

      if (
        playPromise &&
        typeof playPromise.catch ===
          "function"
      ) {
        playPromise.catch(() => {
          /*
           * Muted inline playback normally
           * succeeds. Ignore browser-level
           * autoplay rejection gracefully.
           */
        });
      }

      return;
    }

    video.pause();
  }, [
    active,
    src,
  ]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay={active}
      muted
      loop
      playsInline
      preload={preload}
      className={className}
    />
  );
}

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
    "pointer-events-auto inline-flex h-7 w-fit max-w-full items-center justify-center rounded-md px-3 text-[10px] font-semibold shadow-sm transition sm:h-10 sm:rounded-lg sm:px-5 sm:text-sm",
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

interface SlideLinkLayerProps {
  url?: string;
  openInNewTab?: boolean;
  label: string;
}

function SlideLinkLayer({
  url,
  openInNewTab = false,
  label,
}: SlideLinkLayerProps) {
  const normalizedUrl =
    url?.trim();

  if (!normalizedUrl) {
    return null;
  }

  const target =
    openInNewTab
      ? "_blank"
      : undefined;

  const rel =
    openInNewTab
      ? "noopener noreferrer"
      : undefined;

  const className =
    "absolute inset-0 z-[5] block cursor-pointer";

  if (
    isExternalUrl(
      normalizedUrl
    )
  ) {
    return (
      <a
        href={
          normalizedUrl
        }
        target={
          target
        }
        rel={
          rel
        }
        className={
          className
        }
        aria-label={
          label
        }
      />
    );
  }

  return (
    <Link
      href={
        normalizedUrl
      }
      target={
        target
      }
      rel={
        rel
      }
      className={
        className
      }
      aria-label={
        label
      }
    />
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

      console.log(
        "[HeroCarousel settings]",
        settings
      );

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
      0
    );

    const desktopHeight =
    normalizeHeight(
      settings.desktopHeight ??
        settings.height,
      "320px"
    );
  
  const tabletHeight =
    normalizeHeight(
      settings.tabletHeight,
      "300px"
    );
  
  const mobileHeight =
    normalizeHeight(
      settings.mobileHeight,
      "280px"
    );
  
  const smallMobileHeight =
    normalizeHeight(
      settings.smallMobileHeight,
      "250px"
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
      className="relative mx-auto w-[calc(100%-2rem)] max-w-[1440px] overflow-hidden rounded-2xl bg-black sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]"
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
      <div
className="
  relative
  w-full
  overflow-hidden
  aspect-[768/280]
  md:aspect-[1024/300]
  lg:aspect-[1440/280]
"
>
        {slides.map(
          (
            slide,
            index
          ) => {
            const desktopAsset =
              slide
                .desktopAssetIdResolved ||
              slide
                .mobileAssetIdResolved ||
              null;

            const mobileAsset =
              slide
                .mobileAssetIdResolved ||
              slide
                .desktopAssetIdResolved ||
              null;

            const desktopImageSources =
              getDesktopImageSources(
                desktopAsset
              );

            const mobileImageSources =
              getMobileImageSources(
                mobileAsset
              );

            const desktopImageUrl =
              desktopImageSources.fallback;

            const mobileImageUrl =
              mobileImageSources.fallback;

            const desktopVideoUrl =
              getVideoUrl(
                desktopAsset
              );

            const mobileVideoUrl =
              getVideoUrl(
                mobileAsset
              );

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
                {/*
                |--------------------------------------------------------------------------
                | Responsive Hero Media
                |--------------------------------------------------------------------------
                */}

                {mobileVideoUrl || desktopVideoUrl ? (
                  <>
                    <div className="absolute inset-0 md:hidden">
                      {mobileVideoUrl ? (
                        <HeroVideo
                          src={mobileVideoUrl}
                          active={visible}
                          preload={index === 0 ? "auto" : "metadata"}
                          className={[
                            "absolute inset-0 h-full w-full object-cover",
                            mobileImagePosition,
                          ].join(" ")}
                        />
                      ) : null}
                    </div>

                    <div className="absolute inset-0 hidden md:block">
                      {desktopVideoUrl ? (
                        <HeroVideo
                          src={desktopVideoUrl}
                          active={visible}
                          preload={index === 0 ? "auto" : "metadata"}
                          className={[
                            "absolute inset-0 h-full w-full object-cover",
                            desktopImagePosition,
                          ].join(" ")}
                        />
                      ) : null}
                    </div>
                  </>
                ) : mobileImageUrl || desktopImageUrl ? (
                  <picture className="absolute inset-0 block h-full w-full">
                    {mobileImageSources.avif ? (
                      <source
                        media="(max-width: 767px)"
                        type="image/avif"
                        srcSet={mobileImageSources.avif}
                      />
                    ) : null}

                    {mobileImageSources.webp ? (
                      <source
                        media="(max-width: 767px)"
                        type="image/webp"
                        srcSet={mobileImageSources.webp}
                      />
                    ) : null}

                    {desktopImageSources.avif ? (
                      <source
                        media="(min-width: 768px)"
                        type="image/avif"
                        srcSet={desktopImageSources.avif}
                      />
                    ) : null}

                    {desktopImageSources.webp ? (
                      <source
                        media="(min-width: 768px)"
                        type="image/webp"
                        srcSet={desktopImageSources.webp}
                      />
                    ) : null}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={desktopImageUrl || mobileImageUrl || undefined}
                      alt={altText}
                      className={[
                        "absolute inset-0 h-full w-full object-contain",
                        desktopImagePosition,
                      ].join(" ")}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                  </picture>
                ) : null}

                <div className="absolute inset-0 bg-black opacity-[var(--hero-mobile-overlay)] md:opacity-[var(--hero-desktop-overlay)]" />

                <SlideLinkLayer
                  url={
                    slide.slideLinkUrl
                  }
                  openInNewTab={
                    slide.slideLinkNewTab
                  }
                  label={
                    slide.title
                      ? `Open ${slide.title}`
                      : `Open hero slide ${index + 1}`
                  }
                />

<div
  className={[
    /*
     * Mobile:
     * Keep hero content anchored to the bottom-left.
     *
     * Desktop/tablet:
     * Continue using the CMS text position.
     */
    "pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-[1440px] items-end justify-start px-4 pb-5 pt-4 sm:px-5 sm:pb-6 md:px-10 md:py-14 lg:px-14 lg:py-16",

    getDesktopPositionClasses(
      slide.textPosition
    ),
  ].join(" ")}
>
<div
  className={[
    /*
     * Mobile is always left aligned.
     * Desktop/tablet still follows CMS alignment.
     */
    "pointer-events-none flex w-full max-w-[var(--hero-content-max-width)] flex-col items-start text-left",

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
                      <div
  className="
    pointer-events-auto
    absolute
    bottom-1
    left-6
    z-20
    flex
    w-fit
    max-w-full
    flex-col
    gap-2

    sm:static
    sm:mt-7
    sm:flex-row
    sm:flex-wrap
    sm:gap-3
  "
>
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
          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-2 py-1.5 backdrop-blur-sm sm:bottom-5 sm:gap-2 sm:px-3 sm:py-2">
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
                    "h-1.5 rounded-full bg-white transition-all sm:h-2.5",
                  
                    index ===
                    activeIndex
                      ? "w-4 opacity-100 sm:w-7"
                      : "w-1.5 opacity-55 hover:opacity-85 sm:w-2.5",
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