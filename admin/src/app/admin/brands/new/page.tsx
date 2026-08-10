"use client";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import BrandForm from "@/components/admin/brands/BrandForm";

import {
  useCreateBrandMutation,
} from "@/store/api/brandApi";

import type {
  BrandFormValues,
} from "@/types/brand";

export default function CreateBrandPage() {
  const router =
    useRouter();

  const [
    createBrand,
    {
      isLoading,
    },
  ] =
    useCreateBrandMutation();

  const handleSubmit =
    async (
      values:
        BrandFormValues
    ) => {
      try {
        await createBrand(
          values
        ).unwrap();

        toast.success(
          "Brand created successfully."
        );

        router.replace(
          "/admin/brands"
        );

        router.refresh();
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to create brand."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <BrandForm
        isSaving={
          isLoading
        }
        submitLabel="Create brand"
        onSubmit={
          handleSubmit
        }
      />
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
    error === null
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
    apiError.data?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}
