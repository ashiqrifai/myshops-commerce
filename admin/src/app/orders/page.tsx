"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  Search,
  ShoppingBag,
  WalletCards,
  PackageCheck,
  Clock3,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import AdminShell from "@/components/admin/AdminShell";

import {
  useGetAdminOrdersQuery,
  useGetAdminOrderSummaryQuery,
  useRetryZohoSalesOrderMutation,
} from "@/store/api/orderApi";

import {
  useAppSelector,
} from "@/store/hooks";

const money = (
  value:
    number |
    string |
    null |
    undefined,
  currency =
    "AED"
) => {
  const amount =
    Number(
      value ||
      0
    );

  return new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency,

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    amount
  );
};

const formatDate = (
  value?:
    string |
    null
) => {
  if (!value) {
    return "-";
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
    return "-";
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

const statusClass = (
  value?:
    string |
    null
) => {
  const status =
    String(
      value ||
      ""
    ).toUpperCase();

  if (
    [
      "PAID",
      "CONFIRMED",
      "FULFILLED",
      "DELIVERED",
      "PROCESSED",
    ].includes(
      status
    )
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (
    [
      "PENDING",
      "AUTHORIZED",
      "UNFULFILLED",
      "PARTIALLY_REFUNDED",
    ].includes(
      status
    )
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  if (
    [
      "FAILED",
      "DECLINED",
      "CANCELLED",
      "CANCELED",
      "REFUNDED",
    ].includes(
      status
    )
  ) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  return "bg-slate-100 text-slate-700 ring-slate-500/20";
};

function StatusBadge({
  value,
}: {
  value?:
    string |
    null;
}) {
  if (!value) {
    return (
      <span className="text-[#8c9196]">
        -
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(
        value
      )}`}
    >
      {String(
        value
      )
        .replace(
          /_/g,
          " "
        )}
    </span>
  );
}

export default function OrdersPage() {
  const router =
    useRouter();

  const {
    accessToken,
    initialized,
  } =
    useAppSelector(
      (
        state
      ) =>
        state.auth
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    orderStatus,
    setOrderStatus,
  ] =
    useState(
      ""
    );

  const [
    paymentStatus,
    setPaymentStatus,
  ] =
    useState(
      ""
    );

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState(
      ""
    );

  const [
    fulfillmentStatus,
    setFulfillmentStatus,
  ] =
    useState(
      ""
    );

  const [
    dateFrom,
    setDateFrom,
  ] =
    useState(
      ""
    );

  const [
    dateTo,
    setDateTo,
  ] =
    useState(
      ""
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const pageSize =
    25;

  useEffect(
    () => {
      if (
        initialized &&
        !accessToken
      ) {
        router.replace(
          "/login"
        );
      }
    },
    [
      initialized,
      accessToken,
      router,
    ]
  );

  /*
   * Reset paging whenever
   * filters change.
   */
  useEffect(
    () => {
      setPage(
        1
      );
    },
    [
      search,
      orderStatus,
      paymentStatus,
      paymentMethod,
      fulfillmentStatus,
      dateFrom,
      dateTo,
    ]
  );

  const queryParams =
    useMemo(
      () => ({
        page,

        pageSize,

        search:
          search.trim() ||
          undefined,

        orderStatus:
          orderStatus ||
          undefined,

        paymentStatus:
          paymentStatus ||
          undefined,

        paymentMethod:
          paymentMethod ||
          undefined,

        fulfillmentStatus:
          fulfillmentStatus ||
          undefined,

        dateFrom:
          dateFrom ||
          undefined,

        dateTo:
          dateTo ||
          undefined,

        sortBy:
          "placedAt",

        sortDirection:
          "DESC" as const,
      }),
      [
        page,
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
        fulfillmentStatus,
        dateFrom,
        dateTo,
      ]
    );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetAdminOrdersQuery(
      queryParams,
      {
        skip:
          !accessToken,
      }
    );

  const {
    data:
      summaryResponse,
    refetch:
      refetchSummary,
  } =
    useGetAdminOrderSummaryQuery(
      undefined,
      {
        skip:
          !accessToken,
      }
    );

  const [
    retryZohoSalesOrder,
    {
      isLoading:
        isRetryingZoho,
    },
  ] =
    useRetryZohoSalesOrderMutation();

  const [
    retryingOrderId,
    setRetryingOrderId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const orders =
    data?.data
      ?.orders ||
    [];

  const pagination =
    data?.data
      ?.pagination;

  const summary =
    summaryResponse
      ?.data
      ?.summary;

  const retryZoho =
    async (
      orderId:
        string
    ) => {
      try {
        setRetryingOrderId(
          orderId
        );

        const result =
          await retryZohoSalesOrder(
            orderId
          ).unwrap();

        toast.success(
          result
            ?.data
            ?.zohoSalesOrderNumber
            ? `Zoho Sales Order ${result.data.zohoSalesOrderNumber} posted successfully.`
            : "Zoho Sales Order posted successfully."
        );

        await Promise.all([
          refetch(),
          refetchSummary(),
        ]);
      } catch (
        error
      ) {
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

        toast.error(
          apiError
            ?.data
            ?.error
            ?.message ||
          apiError
            ?.data
            ?.message ||
          "Unable to re-push this order to Zoho."
        );
      } finally {
        setRetryingOrderId(
          null
        );
      }
    };

  const refresh =
    async () => {
      await Promise.all([
        refetch(),
        refetchSummary(),
      ]);
    };

  if (
    !initialized ||
    (
      !accessToken &&
      initialized
    )
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f2f3]">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#008060]" />
      </div>
    );
  }

  return (
    <AdminShell>
      <main className="min-h-screen bg-[#f1f2f3]">
        <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-7 w-7 text-[#202223]" />

                <h1 className="text-2xl font-bold text-[#202223]">
                  Orders
                </h1>
              </div>

              <p className="mt-1 text-sm text-[#6d7175]">
                Manage website orders, payments, fulfillment and refunds.
              </p>
            </div>

            <button
              type="button"
              onClick={
                refresh
              }
              disabled={
                isFetching
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] shadow-sm hover:bg-[#f6f6f7] disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>

          {/* Summary */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="Total Orders"
              value={
                summary
                  ?.totalOrders ??
                0
              }
              icon={
                ShoppingBag
              }
            />

            <SummaryCard
              title="Pending"
              value={
                summary
                  ?.pendingOrders ??
                0
              }
              icon={
                Clock3
              }
            />

            <SummaryCard
              title="Confirmed"
              value={
                summary
                  ?.confirmedOrders ??
                0
              }
              icon={
                PackageCheck
              }
            />

            <SummaryCard
              title="Paid"
              value={
                summary
                  ?.paidOrders ??
                0
              }
              icon={
                WalletCards
              }
            />

            <SummaryCard
              title="Tamara"
              value={
                summary
                  ?.tamaraOrders ??
                0
              }
              icon={
                WalletCards
              }
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white shadow-sm">
            {/* Filters */}

            <div className="border-b border-[#e1e3e5] p-4">
              <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
                <div className="relative lg:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9196]" />

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
                    placeholder="Order, customer, email or phone"
                    className="h-10 w-full rounded-lg border border-[#babfc3] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#008060] focus:ring-1 focus:ring-[#008060]"
                  />
                </div>

                <select
                  value={
                    orderStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setOrderStatus(
                      event
                        .target
                        .value
                    )
                  }
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm"
                >
                  <option value="">
                    All order statuses
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="CONFIRMED">
                    Confirmed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                  <option value="REFUNDED">
                    Refunded
                  </option>
                </select>

                <select
                  value={
                    paymentStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentStatus(
                      event
                        .target
                        .value
                    )
                  }
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm"
                >
                  <option value="">
                    All payment statuses
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="AUTHORIZED">
                    Authorized
                  </option>

                  <option value="PAID">
                    Paid
                  </option>

                  <option value="PARTIALLY_REFUNDED">
                    Partially refunded
                  </option>

                  <option value="REFUNDED">
                    Refunded
                  </option>

                  <option value="FAILED">
                    Failed
                  </option>
                </select>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentMethod(
                      event
                        .target
                        .value
                    )
                  }
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm"
                >
                  <option value="">
                    All payments
                  </option>

                  <option value="COD">
                    COD
                  </option>

                  <option value="CARD">
                    Card
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
                    fulfillmentStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setFulfillmentStatus(
                      event
                        .target
                        .value
                    )
                  }
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm"
                >
                  <option value="">
                    All fulfillment
                  </option>

                  <option value="UNFULFILLED">
                    Unfulfilled
                  </option>

                  <option value="FULFILLED">
                    Fulfilled
                  </option>
                </select>

                <input
                  type="date"
                  value={
                    dateFrom
                  }
                  onChange={(
                    event
                  ) =>
                    setDateFrom(
                      event
                        .target
                        .value
                    )
                  }
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm"
                />

                <input
                  type="date"
                  value={
                    dateTo
                  }
                  onChange={(
                    event
                  ) =>
                    setDateTo(
                      event
                        .target
                        .value
                    )
                  }
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-3 text-sm"
                />
              </div>
            </div>

            {/* Table */}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e1e3e5]">
                <thead className="bg-[#f6f6f7]">
                  <tr>
                    <TableHead>
                      Order
                    </TableHead>

                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Customer
                    </TableHead>

                    <TableHead>
                      Payment
                    </TableHead>

                    <TableHead>
                      Payment Status
                    </TableHead>

                    <TableHead>
                      Order Status
                    </TableHead>

                    <TableHead>
                      Fulfillment
                    </TableHead>

                    <TableHead>
                      Zoho
                    </TableHead>

                    <TableHead align="right">
                      Total
                    </TableHead>

                    <TableHead align="right">
                      Action
                    </TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e1e3e5] bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={
                          10
                        }
                        className="px-6 py-16 text-center"
                      >
                        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[#008060]" />

                        <p className="mt-3 text-sm text-[#6d7175]">
                          Loading orders...
                        </p>
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td
                        colSpan={
                          10
                        }
                        className="px-6 py-12 text-center"
                      >
                        <p className="font-semibold text-red-700">
                          Unable to load orders.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            refetch()
                          }
                          className="mt-3 text-sm font-semibold text-[#008060] hover:underline"
                        >
                          Try again
                        </button>
                      </td>
                    </tr>
                  ) : !orders.length ? (
                    <tr>
                      <td
                        colSpan={
                          10
                        }
                        className="px-6 py-14 text-center text-sm text-[#6d7175]"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map(
                      (
                        order
                      ) => (
                        <tr
                          key={
                            order.id
                          }
                          className="hover:bg-[#fafbfb]"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-semibold text-[#006e52] hover:underline"
                            >
                              {
                                order.orderNumber
                              }
                            </Link>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-[#6d7175]">
                            {formatDate(
                              order.placedAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-[#202223]">
                              {order.customerName ||
                                [
                                  order.customerFirstName,
                                  order.customerLastName,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " "
                                  ) ||
                                "Guest"}
                            </div>

                            <div className="mt-0.5 text-xs text-[#6d7175]">
                              {
                                order.customerEmail
                              }
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-medium">
                            {
                              order.paymentMethod
                            }
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge
                              value={
                                order.paymentStatus
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge
                              value={
                                order.orderStatus
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge
                              value={
                                order.fulfillmentStatus
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="space-y-1">
                              <StatusBadge
                                value={
                                  (
                                    order as typeof order & {
                                      zohoSyncStatus?:
                                        string | null;
                                    }
                                  ).zohoSyncStatus ||
                                  "PENDING"
                                }
                              />

                              {(
                                order as typeof order & {
                                  zohoSalesOrderNumber?:
                                    string | null;
                                }
                              ).zohoSalesOrderNumber ? (
                                <div className="text-xs text-[#6d7175]">
                                  {
                                    (
                                      order as typeof order & {
                                        zohoSalesOrderNumber?:
                                          string | null;
                                      }
                                    ).zohoSalesOrderNumber
                                  }
                                </div>
                              ) : null}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#202223]">
                            {money(
                              order.grandTotal,
                              order.currencyCode
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/orders/${order.id}`}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-semibold hover:bg-[#f6f6f7]"
                              >
                                <Eye className="h-4 w-4" />

                                View
                              </Link>

                              {(() => {
                                const zohoStatus =
                                  String(
                                    (
                                      order as typeof order & {
                                        zohoSyncStatus?:
                                          string | null;
                                      }
                                    ).zohoSyncStatus ||
                                      ""
                                  ).toUpperCase();

                                const paymentStatus =
                                  String(
                                    order.paymentStatus ||
                                      ""
                                  ).toUpperCase();

                                const orderStatus =
                                  String(
                                    order.orderStatus ||
                                      ""
                                  ).toUpperCase();

                                const zohoSalesOrderId =
                                  (
                                    order as typeof order & {
                                      zohoSalesOrderId?:
                                        string | null;
                                    }
                                  ).zohoSalesOrderId;

                                const canRepush =
                                  paymentStatus ===
                                    "PAID" &&
                                  orderStatus ===
                                    "CONFIRMED" &&
                                  !zohoSalesOrderId &&
                                  (
                                    zohoStatus ===
                                      "FAILED" ||
                                    zohoStatus ===
                                      "NOT_POSTED"
                                  );

                                return canRepush ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      retryZoho(
                                        order.id
                                      )
                                    }
                                    disabled={
                                      isRetryingZoho &&
                                      retryingOrderId ===
                                        order.id
                                    }
                                    title={
                                      (
                                        order as typeof order & {
                                          zohoSyncError?:
                                            string | null;
                                        }
                                      ).zohoSyncError ||
                                      "Re-push order to Zoho"
                                    }
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                  >
                                    <RotateCcw
                                      className={`h-4 w-4 ${
                                        isRetryingZoho &&
                                        retryingOrderId ===
                                          order.id
                                          ? "animate-spin"
                                          : ""
                                      }`}
                                    />

                                    Re-push
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}

            <div className="flex items-center justify-between border-t border-[#e1e3e5] px-5 py-4">
              <p className="text-sm text-[#6d7175]">
                {pagination
                  ? `${pagination.total} orders`
                  : "0 orders"}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={
                    !pagination
                      ?.hasPreviousPage
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
                  className="inline-flex h-9 items-center rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />

                  Previous
                </button>

                <span className="text-sm text-[#6d7175]">
                  Page{" "}
                  {pagination
                    ?.page ||
                    page}{" "}
                  of{" "}
                  {pagination
                    ?.totalPages ||
                    1}
                </span>

                <button
                  type="button"
                  disabled={
                    !pagination
                      ?.hasNextPage
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
                  className="inline-flex h-9 items-center rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium disabled:opacity-40"
                >
                  Next

                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

function SummaryCard({
  title,
  value,
  icon:
    Icon,
}: {
  title:
    string;

  value:
    number;

  icon:
    React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6d7175]">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-[#202223]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f1f8f5] text-[#008060]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
  align =
    "left",
}: {
  children:
    React.ReactNode;

  align?:
    "left" |
    "right";
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175] ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}