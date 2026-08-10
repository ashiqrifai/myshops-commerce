import {
    ImageIcon,
  } from "lucide-react";
  
  import Link from "next/link";
  
  import type {
    StorefrontSection,
  } from "@/types/storefront";
  
  interface CategoryGridSectionProps {
    section: StorefrontSection;
  }
  
  interface PublicMediaAsset {
    id?: string;
  
    publicUrl?:
      string | null;
  
    thumbnailUrl?:
      string | null;
  
    previewUrl?:
      string | null;
  
    altText?:
      string | null;
  
    title?:
      string | null;
  }
  
  interface PublicCategory {
    id: string;
    name: string;
    slug: string;
  
    description?:
      string | null;
  
    shortDescription?:
      string | null;
  
    categoryPath?:
      string | null;
  
    thumbnailAsset?:
      PublicMediaAsset | null;
  
    imageAsset?:
      PublicMediaAsset | null;
  
    bannerAsset?:
      PublicMediaAsset | null;
  
    image?:
      PublicMediaAsset | null;
  
    productCount?:
      number | null;
  }
  
  interface CategoryGridContent {
    title?: string;
    subtitle?: string;
  
    categoryIds?:
      string[];
  
    categoryIdsResolved?:
      PublicCategory[];
  }
  
  interface CategoryGridSettings {
    showName?: boolean;
    showImage?: boolean;
  
    showProductCount?:
      boolean;
  
    cardStyle?:
      | "ROUNDED"
      | "SQUARE"
      | "CIRCLE"
      | string;
  
    columnsMobile?:
      number;
  
    columnsTablet?:
      number;
  
    columnsDesktop?:
      number;
  
    columnsKiosk?:
      number;
  
    imageFit?:
      | "COVER"
      | "CONTAIN";
  
    sectionBackgroundColor?:
      string;
  
    cardBackgroundColor?:
      string;
  
    cardTextColor?:
      string;
  }
  
  const BACKEND_URL = (
    process.env
      .NEXT_PUBLIC_BACKEND_URL ||
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5080"
  )
    .replace(
      /\/api\/v1\/?$/,
      ""
    )
    .replace(/\/$/, "");
  
  const toAbsoluteUrl = (
    value?: string | null
  ): string | null => {
    if (!value) {
      return null;
    }
  
    const normalized =
      value.trim();
  
    if (!normalized) {
      return null;
    }
  
    if (
      normalized.startsWith(
        "http://"
      ) ||
      normalized.startsWith(
        "https://"
      ) ||
      normalized.startsWith(
        "data:"
      )
    ) {
      return normalized;
    }
  
    return `${BACKEND_URL}${
      normalized.startsWith("/")
        ? normalized
        : `/${normalized}`
    }`;
  };
  
  const getCategoryAsset = (
    category: PublicCategory
  ): PublicMediaAsset | null => {
    return (
      category.thumbnailAsset ||
      category.image ||
      category.imageAsset ||
      category.bannerAsset ||
      null
    );
  };
  
  const getCategoryImageUrl = (
    category: PublicCategory
  ): string | null => {
    const asset =
      getCategoryAsset(
        category
      );
  
    return toAbsoluteUrl(
      asset?.publicUrl ||
        asset?.previewUrl ||
        asset?.thumbnailUrl ||
        null
    );
  };
  
  const getCategoryAltText = (
    category: PublicCategory
  ): string => {
    const asset =
      getCategoryAsset(
        category
      );
  
    return (
      asset?.altText ||
      asset?.title ||
      category.name
    );
  };
  
  const clampColumns = (
    value: unknown,
    fallback: number
  ): number => {
    const parsed =
      Number(value);
  
    if (
      !Number.isFinite(parsed)
    ) {
      return fallback;
    }
  
    return Math.min(
      Math.max(
        Math.trunc(parsed),
        1
      ),
      12
    );
  };
  
  const getCardRadiusClass = (
    cardStyle?: string
  ): string => {
    switch (
      String(
        cardStyle || ""
      )
        .trim()
        .toUpperCase()
    ) {
      case "SQUARE":
        return "rounded-none";
  
      case "CIRCLE":
        return "rounded-full";
  
      case "ROUNDED":
      default:
        return "rounded-2xl";
    }
  };
  
  const getImageRadiusClass = (
    cardStyle?: string
  ): string => {
    switch (
      String(
        cardStyle || ""
      )
        .trim()
        .toUpperCase()
    ) {
      case "SQUARE":
        return "rounded-none";
  
      case "CIRCLE":
        return "rounded-full";
  
      case "ROUNDED":
      default:
        return "rounded-xl";
    }
  };
  
  const getCategoryHref = (
    category: PublicCategory
  ): string => {
    return `/category/${encodeURIComponent(
      category.slug
    )}`;
  };
  
  export default function CategoryGridSection({
    section,
  }: CategoryGridSectionProps) {
    const content =
      section.content &&
      typeof section.content ===
        "object" &&
      !Array.isArray(
        section.content
      )
        ? (section.content as CategoryGridContent)
        : {};
  
    const settings =
      section.settings &&
      typeof section.settings ===
        "object" &&
      !Array.isArray(
        section.settings
      )
        ? (section.settings as CategoryGridSettings)
        : {};
  
    const categories =
      Array.isArray(
        content.categoryIdsResolved
      )
        ? content.categoryIdsResolved.filter(
            (
              category
            ): category is PublicCategory =>
              Boolean(
                category?.id &&
                  category?.name &&
                  category?.slug
              )
          )
        : [];
  
    if (
      categories.length === 0
    ) {
      return null;
    }
  
    const columnsMobile =
      clampColumns(
        settings.columnsMobile,
        2
      );
  
    const columnsTablet =
      clampColumns(
        settings.columnsTablet,
        4
      );
  
    const columnsDesktop =
      clampColumns(
        settings.columnsDesktop,
        6
      );
  
    const showName =
      settings.showName !== false;
  
    const showImage =
      settings.showImage !== false;
  
    const showProductCount =
      settings.showProductCount ===
      true;
  
    const imageFitClass =
      String(
        settings.imageFit ||
          "COVER"
      )
        .trim()
        .toUpperCase() ===
      "CONTAIN"
        ? "object-contain p-3"
        : "object-cover";
  
    const cardRadiusClass =
      getCardRadiusClass(
        settings.cardStyle
      );
  
    const imageRadiusClass =
      getImageRadiusClass(
        settings.cardStyle
      );
  
    const sectionBackgroundColor =
      settings
        .sectionBackgroundColor ||
      "transparent";
  
    const cardBackgroundColor =
      settings
        .cardBackgroundColor ||
      "#FFFFFF";
  
    const cardTextColor =
      settings.cardTextColor ||
      "inherit";
  
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
        className="w-full py-6 sm:py-8 lg:py-10"
        style={{
          backgroundColor:
            sectionBackgroundColor,
        }}
      >
        <style>
          {`
            [data-section-id="${section.id}"] .category-grid {
              grid-template-columns: repeat(${columnsMobile}, minmax(0, 1fr));
            }
  
            @media (min-width: 640px) {
              [data-section-id="${section.id}"] .category-grid {
                grid-template-columns: repeat(${columnsTablet}, minmax(0, 1fr));
              }
            }
  
            @media (min-width: 1024px) {
              [data-section-id="${section.id}"] .category-grid {
                grid-template-columns: repeat(${columnsDesktop}, minmax(0, 1fr));
              }
            }
          `}
        </style>
  
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {content.title ||
          content.subtitle ? (
            <div className="mb-7 sm:mb-8">
              {content.title ? (
                <h2 className="text-2xl font-bold tracking-tight text-storefront-text sm:text-3xl">
                  {content.title}
                </h2>
              ) : null}
  
              {content.subtitle ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted sm:text-base">
                  {content.subtitle}
                </p>
              ) : null}
            </div>
          ) : null}
  
          <div className="category-grid grid gap-3 sm:gap-4 lg:gap-4">
            {categories.map(
              (category) => {
                const imageUrl =
                  getCategoryImageUrl(
                    category
                  );
  
                return (
                  <Link
                    key={
                      category.id
                    }
                    href={getCategoryHref(
                      category
                    )}
                    className={[
                      "group flex min-w-0 flex-col overflow-hidden border border-storefront bg-storefront-surface shadow-sm",
                      "transition duration-200 ease-out",
                      "hover:-translate-y-1 hover:border-storefront-primary/35 hover:shadow-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-storefront-primary focus-visible:ring-offset-2",
                      cardRadiusClass,
                    ].join(" ")}
                    style={{
                      backgroundColor:
                        cardBackgroundColor,
  
                      color:
                        cardTextColor,
                    }}
                  >
                    {showImage ? (
                      <div className="p-2.5 sm:p-3">
                        <div
                          className={[
                            "relative aspect-square w-full overflow-hidden bg-[#f6f7f8]",
                            imageRadiusClass,
                          ].join(" ")}
                        >
                          {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
  src={imageUrl}
  alt={getCategoryAltText(
    category
  )}
  loading="lazy"
  className={[
    "h-full w-full transition duration-300 ease-out group-hover:scale-[1.04]",
    imageFitClass,
  ].join(" ")}
/>
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-storefront-muted">
                              <ImageIcon
                                size={30}
                                strokeWidth={
                                  1.5
                                }
                              />
  
                              <span className="text-xs font-medium">
                                No image
                              </span>
                            </div>
                          )}
  
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </div>
                    ) : null}
  
                    {showName ||
                    showProductCount ? (
                      <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
                        {showName ? (
                          <h3 className="line-clamp-2 text-center text-[13px] font-semibold leading-4 text-storefront-text transition group-hover:text-storefront-primary sm:text-sm">
                            {
                              category.name
                            }
                          </h3>
                        ) : null}
  
                        {showProductCount &&
                        typeof category.productCount ===
                          "number" ? (
                          <p className="mt-1 text-center text-xs text-storefront-muted">
                            {
                              category.productCount
                            }{" "}
                            {category.productCount ===
                            1
                              ? "product"
                              : "products"}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </Link>
                );
              }
            )}
          </div>
        </div>
      </section>
    );
  }