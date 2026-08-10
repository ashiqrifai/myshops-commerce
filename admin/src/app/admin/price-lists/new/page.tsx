"use client";

import { useRouter } from "next/navigation";

import { PriceListForm } from "@/components/admin/pricing";
import { useCreatePriceListMutation } from "@/store/api/priceListApi";

import type { PriceListFormValues } from "@/types/priceList";

const PRICE_LISTS_PATH =
  "/admin/price-lists";

export default function CreatePriceListPage() {
  const router = useRouter();

  const [
    createPriceList,
    { isLoading },
  ] = useCreatePriceListMutation();

  const handleCancel = () => {
    router.push(
      PRICE_LISTS_PATH
    );
  };

  const handleSubmit = async (
    values: PriceListFormValues
  ) => {
    try {
      const response =
        await createPriceList(
          values
        ).unwrap();

      window.alert(
        response.message ||
          "Price List created successfully."
      );

      router.push(
        PRICE_LISTS_PATH
      );
    } catch (error: unknown) {
      const message =
        getApiErrorMessage(
          error,
          "Unable to create the Price List."
        );

      window.alert(message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PriceListForm
        mode="create"
        isSaving={isLoading}
        submitLabel="Create Price List"
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const apiError = error as {
      data?: {
        message?: unknown;
        error?: unknown;
      };
      message?: unknown;
    };

    if (
      typeof apiError.data?.message ===
      "string"
    ) {
      return apiError.data.message;
    }

    if (
      typeof apiError.data?.error ===
      "string"
    ) {
      return apiError.data.error;
    }

    if (
      typeof apiError.message ===
      "string"
    ) {
      return apiError.message;
    }
  }

  return fallbackMessage;
}