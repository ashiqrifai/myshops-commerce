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
} from "lucide-react";

import {
  toast,
} from "sonner";

import CategoryForm from "@/components/admin/categories/CategoryForm";

import {
  useDeleteCategoryMutation,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
} from "@/store/api/categoryApi";

import type {
  CategoryFormValues,
} from "@/types/category";

export default function EditCategoryPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const categoryId =
    params.id;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetCategoryByIdQuery(
      categoryId,
      {
        skip:
          !categoryId,
      }
    );

  const [
    updateCategory,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdateCategoryMutation();

  const [
    deleteCategory,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteCategoryMutation();

  const category =
    data?.data.category;

  const handleSubmit =
    async (
      values:
        CategoryFormValues
    ) => {
      try {
        await updateCategory({
          id:
            categoryId,

          body:
            values,
        }).unwrap();

        toast.success(
          "Category updated successfully."
        );

        await refetch();
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update category."
          )
        );
      }
    };

  const handleDelete =
    async () => {
      if (!category) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${category.name}"?\n\nCategories containing child categories cannot be deleted.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteCategory(
          category.id
        ).unwrap();

        toast.success(
          "Category deleted successfully."
        );

        router.push(
          "/admin/categories"
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete category."
          )
        );
      }
    };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin" />

          <p className="mt-3 text-sm text-[#6d7175]">
            Loading category...
          </p>
        </div>
      </main>
    );
  }

  if (
    isError ||
    !category
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
        <div className="rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold">
            Category not found
          </h1>

          <p className="mt-2 text-sm text-[#6d7175]">
            The category may have
            been removed or you may
            not have permission to
            access it.
          </p>

          <Link
            href="/admin/categories"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft
              size={16}
            />

            Return to categories
          </Link>
        </div>
      </main>
    );
  }

  const initialValues:
    CategoryFormValues = {
    name:
      category.name,

    slug:
      category.slug,

    parentCategoryId:
      category.parentCategoryId,

    description:
      category.description,

    shortDescription:
      category.shortDescription,

    sortOrder:
      category.sortOrder,

    thumbnailAssetId:
      category.thumbnailAssetId,

    imageAssetId:
      category.imageAssetId,

    bannerAssetId:
      category.bannerAssetId,

    landingPageId:
      category.landingPageId,

    iconName:
      category.iconName,

    iconUrl:
      category.iconUrl,

    isActive:
      category.isActive,

    showInMenu:
      category.showInMenu,

    showOnHome:
      category.showOnHome,

    isFeatured:
      category.isFeatured,

    isSearchable:
      category.isSearchable,

    metaTitle:
      category.metaTitle,

    metaDescription:
      category.metaDescription,

    metaKeywords:
      category.metaKeywords,

    canonicalUrl:
      category.canonicalUrl,

    robotsIndex:
      category.robotsIndex,

    robotsFollow:
      category.robotsFollow,
  };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="border-b border-[#e1e3e5] bg-white">
        <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {category.categoryPath ||
                category.name}
            </p>

            <p className="mt-0.5 font-mono text-xs text-[#6d7175]">
              {category.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFetching && (
              <LoaderCircle
                size={16}
                className="animate-spin text-[#6d7175]"
              />
            )}

            <button
              type="button"
              onClick={
                handleDelete
              }
              disabled={
                isDeleting ||
                isUpdating
              }
              className="flex h-9 items-center gap-2 rounded-lg border border-[#f0b9ad] bg-white px-3 text-sm font-medium text-[#a23b2a] hover:bg-[#fbeae5] disabled:opacity-50"
            >
              {isDeleting ? (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={15}
                />
              )}

              Delete
            </button>
          </div>
        </div>
      </div>

      <CategoryForm
        key={
          category.updatedAt
        }
        initialValues={
          initialValues
        }
        currentCategoryId={
          category.id
        }
        isSaving={
          isUpdating
        }
        submitLabel="Save changes"
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