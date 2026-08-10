"use client";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import {
  PriceListForm,
} from "@/components/admin/pricing";

import {
  useGetPriceListByIdQuery,
  useUpdatePriceListMutation,
} from "@/store/api/priceListApi";

import type {
  PriceListFormValues,
} from "@/types/priceList";

const PRICE_LISTS_PATH =
  "/admin/price-lists";

export default function EditPriceListPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const priceListId =
    typeof params.id ===
    "string"
      ? params.id
      : "";

  const {
    data,
    error,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetPriceListByIdQuery(
      priceListId,
      {
        skip:
          !priceListId,
      }
    );

  const [
    updatePriceList,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdatePriceListMutation();

  const priceList =
    data?.data;

  const handleCancel =
    () => {
      router.push(
        PRICE_LISTS_PATH
      );
    };

  const handleSubmit =
    async (
      values:
        PriceListFormValues
    ) => {
      if (
        !priceListId
      ) {
        window.alert(
          "The price list ID is missing."
        );

        return;
      }

      try {
        const response =
          await updatePriceList({
            id:
              priceListId,

            body:
              values,
          }).unwrap();

        window.alert(
          response.message ||
            "Price list updated successfully."
        );

        router.push(
          PRICE_LISTS_PATH
        );
      } catch (
        mutationError
      ) {
        window.alert(
          getApiErrorMessage(
            mutationError,
            "Unable to update the price list."
          )
        );
      }
    };

  if (
    isLoading ||
    (
      isFetching &&
      !priceList
    )
  ) {
    return (
      <PageStateContainer>
        <LoaderCircle
          size={30}
          aria-hidden="true"
          className="animate-spin text-[#61666b]"
        />

        <h1 className="mt-4 text-lg font-semibold text-[#202223]">
          Loading price list
        </h1>

        <p className="mt-1 text-sm text-[#6d7175]">
          Please wait while the
          pricing information is
          loaded.
        </p>
      </PageStateContainer>
    );
  }

  if (
    isError ||
    !priceList
  ) {
    return (
      <PageStateContainer>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle
            size={24}
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-[#202223]">
          Unable to load price list
        </h1>

        <p className="mt-2 max-w-lg text-center text-sm leading-6 text-[#6d7175]">
          {getApiErrorMessage(
            error,
            "The requested price list could not be found or loaded."
          )}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              void refetch()
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] transition hover:bg-[#f6f6f7]"
          >
            Try Again
          </button>

          <button
            type="button"
            onClick={
              handleCancel
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#303030] bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
          >
            Back to Price Lists
          </button>
        </div>
      </PageStateContainer>
    );
  }

  const initialValues:
    PriceListFormValues = {
      code:
        priceList.code,

      name:
        priceList.name,

      description:
        priceList.description,

      priceListType:
        priceList.priceListType,

      channelCode:
        priceList.channelCode,

      currencyCode:
        priceList.currencyCode,

      isTaxInclusive:
        priceList.isTaxInclusive,

      priority:
        priceList.priority,

      validFrom:
        priceList.validFrom,

      validUntil:
        priceList.validUntil,

      isDefault:
        priceList.isDefault,

      isActive:
        priceList.isActive,
    };

  return (
    <div className="mx-auto max-w-6xl">
      <PriceListForm
        mode="edit"
        initialValues={
          initialValues
        }
        isSaving={
          isUpdating
        }
        submitLabel="Save Changes"
        onCancel={
          handleCancel
        }
        onSubmit={
          handleSubmit
        }
      />
    </div>
  );
}

function PageStateContainer({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center rounded-xl border border-[#e1e3e5] bg-white p-8 text-center shadow-sm">
      {children}
    </div>
  );
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage:
    string
) {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return fallbackMessage;
  }

  const apiError =
    error as {
      data?: {
        message?: unknown;
        error?: unknown;
        errors?: unknown;
      };

      message?: unknown;
      error?: unknown;
    };

  if (
    typeof apiError.data
      ?.message ===
    "string"
  ) {
    return apiError.data.message;
  }

  if (
    typeof apiError.data
      ?.error ===
    "string"
  ) {
    return apiError.data.error;
  }

  if (
    Array.isArray(
      apiError.data
        ?.errors
    )
  ) {
    const messages =
      apiError.data.errors
        .map(
          (
            item
          ) => {
            if (
              typeof item ===
              "string"
            ) {
              return item;
            }

            if (
              typeof item ===
                "object" &&
              item !== null &&
              "message" in
                item &&
              typeof (
                item as {
                  message?: unknown;
                }
              ).message ===
                "string"
            ) {
              return (
                item as {
                  message: string;
                }
              ).message;
            }

            return null;
          }
        )
        .filter(
          (
            message
          ): message is string =>
            Boolean(
              message
            )
        );

    if (
      messages.length >
      0
    ) {
      return messages.join(
        ", "
      );
    }
  }

  if (
    typeof apiError.message ===
    "string"
  ) {
    return apiError.message;
  }

  if (
    typeof apiError.error ===
    "string"
  ) {
    return apiError.error;
  }

  return fallbackMessage;
}