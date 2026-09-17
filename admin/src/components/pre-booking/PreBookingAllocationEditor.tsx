"use client";

import {
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useCreatePreBookingAllocationMutation,
  useCreatePreBookingProductAllocationMutation,
  useDeletePreBookingAllocationMutation,
  useUpdatePreBookingAllocationMutation,
} from "@/store/api/preBookingApi";

import type {
  PreBookingAllocation,
} from "@/types/preBooking";

import type {
  ProductVariant,
} from "@/types/product";

interface PreBookingAllocationEditorProps {
  mode:
    | "PRODUCT"
    | "BUNDLE";

  campaignProductId:
    string;

  bundleId?:
    | string
    | null;

  variants?:
    ProductVariant[];

  allocations:
    PreBookingAllocation[];

  onChanged?:
    () => void;
}

const toDateTimeLocalValue = (
  value?:
    | string
    | null
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset *
        60 *
        1000
  )
    .toISOString()
    .slice(
      0,
      16
    );
};

const toIsoValue = (
  value: string
) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
};

export default function PreBookingAllocationEditor({
  mode,
  campaignProductId,
  bundleId,
  variants = [],
  allocations,
  onChanged,
}: PreBookingAllocationEditorProps) {
  const [
    creating,
    setCreating,
  ] =
    useState(
      false
    );

  const [
    createProductAllocation,
    {
      isLoading:
        creatingProductAllocation,
    },
  ] =
    useCreatePreBookingProductAllocationMutation();

  const [
    createBundleAllocation,
    {
      isLoading:
        creatingBundleAllocation,
    },
  ] =
    useCreatePreBookingAllocationMutation();

  const [
    updateAllocation,
  ] =
    useUpdatePreBookingAllocationMutation();

  const [
    deleteAllocation,
  ] =
    useDeletePreBookingAllocationMutation();

  const isCreating =
    creatingProductAllocation ||
    creatingBundleAllocation;

  const sortedAllocations =
    useMemo(
      () =>
        [
          ...allocations,
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              a.sortOrder ||
              0
            ) -
            Number(
              b.sortOrder ||
              0
            )
        ),
      [
        allocations,
      ]
    );

  const create =
    async (
      values:
        AllocationFormValues
    ) => {
      try {
        const body = {
          productVariantId:
            values.productVariantId ||
            null,

          allocationQuantity:
            values.allocationQuantity,

          availableFrom:
            toIsoValue(
              values.availableFrom
            ),

          availableUntil:
            toIsoValue(
              values.availableUntil
            ),

          expectedStockFrom:
            toIsoValue(
              values.expectedStockFrom
            ),

          expectedStockUntil:
            toIsoValue(
              values.expectedStockUntil
            ),

          note:
            values.note.trim() ||
            null,

          isActive:
            values.isActive,

          sortOrder:
            values.sortOrder,
        };

        if (
          mode ===
          "PRODUCT"
        ) {
          await createProductAllocation({
            campaignProductId,
            body,
          }).unwrap();
        } else {
          if (!bundleId) {
            window.alert(
              "Bundle ID is required."
            );

            return;
          }

          await createBundleAllocation({
            bundleId,
            body,
          }).unwrap();
        }

        setCreating(
          false
        );

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to create allocation."
        );
      }
    };

  const update =
    async (
      allocationId:
        string,
      values:
        AllocationFormValues
    ) => {
      try {
        await updateAllocation({
          allocationId,

          body: {
            productVariantId:
              values.productVariantId ||
              null,

            allocationQuantity:
              values.allocationQuantity,

            availableFrom:
              toIsoValue(
                values.availableFrom
              ),

            availableUntil:
              toIsoValue(
                values.availableUntil
              ),

            expectedStockFrom:
              toIsoValue(
                values.expectedStockFrom
              ),

            expectedStockUntil:
              toIsoValue(
                values.expectedStockUntil
              ),

            note:
              values.note.trim() ||
              null,

            isActive:
              values.isActive,

            sortOrder:
              values.sortOrder,
          },
        }).unwrap();

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to update allocation."
        );
      }
    };

  const remove =
    async (
      allocation:
        PreBookingAllocation
    ) => {
      const confirmed =
        window.confirm(
          "Delete this allocation?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteAllocation(
          allocation.id
        ).unwrap();

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to delete allocation."
        );
      }
    };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#202223]">
            Allocation
          </h4>

          <p className="mt-1 text-xs text-[#6d7175]">
            {mode ===
            "PRODUCT"
              ? "Product-level allocation used when no bundle is required."
              : "Stock allocation for this bundle."}
          </p>
        </div>

        {!creating ? (
          <button
            type="button"
            onClick={() =>
              setCreating(
                true
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-xs font-semibold text-[#202223] hover:bg-[#f6f6f7]"
          >
            <Plus
              size={
                15
              }
            />

            Add allocation
          </button>
        ) : null}
      </div>

      {creating ? (
        <AllocationForm
          variants={
            variants
          }
          isSaving={
            isCreating
          }
          onCancel={() =>
            setCreating(
              false
            )
          }
          onSave={
            create
          }
        />
      ) : null}

      {sortedAllocations.length ===
      0 ? (
        <div className="rounded-lg border border-dashed border-[#babfc3] bg-[#fafbfb] p-5 text-center text-xs text-[#6d7175]">
          No allocation configured yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAllocations.map(
            (
              allocation
            ) => (
              <ExistingAllocation
                key={
                  allocation.id
                }
                allocation={
                  allocation
                }
                variants={
                  variants
                }
                onSave={(
                  values
                ) =>
                  update(
                    allocation.id,
                    values
                  )
                }
                onDelete={() =>
                  remove(
                    allocation
                  )
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

interface AllocationFormValues {
  productVariantId:
    string;

  allocationQuantity:
    number;

  availableFrom:
    string;

  availableUntil:
    string;

  expectedStockFrom:
    string;

  expectedStockUntil:
    string;

  note:
    string;

  isActive:
    boolean;

  sortOrder:
    number;
}

function ExistingAllocation({
  allocation,
  variants,
  onSave,
  onDelete,
}: {
  allocation:
    PreBookingAllocation;

  variants:
    ProductVariant[];

  onSave: (
    values:
      AllocationFormValues
  ) => Promise<void>;

  onDelete:
    () => void;
}) {
  const [
    editing,
    setEditing,
  ] =
    useState(
      false
    );

  if (
    editing
  ) {
    return (
      <AllocationForm
        initialValues={{
          productVariantId:
            allocation
              .productVariantId ||
            "",

          allocationQuantity:
            Number(
              allocation
                .allocationQuantity ||
              0
            ),

          availableFrom:
            toDateTimeLocalValue(
              allocation
                .availableFrom
            ),

          availableUntil:
            toDateTimeLocalValue(
              allocation
                .availableUntil
            ),

          expectedStockFrom:
            toDateTimeLocalValue(
              allocation
                .expectedStockFrom
            ),

          expectedStockUntil:
            toDateTimeLocalValue(
              allocation
                .expectedStockUntil
            ),

          note:
            allocation.note ||
            "",

          isActive:
            allocation.isActive,

          sortOrder:
            Number(
              allocation.sortOrder ||
              0
            ),
        }}
        variants={
          variants
        }
        onCancel={() =>
          setEditing(
            false
          )
        }
        onSave={async (
          values
        ) => {
          await onSave(
            values
          );

          setEditing(
            false
          );
        }}
      />
    );
  }

  const variant =
    variants.find(
      (
        item
      ) =>
        item.id ===
        allocation
          .productVariantId
    );

  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#202223]">
            {variant
              ? `${variant.name} · ${variant.sku}`
              : "All / Default variant"}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
              Allocated{" "}
              {
                allocation
                  .allocationQuantity
              }
            </span>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
              Reserved{" "}
              {
                allocation
                  .reservedQuantity
              }
            </span>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              Confirmed{" "}
              {
                allocation
                  .confirmedQuantity
              }
            </span>

            <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 font-semibold text-[#4a4d50]">
              Available{" "}
              {
                allocation
                  .availableQuantity
              }
            </span>
          </div>

          <p className="mt-3 text-xs text-[#6d7175]">
            Availability:{" "}
            {
              allocation.availableFrom
                ? new Date(
                    allocation.availableFrom
                  ).toLocaleString()
                : "No start"
            }{" "}
            →{" "}
            {
              allocation.availableUntil
                ? new Date(
                    allocation.availableUntil
                  ).toLocaleString()
                : "No end"
            }
          </p>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              setEditing(
                true
              )
            }
            className="h-9 rounded-lg border border-[#babfc3] px-3 text-xs font-semibold hover:bg-[#f6f6f7]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
          >
            <Trash2
              size={
                15
              }
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AllocationForm({
  initialValues,
  variants,
  isSaving = false,
  onSave,
  onCancel,
}: {
  initialValues?:
    AllocationFormValues;

  variants:
    ProductVariant[];

  isSaving?:
    boolean;

  onSave: (
    values:
      AllocationFormValues
  ) => Promise<void>;

  onCancel:
    () => void;
}) {
  const [
    values,
    setValues,
  ] =
    useState<AllocationFormValues>(
      initialValues || {
        productVariantId:
          "",

        allocationQuantity:
          0,

        availableFrom:
          "",

        availableUntil:
          "",

        expectedStockFrom:
          "",

        expectedStockUntil:
          "",

        note:
          "",

        isActive:
          true,

        sortOrder:
          0,
      }
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const busy =
    isSaving ||
    saving;

  const set = <
    K extends keyof AllocationFormValues,
  >(
    field: K,
    value:
      AllocationFormValues[K]
  ) => {
    setValues(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const submit =
    async () => {
      if (
        values.allocationQuantity <
        0
      ) {
        window.alert(
          "Allocation quantity cannot be negative."
        );

        return;
      }

      if (
        values.availableFrom &&
        values.availableUntil &&
        new Date(
          values.availableUntil
        ) <
          new Date(
            values.availableFrom
          )
      ) {
        window.alert(
          "Availability end date cannot be earlier than the start date."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        await onSave(
          values
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <div className="rounded-xl border border-[#d8dde3] bg-[#fafbfb] p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            Variant
          </FieldLabel>

          <select
            value={
              values
                .productVariantId
            }
            onChange={(
              event
            ) =>
              set(
                "productVariantId",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          >
            <option value="">
              All / Default variant
            </option>

            {variants.map(
              (
                variant
              ) => (
                <option
                  key={
                    variant.id ||
                    variant.sku
                  }
                  value={
                    variant.id ||
                    ""
                  }
                >
                  {
                    variant.name
                  }{" "}
                  —{" "}
                  {
                    variant.sku
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <FieldLabel>
            Allocation quantity
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            value={
              values
                .allocationQuantity
            }
            onChange={(
              event
            ) =>
              set(
                "allocationQuantity",
                Math.max(
                  0,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    0
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Available from
          </FieldLabel>

          <input
            type="datetime-local"
            value={
              values
                .availableFrom
            }
            onChange={(
              event
            ) =>
              set(
                "availableFrom",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Available until
          </FieldLabel>

          <input
            type="datetime-local"
            value={
              values
                .availableUntil
            }
            onChange={(
              event
            ) =>
              set(
                "availableUntil",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Expected stock from
          </FieldLabel>

          <input
            type="datetime-local"
            value={
              values
                .expectedStockFrom
            }
            onChange={(
              event
            ) =>
              set(
                "expectedStockFrom",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Expected stock until
          </FieldLabel>

          <input
            type="datetime-local"
            value={
              values
                .expectedStockUntil
            }
            onChange={(
              event
            ) =>
              set(
                "expectedStockUntil",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Sort order
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            value={
              values
                .sortOrder
            }
            onChange={(
              event
            ) =>
              set(
                "sortOrder",
                Math.max(
                  0,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    0
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div className="flex items-end">
          <label className="flex h-11 w-full items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-4">
            <input
              type="checkbox"
              checked={
                values
                  .isActive
              }
              onChange={(
                event
              ) =>
                set(
                  "isActive",
                  event
                    .target
                    .checked
                )
              }
            />

            <span className="text-sm font-medium">
              Active
            </span>
          </label>
        </div>

        <div className="md:col-span-2">
          <FieldLabel>
            Note
          </FieldLabel>

          <textarea
            rows={
              2
            }
            value={
              values.note
            }
            onChange={(
              event
            ) =>
              set(
                "note",
                event
                  .target
                  .value
              )
            }
            className="admin-input min-h-[80px]"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={
            onCancel
          }
          disabled={
            busy
          }
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={
            submit
          }
          disabled={
            busy
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle
              size={
                16
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                16
              }
            />
          )}

          Save allocation
        </button>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#202223]">
      {
        children
      }
    </label>
  );
}