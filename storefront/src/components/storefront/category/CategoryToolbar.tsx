"use client";

import {
  Search,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import type {
  PublicCategorySortOption,
} from "@/types/publicCategory";

import MobileFilterDrawer from "./MobileFilterDrawer";

import type {
  PublicCategoryFilter,
} from "@/types/publicCategory";

export default function CategoryToolbar({
  totalItems,
  sortOptions,
  filters,
}: {
  totalItems: number;
  sortOptions: PublicCategorySortOption[];
  filters: PublicCategoryFilter[];
}) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const update = (
    key: string,
    value: string
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    if (value) {
      params.set(
        key,
        value
      );
    } else {
      params.delete(key);
    }

    params.delete("page");

    router.push(
      `?${params.toString()}`,
      {
        scroll: false,
      }
    );
  };

  const search = (
    formData: FormData
  ) => {
    update(
      "search",
      String(
        formData.get(
          "search"
        ) || ""
      ).trim()
    );
  };

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-storefront bg-storefront-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-storefront-muted">
        <strong className="text-storefront-text">
          {totalItems}
        </strong>{" "}
        products found
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          action={search}
          className="relative min-w-0 sm:w-64"
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-storefront-muted"
          />

          <input
            name="search"
            defaultValue={
              searchParams.get(
                "search"
              ) || ""
            }
            placeholder="Search in category"
            className="h-11 w-full rounded-storefront-button border border-storefront bg-white pl-9 pr-3 text-sm outline-none focus:border-storefront-primary"
          />
        </form>

        <div className="flex gap-2">
          <MobileFilterDrawer
            filters={filters}
          />

          <select
            value={
              searchParams.get(
                "sort"
              ) ||
              "FEATURED"
            }
            onChange={(
              event
            ) =>
              update(
                "sort",
                event.target
                  .value
              )
            }
            className="h-11 flex-1 rounded-storefront-button border border-storefront bg-white px-3 text-sm font-semibold text-storefront-text outline-none focus:border-storefront-primary sm:min-w-52"
          >
            {sortOptions.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
