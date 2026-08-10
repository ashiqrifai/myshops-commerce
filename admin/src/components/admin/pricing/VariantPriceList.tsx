"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MoreHorizontal,
  Power,
  PowerOff,
  Tag,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Pagination,
} from "@/types/priceList";

import type {
  DecimalValue,
  VariantPrice,
} from "@/types/variantPrice";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface VariantPriceListProps {
  variantPrices:
    VariantPrice[];

  pagination?:
    Pagination;

  isLoading?:
    boolean;

  isFetching?:
    boolean;

  busy?:
    boolean;

  onEdit:
    (
      variantPrice:
        VariantPrice
    ) => void;

  onDelete:
    (
      variantPrice:
        VariantPrice
    ) => void | Promise<void>;

  onStatusChange:
    (
      variantPrice:
        VariantPrice,
      isActive:
        boolean
    ) => void | Promise<void>;

  onPageChange:
    (
      page:
        number
    ) => void;

  onPageSizeChange:
    (
      pageSize:
        number
    ) => void;
}

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

function toNumber(
  value:
    | DecimalValue
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : null;
}

function formatMoney(
  value:
    | DecimalValue
    | null
    | undefined,
  currencyCode:
    string = "AED"
) {
  const numberValue =
    toNumber(value);

  if (
    numberValue === null
  ) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency:
          currencyCode,

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    ).format(
      numberValue
    );
  } catch {
    return `${currencyCode} ${numberValue.toFixed(
      2
    )}`;
  }
}

function formatQuantity(
  value:
    | DecimalValue
    | null
    | undefined
) {
  const numberValue =
    toNumber(value);

  if (
    numberValue === null
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits:
        4,
    }
  ).format(
    numberValue
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "No limit";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(date);
}

function getProductName(
  variantPrice:
    VariantPrice
) {
  return (
    variantPrice.variant
      ?.product?.name ||
    "Unnamed product"
  );
}

function getVariantName(
  variantPrice:
    VariantPrice
) {
  const variantName =
    variantPrice.variant
      ?.name?.trim();

  if (variantName) {
    return variantName;
  }

  if (
    variantPrice.variant
      ?.isDefault
  ) {
    return "Default variant";
  }

  return "Variant";
}

function getSku(
  variantPrice:
    VariantPrice
) {
  return (
    variantPrice.variant
      ?.sku ||
    "No SKU"
  );
}

function getQuantityRange(
  variantPrice:
    VariantPrice
) {
  const minimum =
    formatQuantity(
      variantPrice.minimumQuantity
    );

  const maximum =
    variantPrice.maximumQuantity ===
      null ||
    variantPrice.maximumQuantity ===
      undefined
      ? null
      : formatQuantity(
          variantPrice.maximumQuantity
        );

  if (!maximum) {
    return `${minimum}+`;
  }

  if (
    minimum === maximum
  ) {
    return minimum;
  }

  return `${minimum} – ${maximum}`;
}

function getValidityLabel(
  variantPrice:
    VariantPrice
) {
  if (
    !variantPrice.validFrom &&
    !variantPrice.validUntil
  ) {
    return "Always valid";
  }

  if (
    variantPrice.validFrom &&
    !variantPrice.validUntil
  ) {
    return `From ${formatDate(
      variantPrice.validFrom
    )}`;
  }

  if (
    !variantPrice.validFrom &&
    variantPrice.validUntil
  ) {
    return `Until ${formatDate(
      variantPrice.validUntil
    )}`;
  }

  return `${formatDate(
    variantPrice.validFrom
  )} – ${formatDate(
    variantPrice.validUntil
  )}`;
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function VariantPriceStatusBadge({
  isActive,
}: {
  isActive:
    boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-semibold",
        isActive
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isActive
            ? "bg-emerald-500"
            : "bg-neutral-400",
        ].join(" ")}
      />

      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Row Actions
|--------------------------------------------------------------------------
*/

interface RowActionsProps {
  variantPrice:
    VariantPrice;

  disabled:
    boolean;

  onEdit:
    (
      variantPrice:
        VariantPrice
    ) => void;

  onDelete:
    (
      variantPrice:
        VariantPrice
    ) => void | Promise<void>;

  onStatusChange:
    (
      variantPrice:
        VariantPrice,
      isActive:
        boolean
    ) => void | Promise<void>;
}

function RowActions({
  variantPrice,
  disabled,
  onEdit,
  onDelete,
  onStatusChange,
}: RowActionsProps) {
  const [open, setOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const handleOutsideClick =
        (
          event:
            MouseEvent
        ) => {
          if (
            containerRef.current &&
            !containerRef.current.contains(
              event.target as Node
            )
          ) {
            setOpen(false);
          }
        };

      const handleEscape =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(false);
          }
        };

      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.addEventListener(
        "keydown",
        handleEscape
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleOutsideClick
        );

        document.removeEventListener(
          "keydown",
          handleEscape
        );
      };
    },
    [open]
  );

  const handleDelete =
    async () => {
      setOpen(false);

      await onDelete(
        variantPrice
      );
    };

  const handleStatusChange =
    async () => {
      setOpen(false);

      await onStatusChange(
        variantPrice,
        !variantPrice.isActive
      );
    };

  return (
    <div
      ref={
        containerRef
      }
      className="relative flex justify-end"
    >
      <button
        type="button"
        disabled={
          disabled
        }
        onClick={() =>
          setOpen(
            (previous) =>
              !previous
          )
        }
        aria-label="Open variant price actions"
        aria-expanded={
          open
        }
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-lg",
          "border border-neutral-200 bg-white text-neutral-600",
          "transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900",
          "focus:outline-none focus:ring-2 focus:ring-neutral-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        <MoreHorizontal
          className="h-4 w-4"
        />
      </button>

      {open && (
        <div
          className={[
            "absolute right-0 top-11 z-30 w-52 overflow-hidden",
            "rounded-xl border border-neutral-200 bg-white p-1.5",
            "shadow-lg shadow-neutral-900/10",
          ].join(" ")}
        >
          <button
            type="button"
            disabled={
              disabled
            }
            onClick={() => {
              setOpen(
                false
              );

              onEdit(
                variantPrice
              );
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
          >
            <Edit3 className="h-4 w-4" />

            Edit price
          </button>

          <button
            type="button"
            disabled={
              disabled
            }
            onClick={
              handleStatusChange
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
          >
            {variantPrice.isActive ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}

            {variantPrice.isActive
              ? "Deactivate"
              : "Activate"}
          </button>

          <div className="my-1 border-t border-neutral-100" />

          <button
            type="button"
            disabled={
              disabled
            }
            onClick={
              handleDelete
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />

            Delete price
          </button>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Loading Rows
|--------------------------------------------------------------------------
*/

function LoadingRows() {
  return (
    <>
      {Array.from({
        length:
          6,
      }).map(
        (
          _item,
          index
        ) => (
          <tr
            key={
              index
            }
            className="border-b border-neutral-100 last:border-b-0"
          >
            {Array.from({
              length:
                9,
            }).map(
              (
                _cell,
                cellIndex
              ) => (
                <td
                  key={
                    cellIndex
                  }
                  className="px-4 py-4"
                >
                  <div className="h-4 animate-pulse rounded bg-neutral-200" />
                </td>
              )
            )}
          </tr>
        )
      )}
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
        <Tag className="h-6 w-6 text-neutral-500" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-neutral-900">
        No variant prices
        found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
        No prices match the
        current filters. Create
        a variant price or
        adjust the filters to
        see more records.
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function VariantPriceList({
  variantPrices,
  pagination,
  isLoading = false,
  isFetching = false,
  busy = false,
  onEdit,
  onDelete,
  onStatusChange,
  onPageChange,
  onPageSizeChange,
}: VariantPriceListProps) {
  const currentPage =
    pagination?.page ??
    1;

  const pageSize =
    pagination?.pageSize ??
    25;

  const totalItems =
    pagination?.totalItems ??
    variantPrices.length;

  const totalPages =
    pagination?.totalPages ??
    1;

  const firstRecord =
    totalItems === 0
      ? 0
      : (currentPage -
          1) *
          pageSize +
        1;

  const lastRecord =
    Math.min(
      currentPage *
        pageSize,
      totalItems
    );

  const showLoading =
    isLoading &&
    variantPrices.length ===
      0;

  const handleDelete =
    async (
      variantPrice:
        VariantPrice
    ) => {
      const confirmed =
        window.confirm(
          `Delete the price for ${getSku(
            variantPrice
          )} from ${
            variantPrice
              .priceList
              ?.name ||
            "this price list"
          }?`
        );

      if (!confirmed) {
        return;
      }

      await onDelete(
        variantPrice
      );
    };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Variant prices
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Manage product
            variant prices,
            quantity tiers and
            effective dates.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-neutral-500">
          {isFetching &&
            !isLoading && (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />

                Updating
              </span>
            )}

          <span className="rounded-lg bg-neutral-100 px-3 py-1.5 font-medium text-neutral-700">
            {totalItems.toLocaleString(
              "en-US"
            )}{" "}
            {totalItems === 1
              ? "record"
              : "records"}
          </span>
        </div>
      </div>

      {showLoading ? (
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] table-auto text-left">
            <tbody>
              <LoadingRows />
            </tbody>
          </table>
        </div>
      ) : variantPrices.length ===
        0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1380px] table-auto text-left">
            <thead className="bg-neutral-50">
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Product /
                  Variant
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Price list
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Regular
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Selling
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Discount
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Quantity
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Validity
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Priority
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Status
                </th>

                <th className="w-20 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {variantPrices.map(
                (
                  variantPrice
                ) => {
                  const currencyCode =
                    variantPrice
                      .priceList
                      ?.currencyCode ||
                    "AED";

                  const discountPercent =
                    Number(
                      variantPrice.discountPercent ||
                        0
                    );

                  return (
                    <tr
                      key={
                        variantPrice.id
                      }
                      className="border-b border-neutral-100 transition hover:bg-neutral-50/70 last:border-b-0"
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="max-w-72">
                          <p className="truncate text-sm font-semibold text-neutral-900">
                            {getProductName(
                              variantPrice
                            )}
                          </p>

                          <p className="mt-1 truncate text-sm text-neutral-600">
                            {getVariantName(
                              variantPrice
                            )}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs font-medium text-neutral-700">
                              {getSku(
                                variantPrice
                              )}
                            </span>

                            {variantPrice
                              .variant
                              ?.barcode && (
                              <span className="text-xs text-neutral-400">
                                {
                                  variantPrice
                                    .variant
                                    .barcode
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {variantPrice
                              .priceList
                              ?.name ||
                              "—"}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-xs text-neutral-500">
                              {variantPrice
                                .priceList
                                ?.code ||
                                "—"}
                            </span>

                            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                              {
                                currencyCode
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <span className="text-sm font-medium text-neutral-600">
                          {formatMoney(
                            variantPrice.regularPrice,
                            currencyCode
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <span className="text-sm font-bold text-neutral-900">
                          {formatMoney(
                            variantPrice.sellingPrice,
                            currencyCode
                          )}
                        </span>

                        {variantPrice.compareAtPrice !==
                          null &&
                          variantPrice.compareAtPrice !==
                            undefined && (
                            <p className="mt-1 text-xs text-neutral-400 line-through">
                              {formatMoney(
                                variantPrice.compareAtPrice,
                                currencyCode
                              )}
                            </p>
                          )}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        {discountPercent >
                        0 ? (
                          <div>
                            <span className="inline-flex rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                              {discountPercent.toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                              %
                            </span>

                            <p className="mt-1 text-xs text-neutral-500">
                              {formatMoney(
                                variantPrice.discountAmount,
                                currencyCode
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center align-top">
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {getQuantityRange(
                            variantPrice
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex max-w-52 items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />

                          <span className="text-sm text-neutral-600">
                            {getValidityLabel(
                              variantPrice
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center align-top">
                        <span className="inline-flex min-w-10 justify-center rounded-lg bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                          {
                            variantPrice.priority
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <VariantPriceStatusBadge
                          isActive={
                            variantPrice.isActive
                          }
                        />
                      </td>

                      <td className="px-4 py-4 align-top">
                        <RowActions
                          variantPrice={
                            variantPrice
                          }
                          disabled={
                            busy
                          }
                          onEdit={
                            onEdit
                          }
                          onDelete={
                            handleDelete
                          }
                          onStatusChange={
                            onStatusChange
                          }
                        />
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-neutral-500">
            Showing{" "}
            <span className="font-semibold text-neutral-700">
              {firstRecord}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-neutral-700">
              {lastRecord}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-neutral-700">
              {totalItems}
            </span>
          </p>

          <label className="flex items-center gap-2 text-sm text-neutral-500">
            Rows:

            <select
              value={
                pageSize
              }
              disabled={
                busy
              }
              onChange={(
                event
              ) =>
                onPageSizeChange(
                  Number(
                    event
                      .target
                      .value
                  )
                )
              }
              className="h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm font-medium text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 disabled:opacity-50"
            >
              {[
                10,
                25,
                50,
                100,
              ].map(
                (
                  size
                ) => (
                  <option
                    key={
                      size
                    }
                    value={
                      size
                    }
                  >
                    {
                      size
                    }
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm text-neutral-500">
            Page{" "}
            <span className="font-semibold text-neutral-700">
              {
                currentPage
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-neutral-700">
              {
                totalPages
              }
            </span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                busy ||
                currentPage <=
                  1
              }
              onClick={() =>
                onPageChange(
                  currentPage -
                    1
                )
              }
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />

              Previous
            </button>

            <button
              type="button"
              disabled={
                busy ||
                currentPage >=
                  totalPages
              }
              onClick={() =>
                onPageChange(
                  currentPage +
                    1
                )
              }
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next

              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}