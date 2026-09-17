"use client";

import Link from "next/link";

import {
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";

import {
  useParams,
} from "next/navigation";

import PreBookingCampaignForm from "@/components/pre-booking/PreBookingCampaignForm";
import PreBookingProductEditor from "@/components/pre-booking/PreBookingProductEditor";

import {
  useGetPreBookingCampaignByIdQuery,
  useUpdatePreBookingCampaignMutation,
} from "@/store/api/preBookingApi";

import type {
  CreatePreBookingCampaignBody,
} from "@/types/preBooking";

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function EditPreBookingCampaignPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const campaignId =
    params.id;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } =
    useGetPreBookingCampaignByIdQuery(
      campaignId
    );

  const [
    updateCampaign,
    {
      isLoading:
        updatingCampaign,
    },
  ] =
    useUpdatePreBookingCampaignMutation();

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    isLoading
  ) {
    return (
      <div className="mx-auto flex min-h-[420px] w-full max-w-[1400px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#6d7175]">
          <LoaderCircle
            size={
              18
            }
            className="animate-spin"
          />

          Loading pre-booking campaign...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !data?.data
  ) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
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

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            Unable to load pre-booking campaign.
          </p>
        </div>
      </div>
    );
  }

  const campaign =
    data.data;

  /*
  |--------------------------------------------------------------------------
  | Save Campaign
  |--------------------------------------------------------------------------
  */

  const saveCampaign =
    async (
      values:
        CreatePreBookingCampaignBody
    ) => {
      try {
        await updateCampaign({
          id:
            campaign.id,

          body:
            values,
        }).unwrap();

        await refetch();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to update pre-booking campaign."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {/* Header */}

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

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#202223]">
              {
                campaign.name
              }
            </h1>

            <StatusBadge
              status={
                campaign.status
              }
            />

            {!campaign.isActive ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Disabled
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-[#6d7175]">
            Configure campaign settings, products, allocations, bundles and optional protection.
          </p>
        </div>

        {isFetching ? (
          <div className="flex items-center gap-2 rounded-lg border border-[#e1e3e5] bg-white px-3 py-2 text-xs text-[#6d7175]">
            <LoaderCircle
              size={
                14
              }
              className="animate-spin"
            />

            Refreshing...
          </div>
        ) : null}
      </div>

      {/* Campaign Summary */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Campaign code"
            value={
              campaign.code
            }
            mono
          />

          <SummaryCard
            label="Slug"
            value={
              `/${campaign.slug}`
            }
          />

          <SummaryCard
            label="Products"
            value={
              String(
                campaign.products
                  ?.length ||
                0
              )
            }
          />

          <SummaryCard
            label="Payment"
            value="Full prepaid"
          />
        </div>
      </section>

      {/* Campaign Settings */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-[#202223]">
            Campaign settings
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Update the campaign schedule, payment rules and status.
          </p>
        </div>

        <PreBookingCampaignForm
          campaign={
            campaign
          }
          isSaving={
            updatingCampaign
          }
          submitLabel="Save campaign changes"
          onSubmit={
            saveCampaign
          }
        />
      </section>

      {/* Product Workspace */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-[#202223]">
            Product configuration
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Add products and configure direct allocations or optional bundles.
          </p>
        </div>

        <PreBookingProductEditor
          campaignId={
            campaign.id
          }
          campaignProducts={
            campaign.products ||
            []
          }
          onChanged={
            refetch
          }
        />
      </section>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  label,
  value,
  mono = false,
}: {
  label: string;

  value: string;

  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[#f6f6f7] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6d7175]">
        {
          label
        }
      </p>

      <p
        className={[
          "mt-1 break-words text-sm font-semibold text-[#202223]",

          mono
            ? "font-mono"
            : "",
        ].join(
          " "
        )}
      >
        {
          value
        }
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const className =
    status ===
    "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
        "PAUSED"
      ? "bg-amber-50 text-amber-700"
      : status ===
        "CLOSED"
      ? "bg-slate-100 text-slate-700"
      : status ===
        "ARCHIVED"
      ? "bg-red-50 text-red-700"
      : "bg-blue-50 text-blue-700";

  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-xs font-semibold",

        className,
      ].join(
        " "
      )}
    >
      {
        status
      }
    </span>
  );
}