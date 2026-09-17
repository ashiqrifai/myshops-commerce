"use client";

import {
  Suspense,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  toast,
} from "sonner";

import CategoryForm from "@/components/admin/categories/CategoryForm";

import {
  useCreateCategoryMutation,
} from "@/store/api/categoryApi";

import type {
  CategoryFormValues,
} from "@/types/category";

export default function CreateCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <p className="text-sm text-[#6d7175]">
            Loading category form...
          </p>
        </div>
      }
    >
      <CreateCategoryPageContent />
    </Suspense>
  );
}

function CreateCategoryPageContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const parentCategoryId =
    searchParams.get(
      "parentCategoryId"
    );

  const [
    createCategory,
    {
      isLoading,
    },
  ] =
    useCreateCategoryMutation();

  const handleSubmit =
    async (
      values:
        CategoryFormValues
    ) => {
      try {
        await createCategory({
          ...values,

          parentCategoryId:
            values.parentCategoryId ||
            parentCategoryId ||
            null,
        }).unwrap();

        toast.success(
          "Category created successfully."
        );

        router.replace(
          "/admin/categories"
        );

        router.refresh();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to create category."
          )
        );
      }
    };

  return (
    <CategoryForm
      initialValues={{
        parentCategoryId:
          parentCategoryId ||
          null,
      }}
      isSaving={
        isLoading
      }
      submitLabel="Create category"
      onSubmit={
        handleSubmit
      }
    />
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