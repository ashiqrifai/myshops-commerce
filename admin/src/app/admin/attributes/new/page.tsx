"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import AttributeForm from "@/components/admin/attributes/AttributeForm";

import {
  useCreateAttributeMutation,
} from "@/store/api/attributeApi";

import type {
  AttributeFormValues,
} from "@/types/attribute";

export default function CreateAttributePage() {
  const router = useRouter();

  const [
    createAttribute,
    { isLoading },
  ] = useCreateAttributeMutation();

  const handleSubmit = async (
    values: AttributeFormValues
  ) => {
    try {
      await createAttribute(values).unwrap();

      toast.success(
        "Attribute created successfully."
      );

      router.replace("/admin/attributes");
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to create attribute."
        )
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <AttributeForm
        isSaving={isLoading}
        submitLabel="Create attribute"
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
