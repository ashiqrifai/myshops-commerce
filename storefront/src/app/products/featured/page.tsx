import type {
    Metadata,
  } from "next";
  
  import Link from "next/link";
  
  import StorefrontFooter from "@/components/storefront/StorefrontFooter";
  import StorefrontHeader from "@/components/storefront/StorefrontHeader";
  import StorefrontShell from "@/components/storefront/StorefrontShell";
  
  import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";
  
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
      "Featured Products | MyShops",
  
    description:
      "Explore featured products at MyShops.",
  };
  
  interface FeaturedProductsPageProps {
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
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  
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
  }) => {
    const params =
      new URLSearchParams();
  
    const keys = [
      "sort",
      "brandIds",
      "categoryIds",
      "minPrice",
      "maxPrice",
    ];
  
    keys.forEach(
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
  
    params.set(
      "page",
      String(
        page
      )
    );
  
    return `/products/featured?${params.toString()}`;
  };
  
  export default async function FeaturedProductsPage({
    searchParams,
  }: FeaturedProductsPageProps) {
    const query =
      await searchParams;
  
    const page =
      parseNumber(
        query.page
      ) ||
      1;
  
    const [
      storefront,
      featuredData,
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
            featured:
              true,
  
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
  
            sort:
              (
                getSingle(
                  query.sort
                ) ||
                "FEATURED"
              ) as never,
  
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
    } =
      featuredData;
  
    const startItem =
      products.length
        ? (
            pagination.page -
            1
          ) *
            pagination.pageSize +
          1
        : 0;
  
    const endItem =
      Math.min(
        pagination.page *
          pagination.pageSize,
  
        pagination.totalItems
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
  
        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="border-b border-storefront-light pb-6">
              <h1 className="text-3xl font-bold text-storefront-text sm:text-4xl">
                Featured Products
              </h1>
  
              <p className="mt-2 text-sm font-normal text-storefront-muted">
                {
                  pagination.totalItems
                }{" "}
                {pagination.totalItems ===
                1
                  ? "product"
                  : "products"}
              </p>
            </div>
  
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-normal text-storefront-muted">
                Showing{" "}
                {
                  startItem
                }
                {" - "}
                {
                  endItem
                }
                {" of "}
                {
                  pagination.totalItems
                }
              </p>
  
              <form
                method="GET"
                action="/products/featured"
                className="flex items-center gap-2"
              >
                <label
                  htmlFor="sort"
                  className="text-sm font-medium text-storefront-muted"
                >
                  Sort
                </label>
  
                <select
                  id="sort"
                  name="sort"
                  defaultValue={
                    getSingle(
                      query.sort
                    ) ||
                    "FEATURED"
                  }
                  className="h-11 rounded-storefront-button border border-storefront-light bg-white px-3 text-sm font-medium text-storefront-text outline-none focus:border-storefront-primary"
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
                  className="h-11 rounded-storefront-button bg-storefront-primary px-5 text-sm font-bold text-white"
                >
                  Apply
                </button>
              </form>
            </div>
  
            {products.length >
            0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
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
              <div className="mt-8 rounded-2xl border border-storefront-light bg-storefront-surface px-6 py-16 text-center">
                <h2 className="text-xl font-bold text-storefront-text">
                  No featured products
                </h2>
  
                <p className="mt-2 text-sm font-normal text-storefront-muted">
                  There are currently
                  no featured products
                  available.
                </p>
  
                <Link
                  href="/"
                  className="mt-6 inline-flex h-11 items-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-bold text-white"
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
                    className="flex h-11 items-center rounded-storefront-button border border-storefront-light bg-white px-5 text-sm font-medium text-storefront-text"
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
                    className="flex h-11 items-center rounded-storefront-button bg-storefront-primary px-5 text-sm font-bold text-white"
                  >
                    Next
                  </Link>
                ) : null}
              </nav>
            ) : null}
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