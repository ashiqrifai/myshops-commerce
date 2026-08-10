"use client";

import {
  useMemo,
} from "react";

import {
  CalendarDays,
  Copy,
  Pencil,
  Power,
  Star,
  Trash2,
} from "lucide-react";

import {
  DataTable,
} from "@/components/admin/data-table";

import type {
  DataTableColumn,
} from "@/components/admin/data-table";

import {
  DataTableActions,
  StatusBadge,
  TypeBadge,
} from "@/components/admin/common";

import type {
  PriceList,
} from "@/types/priceList";

interface PriceListListProps {
  priceLists:
    PriceList[];

  isLoading?:
    boolean;

  isFetching?:
    boolean;

  isChangingStatus?:
    boolean;

  isDeleting?:
    boolean;

  onEdit: (
    priceList: PriceList
  ) => void;

  onDuplicate?: (
    priceList: PriceList
  ) => void;

  onSetDefault?: (
    priceList: PriceList
  ) => void;

  onStatusChange: (
    priceList: PriceList
  ) => void;

  onDelete: (
    priceList: PriceList
  ) => void;
}

export default function PriceListList({
  priceLists,
  isLoading = false,
  isFetching = false,
  isChangingStatus = false,
  isDeleting = false,
  onEdit,
  onDuplicate,
  onSetDefault,
  onStatusChange,
  onDelete,
}: PriceListListProps) {
  const columns =
    useMemo<
      DataTableColumn<PriceList>[]
    >(
      () => [
        {
          id: "code",

          header:
            "Code",

          accessor:
            "code",

          sortable:
            true,

          minWidth:
            "150px",

          cell:
            (
              priceList
            ) => (
              <div>
                <p className="font-semibold text-[#202223]">
                  {
                    priceList.code
                  }
                </p>

                {priceList.isDefault && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <Star
                      size={12}
                      fill="currentColor"
                    />

                    Default list
                  </span>
                )}
              </div>
            ),
        },

        {
          id: "name",

          header:
            "Name",

          accessor:
            "name",

          sortable:
            true,

          minWidth:
            "220px",

          cell:
            (
              priceList
            ) => (
              <div className="max-w-[300px]">
                <p className="font-medium text-[#303030]">
                  {
                    priceList.name
                  }
                </p>

                <p className="mt-1 line-clamp-1 text-xs text-[#8c9196]">
                  {priceList.description ||
                    "No description"}
                </p>
              </div>
            ),
        },

        {
          id: "priceListType",

          header:
            "Type",

          accessor:
            "priceListType",

          sortable:
            true,

          minWidth:
            "155px",

          cell:
            (
              priceList
            ) => (
              <TypeBadge
                type={
                  priceList.priceListType
                }
                compact
              />
            ),
        },

        {
          id: "channelCode",

          header:
            "Channel",

          accessor:
            "channelCode",

          sortable:
            true,

          minWidth:
            "145px",

          cell:
            (
              priceList
            ) => (
              <ChannelBadge
                channelCode={
                  priceList.channelCode
                }
              />
            ),
        },

        {
          id: "currencyCode",

          header:
            "Currency",

          accessor:
            "currencyCode",

          sortable:
            true,

          align:
            "center",

          minWidth:
            "110px",

          cell:
            (
              priceList
            ) => (
              <span className="inline-flex rounded-lg bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold text-[#45484c]">
                {
                  priceList.currencyCode
                }
              </span>
            ),
        },

        {
          id: "priority",

          header:
            "Priority",

          accessor:
            "priority",

          sortable:
            true,

          align:
            "center",

          minWidth:
            "100px",

          cell:
            (
              priceList
            ) => (
              <span className="font-medium tabular-nums">
                {
                  priceList.priority
                }
              </span>
            ),
        },

        {
          id: "validity",

          header:
            "Validity",

          sortValue:
            (
              priceList
            ) =>
              priceList.validFrom
                ? new Date(
                    priceList.validFrom
                  )
                : null,

          sortable:
            true,

          minWidth:
            "210px",

          cell:
            (
              priceList
            ) => (
              <ValidityDisplay
                validFrom={
                  priceList.validFrom
                }
                validUntil={
                  priceList.validUntil
                }
              />
            ),
        },

        {
          id: "tax",

          header:
            "Tax",

          align:
            "center",

          minWidth:
            "125px",

          cell:
            (
              priceList
            ) => (
              <span
                className={[
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                  priceList.isTaxInclusive
                    ? "bg-blue-50 text-blue-700 ring-blue-200"
                    : "bg-[#f1f2f3] text-[#61666b] ring-[#d8dadd]",
                ].join(" ")}
              >
                {priceList.isTaxInclusive
                  ? "Inclusive"
                  : "Exclusive"}
              </span>
            ),
        },

        {
          id: "status",

          header:
            "Status",

          accessor:
            "isActive",

          sortable:
            true,

          align:
            "center",

          minWidth:
            "120px",

          cell:
            (
              priceList
            ) => (
              <StatusBadge
                isActive={
                  priceList.isActive
                }
                compact
              />
            ),
        },

        {
          id: "updatedAt",

          header:
            "Updated",

          accessor:
            "updatedAt",

          sortable:
            true,

          minWidth:
            "150px",

          sortValue:
            (
              priceList
            ) =>
              new Date(
                priceList.updatedAt
              ),

          cell:
            (
              priceList
            ) => (
              <div>
                <p className="text-sm text-[#45484c]">
                  {formatDate(
                    priceList.updatedAt
                  )}
                </p>

                {priceList.updatedByUser && (
                  <p className="mt-1 text-xs text-[#8c9196]">
                    by{" "}
                    {getUserName(
                      priceList.updatedByUser
                    )}
                  </p>
                )}
              </div>
            ),
        },

        {
          id: "actions",

          header:
            "",

          align:
            "right",

          width:
            "70px",

          minWidth:
            "70px",

          cell:
            (
              priceList
            ) => (
              <div
                onClick={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <DataTableActions
                  disabled={
                    isChangingStatus ||
                    isDeleting
                  }
                  actions={[
                    {
                      key:
                        "edit",

                      label:
                        "Edit price list",

                      icon:
                        Pencil,

                      onClick:
                        () =>
                          onEdit(
                            priceList
                          ),
                    },

                    {
                      key:
                        "duplicate",

                      label:
                        "Duplicate",

                      icon:
                        Copy,

                      hidden:
                        !onDuplicate,

                      onClick:
                        () =>
                          onDuplicate?.(
                            priceList
                          ),
                    },

                    {
                      key:
                        "default",

                      label:
                        "Set as default",

                      icon:
                        Star,

                      hidden:
                        priceList.isDefault ||
                        !onSetDefault,

                      disabled:
                        !priceList.isActive,

                      onClick:
                        () =>
                          onSetDefault?.(
                            priceList
                          ),
                    },

                    {
                      key:
                        "status",

                      label:
                        priceList.isActive
                          ? "Deactivate"
                          : "Activate",

                      icon:
                        Power,

                      disabled:
                        priceList.isDefault &&
                        priceList.isActive,

                      onClick:
                        () =>
                          onStatusChange(
                            priceList
                          ),
                    },

                    {
                      key:
                        "delete",

                      label:
                        "Delete",

                      icon:
                        Trash2,

                      destructive:
                        true,

                      separatorBefore:
                        true,

                      disabled:
                        priceList.isDefault,

                      onClick:
                        () =>
                          onDelete(
                            priceList
                          ),
                    },
                  ]}
                />
              </div>
            ),
        },
      ],
      [
        isChangingStatus,
        isDeleting,
        onDelete,
        onDuplicate,
        onEdit,
        onSetDefault,
        onStatusChange,
      ]
    );

  return (
    <DataTable
      rows={
        priceLists
      }
      columns={
        columns
      }
      getRowId={(
        priceList
      ) =>
        priceList.id
      }
      isLoading={
        isLoading
      }
      isFetching={
        isFetching
      }
      initialSort={{
        columnId:
          "priority",

        direction:
          "ASC",
      }}
      emptyTitle="No price lists found"
      emptyDescription="Create a price list or adjust the current filters to see pricing records."
      loadingText="Loading price lists..."
      showPagination={
        false
      }
      stickyHeader
    />
  );
}

function ChannelBadge({
  channelCode,
}: {
  channelCode:
    string;
}) {
  const normalized =
    String(
      channelCode ||
        "ALL"
    )
      .trim()
      .toUpperCase();

  const label =
    formatLabel(
      normalized
    );

  const className =
    getChannelClassName(
      normalized
    );

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function ValidityDisplay({
  validFrom,
  validUntil,
}: {
  validFrom:
    string | null;

  validUntil:
    string | null;
}) {
  const state =
    getValidityState({
      validFrom,
      validUntil,
    });

  return (
    <div className="flex items-start gap-2">
      <CalendarDays
        size={15}
        className="mt-0.5 shrink-0 text-[#8c9196]"
      />

      <div>
        <p className="whitespace-nowrap text-sm text-[#45484c]">
          {formatValidityRange(
            validFrom,
            validUntil
          )}
        </p>

        <span
          className={[
            "mt-1 inline-flex text-xs font-medium",
            state.className,
          ].join(" ")}
        >
          {
            state.label
          }
        </span>
      </div>
    </div>
  );
}

function getValidityState({
  validFrom,
  validUntil,
}: {
  validFrom:
    string | null;

  validUntil:
    string | null;
}) {
  const now =
    Date.now();

  const fromTime =
    validFrom
      ? new Date(
          validFrom
        ).getTime()
      : null;

  const untilTime =
    validUntil
      ? new Date(
          validUntil
        ).getTime()
      : null;

  if (
    fromTime !== null &&
    fromTime > now
  ) {
    return {
      label:
        "Scheduled",

      className:
        "text-blue-700",
    };
  }

  if (
    untilTime !== null &&
    untilTime < now
  ) {
    return {
      label:
        "Expired",

      className:
        "text-red-600",
    };
  }

  if (
    !validFrom &&
    !validUntil
  ) {
    return {
      label:
        "No date limit",

      className:
        "text-[#6d7175]",
    };
  }

  return {
    label:
      "Currently valid",

    className:
      "text-emerald-700",
  };
}

function formatValidityRange(
  validFrom:
    string | null,
  validUntil:
    string | null
) {
  if (
    !validFrom &&
    !validUntil
  ) {
    return "Always";
  }

  if (
    validFrom &&
    validUntil
  ) {
    return `${formatDate(
      validFrom
    )} – ${formatDate(
      validUntil
    )}`;
  }

  if (validFrom) {
    return `From ${formatDate(
      validFrom
    )}`;
  }

  return `Until ${formatDate(
    validUntil as string
  )}`;
}

function formatDate(
  value:
    string
) {
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
    }
  ).format(
    date
  );
}

function getUserName(
  user: {
    firstName:
      string;

    lastName:
      string;
  }
) {
  return [
    user.firstName,
    user.lastName,
  ]
    .filter(
      Boolean
    )
    .join(" ");
}

function getChannelClassName(
  channelCode:
    string
) {
  switch (
    channelCode
  ) {
    case "WEBSITE":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "KIOSK":
      return "bg-violet-50 text-violet-700 ring-violet-200";

    case "POS":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "MOBILE_APP":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";

    case "MARKETPLACE":
      return "bg-orange-50 text-orange-700 ring-orange-200";

    case "ALL":
      return "bg-[#f1f2f3] text-[#45484c] ring-[#d8dadd]";

    default:
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  }
}

function formatLabel(
  value:
    string
) {
  return value
    .toLowerCase()
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
}