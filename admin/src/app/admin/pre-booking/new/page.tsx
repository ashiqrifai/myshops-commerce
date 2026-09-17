"use client";

import Link from "next/link";

import {
  ArrowLeft,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import PreBookingCampaignForm from "@/components/pre-booking/PreBookingCampaignForm";

import {
  useCreatePreBookingCampaignMutation,
} from "@/store/api/preBookingApi";

import type {
  CreatePreBookingCampaignBody,
} from "@/types/preBooking";

export default function NewPreBookingCampaignPage() {
  const router =
    useRouter();

  const [
    createCampaign,
    {
      isLoading,
    },
  ] =
    useCreatePreBookingCampaignMutation();

  const save =
    async (
      values:
        CreatePreBookingCampaignBody
    ) => {
      try {
        const response =
          await createCampaign(
            values
          ).unwrap();

        router.push(
          `/admin/pre-booking/${response.data.id}/edit`
        );
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to create pre-booking campaign."
        );
      }
    };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/pre-booking"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#202223]"
          >
            <ArrowLeft
              size={
                16
              }
            />

            Pre-booking campaigns
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-[#202223]">
            Create pre-booking campaign
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Create the campaign first. Products, bundles, protection and allocations will be configured after saving.
          </p>
        </div>
      </div>

      <PreBookingCampaignForm
        isSaving={
          isLoading
        }
        submitLabel="Create campaign"
        onSubmit={
          save
        }
      />
    </div>
  );
}