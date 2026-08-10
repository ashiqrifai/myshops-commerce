import type {
    Metadata,
  } from "next";
  
  import Link from "next/link";
  
  import {
    Search,
    SearchX,
  } from "lucide-react";
  
  import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";
  
  import StorefrontFooter from "@/components/storefront/StorefrontFooter";
  import StorefrontHeader from "@/components/storefront/StorefrontHeader";
  import StorefrontShell from "@/components/storefront/StorefrontShell";
  
  import {
    getPublicSearch,
  } from "@/lib/storefront/public-search-api";
  
  import {
    getStorefrontPage,
  } from "@/lib/storefront/storefront-api";
  
  import {
    splitGlobalStorefrontSections,
  } from "@/lib/storefront/storefront-sections";
  
  export const metadata: Metadata = {
    title:
      "Search",
  
    description:
      "Search products, brands and categories at MyShops.",
  };
  
  interface SearchRouteProps {
    searchParams: Promise<
      Record<
        string,
        | string
        | string[]
        | undefined
      >
    >;
  }
  
  const getSingle = (
    value:
      | string
      | string[]
      | undefined
  ) =>
    Array.isArray(
      value
    )
      ? value[0]
      : value;
  
  const parseCsv = (
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
      .split(",")
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  
  const parseNumber = (
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
  
    page:
      number;
  }) => {
    const params =
      new URLSearchParams();
  
    const searchableKeys = [
      "q",
      "sort",
      "brandIds",
      "categoryIds",
      "minPrice",
      "maxPrice",
    ];
  
    searchableKeys.forEach(
      (
        key
      ) => {
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
  
    params.set(
      "page",
      String(
        page
      )
    );
  
    return `/search?${params.toString()}`;
  };
  
  export default async function SearchRoute({
    searchParams,
  }: SearchRouteProps) {
    const query =
      await searchParams;
  
    const searchText =
      getSingle(
        query.q
      )?.trim() ||
      "";
  
    const page =
      parseNumber(
        query.page
      ) ||
      1;
  
    const [
      storefront,
      searchData,
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
            q:
              searchText,
  
            page,
  
            pageSize:
              parseNumber(
                query.pageSize
              ) ||
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
  
            sort:
              getSingle(
                query.sort
              ) ||
              "RELEVANCE",
  
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
      sortOptions,
      filters,
    } =
      searchData;
  
    const brandFilter =
      filters.find(
        (
          filter
        ) =>
          filter.code ===
          "BRAND"
      );
  
    const categoryFilter =
      filters.find(
        (
          filter
        ) =>
          filter.code ===
          "CATEGORY"
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
            globalSections.announcementSection
          }
          headerSection={
            globalSections.headerSection
          }
          navigationSection={
            globalSections.navigationSection
          }
        />
  
        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 border-b border-storefront pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
                  Product search
                </p>
  
                <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
                  {searchText
                    ? `Results for “${searchText}”`
                    : "Search products"}
                </h1>
  
                <p className="mt-2 text-sm text-storefront-muted">
                  {
                    pagination.totalItems
                  }{" "}
                  {pagination.totalItems ===
                  1
                    ? "product found"
                    : "products found"}
                </p>
              </div>
  
              <form
                method="GET"
                action="/search"
                className="flex w-full max-w-xl overflow-hidden rounded-xl border border-storefront bg-white sm:w-auto sm:min-w-[430px]"
              >
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={
                      18
                    }
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
                  />
  
                  <input
                    type="search"
                    name="q"
                    defaultValue={
                      searchText
                    }
                    placeholder="Search products, brands and categories"
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-sm outline-none"
                  />
                </div>
  
                <button
                  type="submit"
                  className="flex h-12 items-center justify-center bg-storefront-primary px-6 text-sm font-black text-white"
                >
                  Search
                </button>
              </form>
            </div>
  
            <div className="mt-7 grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-28 space-y-5 rounded-[20px] border border-storefront bg-storefront-surface p-5">
                  <div>
                    <h2 className="text-base font-black text-storefront-text">
                      Refine results
                    </h2>
  
                    <p className="mt-1 text-xs text-storefront-muted">
                      Use the options below to narrow your search.
                    </p>
                  </div>
  
                  {brandFilter
                    ?.options
                    ?.length ? (
                    <section className="border-t border-storefront pt-5">
                      <h3 className="text-sm font-black text-storefront-text">
                        Brand
                      </h3>
  
                      <div className="mt-3 space-y-2">
                        {brandFilter.options
                          .slice(
                            0,
                            12
                          )
                          .map(
                            (
                              option
                            ) => (
                              <Link
                                key={
                                  option.id
                                }
                                href={{
                                  pathname:
                                    "/search",
  
                                  query: {
                                    ...(searchText
                                      ? {
                                          q:
                                            searchText,
                                        }
                                      : {}),
  
                                    brandIds:
                                      option.id,
  
                                    sort:
                                      getSingle(
                                        query.sort
                                      ) ||
                                      "RELEVANCE",
                                  },
                                }}
                                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-storefront-muted hover:bg-storefront-secondary hover:text-storefront-primary"
                              >
                                <span className="truncate">
                                  {
                                    option.label
                                  }
                                </span>
  
                                <span className="text-xs">
                                  {
                                    option.count
                                  }
                                </span>
                              </Link>
                            )
                          )}
                      </div>
                    </section>
                  ) : null}
  
                  {categoryFilter
                    ?.options
                    ?.length ? (
                    <section className="border-t border-storefront pt-5">
                      <h3 className="text-sm font-black text-storefront-text">
                        Category
                      </h3>
  
                      <div className="mt-3 space-y-2">
                        {categoryFilter.options
                          .slice(
                            0,
                            12
                          )
                          .map(
                            (
                              option
                            ) => (
                              <Link
                                key={
                                  option.id
                                }
                                href={{
                                  pathname:
                                    "/search",
  
                                  query: {
                                    ...(searchText
                                      ? {
                                          q:
                                            searchText,
                                        }
                                      : {}),
  
                                    categoryIds:
                                      option.id,
  
                                    sort:
                                      getSingle(
                                        query.sort
                                      ) ||
                                      "RELEVANCE",
                                  },
                                }}
                                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-storefront-muted hover:bg-storefront-secondary hover:text-storefront-primary"
                              >
                                <span className="truncate">
                                  {
                                    option.label
                                  }
                                </span>
  
                                <span className="text-xs">
                                  {
                                    option.count
                                  }
                                </span>
                              </Link>
                            )
                          )}
                      </div>
                    </section>
                  ) : null}
  
                  {(getSingle(
                    query.brandIds
                  ) ||
                    getSingle(
                      query.categoryIds
                    ) ||
                    getSingle(
                      query.minPrice
                    ) ||
                    getSingle(
                      query.maxPrice
                    )) ? (
                    <Link
                      href={{
                        pathname:
                          "/search",
  
                        query: {
                          ...(searchText
                            ? {
                                q:
                                  searchText,
                              }
                            : {}),
  
                          sort:
                            getSingle(
                              query.sort
                            ) ||
                            "RELEVANCE",
                        },
                      }}
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-storefront bg-white text-xs font-black text-storefront-primary"
                    >
                      Clear filters
                    </Link>
                  ) : null}
                </div>
              </aside>
  
              <section className="min-w-0">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-storefront-muted">
                    Showing{" "}
                    {products.length
                      ? (pagination.page -
                          1) *
                          pagination.pageSize +
                        1
                      : 0}
                    –
                    {Math.min(
                      pagination.page *
                        pagination.pageSize,
                      pagination.totalItems
                    )}{" "}
                    of{" "}
                    {
                      pagination.totalItems
                    }
                  </p>
  
                  <form
                    method="GET"
                    action="/search"
                    className="flex items-center gap-2"
                  >
                    {searchText ? (
                      <input
                        type="hidden"
                        name="q"
                        value={
                          searchText
                        }
                      />
                    ) : null}
  
                    {getSingle(
                      query.brandIds
                    ) ? (
                      <input
                        type="hidden"
                        name="brandIds"
                        value={
                          getSingle(
                            query.brandIds
                          )
                        }
                      />
                    ) : null}
  
                    {getSingle(
                      query.categoryIds
                    ) ? (
                      <input
                        type="hidden"
                        name="categoryIds"
                        value={
                          getSingle(
                            query.categoryIds
                          )
                        }
                      />
                    ) : null}
  
                    <label
                      htmlFor="search-sort"
                      className="text-xs font-bold text-storefront-muted"
                    >
                      Sort:
                    </label>
  
                    <select
                      id="search-sort"
                      name="sort"
                      defaultValue={
                        getSingle(
                          query.sort
                        ) ||
                        "RELEVANCE"
                      }
                      className="h-10 rounded-xl border border-storefront bg-white px-3 text-sm font-semibold outline-none"
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
                      className="h-10 rounded-xl bg-storefront-primary px-4 text-xs font-black text-white"
                    >
                      Apply
                    </button>
                  </form>
                </div>
  
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
                  <div className="rounded-[22px] border border-storefront bg-storefront-surface px-6 py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
                      <SearchX
                        size={
                          28
                        }
                      />
                    </div>
  
                    <h2 className="mt-5 text-xl font-black text-storefront-text">
                      No products found
                    </h2>
  
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-storefront-muted">
                      Try another product name, model, SKU, brand or category.
                    </p>
  
                    <Link
                      href="/"
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-black text-white"
                    >
                      Continue shopping
                    </Link>
                  </div>
                )}
  
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
                        href={buildPageUrl({
                          query,
                          page:
                            pagination.page +
                            1,
                        })}
                        className="flex h-11 items-center justify-center rounded-xl bg-storefront-primary px-5 text-sm font-bold text-white"
                      >
                        Next
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </section>
            </div>
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