"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import type {
  PublicBrandFilter,
} from "@/types/publicBrand";

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

export default function BrandFilters({
  filters,
  onApplied,
}: {
  filters:
    PublicBrandFilter[];

  onApplied?:
    () => void;
}) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const navigate =
    (
      params:
        URLSearchParams
    ) => {
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

  const updateCategory =
    (
      categoryId:
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
              "categoryIds"
            )
          )
        );

      if (
        checked
      ) {
        current.add(
          categoryId
        );
      } else {
        current.delete(
          categoryId
        );
      }

      if (
        current.size
      ) {
        params.set(
          "categoryIds",
          Array.from(
            current
          ).join(",")
        );
      } else {
        params.delete(
          "categoryIds"
        );
      }

      navigate(
        params
      );
    };

  const clearAll =
    () => {
      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      [
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

  const selectedCategories =
    new Set(
      parseCsv(
        searchParams.get(
          "categoryIds"
        )
      )
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-storefront-text">
          Filters
        </h2>

        <button
          type="button"
          onClick={
            clearAll
          }
          className="text-xs font-bold text-storefront-primary hover:underline"
        >
          Clear all
        </button>
      </div>

      {filters.map(
        (
          filter
        ) => {
          if (
            filter.code ===
            "CATEGORY"
          ) {
            if (
              !filter.options
                ?.length
            ) {
              return null;
            }

            return (
              <section
                key={
                  filter.code
                }
                className="border-t border-storefront pt-5"
              >
                <h3 className="mb-3 text-sm font-black text-storefront-text">
                  Categories
                </h3>

                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {filter.options.map(
                    (
                      option
                    ) => (
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
                              selectedCategories.has(
                                option.id
                              )
                            }
                            onChange={(
                              event
                            ) =>
                              updateCategory(
                                option.id,
                                event.target
                                  .checked
                              )
                            }
                            className="h-4 w-4 rounded border-storefront accent-[var(--storefront-primary)]"
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
                    )
                  )}
                </div>
              </section>
            );
          }

          if (
            filter.code ===
            "PRICE"
          ) {
            return (
              <BrandPriceFilter
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

          return null;
        }
      )}
    </div>
  );
}

function BrandPriceFilter({
  filter,
  onNavigate,
}: {
  filter:
    PublicBrandFilter;

  onNavigate:
    (
      params:
        URLSearchParams
    ) => void;
}) {
  const searchParams =
    useSearchParams();

  const apply =
    (
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

  return (
    <section className="border-t border-storefront pt-5">
      <h3 className="mb-1 text-sm font-black text-storefront-text">
        Price
      </h3>

      <p className="mb-3 text-xs text-storefront-muted">
        {
          filter.currencyCode ||
          "AED"
        }
      </p>

      <form
        action={
          apply
        }
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2">
          <input
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
                ? `Min ${filter.minimum}`
                : "Min"
            }
            className="h-10 min-w-0 rounded-lg border border-storefront bg-white px-3 text-sm outline-none focus:border-storefront-primary"
          />

          <input
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
                ? `Max ${filter.maximum}`
                : "Max"
            }
            className="h-10 min-w-0 rounded-lg border border-storefront bg-white px-3 text-sm outline-none focus:border-storefront-primary"
          />
        </div>

        <button
          type="submit"
          className="h-10 w-full rounded-storefront-button bg-storefront-primary text-xs font-bold text-white transition hover:opacity-90"
        >
          Apply price
        </button>
      </form>
    </section>
  );
}