"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";

import type {
  InventoryBalance,
} from "@/types/inventory";

interface Props {
  open: boolean;

  balance:
    | InventoryBalance
    | null;

  saving: boolean;

  onClose:
    () => void;

  onSave:
    (values: {
      inventoryLocationId: string;
      productVariantId: string;
      adjustment: number;
      reason?: string;
    }) => Promise<void>;
}

export default function InventoryAdjustmentDialog({
  open,
  balance,
  saving,
  onClose,
  onSave,
}: Props) {
  const [
    adjustment,
    setAdjustment,
  ] =
    useState(
      ""
    );

  const [
    reason,
    setReason,
  ] =
    useState(
      ""
    );

  useEffect(
    () => {
      if (
        open
      ) {
        setAdjustment(
          ""
        );

        setReason(
          ""
        );
      }
    },
    [
      open,
    ]
  );

  if (
    !open ||
    !balance
  ) {
    return null;
  }

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      await onSave({
        inventoryLocationId:
          balance.inventoryLocationId,

        productVariantId:
          balance.productVariantId,

        adjustment:
          Number(
            adjustment
          ),

        reason:
          reason.trim() ||
          undefined,
      });
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e1e3e5] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Adjust inventory
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Use a positive value to add stock and a negative value to reduce stock.
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

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-5"
        >
          <div className="rounded-xl bg-[#f6f6f7] p-4">
            <p className="font-semibold text-[#202223]">
              {
                balance.variant
                  ?.name ||
                balance.variant
                  ?.sku
              }
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              {balance.location
                ?.name}
              {" · "}
              Current on hand:{" "}
              {
                balance.quantityOnHand
              }
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#202223]">
              Adjustment
            </span>

            <input
              type="number"
              step="0.0001"
              value={
                adjustment
              }
              onChange={(
                event
              ) =>
                setAdjustment(
                  event.target
                    .value
                )
              }
              className="admin-input mt-2"
              placeholder="e.g. 5 or -2"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#202223]">
              Reason
            </span>

            <textarea
              value={
                reason
              }
              onChange={(
                event
              ) =>
                setReason(
                  event.target
                    .value
                )
              }
              className="admin-input mt-2 min-h-24 resize-y py-3"
              placeholder="e.g. Initial stock, cycle count adjustment..."
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-[#e1e3e5] pt-5">
            <button
              type="button"
              onClick={
                onClose
              }
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !adjustment ||
                Number(
                  adjustment
                ) ===
                  0
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  size={
                    16
                  }
                  className="animate-spin"
                />
              ) : (
                <Plus
                  size={
                    16
                  }
                />
              )}

              Apply adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
