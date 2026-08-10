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

import { toast } from "sonner";

import AttributeForm from "@/components/admin/attributes/AttributeForm";

import {
  useDeleteAttributeMutation,
  useGetAttributeByIdQuery,
  useUpdateAttributeMutation,
} from "@/store/api/attributeApi";

import type {
  AttributeFormValues,
} from "@/types/attribute";

export default function EditAttributePage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();
  const attributeId = params.id;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAttributeByIdQuery(attributeId, {
    skip: !attributeId,
  });

  const [
    updateAttribute,
    { isLoading: isUpdating },
  ] = useUpdateAttributeMutation();

  const [
    deleteAttribute,
    { isLoading: isDeleting },
  ] = useDeleteAttributeMutation();

  const attribute = data?.data;

  const handleSubmit = async (
    values: AttributeFormValues
  ) => {
    try {
      await updateAttribute({
        id: attributeId,
        values,
      }).unwrap();

      toast.success(
        "Attribute updated successfully."
      );

      await refetch();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to update attribute."
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!attribute) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${attribute.name}"?\n\nDo not delete an attribute after products begin using it.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAttribute(attribute.id).unwrap();

      toast.success(
        "Attribute deleted successfully."
      );

      router.replace("/admin/attributes");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to delete attribute."
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
            Loading attribute...
          </p>
        </div>
      </main>
    );
  }

  if (isError || !attribute) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
        <div className="rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold">
            Attribute not found
          </h1>

          <Link
            href="/admin/attributes"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft size={16} />
            Return to attributes
          </Link>
        </div>
      </main>
    );
  }

  const initialValues: AttributeFormValues = {
    name: attribute.name,
    code: attribute.code,
    description: attribute.description || null,
    inputType: attribute.inputType,
    dataType: attribute.dataType,
    unit: attribute.unit || null,
    isVariantDefining:
      attribute.isVariantDefining,
    isFilterable: attribute.isFilterable,
    isSearchable: attribute.isSearchable,
    isComparable: attribute.isComparable,
    isRequired: attribute.isRequired,
    displayOrder: attribute.displayOrder,
    isActive: attribute.isActive,
    options: (attribute.options || []).map(
      (option) => ({
        id: option.id,
        clientId: option.id,
        label: option.label,
        value: option.value,
        swatchValue: option.swatchValue || null,
        displayOrder: option.displayOrder,
        isActive: option.isActive,
      })
    ),
    categoryAssignments: (
      attribute.categoryAssignments || []
    ).map((assignment) => ({
      id: assignment.id,
      categoryId: assignment.categoryId,
      isRequired: assignment.isRequired,
      isFilterable: assignment.isFilterable,
      isVariantDefining:
        assignment.isVariantDefining,
      displayOrder: assignment.displayOrder,
      isActive: assignment.isActive,
    })),
  };

  const categoryNames = (
    attribute.categoryAssignments || []
  )
    .map(
      (assignment) =>
        assignment.category?.name
    )
    .filter(
      (name): name is string => Boolean(name)
    );

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="border-b border-[#e1e3e5] bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {attribute.name}
            </p>

            <p className="mt-0.5 font-mono text-xs text-[#6d7175]">
              {attribute.code}
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
              onClick={handleDelete}
              disabled={isDeleting || isUpdating}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#f0b9ad] bg-white px-3 text-sm font-medium text-[#a23b2a] hover:bg-[#fbeae5] disabled:opacity-50"
            >
              {isDeleting ? (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Trash2 size={15} />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      <AttributeForm
        key={attribute.updatedAt}
        initialValues={initialValues}
        categoryNames={categoryNames}
        isSaving={isUpdating}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </main>
  );
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return fallback;
  }

  const apiError = error as {
    data?: {
      error?: {
        message?: string;
      };
      message?: string;
    };
  };

  return (
    apiError.data?.error?.message ||
    apiError.data?.message ||
    fallback
  );
}
