"use client";

import Link from "next/link";

import {
  MapPin,
  Pencil,
  Power,
  Store,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";

import type {
  InventoryLocation,
} from "@/types/inventoryLocation";

interface Props {
  locations:
    InventoryLocation[];

  isChangingStatus:
    boolean;

  isDeleting:
    boolean;

  onStatusChange:
    (
      location:
        InventoryLocation
    ) => void;

  onDelete:
    (
      location:
        InventoryLocation
    ) => void;
}

const locationIcon =
  (
    location:
      InventoryLocation
  ) => {
    switch (
      location.locationType
    ) {
      case "HUB":
        return Truck;

      case "WAREHOUSE":
        return Warehouse;

      default:
        return Store;
    }
  };

export default function InventoryLocationList({
  locations,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: Props) {
  if (
    !locations.length
  ) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-base font-semibold text-[#202223]">
            No inventory locations found
          </h2>

          <p className="mt-2 text-sm text-[#6d7175]">
            Create your first hub, store, or warehouse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#e1e3e5]">
        <thead className="bg-[#fafbfb]">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Location
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Area
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Fulfillment
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Status
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#e1e3e5] bg-white">
          {locations.map(
            (
              location
            ) => {
              const Icon =
                locationIcon(
                  location
                );

              return (
                <tr
                  key={
                    location.id
                  }
                  className="hover:bg-[#fafbfb]"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-[240px] items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f2f3] text-[#4d5156]">
                        <Icon
                          size={
                            17
                          }
                        />
                      </div>

                      <div>
                        <Link
                          href={`/admin/inventory-locations/${location.id}`}
                          className="font-semibold text-[#202223] hover:underline"
                        >
                          {
                            location.name
                          }
                        </Link>

                        <p className="mt-1 text-xs text-[#6d7175]">
                          {location.code}
                          {" · "}
                          {
                            location.locationType
                          }
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[200px] text-sm text-[#202223]">
                      <p className="flex items-center gap-1.5">
                        <MapPin
                          size={
                            14
                          }
                          className="text-[#8c9196]"
                        />

                        {[
                          location.area,
                          location.city,
                          location.emirate,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            ", "
                          ) ||
                          "—"}
                      </p>

                      {location.addressLine1 ? (
                        <p className="mt-1 max-w-[280px] truncate text-xs text-[#6d7175]">
                          {
                            location.addressLine1
                          }
                        </p>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          location.isDeliveryEnabled
                            ? "bg-blue-50 text-blue-700"
                            : "bg-[#f1f2f3] text-[#8c9196]",
                        ].join(
                          " "
                        )}
                      >
                        Delivery
                      </span>

                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          location.isPickupEnabled
                            ? "bg-violet-50 text-violet-700"
                            : "bg-[#f1f2f3] text-[#8c9196]",
                        ].join(
                          " "
                        )}
                      >
                        Pickup
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        location.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[#f1f2f3] text-[#6d7175]",
                      ].join(
                        " "
                      )}
                    >
                      {location.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/inventory-locations/${location.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#4d5156] hover:bg-[#f6f6f7]"
                        title="Edit location"
                      >
                        <Pencil
                          size={
                            15
                          }
                        />
                      </Link>

                      <button
                        type="button"
                        disabled={
                          isChangingStatus
                        }
                        onClick={() =>
                          onStatusChange(
                            location
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#4d5156] hover:bg-[#f6f6f7] disabled:opacity-50"
                        title={
                          location.isActive
                            ? "Deactivate location"
                            : "Activate location"
                        }
                      >
                        <Power
                          size={
                            15
                          }
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          isDeleting
                        }
                        onClick={() =>
                          onDelete(
                            location
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete location"
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
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}
