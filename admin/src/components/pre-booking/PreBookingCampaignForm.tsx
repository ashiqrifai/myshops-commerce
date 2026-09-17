"use client";

import {
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CreatePreBookingCampaignBody,
  PreBookingCampaign,
  PreBookingCampaignStatus,
} from "@/types/preBooking";

import type {
  MediaAsset,
} from "@/types/media";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

interface PreBookingCampaignFormProps {
  campaign?: PreBookingCampaign | null;

  isSaving?: boolean;

  submitLabel?: string;

  onSubmit: (
    values:
      CreatePreBookingCampaignBody
  ) => Promise<void> | void;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const slugify = (
  value: string
) =>
  String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .replace(
      /-{2,}/g,
      "-"
    );

const codeify = (
  value: string
) =>
  String(
    value || ""
  )
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /&/g,
      " AND "
    )
    .replace(
      /[^A-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .replace(
      /_{2,}/g,
      "_"
    );

const toDateTimeLocalValue = (
  value?:
    | string
    | null
) => {
  if (!value) {
    return "";
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
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset *
          60 *
          1000
    );

  return localDate
    .toISOString()
    .slice(
      0,
      16
    );
};

const toIsoValue = (
  value: string
) => {
  if (!value) {
    return null;
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
    return null;
  }

  return date.toISOString();
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function PreBookingCampaignForm({
  campaign,
  isSaving = false,
  submitLabel = "Save campaign",
  onSubmit,
}: PreBookingCampaignFormProps) {
  const isEditing =
    Boolean(
      campaign?.id
    );

  const [
    name,
    setName,
  ] =
    useState(
      campaign?.name ||
        ""
    );

  const [
    code,
    setCode,
  ] =
    useState(
      campaign?.code ||
        ""
    );

  const [
    slug,
    setSlug,
  ] =
    useState(
      campaign?.slug ||
        ""
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      campaign?.description ||
        ""
    );

  const [
    bannerAssetId,
    setBannerAssetId,
  ] =
    useState<string | null>(
      campaign?.bannerAssetId ||
        null
    );

  const [
    selectedBannerAsset,
    setSelectedBannerAsset,
  ] =
    useState<MediaAsset | null>(
      null
    );

  const [
    isBannerPickerOpen,
    setIsBannerPickerOpen,
  ] =
    useState(
      false
    );

  const [
    mobileBannerAssetId,
    setMobileBannerAssetId,
  ] =
    useState<string | null>(
      campaign?.mobileBannerAssetId ||
        null
    );

  const [
    selectedMobileBannerAsset,
    setSelectedMobileBannerAsset,
  ] =
    useState<MediaAsset | null>(
      null
    );

  const [
    isMobileBannerPickerOpen,
    setIsMobileBannerPickerOpen,
  ] =
    useState(
      false
    );

  const [
    status,
    setStatus,
  ] =
    useState<PreBookingCampaignStatus>(
      campaign?.status ||
        "DRAFT"
    );

  const [
    bookingStartAt,
    setBookingStartAt,
  ] =
    useState(
      toDateTimeLocalValue(
        campaign
          ?.bookingStartAt
      )
    );

  const [
    bookingEndAt,
    setBookingEndAt,
  ] =
    useState(
      toDateTimeLocalValue(
        campaign
          ?.bookingEndAt
      )
    );

  const [
    allowCard,
    setAllowCard,
  ] =
    useState(
      campaign
        ?.allowCard ??
        true
    );

  const [
    allowTabby,
    setAllowTabby,
  ] =
    useState(
      campaign
        ?.allowTabby ??
        false
    );

  const [
    allowTamara,
    setAllowTamara,
  ] =
    useState(
      campaign
        ?.allowTamara ??
        false
    );

  const [
    allowCoupons,
    setAllowCoupons,
  ] =
    useState(
      campaign
        ?.allowCoupons ??
        false
    );

  const [
    allowGiftVouchers,
    setAllowGiftVouchers,
  ] =
    useState(
      campaign
        ?.allowGiftVouchers ??
        false
    );

  const [
    checkoutSessionMinutes,
    setCheckoutSessionMinutes,
  ] =
    useState(
      campaign
        ?.checkoutSessionMinutes ??
        15
    );

  const [
    isActive,
    setIsActive,
  ] =
    useState(
      campaign
        ?.isActive ??
        true
    );

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState(
      campaign
        ?.sortOrder ??
        0
    );

  const [
    codeTouched,
    setCodeTouched,
  ] =
    useState(
      isEditing
    );

  const [
    slugTouched,
    setSlugTouched,
  ] =
    useState(
      isEditing
    );

  /*
  |--------------------------------------------------------------------------
  | Auto Code / Slug
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !codeTouched
      ) {
        setCode(
          codeify(
            name
          )
        );
      }

      if (
        !slugTouched
      ) {
        setSlug(
          slugify(
            name
          )
        );
      }
    },
    [
      name,
      codeTouched,
      slugTouched,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validationMessage =
    useMemo(
      () => {
        if (
          !name.trim()
        ) {
          return "Campaign name is required.";
        }

        if (
          !code.trim()
        ) {
          return "Campaign code is required.";
        }

        if (
          !slug.trim()
        ) {
          return "Campaign slug is required.";
        }

        if (
          bookingStartAt &&
          bookingEndAt
        ) {
          const start =
            new Date(
              bookingStartAt
            );

          const end =
            new Date(
              bookingEndAt
            );

          if (
            end <
            start
          ) {
            return "Booking end date cannot be earlier than booking start date.";
          }
        }

        if (
          checkoutSessionMinutes <
            5 ||
          checkoutSessionMinutes >
            120
        ) {
          return "Checkout reservation time must be between 5 and 120 minutes.";
        }

        if (
          !allowCard &&
          !allowTabby &&
          !allowTamara
        ) {
          return "At least one prepaid payment method must be enabled.";
        }

        return null;
      },
      [
        name,
        code,
        slug,
        bookingStartAt,
        bookingEndAt,
        checkoutSessionMinutes,
        allowCard,
        allowTabby,
        allowTamara,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submit =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (
        validationMessage
      ) {
        window.alert(
          validationMessage
        );

        return;
      }

      await onSubmit({
        name:
          name.trim(),

        code:
          code.trim(),

        slug:
          slug.trim(),

        description:
          description.trim() ||
          null,

        bannerAssetId,

        mobileBannerAssetId,

        status,

        bookingStartAt:
          toIsoValue(
            bookingStartAt
          ),

        bookingEndAt:
          toIsoValue(
            bookingEndAt
          ),

        paymentPolicy:
          "FULL_PREPAID",

        allowCard,

        allowTabby,

        allowTamara,

        allowCoupons,

        allowGiftVouchers,

        checkoutSessionMinutes,

        isActive,

        sortOrder,
      });
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-6"
    >
      {/* Campaign Information */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#202223]">
            Campaign information
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Configure the main pre-booking campaign.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel>
              Campaign name
            </FieldLabel>

            <input
              value={
                name
              }
              onChange={(
                event
              ) =>
                setName(
                  event
                    .target
                    .value
                )
              }
              className="admin-input"
              placeholder="iPhone 18 Launch"
            />
          </div>

          <div>
            <FieldLabel>
              Code
            </FieldLabel>

            <input
              value={
                code
              }
              onChange={(
                event
              ) => {
                setCodeTouched(
                  true
                );

                setCode(
                  codeify(
                    event
                      .target
                      .value
                  )
                );
              }}
              className="admin-input font-mono"
              placeholder="IPHONE_18_LAUNCH"
            />
          </div>

          <div>
            <FieldLabel>
              Slug
            </FieldLabel>

            <input
              value={
                slug
              }
              onChange={(
                event
              ) => {
                setSlugTouched(
                  true
                );

                setSlug(
                  slugify(
                    event
                      .target
                      .value
                  )
                );
              }}
              className="admin-input"
              placeholder="iphone-18-launch"
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>
              Description
            </FieldLabel>

            <textarea
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event
                    .target
                    .value
                )
              }
              rows={
                4
              }
              className="admin-input min-h-[110px]"
              placeholder="Internal or customer-facing campaign description..."
            />
          </div>
        </div>
      </section>

      {/* Campaign Banner */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#202223]">
            Campaign banner
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Select the hero banner displayed on the public pre-booking campaign page.
          </p>
        </div>

        <div className="mt-5">
          {selectedBannerAsset ? (
            <div className="mb-4 overflow-hidden rounded-xl border border-[#e1e3e5] bg-[#f6f6f7]">
              {selectedBannerAsset.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    selectedBannerAsset.publicUrl
                  }
                  alt={
                    selectedBannerAsset.altText ||
                    selectedBannerAsset.title ||
                    "Campaign banner"
                  }
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-[#6d7175]">
                  Banner selected
                </div>
              )}
            </div>
          ) : bannerAssetId ? (
            <div className="mb-4 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
              <p className="text-sm font-medium text-[#202223]">
                Existing campaign banner selected
              </p>

              <p className="mt-1 break-all text-xs text-[#6d7175]">
                {bannerAssetId}
              </p>
            </div>
          ) : (
            <div className="mb-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7]">
              <p className="text-sm text-[#6d7175]">
                No campaign banner selected
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setIsBannerPickerOpen(
                  true
                )
              }
              className="rounded-lg bg-[#202223] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {bannerAssetId
                ? "Change banner"
                : "Select banner"}
            </button>

            {bannerAssetId ? (
              <button
                type="button"
                onClick={() => {
                  setBannerAssetId(
                    null
                  );

                  setSelectedBannerAsset(
                    null
                  );
                }}
                className="rounded-lg border border-[#babfc3] bg-white px-4 py-2 text-sm font-semibold text-[#202223] hover:bg-[#f6f6f7]"
              >
                Remove banner
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Mobile Campaign Banner */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#202223]">
            Campaign banner — Mobile
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Select the mobile hero image. If none is selected, the desktop banner will be used.
          </p>
        </div>

        <div className="mt-5">
          {selectedMobileBannerAsset ? (
            <div className="mb-4 mx-auto max-w-[360px] overflow-hidden rounded-xl border border-[#e1e3e5] bg-[#f6f6f7]">
              {selectedMobileBannerAsset.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    selectedMobileBannerAsset.publicUrl
                  }
                  alt={
                    selectedMobileBannerAsset.altText ||
                    selectedMobileBannerAsset.title ||
                    "Mobile campaign banner"
                  }
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[#6d7175]">
                  Mobile banner selected
                </div>
              )}
            </div>
          ) : mobileBannerAssetId ? (
            <div className="mb-4 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
              <p className="text-sm font-medium text-[#202223]">
                Existing mobile campaign banner selected
              </p>

              <p className="mt-1 break-all text-xs text-[#6d7175]">
                {mobileBannerAssetId}
              </p>
            </div>
          ) : (
            <div className="mb-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7]">
              <p className="text-sm text-[#6d7175]">
                No mobile banner selected — desktop banner will be used
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setIsMobileBannerPickerOpen(
                  true
                )
              }
              className="rounded-lg bg-[#202223] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {mobileBannerAssetId
                ? "Change mobile banner"
                : "Select mobile banner"}
            </button>

            {mobileBannerAssetId ? (
              <button
                type="button"
                onClick={() => {
                  setMobileBannerAssetId(
                    null
                  );

                  setSelectedMobileBannerAsset(
                    null
                  );
                }}
                className="rounded-lg border border-[#babfc3] bg-white px-4 py-2 text-sm font-semibold text-[#202223] hover:bg-[#f6f6f7]"
              >
                Remove mobile banner
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Schedule */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#202223]">
          Booking schedule
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Control when customers are allowed to pre-book.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel>
              Booking starts
            </FieldLabel>

            <input
              type="datetime-local"
              value={
                bookingStartAt
              }
              onChange={(
                event
              ) =>
                setBookingStartAt(
                  event
                    .target
                    .value
                )
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Booking ends
            </FieldLabel>

            <input
              type="datetime-local"
              value={
                bookingEndAt
              }
              onChange={(
                event
              ) =>
                setBookingEndAt(
                  event
                    .target
                    .value
                )
              }
              className="admin-input"
            />
          </div>
        </div>
      </section>

      {/* Status */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#202223]">
          Campaign status
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <FieldLabel>
              Status
            </FieldLabel>

            <select
              value={
                status
              }
              onChange={(
                event
              ) =>
                setStatus(
                  event
                    .target
                    .value as
                    PreBookingCampaignStatus
                )
              }
              className="admin-input"
            >
              <option value="DRAFT">
                Draft
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="PAUSED">
                Paused
              </option>

              <option value="CLOSED">
                Closed
              </option>

              <option value="ARCHIVED">
                Archived
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Sort order
            </FieldLabel>

            <input
              type="number"
              min={
                0
              }
              value={
                sortOrder
              }
              onChange={(
                event
              ) =>
                setSortOrder(
                  Math.max(
                    0,
                    Number(
                      event
                        .target
                        .value
                    ) ||
                      0
                  )
                )
              }
              className="admin-input"
            />
          </div>

          <div className="flex items-end">
            <label className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-4">
              <input
                type="checkbox"
                checked={
                  isActive
                }
                onChange={(
                  event
                ) =>
                  setIsActive(
                    event
                      .target
                      .checked
                  )
                }
              />

              <span className="text-sm font-medium text-[#202223]">
                Enabled
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Payment */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#202223]">
          Payment rules
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Pre-booking always requires full prepaid payment. Cash on delivery is never available.
        </p>

        <div className="mt-5 rounded-xl border border-[#c9e3d6] bg-[#f1faf5] p-4">
          <p className="text-sm font-semibold text-[#116149]">
            Full prepaid payment only
          </p>

          <p className="mt-1 text-xs leading-5 text-[#3f6f60]">
            COD will not be exposed by the pre-booking checkout.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <PaymentOption
            label="Credit / Debit Card"
            description="Network International"
            checked={
              allowCard
            }
            onChange={
              setAllowCard
            }
          />

          <PaymentOption
            label="Tabby"
            description="Enable only if approved for this campaign"
            checked={
              allowTabby
            }
            onChange={
              setAllowTabby
            }
          />

          <PaymentOption
            label="Tamara"
            description="Enable only if approved for this campaign"
            checked={
              allowTamara
            }
            onChange={
              setAllowTamara
            }
          />
        </div>
      </section>

      {/* Checkout */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#202223]">
          Checkout reservation
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          When a customer proceeds to the dedicated payment page, the selected allocation will later be reserved for this period.
        </p>

        <div className="mt-5 max-w-sm">
          <FieldLabel>
            Reservation time in minutes
          </FieldLabel>

          <input
            type="number"
            min={
              5
            }
            max={
              120
            }
            value={
              checkoutSessionMinutes
            }
            onChange={(
              event
            ) =>
              setCheckoutSessionMinutes(
                Math.max(
                  5,
                  Math.min(
                    120,
                    Number(
                      event
                        .target
                        .value
                    ) ||
                      15
                  )
                )
              )
            }
            className="admin-input"
          />

          <p className="mt-1 text-xs text-[#6d7175]">
            Recommended: 15 minutes.
          </p>
        </div>
      </section>

      {/* Promotions */}

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#202223]">
          Promotions
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Keep these disabled unless the business specifically wants promotions on pre-booking orders.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ToggleOption
            label="Allow coupons"
            description="Let customers apply standard coupon codes."
            checked={
              allowCoupons
            }
            onChange={
              setAllowCoupons
            }
          />

          <ToggleOption
            label="Allow gift vouchers"
            description="Let customers use gift voucher promotions."
            checked={
              allowGiftVouchers
            }
            onChange={
              setAllowGiftVouchers
            }
          />
        </div>
      </section>

      {/* Validation */}

      {validationMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            {
              validationMessage
            }
          </p>
        </div>
      ) : null}

      {/* Submit */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isSaving ||
            Boolean(
              validationMessage
            )
          }
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <LoaderCircle
              size={
                17
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                17
              }
            />
          )}

          {isSaving
            ? "Saving..."
            : submitLabel}
        </button>
      </div>
      <MediaAssetPicker
        isOpen={
          isMobileBannerPickerOpen
        }
        selectedAssetId={
          mobileBannerAssetId
        }
        title="Select mobile campaign banner"
        description="Choose the mobile hero image from the MyShops Media Library."
        classification="MARKETING"
        allowPdf={
          false
        }
        allowVideo={
          false
        }
        onClose={() =>
          setIsMobileBannerPickerOpen(
            false
          )
        }
        onSelect={(
          asset
        ) => {
          setMobileBannerAssetId(
            asset.id
          );

          setSelectedMobileBannerAsset(
            asset
          );

          setIsMobileBannerPickerOpen(
            false
          );
        }}
      />

      <MediaAssetPicker
        isOpen={
          isBannerPickerOpen
        }
        selectedAssetId={
          bannerAssetId
        }
        title="Select campaign banner"
        description="Choose an image from the MyShops Media Library."
        classification="MARKETING"
        allowPdf={
          false
        }
        allowVideo={
          false
        }
        onClose={() =>
          setIsBannerPickerOpen(
            false
          )
        }
        onSelect={(
          asset
        ) => {
          setBannerAssetId(
            asset.id
          );

          setSelectedBannerAsset(
            asset
          );

          setIsBannerPickerOpen(
            false
          );
        }}
      />
    </form>
  );
}

/*
|--------------------------------------------------------------------------
| Field Label
|--------------------------------------------------------------------------
*/

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#202223]">
      {
        children
      }
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Payment Option
|--------------------------------------------------------------------------
*/

function PaymentOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;

  description: string;

  checked: boolean;

  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event
              .target
              .checked
          )
        }
        className="mt-1"
      />

      <span>
        <span className="block text-sm font-semibold text-[#202223]">
          {
            label
          }
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
          {
            description
          }
        </span>
      </span>
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Toggle Option
|--------------------------------------------------------------------------
*/

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;

  description: string;

  checked: boolean;

  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event
              .target
              .checked
          )
        }
        className="mt-1"
      />

      <span>
        <span className="block text-sm font-semibold text-[#202223]">
          {
            label
          }
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
          {
            description
          }
        </span>
      </span>
    </label>
  );
}