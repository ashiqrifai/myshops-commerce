"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import type {
  PublicCollectionFilter,
} from "@/types/publicCollection";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const parseCsv = (
  value:
    string |
    null
) =>
  value
    ? value
        .split(",")
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

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CollectionFilters({
  filters,
  onApplied,
}: {
  filters:
    PublicCollectionFilter[];

  onApplied?:
    () => void;
}) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  /*
  |--------------------------------------------------------------------------
  | Navigate
  |--------------------------------------------------------------------------
  */

  const navigate = (
    params:
      URLSearchParams
  ) => {
    /*
     * Any filter change should reset pagination.
     */
    params.delete(
      "page"
    );

    const query =
      params.toString();

    router.push(
      query
        ? `?${query}`
        : "?",
      {
        scroll:
          false,
      }
    );

    onApplied?.();
  };

  /*
  |--------------------------------------------------------------------------
  | Currently Selected Values
  |--------------------------------------------------------------------------
  */

  const selectedBrands =
    new Set(
      parseCsv(
        searchParams.get(
          "brandIds"
        )
      )
    );

  const selectedCategories =
    new Set(
      parseCsv(
        searchParams.get(
          "categoryIds"
        )
      )
    );

  /*
  |--------------------------------------------------------------------------
  | Generic Multi Select Handler
  |--------------------------------------------------------------------------
  */

  const updateCsvParam = (
    key:
      string,

    value:
      string,

    checked:
      boolean
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    const current =
      new Set(
        parseCsv(
          params.get(
            key
          )
        )
      );

    if (
      checked
    ) {
      current.add(
        value
      );
    } else {
      current.delete(
        value
      );
    }

    if (
      current.size >
      0
    ) {
      params.set(
        key,
        Array.from(
          current
        ).join(",")
      );
    } else {
      params.delete(
        key
      );
    }

    navigate(
      params
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Clear All Filters
  |--------------------------------------------------------------------------
  */

  const clearAll =
    () => {
      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      [
        "brandIds",
        "categoryIds",
        "minPrice",
        "maxPrice",
        "search",
        "page",
      ].forEach(
        (
          key
        ) =>
          params.delete(
            key
          )
      );

      navigate(
        params
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/*
      |--------------------------------------------------------------------------
      | Header
      |--------------------------------------------------------------------------
      */}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-storefront-text">
          Filters
        </h2>

        <button
          type="button"
          onClick={
            clearAll
          }
          className="text-xs font-bold text-storefront-primary transition hover:opacity-70"
        >
          Clear all
        </button>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Dynamic Filters
      |--------------------------------------------------------------------------
      */}

      {filters.map(
        (
          filter
        ) => {
          /*
          |--------------------------------------------------------------------------
          | Brand + Category
          |--------------------------------------------------------------------------
          */

          if (
            filter.code ===
              "BRAND" ||
            filter.code ===
              "CATEGORY"
          ) {
            if (
              !filter.options
                ?.length
            ) {
              return null;
            }

            const parameterName =
              filter.code ===
              "BRAND"
                ? "brandIds"
                : "categoryIds";

            const selected =
              filter.code ===
              "BRAND"
                ? selectedBrands
                : selectedCategories;

            return (
              <section
                key={
                  filter.code
                }
                className="border-t border-storefront pt-5"
              >
                <h3 className="mb-3 text-sm font-black text-storefront-text">
                  {
                    filter.label
                  }
                </h3>

                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {filter.options.map(
                    (
                      option
                    ) => {
                      const checked =
                        selected.has(
                          option.id
                        );

                      return (
                        <label
                          key={
                            option.id
                          }
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-storefront-secondary"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={(
                                event
                              ) =>
                                updateCsvParam(
                                  parameterName,
                                  option.id,
                                  event
                                    .target
                                    .checked
                                )
                              }
                              className="h-4 w-4 shrink-0 rounded border-storefront accent-[var(--storefront-primary)]"
                            />

                            <span className="truncate text-storefront-text">
                              {
                                option.label
                              }
                            </span>
                          </span>

                          <span className="shrink-0 text-xs text-storefront-muted">
                            {
                              option.count
                            }
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </section>
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Price
          |--------------------------------------------------------------------------
          */

          if (
            filter.code ===
            "PRICE"
          ) {
            return (
              <PriceFilter
                key={
                  filter.code
                }
                filter={
                  filter
                }
                onNavigate={
                  navigate
                }
              />
            );
          }

          /*
           * Unknown filters are ignored for now.
           */
          return null;
        }
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Price Filter
|--------------------------------------------------------------------------
*/

function PriceFilter({
  filter,
  onNavigate,
}: {
  filter:
    PublicCollectionFilter;

  onNavigate: (
    params:
      URLSearchParams
  ) => void;
}) {
  const searchParams =
    useSearchParams();

  /*
  |--------------------------------------------------------------------------
  | Apply Price
  |--------------------------------------------------------------------------
  */

  const apply = (
    formData:
      FormData
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    const min =
      String(
        formData.get(
          "minPrice"
        ) ||
        ""
      ).trim();

    const max =
      String(
        formData.get(
          "maxPrice"
        ) ||
        ""
      ).trim();

    if (
      min
    ) {
      params.set(
        "minPrice",
        min
      );
    } else {
      params.delete(
        "minPrice"
      );
    }

    if (
      max
    ) {
      params.set(
        "maxPrice",
        max
      );
    } else {
      params.delete(
        "maxPrice"
      );
    }

    onNavigate(
      params
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section className="border-t border-storefront pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-storefront-text">
          {
            filter.label
          }
        </h3>

        {filter.currencyCode ? (
          <span className="text-[11px] font-bold uppercase text-storefront-muted">
            {
              filter.currencyCode
            }
          </span>
        ) : null}
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Available Range
      |--------------------------------------------------------------------------
      */}

      {filter.minimum !==
        null &&
      filter.minimum !==
        undefined &&
      filter.maximum !==
        null &&
      filter.maximum !==
        undefined ? (
        <p className="mb-3 text-xs text-storefront-muted">
          Available{" "}
          {
            filter.currencyCode ||
            "AED"
          }{" "}
          {
            filter.minimum
          }{" "}
          –{" "}
          {
            filter.maximum
          }
        </p>
      ) : null}

      <form
        action={
          apply
        }
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2">
          {/*
          |--------------------------------------------------------------------------
          | Min Price
          |--------------------------------------------------------------------------
          */}

          <div>
            <label
              htmlFor="collection-min-price"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-storefront-muted"
            >
              Min
            </label>

            <input
              id="collection-min-price"
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                searchParams.get(
                  "minPrice"
                ) ||
                ""
              }
              placeholder={
                filter.minimum !==
                  null &&
                filter.minimum !==
                  undefined
                  ? String(
                      filter.minimum
                    )
                  : "Min"
              }
              className="h-10 min-w-0 w-full rounded-lg border border-storefront bg-white px-3 text-sm text-storefront-text outline-none transition focus:border-storefront-primary"
            />
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Max Price
          |--------------------------------------------------------------------------
          */}

          <div>
            <label
              htmlFor="collection-max-price"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-storefront-muted"
            >
              Max
            </label>

            <input
              id="collection-max-price"
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                searchParams.get(
                  "maxPrice"
                ) ||
                ""
              }
              placeholder={
                filter.maximum !==
                  null &&
                filter.maximum !==
                  undefined
                  ? String(
                      filter.maximum
                    )
                  : "Max"
              }
              className="h-10 min-w-0 w-full rounded-lg border border-storefront bg-white px-3 text-sm text-storefront-text outline-none transition focus:border-storefront-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          className="h-10 w-full rounded-storefront-button bg-storefront-primary px-4 text-xs font-bold text-white transition hover:opacity-90"
        >
          Apply price
        </button>
      </form>
    </section>
  );
}