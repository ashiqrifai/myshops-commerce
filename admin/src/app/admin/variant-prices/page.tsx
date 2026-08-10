"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import FormCard from "@/components/admin/forms/FormCard";
import SelectField from "@/components/admin/forms/SelectField";
import TextField from "@/components/admin/forms/TextField";

import VariantPriceList from "@/components/admin/pricing/VariantPriceList";

import {
  useVariantPrices,
} from "@/hooks/pricing/useVariantPrices";

import {
  useGetPriceListsQuery,
} from "@/store/api/priceListApi";

import type {
  VariantPrice,
  VariantPriceListParams,
} from "@/types/variantPrice";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error: unknown
) {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return "An unexpected error occurred.";
  }

  const apiError =
    error as {
      data?: {
        message?: string;

        error?: string;

        errors?: Array<{
          msg?: string;
          message?: string;
        }>;
      };

      error?: string;

      message?: string;
    };

  if (
    apiError.data?.message
  ) {
    return apiError.data.message;
  }

  if (
    apiError.data?.error
  ) {
    return apiError.data.error;
  }

  if (
    apiError.data?.errors?.length
  ) {
    return (
      apiError.data.errors[0]
        ?.msg ||
      apiError.data.errors[0]
        ?.message ||
      "Validation failed."
    );
  }

  if (apiError.message) {
    return apiError.message;
  }

  if (apiError.error) {
    return apiError.error;
  }

  return "An unexpected error occurred.";
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function VariantPricesPage() {
  const {
    initialized,
    accessToken,

    busy,
    error,

    variantPrices,
    pagination,
    queryParams,

    setFilters,
    setPage,
    setPageSize,
    resetFilters,
    refresh,

    remove,
    changeStatus,

    openCreate,
    openEdit,
  } = useVariantPrices();

  /*
  |--------------------------------------------------------------------------
  | Price Lists
  |--------------------------------------------------------------------------
  */

  const shouldSkipLookups =
    !initialized ||
    !accessToken;

  const {
    data:
      priceListResponse,

    isLoading:
      isLoadingPriceLists,
  } =
    useGetPriceListsQuery(
      {
        page:
          1,

        pageSize:
          200,

        isActive:
          true,

        sortBy:
          "priority",

        sortDirection:
          "ASC",
      },
      {
        skip:
          shouldSkipLookups,

        refetchOnMountOrArgChange:
          true,
      }
    );

  const priceListOptions =
    useMemo(
      () =>
        (
          priceListResponse?.data ||
          []
        ).map(
          (
            priceList
          ) => ({
            value:
              priceList.id,

            label:
              `${priceList.name} (${priceList.code})`,
          })
        ),
      [
        priceListResponse,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Local Filter State
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] =
    useState(
      queryParams.search ||
        ""
    );

  const [
    priceListId,
    setPriceListId,
  ] =
    useState(
      queryParams.priceListId ||
        ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      | ""
      | "ACTIVE"
      | "INACTIVE"
    >(
      queryParams.isActive ===
        true
        ? "ACTIVE"
        : queryParams.isActive ===
            false
          ? "INACTIVE"
          : ""
    );

  const [
    validOn,
    setValidOn,
  ] =
    useState(
      queryParams.validOn ||
        ""
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(
      queryParams.quantity !==
        undefined
        ? String(
            queryParams.quantity
          )
        : ""
    );

  /*
  |--------------------------------------------------------------------------
  | Debounced Search
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            const normalizedSearch =
              search.trim();

            if (
              normalizedSearch ===
              (
                queryParams.search ||
                ""
              )
            ) {
              return;
            }

            setFilters({
              search:
                normalizedSearch ||
                undefined,
            });
          },
          400
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      search,
      queryParams.search,
      setFilters,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Filter Handlers
  |--------------------------------------------------------------------------
  */

  const handlePriceListChange =
    (
      value:
        string
    ) => {
      setPriceListId(
        value
      );

      setFilters({
        priceListId:
          value ||
          undefined,
      });
    };

  const handleStatusChange =
    (
      value:
        string
    ) => {
      const normalizedStatus =
        value as
          | ""
          | "ACTIVE"
          | "INACTIVE";

      setStatus(
        normalizedStatus
      );

      const nextFilters:
        Partial<VariantPriceListParams> =
        {};

      if (
        normalizedStatus ===
        "ACTIVE"
      ) {
        nextFilters.isActive =
          true;
      } else if (
        normalizedStatus ===
        "INACTIVE"
      ) {
        nextFilters.isActive =
          false;
      } else {
        nextFilters.isActive =
          undefined;
      }

      setFilters(
        nextFilters
      );
    };

  const handleValidOnChange =
    (
      value:
        string
    ) => {
      setValidOn(
        value
      );

      setFilters({
        validOn:
          value ||
          undefined,
      });
    };

  const handleQuantityChange =
    (
      value:
        string
    ) => {
      setQuantity(
        value
      );

      if (
        value === ""
      ) {
        setFilters({
          quantity:
            undefined,
        });

        return;
      }

      const numberValue =
        Number(value);

      if (
        Number.isFinite(
          numberValue
        ) &&
        numberValue >=
          1
      ) {
        setFilters({
          quantity:
            numberValue,
        });
      }
    };

  const handleResetFilters =
    () => {
      setSearch("");
      setPriceListId("");
      setStatus("");
      setValidOn("");
      setQuantity("");

      resetFilters();
    };

  /*
  |--------------------------------------------------------------------------
  | CRUD Handlers
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (
      variantPrice:
        VariantPrice
    ) => {
      try {
        await remove(
          variantPrice.id
        );
      } catch (
        deleteError
      ) {
        window.alert(
          getErrorMessage(
            deleteError
          )
        );
      }
    };

  const handleStatusUpdate =
    async (
      variantPrice:
        VariantPrice,
      isActive:
        boolean
    ) => {
      try {
        await changeStatus(
          variantPrice.id,
          isActive
        );
      } catch (
        statusError
      ) {
        window.alert(
          getErrorMessage(
            statusError
          )
        );
      }
    };

  const handleRefresh =
    async () => {
      try {
        await refresh();
      } catch (
        refreshError
      ) {
        window.alert(
          getErrorMessage(
            refreshError
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Filter Summary
  |--------------------------------------------------------------------------
  */

  const activeFilterCount =
    [
      search.trim(),
      priceListId,
      status,
      validOn,
      quantity,
    ].filter(
      Boolean
    ).length;

  const loadErrorMessage =
    error
      ? getErrorMessage(
          error
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-5">
      {/*
      ----------------------------------------------------------------------
      Page Header
      ----------------------------------------------------------------------
      */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#202223]">
              Variant Pricing
            </h1>

            <span className="inline-flex rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold text-[#6d7175]">
              Pricing
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Manage prices for
            every product
            variant, including
            quantity tiers,
            promotional prices
            and effective
            dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              handleRefresh
            }
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg",
              "border border-[#babfc3] bg-white px-4",
              "text-sm font-semibold text-[#202223]",
              "transition hover:bg-[#f6f6f7]",
              "focus:outline-none focus:ring-2 focus:ring-[#303030]/10",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <RefreshCw
              size={
                16
              }
              className={
                busy
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              openCreate
            }
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg",
              "bg-[#303030] px-4",
              "text-sm font-semibold text-white",
              "transition hover:bg-[#1f1f1f]",
              "focus:outline-none focus:ring-2 focus:ring-[#303030]/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <Plus
              size={
                17
              }
            />

            New Price
          </button>
        </div>
      </div>

      {/*
      ----------------------------------------------------------------------
      Error State
      ----------------------------------------------------------------------
      */}

      {loadErrorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-red-800">
            Unable to load
            variant prices
          </p>

          <p className="mt-1 text-sm text-red-700">
            {
              loadErrorMessage
            }
          </p>
        </div>
      )}

      {/*
      ----------------------------------------------------------------------
      Filters
      ----------------------------------------------------------------------
      */}

      <FormCard
        title="Search and filters"
        description="Find prices by SKU, barcode or variant name and narrow the results by price list, status, validity or quantity."
        headerContent={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f2f3] px-2.5 py-1.5 text-xs font-semibold text-[#6d7175]">
              <SlidersHorizontal
                size={
                  14
                }
              />

              {
                activeFilterCount
              }{" "}
              active
            </span>

            <button
              type="button"
              disabled={
                busy ||
                activeFilterCount ===
                  0
              }
              onClick={
                handleResetFilters
              }
              className={[
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg",
                "border border-[#babfc3] bg-white px-3",
                "text-sm font-medium text-[#202223]",
                "transition hover:bg-[#f6f6f7]",
                "disabled:cursor-not-allowed disabled:opacity-40",
              ].join(" ")}
            >
              <RotateCcw
                size={
                  14
                }
              />

              Reset
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-1">
            <TextField
              id="variant-price-search"
              label="Search"
              value={
                search
              }
              disabled={
                busy
              }
              placeholder="SKU, barcode or variant"
              startAdornment={
                <Search
                  size={
                    16
                  }
                />
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
            />
          </div>

          <SelectField
            id="variant-price-list"
            label="Price list"
            value={
              priceListId
            }
            disabled={
              busy
            }
            loading={
              isLoadingPriceLists
            }
            placeholder="All price lists"
            options={
              priceListOptions
            }
            onChange={(
              event
            ) =>
              handlePriceListChange(
                event
                  .target
                  .value
              )
            }
          />

          <SelectField
            id="variant-price-status"
            label="Status"
            value={
              status
            }
            disabled={
              busy
            }
            placeholder="All statuses"
            options={[
              {
                value:
                  "ACTIVE",

                label:
                  "Active",
              },

              {
                value:
                  "INACTIVE",

                label:
                  "Inactive",
              },
            ]}
            onChange={(
              event
            ) =>
              handleStatusChange(
                event
                  .target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-valid-on"
            label="Valid on"
            type="date"
            value={
              validOn
            }
            disabled={
              busy
            }
            onChange={(
              event
            ) =>
              handleValidOnChange(
                event
                  .target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-quantity"
            label="Quantity"
            type="number"
            min={
              1
            }
            step={
              1
            }
            value={
              quantity
            }
            disabled={
              busy
            }
            placeholder="Example: 10"
            onChange={(
              event
            ) =>
              handleQuantityChange(
                event
                  .target
                  .value
              )
            }
          />
        </div>
      </FormCard>

      {/*
      ----------------------------------------------------------------------
      Variant Price Table
      ----------------------------------------------------------------------
      */}

      <VariantPriceList
        variantPrices={
          variantPrices
        }
        pagination={
          pagination
        }
        isLoading={
          busy &&
          variantPrices.length ===
            0
        }
        isFetching={
          busy
        }
        busy={
          busy
        }
        onEdit={
          openEdit
        }
        onDelete={
          handleDelete
        }
        onStatusChange={
          handleStatusUpdate
        }
        onPageChange={
          setPage
        }
        onPageSizeChange={
          setPageSize
        }
      />
    </div>
  );
}