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

import CollectionFilters from "@/components/storefront/collections/CollectionFilters";
import CollectionMobileFilterDrawer from "@/components/storefront/collections/CollectionMobileFilterDrawer";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getPublicCollection,
  PublicCollectionApiError,
} from "@/lib/storefront/public-collection-api";

import {
  getStorefrontPage,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

/*
|--------------------------------------------------------------------------
| Route Props
|--------------------------------------------------------------------------
*/

interface CollectionRouteProps {
  params:
    Promise<{
      slug:
        string;
    }>;

  searchParams:
    Promise<{
      page?:
        string;

      sort?:
        string;

      search?:
        string;

      brandIds?:
        string;

      minPrice?:
        string;

      maxPrice?:
        string;
    }>;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getMediaUrl = (
  asset:
    | {
        publicUrl:
          string | null;

        previewUrl:
          string | null;

        thumbnailUrl:
          string | null;

        variants:
          Array<{
            variantType:
              string;

            publicUrl:
              string | null;
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

const parseCsv = (
  value:
    string |
    undefined
) =>
  value
    ? value
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
        )
    : [];

const parseOptionalNumber = (
  value:
    string |
    undefined
) => {
  if (
    value ===
      undefined ||
    value ===
      ""
  ) {
    return undefined;
  }

  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
};

/*
|--------------------------------------------------------------------------
| Pagination URL
|--------------------------------------------------------------------------
*/

const buildCollectionHref = ({
  slug,
  query,
  page,
}: {
  slug:
    string;

  query: {
    search?:
      string;

    sort?:
      string;

    brandIds?:
      string;

    minPrice?:
      string;

    maxPrice?:
      string;
  };

  page:
    number;
}) => {
  const params =
    new URLSearchParams();

  if (
    query.search
  ) {
    params.set(
      "search",
      query.search
    );
  }

  if (
    query.sort
  ) {
    params.set(
      "sort",
      query.sort
    );
  }

  if (
    query.brandIds
  ) {
    params.set(
      "brandIds",
      query.brandIds
    );
  }

  if (
    query.minPrice
  ) {
    params.set(
      "minPrice",
      query.minPrice
    );
  }

  if (
    query.maxPrice
  ) {
    params.set(
      "maxPrice",
      query.maxPrice
    );
  }

  params.set(
    "page",
    String(
      page
    )
  );

  return `/collections/${encodeURIComponent(
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
}: CollectionRouteProps): Promise<Metadata> {
  try {
    const {
      slug,
    } =
      await params;

    const data =
      await getPublicCollection({
        slug,
      });

    const {
      collection,
    } =
      data;

    const image =
      getMediaUrl(
        collection.bannerAsset ||
        collection.thumbnailAsset
      );

    return {
      title:
        collection.metaTitle ||
        collection.name,

      description:
        collection.metaDescription ||
        collection.shortDescription ||
        undefined,

      keywords:
        collection.metaKeywords
          ? collection.metaKeywords
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
          collection.canonicalUrl ||
          `/collections/${collection.slug}`,
      },

      robots: {
        index:
          collection.robotsIndex,

        follow:
          collection.robotsFollow,
      },

      openGraph: {
        type:
          "website",

        title:
          collection.metaTitle ||
          collection.name,

        description:
          collection.metaDescription ||
          collection.shortDescription ||
          undefined,

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
        "Collection | MyShops",
    };
  }
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionRouteProps) {
  try {
    const {
      slug,
    } =
      await params;

    const query =
      await searchParams;

    /*
    |--------------------------------------------------------------------------
    | Parse Query
    |--------------------------------------------------------------------------
    */

    const page =
      Math.max(
        Number(
          query.page ||
          1
        ),
        1
      );

    const brandIds =
      parseCsv(
        query.brandIds
      );

    const minPrice =
      parseOptionalNumber(
        query.minPrice
      );

    const maxPrice =
      parseOptionalNumber(
        query.maxPrice
      );

    /*
    |--------------------------------------------------------------------------
    | Load Page + Collection
    |--------------------------------------------------------------------------
    */

    const [
      storefront,
      collectionData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",

          channel:
            "WEBSITE",
        }),

        getPublicCollection({
          slug,

          channel:
            "WEBSITE",

          page,

          pageSize:
            24,

          sort:
            query.sort ||
            "COLLECTION_ORDER",

          search:
            query.search,

          brandIds,

          minPrice,

          maxPrice,
        }),
      ]);

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page
          .sections
      );

    const {
      collection,
      products,
      pagination,
      sortOptions,
      filters,
    } =
      collectionData;

    const bannerUrl =
      getMediaUrl(
        collection.bannerAsset
      );

    const mobileBannerUrl =
      getMediaUrl(
        collection.mobileBannerAsset
      );

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

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

        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {/*
            |--------------------------------------------------------------------------
            | Breadcrumbs
            |--------------------------------------------------------------------------
            */}

            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-storefront-muted">
              {collectionData.breadcrumbs.map(
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
                        collectionData
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
            | Collection Hero
            |--------------------------------------------------------------------------
            */}

            <section className="relative overflow-hidden rounded-[24px] border border-storefront bg-storefront-surface">
              {bannerUrl ||
              mobileBannerUrl ? (
                <picture>
                  {mobileBannerUrl ? (
                    <source
                      media="(max-width: 639px)"
                      srcSet={
                        mobileBannerUrl
                      }
                    />
                  ) : null}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      bannerUrl ||
                      mobileBannerUrl ||
                      ""
                    }
                    alt={
                      collection.name
                    }
                    className="h-[220px] w-full object-cover sm:h-[300px] lg:h-[380px]"
                  />
                </picture>
              ) : (
                <div className="min-h-[220px] bg-storefront-primary sm:min-h-[300px]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

              <div className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-14">
                <div className="max-w-3xl text-white">
                  {collection.isFeatured ? (
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                      Featured collection
                    </p>
                  ) : null}

                  <h1 className="mt-2 text-3xl font-black sm:text-4xl lg:text-5xl">
                    {
                      collection.name
                    }
                  </h1>

                  {collection.shortDescription ? (
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
                      {
                        collection.shortDescription
                      }
                    </p>
                  ) : null}

                  {collection.showProductCount ? (
                    <p className="mt-4 text-sm font-bold text-white/85">
                      {
                        pagination.totalItems
                      }{" "}
                      {pagination.totalItems ===
                      1
                        ? "product"
                        : "products"}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/*
            |--------------------------------------------------------------------------
            | Description
            |--------------------------------------------------------------------------
            */}

            {collection.description ? (
              <section className="mt-7 rounded-[20px] border border-storefront bg-storefront-surface p-6">
                <p className="whitespace-pre-line text-sm leading-7 text-storefront-muted">
                  {
                    collection.description
                  }
                </p>
              </section>
            ) : null}

            {/*
            |--------------------------------------------------------------------------
            | Heading / Toolbar
            |--------------------------------------------------------------------------
            */}

            <div className="mt-8 flex flex-col gap-4 border-b border-storefront pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
                  Shop the collection
                </p>

                <h2 className="mt-2 text-2xl font-black text-storefront-text sm:text-3xl">
                  Products
                </h2>

                <p className="mt-1 text-sm text-storefront-muted">
                  {
                    pagination.totalItems
                  }{" "}
                  {pagination.totalItems ===
                  1
                    ? "product"
                    : "products"}{" "}
                  found
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/*
                |--------------------------------------------------------------------------
                | Mobile Filters
                |--------------------------------------------------------------------------
                */}

                <CollectionMobileFilterDrawer
                  filters={
                    filters
                  }
                />

                {/*
                |--------------------------------------------------------------------------
                | Search / Sort
                |--------------------------------------------------------------------------
                */}

                <form
                  method="GET"
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  {/*
                  |--------------------------------------------------------------------------
                  | Preserve Brand Filter
                  |--------------------------------------------------------------------------
                  */}

                  {query.brandIds ? (
                    <input
                      type="hidden"
                      name="brandIds"
                      value={
                        query.brandIds
                      }
                    />
                  ) : null}

                  {/*
                  |--------------------------------------------------------------------------
                  | Preserve Min Price
                  |--------------------------------------------------------------------------
                  */}

                  {query.minPrice ? (
                    <input
                      type="hidden"
                      name="minPrice"
                      value={
                        query.minPrice
                      }
                    />
                  ) : null}

                  {/*
                  |--------------------------------------------------------------------------
                  | Preserve Max Price
                  |--------------------------------------------------------------------------
                  */}

                  {query.maxPrice ? (
                    <input
                      type="hidden"
                      name="maxPrice"
                      value={
                        query.maxPrice
                      }
                    />
                  ) : null}

                  <input
                    type="search"
                    name="search"
                    defaultValue={
                      query.search ||
                      ""
                    }
                    placeholder="Search collection"
                    className="h-11 min-w-0 rounded-xl border border-storefront bg-white px-4 text-sm outline-none focus:border-storefront-primary sm:min-w-[220px]"
                  />

                  <select
                    name="sort"
                    defaultValue={
                      query.sort ||
                      "COLLECTION_ORDER"
                    }
                    className="h-11 min-w-0 rounded-xl border border-storefront bg-white px-4 text-sm font-semibold outline-none focus:border-storefront-primary sm:min-w-[190px]"
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
            | Filter Sidebar + Products
            |--------------------------------------------------------------------------
            */}

            <section className="mt-7">
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/*
                |--------------------------------------------------------------------------
                | Desktop Filters
                |--------------------------------------------------------------------------
                */}

                <aside className="hidden self-start rounded-2xl border border-storefront bg-storefront-surface p-5 lg:sticky lg:top-24 lg:block">
                  <CollectionFilters
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
                        This collection does not currently contain products matching your selection.
                      </p>

                      {query.search ||
                      query.brandIds ||
                      query.minPrice ||
                      query.maxPrice ? (
                        <Link
                          href={`/collections/${collection.slug}`}
                          className="mt-5 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-5 text-sm font-bold text-white"
                        >
                          Clear filters
                        </Link>
                      ) : null}
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
                            buildCollectionHref({
                              slug:
                                collection.slug,

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

                      <span className="text-sm font-bold text-storefront-muted">
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
                            buildCollectionHref({
                              slug:
                                collection.slug,

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
        PublicCollectionApiError &&
      error.status ===
        404
    ) {
      notFound();
    }

    throw error;
  }
}             