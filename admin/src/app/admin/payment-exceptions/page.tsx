"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  useGetPaymentExceptionByIdQuery,
  useGetPaymentExceptionsQuery,
  useMarkPaymentExceptionManualReviewMutation,
  useMarkPaymentExceptionRefundedMutation,
  useMarkPaymentExceptionRefundRequiredMutation,
  useResolvePaymentExceptionMutation,
  useRetryPaymentExceptionAllocationMutation,
} from "@/store/api/paymentExceptionApi";

import PaymentExceptionDrawer from "@/components/admin/payment-exceptions/PaymentExceptionDrawer";

import type {
  PaymentExceptionProvider,
  PaymentExceptionStatus,
} from "@/types/paymentException";

const PAGE_SIZE =
  20;

function money(
  value:
    number | string | null | undefined,
  currencyCode?:
    string | null
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

function dateTime(
  value?:
    string | null
) {
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
      dateStyle:
        "medium",
      timeStyle:
        "short",
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
        error?: {
          message?:
            unknown;
        };
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
      ?.error
      ?.message ===
      "string"
  ) {
    return apiError.data.error.message;
  }

  if (
    typeof apiError.message ===
      "string"
  ) {
    return apiError.message;
  }

  return fallback;
}

function StatusBadge({
  status,
}: {
  status:
    string;
}) {
  const classes =
    status ===
    "OPEN"
      ? "bg-red-50 text-red-700"
      : status ===
        "RETRYING"
      ? "bg-blue-50 text-blue-700"
      : status ===
        "RESOLVED"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
        "REFUND_REQUIRED"
      ? "bg-amber-50 text-amber-800"
      : status ===
        "REFUNDED"
      ? "bg-teal-50 text-teal-700"
      : "bg-violet-50 text-violet-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {status
        .replaceAll(
          "_",
          " "
        )}
    </span>
  );
}

function ProviderLabel({
  provider,
}: {
  provider:
    string;
}) {
  if (
    provider ===
    "NETWORK_INTERNATIONAL"
  ) {
    return "Network International";
  }

  if (
    provider ===
    "TAMARA"
  ) {
    return "Tamara";
  }

  if (
    provider ===
    "TABBY"
  ) {
    return "Tabby";
  }

  return provider;
}

export default function PaymentExceptionsPage() {
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
    status,
    setStatus,
  ] =
    useState<
      "" |
      PaymentExceptionStatus
    >(
      ""
    );

  const [
    provider,
    setProvider,
  ] =
    useState<
      "" |
      PaymentExceptionProvider
    >(
      ""
    );

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<
      string |
      null
    >(
      null
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
        status:
          status ||
          undefined,
        provider:
          provider ||
          undefined,
      }),
      [
        page,
        search,
        status,
        provider,
      ]
    );

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetPaymentExceptionsQuery(
      params,
      {
        skip:
          !accessToken,
      }
    );

  const {
    data:
      detailData,
    isFetching:
      detailLoading,
    refetch:
      refetchDetail,
  } =
    useGetPaymentExceptionByIdQuery(
      selectedId ||
      "",
      {
        skip:
          !accessToken ||
          !selectedId,
      }
    );

  const [
    retryAllocation,
    {
      isLoading:
        retrying,
    },
  ] =
    useRetryPaymentExceptionAllocationMutation();

  const [
    markManualReview,
    {
      isLoading:
        markingReview,
    },
  ] =
    useMarkPaymentExceptionManualReviewMutation();

  const [
    resolveException,
    {
      isLoading:
        resolving,
    },
  ] =
    useResolvePaymentExceptionMutation();

  const [
    markRefundRequired,
    {
      isLoading:
        markingRefund,
    },
  ] =
    useMarkPaymentExceptionRefundRequiredMutation();

  const [
    markRefunded,
    {
      isLoading:
        markingRefunded,
    },
  ] =
    useMarkPaymentExceptionRefundedMutation();

  const rows =
    data?.data
      ?.items ||
    [];

  const pagination =
    data?.data
      ?.pagination || {
      page:
        1,
      pageSize:
        PAGE_SIZE,
      total:
        0,
      pages:
        0,
    };

  const selectedException =
    detailData?.data ||
    rows.find(
      (
        item
      ) =>
        item.id ===
        selectedId
    ) ||
    null;

  const authLoading =
    !accessToken;

  const mutationBusy =
    retrying ||
    markingReview ||
    resolving ||
    markingRefund ||
    markingRefunded;

  const busy =
    authLoading ||
    isFetching ||
    mutationBusy;

  const refreshAll =
    async () => {
      await refetch();

      if (
        selectedId
      ) {
        await refetchDetail();
      }
    };

  const handleRetry =
    async () => {
      if (
        !selectedId
      ) {
        return;
      }

      try {
        const result =
          await retryAllocation(
            selectedId
          ).unwrap();

        const recovery =
          "recovery" in
          result.data
            ? result.data
                .recovery
            : null;

        if (
          recovery
            ?.recovered
        ) {
          toast.success(
            "Inventory allocation recovered successfully."
          );
        } else {
          toast.error(
            recovery
              ?.error ||
            "Inventory is still unavailable."
          );
        }

        await refreshAll();
      } catch (
        mutationError
      ) {
        toast.error(
          getApiErrorMessage(
            mutationError,
            "Unable to retry inventory allocation."
          )
        );
      }
    };

  const requestNote =
    (
      title:
        string,
      fallback:
        string
    ) => {
      return (
        window.prompt(
          title,
          fallback
        ) ||
        ""
      ).trim();
    };

  const handleManualReview =
    async () => {
      if (
        !selectedId
      ) {
        return;
      }

      const note =
        requestNote(
          "Manual review note",
          "Assigned for manual review."
        );

      try {
        await markManualReview({
          id:
            selectedId,
          note,
        }).unwrap();

        toast.success(
          "Marked for manual review."
        );

        await refreshAll();
      } catch (
        mutationError
      ) {
        toast.error(
          getApiErrorMessage(
            mutationError,
            "Unable to mark for manual review."
          )
        );
      }
    };

  const handleResolve =
    async () => {
      if (
        !selectedId
      ) {
        return;
      }

      const note =
        requestNote(
          "Resolution note",
          "Resolved by administrator."
        );

      try {
        await resolveException({
          id:
            selectedId,
          note,
        }).unwrap();

        toast.success(
          "Payment exception resolved."
        );

        await refreshAll();
      } catch (
        mutationError
      ) {
        toast.error(
          getApiErrorMessage(
            mutationError,
            "Unable to resolve payment exception."
          )
        );
      }
    };

  const handleRefundRequired =
    async () => {
      if (
        !selectedId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Mark this payment exception as refund required? This does not call the payment provider automatically."
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await markRefundRequired({
          id:
            selectedId,
          note:
            "Refund required. Process through the provider refund workflow.",
        }).unwrap();

        toast.success(
          "Marked as refund required."
        );

        await refreshAll();
      } catch (
        mutationError
      ) {
        toast.error(
          getApiErrorMessage(
            mutationError,
            "Unable to mark refund required."
          )
        );
      }
    };

  const handleRefunded =
    async () => {
      if (
        !selectedId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Confirm that the provider refund has already been completed?"
        );

      if (
        !confirmed
      ) {
        return;
      }

      const note =
        requestNote(
          "Refund reference / note",
          "Refund completed through payment provider."
        );

      try {
        await markRefunded({
          id:
            selectedId,
          note,
        }).unwrap();

        toast.success(
          "Exception marked as refunded."
        );

        await refreshAll();
      } catch (
        mutationError
      ) {
        toast.error(
          getApiErrorMessage(
            mutationError,
            "Unable to mark exception as refunded."
          )
        );
      }
    };

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={
                22
              }
              className="text-red-600"
            />

            <h1 className="text-2xl font-semibold text-[#202223]">
              Payment Exceptions
            </h1>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Review paid orders that could not be reallocated after inventory reservation expiry, retry stock allocation, or route them for refund and manual review.
          </p>
        </div>

        <button
          type="button"
          disabled={
            busy
          }
          onClick={() =>
            void refreshAll()
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
      </div>

      <section className="grid gap-3 rounded-xl border border-[#e1e3e5] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
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
          placeholder="Search order, email or phone..."
          className="h-10 rounded-lg border border-[#babfc3] px-3 text-sm text-[#303030] outline-none transition focus:border-[#303030] focus:ring-1 focus:ring-[#303030]"
        />

        <select
          value={
            provider
          }
          disabled={
            authLoading
          }
          onChange={(
            event
          ) => {
            setProvider(
              event.target.value as
                | ""
                | PaymentExceptionProvider
            );
            setPage(
              1
            );
          }}
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#303030] outline-none"
        >
          <option value="">
            All providers
          </option>
          <option value="NETWORK_INTERNATIONAL">
            Network International
          </option>
          <option value="TAMARA">
            Tamara
          </option>
          <option value="TABBY">
            Tabby
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
                | PaymentExceptionStatus
            );
            setPage(
              1
            );
          }}
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#303030] outline-none"
        >
          <option value="">
            All statuses
          </option>
          <option value="OPEN">
            Open
          </option>
          <option value="RETRYING">
            Retrying
          </option>
          <option value="MANUAL_REVIEW">
            Manual review
          </option>
          <option value="REFUND_REQUIRED">
            Refund required
          </option>
          <option value="REFUNDED">
            Refunded
          </option>
          <option value="RESOLVED">
            Resolved
          </option>
        </select>
      </section>

      {!authLoading &&
      error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            error,
            "Unable to load payment exceptions."
          )}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e1e3e5]">
            <thead className="bg-[#f6f6f7]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                <th className="px-4 py-3">
                  Order
                </th>
                <th className="px-4 py-3">
                  Customer
                </th>
                <th className="px-4 py-3">
                  Provider
                </th>
                <th className="px-4 py-3">
                  Amount
                </th>
                <th className="px-4 py-3">
                  Exception
                </th>
                <th className="px-4 py-3">
                  Status
                </th>
                <th className="px-4 py-3">
                  Created
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
                      8
                    }
                    className="px-4 py-12 text-center text-sm text-[#6d7175]"
                  >
                    Loading payment exceptions...
                  </td>
                </tr>
              ) : rows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      8
                    }
                    className="px-4 py-12 text-center"
                  >
                    <div className="mx-auto max-w-sm">
                      <p className="font-semibold text-[#202223]">
                        No payment exceptions found
                      </p>

                      <p className="mt-1 text-sm text-[#6d7175]">
                        Paid-after-expiry inventory conflicts will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map(
                  (
                    item
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                      className="text-sm text-[#303030] hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedId(
                              item.id
                            )
                          }
                          className="text-left"
                        >
                          <span className="block font-semibold text-[#202223]">
                            {
                              item.order
                                ?.orderNumber ||
                              "—"
                            }
                          </span>

                          <span className="mt-1 block text-xs text-[#6d7175]">
                            {
                              item.order
                                ?.paymentStatus ||
                              "—"
                            }{" "}
                            ·{" "}
                            {
                              item.order
                                ?.orderStatus ||
                              "—"
                            }
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <span className="block font-medium text-[#202223]">
                          {[
                            item.order
                              ?.customerFirstName,
                            item.order
                              ?.customerLastName,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            ) ||
                            "—"}
                        </span>

                        <span className="mt-1 block text-xs text-[#6d7175]">
                          {
                            item.order
                              ?.customerEmail ||
                            "—"
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium">
                          <ProviderLabel
                            provider={
                              item.provider
                            }
                          />
                        </span>

                        <span className="mt-1 block text-xs text-[#6d7175]">
                          {
                            item.providerState ||
                            "—"
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 font-semibold">
                        {money(
                          item.amount ??
                            item.order
                              ?.grandTotal,
                          item.currencyCode ??
                            item.order
                              ?.currencyCode
                        )}
                      </td>

                      <td className="max-w-[280px] px-4 py-4">
                        <span className="block font-medium text-red-700">
                          {
                            item.exceptionCode
                              .replaceAll(
                                "_",
                                " "
                              )
                          }
                        </span>

                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#6d7175]">
                          {
                            item.message ||
                            item.title
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />

                        {item.retryCount >
                        0 ? (
                          <span className="mt-1 block text-xs text-[#6d7175]">
                            {
                              item.retryCount
                            }{" "}
                            retry
                            {
                              item.retryCount ===
                              1
                                ? ""
                                : "ies"
                            }
                          </span>
                        ) : null}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#6d7175]">
                        {dateTime(
                          item.createdAt
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            aria-label="View exception"
                            onClick={() =>
                              setSelectedId(
                                item.id
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:bg-[#f6f6f7]"
                          >
                            <Eye
                              size={
                                15
                              }
                            />
                          </button>

                          <button
                            type="button"
                            aria-label="Retry allocation"
                            disabled={
                              mutationBusy ||
                              item.status ===
                                "REFUNDED" ||
                              item.status ===
                                "RESOLVED"
                            }
                            onClick={() => {
                              setSelectedId(
                                item.id
                              );

                              window.setTimeout(
                                () => {
                                  void handleRetry();
                                },
                                0
                              );
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RotateCcw
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
            pagination.total
          }{" "}
          payment exception
          {
            pagination.total ===
            1
              ? ""
              : "s"
          }
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white disabled:opacity-40"
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
              pagination.pages,
              1
            )}
          </span>

          <button
            type="button"
            disabled={
              busy ||
              pagination.pages ===
                0 ||
              page >=
                pagination.pages
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white disabled:opacity-40"
          >
            <ChevronRight
              size={
                16
              }
            />
          </button>
        </div>
      </div>

      <PaymentExceptionDrawer
        open={
          Boolean(
            selectedId
          )
        }
        exception={
          selectedException
        }
        loading={
          detailLoading
        }
        busy={
          mutationBusy
        }
        onClose={() =>
          setSelectedId(
            null
          )
        }
        onRetry={() =>
          void handleRetry()
        }
        onManualReview={() =>
          void handleManualReview()
        }
        onResolve={() =>
          void handleResolve()
        }
        onRefundRequired={() =>
          void handleRefundRequired()
        }
        onRefunded={() =>
          void handleRefunded()
        }
      />
    </div>
  );
}
