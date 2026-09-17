import {
  ImageIcon,
} from "lucide-react";

import Link from "next/link";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface CategoryGridSectionProps {
  section:
    StorefrontSection;
}

interface PublicMediaAsset {
  id?: string;

  publicUrl?:
    | string
    | null;

  thumbnailUrl?:
    | string
    | null;

  previewUrl?:
    | string
    | null;

  altText?:
    | string
    | null;

  title?:
    | string
    | null;

  variants?: Array<{
    publicUrl?:
      | string
      | null;

    variantType?:
      | string
      | null;

    format?:
      | string
      | null;

    isActive?:
      boolean;

    isPrimary?:
      boolean;
  }>;
}

interface PublicCategory {
  id: string;

  name: string;

  slug: string;

  description?:
    | string
    | null;

  shortDescription?:
    | string
    | null;

  categoryPath?:
    | string
    | null;

  thumbnailAsset?:
    | PublicMediaAsset
    | null;

  imageAsset?:
    | PublicMediaAsset
    | null;

  bannerAsset?:
    | PublicMediaAsset
    | null;

  image?:
    | PublicMediaAsset
    | null;

  productCount?:
    | number
    | null;
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

/*
|--------------------------------------------------------------------------
| Backend URL
|--------------------------------------------------------------------------
*/

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
  .replace(
    /\/$/,
    ""
  );

/*
|--------------------------------------------------------------------------
| Absolute URL
|--------------------------------------------------------------------------
*/

const toAbsoluteUrl = (
  value?:
    | string
    | null
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

/*
|--------------------------------------------------------------------------
| Category Asset
|--------------------------------------------------------------------------
*/

const getCategoryAsset = (
  category:
    PublicCategory
): PublicMediaAsset | null => {
  return (
    category.thumbnailAsset ||
    category.image ||
    category.imageAsset ||
    category.bannerAsset ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Category Image URL
|--------------------------------------------------------------------------
*/

const getCategoryImageUrl = (
  category:
    PublicCategory
): string | null => {
  const asset =
    getCategoryAsset(
      category
    );

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
  | Category Grid Image Preference
  |--------------------------------------------------------------------------
  |
  | These cards are small:
  |
  | Mobile:  118px high
  | Tablet:  200px high
  | Desktop: 210px high
  |
  | Prefer optimized DAM renditions instead of the original asset.
  |--------------------------------------------------------------------------
  */

  const preferredTypes = [
    "SMALL",
    "MEDIUM",
    "THUMBNAIL",
    "PREVIEW",
  ];

  const preferredFormats = [
    "AVIF",
    "WEBP",
  ];

  for (
    const variantType of
      preferredTypes
  ) {
    for (
      const preferredFormat of
        preferredFormats
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
              preferredFormat
        );

      if (
        match?.publicUrl
      ) {
        return toAbsoluteUrl(
          match.publicUrl
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Any Matching Optimized Variant
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
      return toAbsoluteUrl(
        match.publicUrl
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Variant Fallback
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
    return toAbsoluteUrl(
      primary.publicUrl
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Asset Fallback
  |--------------------------------------------------------------------------
  |
  | Keep original URL last so existing categories without generated
  | variants continue to display correctly.
  |--------------------------------------------------------------------------
  */

  return toAbsoluteUrl(
    asset.thumbnailUrl ||
      asset.previewUrl ||
      asset.publicUrl ||
      null
  );
};

/*
|--------------------------------------------------------------------------
| Category Alt Text
|--------------------------------------------------------------------------
*/

const getCategoryAltText = (
  category:
    PublicCategory
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

/*
|--------------------------------------------------------------------------
| Clamp Columns
|--------------------------------------------------------------------------
*/

const clampColumns = (
  value:
    unknown,

  fallback:
    number
): number => {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  return Math.min(
    Math.max(
      Math.trunc(
        parsed
      ),
      1
    ),
    12
  );
};

/*
|--------------------------------------------------------------------------
| Card Radius
|--------------------------------------------------------------------------
*/

const getCardRadiusClass = (
  cardStyle?:
    string
): string => {
  switch (
    String(
      cardStyle ||
        ""
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

/*
|--------------------------------------------------------------------------
| Category URL
|--------------------------------------------------------------------------
*/

const getCategoryHref = (
  category:
    PublicCategory
): string => {
  return `/category/${encodeURIComponent(
    category.slug
  )}`;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

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
      ? (
          section.content as CategoryGridContent
        )
      : {};

  const settings =
    section.settings &&
    typeof section.settings ===
      "object" &&
    !Array.isArray(
      section.settings
    )
      ? (
          section.settings as CategoryGridSettings
        )
      : {};

  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  const categories =
    Array.isArray(
      content
        .categoryIdsResolved
    )
      ? content
          .categoryIdsResolved
          .filter(
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
    categories.length ===
    0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Columns
  |--------------------------------------------------------------------------
  |
  | Mobile is intentionally FIXED to 3 columns.
  |
  | Tablet/Desktop continue to use CMS values.
  |
  |--------------------------------------------------------------------------
  */

  const columnsMobile =
    3;

  const columnsTablet =
    clampColumns(
      settings
        .columnsTablet,
      4
    );

  const columnsDesktop =
    clampColumns(
      settings
        .columnsDesktop,
      6
    );

  /*
  |--------------------------------------------------------------------------
  | Display Settings
  |--------------------------------------------------------------------------
  */

  const showName =
    settings.showName !==
    false;

  const showImage =
    settings.showImage !==
    false;

  const showProductCount =
    settings
      .showProductCount ===
    true;

  /*
  |--------------------------------------------------------------------------
  | Appearance
  |--------------------------------------------------------------------------
  */

  const cardRadiusClass =
    getCardRadiusClass(
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
    settings
      .cardTextColor ||
    "inherit";

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
      className="w-full"
      style={{
        backgroundColor:
          sectionBackgroundColor,
      }}
    >
      {/*
      |--------------------------------------------------------------------------
      | Dynamic Grid Columns
      |--------------------------------------------------------------------------
      |
      | Mobile  : 3
      | Tablet  : CMS / default 4
      | Desktop : CMS / default 6
      |
      |--------------------------------------------------------------------------
      */}

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

      {/*
      |--------------------------------------------------------------------------
      | Page Width Container
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      | Do NOT put fixed height or overflow-hidden here.
      |
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mx-auto
          w-full
          max-w-[1440px]
          px-3

          sm:px-6

          lg:px-8
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | Heading
        |--------------------------------------------------------------------------
        */}

        {content.title ||
        content.subtitle ? (
          <div
            className="
              mb-3

              sm:mb-4
            "
          >
            {content.title ? (
             <h2
             className="
               text-[20px]
               font-bold
               tracking-tight
               text-storefront-text
             "
           >
             {content.title}
           </h2>
            ) : null}

            {content.subtitle ? (
              <p
                className="
                  mt-1
                  max-w-2xl
                  text-xs
                  leading-5
                  text-storefront-muted

                  sm:mt-1.5
                  sm:text-sm
                  sm:leading-6

                  lg:text-base
                "
              >
                {
                  content.subtitle
                }
              </p>
            ) : null}
          </div>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Category Grid
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            category-grid
            grid
            gap-2

            sm:gap-4

            lg:gap-4
          "
        >
          {categories.map(
            (
              category
            ) => {
              const imageUrl =
                getCategoryImageUrl(
                  category
                );

              return (
                <Link
                  key={
                    category.id
                  }
                  href={
                    getCategoryHref(
                      category
                    )
                  }
                  prefetch={
                    false
                  }
                  className={[
                    /*
                     * Mobile card:
                     * compact.
                     *
                     * Tablet/Desktop:
                     * normal full size.
                     */
                    "group relative flex min-w-0 flex-col overflow-hidden border border-storefront bg-white shadow-sm",

                    "transition duration-200 ease-out",

                    "hover:-translate-y-1 hover:border-storefront-primary/35 hover:shadow-lg",

                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-storefront-primary focus-visible:ring-offset-2",

                    cardRadiusClass,
                  ].join(
                    " "
                  )}
                  style={{
                    backgroundColor:
                      cardBackgroundColor,

                    color:
                      cardTextColor,
                  }}
                >
                  {/*
                  |--------------------------------------------------------------------------
                  | Image Area
                  |--------------------------------------------------------------------------
                  |
                  | MOBILE:
                  | 118px height.
                  |
                  | TABLET:
                  | 200px.
                  |
                  | DESKTOP:
                  | 210px.
                  |
                  |--------------------------------------------------------------------------
                  */}

                  {showImage ? (
                    <div
                      className="
                        relative
                        h-[118px]
                        w-full
                        overflow-hidden
                        bg-white

                        sm:h-[200px]

                        lg:h-[210px]
                      "
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            imageUrl
                          }
                          alt={
                            getCategoryAltText(
                              category
                            )
                          }
                          loading="lazy"
                          className="
                            h-full
                            w-full
                            object-contain

                            p-2
                            pb-5

                            transition
                            duration-300
                            ease-out

                            group-hover:scale-[1.04]

                            sm:p-4
                            sm:pb-8
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            text-storefront-muted
                          "
                        >
                          <ImageIcon
                            size={
                              24
                            }
                            strokeWidth={
                              1.5
                            }
                            className="
                              sm:h-[30px]
                              sm:w-[30px]
                            "
                          />
                        </div>
                      )}

                      {/*
                      |--------------------------------------------------------------------------
                      | Category Name Overlay
                      |--------------------------------------------------------------------------
                      |
                      | Mobile label is compact and placed
                      | over the lower portion of the image.
                      |
                      | Desktop returns to your larger style.
                      |
                      |--------------------------------------------------------------------------
                      */}

                      {showName ? (
                        <div
                          className="
                            absolute
                            bottom-2
                            left-1/2
                            z-20

                            max-w-[94%]

                            -translate-x-1/2

                            whitespace-nowrap

                            rounded-full

                            bg-white/90

                            px-2
                            py-1

                            shadow-sm

                            backdrop-blur-sm

                            transition
                            duration-200

                            group-hover:bg-white

                            sm:bottom-10
                            sm:max-w-[90%]
                            sm:px-4
                            sm:py-1.5
                          "
                        >
                          <h3
                            className="
                              truncate
                              text-center
                              text-[9px]
                              font-semibold
                              leading-[11px]
                              text-storefront-text

                              min-[390px]:text-[10px]

                              sm:text-sm
                              sm:leading-4
                            "
                          >
                            {
                              category.name
                            }
                          </h3>
                        </div>
                      ) : null}

                      {/*
                      |--------------------------------------------------------------------------
                      | Product Count
                      |--------------------------------------------------------------------------
                      */}

                      {showProductCount &&
                      typeof category.productCount ===
                        "number" ? (
                        <div
                          className="
                            absolute
                            bottom-0.5
                            left-1/2
                            z-20

                            -translate-x-1/2

                            whitespace-nowrap

                            text-[8px]
                            text-storefront-muted

                            sm:bottom-1
                            sm:text-[10px]
                          "
                        >
                          {
                            category.productCount
                          }{" "}
                          {category.productCount ===
                          1
                            ? "product"
                            : "products"}
                        </div>
                      ) : null}
                    </div>
                  ) : showName ? (
                    <div className="px-2 py-3 sm:px-3 sm:py-4">
                      <h3
                        className="
                          text-center
                          text-[10px]
                          font-semibold
                          text-storefront-text

                          sm:text-sm
                        "
                      >
                        {
                          category.name
                        }
                      </h3>

                      {showProductCount &&
                      typeof category.productCount ===
                        "number" ? (
                        <p className="mt-1 text-center text-[9px] text-storefront-muted sm:text-xs">
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