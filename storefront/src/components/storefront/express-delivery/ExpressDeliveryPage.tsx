"use client";

import Link from "next/link";

import {
  ChevronDown,
  Clock3,
  MapPin,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useMemo,
  useState,
} from "react";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import type {
  ExpressDeliveryData,
  ExpressDeliveryRegion,
} from "@/lib/storefront/express-delivery-api";

interface Props {
  data:
    ExpressDeliveryData;

  region:
    ExpressDeliveryRegion;
}

const regionHref = (
  region:
    ExpressDeliveryRegion
) =>
  `/express-delivery?region=${region}`;

const csv = (
  value:
    string |
    null
) =>
  String(
    value ||
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

export default function ExpressDeliveryPage({
  data,
  region,
}: Props) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    brandSearch,
    setBrandSearch,
  ] =
    useState(
      ""
    );

  const selectedCategories =
    useMemo(
      () =>
        csv(
          searchParams.get(
            "categoryIds"
          )
        ),
      [
        searchParams,
      ]
    );

  const selectedBrands =
    useMemo(
      () =>
        csv(
          searchParams.get(
            "brandIds"
          )
        ),
      [
        searchParams,
      ]
    );

  const updateParams =
    (
      updates: Record<
        string,
        string |
        null
      >
    ) => {
      const params =
        new URLSearchParams(
          searchParams
            .toString()
        );

      Object.entries(
        updates
      ).forEach(
        ([
          key,
          value,
        ]) => {
          if (
            value ===
              null ||
            value ===
              ""
          ) {
            params.delete(
              key
            );
          } else {
            params.set(
              key,
              value
            );
          }
        }
      );

      params.set(
        "region",
        region
      );

      params.delete(
        "page"
      );

      router.push(
        `/express-delivery?${params.toString()}`
      );
    };

  const toggleCsv =
    (
      key:
        "categoryIds" |
        "brandIds",

      id:
        string
    ) => {
      const current =
        key ===
        "categoryIds"
          ? selectedCategories
          : selectedBrands;

      const next =
        current.includes(
          id
        )
          ? current.filter(
              (item) =>
                item !==
                id
            )
          : [
              ...current,
              id,
            ];

      updateParams({
        [key]:
          next.length
            ? next.join(
                ","
              )
            : null,
      });
    };

  const clearFilters =
    () => {
      router.push(
        `/express-delivery?region=${region}`
      );
    };

  const filteredBrands =
    data.filters.brands
      .filter(
        (brand) =>
          brand.label
            .toLowerCase()
            .includes(
              brandSearch
                .trim()
                .toLowerCase()
            )
      );

  const minPrice =
    searchParams.get(
      "minPrice"
    ) ||
    "";

  const maxPrice =
    searchParams.get(
      "maxPrice"
    ) ||
    "";

  const isDubaiSharjah =
    region ===
    "DXB_SHJ";

  const paginationHref =
    (
      page:
        number
    ) => {
      const params =
        new URLSearchParams(
          searchParams
            .toString()
        );

      params.set(
        "region",
        region
      );

      params.set(
        "page",
        String(
          page
        )
      );

      return `/express-delivery?${params.toString()}`;
    };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      {/* Hero */}

      <section className="relative overflow-hidden rounded-2xl border border-storefront-border-light bg-[#eef9f8]">
        <div className="grid min-h-[265px] lg:grid-cols-[36%_44%_20%]">
          <div className="relative min-h-[220px] overflow-hidden lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/express-delivery-hero.jpg"
              alt="MyShops express delivery"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#eef9f8]/40" />
          </div>

          <div className="flex flex-col justify-center px-6 py-7 lg:px-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-bold text-[#138c83] shadow-sm">
              <Zap
                size={
                  14
                }
              />

              MyExpressDelivery
            </div>

            <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-storefront-text sm:text-4xl">
              Fast delivery on products{" "}
              <span className="text-[#138c83]">
                available near you
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-storefront-muted">
              Express availability is based on live stock at our participating stores and warehouses.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-storefront-border-light bg-white/85 px-3 py-2 text-xs font-medium text-storefront-text">
                <Clock3
                  size={
                    15
                  }
                />

                Express delivery is free
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-storefront-border-light bg-white/85 px-3 py-2 text-xs font-medium text-storefront-text">
                <MapPin
                  size={
                    15
                  }
                />

                Live inventory based
              </div>
            </div>
          </div>

          <div className="flex items-center p-5">
            <div className="w-full rounded-2xl border border-white/80 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef9f8] text-[#138c83]">
                <Zap
                  size={
                    26
                  }
                />
              </div>

              <p className="mt-3 text-sm font-bold text-storefront-text">
                {data.region.deliveryLabel}
              </p>

              <p className="mt-1 text-xs leading-5 text-storefront-muted">
                Subject to live stock availability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Region Tabs */}

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href={
            regionHref(
              "DXB_SHJ"
            )
          }
          className={[
            "rounded-xl border px-4 py-3 transition",
            isDubaiSharjah
              ? "border-[#62c9c0] bg-[#effaf8]"
              : "border-storefront-border-light bg-white hover:border-[#cfd5db]",
          ].join(
            " "
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#138c83]">
              <Zap
                size={
                  17
                }
              />
            </div>

            <div>
              <p className="text-sm font-bold text-storefront-text">
                2-Hour Delivery
              </p>

              <p className="mt-0.5 text-xs text-storefront-muted">
                Dubai / Sharjah
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={
            regionHref(
              "AUH"
            )
          }
          className={[
            "rounded-xl border px-4 py-3 transition",
            !isDubaiSharjah
              ? "border-[#62c9c0] bg-[#effaf8]"
              : "border-storefront-border-light bg-white hover:border-[#cfd5db]",
          ].join(
            " "
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#138c83]">
              <Zap
                size={
                  17
                }
              />
            </div>

            <div>
              <p className="text-sm font-bold text-storefront-text">
                1-Hour Delivery
              </p>

              <p className="mt-0.5 text-xs text-storefront-muted">
                Abu Dhabi
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Products */}

      <section className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Filters */}

        <aside className="self-start rounded-2xl border border-storefront-border-light bg-white lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-storefront-border-light px-4 py-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                size={
                  16
                }
              />

              <h2 className="text-sm font-bold text-storefront-text">
                Filters
              </h2>
            </div>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-xs font-medium text-[#138c83] underline underline-offset-2"
            >
              Clear all
            </button>
          </div>

          {/* Categories */}

          <div className="border-b border-storefront-border-light px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-storefront-text">
                Categories
              </h3>

              <ChevronDown
                size={
                  15
                }
              />
            </div>

            <div className="mt-3 space-y-2">
              {data.filters.categories.map(
                (
                  category
                ) => (
                  <label
                    key={
                      category.id
                    }
                    className="flex cursor-pointer items-center justify-between gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          selectedCategories.includes(
                            category.id
                          )
                        }
                        onChange={() =>
                          toggleCsv(
                            "categoryIds",
                            category.id
                          )
                        }
                        className="h-3.5 w-3.5 rounded border-storefront-border-light"
                      />

                      <span className="truncate text-storefront-text">
                        {
                          category.label
                        }
                      </span>
                    </span>

                    <span className="text-storefront-muted">
                      {
                        category.count
                      }
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Brands */}

          <div className="border-b border-storefront-border-light px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-storefront-text">
                Brands
              </h3>

              <ChevronDown
                size={
                  15
                }
              />
            </div>

            <div className="relative mt-3">
              <Search
                size={
                  14
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 text-storefront-muted"
              />

              <input
                value={
                  brandSearch
                }
                onChange={
                  (
                    event
                  ) =>
                    setBrandSearch(
                      event.target.value
                    )
                }
                placeholder="Search brands"
                className="h-9 w-full rounded-lg border border-storefront-border-light bg-white pl-9 pr-3 text-xs outline-none focus:border-[#62c9c0]"
              />
            </div>

            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {filteredBrands.map(
                (
                  brand
                ) => (
                  <label
                    key={
                      brand.id
                    }
                    className="flex cursor-pointer items-center justify-between gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          selectedBrands.includes(
                            brand.id
                          )
                        }
                        onChange={() =>
                          toggleCsv(
                            "brandIds",
                            brand.id
                          )
                        }
                        className="h-3.5 w-3.5 rounded border-storefront-border-light"
                      />

                      <span className="truncate text-storefront-text">
                        {
                          brand.label
                        }
                      </span>
                    </span>

                    <span className="text-storefront-muted">
                      {
                        brand.count
                      }
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Price */}

          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-storefront-text">
                Price Range (AED)
              </h3>

              <ChevronDown
                size={
                  15
                }
              />
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                type="number"
                defaultValue={
                  minPrice
                }
                placeholder={
                  data.filters.price
                    .minimum !=
                  null
                    ? String(
                        Math.floor(
                          data.filters.price.minimum
                        )
                      )
                    : "Min"
                }
                id="express-min-price"
                className="h-9 min-w-0 rounded-lg border border-storefront-border-light px-3 text-xs outline-none focus:border-[#62c9c0]"
              />

              <span className="text-xs text-storefront-muted">
                –
              </span>

              <input
                type="number"
                defaultValue={
                  maxPrice
                }
                placeholder={
                  data.filters.price
                    .maximum !=
                  null
                    ? String(
                        Math.ceil(
                          data.filters.price.maximum
                        )
                      )
                    : "Max"
                }
                id="express-max-price"
                className="h-9 min-w-0 rounded-lg border border-storefront-border-light px-3 text-xs outline-none focus:border-[#62c9c0]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const min =
                  (
                    document.getElementById(
                      "express-min-price"
                    ) as HTMLInputElement |
                      null
                  )?.value ||
                  "";

                const max =
                  (
                    document.getElementById(
                      "express-max-price"
                    ) as HTMLInputElement |
                      null
                  )?.value ||
                  "";

                updateParams({
                  minPrice:
                    min ||
                    null,

                  maxPrice:
                    max ||
                    null,
                });
              }}
              className="mt-3 h-9 w-full rounded-lg bg-[#138c83] px-4 text-xs font-bold text-white transition hover:opacity-90"
            >
              Apply price
            </button>
          </div>
        </aside>

        {/* Grid */}

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#138c83]">
                {data.region.label}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-storefront-text">
                Express delivery products
              </h2>

              <p className="mt-1 text-sm text-storefront-muted">
                {
                  data.pagination.totalItems
                }{" "}
                {data.pagination.totalItems ===
                1
                  ? "product"
                  : "products"}{" "}
                currently available
              </p>
            </div>

            <select
              value={
                searchParams.get(
                  "sort"
                ) ||
                "FEATURED"
              }
              onChange={
                (
                  event
                ) =>
                  updateParams({
                    sort:
                      event.target.value,
                  })
              }
              className="h-10 min-w-[185px] rounded-lg border border-storefront-border-light bg-white px-3 text-xs font-medium text-storefront-text outline-none"
            >
              {data.sortOptions.map(
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
          </div>

          {data.products.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {data.products.map(
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
            <div className="rounded-2xl border border-storefront-border-light bg-white px-6 py-14 text-center">
              <PackageSearch
                size={
                  36
                }
                className="mx-auto text-storefront-muted"
              />

              <h3 className="mt-4 text-lg font-bold text-storefront-text">
                No express products found
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-storefront-muted">
                Try clearing some filters or switch delivery region.
              </p>
            </div>
          )}

          {data.pagination.totalPages >
          1 ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              {data.pagination.hasPreviousPage ? (
                <Link
                  href={
                    paginationHref(
                      data.pagination.page -
                        1
                    )
                  }
                  className="rounded-lg border border-storefront-border-light bg-white px-4 py-2 text-sm font-medium text-storefront-text"
                >
                  Previous
                </Link>
              ) : null}

              <span className="px-3 py-2 text-sm text-storefront-muted">
                Page{" "}
                {
                  data.pagination.page
                }{" "}
                of{" "}
                {
                  data.pagination.totalPages
                }
              </span>

              {data.pagination.hasNextPage ? (
                <Link
                  href={
                    paginationHref(
                      data.pagination.page +
                        1
                    )
                  }
                  className="rounded-lg border border-storefront-border-light bg-white px-4 py-2 text-sm font-medium text-storefront-text"
                >
                  Next
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
