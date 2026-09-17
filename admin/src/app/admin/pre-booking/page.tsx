"use client";

import Link from "next/link";

import {
  CalendarDays,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useDeletePreBookingCampaignMutation,
  useGetPreBookingCampaignsQuery,
} from "@/store/api/preBookingApi";

import type {
  PreBookingCampaign,
  PreBookingCampaignStatus,
} from "@/types/preBooking";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatDate = (
  value?:
    | string
    | null
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-AE",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
};

const getStatusClass = (
  status:
    PreBookingCampaignStatus
) => {
  switch (
    status
  ) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "PAUSED":
      return "bg-amber-50 text-amber-700";

    case "CLOSED":
      return "bg-slate-100 text-slate-700";

    case "ARCHIVED":
      return "bg-red-50 text-red-700";

    case "DRAFT":
    default:
      return "bg-blue-50 text-blue-700";
  }
};

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function PreBookingCampaignsPage() {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      | PreBookingCampaignStatus
      | ""
    >(
      ""
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const params =
    useMemo(
      () => ({
        page,

        pageSize:
          30,

        search:
          search.trim() ||
          undefined,

        status:
          status ||
          undefined,

        sortBy:
          "createdAt" as const,

        sortDirection:
          "DESC" as const,
      }),
      [
        page,
        search,
        status,
      ]
    );

  const {
    data,
    isLoading,
    isFetching,
    error,
  } =
    useGetPreBookingCampaignsQuery(
      params
    );

  const [
    deleteCampaign,
    {
      isLoading:
        deleting,
    },
  ] =
    useDeletePreBookingCampaignMutation();

  const campaigns =
    data?.data ||
    [];

  const pagination =
    data?.pagination;

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const remove =
    async (
      campaign:
        PreBookingCampaign
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${campaign.name}"?\n\nCampaigns with checkout activity cannot be deleted and should be archived instead.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteCampaign(
          campaign.id
        ).unwrap();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to delete pre-booking campaign."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {/* Header */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#202223]">
            Pre-booking
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Manage pre-booking campaigns, products, bundles, allocations and launch schedules.
          </p>
        </div>

        <Link
          href="/admin/pre-booking/new"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white transition hover:bg-black"
        >
          <Plus
            size={
              17
            }
          />

          New campaign
        </Link>
      </div>

      {/* Filters */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
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
              ) => {
                setSearch(
                  event
                    .target
                    .value
                );

                setPage(
                  1
                );
              }}
              placeholder="Search campaign..."
              className="admin-input pl-10"
            />
          </div>

          <select
            value={
              status
            }
            onChange={(
              event
            ) => {
              setStatus(
                event
                  .target
                  .value as
                  | PreBookingCampaignStatus
                  | ""
              );

              setPage(
                1
              );
            }}
            className="admin-input"
          >
            <option value="">
              All statuses
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="PAUSED">
              Paused
            </option>

            <option value="CLOSED">
              Closed
            </option>

            <option value="ARCHIVED">
              Archived
            </option>
          </select>
        </div>
      </section>

      {/* Loading */}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-[#e1e3e5] bg-white">
          <div className="flex items-center gap-2 text-sm text-[#6d7175]">
            <LoaderCircle
              size={
                18
              }
              className="animate-spin"
            />

            Loading campaigns...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load pre-booking campaigns.
        </div>
      ) : campaigns.length ===
        0 ? (
        <EmptyState />
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
          {/* Desktop Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
                <tr>
                  <th className="px-5 py-3">
                    Campaign
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Booking window
                  </th>

                  <th className="px-5 py-3">
                    Products
                  </th>

                  <th className="px-5 py-3">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map(
                  (
                    campaign
                  ) => (
                    <tr
                      key={
                        campaign.id
                      }
                      className="border-t border-[#e1e3e5]"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <Link
                            href={`/admin/pre-booking/${campaign.id}/edit`}
                            className="font-semibold text-[#202223] hover:underline"
                          >
                            {
                              campaign.name
                            }
                          </Link>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6d7175]">
                            <span className="font-mono">
                              {
                                campaign.code
                              }
                            </span>

                            <span>
                              /
                              {
                                campaign.slug
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              getStatusClass(
                                campaign.status
                              ),
                            ].join(
                              " "
                            )}
                          >
                            {
                              campaign.status
                            }
                          </span>

                          {!campaign.isActive ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              Disabled
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <CalendarDays
                            size={
                              16
                            }
                            className="mt-0.5 shrink-0 text-[#8c9196]"
                          />

                          <div className="text-xs leading-5 text-[#4a4d50]">
                            <p>
                              {
                                formatDate(
                                  campaign.bookingStartAt
                                )
                              }
                            </p>

                            <p className="text-[#8c9196]">
                              to{" "}
                              {
                                formatDate(
                                  campaign.bookingEndAt
                                )
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#202223]">
                          {
                            campaign
                              .products
                              ?.length ||
                            0
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {campaign.allowCard ? (
                            <PaymentBadge>
                              Card
                            </PaymentBadge>
                          ) : null}

                          {campaign.allowTabby ? (
                            <PaymentBadge>
                              Tabby
                            </PaymentBadge>
                          ) : null}

                          {campaign.allowTamara ? (
                            <PaymentBadge>
                              Tamara
                            </PaymentBadge>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/pre-booking/${campaign.id}/edit`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4a4d50] hover:bg-[#f1f2f3]"
                            title="Edit campaign"
                          >
                            <Edit3
                              size={
                                16
                              }
                            />
                          </Link>

                          <button
                            type="button"
                            disabled={
                              deleting
                            }
                            onClick={() =>
                              remove(
                                campaign
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete campaign"
                          >
                            <Trash2
                              size={
                                16
                              }
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}

          {pagination &&
          pagination.totalPages >
            1 ? (
            <div className="flex items-center justify-between border-t border-[#e1e3e5] px-5 py-4">
              <p className="text-xs text-[#6d7175]">
                Page{" "}
                {
                  pagination.page
                }{" "}
                of{" "}
                {
                  pagination.totalPages
                }
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <=
                      1 ||
                    isFetching
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          1,
                          current -
                            1
                        )
                    )
                  }
                  className="h-9 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                      pagination.totalPages ||
                    isFetching
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current +
                        1
                    )
                  }
                  className="h-9 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Payment Badge
|--------------------------------------------------------------------------
*/

function PaymentBadge({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold text-[#4a4d50]">
      {
        children
      }
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Empty
|--------------------------------------------------------------------------
*/

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[#babfc3] bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-[#202223]">
        No pre-booking campaigns yet
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6d7175]">
        Create your first campaign, then add existing catalogue products and configure their bundles and allocation windows.
      </p>

      <Link
        href="/admin/pre-booking/new"
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white"
      >
        <Plus
          size={
            17
          }
        />

        Create campaign
      </Link>
    </div>
  );
}