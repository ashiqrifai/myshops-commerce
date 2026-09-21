import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ChevronRight,
  PackageSearch,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import BrandFilters from "@/components/storefront/brands/BrandFilters";
import BrandMobileFilterDrawer from "@/components/storefront/brands/BrandMobileFilterDrawer";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getPublicBrand,
} from "@/lib/storefront/public-brand-api";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

import StorefrontPageViewTracker from "@/components/storefront/tracking/StorefrontPageViewTracker";
/*
|--------------------------------------------------------------------------
| Route Types
|--------------------------------------------------------------------------
*/

interface BrandRouteProps {
  params:
    Promise<{
      slug:
        string;
    }>;

  searchParams:
    Promise<
      Record<
        string,
        | string
        | string[]
        | undefined
      >
    >;
}

/*
|--------------------------------------------------------------------------
| Query Helpers
|--------------------------------------------------------------------------
*/

const getSingle =
(
  value:
    | string
    | string[]
    | undefined
) =>
  Array.isArray(
    value
  )
    ? value[
        0
      ]
    : value;

const parseCsv =
(
  value:
    | string
    | string[]
    | undefined
) =>
  String(
    getSingle(
      value
    ) ||
    ""
  )
    .split(
      ","
    )
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(
      Boolean
    );

const parseNumber =
(
  value:
    | string
    | string[]
    | undefined
) => {
  const raw =
    getSingle(
      value
    );

  if (
    raw ===
      undefined ||
    raw ===
      ""
  ) {
    return undefined;
  }

  const parsed =
    Number(
      raw
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
};

/*
|--------------------------------------------------------------------------
| Media Helper
|--------------------------------------------------------------------------
*/

const getMediaUrl =
(
  asset:
    | {
        publicUrl?:
          string | null;

        previewUrl?:
          string | null;

        thumbnailUrl?:
          string | null;

        variants?: Array<{
          variantType:
            string;

          publicUrl:
            string | null;

          isPrimary?:
            boolean;
        }>;
      }
    | null
    | undefined
) => {
  if (
    !asset
  ) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "LARGE" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "MEDIUM" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (
        variant
      ) =>
        variant.isPrimary &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (
        variant
      ) =>
        Boolean(
          variant.publicUrl
        )
    );

  return (
    preferred
      ?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Pagination URL
|--------------------------------------------------------------------------
*/

const buildBrandHref =
({
  slug,
  currentQuery,
  page,
}: {
  slug:
    string;

  currentQuery:
    Record<
      string,
      | string
      | string[]
      | undefined
    >;

  page:
    number;
}) => {
  const params =
    new URLSearchParams();

  Object.entries(
    currentQuery
  ).forEach(
    (
      [
        key,
        value,
      ]
    ) => {
      if (
        value ===
          undefined ||
        key ===
          "page"
      ) {
        return;
      }

      const normalized =
        Array.isArray(
          value
        )
          ? value.join(
              ","
            )
          : value;

      if (
        normalized !==
        ""
      ) {
        params.set(
          key,
          normalized
        );
      }
    }
  );

  params.set(
    "page",
    String(
      page
    )
  );

  return `/brands/${encodeURIComponent(
    slug
  )}?${params.toString()}`;
};

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata({
  params,
}: BrandRouteProps): Promise<Metadata> {
  try {
    const {
      slug,
    } =
      await params;

    const data =
      await getPublicBrand({
        slug,
      });

    const {
      brand,
    } =
      data;

    const title =
      brand.metaTitle ||
      brand.name;

    const description =
      brand.metaDescription ||
      brand.description ||
      undefined;

    const image =
      getMediaUrl(
        brand.bannerAsset ||
        brand.logoAsset
      );

    return {
      title,

      description,

      keywords:
        brand.metaKeywords
          ? brand.metaKeywords
              .split(
                ","
              )
              .map(
                (
                  keyword
                ) =>
                  keyword.trim()
              )
              .filter(
                Boolean
              )
          : undefined,

      alternates: {
        canonical:
          `/brands/${brand.slug}`,
      },

      openGraph: {
        type:
          "website",

        title,

        description,

        url:
          `/brands/${brand.slug}`,

        images:
          image
            ? [
                {
                  url:
                    image,
                },
              ]
            : undefined,
      },
    };
  } catch {
    return {
      title:
        "Brand | MyShops",
    };
  }
}

/*
|--------------------------------------------------------------------------
| Brand Page
|--------------------------------------------------------------------------
*/

export default async function BrandRoute({
  params,
  searchParams,
}: BrandRouteProps) {
  try {
    const [
      {
        slug,
      },
      query,
    ] =
      await Promise.all([
        params,
        searchParams,
      ]);

    const page =
      parseNumber(
        query.page
      ) ||
      1;

    const pageSize =
      parseNumber(
        query.pageSize
      ) ||
      24;

    const search =
      getSingle(
        query.search
      );

    const categoryIds =
      parseCsv(
        query.categoryIds
      );

    const minPrice =
      parseNumber(
        query.minPrice
      );

    const maxPrice =
      parseNumber(
        query.maxPrice
      );

    const sort =
      getSingle(
        query.sort
      ) ||
      "FEATURED";

    const [
      storefront,
      brandData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",

          channel:
            "WEBSITE",
        }),

        getPublicBrand({
          slug,

          query: {
            page,

            pageSize,

            search,

            categoryIds,

            minPrice,

            maxPrice,

            sort,

            channel:
              "WEBSITE",
          },
        }),
      ]);

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page
          .sections
      );

    const {
      brand,
      products,
      filters,
      pagination,
      sortOptions,
    } =
      brandData;

    const bannerUrl =
      getMediaUrl(
        brand.bannerAsset
      );

    const logoUrl =
      getMediaUrl(
        brand.logoAsset
      );

    return (
      <StorefrontShell
        storefront={
          storefront
        }
      >
        <StorefrontHeader
          storefront={
            storefront
          }
          announcementSection={
            globalSections
              .announcementSection
          }
          headerSection={
            globalSections
              .headerSection
          }
          navigationSection={
            globalSections
              .navigationSection
          }
        />


        <StorefrontPageViewTracker
          activityType="VIEW_BRAND"
          brandId={
            brand.id
          }
          source="BRAND_PAGE"
          metadata={{
            brandName:
              brand.name,

            brandSlug:
              brand.slug,
          }}
        />

        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {/*
            |--------------------------------------------------------------------------
            | Breadcrumbs
            |--------------------------------------------------------------------------
            */}

            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-storefront-muted">
              {brandData.breadcrumbs.map(
                (
                  breadcrumb,
                  index
                ) => (
                  <span
                    key={
                      `${breadcrumb.url}-${index}`
                    }
                    className="flex items-center"
                  >
                    {index >
                    0 ? (
                      <ChevronRight
                        size={
                          14
                        }
                        className="mx-1"
                      />
                    ) : null}

                    <Link
                      href={
                        breadcrumb.url
                      }
                      className={
                        index ===
                        brandData
                          .breadcrumbs
                          .length -
                          1
                          ? "font-bold text-storefront-text"
                          : "hover:text-storefront-primary"
                      }
                    >
                      {
                        breadcrumb.label
                      }
                    </Link>
                  </span>
                )
              )}
            </nav>

            {/*
            |--------------------------------------------------------------------------
            | Brand Hero
            |--------------------------------------------------------------------------
            */}

            <section className="relative overflow-hidden rounded-[24px] border border-storefront bg-storefront-surface">
              {bannerUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      bannerUrl
                    }
                    alt={
                      brand.name
                    }
                    className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[390px]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-storefront-primary to-cyan-700" />
              )}

              <div className="relative flex min-h-[240px] items-end p-6 sm:min-h-[320px] sm:p-10 lg:min-h-[390px] lg:p-14">
                <div className="max-w-3xl text-white">
                  {logoUrl ? (
                    <div className="mb-5 flex h-20 w-36 items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          logoUrl
                        }
                        alt={`${brand.name} logo`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : null}

                  {brand.isFeatured ? (
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                      Featured brand
                    </p>
                  ) : null}

                  {!logoUrl ? (
                    <h1 className="mt-2 text-3xl font-black sm:text-4xl lg:text-5xl">
                      {
                        brand.name
                      }
                    </h1>
                  ) : null}

                  {brand.countryOfOrigin ? (
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
                      Origin:{" "}
                      {
                        brand.countryOfOrigin
                      }
                    </p>
                  ) : null}

                  <p className="mt-4 text-sm font-bold text-white/85">
                    {
                      pagination.totalItems
                    }{" "}
                    {pagination.totalItems ===
                    1
                      ? "product"
                      : "products"}
                  </p>
                </div>
              </div>
            </section>

            {/*
            |--------------------------------------------------------------------------
            | Brand Description
            |--------------------------------------------------------------------------
            */}

            {brand.description ? (
              <section className="mt-7 rounded-[20px] border border-storefront bg-storefront-surface p-6 sm:p-8">
                <p className="whitespace-pre-line text-sm leading-7 text-storefront-muted sm:text-base">
                  {
                    brand.description
                  }
                </p>

                {brand.websiteUrl ? (
                  <a
                    href={
                      brand.websiteUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex text-sm font-bold text-storefront-primary hover:underline"
                  >
                    Visit official website
                  </a>
                ) : null}
              </section>
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Products Heading
            |--------------------------------------------------------------------------
            */}

            <div className="mt-8 border-b border-storefront pb-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
                Shop by brand
              </p>

              <h2 className="mt-2 text-2xl font-black text-storefront-text sm:text-3xl">
                {
                  brand.name
                }{" "}
                products
              </h2>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Product Area
            |--------------------------------------------------------------------------
            */}

            <section className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/*
                |--------------------------------------------------------------------------
                | Desktop Filters
                |--------------------------------------------------------------------------
                */}

                <aside className="hidden self-start rounded-2xl border border-storefront bg-storefront-surface p-5 lg:sticky lg:top-24 lg:block">
                  <BrandFilters
                    filters={
                      filters
                    }
                  />
                </aside>

                {/*
                |--------------------------------------------------------------------------
                | Products
                |--------------------------------------------------------------------------
                */}

                <div className="min-w-0">
                  {/*
                  |--------------------------------------------------------------------------
                  | Toolbar
                  |--------------------------------------------------------------------------
                  */}

                  <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-storefront bg-storefront-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-storefront-text">
                        {
                          pagination.totalItems
                        }{" "}
                        {pagination.totalItems ===
                        1
                          ? "product"
                          : "products"}{" "}
                        found
                      </p>

                      {(categoryIds.length >
                        0 ||
                        minPrice !==
                          undefined ||
                        maxPrice !==
                          undefined) ? (
                        <p className="mt-1 text-xs text-storefront-muted">
                          Filters are currently applied.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <BrandMobileFilterDrawer
                        filters={
                          filters
                        }
                      />

                      <form
                        method="GET"
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        {categoryIds.length >
                        0 ? (
                          <input
                            type="hidden"
                            name="categoryIds"
                            value={
                              categoryIds.join(
                                ","
                              )
                            }
                          />
                        ) : null}

                        {minPrice !==
                        undefined ? (
                          <input
                            type="hidden"
                            name="minPrice"
                            value={
                              String(
                                minPrice
                              )
                            }
                          />
                        ) : null}

                        {maxPrice !==
                        undefined ? (
                          <input
                            type="hidden"
                            name="maxPrice"
                            value={
                              String(
                                maxPrice
                              )
                            }
                          />
                        ) : null}

                        {pageSize !==
                        24 ? (
                          <input
                            type="hidden"
                            name="pageSize"
                            value={
                              String(
                                pageSize
                              )
                            }
                          />
                        ) : null}

                        <input
                          type="search"
                          name="search"
                          defaultValue={
                            search ||
                            ""
                          }
                          placeholder={`Search ${brand.name}`}
                          className="h-11 min-w-0 rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary sm:w-[220px]"
                        />

                        <select
                          name="sort"
                          defaultValue={
                            sort
                          }
                          className="h-11 min-w-0 rounded-xl border border-storefront bg-white px-4 text-sm font-semibold text-storefront-text outline-none focus:border-storefront-primary sm:w-[200px]"
                        >
                          {sortOptions.map(
                            (
                              option
                            ) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="submit"
                          className="h-11 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white"
                        >
                          Apply
                        </button>
                      </form>
                    </div>
                  </div>

                  {/*
                  |--------------------------------------------------------------------------
                  | Product Grid
                  |--------------------------------------------------------------------------
                  */}

                  {products.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                      {products.map(
                        (
                          product
                        ) => (
                          <StorefrontProductCard
                            key={
                              product.id
                            }
                            product={
                              product
                            }
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-storefront bg-storefront-surface px-6 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
                        <PackageSearch
                          size={
                            28
                          }
                        />
                      </div>

                      <h2 className="mt-5 text-xl font-black text-storefront-text">
                        No products found
                      </h2>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-storefront-muted">
                        No products from{" "}
                        {
                          brand.name
                        }{" "}
                        match the current filters. Try changing the category, price range or search.
                      </p>

                      <Link
                        href={`/brands/${brand.slug}`}
                        className="mt-5 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-5 text-sm font-bold text-white"
                      >
                        Clear filters
                      </Link>
                    </div>
                  )}

                  {/*
                  |--------------------------------------------------------------------------
                  | Pagination
                  |--------------------------------------------------------------------------
                  */}

                  {pagination.totalPages >
                  1 ? (
                    <nav className="mt-10 flex flex-wrap items-center justify-center gap-3">
                      {pagination.hasPreviousPage ? (
                        <Link
                          href={
                            buildBrandHref({
                              slug:
                                brand.slug,

                              currentQuery:
                                query,

                              page:
                                pagination.page -
                                1,
                            })
                          }
                          className="flex h-11 items-center justify-center rounded-xl border border-storefront bg-white px-5 text-sm font-bold text-storefront-text"
                        >
                          Previous
                        </Link>
                      ) : null}

                      <span className="px-2 text-sm font-bold text-storefront-muted">
                        Page{" "}
                        {
                          pagination.page
                        }{" "}
                        of{" "}
                        {
                          pagination.totalPages
                        }
                      </span>

                      {pagination.hasNextPage ? (
                        <Link
                          href={
                            buildBrandHref({
                              slug:
                                brand.slug,

                              currentQuery:
                                query,

                              page:
                                pagination.page +
                                1,
                            })
                          }
                          className="flex h-11 items-center justify-center rounded-xl bg-storefront-primary px-5 text-sm font-bold text-white"
                        >
                          Next
                        </Link>
                      ) : null}
                    </nav>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </main>

        <StorefrontFooter
          storefront={
            storefront
          }
        />
      </StorefrontShell>
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        StorefrontApiError &&
      error.status ===
        404
    ) {
      notFound();
    }

    throw error;
  }
}