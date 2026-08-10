import Link from "next/link";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

import styles from "./PromotionBannerGridSection.module.css";

interface PromotionBannerGridSectionProps {
  section: StorefrontSection;
}

interface ResolvedMediaAsset {
  id?: string;
  publicUrl?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  altText?: string | null;
  title?: string | null;
}

interface PromotionBannerItem {
  id?: string;

  desktopAssetIdResolved?:
    | ResolvedMediaAsset
    | null;

  tabletAssetIdResolved?:
    | ResolvedMediaAsset
    | null;

  mobileAssetIdResolved?:
    | ResolvedMediaAsset
    | null;

  altText?: string;
  linkUrl?: string;
  openInNewTab?: boolean;

  desktopSpan?: number;
  tabletSpan?: number;
  mobileSpan?: number;

  desktopHeight?: number;
  tabletHeight?: number;
  mobileHeight?: number;

  imageFit?:
    | "COVER"
    | "CONTAIN"
    | "FILL";

  imagePosition?:
    | "CENTER"
    | "LEFT"
    | "RIGHT"
    | "TOP"
    | "BOTTOM";
}

interface PromotionBannerGridContent {
  title?: string;
  subtitle?: string;
  items?: PromotionBannerItem[];
}

interface PromotionBannerGridSettings {
  heightMode?:
    | "UNIFORM"
    | "PER_ITEM";

  mobileDisplayMode?:
    | "STACK"
    | "GRID"
    | "CAROUSEL";

  desktopGap?: number;
  tabletGap?: number;
  mobileGap?: number;

  desktopHeight?: number;
  tabletHeight?: number;
  mobileHeight?: number;

  borderRadius?: number;
  sectionPaddingTop?: number;
  sectionPaddingBottom?: number;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const resolveMediaUrl = (
  value?: string | null
): string | null => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `${API_BASE_URL}${
    value.startsWith("/")
      ? value
      : `/${value}`
  }`;
};

const getAssetUrl = (
  asset?:
    | ResolvedMediaAsset
    | null
): string | null =>
  resolveMediaUrl(
    asset?.publicUrl ||
      asset?.previewUrl ||
      asset?.thumbnailUrl ||
      null
  );

const clampInteger = (
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.round(number)
    )
  );
};

const isExternalUrl = (
  value: string
): boolean =>
  value.startsWith("http://") ||
  value.startsWith("https://") ||
  value.startsWith("mailto:") ||
  value.startsWith("tel:");

function BannerLink({
  href,
  openInNewTab,
  children,
  className,
  style,
}: {
  href?: string;
  openInNewTab?: boolean;
  children: ReactNode;
  className: string;
  style: CSSProperties;
}) {
  const normalizedHref =
    href?.trim();

  if (!normalizedHref) {
    return (
      <div
        className={className}
        style={style}
      >
        {children}
      </div>
    );
  }

  const target =
    openInNewTab
      ? "_blank"
      : undefined;

  const rel =
    openInNewTab
      ? "noopener noreferrer"
      : undefined;

  if (
    isExternalUrl(
      normalizedHref
    )
  ) {
    return (
      <a
        href={normalizedHref}
        target={target}
        rel={rel}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={normalizedHref}
      target={target}
      rel={rel}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}

export default function PromotionBannerGridSection({
  section,
}: PromotionBannerGridSectionProps) {
  const content =
    section.content &&
    typeof section.content ===
      "object"
      ? (section.content as PromotionBannerGridContent)
      : {};

  const settings =
    section.settings &&
    typeof section.settings ===
      "object"
      ? (section.settings as PromotionBannerGridSettings)
      : {};

  const items =
    Array.isArray(content.items)
      ? content.items.filter(
          (item) =>
            Boolean(
              getAssetUrl(
                item.desktopAssetIdResolved
              ) ||
                getAssetUrl(
                  item.tabletAssetIdResolved
                ) ||
                getAssetUrl(
                  item.mobileAssetIdResolved
                )
            )
        )
      : [];

  if (!items.length) {
    return null;
  }

  const heightMode =
    settings.heightMode ||
    "UNIFORM";

  const mobileDisplayMode =
    settings.mobileDisplayMode ||
    "STACK";

  const sectionStyle = {
    "--promo-desktop-gap": `${clampInteger(
      settings.desktopGap,
      0,
      64,
      24
    )}px`,

    "--promo-tablet-gap": `${clampInteger(
      settings.tabletGap,
      0,
      64,
      16
    )}px`,

    "--promo-mobile-gap": `${clampInteger(
      settings.mobileGap,
      0,
      64,
      12
    )}px`,

    "--promo-border-radius": `${clampInteger(
      settings.borderRadius,
      0,
      48,
      16
    )}px`,

    "--promo-section-padding-top": `${clampInteger(
      settings.sectionPaddingTop,
      0,
      160,
      24
    )}px`,

    "--promo-section-padding-bottom": `${clampInteger(
      settings.sectionPaddingBottom,
      0,
      160,
      24
    )}px`,

    "--promo-uniform-desktop-height": `${clampInteger(
      settings.desktopHeight,
      120,
      1200,
      420
    )}px`,

    "--promo-uniform-tablet-height": `${clampInteger(
      settings.tabletHeight,
      120,
      1200,
      320
    )}px`,

    "--promo-uniform-mobile-height": `${clampInteger(
      settings.mobileHeight,
      120,
      1200,
      280
    )}px`,
  } as CSSProperties;

  return (
    <section
      data-section-id={section.id}
      data-section-code={section.code}
      data-section-type={
        section.type.code
      }
      className={styles.section}
      style={sectionStyle}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {content.title ||
        content.subtitle ? (
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              {content.title ? (
                <h2 className="text-2xl font-bold tracking-tight text-storefront-text">
                  {content.title}
                </h2>
              ) : null}

              {content.subtitle ? (
                <p className="mt-1 text-sm text-storefront-muted">
                  {content.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className={[
            styles.grid,
            mobileDisplayMode ===
            "CAROUSEL"
              ? styles.mobileCarousel
              : "",
            mobileDisplayMode ===
            "GRID"
              ? styles.mobileGrid
              : styles.mobileStack,
          ].join(" ")}
        >
          {items.map(
            (item, index) => {
              const desktopUrl =
                getAssetUrl(
                  item.desktopAssetIdResolved
                );

              const tabletUrl =
                getAssetUrl(
                  item.tabletAssetIdResolved
                );

              const mobileUrl =
                getAssetUrl(
                  item.mobileAssetIdResolved
                );

              const fallbackUrl =
                desktopUrl ||
                tabletUrl ||
                mobileUrl;

              if (!fallbackUrl) {
                return null;
              }

              const itemStyle = {
                "--promo-desktop-span":
                  clampInteger(
                    item.desktopSpan,
                    1,
                    12,
                    4
                  ),

                "--promo-tablet-span":
                  clampInteger(
                    item.tabletSpan,
                    1,
                    6,
                    3
                  ),

                "--promo-mobile-span":
                  clampInteger(
                    item.mobileSpan,
                    1,
                    2,
                    1
                  ),

                "--promo-desktop-height":
                  heightMode ===
                  "PER_ITEM"
                    ? `${clampInteger(
                        item.desktopHeight,
                        120,
                        1200,
                        420
                      )}px`
                    : "var(--promo-uniform-desktop-height)",

                "--promo-tablet-height":
                  heightMode ===
                  "PER_ITEM"
                    ? `${clampInteger(
                        item.tabletHeight,
                        120,
                        1200,
                        320
                      )}px`
                    : "var(--promo-uniform-tablet-height)",

                "--promo-mobile-height":
                  heightMode ===
                  "PER_ITEM"
                    ? `${clampInteger(
                        item.mobileHeight,
                        120,
                        1200,
                        280
                      )}px`
                    : "var(--promo-uniform-mobile-height)",

                "--promo-object-fit":
                  String(
                    item.imageFit ||
                    "COVER"
                  ).toLowerCase(),

                "--promo-object-position":
                  String(
                    item.imagePosition ||
                    "CENTER"
                  )
                    .toLowerCase()
                    .replace(
                      "_",
                      " "
                    ),
              } as CSSProperties;

              const altText =
                item.altText?.trim() ||
                item.desktopAssetIdResolved
                  ?.altText ||
                item.mobileAssetIdResolved
                  ?.altText ||
                item.desktopAssetIdResolved
                  ?.title ||
                `Promotion ${index + 1}`;

              return (
                <BannerLink
                  key={
                    item.id ||
                    `promotion-${index}`
                  }
                  href={item.linkUrl}
                  openInNewTab={
                    item.openInNewTab
                  }
                  className={
                    styles.item
                  }
                  style={itemStyle}
                >
                  <picture>
                    {mobileUrl ? (
                      <source
                        media="(max-width: 639px)"
                        srcSet={mobileUrl}
                      />
                    ) : null}

                    {tabletUrl ? (
                      <source
                        media="(min-width: 640px) and (max-width: 1023px)"
                        srcSet={tabletUrl}
                      />
                    ) : null}

                    {desktopUrl ? (
                      <source
                        media="(min-width: 1024px)"
                        srcSet={desktopUrl}
                      />
                    ) : null}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fallbackUrl}
                      alt={altText}
                      className={
                        styles.image
                      }
                      loading="lazy"
                    />
                  </picture>
                </BannerLink>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}
