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

import BrandForm from "@/components/admin/brands/BrandForm";

import {
  useDeleteBrandMutation,
  useGetBrandByIdQuery,
  useUpdateBrandMutation,
} from "@/store/api/brandApi";

import type {
  BrandFormValues,
} from "@/types/brand";

export default function EditBrandPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const brandId =
    params.id;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetBrandByIdQuery(
      brandId,
      {
        skip:
          !brandId,
      }
    );

  const [
    updateBrand,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdateBrandMutation();

  const [
    deleteBrand,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteBrandMutation();

  const brand =
    data?.data;

  const handleSubmit =
    async (
      values:
        BrandFormValues
    ) => {
      try {
        await updateBrand({
          id:
            brandId,

          body:
            values,
        }).unwrap();

        toast.success(
          "Brand updated successfully."
        );

        await refetch();
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update brand."
          )
        );
      }
    };

  const handleDelete =
    async () => {
      if (!brand) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${brand.name}"?\n\nBrands assigned to products cannot be deleted.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteBrand(
          brand.id
        ).unwrap();

        toast.success(
          "Brand deleted successfully."
        );

        router.replace(
          "/admin/brands"
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete brand."
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
            Loading brand...
          </p>
        </div>
      </main>
    );
  }

  if (
    isError ||
    !brand
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
        <div className="rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold">
            Brand not found
          </h1>

          <Link
            href="/admin/brands"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft
              size={16}
            />

            Return to brands
          </Link>
        </div>
      </main>
    );
  }

  const initialValues:
    BrandFormValues = {
    name:
      brand.name,

    code:
      brand.code,

    slug:
      brand.slug,

    description:
      brand.description ||
      null,

    logoAssetId:
      brand.logoAssetId ||
      null,

    bannerAssetId:
      brand.bannerAssetId ||
      null,

    websiteUrl:
      brand.websiteUrl ||
      null,

    countryOfOrigin:
      brand.countryOfOrigin ||
      null,

    isActive:
      brand.isActive,

    isFeatured:
      brand.isFeatured,

    sortOrder:
      brand.sortOrder,

    metaTitle:
      brand.metaTitle ||
      null,

    metaDescription:
      brand.metaDescription ||
      null,

    metaKeywords:
      brand.metaKeywords ||
      null,
  };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="border-b border-[#e1e3e5] bg-white">
        <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {
                brand.name
              }
            </p>

            <p className="mt-0.5 font-mono text-xs text-[#6d7175]">
              {
                brand.id
              }
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

      <BrandForm
        key={
          brand.updatedAt
        }
        initialValues={
          initialValues
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
