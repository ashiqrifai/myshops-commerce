"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Badge,
  CirclePlus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

import {
  toast,
} from "sonner";

import BrandImportDialog from "@/components/admin/brands/BrandImportDialog";
import BrandList from "@/components/admin/brands/BrandList";

import {
  useChangeBrandStatusMutation,
  useDeleteBrandMutation,
  useGetBrandsQuery,
} from "@/store/api/brandApi";

import type {
  Brand,
} from "@/types/brand";

export default function BrandsPage() {
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
    useGetBrandsQuery(
      queryParams
    );

  const [
    changeBrandStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeBrandStatusMutation();

  const [
    deleteBrand,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteBrandMutation();

  const brands =
    data?.data ||
    [];

  const activeCount =
    brands.filter(
      (
        brand
      ) =>
        brand.isActive
    ).length;

  const featuredCount =
    brands.filter(
      (
        brand
      ) =>
        brand.isFeatured
    ).length;

  const handleStatusChange =
    async (
      brand:
        Brand
    ) => {
      try {
        await changeBrandStatus({
          id:
            brand.id,

          isActive:
            !brand.isActive,
        }).unwrap();

        toast.success(
          brand.isActive
            ? "Brand deactivated successfully."
            : "Brand activated successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to change brand status."
          )
        );
      }
    };

  const handleDelete =
    async (
      brand:
        Brand
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${brand.name}"?\n\nBrands assigned to products cannot be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteBrand(
          brand.id
        ).unwrap();

        toast.success(
          "Brand deleted successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete brand."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white">
                <Badge
                  size={
                    19
                  }
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Brands
                </h1>
              </div>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7175]">
              Manage the manufacturers and brand identities used across website and kiosk products.
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
              href="/admin/brands/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
            >
              <CirclePlus
                size={
                  17
                }
              />

              Add brand
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total brands"
            value={
              data?.pagination
                .totalItems ||
              brands.length
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
          <div className="flex flex-col gap-3 border-b border-[#e1e3e5] p-4 lg:flex-row lg:items-center">
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
                placeholder="Search brands..."
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
              className="admin-input lg:w-44"
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
              className="admin-input lg:w-44"
            >
              <option value="ALL">
                All brands
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
                Loading brands...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold">
                  Unable to load brands
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Check the backend route and brand permissions.
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
            <BrandList
              brands={
                brands
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

      <BrandImportDialog
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
      <p className="text-sm font-medium text-[#6d7175]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#202223]">
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
    apiError.data
      ?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}