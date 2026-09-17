import Link from "next/link";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

import styles from "./PromotionBannerGridSection.module.css";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface PromotionBannerGridSectionProps {
  section: StorefrontSection;
}

/*
|--------------------------------------------------------------------------
| Media
|--------------------------------------------------------------------------
*/

interface ResolvedMediaAsset {
  id?: string;

  publicUrl?:
    string | null;

  previewUrl?:
    string | null;

  thumbnailUrl?:
    string | null;

  altText?:
    string | null;

  title?:
    string | null;

  variants?: Array<{
    variantType?:
      string | null;

    format?:
      string | null;

    mimeType?:
      string | null;

    publicUrl?:
      string | null;

    isActive?:
      boolean;

    isPrimary?:
      boolean;
  }>;
}
/*
|--------------------------------------------------------------------------
| Banner Item
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | Image
  |--------------------------------------------------------------------------
  */

  altText?: string;

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

  /*
  |--------------------------------------------------------------------------
  | Banner Click
  |--------------------------------------------------------------------------
  */

  linkUrl?: string;

  openInNewTab?: boolean;

  /*
  |--------------------------------------------------------------------------
  | CTA
  |--------------------------------------------------------------------------
  */

  buttonLabel?: string;

  buttonUrl?: string;

  buttonPosition?:
    | "LEFT"
    | "CENTER"
    | "RIGHT";

  /*
  |--------------------------------------------------------------------------
  | Responsive Grid
  |--------------------------------------------------------------------------
  */

  desktopSpan?: number;

  tabletSpan?: number;

  mobileSpan?: number;

  /*
  |--------------------------------------------------------------------------
  | Heights
  |--------------------------------------------------------------------------
  */

  desktopHeight?: number;

  tabletHeight?: number;

  mobileHeight?: number;
}

/*
|--------------------------------------------------------------------------
| Content
|--------------------------------------------------------------------------
*/

interface PromotionBannerGridContent {
  title?: string;

  subtitle?: string;

  items?:
    PromotionBannerItem[];
}

/*
|--------------------------------------------------------------------------
| Settings
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| API Base URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/api\/v1\/?$/,
  ""
);

/*
|--------------------------------------------------------------------------
| Resolve Media URL
|--------------------------------------------------------------------------
*/

const resolveMediaUrl = (
  value?:
    string | null
): string | null => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    return value;
  }

  return `${API_BASE_URL}${
    value.startsWith(
      "/"
    )
      ? value
      : `/${value}`
  }`;
};

/*
|--------------------------------------------------------------------------
| Get Asset URL
|--------------------------------------------------------------------------
*/

type PromotionImageTarget =
  | "DESKTOP"
  | "TABLET"
  | "MOBILE";

const getAssetUrl = (
  asset:
    | ResolvedMediaAsset
    | null
    | undefined,

  target:
    PromotionImageTarget =
      "DESKTOP"
): string | null => {
  if (!asset) {
    return null;
  }

  const variants =
    Array.isArray(
      asset.variants
    )
      ? asset.variants.filter(
          (
            variant
          ) =>
            variant.isActive !==
              false &&
            Boolean(
              variant.publicUrl
            )
        )
      : [];

  /*
  |--------------------------------------------------------------------------
  | Responsive Variant Preference
  |--------------------------------------------------------------------------
  */

  const preferredTypes:
    string[] =
      target ===
      "MOBILE"
        ? [
            "MOBILE",
            "SMALL",
            "MEDIUM",
            "PREVIEW",
          ]
        : target ===
          "TABLET"
        ? [
            "TABLET",
            "MEDIUM",
            "LARGE",
            "PREVIEW",
          ]
        : [
            "DESKTOP",
            "LARGE",
            "MEDIUM",
            "PREVIEW",
          ];

  /*
  |--------------------------------------------------------------------------
  | Prefer AVIF
  |--------------------------------------------------------------------------
  */

  for (
    const variantType of
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
            variantType &&
          String(
            variant.format ||
              ""
          )
            .trim()
            .toUpperCase() ===
            "AVIF"
      );

    if (
      match?.publicUrl
    ) {
      return resolveMediaUrl(
        match.publicUrl
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | WebP Fallback
  |--------------------------------------------------------------------------
  */

  for (
    const variantType of
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
            variantType &&
          String(
            variant.format ||
              ""
          )
            .trim()
            .toUpperCase() ===
            "WEBP"
      );

    if (
      match?.publicUrl
    ) {
      return resolveMediaUrl(
        match.publicUrl
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Any Optimized Variant
  |--------------------------------------------------------------------------
  */

  for (
    const variantType of
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
            variantType
      );

    if (
      match?.publicUrl
    ) {
      return resolveMediaUrl(
        match.publicUrl
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Variant
  |--------------------------------------------------------------------------
  */

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
    return resolveMediaUrl(
      primary.publicUrl
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Final Asset Fallback
  |--------------------------------------------------------------------------
  |
  | Original publicUrl intentionally comes LAST.
  |--------------------------------------------------------------------------
  */

  return resolveMediaUrl(
    asset.thumbnailUrl ||
      asset.previewUrl ||
      asset.publicUrl ||
      null
  );
};
/*
|--------------------------------------------------------------------------
| Clamp Integer
|--------------------------------------------------------------------------
*/

const clampInteger = (
  value:
    unknown,

  minimum:
    number,

  maximum:
    number,

  fallback:
    number
): number => {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.min(
    maximum,

    Math.max(
      minimum,
      Math.round(
        number
      )
    )
  );
};

/*
|--------------------------------------------------------------------------
| External URL
|--------------------------------------------------------------------------
*/

const isExternalUrl = (
  value:
    string
): boolean =>
  value.startsWith(
    "http://"
  ) ||
  value.startsWith(
    "https://"
  ) ||
  value.startsWith(
    "mailto:"
  ) ||
  value.startsWith(
    "tel:"
  );

/*
|--------------------------------------------------------------------------
| Banner Link
|--------------------------------------------------------------------------
|
| This controls the optional click action for the ENTIRE banner.
|
|--------------------------------------------------------------------------
*/

function BannerLink({
  href,
  openInNewTab,
  children,
  className,
  style,
}: {
  href?: string;

  openInNewTab?: boolean;

  children:
    ReactNode;

  className:
    string;

  style:
    CSSProperties;
}) {
  const normalizedHref =
    href?.trim();

  /*
   * No banner URL:
   * render a normal DIV.
   */

  if (
    !normalizedHref
  ) {
    return (
      <div
        className={
          className
        }
        style={
          style
        }
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

  /*
   * External URL
   */

  if (
    isExternalUrl(
      normalizedHref
    )
  ) {
    return (
      <a
        href={
          normalizedHref
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
        style={
          style
        }
      >
        {children}
      </a>
    );
  }

  /*
   * Internal URL
   */

  return (
    <Link
      href={
        normalizedHref
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
      style={
        style
      }
    >
      {children}
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| CTA Link
|--------------------------------------------------------------------------
|
| Separate from BannerLink so we never create:
|
| <a>
|   <a>CTA</a>
| </a>
|
|--------------------------------------------------------------------------
*/

function CtaLink({
  href,
  openInNewTab,
  children,
  className,
}: {
  href?: string;

  openInNewTab?: boolean;

  children:
    ReactNode;

  className:
    string;
}) {
  const normalizedHref =
    href?.trim();

  if (
    !normalizedHref
  ) {
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

  /*
   * External URL
   */

  if (
    isExternalUrl(
      normalizedHref
    )
  ) {
    return (
      <a
        href={
          normalizedHref
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
      >
        {children}
      </a>
    );
  }

  /*
   * Internal URL
   */

  return (
    <Link
      href={
        normalizedHref
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
    >
      {children}
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function PromotionBannerGridSection({
  section,
}: PromotionBannerGridSectionProps) {
  /*
  |--------------------------------------------------------------------------
  | Content
  |--------------------------------------------------------------------------
  */

  const content =
    section.content &&
    typeof section.content ===
      "object"
      ? (
          section.content as
            PromotionBannerGridContent
        )
      : {};

  /*
  |--------------------------------------------------------------------------
  | Settings
  |--------------------------------------------------------------------------
  */

  const settings =
    section.settings &&
    typeof section.settings ===
      "object"
      ? (
          section.settings as
            PromotionBannerGridSettings
        )
      : {};

  /*
  |--------------------------------------------------------------------------
  | Valid Items
  |--------------------------------------------------------------------------
  */

  const items =
    Array.isArray(
      content.items
    )
      ? content.items.filter(
          (
            item
          ) =>
            Boolean(
              getAssetUrl(
                item
                  .desktopAssetIdResolved
              ) ||
                getAssetUrl(
                  item
                    .tabletAssetIdResolved
                ) ||
                getAssetUrl(
                  item
                    .mobileAssetIdResolved
                )
            )
        )
      : [];

  if (
    !items.length
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Height Mode
  |--------------------------------------------------------------------------
  */

  const heightMode =
    settings.heightMode ||
    "UNIFORM";

  /*
  |--------------------------------------------------------------------------
  | Mobile Display
  |--------------------------------------------------------------------------
  */

  const mobileDisplayMode =
    settings
      .mobileDisplayMode ||
    "STACK";

  /*
  |--------------------------------------------------------------------------
  | Section CSS Variables
  |--------------------------------------------------------------------------
  */

  const sectionStyle = {
    "--promo-desktop-gap":
      `${clampInteger(
        settings.desktopGap,
        0,
        64,
        24
      )}px`,

    "--promo-tablet-gap":
      `${clampInteger(
        settings.tabletGap,
        0,
        64,
        16
      )}px`,

    "--promo-mobile-gap":
      `${clampInteger(
        settings.mobileGap,
        0,
        64,
        12
      )}px`,

    "--promo-border-radius":
      `${clampInteger(
        settings.borderRadius,
        0,
        48,
        16
      )}px`,

    "--promo-section-padding-top":
      `${clampInteger(
        settings
          .sectionPaddingTop,
        0,
        160,
        24
      )}px`,

    "--promo-section-padding-bottom":
      `${clampInteger(
        settings
          .sectionPaddingBottom,
        0,
        160,
        24
      )}px`,

    "--promo-uniform-desktop-height":
      `${clampInteger(
        settings.desktopHeight,
        120,
        1200,
        420
      )}px`,

    "--promo-uniform-tablet-height":
      `${clampInteger(
        settings.tabletHeight,
        120,
        1200,
        320
      )}px`,

    "--promo-uniform-mobile-height":
      `${clampInteger(
        settings.mobileHeight,
        120,
        1200,
        280
      )}px`,
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
      data-section-code={
        section.code
      }
      data-section-type={
        section.type.code
      }
      className={
        styles.section
      }
      style={
        sectionStyle
      }
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1440px]
          px-4

          sm:px-6

          lg:px-8
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | Optional Heading
        |--------------------------------------------------------------------------
        */}

        {content.title ||
        content.subtitle ? (
          <div
  className="
    mb-2
    flex
    items-end
    justify-between
    gap-4

    sm:mb-5
  "
>
            <div>
              {content.title ? (
                <h2
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-storefront-text
                  "
                >
                  {
                    content.title
                  }
                </h2>
              ) : null}

              {content.subtitle ? (
                <p
                  className="
                    mt-1
                    text-sm
                    text-storefront-muted
                  "
                >
                  {
                    content.subtitle
                  }
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Grid
        |--------------------------------------------------------------------------
        */}

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
          ].join(
            " "
          )}
        >
          {items.map(
            (
              item,
              index
            ) => {
              /*
              |--------------------------------------------------------------------------
              | Media URLs
              |--------------------------------------------------------------------------
              */

              const desktopUrl =
              getAssetUrl(
                item
                  .desktopAssetIdResolved,
                "DESKTOP"
              );
            
            const tabletUrl =
              getAssetUrl(
                item
                  .tabletAssetIdResolved,
                "TABLET"
              );
            
            const mobileUrl =
              getAssetUrl(
                item
                  .mobileAssetIdResolved,
                "MOBILE"
              );

              const fallbackUrl =
                desktopUrl ||
                tabletUrl ||
                mobileUrl;

              if (
                !fallbackUrl
              ) {
                return null;
              }

              /*
              |--------------------------------------------------------------------------
              | Item CSS Variables
              |--------------------------------------------------------------------------
              */

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

              /*
              |--------------------------------------------------------------------------
              | Alt Text
              |--------------------------------------------------------------------------
              */

              const altText =
                item.altText
                  ?.trim() ||
                item
                  .desktopAssetIdResolved
                  ?.altText ||
                item
                  .mobileAssetIdResolved
                  ?.altText ||
                item
                  .desktopAssetIdResolved
                  ?.title ||
                `Promotion ${
                  index + 1
                }`;

              /*
              |--------------------------------------------------------------------------
              | CTA Position
              |--------------------------------------------------------------------------
              */

              const buttonPosition =
                item.buttonPosition ||
                "LEFT";

              const buttonAlignmentClass =
                buttonPosition ===
                "CENTER"
                  ? "justify-center"
                  : buttonPosition ===
                      "RIGHT"
                    ? "justify-end"
                    : "justify-start";

              /*
              |--------------------------------------------------------------------------
              | CTA Visibility
              |--------------------------------------------------------------------------
              */

              const hasCta =
                Boolean(
                  item.buttonLabel
                    ?.trim()
                ) &&
                Boolean(
                  item.buttonUrl
                    ?.trim()
                );

              /*
              |--------------------------------------------------------------------------
              | Banner
              |--------------------------------------------------------------------------
              */

              return (
                <div
                  key={
                    item.id ||
                    `promotion-${index}`
                  }
                  className={`
                    ${styles.item}
                    relative
                  `}
                  style={
                    itemStyle
                  }
                >
                  {/*
                  |--------------------------------------------------------------------------
                  | Image / Banner Click Area
                  |--------------------------------------------------------------------------
                  */}

                  <BannerLink
                    href={
                      item.linkUrl
                    }
                    openInNewTab={
                      item.openInNewTab
                    }
                    className="
                      absolute
                      inset-0
                      block
                      h-full
                      w-full
                    "
                    style={{}}
                  >
                    <picture>
                      {mobileUrl ? (
                        <source
                          media="(max-width: 639px)"
                          srcSet={
                            mobileUrl
                          }
                        />
                      ) : null}

                      {tabletUrl ? (
                        <source
                          media="(min-width: 640px) and (max-width: 1023px)"
                          srcSet={
                            tabletUrl
                          }
                        />
                      ) : null}

                      {desktopUrl ? (
                        <source
                          media="(min-width: 1024px)"
                          srcSet={
                            desktopUrl
                          }
                        />
                      ) : null}

                      {/* eslint-disable-next-line @next/next/no-img-element */}

                      <img
                        src={
                          fallbackUrl
                        }
                        alt={
                          altText
                        }
                        className={
                          styles.image
                        }
                        loading="lazy"
                      />
                    </picture>
                  </BannerLink>

                  {/*
                  |--------------------------------------------------------------------------
                  | CTA Overlay
                  |--------------------------------------------------------------------------
                  */}

                  {hasCta ? (
                    <div
                      className={`
                        pointer-events-none
                        absolute
                        inset-x-0
                        bottom-3
                        z-20
                        flex
                        px-3

                        sm:bottom-4
                        sm:px-4

                        ${buttonAlignmentClass}
                      `}
                    >
                      <CtaLink
                        href={
                          item.buttonUrl
                        }
                        openInNewTab={
                          item.openInNewTab
                        }
                        className="
                          pointer-events-auto
                          inline-flex
                          min-h-8
                          items-center
                          justify-center
                          rounded-md
                          border
                          border-[#111111]
                          bg-white/95
                          px-3
                          py-1.5
                          text-[11px]
                          font-semibold
                          leading-none
                          text-[#111111]
                          shadow-sm
                          backdrop-blur-sm
                          transition

                          hover:bg-[#111111]
                          hover:text-white

                          sm:min-h-9
                          sm:px-3.5
                          sm:py-2
                          sm:text-xs

                          lg:text-sm
                        "
                      >
                        {
                          item.buttonLabel
                        }
                      </CtaLink>
                    </div>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}