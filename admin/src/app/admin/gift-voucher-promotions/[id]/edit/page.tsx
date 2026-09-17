"use client";

import {
  use,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import GiftVoucherPromotionForm from "@/components/admin/gift-voucher-promotions/GiftVoucherPromotionForm";

import type {
  GiftVoucherPromotionFormValues,
  GiftVoucherChannelCode,
} from "@/types/giftVoucherPromotion";

import {
  useGetGiftVoucherPromotionByIdQuery,
  useUpdateGiftVoucherPromotionMutation,
} from "@/store/api/giftVoucherPromotionApi";

export default function EditGiftVoucherPromotionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } =
    use(
      params
    );

  const router =
    useRouter();

  const {
    data,
    isLoading,
    isFetching,
    error,
  } =
    useGetGiftVoucherPromotionByIdQuery(
      id
    );

  const [
    updatePromotion,
    {
      isLoading:
        isSaving,
    },
  ] =
    useUpdateGiftVoucherPromotionMutation();

  const promotion =
    data?.data;

  const initialValues:
    GiftVoucherPromotionFormValues |
    undefined =
    promotion
      ? {
          code:
            promotion.code,

          name:
            promotion.name,

          description:
            promotion.description ||
            "",

          discountType:
            promotion.discountType,

          discountValue:
            String(
              promotion.discountValue ??
                ""
            ),

          fundingType:
            promotion.fundingType,

          fundingSource:
            promotion.fundingSource ||
            "",

          currencyCode:
            promotion.currencyCode ||
            "AED",

          channelCode:
            (
              promotion.channelCode ===
              "ALL"
                ? "ALL"
                : "WEBSITE"
            ) as GiftVoucherChannelCode,

          validFrom:
            promotion.validFrom,

          validUntil:
            promotion.validUntil,

          priority:
            String(
              promotion.priority ??
                "100"
            ),

          isActive:
            promotion.isActive,

          items:
            promotion.items ||
            [],
        }
      : undefined;

  if (
    isLoading ||
    isFetching
  ) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          Loading gift voucher promotion...
        </div>
      </div>
    );
  }

  if (
    error ||
    !promotion
  ) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-bold text-red-700">
            Unable to load promotion
          </h1>

          <p className="mt-2 text-sm text-red-600">
            The gift voucher promotion could not be loaded.
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"
            onClick={() =>
              router.push(
                "/admin/gift-voucher-promotions"
              )
            }
          >
            Back to promotions
          </button>
        </div>
      </div>
    );
  }

  return (
    <GiftVoucherPromotionForm
      title="Edit Gift Voucher Promotion"
      subtitle="Update the voucher, funding rules, validity and product assignments."
      initialValues={
        initialValues
      }
      isSaving={
        isSaving
      }
      onCancel={() =>
        router.push(
          "/admin/gift-voucher-promotions"
        )
      }
      onSubmit={async (
        values
      ) => {
        try {
          await updatePromotion({
            id,
            values,
          }).unwrap();

          toast.success(
            "Gift voucher promotion updated successfully."
          );

          router.push(
            "/admin/gift-voucher-promotions"
          );

          router.refresh();
        } catch (
          error
        ) {
          const e =
            error as {
              data?: {
                error?: {
                  message?: string;
                };

                message?: string;
              };
            };

          toast.error(
            e.data
              ?.error
              ?.message ||
              e.data
                ?.message ||
              "Unable to update promotion."
          );

          throw error;
        }
      }}
    />
  );
}
