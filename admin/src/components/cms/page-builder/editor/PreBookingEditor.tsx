"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  ImageIcon,
  LoaderCircle,
  RefreshCcw,
  Replace,
  Trash2,
} from "lucide-react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

import {
  useGetMediaAssetByIdQuery,
} from "@/store/api/mediaApi";

import {
  useGetPreBookingCampaignsQuery,
} from "@/store/api/preBookingApi";

import type {
  MediaAsset,
} from "@/types/media";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Layout =
  | "SIDE_BANNER"
  | "BANNER_TOP"
  | "PRODUCTS_ONLY";

interface Content {
  /*
  |--------------------------------------------------------------------------
  | Campaign
  |--------------------------------------------------------------------------
  */

  campaignId?:
    | string
    | null;

  /*
  |--------------------------------------------------------------------------
  | Marketing Content
  |--------------------------------------------------------------------------
  */

  badge?: string;

  title?: string;

  subtitle?: string;

  buttonLabel?: string;

  /*
   * Optional manual override.
   *
   * If blank, the storefront backend will later generate:
   *
   * /pre-booking/{campaign-slug}
   */
  buttonUrl?: string;

  openInNewTab?: boolean;

  /*
  |--------------------------------------------------------------------------
  | Media
  |--------------------------------------------------------------------------
  */

  desktopAssetId?:
    | string
    | null;

  mobileAssetId?:
    | string
    | null;
}

interface Settings {
  layout?: Layout;

  showLaunchDate?: boolean;

  showBookingDeadline?: boolean;

  showCountdown?: boolean;

  showAvailabilityBadge?: boolean;

  showNavigation?: boolean;

  maximumProducts?: number;

  backgroundColor?: string;

  textColor?: string;

  accentColor?: string;

  borderRadius?: number;
}

interface Props {
  value:
    Record<
      string,
      unknown
    >;

  settings:
    Record<
      string,
      unknown
    >;

  onChange:
    (
      value:
        Record<
          string,
          unknown
        >
    ) => void;

  onSettingsChange:
    (
      value:
        Record<
          string,
          unknown
        >
    ) => void;
}

/*
|--------------------------------------------------------------------------
| Campaign Option
|--------------------------------------------------------------------------
|
| Kept local intentionally so this editor is not tightly coupled to every
| field contained in the much larger PreBookingCampaign interface.
|--------------------------------------------------------------------------
*/

interface CampaignOption {
  id: string;

  code?:
    | string
    | null;

  name?:
    | string
    | null;

  slug?:
    | string
    | null;

  status?:
    | string
    | null;

  bookingStartAt?:
    | string
    | null;

  bookingEndAt?:
    | string
    | null;
}

/*
|--------------------------------------------------------------------------
| API Media URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  (
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5080/api/v1"
  ).replace(
    /\/api\/v1\/?$/,
    ""
  );

const resolveUrl = (
  value?:
    | string
    | null
) => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    return value;
  }

  return `${API_BASE_URL}${
    value.startsWith("/")
      ? value
      : `/${value}`
  }`;
};

/*
|--------------------------------------------------------------------------
| Media Preview
|--------------------------------------------------------------------------
*/

const getPreview = (
  asset?:
    | MediaAsset
    | null
) => {
  if (!asset) {
    return null;
  }

  const preferred = [
    "PREVIEW",
    "THUMBNAIL",
    "MEDIUM",
    "SMALL",
    "ORIGINAL",
  ];

  for (
    const type of
    preferred
  ) {
    const variant =
      asset.variants?.find(
        (
          item
        ) =>
          item.variantType ===
            type &&
          item.isActive &&
          item.publicUrl
      );

    if (
      variant?.publicUrl
    ) {
      return resolveUrl(
        variant.publicUrl
      );
    }
  }

  const enriched =
    asset as MediaAsset & {
      previewUrl?:
        | string
        | null;

      thumbnailUrl?:
        | string
        | null;
    };

  return (
    resolveUrl(
      enriched.previewUrl
    ) ||
    resolveUrl(
      enriched.thumbnailUrl
    ) ||
    resolveUrl(
      asset.publicUrl
    )
  );
};

/*
|--------------------------------------------------------------------------
| Date Formatting
|--------------------------------------------------------------------------
*/

const formatDateTime = (
  value?:
    | string
    | null
): string => {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-AE",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
};

/*
|--------------------------------------------------------------------------
| Label
|--------------------------------------------------------------------------
*/

function Label({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#202223]">
      {children}
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Toggle
|--------------------------------------------------------------------------
*/

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;

  description?: string;

  value: boolean;

  onChange:
    (
      value:
        boolean
    ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !value
        )
      }
      className="flex w-full items-start justify-between gap-4 rounded-xl border border-[#e1e3e5] bg-white p-4 text-left transition hover:bg-[#fafbfb]"
    >
      <span>
        <span className="block text-sm font-medium text-[#202223]">
          {label}
        </span>

        {description ? (
          <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
            {
              description
            }
          </span>
        ) : null}
      </span>

      <span
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",

          value
            ? "bg-[#303030]"
            : "bg-[#c9cccf]",
        ].join(
          " "
        )}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",

            value
              ? "left-[22px]"
              : "left-0.5",
          ].join(
            " "
          )}
        />
      </span>
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Media Field
|--------------------------------------------------------------------------
*/

function MediaField({
  label,
  value,
  onChange,
}: {
  label: string;

  value:
    | string
    | null;

  onChange:
    (
      value:
        | string
        | null
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    localAsset,
    setLocalAsset,
  ] =
    useState<
      MediaAsset |
      null
    >(
      null
    );

  const {
    data,
    isFetching,
  } =
    useGetMediaAssetByIdQuery(
      value ||
        "",
      {
        skip:
          !value,
      }
    );

  const response =
    data as
      | {
          data?:
            | MediaAsset
            | {
                asset?:
                  | MediaAsset
                  | null;
              };
        }
      | undefined;

  const queried =
    response?.data &&
    typeof response.data ===
      "object" &&
    "asset" in
      response.data
      ? response.data
          .asset ||
        null
      : (
          response?.data as
            | MediaAsset
            | undefined
        ) ||
        null;

  const asset =
    localAsset ||
    queried;

  const preview =
    getPreview(
      asset
    );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] px-4 py-3 text-sm font-medium">
          {label}
        </div>

        {isFetching &&
        !localAsset ? (
          <div className="flex aspect-[16/7] items-center justify-center bg-[#f6f6f7]">
            <LoaderCircle
              size={
                22
              }
              className="animate-spin text-[#6d7175]"
            />
          </div>
        ) : preview ? (
          <div className="relative aspect-[16/7] bg-[#f6f6f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                preview
              }
              alt={
                asset
                  ?.altText ||
                asset
                  ?.title ||
                label
              }
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-black/45 p-2">
              <button
                type="button"
                onClick={() =>
                  setOpen(
                    true
                  )
                }
                className="flex h-8 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium text-[#202223]"
              >
                <Replace
                  size={
                    14
                  }
                />

                Replace
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocalAsset(
                    null
                  );

                  onChange(
                    null
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600"
                title={`Remove ${label}`}
              >
                <Trash2
                  size={
                    14
                  }
                />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setOpen(
                true
              )
            }
            className="flex aspect-[16/7] w-full flex-col items-center justify-center bg-[#f6f6f7] p-4 transition hover:bg-[#f1f2f3]"
          >
            <ImageIcon
              size={
                26
              }
              className="text-[#8c9196]"
            />

            <span className="mt-2 text-sm font-semibold">
              Select image
            </span>
          </button>
        )}
      </div>

      <MediaAssetPicker
        isOpen={
          open
        }
        selectedAssetId={
          value
        }
        title={`Select ${label}`}
        description="Choose pre-booking artwork from the media library."
        classification="PROMOTION"
        onClose={() =>
          setOpen(
            false
          )
        }
        onSelect={(
          selectedAsset
        ) => {
          setLocalAsset(
            selectedAsset
          );

          onChange(
            selectedAsset.id
          );

          setOpen(
            false
          );
        }}
      />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function CampaignStatusBadge({
  status,
}: {
  status?:
    | string
    | null;
}) {
  const normalized =
    String(
      status ||
        ""
    )
      .trim()
      .toUpperCase();

  const style =
    normalized ===
    "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : normalized ===
          "DRAFT"
        ? "bg-slate-50 text-slate-700 border-slate-200"
        : normalized ===
            "CLOSED" ||
          normalized ===
            "COMPLETED"
          ? "bg-[#f6f6f7] text-[#6d7175] border-[#e1e3e5]"
          : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        style,
      ].join(
        " "
      )}
    >
      {normalized ||
        "UNKNOWN"}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Pre Booking Editor
|--------------------------------------------------------------------------
*/

export default function PreBookingEditor({
  value,
  settings,
  onChange,
  onSettingsChange,
}: Props) {
  const content =
    value as Content;

  const config =
    settings as Settings;

  /*
  |--------------------------------------------------------------------------
  | Campaigns
  |--------------------------------------------------------------------------
  */

  const {
    data:
      campaignResponse,
    isLoading:
      campaignsLoading,
    isFetching:
      campaignsFetching,
    refetch:
      refetchCampaigns,
  } =
    useGetPreBookingCampaignsQuery(
      {
        page: 1,
        pageSize: 100,
      }
    );

  const campaigns =
    useMemo(
      () =>
        (
          campaignResponse
            ?.data ||
          []
        ).map(
          (
            campaign
          ) =>
            campaign as unknown as CampaignOption
        ),
      [
        campaignResponse,
      ]
    );

  const selectedCampaign =
    useMemo(
      () =>
        campaigns.find(
          (
            campaign
          ) =>
            campaign.id ===
            content.campaignId
        ) ||
        null,
      [
        campaigns,
        content.campaignId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | State Helpers
  |--------------------------------------------------------------------------
  */

  const updateContent =
    (
      changes:
        Partial<Content>
    ) =>
      onChange({
        ...value,
        ...changes,
      });

  const updateSettings =
    (
      changes:
        Partial<Settings>
    ) =>
      onSettingsChange({
        ...settings,
        ...changes,
      });

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/*
      |--------------------------------------------------------------------------
      | Campaign
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <CalendarClock
                size={
                  20
                }
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                Pre-booking campaign
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#6d7175]">
                Connect this homepage section to a pre-booking campaign.
                Products, booking dates, bundles and allocations will come
                from the selected campaign.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label>
                Campaign
              </Label>

              <button
                type="button"
                onClick={() =>
                  refetchCampaigns()
                }
                disabled={
                  campaignsFetching
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16828b] disabled:opacity-50"
              >
                <RefreshCcw
                  size={
                    13
                  }
                  className={
                    campaignsFetching
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>

            {campaignsLoading ? (
              <div className="flex h-11 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#6d7175]">
                <LoaderCircle
                  size={
                    16
                  }
                  className="animate-spin"
                />

                Loading campaigns...
              </div>
            ) : (
              <select
                value={
                  content.campaignId ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  updateContent({
                    campaignId:
                      event.target
                        .value ||
                      null,
                  })
                }
                className="admin-input"
              >
                <option value="">
                  Select a pre-booking campaign
                </option>

                {campaigns.map(
                  (
                    campaign
                  ) => (
                    <option
                      key={
                        campaign.id
                      }
                      value={
                        campaign.id
                      }
                    >
                      {campaign.name ||
                        campaign.code ||
                        campaign.id}

                      {campaign.status
                        ? ` — ${campaign.status}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            )}

            {!campaignsLoading &&
            campaigns.length ===
              0 ? (
              <p className="mt-2 text-xs text-amber-700">
                No pre-booking campaigns are available. Create a campaign
                from the Pre-Booking admin module first.
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-[#6d7175]">
                The selected campaign becomes the source of truth for
                pre-booking products, booking dates, bundle options and
                availability allocations.
              </p>
            )}
          </div>

          {selectedCampaign ? (
            <div className="rounded-xl border border-[#d9e6e8] bg-[#f5fbfb] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#202223]">
                    {selectedCampaign.name ||
                      "Pre-booking campaign"}
                  </p>

                  {selectedCampaign.code ? (
                    <p className="mt-1 font-mono text-xs text-[#6d7175]">
                      {
                        selectedCampaign.code
                      }
                    </p>
                  ) : null}
                </div>

                <CampaignStatusBadge
                  status={
                    selectedCampaign.status
                  }
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#6d7175]">
                    Booking starts
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#202223]">
                    {formatDateTime(
                      selectedCampaign.bookingStartAt
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#6d7175]">
                    Booking ends
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#202223]">
                    {formatDateTime(
                      selectedCampaign.bookingEndAt
                    )}
                  </p>
                </div>
              </div>

              {selectedCampaign.slug ? (
                <div className="mt-3 rounded-lg bg-white px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#6d7175]">
                    Public campaign page
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-[#202223]">
                    /pre-booking/
                    {
                      selectedCampaign.slug
                    }
                  </p>
                </div>
              ) : null}
            </div>
          ) : content.campaignId ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                The currently saved campaign could not be found.
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                It may have been deleted, archived, or may no longer be
                available to this company.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Marketing Content
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold">
            Homepage content
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            These values control the presentation of the campaign on the
            homepage. They do not change the campaign itself.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <Label>
              Badge
            </Label>

            <input
              value={
                content.badge ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  badge:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="PRE-BOOK NOW"
            />
          </div>

          <div>
            <Label>
              Title
            </Label>

            <input
              value={
                content.title ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  title:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="iPhone 18 Pro Max"
            />
          </div>

          <div className="md:col-span-2">
            <Label>
              Subtitle
            </Label>

            <textarea
              rows={
                3
              }
              value={
                content.subtitle ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  subtitle:
                    event.target
                      .value,
                })
              }
              className="admin-input min-h-24"
              placeholder="Choose your bundle and secure your pre-booking."
            />
          </div>

          <div>
            <Label>
              Button label
            </Label>

            <input
              value={
                content.buttonLabel ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  buttonLabel:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="View All"
            />
          </div>

          <div>
            <Label>
              Button URL override
            </Label>

            <input
              value={
                content.buttonUrl ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  buttonUrl:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder={
                selectedCampaign
                  ?.slug
                  ? `/pre-booking/${selectedCampaign.slug}`
                  : "/pre-booking/..."
              }
            />

            <p className="mt-1.5 text-xs leading-5 text-[#6d7175]">
              Leave blank to use the selected campaign page automatically.
            </p>
          </div>

          <label className="flex items-start gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={
                content.openInNewTab ===
                true
              }
              onChange={(
                event
              ) =>
                updateContent({
                  openInNewTab:
                    event.target
                      .checked,
                })
              }
              className="mt-1"
            />

            <span>
              <span className="block text-sm font-medium">
                Open campaign button in a new tab
              </span>

              <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                Usually this should remain off for an internal MyShops
                pre-booking page.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Media
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold">
            Campaign media
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Homepage artwork remains CMS-controlled so marketing creative can
            be changed without modifying the pre-booking campaign.
          </p>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <MediaField
            label="Desktop banner"
            value={
              content.desktopAssetId ||
              null
            }
            onChange={(
              desktopAssetId
            ) =>
              updateContent({
                desktopAssetId,
              })
            }
          />

          <MediaField
            label="Mobile banner"
            value={
              content.mobileAssetId ||
              null
            }
            onChange={(
              mobileAssetId
            ) =>
              updateContent({
                mobileAssetId,
              })
            }
          />
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Layout
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold">
            Layout and display
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Control how the selected campaign appears on the storefront.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <Label>
              Layout
            </Label>

            <select
              value={
                config.layout ||
                "SIDE_BANNER"
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  layout:
                    event.target
                      .value as Layout,
                })
              }
              className="admin-input"
            >
              <option value="SIDE_BANNER">
                Side banner and products
              </option>

              <option value="BANNER_TOP">
                Banner above products
              </option>

              <option value="PRODUCTS_ONLY">
                Products only
              </option>
            </select>
          </div>

          <div>
            <Label>
              Maximum homepage products
            </Label>

            <input
              type="number"
              min={
                1
              }
              max={
                24
              }
              value={
                config.maximumProducts ??
                8
              }
              onChange={(
                event
              ) => {
                const next =
                  Number(
                    event.target
                      .value
                  );

                updateSettings({
                  maximumProducts:
                    Number.isFinite(
                      next
                    )
                      ? Math.min(
                          24,
                          Math.max(
                            1,
                            next
                          )
                        )
                      : 8,
                });
              }}
              className="admin-input"
            />

            <p className="mt-1.5 text-xs text-[#6d7175]">
              This only limits cards shown in this homepage section. It does
              not limit products in the campaign itself.
            </p>
          </div>

          <Toggle
            label="Show launch date"
            description="Display the expected launch or availability date on product cards when available."
            value={
              config.showLaunchDate !==
              false
            }
            onChange={(
              next
            ) =>
              updateSettings({
                showLaunchDate:
                  next,
              })
            }
          />

          <Toggle
            label="Show booking deadline"
            description="Display the campaign booking deadline on product cards."
            value={
              config.showBookingDeadline !==
              false
            }
            onChange={(
              next
            ) =>
              updateSettings({
                showBookingDeadline:
                  next,
              })
            }
          />

          <Toggle
            label="Show countdown"
            description="Show the live countdown using the selected campaign booking end date."
            value={
              config.showCountdown !==
              false
            }
            onChange={(
              next
            ) =>
              updateSettings({
                showCountdown:
                  next,
              })
            }
          />

          <Toggle
            label="Show availability badge"
            description="Display the Pre-Book badge on campaign product cards."
            value={
              config.showAvailabilityBadge !==
              false
            }
            onChange={(
              next
            ) =>
              updateSettings({
                showAvailabilityBadge:
                  next,
              })
            }
          />

          <Toggle
            label="Show carousel navigation"
            description="Show previous and next controls when multiple campaign products are displayed."
            value={
              config.showNavigation !==
              false
            }
            onChange={(
              next
            ) =>
              updateSettings({
                showNavigation:
                  next,
              })
            }
          />
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Information
      |--------------------------------------------------------------------------
      */}

      <section className="rounded-xl border border-[#d9e6e8] bg-[#f5fbfb] p-5">
        <p className="text-sm font-semibold text-[#16828b]">
          Campaign-controlled information
        </p>

        <p className="mt-2 text-sm leading-6 text-[#4b5563]">
          Booking start/end dates, products, optional bundles, optional
          protection plans, allocation quantities and availability windows are
          managed from the Pre-Booking admin module. This CMS section only
          controls how that campaign is presented on the storefront.
        </p>
      </section>
    </div>
  );
}