"use client";

import {
  LoaderCircle,
  X,
} from "lucide-react";

import type {
  InventoryVariantAvailability,
} from "@/types/inventory";

interface Props {
  open: boolean;
  loading: boolean;

  data:
    | InventoryVariantAvailability
    | null;

  variantLabel:
    string;

  onClose:
    () => void;
}

export default function VariantAvailabilityDialog({
  open,
  loading,
  data,
  variantLabel,
  onClose,
}: Props) {
  if (
    !open
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e1e3e5] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Consolidated availability
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              {
                variantLabel
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
          >
            <X
              size={
                18
              }
            />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <LoaderCircle
              size={
                22
              }
              className="animate-spin text-[#6d7175]"
            />
          </div>
        ) : data ? (
          <div className="max-h-[70vh] overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Summary
                label="Fulfillment"
                value={
                  data.fulfillmentType
                }
              />

              <Summary
                label="Status"
                value={
                  data.status
                }
              />

              <Summary
                label="Consolidated qty"
                value={
                  data.quantity ===
                  null
                    ? "Unlimited"
                    : String(
                        data.quantity
                      )
                }
              />
            </div>

            {data.fulfillmentType ===
            "DIRECT_DELIVERY" ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This variant belongs to a supplier-direct product, so internal inventory is not tracked.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-xl border border-[#e1e3e5]">
                <table className="min-w-full divide-y divide-[#e1e3e5]">
                  <thead className="bg-[#fafbfb]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#6d7175]">
                        Location
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[#6d7175]">
                        On hand
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[#6d7175]">
                        Reserved
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[#6d7175]">
                        Available
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e1e3e5]">
                    {data.locations.map(
                      (
                        location
                      ) => (
                        <tr
                          key={
                            location.inventoryLocationId
                          }
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-[#202223]">
                              {
                                location.locationName
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#6d7175]">
                              {location.locationCode}
                              {" · "}
                              {location.locationType}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-right text-sm">
                            {
                              location.quantityOnHand
                            }
                          </td>

                          <td className="px-4 py-3 text-right text-sm">
                            {
                              location.quantityReserved
                            }
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold">
                            {
                              location.quantityAvailable
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#6d7175]">
            Unable to load availability.
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
        {
          label
        }
      </p>

      <p className="mt-1 font-semibold text-[#202223]">
        {
          value
        }
      </p>
    </div>
  );
}
