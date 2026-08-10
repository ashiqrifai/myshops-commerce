import Link from "next/link";

import {
  ArrowRight,
  ImageIcon,
  Package,
} from "lucide-react";

import type {
  StorefrontSection,
} from "@/types/storefront";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface CollectionGridSettings {
  sourceType?:
    string;

  columnsDesktop?:
    number;

  columnsTablet?:
    number;

  columnsMobile?:
    number;

  columnsKiosk?:
    number;

  showImage?:
    boolean;

  showName?:
    boolean;

  showDescription?:
    boolean;

  showProductCount?:
    boolean;

  cardStyle?:
    string;

  imageFit?:
    string;

  sectionBackgroundColor?:
    string;

  cardBackgroundColor?:
    string;

  cardTextColor?:
    string;
}

interface CollectionMediaVariant {
  id?:
    string;

  variantType?:
    string;

  publicUrl?:
    string |
    null;

  width?:
    number |
    null;

  height?:
    number |
    null;

  isPrimary?:
    boolean;
}

interface CollectionMediaAsset {
  id?:
    string;

  publicUrl?:
    string |
    null;

  thumbnailUrl?:
    string |
    null;

  previewUrl?:
    string |
    null;

  altText?:
    string |
    null;

  title?:
    string |
    null;

  variants?:
    CollectionMediaVariant[];
}

interface ResolvedCollection {
  id:
    string;

  name:
    string;

  slug:
    string;

  description?:
    string |
    null;

  shortDescription?:
    string |
    null;

  collectionType?:
    string |
    null;

  sortOrder?:
    number;

  isFeatured?:
    boolean;

  showInMenu?:
    boolean;

  showOnHome?:
    boolean;

  showProductCount?:
    boolean;

  productCount?:
    number;

  collectionUrl?:
    string;

  thumbnailAsset?:
    CollectionMediaAsset |
    null;

  bannerAsset?:
    CollectionMediaAsset |
    null;

  mobileBannerAsset?:
    CollectionMediaAsset |
    null;

  image?:
    CollectionMediaAsset |
    null;
}

interface CollectionGridContent {
  title?:
    string;

  subtitle?:
    string;

  collectionIds?:
    string[];

  collectionIdsResolved?:
    ResolvedCollection[];
}

interface CollectionGridSectionProps {
  section:
    StorefrontSection;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getString =
(
  value:
    unknown,
  fallback =
    ""
): string => {
  return typeof value ===
    "string"
    ? value
    : fallback;
};

const getBoolean =
(
  value:
    unknown,
  fallback:
    boolean
): boolean => {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
};

const getPositiveInteger =
(
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
    ) ||
    parsed <
      1
  ) {
    return fallback;
  }

  return Math.floor(
    parsed
  );
};

/*
|--------------------------------------------------------------------------
| Responsive Grid Classes
|--------------------------------------------------------------------------
|
| We use fixed Tailwind class names instead of dynamically generating
| strings such as `grid-cols-${value}`, because dynamic Tailwind class
| names may not be included in the production CSS build.
|--------------------------------------------------------------------------
*/

const getMobileColumnsClass =
(
  columns:
    number
) => {
  if (
    columns >=
    3
  ) {
    return "grid-cols-3";
  }

  if (
    columns ===
    2
  ) {
    return "grid-cols-2";
  }

  return "grid-cols-1";
};

const getTabletColumnsClass =
(
  columns:
    number
) => {
  if (
    columns >=
    6
  ) {
    return "sm:grid-cols-6";
  }

  if (
    columns ===
    5
  ) {
    return "sm:grid-cols-5";
  }

  if (
    columns ===
    4
  ) {
    return "sm:grid-cols-4";
  }

  if (
    columns ===
    3
  ) {
    return "sm:grid-cols-3";
  }

  if (
    columns ===
    2
  ) {
    return "sm:grid-cols-2";
  }

  return "sm:grid-cols-1";
};

const getDesktopColumnsClass =
(
  columns:
    number
) => {
  if (
    columns >=
    8
  ) {
    return "lg:grid-cols-8";
  }

  if (
    columns ===
    7
  ) {
    return "lg:grid-cols-7";
  }

  if (
    columns ===
    6
  ) {
    return "lg:grid-cols-6";
  }

  if (
    columns ===
    5
  ) {
    return "lg:grid-cols-5";
  }

  if (
    columns ===
    4
  ) {
    return "lg:grid-cols-4";
  }

  if (
    columns ===
    3
  ) {
    return "lg:grid-cols-3";
  }

  if (
    columns ===
    2
  ) {
    return "lg:grid-cols-2";
  }

  return "lg:grid-cols-1";
};

/*
|--------------------------------------------------------------------------
| Card Style
|--------------------------------------------------------------------------
*/

const getCardStyleClasses =
(
  cardStyle:
    string
) => {
  switch (
    cardStyle
      .trim()
      .toUpperCase()
  ) {
    case "SQUARE":
      return "rounded-none";

    case "SOFT":
      return "rounded-lg";

    case "PILL":
      return "rounded-[28px]";

    case "ROUNDED":
    default:
      return "rounded-2xl";
  }
};

/*
|--------------------------------------------------------------------------
| Image Fit
|--------------------------------------------------------------------------
*/

const getImageFitClass =
(
  imageFit:
    string
) => {
  switch (
    imageFit
      .trim()
      .toUpperCase()
  ) {
    case "CONTAIN":
      return "object-contain";

    case "FILL":
      return "object-fill";

    case "COVER":
    default:
      return "object-cover";
  }
};

/*
|--------------------------------------------------------------------------
| Collection Image
|--------------------------------------------------------------------------
*/

const getCollectionImageUrl =
(
  collection:
    ResolvedCollection
): string | null => {
  const assets = [
    collection.thumbnailAsset,
    collection.image,
    collection.bannerAsset,
    collection.mobileBannerAsset,
  ];

  for (
    const asset of
    assets
  ) {
    if (
      !asset
    ) {
      continue;
    }

    /*
     * Prefer useful pre-generated variants.
     */

    const preferredVariant =
      asset.variants?.find(
        (
          variant
        ) =>
          variant.variantType ===
            "MEDIUM" &&
          Boolean(
            variant.publicUrl
          )
      ) ||
      asset.variants?.find(
        (
          variant
        ) =>
          variant.variantType ===
            "SMALL" &&
          Boolean(
            variant.publicUrl
          )
      ) ||
      asset.variants?.find(
        (
          variant
        ) =>
          variant.variantType ===
            "THUMBNAIL" &&
          Boolean(
            variant.publicUrl
          )
      ) ||
      asset.variants?.find(
        (
          variant
        ) =>
          variant.isPrimary &&
          Boolean(
            variant.publicUrl
          )
      ) ||
      asset.variants?.find(
        (
          variant
        ) =>
          Boolean(
            variant.publicUrl
          )
      );

    if (
      preferredVariant
        ?.publicUrl
    ) {
      return preferredVariant
        .publicUrl;
    }

    if (
      asset.publicUrl
    ) {
      return asset.publicUrl;
    }

    if (
      asset.previewUrl
    ) {
      return asset.previewUrl;
    }

    if (
      asset.thumbnailUrl
    ) {
      return asset.thumbnailUrl;
    }
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CollectionGridSection({
  section,
}: CollectionGridSectionProps) {
  const content =
    (
      section.content ||
      {}
    ) as CollectionGridContent;

  const settings =
    (
      section.settings ||
      {}
    ) as CollectionGridSettings;

  const collections =
    Array.isArray(
      content.collectionIdsResolved
    )
      ? content.collectionIdsResolved
      : [];

  /*
   * If nothing has been resolved, don't render an empty CMS section
   * on the public storefront.
   */

  if (
    collections.length ===
    0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Settings
  |--------------------------------------------------------------------------
  */

  const columnsMobile =
    getPositiveInteger(
      settings.columnsMobile,
      2
    );

  const columnsTablet =
    getPositiveInteger(
      settings.columnsTablet,
      3
    );

  const columnsDesktop =
    getPositiveInteger(
      settings.columnsDesktop,
      4
    );

  const showImage =
    getBoolean(
      settings.showImage,
      true
    );

  const showName =
    getBoolean(
      settings.showName,
      true
    );

  const showDescription =
    getBoolean(
      settings.showDescription,
      false
    );

  const showProductCount =
    getBoolean(
      settings.showProductCount,
      true
    );

  const cardStyle =
    getString(
      settings.cardStyle,
      "ROUNDED"
    );

  const imageFit =
    getString(
      settings.imageFit,
      "COVER"
    );

  const sectionBackgroundColor =
    getString(
      settings.sectionBackgroundColor,
      "transparent"
    );

  const cardBackgroundColor =
    getString(
      settings.cardBackgroundColor,
      "#FFFFFF"
    );

  const cardTextColor =
    getString(
      settings.cardTextColor,
      "#111111"
    );

  const cardRadiusClass =
    getCardStyleClasses(
      cardStyle
    );

  const imageFitClass =
    getImageFitClass(
      imageFit
    );

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
      className="w-full py-8 sm:py-10 lg:py-12"
      style={{
        backgroundColor:
          sectionBackgroundColor,
      }}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/*
        |--------------------------------------------------------------------------
        | Section Heading
        |--------------------------------------------------------------------------
        */}

        {(content.title ||
          content.subtitle) ? (
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
              Explore
            </p>

            {content.title ? (
              <h2 className="mt-2 text-2xl font-black tracking-tight text-storefront-text sm:text-3xl">
                {
                  content.title
                }
              </h2>
            ) : null}

            {content.subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted sm:text-base">
                {
                  content.subtitle
                }
              </p>
            ) : null}
          </div>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Collection Grid
        |--------------------------------------------------------------------------
        */}

        <div
          className={[
            "grid gap-3 sm:gap-4 lg:gap-5",

            getMobileColumnsClass(
              columnsMobile
            ),

            getTabletColumnsClass(
              columnsTablet
            ),

            getDesktopColumnsClass(
              columnsDesktop
            ),
          ].join(
            " "
          )}
        >
          {collections.map(
            (
              collection
            ) => {
              const imageUrl =
                getCollectionImageUrl(
                  collection
                );

              const href =
                collection.collectionUrl ||
                `/collections/${collection.slug}`;

              const description =
                collection.shortDescription ||
                collection.description ||
                null;

              return (
                <Link
                  key={
                    collection.id
                  }
                  href={
                    href
                  }
                  className={[
                    "group relative flex min-w-0 flex-col overflow-hidden border border-storefront transition duration-200",
                    "hover:-translate-y-1 hover:shadow-xl",
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
                  | Image
                  |--------------------------------------------------------------------------
                  */}

                  {showImage ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-storefront-secondary">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            imageUrl
                          }
                          alt={
                            collection
                              .thumbnailAsset
                              ?.altText ||
                            collection
                              .bannerAsset
                              ?.altText ||
                            collection.name
                          }
                          className={[
                            "h-full w-full transition duration-300 group-hover:scale-[1.04]",
                            imageFitClass,
                          ].join(
                            " "
                          )}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon
                            size={
                              32
                            }
                            className="text-storefront-muted"
                          />
                        </div>
                      )}

                      {/*
                      |--------------------------------------------------------------------------
                      | Featured Badge
                      |--------------------------------------------------------------------------
                      */}

                      {collection.isFeatured ? (
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-storefront-text shadow-sm">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/*
                  |--------------------------------------------------------------------------
                  | Card Content
                  |--------------------------------------------------------------------------
                  */}

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    {showName ? (
                      <h3
                        className="line-clamp-2 text-base font-black sm:text-lg"
                        style={{
                          color:
                            cardTextColor,
                        }}
                      >
                        {
                          collection.name
                        }
                      </h3>
                    ) : null}

                    {showDescription &&
                    description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-70 sm:text-sm">
                        {
                          description
                        }
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      {showProductCount &&
                      collection.showProductCount !==
                        false ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold opacity-65">
                          <Package
                            size={
                              14
                            }
                          />

                          <span>
                            {
                              Number(
                                collection.productCount ||
                                0
                              )
                            }{" "}
                            {Number(
                              collection.productCount ||
                              0
                            ) ===
                            1
                              ? "product"
                              : "products"}
                          </span>
                        </div>
                      ) : (
                        <span />
                      )}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/10 bg-black/[0.03] transition group-hover:translate-x-1">
                        <ArrowRight
                          size={
                            16
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}