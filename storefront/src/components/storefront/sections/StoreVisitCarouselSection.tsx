"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
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
      string;

    publicUrl?:
      string | null;

    isActive?:
      boolean;
  }>;
}

interface StoreSlide {
  id?: string;

  name?: string;

  location?: string;

  description?: string;

  desktopAssetIdResolved?:
    ResolvedMediaAsset | null;

  mobileAssetIdResolved?:
    ResolvedMediaAsset | null;

  linkLabel?: string;

  linkUrl?: string;

  openInNewTab?: boolean;

  isActive?: boolean;
}

interface Content {
  eyebrow?: string;

  title?: string;

  description?: string;

  buttonLabel?: string;

  buttonUrl?: string;

  stores?: StoreSlide[];
}

interface Settings {
  autoplay?: boolean;

  autoplayInterval?: number;

  showArrows?: boolean;

  showDots?: boolean;

  loop?: boolean;

  desktopHeight?: number;

  mobileImageHeight?: number;

  leftWidthPercent?: number;

  borderRadius?: number;

  backgroundColor?: string;

  textColor?: string;

  imageFit?:
    | "COVER"
    | "CONTAIN";

  itemsDesktop?: number;

  itemsTablet?: number;

  itemsMobile?: number;

  cardImageHeightDesktop?: number;

  cardImageHeightMobile?: number;

  sectionPaddingY?: number;

  sectionPaddingX?: number;
}

/*
|--------------------------------------------------------------------------
| Media
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
  asset?: ResolvedMediaAsset | null
): string | null => {
  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "DESKTOP" &&
        variant.isActive !==
          false &&
        Boolean(
          variant.publicUrl
        )
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "LARGE" &&
        variant.isActive !==
          false &&
        Boolean(
          variant.publicUrl
        )
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "MEDIUM" &&
        variant.isActive !==
          false &&
        Boolean(
          variant.publicUrl
        )
    );

  return resolveMediaUrl(
    preferred?.publicUrl ||
      asset.publicUrl ||
      asset.previewUrl ||
      asset.thumbnailUrl ||
      null
  );
};

/*
|--------------------------------------------------------------------------
| Link
|--------------------------------------------------------------------------
*/

const isExternal = (
  url: string
): boolean =>
  url.startsWith("http://") ||
  url.startsWith("https://") ||
  url.startsWith("tel:") ||
  url.startsWith("mailto:");

function ActionLink({
  href,
  children,
  className,
  newTab = false,
}: {
  href?: string;

  children:
    React.ReactNode;

  className:
    string;

  newTab?: boolean;
}) {
  const url =
    href?.trim();

  if (!url) {
    return null;
  }

  const target =
    newTab
      ? "_blank"
      : undefined;

  const rel =
    newTab
      ? "noopener noreferrer"
      : undefined;

  if (
    isExternal(url)
  ) {
    return (
      <a
        href={url}
        target={target}
        rel={rel}
        className={className}
      >
        {children}
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
      {children}
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| Responsive Items
|--------------------------------------------------------------------------
*/

const getItemsPerPage = (
  settings: Settings
): number => {
  if (
    typeof window ===
    "undefined"
  ) {
    return (
      settings.itemsDesktop ||
      3
    );
  }

  if (
    window.innerWidth <
    640
  ) {
    return (
      settings.itemsMobile ||
      1
    );
  }

  if (
    window.innerWidth <
    1024
  ) {
    return (
      settings.itemsTablet ||
      2
    );
  }

  return (
    settings.itemsDesktop ||
    3
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function StoreVisitCarouselSection({
  section,
}: {
  section:
    StorefrontSection;
}) {
  const content =
    (
      section.content ||
      {}
    ) as Content;

  const settings =
    (
      section.settings ||
      {}
    ) as Settings;

  const stores =
    useMemo(
      () =>
        (
          Array.isArray(
            content.stores
          )
            ? content.stores
            : []
        ).filter(
          (store) =>
            store.isActive !==
              false &&
            Boolean(
              getAssetUrl(
                store.desktopAssetIdResolved
              ) ||
                getAssetUrl(
                  store.mobileAssetIdResolved
                )
            )
        ),
      [
        content.stores,
      ]
    );

  const [
    itemsPerPage,
    setItemsPerPage,
  ] =
    useState(
      settings.itemsDesktop ||
        3
    );

  const [
    pageIndex,
    setPageIndex,
  ] =
    useState(
      0
    );

  const [
    paused,
    setPaused,
  ] =
    useState(
      false
    );

  useEffect(() => {
    const update =
      () =>
        setItemsPerPage(
          getItemsPerPage(
            settings
          )
        );

    update();

    window.addEventListener(
      "resize",
      update
    );

    return () =>
      window.removeEventListener(
        "resize",
        update
      );
  }, [
    settings,
  ]);

  const pageCount =
    Math.max(
      1,
      Math.ceil(
        stores.length /
          itemsPerPage
      )
    );

  useEffect(() => {
    if (
      pageIndex >=
      pageCount
    ) {
      setPageIndex(
        0
      );
    }
  }, [
    pageCount,
    pageIndex,
  ]);

  const autoplay =
    settings.autoplay !==
    false;

  const loop =
    settings.loop !==
    false;

  const interval =
    Math.max(
      1500,
      Number(
        settings.autoplayInterval ||
          5000
      )
    );

  useEffect(() => {
    if (
      !autoplay ||
      paused ||
      pageCount <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setPageIndex(
            (current) => {
              if (
                current <
                pageCount -
                  1
              ) {
                return (
                  current +
                  1
                );
              }

              return loop
                ? 0
                : current;
            }
          );
        },
        interval
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    autoplay,
    interval,
    loop,
    pageCount,
    paused,
  ]);

  if (
    stores.length ===
    0
  ) {
    return null;
  }

  const previous =
    () =>
      setPageIndex(
        (current) =>
          current > 0
            ? current - 1
            : loop
              ? pageCount - 1
              : current
      );

  const next =
    () =>
      setPageIndex(
        (current) =>
          current <
          pageCount - 1
            ? current + 1
            : loop
              ? 0
              : current
      );

  const startIndex =
    pageIndex *
    itemsPerPage;

  const visibleStores =
    stores.slice(
      startIndex,
      startIndex +
        itemsPerPage
    );

  const style = {
    "--store-left-width":
      `${
        Number(
          settings.leftWidthPercent ||
            28
        )
      }%`,

    "--store-radius":
      `${
        Number(
          settings.borderRadius ||
            22
        )
      }px`,

    "--store-bg":
      settings.backgroundColor ||
      "#F7F7F7",

    "--store-text":
      settings.textColor ||
      "#111111",

    "--store-card-img":
      `${
        Number(
          settings
            .cardImageHeightDesktop ||
            210
        )
      }px`,

    "--store-card-img-mobile":
      `${
        Number(
          settings
            .cardImageHeightMobile ||
            190
        )
      }px`,

    "--store-px":
      `${
        Number(
          settings.sectionPaddingX ||
            28
        )
      }px`,

    "--store-py":
      `${
        Number(
          settings.sectionPaddingY ||
            26
        )
      }px`,
  } as CSSProperties;

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
      className="
        w-full
        py-4

        sm:py-5

        lg:py-6
      "
      onMouseEnter={() =>
        setPaused(
          true
        )
      }
      onMouseLeave={() =>
        setPaused(
          false
        )
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
        <div
          style={style}
          className="
            overflow-hidden
            rounded-[var(--store-radius)]
            border
            border-[#eceeef]
            bg-[var(--store-bg)]
            shadow-[0_8px_30px_rgba(0,0,0,0.035)]
          "
        >
          <div
            className="
              grid
              gap-6
              p-[var(--store-py)]

              lg:grid-cols-[var(--store-left-width)_minmax(0,1fr)]
              lg:gap-7
            "
            style={{
              paddingLeft:
                "var(--store-px)",

              paddingRight:
                "var(--store-px)",
            }}
          >
            {/*
            |--------------------------------------------------------------------------
            | Fixed Left
            |--------------------------------------------------------------------------
            */}

            <div
              className="
                flex
                flex-col
                justify-center
                py-1

                lg:min-h-[340px]
              "
              style={{
                color:
                  "var(--store-text)",
              }}
            >
              {content.eyebrow ? (
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.24em]
                    text-[#1475ff]

                    sm:text-[11px]
                  "
                >
                  {
                    content.eyebrow
                  }
                </p>
              ) : null}

              {content.title ? (
                <h2
                  className="
                    mt-3
                    max-w-[300px]
                    text-[30px]
                    font-bold
                    leading-[1.02]
                    tracking-tight

                    sm:text-[36px]

                    lg:text-[42px]
                  "
                >
                  {
                    content.title
                  }
                </h2>
              ) : null}

              {content.description ? (
                <p
                  className="
                    mt-4
                    max-w-[310px]
                    text-sm
                    leading-6
                    text-[#737b86]

                    sm:text-[15px]
                  "
                >
                  {
                    content.description
                  }
                </p>
              ) : null}

              {content.buttonLabel &&
              content.buttonUrl ? (
                <ActionLink
                  href={
                    content.buttonUrl
                  }
                  className="
                    mt-5
                    inline-flex
                    w-fit
                    items-center
                    rounded-full
                    border
                    border-[#20242a]
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    transition

                    hover:bg-[#111111]
                    hover:text-white
                  "
                >
                  {
                    content.buttonLabel
                  }

                  <ChevronRight
                    size={16}
                    className="ml-2"
                  />
                </ActionLink>
              ) : null}
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Carousel
            |--------------------------------------------------------------------------
            */}

            <div className="relative min-w-0">
              <div
                className={[
                  "grid gap-4",
                  itemsPerPage ===
                  1
                    ? "grid-cols-1"
                    : itemsPerPage ===
                        2
                      ? "grid-cols-2"
                      : "grid-cols-3",
                ].join(
                  " "
                )}
              >
                {visibleStores.map(
                  (
                    store,
                    index
                  ) => {
                    const desktop =
                      getAssetUrl(
                        store.desktopAssetIdResolved
                      ) ||
                      getAssetUrl(
                        store.mobileAssetIdResolved
                      );

                    const mobile =
                      getAssetUrl(
                        store.mobileAssetIdResolved
                      ) ||
                      desktop;

                    const imageClass =
                      settings.imageFit ===
                      "CONTAIN"
                        ? "object-contain"
                        : "object-cover";

                    return (
                      <article
                        key={
                          store.id ||
                          `${pageIndex}-${index}`
                        }
                        className="
                          overflow-hidden
                          rounded-[16px]
                          border
                          border-[#e1e4e7]
                          bg-white
                          shadow-[0_4px_16px_rgba(0,0,0,0.04)]
                        "
                      >
                        <div
                          className="
                            relative
                            h-[var(--store-card-img-mobile)]
                            overflow-hidden
                            bg-[#f4f4f4]

                            sm:h-[var(--store-card-img)]
                          "
                        >
                          <picture>
                            {mobile ? (
                              <source
                                media="(max-width: 639px)"
                                srcSet={
                                  mobile
                                }
                              />
                            ) : null}

                            {desktop ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  desktop
                                }
                                alt={
                                  store.name ||
                                  store.desktopAssetIdResolved
                                    ?.altText ||
                                  "MyShops store"
                                }
                                className={`h-full w-full ${imageClass}`}
                                loading="lazy"
                              />
                            ) : null}
                          </picture>
                        </div>

                        <div className="p-4">
                          {store.name ? (
                            <h3
                              className="
                                text-[16px]
                                font-bold
                                leading-tight
                                text-[#161a1d]

                                sm:text-[17px]
                              "
                            >
                              {
                                store.name
                              }
                            </h3>
                          ) : null}

                          {store.location ? (
                            <div
                              className="
                                mt-2.5
                                flex
                                items-start
                                gap-2
                                text-[13px]
                                leading-5
                                text-[#747b84]
                              "
                            >
                              <MapPin
                                size={15}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {
                                  store.location
                                }
                              </span>
                            </div>
                          ) : null}

                          {store.description ? (
                            <div
                              className="
                                mt-2
                                flex
                                items-center
                                gap-2
                                text-[13px]
                                text-[#4e5660]
                              "
                            >
                              <Clock3
                                size={15}
                                className="shrink-0"
                              />

                              <span>
                                {
                                  store.description
                                }
                              </span>
                            </div>
                          ) : null}

                          {store.linkLabel &&
                          store.linkUrl ? (
                            <ActionLink
                              href={
                                store.linkUrl
                              }
                              newTab={
                                store.openInNewTab
                              }
                              className="
                                mt-3
                                inline-flex
                                items-center
                                gap-1.5
                                text-[13px]
                                font-semibold
                                text-[#1475ff]

                                hover:underline
                              "
                            >
                              <MapPin
                                size={15}
                              />

                              {
                                store.linkLabel
                              }
                            </ActionLink>
                          ) : null}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>

              {settings.showArrows !==
                false &&
              pageCount >
                1 ? (
                <>
                  <button
                    type="button"
                    onClick={
                      previous
                    }
                    aria-label="Previous stores"
                    className="
                      absolute
                      left-[-18px]
                      top-[42%]
                      z-20
                      hidden
                      h-10
                      w-10
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#e1e4e7]
                      bg-white
                      shadow-md

                      sm:flex
                    "
                  >
                    <ChevronLeft
                      size={19}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      next
                    }
                    aria-label="Next stores"
                    className="
                      absolute
                      right-[-18px]
                      top-[42%]
                      z-20
                      hidden
                      h-10
                      w-10
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#e1e4e7]
                      bg-white
                      shadow-md

                      sm:flex
                    "
                  >
                    <ChevronRight
                      size={19}
                    />
                  </button>
                </>
              ) : null}

              {settings.showDots !==
                false &&
              pageCount >
                1 ? (
                <div
                  className="
                    mt-4
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  {Array.from({
                    length:
                      pageCount,
                  }).map(
                    (
                      _,
                      index
                    ) => (
                      <button
                        key={
                          index
                        }
                        type="button"
                        onClick={() =>
                          setPageIndex(
                            index
                          )
                        }
                        className={[
                          "h-2 rounded-full transition-all",
                          index ===
                          pageIndex
                            ? "w-5 bg-[#1f2937]"
                            : "w-2 bg-[#d6d9dd]",
                        ].join(
                          " "
                        )}
                        aria-label={`Go to store group ${
                          index +
                          1
                        }`}
                      />
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}