"use client";

import {
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

export default function AddressDeleteDialog({
  open,
  label,
  deleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  label: string;
  deleting: boolean;
  onCancel:
    () => void;
  onConfirm:
    () => void;
}) {
  if (
    !open
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-storefront-text">
              Delete address?
            </h2>

            <p className="mt-2 text-sm leading-6 text-storefront-muted">
              “{
                label
              }” will be removed from your saved addresses.
            </p>
          </div>

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onCancel
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-storefront-secondary"
          >
            <X
              size={
                18
              }
            />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onCancel
            }
            className="h-11 rounded-storefront-button border border-storefront px-5 text-sm font-black"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onConfirm
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-storefront-button bg-red-600 px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {deleting ? (
              <LoaderCircle
                size={
                  17
                }
                className="animate-spin"
              />
            ) : (
              <Trash2
                size={
                  17
                }
              />
            )}

            {deleting
              ? "Deleting..."
              : "Delete address"}
          </button>
        </div>
      </div>
    </div>
  );
}
