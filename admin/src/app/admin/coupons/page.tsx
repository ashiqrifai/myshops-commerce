"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  useChangeCouponStatusMutation,
  useDeleteCouponMutation,
  useGetCouponsQuery,
} from "@/store/api/couponApi";

import type {
  CouponDiscountType,
} from "@/types/coupon";

const PAGE_SIZE = 20;

function money(
  value:
    number | string | null,
  currencyCode:
    string
) {
  return new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency:
        currencyCode ||
        "AED",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ||
      0
    )
  );
}

function discountLabel(
  discountType:
    CouponDiscountType,
  discountValue:
    number | string,
  currencyCode:
    string
) {
  if (
    discountType ===
    "FREE_SHIPPING"
  ) {
    return "Free shipping";
  }

  if (
    discountType ===
    "PERCENTAGE"
  ) {
    return `${Number(
      discountValue
    )}%`;
  }

  return money(
    discountValue,
    currencyCode
  );
}

function formatDate(
  value:
    string | null
) {
  if (
    !value
  ) {
    return "No limit";
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
      dateStyle:
        "medium",
    }
  ).format(
    date
  );
}

function getApiErrorMessage(
  error:
    unknown,
  fallback:
    string
) {
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
        message?:
          unknown;

        error?:
          unknown;
      };

      message?:
        unknown;
    };

  if (
    typeof apiError.data
      ?.message ===
    "string"
  ) {
    return apiError.data.message;
  }

  if (
    typeof apiError.data
      ?.error ===
    "string"
  ) {
    return apiError.data.error;
  }

  if (
    typeof apiError.message ===
    "string"
  ) {
    return apiError.message;
  }

  return fallback;
}

export default function CouponsPage() {
  const router =
    useRouter();

  /*
   * Important:
   * wait until the Admin access token
   * has been restored into Redux before
   * firing the coupons API request.
   */
  const accessToken =
    useAppSelector(
      (
        state
      ) =>
        state.auth
          .accessToken
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    discountType,
    setDiscountType,
  ] =
    useState<
      "" |
      CouponDiscountType
    >(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      "" |
      "ACTIVE" |
      "INACTIVE"
    >(
      ""
    );

  const params =
    useMemo(
      () => ({
        page,

        pageSize:
          PAGE_SIZE,

        search:
          search.trim() ||
          undefined,

        discountType:
          discountType ||
          undefined,

        isActive:
          status ===
          "ACTIVE"
            ? true
            : status ===
              "INACTIVE"
            ? false
            : undefined,
      }),
      [
        page,
        search,
        discountType,
        status,
      ]
    );

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetCouponsQuery(
      params,
      {
        skip:
          !accessToken,
      }
    );

  const [
    changeCouponStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeCouponStatusMutation();

  const [
    deleteCoupon,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteCouponMutation();

  const coupons =
    data?.data ||
    [];

  const pagination =
    data?.pagination || {
      page:
        1,

      pageSize:
        PAGE_SIZE,

      totalItems:
        0,

      totalPages:
        0,
    };

  const authLoading =
    !accessToken;

  const busy =
    authLoading ||
    isFetching ||
    isChangingStatus ||
    isDeleting;

  const handleRefresh =
    async () => {
      if (
        !accessToken
      ) {
        return;
      }

      await refetch();
    };

  const handleStatusChange =
    async (
      id:
        string,
      isActive:
        boolean
    ) => {
      if (
        !accessToken
      ) {
        return;
      }

      try {
        await changeCouponStatus({
          id,

          isActive:
            !isActive,
        }).unwrap();

        await refetch();
      } catch (
        mutationError
      ) {
        window.alert(
          getApiErrorMessage(
            mutationError,
            "Unable to change coupon status."
          )
        );
      }
    };

  const handleDelete =
    async (
      id:
        string,
      code:
        string
    ) => {
      if (
        !accessToken
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete coupon ${code}?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteCoupon(
          id
        ).unwrap();

        await refetch();
      } catch (
        mutationError
      ) {
        window.alert(
          getApiErrorMessage(
            mutationError,
            "Unable to delete coupon."
          )
        );
      }
    };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#202223]">
            Coupons
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Manage storefront coupon codes, discount values, usage limits, and validity periods.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={() =>
              void handleRefresh()
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={
                16
              }
            />

            Refresh
          </button>

          <button
            type="button"
            disabled={
              authLoading
            }
            onClick={() =>
              router.push(
                "/admin/coupons/new"
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus
              size={
                16
              }
            />

            New Coupon
          </button>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-[#e1e3e5] bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px_180px]">
        <input
          value={
            search
          }
          disabled={
            authLoading
          }
          onChange={(
            event
          ) => {
            setSearch(
              event.target.value
            );

            setPage(
              1
            );
          }}
          placeholder="Search coupon code or name..."
          className="h-10 rounded-lg border border-[#babfc3] px-3 text-sm text-[#303030] outline-none transition focus:border-[#303030] focus:ring-1 focus:ring-[#303030] disabled:bg-[#f6f6f7] disabled:opacity-60"
        />

        <select
          value={
            discountType
          }
          disabled={
            authLoading
          }
          onChange={(
            event
          ) => {
            setDiscountType(
              event.target.value as
                | ""
                | CouponDiscountType
            );

            setPage(
              1
            );
          }}
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#303030] outline-none disabled:bg-[#f6f6f7] disabled:opacity-60"
        >
          <option value="">
            All discount types
          </option>

          <option value="PERCENTAGE">
            Percentage
          </option>

          <option value="FIXED">
            Fixed amount
          </option>

          <option value="FREE_SHIPPING">
            Free shipping
          </option>
        </select>

        <select
          value={
            status
          }
          disabled={
            authLoading
          }
          onChange={(
            event
          ) => {
            setStatus(
              event.target.value as
                | ""
                | "ACTIVE"
                | "INACTIVE"
            );

            setPage(
              1
            );
          }}
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#303030] outline-none disabled:bg-[#f6f6f7] disabled:opacity-60"
        >
          <option value="">
            All statuses
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>
      </section>

      {!authLoading &&
      error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            error,
            "Unable to load coupons."
          )}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e1e3e5]">
            <thead className="bg-[#f6f6f7]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                <th className="px-4 py-3">
                  Coupon
                </th>

                <th className="px-4 py-3">
                  Discount
                </th>

                <th className="px-4 py-3">
                  Minimum
                </th>

                <th className="px-4 py-3">
                  Usage
                </th>

                <th className="px-4 py-3">
                  Validity
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e1e3e5]">
              {authLoading ||
              isLoading ? (
                <tr>
                  <td
                    colSpan={
                      7
                    }
                    className="px-4 py-10 text-center text-sm text-[#6d7175]"
                  >
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      7
                    }
                    className="px-4 py-10 text-center text-sm text-[#6d7175]"
                  >
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map(
                  (
                    coupon
                  ) => (
                    <tr
                      key={
                        coupon.id
                      }
                      className="text-sm text-[#303030]"
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/coupons/${coupon.id}/edit`
                            )
                          }
                          className="text-left"
                        >
                          <span className="block font-semibold text-[#202223]">
                            {
                              coupon.code
                            }
                          </span>

                          <span className="mt-1 block text-xs text-[#6d7175]">
                            {
                              coupon.name
                            }
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-semibold">
                          {discountLabel(
                            coupon.discountType,
                            coupon.discountValue,
                            coupon.currencyCode
                          )}
                        </span>

                        {coupon.maximumDiscountAmount !==
                          null &&
                        coupon.discountType ===
                          "PERCENTAGE" ? (
                          <span className="mt-1 block text-xs text-[#6d7175]">
                            Max{" "}
                            {money(
                              coupon.maximumDiscountAmount,
                              coupon.currencyCode
                            )}
                          </span>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        {Number(
                          coupon.minimumOrderAmount ||
                            0
                        ) >
                        0
                          ? money(
                              coupon.minimumOrderAmount,
                              coupon.currencyCode
                            )
                          : "None"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="block">
                          Total:{" "}
                          {
                            coupon.usageLimit ??
                            "Unlimited"
                          }
                        </span>

                        <span className="mt-1 block text-xs text-[#6d7175]">
                          Per customer:{" "}
                          {
                            coupon.perCustomerLimit ??
                            "Unlimited"
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#6d7175]">
                        <span className="block">
                          From:{" "}
                          {formatDate(
                            coupon.validFrom
                          )}
                        </span>

                        <span className="mt-1 block">
                          Until:{" "}
                          {formatDate(
                            coupon.validUntil
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            void handleStatusChange(
                              coupon.id,
                              coupon.isActive
                            )
                          }
                          className={[
                            "rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",

                            coupon.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600",
                          ].join(
                            " "
                          )}
                        >
                          {coupon.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            aria-label="Edit coupon"
                            onClick={() =>
                              router.push(
                                `/admin/coupons/${coupon.id}/edit`
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:bg-[#f6f6f7]"
                          >
                            <Pencil
                              size={
                                15
                              }
                            />
                          </button>

                          <button
                            type="button"
                            aria-label="Delete coupon"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              void handleDelete(
                                coupon.id,
                                coupon.code
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2
                              size={
                                15
                              }
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#6d7175]">
          {
            pagination.totalItems
          }{" "}
          coupons
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              busy ||
              page <=
                1
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft
              size={
                16
              }
            />
          </button>

          <span className="text-sm text-[#303030]">
            Page{" "}
            {
              pagination.page
            }{" "}
            of{" "}
            {Math.max(
              pagination.totalPages,
              1
            )}
          </span>

          <button
            type="button"
            disabled={
              busy ||
              pagination.totalPages ===
                0 ||
              page >=
                pagination.totalPages
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight
              size={
                16
              }
            />
          </button>
        </div>
      </div>
    </div>
  );
}