"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useChangePriceListStatusMutation,
  useDeletePriceListMutation,
  useGetPriceListsQuery,
  useUpdatePriceListMutation,
} from "@/store/api/priceListApi";

import useCrudPage from "@/hooks/common/useCrudPage";

import { useSelector } from "react-redux";

import type { RootState } from "@/store";

import {
  DEFAULT_PRICE_LIST_FILTERS,
} from "@/components/admin/pricing/PriceListFilters";

import type {
  PriceListFilterOption,
  PriceListFilterValues,
} from "@/components/admin/pricing/PriceListFilters";

import type {
  PriceList,
  PriceListListParams,
  PriceListType,
} from "@/types/priceList";

export type PriceListFeedbackType =
  | "success"
  | "error";

export interface PriceListFeedback {
  type: PriceListFeedbackType;
  message: string;
}

const PRICE_LIST_BASE_PATH =
  "/admin/price-lists";

const SUPPORTED_SORT_COLUMNS: Record<
  string,
  NonNullable<PriceListListParams["sortBy"]>
> = {
  name: "name",
  code: "code",
  priceListType: "priceListType",
  channelCode: "channelCode",
  currencyCode: "currencyCode",
  priority: "priority",
  isDefault: "isDefault",
  status: "isActive",
  isActive: "isActive",
  validFrom: "validFrom",
  validUntil: "validUntil",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

export default function usePriceLists() {
  const router = useRouter();

  const {
    initialized,
    accessToken,
  } = useSelector(
    (state: RootState) =>
      state.auth
  );
  
  const shouldSkipQuery =
    !initialized ||
    !accessToken;

  const [feedback, setFeedback] =
    useState<PriceListFeedback | null>(
      null
    );

  const [
    actionPriceListId,
    setActionPriceListId,
  ] = useState<string | null>(
    null
  );

  const [
    changePriceListStatus,
    changeStatusState,
  ] =
    useChangePriceListStatusMutation();

  const [
    updatePriceList,
    updateState,
  ] =
    useUpdatePriceListMutation();

  const [
    deletePriceList,
    deleteState,
  ] =
    useDeletePriceListMutation();

  const crudPage =
    useCrudPage<PriceListFilterValues>({
      initialFilters: {
        ...DEFAULT_PRICE_LIST_FILTERS,
      },

      initialPage:
        1,

      initialPageSize:
        20,

      initialSort: {
        columnId:
          "priority",

        direction:
          "ASC",
      },

      debounceMilliseconds:
        350,
    });

  const queryParams =
    useMemo<PriceListListParams>(
      () => {
        const params: PriceListListParams = {
          page:
            crudPage.page,

          pageSize:
            crudPage.pageSize,

          sortDirection:
            crudPage.sortDirection,
        };

        if (
          crudPage.debouncedSearch
        ) {
          params.search =
            crudPage.debouncedSearch;
        }

        if (
          crudPage.filters.status ===
          "ACTIVE"
        ) {
          params.isActive =
            true;
        }

        if (
          crudPage.filters.status ===
          "INACTIVE"
        ) {
          params.isActive =
            false;
        }

        if (
          crudPage.filters.priceListType !==
          "ALL"
        ) {
          params.priceListType =
            crudPage.filters
              .priceListType as PriceListType;
        }

        if (
          crudPage.filters.channelCode !==
          "ALL"
        ) {
          params.channelCode =
            crudPage.filters.channelCode;
        }

        if (
          crudPage.filters.currencyCode !==
          "ALL"
        ) {
          params.currencyCode =
            crudPage.filters.currencyCode;
        }

        const apiSortColumn =
          crudPage.sortColumnId
            ? SUPPORTED_SORT_COLUMNS[
                crudPage.sortColumnId
              ]
            : undefined;

        if (apiSortColumn) {
          params.sortBy =
            apiSortColumn;
        }

        return params;
      },
      [
        crudPage.page,
        crudPage.pageSize,
        crudPage.debouncedSearch,
        crudPage.filters.status,
        crudPage.filters
          .priceListType,
        crudPage.filters
          .channelCode,
        crudPage.filters
          .currencyCode,
        crudPage.sortColumnId,
        crudPage.sortDirection,
      ]
    );

    const {
      data,
      error,
      isLoading:
        isQueryLoading,
      isFetching,
      isError:
        isQueryError,
      refetch,
    } =
      useGetPriceListsQuery(
        queryParams,
        {
          skip:
            shouldSkipQuery,
    
          refetchOnMountOrArgChange:
            true,
        }
      );


      const isLoading =
  !initialized ||
  (
    !shouldSkipQuery &&
    isQueryLoading
  );

const isError =
  !shouldSkipQuery &&
  isQueryError;

  
  const priceLists =
    data?.data || [];

  const pagination =
    data?.pagination || {
      page:
        crudPage.page,

      pageSize:
        crudPage.pageSize,

      totalItems:
        0,

      totalPages:
        0,
    };

  /*
   * The backend list API currently supports status, type, channel,
   * currency, search and sorting.
   *
   * Validity is therefore applied to the records returned for the
   * current page.
   */
  const filteredPriceLists =
    useMemo(
      () =>
        filterByValidity(
          priceLists,
          crudPage.filters.validity
        ),
      [
        priceLists,
        crudPage.filters.validity,
      ]
    );

  const typeOptions =
    useMemo<
      PriceListFilterOption[]
    >(
      () =>
        buildOptions(
          priceLists.map(
            (priceList) =>
              priceList.priceListType
          ),
          formatLabel
        ),
      [
        priceLists,
      ]
    );

  const channelOptions =
    useMemo<
      PriceListFilterOption[]
    >(
      () =>
        buildOptions(
          priceLists.map(
            (priceList) =>
              priceList.channelCode
          ),
          formatLabel
        ),
      [
        priceLists,
      ]
    );

  const currencyOptions =
    useMemo<
      PriceListFilterOption[]
    >(
      () =>
        buildOptions(
          priceLists.map(
            (priceList) =>
              priceList.currencyCode
          ),
          (
            currencyCode
          ) =>
            currencyCode
        ),
      [
        priceLists,
      ]
    );

  /*
   * Return to the final valid page if deletion or filtering causes
   * the current page to move beyond the backend's total-page count.
   */
  useEffect(() => {
    if (
      pagination.totalPages >
        0 &&
      crudPage.page >
        pagination.totalPages
    ) {
      crudPage.setPage(
        pagination.totalPages
      );
    }
  }, [
    pagination.totalPages,
    crudPage.page,
    crudPage.setPage,
  ]);

  const clearFeedback =
    useCallback(() => {
      setFeedback(
        null
      );
    }, []);

  const showSuccess =
    useCallback(
      (
        message: string
      ) => {
        setFeedback({
          type:
            "success",

          message,
        });
      },
      []
    );

  const showError =
    useCallback(
      (
        errorValue: unknown,
        fallbackMessage: string
      ) => {
        setFeedback({
          type:
            "error",

          message:
            getApiErrorMessage(
              errorValue,
              fallbackMessage
            ),
        });
      },
      []
    );

  const handleCreate =
    useCallback(() => {
      clearFeedback();

      router.push(
        `${PRICE_LIST_BASE_PATH}/new`
      );
    }, [
      router,
      clearFeedback,
    ]);

  const handleEdit =
    useCallback(
      (
        priceList: PriceList
      ) => {
        clearFeedback();

        router.push(
          `${PRICE_LIST_BASE_PATH}/${priceList.id}/edit`
        );
      },
      [
        router,
        clearFeedback,
      ]
    );

  /*
   * This opens the create screen with the source record ID.
   *
   * The future create form can read `duplicateFrom` and preload the
   * original record while requiring a new code.
   */
  const handleDuplicate =
    useCallback(
      (
        priceList: PriceList
      ) => {
        clearFeedback();

        const searchParams =
          new URLSearchParams({
            duplicateFrom:
              priceList.id,
          });

        router.push(
          `${PRICE_LIST_BASE_PATH}/new?${searchParams.toString()}`
        );
      },
      [
        router,
        clearFeedback,
      ]
    );

  const handleRefresh =
    useCallback(
      async () => {
        clearFeedback();

        try {
          await refetch();
        } catch (
          refreshError
        ) {
          showError(
            refreshError,
            "Unable to refresh the price lists."
          );
        }
      },
      [
        refetch,
        clearFeedback,
        showError,
      ]
    );

  const handleStatusChange =
    useCallback(
      async (
        priceList: PriceList
      ) => {
        clearFeedback();

        if (
          priceList.isDefault &&
          priceList.isActive
        ) {
          setFeedback({
            type:
              "error",

            message:
              "The default price list cannot be deactivated. Set another active list as default first.",
          });

          return;
        }

        const nextIsActive =
          !priceList.isActive;

        const actionLabel =
          nextIsActive
            ? "activate"
            : "deactivate";

        const confirmed =
          window.confirm(
            `Are you sure you want to ${actionLabel} “${priceList.name}”?`
          );

        if (!confirmed) {
          return;
        }

        setActionPriceListId(
          priceList.id
        );

        try {
          const response =
            await changePriceListStatus({
              id:
                priceList.id,

              isActive:
                nextIsActive,
            }).unwrap();

          showSuccess(
            response.message ||
              `Price list “${priceList.name}” was ${
                nextIsActive
                  ? "activated"
                  : "deactivated"
              } successfully.`
          );
        } catch (
          mutationError
        ) {
          showError(
            mutationError,
            `Unable to ${actionLabel} the price list.`
          );
        } finally {
          setActionPriceListId(
            null
          );
        }
      },
      [
        changePriceListStatus,
        clearFeedback,
        showError,
        showSuccess,
      ]
    );

  const handleSetDefault =
    useCallback(
      async (
        priceList: PriceList
      ) => {
        clearFeedback();

        if (
          priceList.isDefault
        ) {
          return;
        }

        if (
          !priceList.isActive
        ) {
          setFeedback({
            type:
              "error",

            message:
              "Only an active price list can be set as the default.",
          });

          return;
        }

        const confirmed =
          window.confirm(
            `Set “${priceList.name}” as the default price list?`
          );

        if (!confirmed) {
          return;
        }

        setActionPriceListId(
          priceList.id
        );

        try {
          const response =
            await updatePriceList({
              id:
                priceList.id,

              body: {
                isDefault:
                  true,
              },
            }).unwrap();

          showSuccess(
            response.message ||
              `Price list “${priceList.name}” is now the default.`
          );
        } catch (
          mutationError
        ) {
          showError(
            mutationError,
            "Unable to set the default price list."
          );
        } finally {
          setActionPriceListId(
            null
          );
        }
      },
      [
        updatePriceList,
        clearFeedback,
        showError,
        showSuccess,
      ]
    );

  const handleDelete =
    useCallback(
      async (
        priceList: PriceList
      ) => {
        clearFeedback();

        if (
          priceList.isDefault
        ) {
          setFeedback({
            type:
              "error",

            message:
              "The default price list cannot be deleted. Set another active list as default first.",
          });

          return;
        }

        const confirmed =
          window.confirm(
            `Delete “${priceList.name}”? This action cannot be undone.`
          );

        if (!confirmed) {
          return;
        }

        setActionPriceListId(
          priceList.id
        );

        try {
          const response =
            await deletePriceList(
              priceList.id
            ).unwrap();

          crudPage.deselectRows([
            priceList.id,
          ]);

          showSuccess(
            response.message ||
              `Price list “${priceList.name}” was deleted successfully.`
          );
        } catch (
          mutationError
        ) {
          showError(
            mutationError,
            "Unable to delete the price list."
          );
        } finally {
          setActionPriceListId(
            null
          );
        }
      },
      [
        deletePriceList,
        crudPage.deselectRows,
        clearFeedback,
        showError,
        showSuccess,
      ]
    );

  const handleFiltersChange =
    useCallback(
      (
        nextFilters:
          PriceListFilterValues
      ) => {
        clearFeedback();

        crudPage.setFilters(
          nextFilters
        );
      },
      [
        crudPage.setFilters,
        clearFeedback,
      ]
    );

  const handleSearchChange =
    useCallback(
      (
        value: string
      ) => {
        clearFeedback();

        crudPage.setSearch(
          value
        );
      },
      [
        crudPage.setSearch,
        clearFeedback,
      ]
    );

  const handlePageChange =
    useCallback(
      (
        page: number
      ) => {
        clearFeedback();

        crudPage.setPage(
          page
        );
      },
      [
        crudPage.setPage,
        clearFeedback,
      ]
    );

  const handlePageSizeChange =
    useCallback(
      (
        pageSize: number
      ) => {
        clearFeedback();

        crudPage.setPageSize(
          pageSize
        );
      },
      [
        crudPage.setPageSize,
        clearFeedback,
      ]
    );

  const handleSortChange =
    useCallback(
      (
        columnId: string,
        direction:
          "ASC" | "DESC"
      ) => {
        clearFeedback();

        crudPage.setSorting(
          columnId,
          direction
        );
      },
      [
        crudPage.setSorting,
        clearFeedback,
      ]
    );

  const queryErrorMessage =
    useMemo(
      () =>
        isError
          ? getApiErrorMessage(
              error,
              "Unable to load the price lists."
            )
          : null,
      [
        isError,
        error,
      ]
    );

  const isChangingStatus =
    changeStatusState.isLoading;

  const isUpdating =
    updateState.isLoading;

  const isDeleting =
    deleteState.isLoading;

  const isMutating =
    isChangingStatus ||
    isUpdating ||
    isDeleting;

  return {
    priceLists,
    filteredPriceLists,
    pagination,

    search:
      crudPage.search,

    debouncedSearch:
      crudPage.debouncedSearch,

    filters:
      crudPage.filters,

    page:
      crudPage.page,

    pageSize:
      crudPage.pageSize,

    sortColumnId:
      crudPage.sortColumnId,

    sortDirection:
      crudPage.sortDirection,

    selectedRowIds:
      crudPage.selectedRowIds,

    selectedRowCount:
      crudPage.selectedRowCount,

    typeOptions,
    channelOptions,
    currencyOptions,

    feedback,
    queryErrorMessage,

    isLoading,
    isFetching,
    isError,

    isChangingStatus,
    isUpdating,
    isDeleting,
    isMutating,

    actionPriceListId,

    handleCreate,
    handleEdit,
    handleDuplicate,
    handleRefresh,
    handleStatusChange,
    handleSetDefault,
    handleDelete,

    handleFiltersChange,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,

    setSelectedRowIds:
      crudPage.setSelectedRowIds,

    clearSelection:
      crudPage.clearSelection,

    resetFilters:
      crudPage.resetFilters,

    resetAll:
      crudPage.resetAll,

    clearFeedback,
  };
}

function filterByValidity(
  priceLists: PriceList[],
  validity:
    PriceListFilterValues["validity"]
) {
  if (
    validity ===
    "ALL"
  ) {
    return priceLists;
  }

  const now =
    Date.now();

  return priceLists.filter(
    (
      priceList
    ) => {
      const validFromTime =
        parseDateTime(
          priceList.validFrom
        );

      const validUntilTime =
        parseDateTime(
          priceList.validUntil
        );

      switch (
        validity
      ) {
        case "CURRENT":
          return (
            (
              validFromTime ===
                null ||
              validFromTime <=
                now
            ) &&
            (
              validUntilTime ===
                null ||
              validUntilTime >=
                now
            ) &&
            !(
              priceList.validFrom ===
                null &&
              priceList.validUntil ===
                null
            )
          );

        case "SCHEDULED":
          return (
            validFromTime !==
              null &&
            validFromTime >
              now
          );

        case "EXPIRED":
          return (
            validUntilTime !==
              null &&
            validUntilTime <
              now
          );

        case "UNLIMITED":
          return (
            !priceList.validFrom &&
            !priceList.validUntil
          );

        default:
          return true;
      }
    }
  );
}

function parseDateTime(
  value:
    string | null
) {
  if (!value) {
    return null;
  }

  const time =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    time
  )
    ? time
    : null;
}

function buildOptions(
  values: string[],
  labelFormatter: (
    value: string
  ) => string
): PriceListFilterOption[] {
  return Array.from(
    new Set(
      values
        .map(
          (
            value
          ) =>
            String(
              value || ""
            ).trim()
        )
        .filter(
          Boolean
        )
    )
  )
    .sort(
      (
        firstValue,
        secondValue
      ) =>
        firstValue.localeCompare(
          secondValue
        )
    )
    .map(
      (
        value
      ) => ({
        value,
        label:
          labelFormatter(
            value
          ),
      })
    );
}

function formatLabel(
  value: string
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

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (
    typeof error ===
      "object" &&
    error !==
      null
  ) {
    const apiError =
      error as {
        data?: {
          message?: unknown;
          error?: unknown;
          errors?: unknown;
        };

        message?: unknown;
        error?: unknown;
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
      Array.isArray(
        apiError.data
          ?.errors
      )
    ) {
      const validationMessages =
        apiError.data.errors
          .map(
            (
              item
            ) => {
              if (
                typeof item ===
                "string"
              ) {
                return item;
              }

              if (
                typeof item ===
                  "object" &&
                item !==
                  null &&
                "message" in
                  item &&
                typeof (
                  item as {
                    message?: unknown;
                  }
                ).message ===
                  "string"
              ) {
                return (
                  item as {
                    message: string;
                  }
                ).message;
              }

              return null;
            }
          )
          .filter(
            (
              message
            ): message is string =>
              Boolean(
                message
              )
          );

      if (
        validationMessages.length >
        0
      ) {
        return validationMessages.join(
          ", "
        );
      }
    }

    if (
      typeof apiError.message ===
      "string"
    ) {
      return apiError.message;
    }

    if (
      typeof apiError.error ===
      "string"
    ) {
      return apiError.error;
    }
  }

  return fallbackMessage;
}