"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LoaderCircle,
  Save,
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
      quantityOnHand: number;
      quantityReserved: number;
    }) => Promise<void>;
}

export default function InventoryBalanceDialog({
  open,
  balance,
  saving,
  onClose,
  onSave,
}: Props) {
  const [
    onHand,
    setOnHand,
  ] =
    useState(
      ""
    );

  const [
    reserved,
    setReserved,
  ] =
    useState(
      ""
    );

  useEffect(
    () => {
      if (
        !open ||
        !balance
      ) {
        return;
      }

      setOnHand(
        String(
          balance.quantityOnHand
        )
      );

      setReserved(
        String(
          balance.quantityReserved
        )
      );
    },
    [
      open,
      balance,
    ]
  );

  const available =
    useMemo(
      () => {
        const onHandNumber =
          Number(
            onHand ||
            0
          );

        const reservedNumber =
          Number(
            reserved ||
            0
          );

        return Math.max(
          0,
          onHandNumber -
          reservedNumber
        );
      },
      [
        onHand,
        reserved,
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

        quantityOnHand:
          Number(
            onHand ||
            0
          ),

        quantityReserved:
          Number(
            reserved ||
            0
          ),
      });
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e1e3e5] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Edit inventory balance
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              {
                balance.variant
                  ?.name ||
                balance.variant
                  ?.sku
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

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-5"
        >
          <div className="rounded-xl bg-[#f6f6f7] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Location
            </p>

            <p className="mt-1 font-semibold text-[#202223]">
              {
                balance.location
                  ?.name ||
                "Unknown location"
              }
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              {
                balance.location
                  ?.code ||
                ""
              }
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-[#202223]">
                On hand
              </span>

              <input
                type="number"
                min={
                  0
                }
                step="0.0001"
                value={
                  onHand
                }
                onChange={(
                  event
                ) =>
                  setOnHand(
                    event.target
                      .value
                  )
                }
                className="admin-input mt-2"
                required
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-[#202223]">
                Reserved
              </span>

              <input
                type="number"
                min={
                  0
                }
                step="0.0001"
                value={
                  reserved
                }
                onChange={(
                  event
                ) =>
                  setReserved(
                    event.target
                      .value
                  )
                }
                className="admin-input mt-2"
                required
              />
            </label>
          </div>

          <div className="rounded-xl border border-[#e1e3e5] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
              Available
            </p>

            <p className="mt-1 text-2xl font-semibold text-[#202223]">
              {
                available
              }
            </p>
          </div>

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
                saving
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
                <Save
                  size={
                    16
                  }
                />
              )}

              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
