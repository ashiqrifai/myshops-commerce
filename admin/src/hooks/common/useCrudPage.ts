"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type CrudSortDirection =
  | "ASC"
  | "DESC";

export interface CrudSortingState {
  columnId: string | null;
  direction: CrudSortDirection;
}

export interface UseCrudPageOptions<
  TFilters
> {
  initialFilters: TFilters;

  initialSearch?: string;
  initialPage?: number;
  initialPageSize?: number;

  initialSort?: {
    columnId: string | null;
    direction: CrudSortDirection;
  };

  debounceMilliseconds?: number;

  resetPageOnSearchChange?: boolean;
  resetPageOnFilterChange?: boolean;
  resetPageOnSortChange?: boolean;

  onRefresh?: () =>
    | void
    | Promise<unknown>;
}

export interface UseCrudPageResult<
  TFilters
> {
  search: string;
  debouncedSearch: string;
  setSearch: (
    value: string
  ) => void;
  clearSearch: () => void;

  filters: TFilters;
  setFilters: (
    filters:
      | TFilters
      | ((
          current: TFilters
        ) => TFilters)
  ) => void;

  updateFilter: <
    TKey extends keyof TFilters
  >(
    key: TKey,
    value: TFilters[TKey]
  ) => void;

  resetFilters: () => void;

  page: number;
  pageSize: number;
  setPage: (
    page: number
  ) => void;
  setPageSize: (
    pageSize: number
  ) => void;
  goToFirstPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: (
    totalPages?: number
  ) => void;

  sorting: CrudSortingState;
  sortColumnId: string | null;
  sortDirection: CrudSortDirection;

  setSorting: (
    columnId: string | null,
    direction?: CrudSortDirection
  ) => void;

  toggleSorting: (
    columnId: string
  ) => void;

  clearSorting: () => void;

  selectedRowIds: string[];
  selectedRowIdSet: Set<string>;

  setSelectedRowIds: (
    rowIds: string[]
  ) => void;

  toggleRowSelection: (
    rowId: string
  ) => void;

  selectRows: (
    rowIds: string[]
  ) => void;

  deselectRows: (
    rowIds: string[]
  ) => void;

  clearSelection: () => void;

  isRefreshing: boolean;
  refresh: () =>
    Promise<void>;

  hasSearch: boolean;
  hasSelection: boolean;
  selectedRowCount: number;

  resetPageState: () => void;
  resetAll: () => void;
}

export default function useCrudPage<
  TFilters
>({
  initialFilters,
  initialSearch = "",
  initialPage = 1,
  initialPageSize = 20,
  initialSort = {
    columnId: null,
    direction: "ASC",
  },
  debounceMilliseconds = 350,
  resetPageOnSearchChange = true,
  resetPageOnFilterChange = true,
  resetPageOnSortChange = true,
  onRefresh,
}: UseCrudPageOptions<TFilters>): UseCrudPageResult<TFilters> {
  /*
   * Keep stable snapshots of the initial configuration.
   *
   * This prevents reset functions from changing merely because the caller
   * creates a new object literal during each render.
   */
  const initialFiltersRef =
    useRef<TFilters>(
      cloneValue(
        initialFilters
      )
    );

  const initialSearchRef =
    useRef(
      initialSearch
    );

  const initialPageRef =
    useRef(
      normalizePage(
        initialPage
      )
    );

  const initialPageSizeRef =
    useRef(
      normalizePageSize(
        initialPageSize
      )
    );

  const initialSortRef =
    useRef<CrudSortingState>({
      columnId:
        initialSort.columnId,

      direction:
        initialSort.direction,
    });

  const [
    search,
    setSearchState,
  ] = useState(
    initialSearchRef.current
  );

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(
    initialSearchRef.current
  );

  const [
    filters,
    setFiltersState,
  ] = useState<TFilters>(
    () =>
      cloneValue(
        initialFiltersRef.current
      )
  );

  const [
    page,
    setPageState,
  ] = useState(
    initialPageRef.current
  );

  const [
    pageSize,
    setPageSizeState,
  ] = useState(
    initialPageSizeRef.current
  );

  const [
    sorting,
    setSortingState,
  ] =
    useState<CrudSortingState>(
      initialSortRef.current
    );

  const [
    selectedRowIds,
    setSelectedRowIdsState,
  ] = useState<string[]>(
    []
  );

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  /*
   * Search debounce
   */
  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );
        },
        Math.max(
          debounceMilliseconds,
          0
        )
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    search,
    debounceMilliseconds,
  ]);

  const setSearch =
    useCallback(
      (
        value: string
      ) => {
        setSearchState(
          value
        );

        if (
          resetPageOnSearchChange
        ) {
          setPageState(
            1
          );
        }
      },
      [
        resetPageOnSearchChange,
      ]
    );

  const clearSearch =
    useCallback(() => {
      setSearchState(
        ""
      );

      setDebouncedSearch(
        ""
      );

      if (
        resetPageOnSearchChange
      ) {
        setPageState(
          1
        );
      }
    }, [
      resetPageOnSearchChange,
    ]);

  const setFilters =
    useCallback(
      (
        nextFilters:
          | TFilters
          | ((
              current: TFilters
            ) => TFilters)
      ) => {
        setFiltersState(
          (
            currentFilters
          ) => {
            const resolvedFilters =
              typeof nextFilters ===
              "function"
                ? (
                    nextFilters as (
                      current: TFilters
                    ) => TFilters
                  )(
                    currentFilters
                  )
                : nextFilters;

            return resolvedFilters;
          }
        );

        if (
          resetPageOnFilterChange
        ) {
          setPageState(
            1
          );
        }
      },
      [
        resetPageOnFilterChange,
      ]
    );

  const updateFilter =
    useCallback(
      <
        TKey extends keyof TFilters
      >(
        key: TKey,
        value: TFilters[TKey]
      ) => {
        setFiltersState(
          (
            currentFilters
          ) => ({
            ...currentFilters,
            [key]:
              value,
          })
        );

        if (
          resetPageOnFilterChange
        ) {
          setPageState(
            1
          );
        }
      },
      [
        resetPageOnFilterChange,
      ]
    );

  const resetFilters =
    useCallback(() => {
      setFiltersState(
        cloneValue(
          initialFiltersRef.current
        )
      );

      if (
        resetPageOnFilterChange
      ) {
        setPageState(
          1
        );
      }
    }, [
      resetPageOnFilterChange,
    ]);

  const setPage =
    useCallback(
      (
        nextPage: number
      ) => {
        setPageState(
          normalizePage(
            nextPage
          )
        );
      },
      []
    );

  const setPageSize =
    useCallback(
      (
        nextPageSize: number
      ) => {
        setPageSizeState(
          normalizePageSize(
            nextPageSize
          )
        );

        /*
         * Returning to page one avoids requesting a page that no longer
         * exists after changing the number of records per page.
         */
        setPageState(
          1
        );
      },
      []
    );

  const goToFirstPage =
    useCallback(() => {
      setPageState(
        1
      );
    }, []);

  const goToPreviousPage =
    useCallback(() => {
      setPageState(
        (
          currentPage
        ) =>
          Math.max(
            currentPage -
              1,
            1
          )
      );
    }, []);

  const goToNextPage =
    useCallback(
      (
        totalPages?: number
      ) => {
        setPageState(
          (
            currentPage
          ) => {
            const nextPage =
              currentPage +
              1;

            if (
              totalPages ===
              undefined
            ) {
              return nextPage;
            }

            return Math.min(
              nextPage,
              Math.max(
                totalPages,
                1
              )
            );
          }
        );
      },
      []
    );

  const setSorting =
    useCallback(
      (
        columnId:
          string | null,
        direction:
          CrudSortDirection =
            "ASC"
      ) => {
        setSortingState({
          columnId,
          direction,
        });

        if (
          resetPageOnSortChange
        ) {
          setPageState(
            1
          );
        }
      },
      [
        resetPageOnSortChange,
      ]
    );

  const toggleSorting =
    useCallback(
      (
        columnId: string
      ) => {
        setSortingState(
          (
            currentSorting
          ) => {
            const nextDirection:
              CrudSortDirection =
              currentSorting.columnId ===
                columnId &&
              currentSorting.direction ===
                "ASC"
                ? "DESC"
                : "ASC";

            return {
              columnId,
              direction:
                nextDirection,
            };
          }
        );

        if (
          resetPageOnSortChange
        ) {
          setPageState(
            1
          );
        }
      },
      [
        resetPageOnSortChange,
      ]
    );

  const clearSorting =
    useCallback(() => {
      setSortingState({
        columnId:
          null,
        direction:
          "ASC",
      });

      if (
        resetPageOnSortChange
      ) {
        setPageState(
          1
        );
      }
    }, [
      resetPageOnSortChange,
    ]);

  const setSelectedRowIds =
    useCallback(
      (
        rowIds: string[]
      ) => {
        setSelectedRowIdsState(
          normalizeRowIds(
            rowIds
          )
        );
      },
      []
    );

  const toggleRowSelection =
    useCallback(
      (
        rowId: string
      ) => {
        setSelectedRowIdsState(
          (
            currentIds
          ) => {
            const selectedIds =
              new Set(
                currentIds
              );

            if (
              selectedIds.has(
                rowId
              )
            ) {
              selectedIds.delete(
                rowId
              );
            } else {
              selectedIds.add(
                rowId
              );
            }

            return Array.from(
              selectedIds
            );
          }
        );
      },
      []
    );

  const selectRows =
    useCallback(
      (
        rowIds: string[]
      ) => {
        setSelectedRowIdsState(
          (
            currentIds
          ) =>
            normalizeRowIds([
              ...currentIds,
              ...rowIds,
            ])
        );
      },
      []
    );

  const deselectRows =
    useCallback(
      (
        rowIds: string[]
      ) => {
        const idsToRemove =
          new Set(
            rowIds
          );

        setSelectedRowIdsState(
          (
            currentIds
          ) =>
            currentIds.filter(
              (
                rowId
              ) =>
                !idsToRemove.has(
                  rowId
                )
            )
        );
      },
      []
    );

  const clearSelection =
    useCallback(() => {
      setSelectedRowIdsState(
        []
      );
    }, []);

  const selectedRowIdSet =
    useMemo(
      () =>
        new Set(
          selectedRowIds
        ),
      [
        selectedRowIds,
      ]
    );

  const refresh =
    useCallback(
      async () => {
        if (
          isRefreshing
        ) {
          return;
        }

        setIsRefreshing(
          true
        );

        try {
          await onRefresh?.();
        } finally {
          setIsRefreshing(
            false
          );
        }
      },
      [
        isRefreshing,
        onRefresh,
      ]
    );

  const resetPageState =
    useCallback(() => {
      setPageState(
        initialPageRef.current
      );

      setPageSizeState(
        initialPageSizeRef.current
      );

      setSortingState({
        ...initialSortRef.current,
      });

      setSelectedRowIdsState(
        []
      );
    }, []);

  const resetAll =
    useCallback(() => {
      setSearchState(
        initialSearchRef.current
      );

      setDebouncedSearch(
        initialSearchRef.current.trim()
      );

      setFiltersState(
        cloneValue(
          initialFiltersRef.current
        )
      );

      setPageState(
        initialPageRef.current
      );

      setPageSizeState(
        initialPageSizeRef.current
      );

      setSortingState({
        ...initialSortRef.current,
      });

      setSelectedRowIdsState(
        []
      );
    }, []);

  return {
    search,
    debouncedSearch,
    setSearch,
    clearSearch,

    filters,
    setFilters,
    updateFilter,
    resetFilters,

    page,
    pageSize,
    setPage,
    setPageSize,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,

    sorting,
    sortColumnId:
      sorting.columnId,
    sortDirection:
      sorting.direction,
    setSorting,
    toggleSorting,
    clearSorting,

    selectedRowIds,
    selectedRowIdSet,
    setSelectedRowIds,
    toggleRowSelection,
    selectRows,
    deselectRows,
    clearSelection,

    isRefreshing,
    refresh,

    hasSearch:
      search.trim().length >
      0,

    hasSelection:
      selectedRowIds.length >
      0,

    selectedRowCount:
      selectedRowIds.length,

    resetPageState,
    resetAll,
  };
}

function normalizePage(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 1;
  }

  return Math.max(
    Math.floor(
      value
    ),
    1
  );
}

function normalizePageSize(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 20;
  }

  return Math.max(
    Math.floor(
      value
    ),
    1
  );
}

function normalizeRowIds(
  rowIds: string[]
) {
  return Array.from(
    new Set(
      rowIds.filter(
        (
          rowId
        ) =>
          typeof rowId ===
            "string" &&
          rowId.trim().length >
            0
      )
    )
  );
}

/*
 * The filter structures used by the admin pages should contain ordinary
 * serializable values. structuredClone safely creates a fresh reset value.
 * The fallback supports older browsers that do not expose structuredClone.
 */
function cloneValue<
  TValue
>(
  value: TValue
): TValue {
  if (
    typeof structuredClone ===
    "function"
  ) {
    return structuredClone(
      value
    );
  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  ) as TValue;
}