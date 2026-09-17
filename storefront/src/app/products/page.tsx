import type {
    Metadata,
  } from "next";
  
  import Link from "next/link";
  
  import StorefrontFooter from "@/components/storefront/StorefrontFooter";
  import StorefrontHeader from "@/components/storefront/StorefrontHeader";
  import StorefrontShell from "@/components/storefront/StorefrontShell";
  
  import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";
  
  import ProductListingFilters, {
    type ProductListingFiltersData,
  } from "@/components/storefront/product-listing/ProductListingFilters";
  
  import ProductListingToolbar from "@/components/storefront/product-listing/ProductListingToolbar";
  
  import {
    getPublicSearch,
  } from "@/lib/storefront/public-search-api";
  
  import {
    getStorefrontPage,
  } from "@/lib/storefront/storefront-api";
  
  import {
    splitGlobalStorefrontSections,
  } from "@/lib/storefront/storefront-sections";
  
  /*
  |--------------------------------------------------------------------------
  | Metadata
  |--------------------------------------------------------------------------
  */
  
  export const metadata: Metadata = {
    title:
      "All Products | MyShops UAE",
  
    description:
      "Shop mobiles, electronics, appliances, accessories and more at MyShops UAE.",
  
    alternates: {
      canonical:
        "/products",
    },
  };
  
  /*
  |--------------------------------------------------------------------------
  | Types
  |--------------------------------------------------------------------------
  */
  
  interface ProductsPageProps {
    searchParams: Promise<
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
  
  const getSingle = (
    value:
      | string
      | string[]
      | undefined
  ): string | undefined => {
    return Array.isArray(
      value
    )
      ? value[0]
      : value;
  };
  
  const parseCsv = (
    value:
      | string
      | string[]
      | undefined
  ): string[] => {
    const raw =
      getSingle(
        value
      );
  
    if (!raw) {
      return [];
    }
  
    return raw
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  };
  
  const parseNumber = (
    value:
      | string
      | string[]
      | undefined
  ): number | undefined => {
    const raw =
      getSingle(
        value
      );
  
    if (
      raw === undefined ||
      raw === ""
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
  
  const parsePage = (
    value:
      | string
      | string[]
      | undefined
  ): number => {
    const parsed =
      Number(
        getSingle(
          value
        ) ||
          1
      );
  
    if (
      !Number.isFinite(
        parsed
      ) ||
      parsed < 1
    ) {
      return 1;
    }
  
    return Math.floor(
      parsed
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Pagination URL
  |--------------------------------------------------------------------------
  */
  
  const buildPageUrl = ({
    query,
    page,
  }: {
    query: Record<
      string,
      | string
      | string[]
      | undefined
    >;
  
    page: number;
  }): string => {
    const params =
      new URLSearchParams();
  
    const preservedKeys = [
      "search",
      "sort",
      "brandIds",
      "categoryIds",
      "minPrice",
      "maxPrice",
    ];
  
    preservedKeys.forEach(
      (key) => {
        const value =
          getSingle(
            query[key]
          );
  
        if (value) {
          params.set(
            key,
            value
          );
        }
      }
    );
  
    if (
      page >
      1
    ) {
      params.set(
        "page",
        String(
          page
        )
      );
    }
  
    const queryString =
      params.toString();
  
    return queryString
      ? `/products?${queryString}`
      : "/products";
  };
  
  /*
  |--------------------------------------------------------------------------
  | Convert Search API Filters
  |--------------------------------------------------------------------------
  */
  
  const buildListingFilters = (
    filters: Awaited<
      ReturnType<
        typeof getPublicSearch
      >
    >["filters"]
  ): ProductListingFiltersData => {
    const brandFilter =
      filters.find(
        (filter) =>
          filter.code ===
          "BRAND"
      );
  
    const categoryFilter =
      filters.find(
        (filter) =>
          filter.code ===
          "CATEGORY"
      );
  
    const priceFilter =
      filters.find(
        (filter) =>
          filter.code ===
          "PRICE"
      );
  
    return {
      categories:
        categoryFilter
          ?.options
          ?.map(
            (option) => ({
              id:
                option.id,
  
              label:
                option.label,
  
              count:
                option.count,
            })
          ) ||
        [],
  
      brands:
        brandFilter
          ?.options
          ?.map(
            (option) => ({
              id:
                option.id,
  
              label:
                option.label,
  
              count:
                option.count,
            })
          ) ||
        [],
  
      minimumPrice:
        priceFilter
          ?.minimum ??
        null,
  
      maximumPrice:
        priceFilter
          ?.maximum ??
        null,
  
      currencyCode:
        priceFilter
          ?.currencyCode ||
        "AED",
    };
  };
  
  /*
  |--------------------------------------------------------------------------
  | Products Page
  |--------------------------------------------------------------------------
  */
  
  export default async function ProductsPage({
    searchParams,
  }: ProductsPageProps) {
    const query =
      await searchParams;
  
    const searchText =
      getSingle(
        query.search
      )?.trim() ||
      "";
  
    const page =
      parsePage(
        query.page
      );
  
    /*
     * Use FEATURED as the default catalogue
     * ordering instead of RELEVANCE.
     *
     * RELEVANCE remains untouched for /search.
     */
    const sort =
      getSingle(
        query.sort
      ) ||
      "FEATURED";
  
    const [
      storefront,
      productData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",
  
          channel:
            "WEBSITE",
        }),
  
        getPublicSearch({
          query: {
            /*
             * Search API is intentionally reused
             * as the catalogue API.
             *
             * An empty q returns the complete
             * eligible product catalogue.
             */
            q:
              searchText,
  
            page,
  
            pageSize:
              24,
  
            brandIds:
              parseCsv(
                query.brandIds
              ),
  
            categoryIds:
              parseCsv(
                query.categoryIds
              ),
  
            minPrice:
              parseNumber(
                query.minPrice
              ),
  
            maxPrice:
              parseNumber(
                query.maxPrice
              ),
  
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
      products,
      pagination,
      filters,
    } =
      productData;
  
    const listingFilters =
      buildListingFilters(
        filters
      );
  
    const showingFrom =
      products.length
        ? (
            pagination.page -
            1
          ) *
            pagination.pageSize +
          1
        : 0;
  
    const showingTo =
      products.length
        ? Math.min(
            pagination.page *
              pagination.pageSize,
  
            pagination.totalItems
          )
        : 0;
  
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
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
            {/* Page Header */}
  
            <div className="border-b border-storefront-border-light pb-6">
              <h1 className="text-3xl font-bold tracking-tight text-storefront-text sm:text-4xl">
                All Products
              </h1>
  
              <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted">
                Browse our complete range of mobiles, electronics, appliances, accessories and more.
              </p>
  
              <p className="mt-2 text-sm text-storefront-muted">
                <span className="font-medium text-storefront-text">
                  {
                    pagination.totalItems
                  }
                </span>{" "}
                {pagination.totalItems ===
                1
                  ? "product"
                  : "products"}
              </p>
            </div>
  
            {/* Product Listing */}
  
            <section className="mt-7">
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* Desktop Filters */}
  
                <aside className="hidden self-start rounded-2xl border border-storefront-border-light bg-storefront-surface p-5 lg:sticky lg:top-24 lg:block">
                  <ProductListingFilters
                    filters={
                      listingFilters
                    }
                  />
                </aside>
  
                {/* Products */}
  
                <div className="min-w-0">
                  <ProductListingToolbar
                    totalItems={
                      pagination.totalItems
                    }
                    filters={
                      listingFilters
                    }
                    searchPlaceholder="Search all products"
                  />
  
                  {pagination.totalItems >
                  0 ? (
                    <p className="mb-5 text-sm text-storefront-muted">
                      Showing{" "}
                      {
                        showingFrom
                      }{" "}
                      -{" "}
                      {
                        showingTo
                      }{" "}
                      of{" "}
                      {
                        pagination.totalItems
                      }
                    </p>
                  ) : null}
  
                  {products.length >
                  0 ? (
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
                    <div className="rounded-2xl border border-storefront-border-light bg-storefront-surface px-6 py-16 text-center">
                      <h2 className="text-xl font-bold text-storefront-text">
                        No products found
                      </h2>
  
                      <p className="mt-2 text-sm text-storefront-muted">
                        Try changing or clearing your filters.
                      </p>
  
                      <Link
                        href="/products"
                        className="mt-6 inline-flex h-11 items-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-bold text-white"
                      >
                        Clear filters
                      </Link>
                    </div>
                  )}
  
                  {/* Pagination */}
  
                  {pagination.totalPages >
                  1 ? (
                    <nav className="mt-10 flex items-center justify-center gap-3">
                      {pagination.hasPreviousPage ? (
                        <Link
                          href={buildPageUrl({
                            query,
  
                            page:
                              pagination.page -
                              1,
                          })}
                          className="flex h-11 items-center justify-center rounded-storefront-button border border-storefront-border-light bg-white px-5 text-sm font-medium text-storefront-text"
                        >
                          Previous
                        </Link>
                      ) : null}
  
                      <span className="text-sm font-medium text-storefront-muted">
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
                          href={buildPageUrl({
                            query,
  
                            page:
                              pagination.page +
                              1,
                          })}
                          className="flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-5 text-sm font-bold text-white"
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
  }