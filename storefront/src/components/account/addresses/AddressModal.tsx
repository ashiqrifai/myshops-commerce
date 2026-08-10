"use client";

import {
  X,
} from "lucide-react";

import AddressForm from "./AddressForm";

import type {
  CustomerAddress,
  CustomerAddressFieldError,
  CustomerAddressInput,
} from "@/types/customerAddress";

export default function AddressModal({
  open,
  address,
  submitting,
  serverErrors,
  onClose,
  onSubmit,
}: {
  open: boolean;
  address:
    CustomerAddress |
    null;
  submitting: boolean;
  serverErrors:
    CustomerAddressFieldError[];
  onClose:
    () => void;
  onSubmit:
    (
      input:
        CustomerAddressInput
    ) =>
      Promise<void>;
}) {
  if (
    !open
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/45 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl rounded-[24px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-[24px] border-b border-storefront bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-black text-storefront-text">
              {address
                ? "Edit address"
                : "Add address"}
            </h2>

            <p className="mt-1 text-sm text-storefront-muted">
              Add accurate delivery details to avoid delays.
            </p>
          </div>

          <button
            type="button"
            disabled={
              submitting
            }
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-storefront-secondary"
          >
            <X
              size={
                20
              }
            />
          </button>
        </div>

        <div className="p-6">
          <AddressForm
            key={
              address?.id ||
              "new-address"
            }
            address={
              address
            }
            submitting={
              submitting
            }
            serverErrors={
              serverErrors
            }
            onSubmit={
              onSubmit
            }
          />
        </div>
      </div>
    </div>
  );
}
