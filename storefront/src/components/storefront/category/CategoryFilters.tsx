"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import type {
  PublicCategoryFilter,
} from "@/types/publicCategory";

const parseCsv = (
  value: string | null
) =>
  value
    ? value
        .split(",")
        .map((item) =>
          item.trim()
        )
        .filter(Boolean)
    : [];

export default function CategoryFilters({
  filters,
  onApplied,
}: {
  filters: PublicCategoryFilter[];
  onApplied?: () => void;
}) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const navigate = (
    params: URLSearchParams
  ) => {
    params.delete("page");

    const query =
      params.toString();

    router.push(
      query ? `?${query}` : "?",
      {
        scroll: false,
      }
    );

    onApplied?.();
  };

  const updateCsvParam = (
    key: string,
    value: string,
    checked: boolean
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    const current =
      new Set(
        parseCsv(
          params.get(key)
        )
      );

    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }

    if (current.size) {
      params.set(
        key,
        Array.from(current).join(",")
      );
    } else {
      params.delete(key);
    }

    navigate(params);
  };

  const selectedBrands =
    new Set(
      parseCsv(
        searchParams.get(
          "brandIds"
        )
      )
    );

  const selectedOptions =
    new Set(
      parseCsv(
        searchParams.get(
          "attributeOptionIds"
        )
      )
    );

  const clearAll = () => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    [
      "brandIds",
      "attributeOptionIds",
      "minPrice",
      "maxPrice",
      "search",
      "page",
    ].forEach((key) =>
      params.delete(key)
    );

    Array.from(
      params.keys()
    ).forEach((key) => {
      if (
        key.startsWith(
          "attributeMin["
        ) ||
        key.startsWith(
          "attributeMax["
        )
      ) {
        params.delete(key);
      }
    });

    navigate(params);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-storefront-text">
          Filters
        </h2>

        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-bold text-storefront-primary"
        >
          Clear all
        </button>
      </div>

      {filters.map(
        (filter) => {
          if (
            filter.code ===
            "PRICE"
          ) {
            return (
              <PriceFilter
                key={filter.code}
                filter={filter}
                onNavigate={
                  navigate
                }
              />
            );
          }

          if (
            filter.type ===
            "NUMBER_RANGE"
          ) {
            return (
              <AttributeNumberRangeFilter
                key={
                  filter.id ||
                  filter.code
                }
                filter={filter}
                onNavigate={
                  navigate
                }
              />
            );
          }

          const parameterName =
            filter.code ===
            "BRAND"
              ? "brandIds"
              : "attributeOptionIds";

          const selected =
            filter.code ===
            "BRAND"
              ? selectedBrands
              : selectedOptions;

          if (
            !filter.options
              ?.length
          ) {
            return null;
          }

          return (
            <section
              key={
                filter.id ||
                filter.code
              }
              className="border-t border-storefront-border-light pt-5"
            >
              <h3 className="mb-3 text-sm font-black text-storefront-text">
                {filter.label}
              </h3>

              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {filter.options.map(
                  (option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-storefront-secondary"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected.has(
                            option.id
                          )}
                          onChange={(
                            event
                          ) =>
                            updateCsvParam(
                              parameterName,
                              option.id,
                              event.target
                                .checked
                            )
                          }
                          className="h-4 w-4 rounded border-storefront accent-[var(--storefront-primary)]"
                        />

                        {option.swatchValue ? (
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-storefront-border-light"
                            style={{
                              backgroundColor:
                                option.swatchValue,
                            }}
                          />
                        ) : null}

                        <span className="truncate text-storefront-text">
                          {
                            option.label
                          }
                        </span>
                      </span>

                      <span className="text-xs text-storefront-muted">
                        {option.count}
                      </span>
                    </label>
                  )
                )}
              </div>
            </section>
          );
        }
      )}
    </div>
  );
}

function PriceFilter({
  filter,
  onNavigate,
}: {
  filter: PublicCategoryFilter;
  onNavigate: (
    params: URLSearchParams
  ) => void;
}) {
  const searchParams =
    useSearchParams();

  const apply = (
    formData: FormData
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    const min =
      String(
        formData.get(
          "minPrice"
        ) || ""
      ).trim();

    const max =
      String(
        formData.get(
          "maxPrice"
        ) || ""
      ).trim();

    min
      ? params.set(
          "minPrice",
          min
        )
      : params.delete(
          "minPrice"
        );

    max
      ? params.set(
          "maxPrice",
          max
        )
      : params.delete(
          "maxPrice"
        );

    onNavigate(params);
  };

  return (
    <section className="border-t border-storefront pt-5">
      <h3 className="mb-3 text-sm font-black text-storefront-text">
        Price
      </h3>

      <form
        action={apply}
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
              filter.minimum ||
              ""
            }
            placeholder="Min"
            className="h-10 rounded-lg border border-storefront-border-light bg-white px-3 text-sm outline-none transition focus:border-storefront-primary"
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
              filter.maximum ||
              ""
            }
            placeholder="Max"
            className="h-10 rounded-lg border border-storefront bg-white px-3 text-sm outline-none focus:border-storefront-primary"
          />
        </div>

        <button
          type="submit"
          className="h-10 w-full rounded-storefront-button bg-storefront-primary text-xs font-bold text-white"
        >
          Apply price
        </button>
      </form>
    </section>
  );
}

function AttributeNumberRangeFilter({
  filter,
  onNavigate,
}: {
  filter: PublicCategoryFilter;
  onNavigate: (
    params: URLSearchParams
  ) => void;
}) {
  const searchParams =
    useSearchParams();

  if (!filter.id) {
    return null;
  }

  const minKey =
    `attributeMin[${filter.id}]`;

  const maxKey =
    `attributeMax[${filter.id}]`;

  const apply = (
    formData: FormData
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    const min =
      String(
        formData.get(
          "attributeMin"
        ) || ""
      ).trim();

    const max =
      String(
        formData.get(
          "attributeMax"
        ) || ""
      ).trim();

    min
      ? params.set(
          minKey,
          min
        )
      : params.delete(
          minKey
        );

    max
      ? params.set(
          maxKey,
          max
        )
      : params.delete(
          maxKey
        );

    onNavigate(params);
  };

  return (
    <section className="border-t border-storefront pt-5">
      <h3 className="mb-1 text-sm font-black text-storefront-text">
        {filter.label}
      </h3>

      {filter.unit ? (
        <p className="mb-3 text-xs text-storefront-muted">
          Unit: {filter.unit}
        </p>
      ) : null}

      <form
        action={apply}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            name="attributeMin"
            type="number"
            step="any"
            defaultValue={
              searchParams.get(
                minKey
              ) ||
              filter.minimum ||
              ""
            }
            placeholder="Min"
            className="h-10 rounded-lg border border-storefront bg-white px-3 text-sm outline-none focus:border-storefront-primary"
          />

          <input
            name="attributeMax"
            type="number"
            step="any"
            defaultValue={
              searchParams.get(
                maxKey
              ) ||
              filter.maximum ||
              ""
            }
            placeholder="Max"
            className="h-10 rounded-lg border border-storefront bg-white px-3 text-sm outline-none focus:border-storefront-primary"
          />
        </div>

        <button
          type="submit"
          className="h-10 w-full rounded-storefront-button bg-storefront-primary text-xs font-bold text-white"
        >
          Apply {filter.label}
        </button>
      </form>
    </section>
  );
}
