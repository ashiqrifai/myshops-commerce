"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
} from "lucide-react";

export type DataTableAlign =
  | "left"
  | "center"
  | "right";

export type DataTableSortDirection =
  | "ASC"
  | "DESC";

export interface DataTableColumn<
  TRow
> {
  id: string;

  header:
    React.ReactNode;

  accessor?:
    keyof TRow;

  cell?: (
    row: TRow,
    rowIndex: number
  ) => React.ReactNode;

  sortable?:
    boolean;

  sortValue?: (
    row: TRow
  ) =>
    | string
    | number
    | boolean
    | Date
    | null
    | undefined;

  align?:
    DataTableAlign;

  width?:
    string;

  minWidth?:
    string;

  className?:
    string;

  headerClassName?:
    string;

  hidden?:
    boolean;
}

export interface DataTablePagination {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;
}

interface DataTableProps<
  TRow
> {
  rows:
    TRow[];

  columns:
    DataTableColumn<TRow>[];

  getRowId: (
    row: TRow
  ) => string;

  isLoading?:
    boolean;

  isFetching?:
    boolean;

  emptyTitle?:
    string;

  emptyDescription?:
    string;

  loadingText?:
    string;

  className?:
    string;

  rowClassName?: (
    row: TRow,
    rowIndex: number
  ) => string;

  onRowClick?: (
    row: TRow
  ) => void;

  stickyHeader?:
    boolean;

  enableSelection?:
    boolean;

  selectedRowIds?:
    string[];

  onSelectionChange?: (
    selectedIds: string[]
  ) => void;

  initialSort?: {
    columnId:
      string;

    direction:
      DataTableSortDirection;
  };

  sortColumnId?:
    string;

  sortDirection?:
    DataTableSortDirection;

  onSortChange?: (
    columnId: string,
    direction:
      DataTableSortDirection
  ) => void;

  serverSorting?:
    boolean;

  pagination?:
    DataTablePagination;

  onPageChange?: (
    page: number
  ) => void;

  onPageSizeChange?: (
    pageSize: number
  ) => void;

  pageSizeOptions?:
    number[];

  showPagination?:
    boolean;
}

export default function DataTable<
  TRow
>({
  rows,
  columns,
  getRowId,
  isLoading = false,
  isFetching = false,
  emptyTitle =
    "No records found",
  emptyDescription =
    "There are no records matching the current filters.",
  loadingText =
    "Loading records...",
  className = "",
  rowClassName,
  onRowClick,
  stickyHeader = true,
  enableSelection = false,
  selectedRowIds,
  onSelectionChange,
  initialSort,
  sortColumnId:
    controlledSortColumnId,
  sortDirection:
    controlledSortDirection,
  onSortChange,
  serverSorting = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [
    10,
    20,
    30,
    50,
    100,
    200,
  ],
  showPagination = true,
}: DataTableProps<TRow>) {
  const [
    internalSelectedIds,
    setInternalSelectedIds,
  ] = useState<string[]>(
    []
  );

  const [
    internalSort,
    setInternalSort,
  ] = useState<{
    columnId:
      string | null;

    direction:
      DataTableSortDirection;
  }>({
    columnId:
      initialSort
        ?.columnId ||
      null,

    direction:
      initialSort
        ?.direction ||
      "ASC",
  });

  const visibleColumns =
    useMemo(
      () =>
        columns.filter(
          (column) =>
            !column.hidden
        ),
      [
        columns,
      ]
    );

  const currentSortColumnId =
    controlledSortColumnId !==
    undefined
      ? controlledSortColumnId
      : internalSort.columnId;

  const currentSortDirection =
    controlledSortDirection !==
    undefined
      ? controlledSortDirection
      : internalSort.direction;

  const currentSelectedIds =
    selectedRowIds ??
    internalSelectedIds;

  const selectedSet =
    useMemo(
      () =>
        new Set(
          currentSelectedIds
        ),
      [
        currentSelectedIds,
      ]
    );

  const sortedRows =
    useMemo(() => {
      if (
        serverSorting ||
        !currentSortColumnId
      ) {
        return rows;
      }

      const column =
        visibleColumns.find(
          (item) =>
            item.id ===
            currentSortColumnId
        );

      if (
        !column ||
        !column.sortable
      ) {
        return rows;
      }

      return [
        ...rows,
      ].sort(
        (
          firstRow,
          secondRow
        ) => {
          const firstValue =
            getColumnSortValue(
              column,
              firstRow
            );

          const secondValue =
            getColumnSortValue(
              column,
              secondRow
            );

          const comparison =
            compareValues(
              firstValue,
              secondValue
            );

          return currentSortDirection ===
            "ASC"
            ? comparison
            : comparison *
                -1;
        }
      );
    }, [
      rows,
      visibleColumns,
      currentSortColumnId,
      currentSortDirection,
      serverSorting,
    ]);

  const visibleRowIds =
    useMemo(
      () =>
        sortedRows.map(
          getRowId
        ),
      [
        sortedRows,
        getRowId,
      ]
    );

  const selectedVisibleCount =
    visibleRowIds.filter(
      (id) =>
        selectedSet.has(id)
    ).length;

  const allVisibleSelected =
    visibleRowIds.length >
      0 &&
    selectedVisibleCount ===
      visibleRowIds.length;

  const someVisibleSelected =
    selectedVisibleCount >
      0 &&
    !allVisibleSelected;

  const updateSelection = (
    nextIds:
      string[]
  ) => {
    if (
      selectedRowIds ===
      undefined
    ) {
      setInternalSelectedIds(
        nextIds
      );
    }

    onSelectionChange?.(
      nextIds
    );
  };

  const toggleRow = (
    rowId:
      string
  ) => {
    const next =
      new Set(
        currentSelectedIds
      );

    if (
      next.has(
        rowId
      )
    ) {
      next.delete(
        rowId
      );
    } else {
      next.add(
        rowId
      );
    }

    updateSelection(
      Array.from(
        next
      )
    );
  };

  const toggleAllVisible =
    () => {
      const next =
        new Set(
          currentSelectedIds
        );

      if (
        allVisibleSelected
      ) {
        visibleRowIds.forEach(
          (id) =>
            next.delete(
              id
            )
        );
      } else {
        visibleRowIds.forEach(
          (id) =>
            next.add(
              id
            )
        );
      }

      updateSelection(
        Array.from(
          next
        )
      );
    };

  const handleSort = (
    column:
      DataTableColumn<TRow>
  ) => {
    if (
      !column.sortable
    ) {
      return;
    }

    const nextDirection:
      DataTableSortDirection =
      currentSortColumnId ===
        column.id &&
      currentSortDirection ===
        "ASC"
        ? "DESC"
        : "ASC";

    if (
      controlledSortColumnId ===
      undefined
    ) {
      setInternalSort({
        columnId:
          column.id,

        direction:
          nextDirection,
      });
    }

    onSortChange?.(
      column.id,
      nextDirection
    );
  };

  const totalColumnCount =
    visibleColumns.length +
    (
      enableSelection
        ? 1
        : 0
    );

  return (
    <div
      className={[
        "w-full",
        className,
      ].join(" ")}
    >
      <div className="relative w-full overflow-x-auto">
        {isFetching &&
          !isLoading && (
            <div className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-[#e1e3e5]">
              <div className="h-full w-1/3 animate-pulse bg-[#303030]" />
            </div>
          )}

        <table className="w-full border-collapse text-left">
          <thead
            className={[
              "z-20 bg-[#f7f7f8]",
              stickyHeader
                ? "sticky top-0"
                : "",
            ].join(" ")}
          >
            <tr className="border-b border-[#e1e3e5]">
              {enableSelection && (
                <th className="w-12 px-4 py-3">
                  <SelectionCheckbox
                    checked={
                      allVisibleSelected
                    }
                    indeterminate={
                      someVisibleSelected
                    }
                    onChange={
                      toggleAllVisible
                    }
                    ariaLabel="Select all visible rows"
                  />
                </th>
              )}

              {visibleColumns.map(
                (
                  column
                ) => (
                  <th
                    key={
                      column.id
                    }
                    style={{
                      width:
                        column.width,

                      minWidth:
                        column.minWidth,
                    }}
                    className={[
                      "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#6d7175]",
                      getAlignmentClass(
                        column.align
                      ),
                      column
                        .headerClassName ||
                        "",
                    ].join(" ")}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSort(
                            column
                          )
                        }
                        className={[
                          "inline-flex items-center gap-1.5 rounded-md outline-none hover:text-[#202223] focus-visible:ring-2 focus-visible:ring-[#303030]",
                          column.align ===
                          "right"
                            ? "ml-auto"
                            : "",
                          column.align ===
                          "center"
                            ? "mx-auto"
                            : "",
                        ].join(" ")}
                      >
                        <span>
                          {
                            column.header
                          }
                        </span>

                        <SortIcon
                          active={
                            currentSortColumnId ===
                            column.id
                          }
                          direction={
                            currentSortDirection
                          }
                        />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e1e3e5] bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={
                    totalColumnCount
                  }
                  className="h-[320px] px-6 py-12"
                >
                  <LoadingState
                    text={
                      loadingText
                    }
                  />
                </td>
              </tr>
            ) : sortedRows.length ===
              0 ? (
              <tr>
                <td
                  colSpan={
                    totalColumnCount
                  }
                  className="h-[320px] px-6 py-12"
                >
                  <EmptyState
                    title={
                      emptyTitle
                    }
                    description={
                      emptyDescription
                    }
                  />
                </td>
              </tr>
            ) : (
              sortedRows.map(
                (
                  row,
                  rowIndex
                ) => {
                  const rowId =
                    getRowId(
                      row
                    );

                  const isSelected =
                    selectedSet.has(
                      rowId
                    );

                  return (
                    <tr
                      key={
                        rowId
                      }
                      onClick={() =>
                        onRowClick?.(
                          row
                        )
                      }
                      className={[
                        "transition",
                        onRowClick
                          ? "cursor-pointer"
                          : "",
                        isSelected
                          ? "bg-[#f4f6f8]"
                          : "hover:bg-[#fafafa]",
                        rowClassName?.(
                          row,
                          rowIndex
                        ) ||
                          "",
                      ].join(" ")}
                    >
                      {enableSelection && (
                        <td
                          className="w-12 px-4 py-3"
                          onClick={(
                            event
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          <SelectionCheckbox
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              toggleRow(
                                rowId
                              )
                            }
                            ariaLabel={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      )}

                      {visibleColumns.map(
                        (
                          column
                        ) => (
                          <td
                            key={
                              column.id
                            }
                            style={{
                              width:
                                column.width,

                              minWidth:
                                column.minWidth,
                            }}
                            className={[
                              "px-4 py-3.5 text-sm text-[#303030]",
                              getAlignmentClass(
                                column.align
                              ),
                              column.className ||
                                "",
                            ].join(" ")}
                          >
                            {renderCell(
                              column,
                              row,
                              rowIndex
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      {showPagination &&
        pagination && (
          <DataTablePaginationControls
            pagination={
              pagination
            }
            pageSizeOptions={
              pageSizeOptions
            }
            onPageChange={
              onPageChange
            }
            onPageSizeChange={
              onPageSizeChange
            }
            disabled={
              isLoading ||
              isFetching
            }
          />
        )}
    </div>
  );
}

function renderCell<
  TRow
>(
  column:
    DataTableColumn<TRow>,
  row:
    TRow,
  rowIndex:
    number
) {
  if (
    column.cell
  ) {
    return column.cell(
      row,
      rowIndex
    );
  }

  if (
    column.accessor
  ) {
    const value =
      row[
        column.accessor
      ];

    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return (
        <span className="text-[#8c9196]">
          —
        </span>
      );
    }

    return String(
      value
    );
  }

  return (
    <span className="text-[#8c9196]">
      —
    </span>
  );
}

function getColumnSortValue<
  TRow
>(
  column:
    DataTableColumn<TRow>,
  row:
    TRow
) {
  if (
    column.sortValue
  ) {
    return column.sortValue(
      row
    );
  }

  if (
    column.accessor
  ) {
    return row[
      column.accessor
    ] as
      | string
      | number
      | boolean
      | Date
      | null
      | undefined;
  }

  return null;
}

function compareValues(
  firstValue:
    | string
    | number
    | boolean
    | Date
    | null
    | undefined,
  secondValue:
    | string
    | number
    | boolean
    | Date
    | null
    | undefined
) {
  if (
    firstValue ===
      secondValue
  ) {
    return 0;
  }

  if (
    firstValue ===
      null ||
    firstValue ===
      undefined
  ) {
    return 1;
  }

  if (
    secondValue ===
      null ||
    secondValue ===
      undefined
  ) {
    return -1;
  }

  if (
    firstValue instanceof
      Date &&
    secondValue instanceof
      Date
  ) {
    return (
      firstValue.getTime() -
      secondValue.getTime()
    );
  }

  if (
    typeof firstValue ===
      "number" &&
    typeof secondValue ===
      "number"
  ) {
    return (
      firstValue -
      secondValue
    );
  }

  if (
    typeof firstValue ===
      "boolean" &&
    typeof secondValue ===
      "boolean"
  ) {
    return Number(
      firstValue
    ) -
      Number(
        secondValue
      );
  }

  return String(
    firstValue
  ).localeCompare(
    String(
      secondValue
    ),
    undefined,
    {
      numeric:
        true,

      sensitivity:
        "base",
    }
  );
}

function getAlignmentClass(
  align:
    DataTableAlign =
      "left"
) {
  switch (align) {
    case "center":
      return "text-center";

    case "right":
      return "text-right";

    default:
      return "text-left";
  }
}

function SortIcon({
  active,
  direction,
}: {
  active:
    boolean;

  direction:
    DataTableSortDirection;
}) {
  if (!active) {
    return (
      <ArrowUpDown
        size={13}
        className="text-[#a0a4a8]"
      />
    );
  }

  return direction ===
    "ASC" ? (
    <ArrowUp
      size={13}
      className="text-[#303030]"
    />
  ) : (
    <ArrowDown
      size={13}
      className="text-[#303030]"
    />
  );
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked:
    boolean;

  indeterminate?:
    boolean;

  onChange: () => void;

  ariaLabel:
    string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={
        indeterminate
          ? "mixed"
          : checked
      }
      aria-label={
        ariaLabel
      }
      onClick={
        onChange
      }
      className={[
        "flex h-[18px] w-[18px] items-center justify-center rounded border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#303030]",
        checked ||
        indeterminate
          ? "border-[#303030] bg-[#303030]"
          : "border-[#babfc3] bg-white hover:border-[#61666b]",
      ].join(" ")}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2.5 rounded bg-white" />
      ) : checked ? (
        <svg
          viewBox="0 0 16 16"
          className="h-3 w-3"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 8.25 6.5 11l6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          />
        </svg>
      ) : null}
    </button>
  );
}

function LoadingState({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <LoaderCircle
        size={28}
        className="animate-spin text-[#61666b]"
      />

      <p className="mt-3 text-sm font-medium text-[#303030]">
        {text}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title:
    string;

  description:
    string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f3]">
        <Inbox
          size={22}
          className="text-[#6d7175]"
        />
      </div>

      <h3 className="mt-4 text-base font-semibold text-[#202223]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#6d7175]">
        {description}
      </p>
    </div>
  );
}

function DataTablePaginationControls({
  pagination,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  disabled,
}: {
  pagination:
    DataTablePagination;

  pageSizeOptions:
    number[];

  onPageChange?: (
    page: number
  ) => void;

  onPageSizeChange?: (
    pageSize: number
  ) => void;

  disabled:
    boolean;
}) {
  const {
    page,
    pageSize,
    totalItems,
    totalPages,
  } =
    pagination;

  const safeTotalPages =
    Math.max(
      totalPages,
      1
    );

  const firstItem =
    totalItems ===
    0
      ? 0
      : (
          page -
          1
        ) *
          pageSize +
        1;

  const lastItem =
    Math.min(
      page *
        pageSize,
      totalItems
    );

  return (
    <div className="flex flex-col gap-3 border-t border-[#e1e3e5] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#6d7175]">
        Showing{" "}
        <span className="font-medium text-[#303030]">
          {firstItem}
        </span>
        {" – "}
        <span className="font-medium text-[#303030]">
          {lastItem}
        </span>
        {" of "}
        <span className="font-medium text-[#303030]">
          {totalItems}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-sm text-[#6d7175]">
            Rows

            <select
              value={
                pageSize
              }
              disabled={
                disabled
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
              className="h-9 rounded-lg border border-[#babfc3] bg-white px-2 text-sm text-[#303030] outline-none focus:border-[#303030] disabled:opacity-50"
            >
              {pageSizeOptions.map(
                (
                  option
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </label>
        )}

        <span className="text-sm text-[#6d7175]">
          Page{" "}
          <span className="font-medium text-[#303030]">
            {page}
          </span>
          {" of "}
          <span className="font-medium text-[#303030]">
            {
              safeTotalPages
            }
          </span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={
              disabled ||
              page <=
                1
            }
            onClick={() =>
              onPageChange?.(
                page -
                  1
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft
              size={17}
            />
          </button>

          <button
            type="button"
            aria-label="Next page"
            disabled={
              disabled ||
              page >=
                safeTotalPages
            }
            onClick={() =>
              onPageChange?.(
                page +
                  1
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight
              size={17}
            />
          </button>
        </div>
      </div>
    </div>
  );
}   