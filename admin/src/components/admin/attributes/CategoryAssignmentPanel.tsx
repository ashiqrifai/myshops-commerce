"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Search,
  X,
} from "lucide-react";

import {
  useGetCategoryTreeQuery,
} from "@/store/api/categoryApi";

import type {
  Category,
} from "@/types/category";

import type {
  CategoryAssignmentFormValue,
} from "@/types/attribute";

interface CategoryAssignmentPanelProps {
  assignments:
    CategoryAssignmentFormValue[];

  defaultRequired:
    boolean;

  defaultFilterable:
    boolean;

  defaultVariantDefining:
    boolean;

  onChange: (
    assignments:
      CategoryAssignmentFormValue[]
  ) => void;
}

export default function CategoryAssignmentPanel({
  assignments,
  defaultRequired,
  defaultFilterable,
  defaultVariantDefining,
  onChange,
}: CategoryAssignmentPanelProps) {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    expandedIds,
    setExpandedIds,
  ] = useState<Set<string>>(
    new Set()
  );

  /*
  |--------------------------------------------------------------------------
  | Load category tree
  |--------------------------------------------------------------------------
  |
  | Your existing category module already provides:
  |
  | GET /categories/tree
  |
  | Response:
  |
  | {
  |   success: true,
  |   data: {
  |     categories: [...]
  |   }
  | }
  |
  */

  const {
    data:
      categoryTreeResponse,

    isLoading,

    isFetching,

    isError,

    refetch,
  } =
    useGetCategoryTreeQuery({
      isActive:
        true,
    });

  const categories =
    useMemo(
      () =>
        categoryTreeResponse
          ?.data
          ?.categories ||
        [],
      [
        categoryTreeResponse,
      ]
    );

  const filteredCategories =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (
        !normalizedSearch
      ) {
        return categories;
      }

      return filterCategoryTree(
        categories,
        normalizedSearch
      );
    }, [
      categories,
      search,
    ]);

  const assignmentMap =
    useMemo(
      () =>
        new Map(
          assignments.map(
            (
              assignment
            ) => [
              assignment
                .categoryId,

              assignment,
            ]
          )
        ),
      [
        assignments,
      ]
    );

  const flatCategories =
    useMemo(
      () =>
        flattenCategories(
          categories
        ),
      [
        categories,
      ]
    );

  const categoryMap =
    useMemo(
      () =>
        new Map(
          flatCategories.map(
            (
              category
            ) => [
              category.id,
              category,
            ]
          )
        ),
      [
        flatCategories,
      ]
    );

  const toggleExpanded = (
    categoryId:
      string
  ) => {
    setExpandedIds(
      (
        current
      ) => {
        const next =
          new Set(
            current
          );

        if (
          next.has(
            categoryId
          )
        ) {
          next.delete(
            categoryId
          );
        } else {
          next.add(
            categoryId
          );
        }

        return next;
      }
    );
  };

  const toggleCategory = (
    category:
      Category
  ) => {
    const existing =
      assignmentMap.get(
        category.id
      );

    if (existing) {
      onChange(
        assignments.filter(
          (
            assignment
          ) =>
            assignment
              .categoryId !==
            category.id
        )
      );

      return;
    }

    onChange([
      ...assignments,

      {
        categoryId:
          category.id,

        isRequired:
          defaultRequired,

        isFilterable:
          defaultFilterable,

        isVariantDefining:
          defaultVariantDefining,

        displayOrder:
          assignments.length,

        isActive:
          true,
      },
    ]);
  };

  const updateAssignment = <
    K extends keyof CategoryAssignmentFormValue
  >(
    categoryId:
      string,

    field:
      K,

    value:
      CategoryAssignmentFormValue[K]
  ) => {
    onChange(
      assignments.map(
        (
          assignment
        ) =>
          assignment
            .categoryId ===
          categoryId
            ? {
                ...assignment,

                [field]:
                  value,
              }
            : assignment
      )
    );
  };

  const clearAssignments =
    () => {
      onChange([]);
    };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            Category
            assignment
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#6d7175]">
            Select where this
            attribute is
            available.
            Category-level
            behaviour can
            override the
            attribute
            defaults.
          </p>
        </div>

        {assignments.length >
          0 && (
          <button
            type="button"
            onClick={
              clearAssignments
            }
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
          >
            <X
              size={15}
            />

            Clear all
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(420px,1.15fr)]">
        {/*
        |--------------------------------------------------------------------------
        | Category tree
        |--------------------------------------------------------------------------
        */}

        <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
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
                className="admin-input pl-9"
                placeholder="Search categories..."
              />
            </div>
          </div>

          <div className="max-h-[470px] overflow-y-auto p-2">
            {isLoading ||
            isFetching ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-[#6d7175]">
                Loading
                categories...
              </div>
            ) : isError ? (
              <div className="flex min-h-48 flex-col items-center justify-center p-4 text-center">
                <p className="text-sm font-medium text-[#a23b2a]">
                  Unable to load
                  categories.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    refetch()
                  }
                  className="mt-3 rounded-lg border border-[#babfc3] bg-white px-3 py-2 text-xs font-medium hover:bg-[#f6f6f7]"
                >
                  Try again
                </button>
              </div>
            ) : filteredCategories
                .length ===
              0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <FolderTree
                  size={24}
                  className="text-[#8c9196]"
                />

                <p className="mt-2 text-sm font-medium">
                  No categories
                  found
                </p>
              </div>
            ) : (
              filteredCategories.map(
                (
                  category
                ) => (
                  <CategoryTreeRow
                    key={
                      category.id
                    }
                    category={
                      category
                    }
                    depth={
                      0
                    }
                    assignmentMap={
                      assignmentMap
                    }
                    expandedIds={
                      expandedIds
                    }
                    searchActive={Boolean(
                      search.trim()
                    )}
                    onToggleExpanded={
                      toggleExpanded
                    }
                    onToggleCategory={
                      toggleCategory
                    }
                  />
                )
              )
            )}
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Selected category configuration
        |--------------------------------------------------------------------------
        */}

        <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
          <div className="flex items-center justify-between border-b border-[#e1e3e5] bg-[#fafbfb] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                Selected
                categories
              </p>

              <p className="mt-0.5 text-xs text-[#6d7175]">
                {
                  assignments.length
                }{" "}
                assigned
              </p>
            </div>
          </div>

          {assignments.length ===
          0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
              <FolderTree
                size={28}
                className="text-[#8c9196]"
              />

              <p className="mt-3 text-sm font-semibold">
                No categories
                assigned
              </p>

              <p className="mt-1 max-w-xs text-xs leading-5 text-[#6d7175]">
                The attribute can
                still exist
                globally. Assign
                categories when
                you are ready to
                expose it to
                products.
              </p>
            </div>
          ) : (
            <div className="max-h-[470px] overflow-y-auto">
              {assignments.map(
                (
                  assignment,
                  index
                ) => {
                  const category =
                    categoryMap.get(
                      assignment
                        .categoryId
                    );

                  return (
                    <div
                      key={
                        assignment
                          .categoryId
                      }
                      className="border-b border-[#e1e3e5] p-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {category
                              ?.name ||
                              assignment
                                .categoryId}
                          </p>

                          <p className="mt-1 truncate font-mono text-[11px] text-[#8c9196]">
                            {category
                              ?.slug ||
                              assignment
                                .categoryId}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              category
                            ) {
                              toggleCategory(
                                category
                              );
                            } else {
                              onChange(
                                assignments.filter(
                                  (
                                    item
                                  ) =>
                                    item.categoryId !==
                                    assignment.categoryId
                                )
                              );
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5]"
                          aria-label="Remove category assignment"
                        >
                          <X
                            size={
                              15
                            }
                          />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <AssignmentToggle
                          label="Required"
                          checked={
                            assignment
                              .isRequired
                          }
                          onChange={(
                            checked
                          ) =>
                            updateAssignment(
                              assignment
                                .categoryId,

                              "isRequired",

                              checked
                            )
                          }
                        />

                        <AssignmentToggle
                          label="Filterable"
                          checked={
                            assignment
                              .isFilterable
                          }
                          onChange={(
                            checked
                          ) =>
                            updateAssignment(
                              assignment
                                .categoryId,

                              "isFilterable",

                              checked
                            )
                          }
                        />

                        <AssignmentToggle
                          label="Variant defining"
                          checked={
                            assignment
                              .isVariantDefining
                          }
                          onChange={(
                            checked
                          ) =>
                            updateAssignment(
                              assignment
                                .categoryId,

                              "isVariantDefining",

                              checked
                            )
                          }
                        />

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-[#5c5f62]">
                            Display
                            order
                          </label>

                          <input
                            type="number"
                            min={
                              0
                            }
                            value={
                              assignment
                                .displayOrder
                            }
                            onChange={(
                              event
                            ) =>
                              updateAssignment(
                                assignment
                                  .categoryId,

                                "displayOrder",

                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            }
                            className="admin-input"
                          />
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] text-[#8c9196]">
                        Assignment{" "}
                        {index +
                          1}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CategoryTreeRowProps {
  category:
    Category;

  depth:
    number;

  assignmentMap:
    Map<
      string,
      CategoryAssignmentFormValue
    >;

  expandedIds:
    Set<string>;

  searchActive:
    boolean;

  onToggleExpanded: (
    categoryId:
      string
  ) => void;

  onToggleCategory: (
    category:
      Category
  ) => void;
}

function CategoryTreeRow({
  category,
  depth,
  assignmentMap,
  expandedIds,
  searchActive,
  onToggleExpanded,
  onToggleCategory,
}: CategoryTreeRowProps) {
  const children =
    category.children ||
    [];

  const hasChildren =
    children.length >
    0;

  const isExpanded =
    searchActive ||
    expandedIds.has(
      category.id
    );

  const isSelected =
    assignmentMap.has(
      category.id
    );

  return (
    <div>
      <div
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-[#f6f6f7]"
        style={{
          paddingLeft: `${
            8 +
            depth * 18
          }px`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (
              hasChildren
            ) {
              onToggleExpanded(
                category.id
              );
            }
          }}
          disabled={
            !hasChildren
          }
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#6d7175] hover:bg-white disabled:opacity-20"
          aria-label={
            isExpanded
              ? "Collapse category"
              : "Expand category"
          }
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown
                size={15}
              />
            ) : (
              <ChevronRight
                size={15}
              />
            ))}
        </button>

        <button
          type="button"
          onClick={() =>
            onToggleCategory(
              category
            )
          }
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className={[
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border",

              isSelected
                ? "border-[#303030] bg-[#303030] text-white"
                : "border-[#babfc3] bg-white",
            ].join(
              " "
            )}
          >
            {isSelected && (
              <Check
                size={13}
              />
            )}
          </span>

          <span className="truncate text-sm">
            {
              category.name
            }
          </span>

          {!category.isActive && (
            <span className="rounded-full bg-[#fbeae5] px-2 py-0.5 text-[10px] font-medium text-[#a23b2a]">
              Inactive
            </span>
          )}
        </button>
      </div>

      {hasChildren &&
        isExpanded &&
        children.map(
          (
            child
          ) => (
            <CategoryTreeRow
              key={
                child.id
              }
              category={
                child
              }
              depth={
                depth +
                1
              }
              assignmentMap={
                assignmentMap
              }
              expandedIds={
                expandedIds
              }
              searchActive={
                searchActive
              }
              onToggleExpanded={
                onToggleExpanded
              }
              onToggleCategory={
                onToggleCategory
              }
            />
          )
        )}
    </div>
  );
}

interface AssignmentToggleProps {
  label:
    string;

  checked:
    boolean;

  onChange: (
    checked:
      boolean
  ) => void;
}

function AssignmentToggle({
  label,
  checked,
  onChange,
}: AssignmentToggleProps) {
  return (
    <div className="flex h-10 items-center justify-between rounded-lg border border-[#e1e3e5] bg-[#fafbfb] px-3">
      <span className="text-xs font-medium">
        {label}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={
          checked
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className={[
          "relative h-5 w-9 rounded-full transition",

          checked
            ? "bg-[#303030]"
            : "bg-[#babfc3]",
        ].join(
          " "
        )}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",

            checked
              ? "left-[18px]"
              : "left-0.5",
          ].join(
            " "
          )}
        />
      </button>
    </div>
  );
}

function flattenCategories(
  categories:
    Category[]
): Category[] {
  return categories.flatMap(
    (
      category
    ) => [
      category,

      ...flattenCategories(
        category.children ||
          []
      ),
    ]
  );
}

function filterCategoryTree(
  categories:
    Category[],

  search:
    string
): Category[] {
  return categories.reduce<
    Category[]
  >(
    (
      result,
      category
    ) => {
      const filteredChildren =
        filterCategoryTree(
          category.children ||
            [],

          search
        );

      const matches =
        category.name
          .toLowerCase()
          .includes(
            search
          ) ||
        Boolean(
          category.slug
            ?.toLowerCase()
            .includes(
              search
            )
        );

      if (
        matches ||
        filteredChildren.length >
          0
      ) {
        result.push({
          ...category,

          children:
            filteredChildren,
        });
      }

      return result;
    },
    []
  );
}