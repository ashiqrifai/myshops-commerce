"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  RefreshCw,
  TicketPercent,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  useAppSelector,
} from "@/store/hooks";

import GiftVoucherImportDialog from "@/components/admin/gift-voucher-promotions/GiftVoucherImportDialog";

import {
  useChangeGiftVoucherPromotionStatusMutation,
  useDeleteGiftVoucherPromotionMutation,
  useGetGiftVoucherPromotionsQuery,
} from "@/store/api/giftVoucherPromotionApi";

import {
  useDownloadGiftVoucherImportTemplateMutation,
} from "@/store/api/giftVoucherPromotionImportApi";

import type {
  GiftVoucherDiscountType,
  GiftVoucherFundingType,
} from "@/types/giftVoucherPromotion";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PAGE_SIZE =
  20;

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

const formatDate =
  (
    value?:
      string |
      null
  ) => {
    if (
      !value
    ) {
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
      }
    ).format(
      date
    );
  };

const money =
  (
    value:
      number |
      string,
    currencyCode:
      string
  ) => {
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
  };

/*
|--------------------------------------------------------------------------
| API Error Helper
|--------------------------------------------------------------------------
*/

const apiMessage =
  (
    error:
      unknown,
    fallback:
      string
  ) => {
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
          error?:
            | {
                message?:
                  string;
              }
            | string;

          message?:
            string;
        };

        message?:
          string;
      };

    if (
      typeof apiError.data
        ?.error ===
      "string"
    ) {
      return apiError.data.error;
    }

    if (
      typeof apiError.data
        ?.error ===
        "object" &&
      apiError.data
        ?.error
        ?.message
    ) {
      return apiError.data
        .error
        .message;
    }

    return (
      apiError.data
        ?.message ||
      apiError.message ||
      fallback
    );
  };

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function GiftVoucherPromotionsPage() {
  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  const accessToken =
    useAppSelector(
      (
        state
      ) =>
        state.auth
          .accessToken
    );

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

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
      GiftVoucherDiscountType
    >(
      ""
    );

  const [
    fundingType,
    setFundingType,
  ] =
    useState<
      "" |
      GiftVoucherFundingType
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

  const [
    importOpen,
    setImportOpen,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Query Parameters
  |--------------------------------------------------------------------------
  */

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

        fundingType:
          fundingType ||
          undefined,

        isActive:
          status ===
          "ACTIVE"
            ? true
            : status ===
              "INACTIVE"
              ? false
              : undefined,

        channelCode:
          "WEBSITE" as const,

        sortBy:
          "priority",

        sortDirection:
          "ASC" as const,
      }),
      [
        page,
        search,
        discountType,
        fundingType,
        status,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | List Query
  |--------------------------------------------------------------------------
  */

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetGiftVoucherPromotionsQuery(
      params,
      {
        skip:
          !accessToken,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const [
    changeStatus,
    {
      isLoading:
        isChanging,
    },
  ] =
    useChangeGiftVoucherPromotionStatusMutation();

  const [
    deletePromotion,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteGiftVoucherPromotionMutation();

  const [
    downloadTemplate,
    {
      isLoading:
        isDownloadingTemplate,
    },
  ] =
    useDownloadGiftVoucherImportTemplateMutation();

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const promotions =
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

  const busy =
    !accessToken ||
    isFetching ||
    isChanging ||
    isDeleting ||
    isDownloadingTemplate;

  /*
  |--------------------------------------------------------------------------
  | Toggle Status
  |--------------------------------------------------------------------------
  */

  const toggle =
    async (
      id:
        string,
      isActive:
        boolean
    ) => {
      try {
        await changeStatus({
          id,

          isActive:
            !isActive,
        }).unwrap();

        toast.success(
          isActive
            ? "Promotion deactivated."
            : "Promotion activated."
        );

        await refetch();
      } catch (
        mutationError
      ) {
        toast.error(
          apiMessage(
            mutationError,
            "Unable to change promotion status."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Delete Promotion
  |--------------------------------------------------------------------------
  */

  const remove =
    async (
      id:
        string,
      code:
        string
    ) => {
      const confirmed =
        window.confirm(
          `Delete gift voucher promotion ${code}?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deletePromotion(
          id
        ).unwrap();

        toast.success(
          "Promotion deleted."
        );

        await refetch();
      } catch (
        mutationError
      ) {
        toast.error(
          apiMessage(
            mutationError,
            "Unable to delete promotion."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Download Import Template
  |--------------------------------------------------------------------------
  */

  const handleDownloadTemplate =
    async () => {
      try {
        const blob =
          await downloadTemplate()
            .unwrap();

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          url;

        anchor.download =
          "gift-voucher-promotions-import-template.csv";

        document.body
          .appendChild(
            anchor
          );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
          url
        );
      } catch (
        mutationError
      ) {
        toast.error(
          apiMessage(
            mutationError,
            "Unable to download Gift Voucher CSV template."
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
                <TicketPercent
                  size={
                    19
                  }
                />
              </div>

              <h1 className="text-2xl font-semibold text-[#202223]">
                Gift Voucher Promotions
              </h1>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage voucher value, funding source, validity and product assignments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            {/* Refresh */}

            <button
              type="button"
              onClick={() =>
                void refetch()
              }
              disabled={
                busy
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Download Template */}

            <button
              type="button"
              onClick={() =>
                void handleDownloadTemplate()
              }
              disabled={
                busy
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download
                size={
                  16
                }
              />

              {isDownloadingTemplate
                ? "Downloading..."
                : "Download Template"}
            </button>

            {/* Import CSV */}

            <button
              type="button"
              onClick={() =>
                setImportOpen(
                  true
                )
              }
              disabled={
                !accessToken
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload
                size={
                  16
                }
              />

              Import CSV
            </button>

            {/* New */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/gift-voucher-promotions/new"
                )
              }
              disabled={
                !accessToken
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus
                size={
                  16
                }
              />

              New Promotion
            </button>
          </div>
        </header>

        {/* Filters */}

        <section className="mt-6 grid gap-3 rounded-2xl border border-[#e1e3e5] bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px_180px]">

          {/* Search */}

          <input
            className="admin-input"
            value={
              search
            }
            disabled={
              !accessToken
            }
            onChange={(
              event
            ) => {
              setSearch(
                event.target
                  .value
              );

              setPage(
                1
              );
            }}
            placeholder="Search code, name or funding source..."
          />

          {/* Discount Type */}

          <select
            className="admin-input"
            value={
              discountType
            }
            disabled={
              !accessToken
            }
            onChange={(
              event
            ) => {
              setDiscountType(
                event.target
                  .value as
                  | ""
                  | GiftVoucherDiscountType
              );

              setPage(
                1
              );
            }}
          >
            <option value="">
              All discount types
            </option>

            <option value="FIXED_AMOUNT">
              Fixed amount
            </option>

            <option value="PERCENTAGE">
              Percentage
            </option>
          </select>

          {/* Funding */}

          <select
            className="admin-input"
            value={
              fundingType
            }
            disabled={
              !accessToken
            }
            onChange={(
              event
            ) => {
              setFundingType(
                event.target
                  .value as
                  | ""
                  | GiftVoucherFundingType
              );

              setPage(
                1
              );
            }}
          >
            <option value="">
              All funding
            </option>

            <option value="EXTERNAL">
              External
            </option>

            <option value="INTERNAL">
              Internal
            </option>
          </select>

          {/* Status */}

          <select
            className="admin-input"
            value={
              status
            }
            disabled={
              !accessToken
            }
            onChange={(
              event
            ) => {
              setStatus(
                event.target
                  .value as
                  | ""
                  | "ACTIVE"
                  | "INACTIVE"
              );

              setPage(
                1
              );
            }}
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

        {/* Error */}

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {apiMessage(
              error,
              "Unable to load gift voucher promotions."
            )}
          </div>
        ) : null}

        {/* Table */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e1e3e5]">

              <thead className="bg-[#f6f6f7]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">

                  <th className="px-4 py-3">
                    Promotion
                  </th>

                  <th className="px-4 py-3">
                    Voucher
                  </th>

                  <th className="px-4 py-3">
                    Funding
                  </th>

                  <th className="px-4 py-3">
                    Products
                  </th>

                  <th className="px-4 py-3">
                    Validity
                  </th>

                  <th className="px-4 py-3">
                    Priority
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

                {isLoading ? (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      className="px-4 py-10 text-center text-sm text-[#6d7175]"
                    >
                      Loading promotions...
                    </td>
                  </tr>
                ) : !promotions.length ? (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      className="px-4 py-10 text-center text-sm text-[#6d7175]"
                    >
                      No gift voucher promotions found.
                    </td>
                  </tr>
                ) : (
                  promotions.map(
                    (
                      promotion
                    ) => (
                      <tr
                        key={
                          promotion.id
                        }
                        className="text-sm text-[#303030]"
                      >

                        {/* Promotion */}

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() =>
                              router.push(
                                `/admin/gift-voucher-promotions/${promotion.id}/edit`
                              )
                            }
                          >
                            <span className="block font-semibold text-[#202223]">
                              {promotion.code}
                            </span>

                            <span className="mt-1 block text-xs text-[#6d7175]">
                              {promotion.name}
                            </span>
                          </button>
                        </td>

                        {/* Voucher */}

                        <td className="px-4 py-4">
                          <span className="font-semibold text-[#202223]">
                            {promotion.discountType ===
                            "PERCENTAGE"
                              ? `${Number(
                                  promotion.discountValue
                                )}%`
                              : money(
                                  promotion.discountValue,
                                  promotion.currencyCode
                                )}
                          </span>

                          <span className="mt-1 block text-xs text-[#6d7175]">
                            {promotion.discountType ===
                            "PERCENTAGE"
                              ? "Percentage"
                              : "Fixed amount"}
                          </span>
                        </td>

                        {/* Funding */}

                        <td className="px-4 py-4">
                          <span className="block font-medium">
                            {promotion.fundingType}
                          </span>

                          <span className="mt-1 block text-xs text-[#6d7175]">
                            {promotion.fundingSource ||
                              "—"}
                          </span>
                        </td>

                        {/* Products */}

                        <td className="px-4 py-4">
                          <span className="font-semibold">
                            {promotion.items
                              ?.length ||
                              0}
                          </span>

                          <span className="ml-1 text-xs text-[#6d7175]">
                            assignment(s)
                          </span>
                        </td>

                        {/* Validity */}

                        <td className="px-4 py-4 text-xs text-[#6d7175]">
                          <span className="block">
                            From:{" "}
                            {formatDate(
                              promotion.validFrom
                            )}
                          </span>

                          <span className="mt-1 block">
                            Until:{" "}
                            {formatDate(
                              promotion.validUntil
                            )}
                          </span>
                        </td>

                        {/* Priority */}

                        <td className="px-4 py-4">
                          {promotion.priority}
                        </td>

                        {/* Status */}

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              void toggle(
                                promotion.id,
                                promotion.isActive
                              )
                            }
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",

                              promotion.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600",
                            ].join(
                              " "
                            )}
                          >
                            {promotion.isActive
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        {/* Actions */}

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              aria-label="Edit promotion"
                              onClick={() =>
                                router.push(
                                  `/admin/gift-voucher-promotions/${promotion.id}/edit`
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
                              aria-label="Delete promotion"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                void remove(
                                  promotion.id,
                                  promotion.code
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

        {/* Pagination */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[#6d7175]">
            {pagination.totalItems} promotion(s)
          </p>

          <div className="flex items-center gap-2">

            {/* Previous */}

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
              {pagination.page}{" "}
              of{" "}
              {Math.max(
                pagination.totalPages,
                1
              )}
            </span>

            {/* Next */}

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

      {/* CSV Import Dialog */}

      <GiftVoucherImportDialog
        open={
          importOpen
        }
        onClose={() =>
          setImportOpen(
            false
          )
        }
        onImported={() =>
          void refetch()
        }
      />
    </main>
  );
}