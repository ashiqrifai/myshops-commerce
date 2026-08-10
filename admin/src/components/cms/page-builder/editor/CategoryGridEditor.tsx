"use client";

import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  ImageIcon,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useGetCategoryTreeQuery,
} from "@/store/api/categoryApi";

import type {
  Category,
} from "@/types/category";

interface CategoryGridEditorProps {
  value: Record<string, unknown>;

  settings:
    Record<string, unknown>;

  onChange: (
    value: Record<string, unknown>
  ) => void;
}

interface FlatCategory {
  category: Category;
  depth: number;
  displayName: string;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080"
)
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "");

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `${API_BASE_URL}${
    url.startsWith("/")
      ? url
      : `/${url}`
  }`;
};

const getCategoryImageUrl = (
  category: Category
): string | null => {
  return resolveMediaUrl(
    category.thumbnailAsset
      ?.publicUrl ||
      category.imageAsset
        ?.publicUrl ||
      null
  );
};

const flattenCategoryTree = (
  categories: Category[],
  depth = 0,
  parentNames: string[] = []
): FlatCategory[] => {
  return categories.flatMap(
    (category) => {
      const categoryNames = [
        ...parentNames,
        category.name,
      ];

      return [
        {
          category,
          depth,
          displayName:
            categoryNames.join(" › "),
        },

        ...flattenCategoryTree(
          category.children || [],
          depth + 1,
          categoryNames
        ),
      ];
    }
  );
};

const getStringValue = (
  value: unknown,
  fallback = ""
): string => {
  return typeof value === "string"
    ? value
    : fallback;
};

export default function CategoryGridEditor({
  value,
  settings,
  onChange,
}: CategoryGridEditorProps) {
  const [search, setSearch] =
    useState("");

  const [
    pickerExpanded,
    setPickerExpanded,
  ] = useState(true);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCategoryTreeQuery({
    isActive: true,
  });

  const allCategories =
    useMemo(() => {
      return flattenCategoryTree(
        data?.data.categories || []
      );
    }, [data]);

  const categoryMap =
    useMemo(() => {
      return new Map(
        allCategories.map(
          ({ category }) => [
            category.id,
            category,
          ]
        )
      );
    }, [allCategories]);

  const categoryIds =
    useMemo(() => {
      if (
        !Array.isArray(
          value.categoryIds
        )
      ) {
        return [];
      }

      return value.categoryIds.filter(
        (
          categoryId
        ): categoryId is string =>
          typeof categoryId ===
            "string" &&
          Boolean(categoryId.trim())
      );
    }, [value.categoryIds]);

  const selectedIdSet =
    useMemo(
      () => new Set(categoryIds),
      [categoryIds]
    );

  const filteredCategories =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return allCategories;
      }

      return allCategories.filter(
        ({
          category,
          displayName,
        }) => {
          return (
            category.name
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            category.slug
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            displayName
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          );
        }
      );
    }, [
      allCategories,
      search,
    ]);

  const selectedCategories =
    useMemo(() => {
      return categoryIds.map(
        (categoryId) => ({
          id: categoryId,
          category:
            categoryMap.get(
              categoryId
            ) || null,
        })
      );
    }, [
      categoryIds,
      categoryMap,
    ]);

  const sourceType =
    getStringValue(
      settings.sourceType,
      "MANUAL"
    )
      .trim()
      .toUpperCase();

  const updateField = (
    field: string,
    fieldValue: unknown
  ) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleToggleCategory = (
    categoryId: string
  ) => {
    if (
      selectedIdSet.has(
        categoryId
      )
    ) {
      updateField(
        "categoryIds",
        categoryIds.filter(
          (id) =>
            id !== categoryId
        )
      );

      return;
    }

    updateField(
      "categoryIds",
      [
        ...categoryIds,
        categoryId,
      ]
    );
  };

  const handleRemoveCategory = (
    categoryId: string
  ) => {
    updateField(
      "categoryIds",
      categoryIds.filter(
        (id) => id !== categoryId
      )
    );
  };

  const moveCategory = (
    index: number,
    direction: -1 | 1
  ) => {
    const targetIndex =
      index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >=
        categoryIds.length
    ) {
      return;
    }

    const reordered = [
      ...categoryIds,
    ];

    const [movedId] =
      reordered.splice(
        index,
        1
      );

    reordered.splice(
      targetIndex,
      0,
      movedId
    );

    updateField(
      "categoryIds",
      reordered
    );
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <h2 className="text-base font-semibold">
          Section content
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Select and arrange the
          categories displayed in this
          section.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="category-grid-title"
              className="mb-1.5 block text-sm font-medium"
            >
              Title
            </label>

            <input
              id="category-grid-title"
              value={getStringValue(
                value.title
              )}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              className="admin-input"
              placeholder="Shop by Category"
            />
          </div>

          <div>
            <label
              htmlFor="category-grid-subtitle"
              className="mb-1.5 block text-sm font-medium"
            >
              Subtitle
            </label>

            <input
              id="category-grid-subtitle"
              value={getStringValue(
                value.subtitle
              )}
              onChange={(event) =>
                updateField(
                  "subtitle",
                  event.target.value
                )
              }
              className="admin-input"
              placeholder="Browse our popular categories"
            />
          </div>
        </div>

        {sourceType !== "MANUAL" ? (
          <div className="rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
            <p className="text-sm font-semibold">
              Dynamic category source
            </p>

            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              This section currently uses
              the{" "}
              <span className="font-mono font-semibold">
                {sourceType}
              </span>{" "}
              source. Manual category
              selection is available when
              Source Type is set to{" "}
              <span className="font-mono font-semibold">
                MANUAL
              </span>
              .
            </p>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    Selected categories
                  </h3>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Categories are rendered
                    in the order shown
                    below.
                  </p>
                </div>

                <span className="rounded-full bg-[#f1f2f3] px-3 py-1 text-xs font-semibold text-[#5c5f62]">
                  {categoryIds.length}{" "}
                  selected
                </span>
              </div>

              {selectedCategories.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7] px-5 py-8 text-center">
                  <ImageIcon
                    size={25}
                    className="mx-auto text-[#8c9196]"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    No categories selected
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Select categories from
                    the list below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCategories.map(
                    (
                      {
                        id,
                        category,
                      },
                      index
                    ) => {
                      const imageUrl =
                        category
                          ? getCategoryImageUrl(
                              category
                            )
                          : null;

                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] bg-white p-3"
                        >
                          <GripVertical
                            size={18}
                            className="shrink-0 text-[#8c9196]"
                          />

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  category
                                    ?.name ||
                                  "Category"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon
                                size={19}
                                className="text-[#8c9196]"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {category
                                ?.name ||
                                "Category unavailable"}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-[#6d7175]">
                              {category
                                ?.categoryPath ||
                                category
                                  ?.slug ||
                                id}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveCategory(
                                  index,
                                  -1
                                )
                              }
                              disabled={
                                index === 0
                              }
                              aria-label="Move category up"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d2d5d8] bg-white text-[#5c5f62] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ChevronDown
                                size={16}
                                className="rotate-180"
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveCategory(
                                  index,
                                  1
                                )
                              }
                              disabled={
                                index ===
                                selectedCategories.length -
                                  1
                              }
                              aria-label="Move category down"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d2d5d8] bg-white text-[#5c5f62] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ChevronDown
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCategory(
                                  id
                                )
                              }
                              aria-label="Remove category"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#e1e3e5]">
              <button
                type="button"
                onClick={() =>
                  setPickerExpanded(
                    (current) =>
                      !current
                  )
                }
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">
                    Choose categories
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Search active
                    categories and select
                    multiple records.
                  </p>
                </div>

                {pickerExpanded ? (
                  <ChevronDown
                    size={18}
                  />
                ) : (
                  <ChevronRight
                    size={18}
                  />
                )}
              </button>

              {pickerExpanded ? (
                <div className="border-t border-[#e1e3e5] p-4">
                  <div className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                    />

                    <input
                      value={search}
                      onChange={(
                        event
                      ) =>
                        setSearch(
                          event.target
                            .value
                        )
                      }
                      className="admin-input pl-10"
                      placeholder="Search categories..."
                    />
                  </div>

                  {isLoading ||
                  isFetching ? (
                    <div className="flex min-h-40 items-center justify-center">
                      <LoaderCircle className="animate-spin text-[#6d7175]" />
                    </div>
                  ) : error ? (
                    <div className="py-8 text-center">
                      <p className="text-sm font-semibold text-red-700">
                        Unable to load
                        categories.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          refetch()
                        }
                        className="mt-3 rounded-lg border border-[#babfc3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f6f6f7]"
                      >
                        Try again
                      </button>
                    </div>
                  ) : filteredCategories.length ===
                    0 ? (
                    <div className="py-8 text-center text-sm text-[#6d7175]">
                      No categories found.
                    </div>
                  ) : (
                    <div className="mt-3 max-h-[420px] space-y-1 overflow-y-auto pr-1">
                      {filteredCategories.map(
                        ({
                          category,
                          depth,
                          displayName,
                        }) => {
                          const selected =
                            selectedIdSet.has(
                              category.id
                            );

                          const imageUrl =
                            getCategoryImageUrl(
                              category
                            );

                          return (
                            <button
                              key={
                                category.id
                              }
                              type="button"
                              onClick={() =>
                                handleToggleCategory(
                                  category.id
                                )
                              }
                              className={[
                                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition",

                                selected
                                  ? "border-[#303030] bg-[#f1f2f3]"
                                  : "border-transparent hover:border-[#d2d5d8] hover:bg-[#f6f6f7]",
                              ].join(
                                " "
                              )}
                              style={{
                                paddingLeft:
                                  12 +
                                  depth *
                                    18,
                              }}
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                                {imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      category.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={17}
                                    className="text-[#8c9196]"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {
                                    category.name
                                  }
                                </p>

                                <p className="mt-0.5 truncate text-xs text-[#6d7175]">
                                  {
                                    displayName
                                  }
                                </p>
                              </div>

                              <span
                                className={[
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold",

                                  selected
                                    ? "border-[#303030] bg-[#303030] text-white"
                                    : "border-[#babfc3] bg-white text-transparent",
                                ].join(
                                  " "
                                )}
                              >
                                ✓
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}