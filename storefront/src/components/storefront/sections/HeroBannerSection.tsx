import type {
    CSSProperties,
  } from "react";
  
  import Link from "next/link";
  
  import type {
    StorefrontSection,
  } from "@/types/storefront";
  
  interface HeroBannerSectionProps {
    section: StorefrontSection;
  }
  
  interface ResolvedMediaAsset {
    id?: string;
    publicUrl?: string | null;
    altText?: string | null;
    title?: string | null;
    description?: string | null;
  }
  
  type ContentAlignment =
    | "LEFT"
    | "CENTER"
    | "RIGHT";
  
  interface HeroBannerContent {
    desktopAssetId?: string | null;
    mobileAssetId?: string | null;
    kioskAssetId?: string | null;
  
    desktopAssetIdResolved?:
      | ResolvedMediaAsset
      | null;
  
    mobileAssetIdResolved?:
      | ResolvedMediaAsset
      | null;
  
    kioskAssetIdResolved?:
      | ResolvedMediaAsset
      | null;
  
    title?: string;
    subtitle?: string;
    description?: string;
  
    buttonLabel?: string;
    buttonUrl?: string;
  
    openInNewTab?: boolean;
  }
  
  interface HeroBannerSettings {
    contentAlignment?: ContentAlignment;
  
    overlayEnabled?: boolean;
    overlayOpacity?: number;
  
    desktopHeight?: number | string;
    mobileHeight?: number | string;
    kioskHeight?: number | string;
  
    contentMaxWidth?: number | string;
  
    backgroundColor?: string;
    textColor?: string;
  
    imagePosition?:
      | "CENTER"
      | "LEFT"
      | "RIGHT"
      | "TOP"
      | "BOTTOM";
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
      const trimmed = value.trim();
  
      return /^\d+$/.test(trimmed)
        ? `${trimmed}px`
        : trimmed;
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
      const trimmed = value.trim();
  
      return /^\d+$/.test(trimmed)
        ? `${trimmed}px`
        : trimmed;
    }
  
    return fallback;
  };
  
  const normalizeOpacity = (
    value: unknown,
    fallback: number
  ): number => {
    const parsed = Number(value);
  
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
  
    return Math.min(
      Math.max(parsed, 0),
      0.9
    );
  };
  
  const getAlignmentClasses = (
    alignment?: ContentAlignment
  ): string => {
    switch (alignment) {
      case "CENTER":
        return "items-center text-center";
  
      case "RIGHT":
        return "items-end text-right";
  
      case "LEFT":
      default:
        return "items-start text-left";
    }
  };
  
  const getContainerAlignmentClasses = (
    alignment?: ContentAlignment
  ): string => {
    switch (alignment) {
      case "CENTER":
        return "justify-center";
  
      case "RIGHT":
        return "justify-end";
  
      case "LEFT":
      default:
        return "justify-start";
    }
  };
  
  const getObjectPositionClass = (
    position?: HeroBannerSettings["imagePosition"]
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
  
  export default function HeroBannerSection({
    section,
  }: HeroBannerSectionProps) {
    const content =
      section.content &&
      typeof section.content === "object"
        ? (section.content as HeroBannerContent)
        : {};
  
    const settings =
      section.settings &&
      typeof section.settings === "object"
        ? (section.settings as HeroBannerSettings)
        : {};
  
    const desktopUrl =
      resolveMediaUrl(
        content.desktopAssetIdResolved
          ?.publicUrl
      );
  
    const mobileUrl =
      resolveMediaUrl(
        content.mobileAssetIdResolved
          ?.publicUrl
      );
  
    const fallbackUrl =
      desktopUrl ||
      mobileUrl ||
      resolveMediaUrl(
        content.kioskAssetIdResolved
          ?.publicUrl
      );
  
    if (!fallbackUrl) {
      return null;
    }
  
    const desktopHeight =
      normalizeHeight(
        settings.desktopHeight,
        "560px"
      );
  
    const mobileHeight =
      normalizeHeight(
        settings.mobileHeight,
        "420px"
      );
  
    const contentMaxWidth =
      normalizeWidth(
        settings.contentMaxWidth,
        "720px"
      );
  
    const overlayOpacity =
      settings.overlayEnabled === false
        ? 0
        : normalizeOpacity(
            settings.overlayOpacity,
            0.25
          );
  
    const alignment =
      settings.contentAlignment ||
      "LEFT";
  
    const textColor =
      settings.textColor ||
      "#FFFFFF";
  
    const backgroundColor =
      settings.backgroundColor ||
      "#111111";
  
    const imagePosition =
      getObjectPositionClass(
        settings.imagePosition
      );
  
    const altText =
      content.desktopAssetIdResolved
        ?.altText ||
      content.mobileAssetIdResolved
        ?.altText ||
      content.title ||
      content.desktopAssetIdResolved
        ?.title ||
      content.mobileAssetIdResolved
        ?.title ||
      "Promotional banner";
  
    const buttonLabel =
      content.buttonLabel?.trim();
  
    const buttonUrl =
      content.buttonUrl?.trim();
  
    const buttonTarget =
      content.openInNewTab
        ? "_blank"
        : undefined;
  
    const buttonRel =
      content.openInNewTab
        ? "noopener noreferrer"
        : undefined;
  
    const buttonClassName =
      "inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-white/90";
  
    return (
      <section
        data-section-id={section.id}
        data-section-code={section.code}
        data-section-type={
          section.type.code
        }
        className="relative w-full overflow-hidden"
        style={
          {
            "--banner-desktop-height":
              desktopHeight,
  
            "--banner-mobile-height":
              mobileHeight,
  
            "--banner-content-max-width":
              contentMaxWidth,
  
            "--banner-overlay-opacity":
              overlayOpacity,
  
            backgroundColor,
          } as CSSProperties
        }
      >
        <div className="relative h-[var(--banner-mobile-height)] min-h-[360px] overflow-hidden md:h-[var(--banner-desktop-height)]">
          <picture>
            {mobileUrl ? (
              <source
                media="(max-width: 767px)"
                srcSet={mobileUrl}
              />
            ) : null}
  
            {desktopUrl ? (
              <source
                media="(min-width: 768px)"
                srcSet={desktopUrl}
              />
            ) : null}
  
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallbackUrl}
              alt={altText}
              className={[
                "absolute inset-0 h-full w-full object-cover",
                imagePosition,
              ].join(" ")}
              loading="eager"
              fetchPriority="high"
            />
          </picture>
  
          {overlayOpacity > 0 ? (
            <div className="absolute inset-0 bg-black opacity-[var(--banner-overlay-opacity)]" />
          ) : null}
  
          <div
            className={[
              "relative z-10 mx-auto flex h-full w-full max-w-[1440px] items-center px-5 py-10 sm:px-8 md:px-10 lg:px-14",
              getContainerAlignmentClasses(
                alignment
              ),
            ].join(" ")}
          >
            <div
              className={[
                "flex w-full max-w-[var(--banner-content-max-width)] flex-col",
                getAlignmentClasses(
                  alignment
                ),
              ].join(" ")}
              style={{
                color: textColor,
              }}
            >
              {content.subtitle ? (
                <p className="text-xs font-bold uppercase tracking-[0.2em] sm:text-sm">
                  {content.subtitle}
                </p>
              ) : null}
  
              {content.title ? (
                <h2 className="mt-3 text-balance text-[clamp(2rem,8vw,3.5rem)] font-bold leading-[1.05] tracking-tight md:text-[clamp(3rem,5vw,5rem)]">
                  {content.title}
                </h2>
              ) : null}
  
              {content.description ? (
                <p className="mt-4 max-w-xl text-sm leading-6 opacity-95 sm:text-base sm:leading-7 lg:text-lg">
                  {content.description}
                </p>
              ) : null}
  
              {buttonLabel && buttonUrl ? (
                <div className="mt-6">
                  {isExternalUrl(
                    buttonUrl
                  ) ? (
                    <a
                      href={buttonUrl}
                      target={buttonTarget}
                      rel={buttonRel}
                      className={
                        buttonClassName
                      }
                    >
                      {buttonLabel}
                    </a>
                  ) : (
                    <Link
                      href={buttonUrl}
                      target={buttonTarget}
                      rel={buttonRel}
                      className={
                        buttonClassName
                      }
                    >
                      {buttonLabel}
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }