"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CirclePlus,
  Images,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  toast,
} from "sonner";

import InstagramPostList from "@/components/admin/instagram-posts/InstagramPostList";

import {
  useChangeInstagramPostStatusMutation,
  useDeleteInstagramPostMutation,
  useGetInstagramPostsQuery,
} from "@/store/api/instagramPostApi";

import type {
  InstagramPost,
} from "@/types/instagramPost";

export default function InstagramPostsPage() {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | "ALL"
      | "ACTIVE"
      | "INACTIVE"
    >(
      "ALL"
    );

  /*
  |--------------------------------------------------------------------------
  | Query Parameters
  |--------------------------------------------------------------------------
  */

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

        sortBy:
          "sortOrder" as const,

        sortDirection:
          "ASC" as const,
      }),
      [
        search,
        statusFilter,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | API
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetInstagramPostsQuery(
      queryParams
    );

  const [
    changeStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeInstagramPostStatusMutation();

  const [
    deletePost,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteInstagramPostMutation();

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const posts =
    data?.data ||
    [];

  const activeCount =
    posts.filter(
      (
        post
      ) =>
        post.isActive
    ).length;

  const inactiveCount =
    posts.length -
    activeCount;

  /*
  |--------------------------------------------------------------------------
  | Change Status
  |--------------------------------------------------------------------------
  */

  const handleStatusChange =
    async (
      post:
        InstagramPost
    ) => {
      try {
        await changeStatus({
          id:
            post.id,

          isActive:
            !post.isActive,
        }).unwrap();

        toast.success(
          post.isActive
            ? "Instagram post deactivated successfully."
            : "Instagram post activated successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,

            "Unable to change Instagram post status."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (
      post:
        InstagramPost
    ) => {
      const confirmed =
        window.confirm(
          "Delete this Instagram gallery item?"
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deletePost(
          post.id
        ).unwrap();

        toast.success(
          "Instagram post deleted successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,

            "Unable to delete Instagram post."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">

        {/* Header */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white">
                <Images
                  size={
                    19
                  }
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Instagram Gallery
                </h1>
              </div>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7175]">
              Manage the Instagram images displayed on the MyShops homepage.
            </p>
          </div>

          <Link
            href="/admin/instagram-posts/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
          >
            <CirclePlus
              size={
                17
              }
            />

            Add Instagram post
          </Link>
        </header>

        {/* Summary */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total posts"
            value={
              data?.pagination
                .totalItems ||
              posts.length
            }
          />

          <SummaryCard
            label="Active"
            value={
              activeCount
            }
          />

          <SummaryCard
            label="Inactive"
            value={
              inactiveCount
            }
          />
        </section>

        {/* Listing */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">

          {/* Filters */}

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
                placeholder="Search Instagram posts..."
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

          {/* Loading / Error / List */}

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <p className="text-sm text-[#6d7175]">
                Loading Instagram posts...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold">
                  Unable to load Instagram posts
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Check the backend route and Instagram permissions.
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
            <InstagramPostList
              posts={
                posts
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
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| API Error Message
|--------------------------------------------------------------------------
*/

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