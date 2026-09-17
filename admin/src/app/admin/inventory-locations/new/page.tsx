"use client";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Warehouse,
} from "lucide-react";

import {
  toast,
} from "sonner";

import InventoryLocationForm from "@/components/admin/inventory-locations/InventoryLocationForm";

import {
  useCreateInventoryLocationMutation,
} from "@/store/api/inventoryLocationApi";

import type {
  InventoryLocationFormValues,
} from "@/types/inventoryLocation";

export default function NewInventoryLocationPage() {
  const router =
    useRouter();

  const [
    createInventoryLocation,
    {
      isLoading,
    },
  ] =
    useCreateInventoryLocationMutation();

  const handleSubmit =
    async (
      values:
        InventoryLocationFormValues
    ) => {
      try {
        const result =
          await createInventoryLocation(
            values
          ).unwrap();

        toast.success(
          "Inventory location created successfully."
        );

        router.push(
          `/admin/inventory-locations/${result.data.id}`
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to create inventory location."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8">
        <Link
          href="/admin/inventory-locations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#005bd3] hover:underline"
        >
          <ArrowLeft
            size={
              16
            }
          />

          Back to inventory locations
        </Link>

        <header className="mt-5">
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
                Add inventory location
              </h1>

              <p className="mt-1 text-sm text-[#6d7175]">
                Create a hub, store, or warehouse for fulfillment.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <InventoryLocationForm
            submitting={
              isLoading
            }
            submitLabel="Create location"
            onSubmit={
              handleSubmit
            }
          />
        </div>
      </div>
    </main>
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
