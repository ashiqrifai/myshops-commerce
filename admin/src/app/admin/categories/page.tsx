"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  FolderTree,
  List,
  LoaderCircle,
  Search,
  Upload,
} from "lucide-react";

import {
  toast,
} from "sonner";

import CategoryHeader from "@/components/admin/categories/CategoryHeader";
import CategoryImportDialog from "@/components/admin/categories/CategoryImportDialog";
import CategoryList from "@/components/admin/categories/CategoryList";
import CategoryTree from "@/components/admin/categories/CategoryTree";

import {
  useChangeCategoryStatusMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
} from "@/store/api/categoryApi";

import type {
  Category,
} from "@/types/category";

type ViewMode =
  | "TREE"
  | "LIST";

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE";

export default function CategoriesPage() {
  const [
    viewMode,
    setViewMode,
  ] =
    useState<ViewMode>(
      "TREE"
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "ALL"
    );

  const [
    importOpen,
    setImportOpen,
  ] =
    useState(
      false
    );

  const {
    data:
      treeResponse,

    isLoading:
      isTreeLoading,

    isFetching:
      isTreeFetching,

    isError:
      isTreeError,

    refetch:
      refetchTree,
  } =
    useGetCategoryTreeQuery();

  const {
    data:
      listResponse,

    isLoading:
      isListLoading,

    isFetching:
      isListFetching,

    isError:
      isListError,

    refetch:
      refetchList,
  } =
    useGetCategoriesQuery({
      page:
        1,

      pageSize:
        200,

      search:
        search.trim() ||
        undefined,

      isActive:
        statusFilter ===
        "ALL"
          ? undefined
          : statusFilter ===
            "ACTIVE",
    });

  const [
    changeCategoryStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeCategoryStatusMutation();

  const [
    deleteCategory,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteCategoryMutation();

  const categoryTree =
    treeResponse?.data
      .categories ||
    [];

  const categoryList =
    listResponse?.data
      .categories ||
    [];

  const allTreeCategories =
    useMemo(
      () =>
        flattenCategories(
          categoryTree
        ),
      [
        categoryTree,
      ]
    );

  const filteredTree =
    useMemo(
      () =>
        filterCategoryTree(
          categoryTree,
          search,
          statusFilter
        ),
      [
        categoryTree,
        search,
        statusFilter,
      ]
    );

  const activeCount =
    allTreeCategories
      .filter(
        (
          category
        ) =>
          category.isActive
      )
      .length;

  const inactiveCount =
    allTreeCategories.length -
    activeCount;

  const handleRefresh =
    async () => {
      await Promise.all([
        refetchTree(),
        refetchList(),
      ]);
    };

  const handleStatusChange =
    async (
      category:
        Category
    ) => {
      try {
        await changeCategoryStatus({
          id:
            category.id,

          isActive:
            !category.isActive,

          includeChildren:
            false,
        }).unwrap();

        toast.success(
          category.isActive
            ? "Category deactivated."
            : "Category activated."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update category status."
          )
        );
      }
    };

  const handleDelete =
    async (
      category:
        Category
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${category.name}"?\n\nCategories containing child categories cannot be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteCategory(
          category.id
        ).unwrap();

        toast.success(
          "Category deleted successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete category."
          )
        );
      }
    };

  const isLoading =
    viewMode ===
    "TREE"
      ? isTreeLoading
      : isListLoading;

  const isError =
    viewMode ===
    "TREE"
      ? isTreeError
      : isListError;

  const isFetching =
    isTreeFetching ||
    isListFetching;

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
        <CategoryHeader
          totalCategories={
            allTreeCategories.length
          }
          rootCategories={
            categoryTree.length
          }
          activeCategories={
            activeCount
          }
          inactiveCategories={
            inactiveCount
          }
          isRefreshing={
            isFetching
          }
          onRefresh={
            handleRefresh
          }
        />

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#e1e3e5] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search
                size={
                  17
                }
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
                    event.target
                      .value
                  )
                }
                placeholder="Search by name, slug or category path"
                className="h-10 w-full rounded-lg border border-[#babfc3] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setImportOpen(
                    true
                  )
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-black"
              >
                <Upload
                  size={
                    16
                  }
                />

                Import CSV
              </button>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm outline-none focus:border-[#458fff]"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <div className="flex h-10 rounded-lg border border-[#babfc3] bg-white p-1">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode(
                      "TREE"
                    )
                  }
                  className={[
                    "flex items-center gap-2 rounded-md px-3 text-sm font-medium",

                    viewMode ===
                    "TREE"
                      ? "bg-[#303030] text-white"
                      : "text-[#5c5f62] hover:bg-[#f1f2f3]",
                  ].join(
                    " "
                  )}
                >
                  <FolderTree
                    size={
                      15
                    }
                  />

                  Tree
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewMode(
                      "LIST"
                    )
                  }
                  className={[
                    "flex items-center gap-2 rounded-md px-3 text-sm font-medium",

                    viewMode ===
                    "LIST"
                      ? "bg-[#303030] text-white"
                      : "text-[#5c5f62] hover:bg-[#f1f2f3]",
                  ].join(
                    " "
                  )}
                >
                  <List
                    size={
                      15
                    }
                  />

                  List
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle className="mx-auto animate-spin" />

                <p className="mt-3 text-sm text-[#6d7175]">
                  Loading categories...
                </p>
              </div>
            </div>
          ) : null}

          {!isLoading &&
          isError ? (
            <div className="flex min-h-[360px] items-center justify-center p-6">
              <div className="text-center">
                <h2 className="text-base font-semibold">
                  Unable to load categories
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Check the backend route and category permissions.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void handleRefresh()
                  }
                  className="mt-5 h-10 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {!isLoading &&
          !isError &&
          viewMode ===
            "TREE" ? (
            <CategoryTree
              categories={
                filteredTree
              }
              isChangingStatus={
                isChangingStatus
              }
              isDeleting={
                isDeleting
              }
              onStatusChange={
                handleStatusChange
              }
              onDelete={
                handleDelete
              }
            />
          ) : null}

          {!isLoading &&
          !isError &&
          viewMode ===
            "LIST" ? (
            <CategoryList
              categories={
                categoryList
              }
              isChangingStatus={
                isChangingStatus
              }
              isDeleting={
                isDeleting
              }
              onStatusChange={
                handleStatusChange
              }
              onDelete={
                handleDelete
              }
            />
          ) : null}
        </section>
      </div>

      <CategoryImportDialog
        open={
          importOpen
        }
        onClose={() =>
          setImportOpen(
            false
          )
        }
      />
    </main>
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

function filterCategoryTree(
  categories:
    Category[],
  search:
    string,
  statusFilter:
    StatusFilter
): Category[] {
  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  return categories.flatMap(
    (
      category
    ): Category[] => {
      const children =
        filterCategoryTree(
          category.children ||
            [],
          search,
          statusFilter
        );

      const matchesSearch =
        !normalizedSearch ||
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
        (
          category.categoryPath ||
          ""
        )
          .toLowerCase()
          .includes(
            normalizedSearch
          );

      const matchesStatus =
        statusFilter ===
          "ALL" ||
        (
          statusFilter ===
            "ACTIVE" &&
          category.isActive
        ) ||
        (
          statusFilter ===
            "INACTIVE" &&
          !category.isActive
        );

      if (
        (
          matchesSearch &&
          matchesStatus
        ) ||
        children.length >
          0
      ) {
        return [
          {
            ...category,
            children,
          },
        ];
      }

      return [];
    }
  );
}

function getApiErrorMessage(
  error:
    unknown,
  fallback:
    string
): string {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return fallback;
  }

  const apiError =
    error as {
      data?: {
        error?: {
          message?:
            string;
        };

        message?:
          string;
      };
    };

  return (
    apiError.data
      ?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}