"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CirclePlus,
  FolderKanban,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

import {
  toast,
} from "sonner";

import CollectionImportDialog from "@/components/admin/collections/CollectionImportDialog";
import CollectionList from "@/components/admin/collections/CollectionList";

import {
  useChangeCollectionStatusMutation,
  useDeleteCollectionMutation,
  useGetCollectionsQuery,
} from "@/store/api/collectionApi";

import type {
  Collection,
  CollectionType,
} from "@/types/collection";

export default function CollectionsPage() {
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
    useState<
      "ALL" |
      "ACTIVE" |
      "INACTIVE"
    >(
      "ALL"
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      "ALL" |
      CollectionType
    >(
      "ALL"
    );

  const [
    featuredFilter,
    setFeaturedFilter,
  ] =
    useState<
      "ALL" |
      "FEATURED"
    >(
      "ALL"
    );

  const [
    importOpen,
    setImportOpen,
  ] =
    useState(
      false
    );

  const queryParams =
    useMemo(
      () => ({
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

        collectionType:
          typeFilter ===
          "ALL"
            ? undefined
            : typeFilter,

        isFeatured:
          featuredFilter ===
          "FEATURED"
            ? true
            : undefined,

        sortBy:
          "sortOrder" as const,

        sortDirection:
          "ASC" as const,
      }),
      [
        search,
        statusFilter,
        typeFilter,
        featuredFilter,
      ]
    );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetCollectionsQuery(
      queryParams
    );

  const [
    changeCollectionStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeCollectionStatusMutation();

  const [
    deleteCollection,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteCollectionMutation();

  const collections =
    data?.data ||
    [];

  const activeCount =
    collections.filter(
      (
        collection
      ) =>
        collection.isActive
    ).length;

  const featuredCount =
    collections.filter(
      (
        collection
      ) =>
        collection.isFeatured
    ).length;

  const handleStatusChange =
    async (
      collection:
        Collection
    ) => {
      try {
        await changeCollectionStatus({
          id:
            collection.id,

          isActive:
            !collection.isActive,
        }).unwrap();

        toast.success(
          collection.isActive
            ? "Collection deactivated successfully."
            : "Collection activated successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to change collection status."
          )
        );
      }
    };

  const handleDelete =
    async (
      collection:
        Collection
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${collection.name}"?\n\nThis removes the collection and its product assignments. Products will not be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteCollection(
          collection.id
        ).unwrap();

        toast.success(
          "Collection deleted successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete collection."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban
                size={
                  22
                }
              />

              <h1 className="text-2xl font-semibold tracking-tight">
                Collections
              </h1>
            </div>

            <p className="mt-2 text-sm text-[#6d7175]">
              Organize products into collections for website sections, navigation, search and promotions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setImportOpen(
                  true
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] shadow-sm transition hover:bg-[#f6f6f7]"
            >
              <Upload
                size={
                  17
                }
              />

              Import CSV
            </button>

            <Link
              href="/admin/collections/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
            >
              <CirclePlus
                size={
                  17
                }
              />

              Add collection
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total collections"
            value={
              data?.pagination
                .totalItems ||
              collections.length
            }
          />

          <SummaryCard
            label="Active"
            value={
              activeCount
            }
          />

          <SummaryCard
            label="Featured"
            value={
              featuredCount
            }
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e1e3e5] p-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
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
                className="admin-input pl-10"
                placeholder="Search collections..."
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "ALL"
                    | "ACTIVE"
                    | "INACTIVE"
                )
              }
              className="admin-input xl:w-44"
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

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event.target
                    .value as
                    | "ALL"
                    | CollectionType
                )
              }
              className="admin-input xl:w-44"
            >
              <option value="ALL">
                All types
              </option>

              <option value="MANUAL">
                Manual
              </option>

              <option value="SMART">
                Smart
              </option>
            </select>

            <select
              value={
                featuredFilter
              }
              onChange={(
                event
              ) =>
                setFeaturedFilter(
                  event.target
                    .value as
                    | "ALL"
                    | "FEATURED"
                )
              }
              className="admin-input xl:w-44"
            >
              <option value="ALL">
                All collections
              </option>

              <option value="FEATURED">
                Featured only
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                void refetch()
              }
              disabled={
                isFetching
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
            >
              <RefreshCw
                size={
                  16
                }
                className={
                  isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <p className="text-sm text-[#6d7175]">
                Loading collections...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold">
                  Unable to load collections
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Check the backend route and collection permissions.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void refetch()
                  }
                  className="mt-5 h-10 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <CollectionList
              collections={
                collections
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
          )}
        </section>
      </div>

      <CollectionImportDialog
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

function SummaryCard({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6d7175]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
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
    apiError.data?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}