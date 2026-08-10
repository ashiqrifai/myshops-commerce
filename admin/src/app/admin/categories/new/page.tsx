"use client";

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
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to create category."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
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