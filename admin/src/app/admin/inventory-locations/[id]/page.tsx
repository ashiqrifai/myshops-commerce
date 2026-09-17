"use client";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  LoaderCircle,
  Trash2,
  Warehouse,
} from "lucide-react";

import {
  toast,
} from "sonner";

import InventoryLocationForm from "@/components/admin/inventory-locations/InventoryLocationForm";

import {
  useDeleteInventoryLocationMutation,
  useGetInventoryLocationByIdQuery,
  useUpdateInventoryLocationMutation,
} from "@/store/api/inventoryLocationApi";

import type {
  InventoryLocationFormValues,
} from "@/types/inventoryLocation";

export default function InventoryLocationDetailsPage() {
  const params =
    useParams<{
      id:
        string;
    }>();

  const router =
    useRouter();

  const locationId =
    params.id;

  const {
    data,
    isLoading,
    isError,
    refetch,
  } =
    useGetInventoryLocationByIdQuery(
      locationId
    );

  const [
    updateInventoryLocation,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdateInventoryLocationMutation();

  const [
    deleteInventoryLocation,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteInventoryLocationMutation();

  const location =
    data?.data ||
    null;

  const handleSubmit =
    async (
      values:
        InventoryLocationFormValues
    ) => {
      try {
        await updateInventoryLocation({
          id:
            locationId,

          body:
            values,
        }).unwrap();

        toast.success(
          "Inventory location updated successfully."
        );

        void refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update inventory location."
          )
        );
      }
    };

  const handleDelete =
    async () => {
      if (
        !location
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${location.name}"?\n\nLocations with inventory balances cannot be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteInventoryLocation(
          location.id
        ).unwrap();

        toast.success(
          "Inventory location deleted successfully."
        );

        router.push(
          "/admin/inventory-locations"
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete inventory location."
          )
        );
      }
    };

  if (
    isLoading
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#f6f6f7]">
        <div className="flex items-center gap-3 text-sm text-[#6d7175]">
          <LoaderCircle
            size={
              18
            }
            className="animate-spin"
          />

          Loading inventory location...
        </div>
      </div>
    );
  }

  if (
    isError ||
    !location
  ) {
    return (
      <main className="min-h-screen bg-[#f6f6f7]">
        <div className="mx-auto max-w-[900px] px-5 py-8">
          <h1 className="text-xl font-semibold">
            Unable to load inventory location
          </h1>

          <Link
            href="/admin/inventory-locations"
            className="mt-4 inline-block text-sm font-semibold text-[#005bd3] hover:underline"
          >
            Back to inventory locations
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <button
            type="button"
            disabled={
              isDeleting
            }
            onClick={
              handleDelete
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? (
              <LoaderCircle
                size={
                  16
                }
                className="animate-spin"
              />
            ) : (
              <Trash2
                size={
                  16
                }
              />
            )}

            Delete location
          </button>
        </div>

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
                {
                  location.name
                }
              </h1>

              <p className="mt-1 text-sm text-[#6d7175]">
                {location.code}
                {" · "}
                {
                  location.locationType
                }
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <InventoryLocationForm
            location={
              location
            }
            submitting={
              isUpdating
            }
            submitLabel="Save changes"
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
