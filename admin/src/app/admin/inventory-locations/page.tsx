"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CirclePlus,
  RefreshCw,
  Search,
  Warehouse,
} from "lucide-react";

import {
  toast,
} from "sonner";

import InventoryLocationList from "@/components/admin/inventory-locations/InventoryLocationList";

import {
  useChangeInventoryLocationStatusMutation,
  useDeleteInventoryLocationMutation,
  useGetInventoryLocationsQuery,
} from "@/store/api/inventoryLocationApi";

import type {
  InventoryLocation,
  InventoryLocationType,
} from "@/types/inventoryLocation";

export default function InventoryLocationsPage() {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "ALL" |
      "ACTIVE" |
      "INACTIVE"
    >(
      "ALL"
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      "ALL" |
      InventoryLocationType
    >(
      "ALL"
    );

  const [
    fulfillmentFilter,
    setFulfillmentFilter,
  ] =
    useState<
      "ALL" |
      "DELIVERY" |
      "PICKUP"
    >(
      "ALL"
    );

  const queryParams =
    useMemo(
      () => ({
        page:
          1,

        pageSize:
          200,

        search:
          search.trim() ||
          undefined,

        locationType:
          typeFilter ===
          "ALL"
            ? undefined
            : typeFilter,

        isActive:
          statusFilter ===
          "ALL"
            ? undefined
            : statusFilter ===
              "ACTIVE",

        isDeliveryEnabled:
          fulfillmentFilter ===
          "DELIVERY"
            ? true
            : undefined,

        isPickupEnabled:
          fulfillmentFilter ===
          "PICKUP"
            ? true
            : undefined,

        sortBy:
          "sortOrder" as const,

        sortDirection:
          "ASC" as const,
      }),
      [
        search,
        statusFilter,
        typeFilter,
        fulfillmentFilter,
      ]
    );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetInventoryLocationsQuery(
      queryParams
    );

  const [
    changeInventoryLocationStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeInventoryLocationStatusMutation();

  const [
    deleteInventoryLocation,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteInventoryLocationMutation();

  const locations =
    data?.data ||
    [];

  const activeCount =
    locations.filter(
      (
        location
      ) =>
        location.isActive
    ).length;

  const pickupCount =
    locations.filter(
      (
        location
      ) =>
        location.isPickupEnabled
    ).length;

  const deliveryCount =
    locations.filter(
      (
        location
      ) =>
        location.isDeliveryEnabled
    ).length;

  const handleStatusChange =
    async (
      location:
        InventoryLocation
    ) => {
      try {
        await changeInventoryLocationStatus({
          id:
            location.id,

          isActive:
            !location.isActive,
        }).unwrap();

        toast.success(
          location.isActive
            ? "Inventory location deactivated successfully."
            : "Inventory location activated successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to change inventory location status."
          )
        );
      }
    };

  const handleDelete =
    async (
      location:
        InventoryLocation
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${location.name}"?\n\nLocations with inventory balances cannot be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteInventoryLocation(
          location.id
        ).unwrap();

        toast.success(
          "Inventory location deleted successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete inventory location."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white">
                <Warehouse
                  size={
                    19
                  }
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Inventory Locations
                </h1>
              </div>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage hubs, stores, and warehouses used for delivery fulfillment and store pickup.
            </p>
          </div>

          <Link
            href="/admin/inventory-locations/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
          >
            <CirclePlus
              size={
                17
              }
            />

            Add location
          </Link>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total locations"
            value={
              data?.pagination
                ?.total ||
              locations.length
            }
          />

          <SummaryCard
            label="Active"
            value={
              activeCount
            }
          />

          <SummaryCard
            label="Delivery enabled"
            value={
              deliveryCount
            }
          />

          <SummaryCard
            label="Pickup enabled"
            value={
              pickupCount
            }
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
          <div className="grid gap-3 border-b border-[#e1e3e5] p-4 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_auto]">
            <div className="relative">
              <Search
                size={
                  17
                }
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                className="admin-input pl-10"
                placeholder="Search locations..."
              />
            </div>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event.target
                    .value as
                    | "ALL"
                    | InventoryLocationType
                )
              }
              className="admin-input"
            >
              <option value="ALL">
                All types
              </option>

              <option value="HUB">
                Hubs
              </option>

              <option value="STORE">
                Stores
              </option>

              <option value="WAREHOUSE">
                Warehouses
              </option>
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "ALL"
                    | "ACTIVE"
                    | "INACTIVE"
                )
              }
              className="admin-input"
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>

            <select
              value={
                fulfillmentFilter
              }
              onChange={(
                event
              ) =>
                setFulfillmentFilter(
                  event.target
                    .value as
                    | "ALL"
                    | "DELIVERY"
                    | "PICKUP"
                )
              }
              className="admin-input"
            >
              <option value="ALL">
                All fulfillment
              </option>

              <option value="DELIVERY">
                Delivery enabled
              </option>

              <option value="PICKUP">
                Pickup enabled
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                void refetch()
              }
              disabled={
                isFetching
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
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
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <p className="text-sm text-[#6d7175]">
                Loading inventory locations...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold">
                  Unable to load inventory locations
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Check the backend route and inventory-location permissions.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void refetch()
                  }
                  className="mt-5 h-10 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <InventoryLocationList
              locations={
                locations
              }
              isChangingStatus={
                isChangingStatus
              }
              isDeleting={
                isDeleting
              }
              onStatusChange={
                handleStatusChange
              }
              onDelete={
                handleDelete
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#6d7175]">
        {
          label
        }
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#202223]">
        {
          value
        }
      </p>
    </div>
  );
}

function getApiErrorMessage(
  error:
    unknown,
  fallback:
    string
): string {
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
        error?: {
          message?:
            string;
        };

        message?:
          string;
      };
    };

  return (
    apiError.data
      ?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}
