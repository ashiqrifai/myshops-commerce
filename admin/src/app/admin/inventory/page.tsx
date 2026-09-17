"use client";
import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  CirclePlus,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Download,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  useGetInventoryLocationsQuery,
} from "@/store/api/inventoryLocationApi";

import {
  useAdjustInventoryOnHandMutation,
  useGetInventoryQuery,
  useLazyGetVariantAvailabilityQuery,
  useUpsertInventoryBalanceMutation,
} from "@/store/api/inventoryApi";

import InventoryAdjustmentDialog from "@/components/admin/inventory/InventoryAdjustmentDialog";
import InventoryBalanceDialog from "@/components/admin/inventory/InventoryBalanceDialog";
import NewInventoryBalanceDialog from "@/components/admin/inventory/NewInventoryBalanceDialog";
import VariantAvailabilityDialog from "@/components/admin/inventory/VariantAvailabilityDialog";

import type {
  InventoryBalance,
  InventoryVariantAvailability,
} from "@/types/inventory";

export default function InventoryPage() {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    locationId,
    setLocationId,
  ] =
    useState(
      ""
    );

  const [
    onlyAvailable,
    setOnlyAvailable,
  ] =
    useState(
      false
    );

  const [
    editBalance,
    setEditBalance,
  ] =
    useState<
      InventoryBalance |
      null
    >(
      null
    );

  const [
    adjustBalance,
    setAdjustBalance,
  ] =
    useState<
      InventoryBalance |
      null
    >(
      null
    );

  const [
    addOpen,
    setAddOpen,
  ] =
    useState(
      false
    );

  const [
    availabilityOpen,
    setAvailabilityOpen,
  ] =
    useState(
      false
    );

  const [
    availability,
    setAvailability,
  ] =
    useState<
      InventoryVariantAvailability |
      null
    >(
      null
    );

  const [
    availabilityVariantLabel,
    setAvailabilityVariantLabel,
  ] =
    useState(
      ""
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

        inventoryLocationId:
          locationId ||
          undefined,

        onlyAvailable:
          onlyAvailable ||
          undefined,
      }),
      [
        search,
        locationId,
        onlyAvailable,
      ]
    );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetInventoryQuery(
      queryParams
    );

  const {
    data:
      locationData,
  } =
    useGetInventoryLocationsQuery({
      page:
        1,

      pageSize:
        200,

      isActive:
        true,

      sortBy:
        "sortOrder",

      sortDirection:
        "ASC",
    });

  const [
    upsertBalance,
    {
      isLoading:
        isSavingBalance,
    },
  ] =
    useUpsertInventoryBalanceMutation();

  const [
    adjustOnHand,
    {
      isLoading:
        isAdjusting,
    },
  ] =
    useAdjustInventoryOnHandMutation();

  const [
    loadAvailability,
    {
      isFetching:
        isLoadingAvailability,
    },
  ] =
    useLazyGetVariantAvailabilityQuery();

  const balances =
    data?.data ||
    [];

  const locations =
    locationData
      ?.data ||
    [];

  const totalOnHand =
    balances.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantityOnHand ||
          0
        ),
      0
    );

  const totalReserved =
    balances.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantityReserved ||
          0
        ),
      0
    );

  const totalAvailable =
    balances.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantityAvailable ||
          0
        ),
      0
    );

  const saveBalance =
    async (
      values: {
        inventoryLocationId:
          string;

        productVariantId:
          string;

        quantityOnHand:
          number;

        quantityReserved:
          number;
      }
    ) => {
      try {
        await upsertBalance(
          values
        ).unwrap();

        toast.success(
          "Inventory balance saved successfully."
        );

        setEditBalance(
          null
        );

        setAddOpen(
          false
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to save inventory balance."
          )
        );
      }
    };

  const saveAdjustment =
    async (
      values: {
        inventoryLocationId:
          string;

        productVariantId:
          string;

        adjustment:
          number;

        reason?:
          string;
      }
    ) => {
      try {
        await adjustOnHand(
          values
        ).unwrap();

        toast.success(
          "Inventory adjusted successfully."
        );

        setAdjustBalance(
          null
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to adjust inventory."
          )
        );
      }
    };

  const showAvailability =
    async (
      balance:
        InventoryBalance
    ) => {
      try {
        setAvailabilityVariantLabel(
          `${balance.variant?.sku || ""} · ${balance.variant?.name || ""}`
        );

        setAvailabilityOpen(
          true
        );

        setAvailability(
          null
        );

        const result =
          await loadAvailability(
            balance.productVariantId
          ).unwrap();

        setAvailability(
          result.data
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to load consolidated availability."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1550px] px-5 py-6 md:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white">
                <Boxes
                  size={
                    19
                  }
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Inventory
                </h1>
              </div>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage variant stock by location. Website availability will later use the consolidated available quantity across eligible locations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
  <Link
    href="/admin/inventory/import"
    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] shadow-sm transition hover:bg-[#f6f6f7]"
  >
    <Upload
      size={
        16
      }
    />

    Import CSV
  </Link>

  <a
    href={`${process.env.NEXT_PUBLIC_API_URL || ""}/inventory-import/export`}
    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] shadow-sm transition hover:bg-[#f6f6f7]"
  >
    <Download
      size={
        16
      }
    />

    Export CSV
  </a>

  <button
    type="button"
    onClick={() =>
      setAddOpen(
        true
      )
    }
    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a1a1a]"
  >
    <CirclePlus
      size={
        17
      }
    />

    Add inventory
  </button>
</div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Balance rows"
            value={
              data?.pagination
                ?.total ||
              balances.length
            }
          />

          <SummaryCard
            label="On hand"
            value={
              totalOnHand
            }
          />

          <SummaryCard
            label="Reserved"
            value={
              totalReserved
            }
          />

          <SummaryCard
            label="Available"
            value={
              totalAvailable
            }
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
          <div className="grid gap-3 border-b border-[#e1e3e5] p-4 lg:grid-cols-[minmax(280px,1fr)_240px_180px_auto]">
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
                placeholder="Search SKU, barcode or variant..."
              />
            </div>

            <select
              value={
                locationId
              }
              onChange={(
                event
              ) =>
                setLocationId(
                  event.target
                    .value
                )
              }
              className="admin-input"
            >
              <option value="">
                All locations
              </option>

              {locations.map(
                (
                  location
                ) => (
                  <option
                    key={
                      location.id
                    }
                    value={
                      location.id
                    }
                  >
                    {location.name}
                    {" · "}
                    {location.locationType}
                  </option>
                )
              )}
            </select>

            <label className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm">
              <input
                type="checkbox"
                checked={
                  onlyAvailable
                }
                onChange={(
                  event
                ) =>
                  setOnlyAvailable(
                    event.target
                      .checked
                  )
                }
              />

              Available only
            </label>

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
            <div className="flex min-h-[360px] items-center justify-center text-sm text-[#6d7175]">
              Loading inventory...
            </div>
          ) : isError ? (
            <div className="flex min-h-[360px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold">
                  Unable to load inventory
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Check the inventory API route and permissions.
                </p>
              </div>
            </div>
          ) : !balances.length ? (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold text-[#202223]">
                  No inventory balances found
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  Click Add inventory to create the first location balance.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e1e3e5]">
                <thead className="bg-[#fafbfb]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Product / Variant
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Location
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      On hand
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Reserved
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Available
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e1e3e5] bg-white">
                  {balances.map(
                    (
                      balance
                    ) => (
                      <tr 
                        key={
                          balance.id
                        }
                        className="hover:bg-[#fafbfb]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#202223]">
                            {
                              balance.variant
                                ?.product
                                ?.name ||
                              "Product"
                            }
                          </p>

                          <p className="mt-1 text-sm text-[#4d5156]">
                            {
                              balance.variant
                                ?.name ||
                              "Variant"
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#6d7175]">
                            SKU:{" "}
                            {
                              balance.variant
                                ?.sku ||
                              "—"
                            }

                            {balance.variant
                              ?.barcode
                              ? ` · Barcode: ${balance.variant.barcode}`
                              : ""}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#202223]">
                            {
                              balance.location
                                ?.name ||
                              "—"
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#6d7175]">
                            {balance.location
                              ?.code}
                            {" · "}
                            {balance.location
                              ?.locationType}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right text-sm">
                          {
                            balance.quantityOnHand
                          }
                        </td>

                        <td className="px-5 py-4 text-right text-sm">
                          {
                            balance.quantityReserved
                          }
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className={[
                              "inline-flex min-w-16 justify-center rounded-full px-2.5 py-1 text-sm font-semibold",
                              balance.quantityAvailable >
                              0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700",
                            ].join(
                              " "
                            )}
                          >
                            {
                              balance.quantityAvailable
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void showAvailability(
                                  balance
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#4d5156] hover:bg-[#f6f6f7]"
                              title="View consolidated availability"
                            >
                              <Eye
                                size={
                                  15
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEditBalance(
                                  balance
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#4d5156] hover:bg-[#f6f6f7]"
                              title="Edit balance"
                            >
                              <Pencil
                                size={
                                  15
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setAdjustBalance(
                                  balance
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#4d5156] hover:bg-[#f6f6f7]"
                              title="Adjust on-hand quantity"
                            >
                              <Plus
                                size={
                                  15
                                }
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <NewInventoryBalanceDialog
        open={
          addOpen
        }
        saving={
          isSavingBalance
        }
        onClose={() =>
          setAddOpen(
            false
          )
        }
        onSave={
          saveBalance
        }
      />

      <InventoryBalanceDialog
        open={
          Boolean(
            editBalance
          )
        }
        balance={
          editBalance
        }
        saving={
          isSavingBalance
        }
        onClose={() =>
          setEditBalance(
            null
          )
        }
        onSave={
          saveBalance
        }
      />

      <InventoryAdjustmentDialog
        open={
          Boolean(
            adjustBalance
          )
        }
        balance={
          adjustBalance
        }
        saving={
          isAdjusting
        }
        onClose={() =>
          setAdjustBalance(
            null
          )
        }
        onSave={
          saveAdjustment
        }
      />

      <VariantAvailabilityDialog
        open={
          availabilityOpen
        }
        loading={
          isLoadingAvailability
        }
        data={
          availability
        }
        variantLabel={
          availabilityVariantLabel
        }
        onClose={() =>
          setAvailabilityOpen(
            false
          )
        }
      />
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
