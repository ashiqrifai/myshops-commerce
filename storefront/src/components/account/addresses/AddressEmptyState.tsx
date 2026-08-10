"use client";

import {
  MapPin,
  Plus,
} from "lucide-react";

export default function AddressEmptyState({
  onAdd,
}: {
  onAdd:
    () => void;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-storefront bg-storefront-surface px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-storefront-secondary text-storefront-primary">
        <MapPin
          size={
            30
          }
        />
      </div>

      <h2 className="mt-5 text-xl font-black text-storefront-text">
        No saved addresses yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-storefront-muted">
        Add your first shipping address to make checkout faster.
      </p>

      <button
        type="button"
        onClick={
          onAdd
        }
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white"
      >
        <Plus
          size={
            17
          }
        />

        Add address
      </button>
    </div>
  );
}
