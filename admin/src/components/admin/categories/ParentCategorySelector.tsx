"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  FolderTree,
  LoaderCircle,
  Search,
} from "lucide-react";

import type {
  Category,
} from "@/types/category";

interface ParentCategorySelectorProps {
  categories:
    Category[];

  value:
    string | null;

  currentCategoryId?:
    string;

  isLoading?:
    boolean;

  onChange:
    (
      categoryId:
        string | null
    ) => void;
}

export default function ParentCategorySelector({
  categories,
  value,
  currentCategoryId,
  isLoading = false,
  onChange,
}: ParentCategorySelectorProps) {
  const [
    search,
    setSearch,
  ] = useState("");

  const flattenedCategories =
    useMemo(
      () =>
        flattenCategories(
          categories
        ),
      [categories]
    );

  const currentCategory =
    useMemo(() => {
      if (
        !currentCategoryId
      ) {
        return null;
      }

      return (
        flattenedCategories.find(
          (
            category
          ) =>
            category.id ===
            currentCategoryId
        ) || null
      );
    }, [
      flattenedCategories,
      currentCategoryId,
    ]);

  const unavailableIds =
    useMemo(() => {
      const ids =
        new Set<string>();

      if (
        !currentCategory
      ) {
        return ids;
      }

      ids.add(
        currentCategory.id
      );

      collectDescendantIds(
        currentCategory,
        ids
      );

      return ids;
    }, [
      currentCategory,
    ]);

  const filteredCategories =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return flattenedCategories.filter(
        (
          category
        ) => {
          if (
            unavailableIds.has(
              category.id
            )
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          return (
            category.name
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            (
              category.categoryPath ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          );
        }
      );
    }, [
      flattenedCategories,
      search,
      unavailableIds,
    ]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
      <div className="border-b border-[#e1e3e5] p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event
                  .target
                  .value
              )
            }
            placeholder="Search parent categories"
            className="h-9 w-full rounded-lg border border-[#babfc3] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
          />
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto p-2">
        <ParentOption
          name="Root category"
          path="No parent category"
          depth={0}
          selected={
            value === null
          }
          onClick={() =>
            onChange(
              null
            )
          }
        />

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#6d7175]">
            <LoaderCircle
              size={16}
              className="animate-spin"
            />

            Loading categories...
          </div>
        )}

        {!isLoading &&
          filteredCategories.map(
            (
              category
            ) => (
              <ParentOption
                key={
                  category.id
                }
                name={
                  category.name
                }
                path={
                  category.categoryPath ||
                  category.name
                }
                depth={
                  category.level
                }
                selected={
                  value ===
                  category.id
                }
                onClick={() =>
                  onChange(
                    category.id
                  )
                }
              />
            )
          )}

        {!isLoading &&
          filteredCategories.length ===
            0 &&
          search.trim() && (
            <p className="px-3 py-8 text-center text-sm text-[#6d7175]">
              No matching parent
              categories found.
            </p>
          )}
      </div>
    </div>
  );
}

interface ParentOptionProps {
  name:
    string;

  path:
    string;

  depth:
    number;

  selected:
    boolean;

  onClick:
    () => void;
}

function ParentOption({
  name,
  path,
  depth,
  selected,
  onClick,
}: ParentOptionProps) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
        selected
          ? "bg-[#eef4ff] text-[#005bd3]"
          : "text-[#202223] hover:bg-[#f6f6f7]",
      ].join(" ")}
      style={{
        paddingLeft:
          12 +
          Math.min(
            depth,
            6
          ) *
            16,
      }}
    >
      <FolderTree
        size={15}
        className="shrink-0"
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {name}
        </p>

        <p className="truncate text-xs text-[#6d7175]">
          {path}
        </p>
      </div>
    </button>
  );
}

function flattenCategories(
  categories:
    Category[]
): Category[] {
  return categories.flatMap(
    (
      category
    ): Category[] => [
      category,

      ...flattenCategories(
        category.children ||
          []
      ),
    ]
  );
}

function collectDescendantIds(
  category:
    Category,
  ids:
    Set<string>
): void {
  for (
    const child of
      category.children ||
      []
  ) {
    ids.add(
      child.id
    );

    collectDescendantIds(
      child,
      ids
    );
  }
}