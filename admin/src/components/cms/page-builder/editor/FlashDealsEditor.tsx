"use client";

import {
  Clock3,
  ImageIcon,
  LoaderCircle,
  Palette,
  Replace,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import BrandPicker from "@/components/cms/pickers/BrandPicker";
import CategoryPicker from "@/components/cms/pickers/CategoryPicker";
import ProductPicker from "@/components/cms/pickers/ProductPicker";
import MediaAssetPicker from "@/components/media/MediaAssetPicker";
import CollectionPicker from "@/components/cms/pickers/CollectionPicker";

import {
  useGetMediaAssetByIdQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
} from "@/types/media";

type FlashDealSourceType =
  | "MANUAL"
  | "PROMOTION"
  | "CATEGORY"
  | "BRAND"
  | "COLLECTION";

type FlashDealsLayout =
  | "BANNER_TOP"
  | "SIDE_BANNER"
  | "BACKGROUND_BANNER";

  interface FlashDealsContent {
    badge?: string;
    title?: string;
    subtitle?: string;
  
    collectionId?:
      | string
      | null;
  
    buttonLabel?: string;
    buttonUrl?: string;
  
    openInNewTab?: boolean;
  
    /*
     * Product carousel View All
     */
    viewAllLabel?: string;
    viewAllUrl?: string;
  
    desktopAssetId?:
      | string
      | null;
  
    mobileAssetId?:
      | string
      | null;
  
    productIds?: string[];
  
    categoryId?:
      | string
      | null;
  
    brandId?:
      | string
      | null;
  
    campaignId?:
      | string
      | null;
  
    startAt?:
      | string
      | null;
  
    endAt?:
      | string
      | null;
  }

  interface FlashDealsSettings {
    sourceType?:
      FlashDealSourceType;
  
    layout?:
      FlashDealsLayout;
  
    itemsDesktop?: number;
    itemsTablet?: number;
    itemsMobile?: number;
    itemsKiosk?: number;
  
    maximumProducts?: number;
  
    showCountdown?: boolean;
    showNavigation?: boolean;
  
    showBadge?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
    showButton?: boolean;
  
    /*
     * Controls the View All link
     * displayed above the product
     * carousel.
     */
    showViewAll?: boolean;
  
    backgroundColor?: string;
    textColor?: string;
    overlayColor?: string;
    overlayOpacity?: number;
  
    cardStyle?:
      | "ROUNDED"
      | "SQUARE";
  
    contentAlignment?:
      | "LEFT"
      | "CENTER"
      | "RIGHT";
  }

interface FlashDealsEditorProps {
  value: Record<
    string,
    unknown
  >;

  settings: Record<
    string,
    unknown
  >;

  onChange: (
    value: Record<
      string,
      unknown
    >
  ) => void;

  onSettingsChange: (
    value: Record<
      string,
      unknown
    >
  ) => void;
}

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/api\/v1\/?$/,
  ""
);

function resolveMediaUrl(
  value?:
    | string
    | null
): string | null {
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
}

function getAssetPreviewUrl(
  asset?:
    | MediaAsset
    | null
): string | null {
  if (!asset) {
    return null;
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

  const preferredTypes = [
    "PREVIEW",
    "THUMBNAIL",
    "MEDIUM",
    "SMALL",
    "ORIGINAL",
  ];

  for (
    const variantType of
    preferredTypes
  ) {
    const variant =
      asset.variants?.find(
        (item) =>
          item.variantType ===
            variantType &&
          item.isActive &&
          Boolean(
            item.publicUrl
          )
      );

    if (
      variant?.publicUrl
    ) {
      return resolveMediaUrl(
        variant.publicUrl
      );
    }
  }

  return (
    resolveMediaUrl(
      enriched.previewUrl
    ) ||
    resolveMediaUrl(
      enriched.thumbnailUrl
    ) ||
    resolveMediaUrl(
      asset.publicUrl
    )
  );
}

function normalizeDateTimeLocal(
  value?:
    | string
    | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value.slice(
      0,
      16
    );
  }

  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() -
      offset
  )
    .toISOString()
    .slice(0, 16);
}

function BooleanCard({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!value)
      }
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#e1e3e5] bg-white p-4 text-left transition hover:bg-[#fafafa]"
    >
      <span>
        <span className="block text-sm font-medium text-[#202223]">
          {label}
        </span>

        {description ? (
          <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          value
            ? "bg-[#303030]"
            : "bg-[#c9cccf]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            value
              ? "left-[22px]"
              : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function FieldLabel({
  children,
  hint,
}: {
  children:
    React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 block">
      <span className="text-sm font-medium text-[#202223]">
        {children}
      </span>

      {hint ? (
        <span className="ml-2 text-xs text-[#8c9196]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function MediaField({
  label,
  description,
  value,
  recommendedSize,
  onChange,
}: {
  label: string;
  description: string;
  value:
    | string
    | null;
  recommendedSize: string;
  onChange: (
    assetId:
      | string
      | null
  ) => void;
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const {
    data,
    isFetching,
  } =
    useGetMediaAssetByIdQuery(
      value || "",
      {
        skip: !value,
      }
    );

  const response =
    data as
      | {
          data?: {
            asset?:
              MediaAsset;
          };
        }
      | undefined;

  const asset =
    response?.data?.asset ||
    null;

  const previewUrl =
    getAssetPreviewUrl(
      asset
    );

  return (
    <>
      <div className="rounded-xl border border-[#e1e3e5] bg-white p-4">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-[#202223]">
            {label}
          </h4>

          <p className="mt-1 text-xs leading-5 text-[#6d7175]">
            {description}
          </p>

          <p className="mt-1 text-xs font-medium text-[#16828b]">
            Recommended:{" "}
            {recommendedSize}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7]">
          {isFetching ? (
            <div className="flex aspect-[16/5] items-center justify-center">
              <LoaderCircle
                size={24}
                className="animate-spin text-[#6d7175]"
              />
            </div>
          ) : previewUrl ? (
            <div className="relative aspect-[16/5] bg-[#edf0f2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={label}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-black/45 p-3">
                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(
                      true
                    )
                  }
                  className="flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-[#202223]"
                >
                  <Replace
                    size={16}
                  />

                  Replace
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-red-600"
                  aria-label={`Remove ${label}`}
                >
                  <Trash2
                    size={16}
                  />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setIsOpen(true)
              }
              className="flex aspect-[16/5] w-full flex-col items-center justify-center p-6 text-center transition hover:bg-[#eef0f2]"
            >
              <ImageIcon
                size={30}
                className="text-[#8c9196]"
              />

              <span className="mt-3 text-sm font-semibold text-[#202223]">
                Select image
              </span>

              <span className="mt-1 text-xs text-[#6d7175]">
                Choose from the
                media library
              </span>
            </button>
          )}
        </div>
      </div>

      <MediaAssetPicker
        isOpen={isOpen}
        selectedAssetId={
          value
        }
        title={`Select ${label}`}
        description={
          description
        }
        classification="PROMOTION"
        onClose={() =>
          setIsOpen(false)
        }
        onSelect={(
          selectedAsset
        ) => {
          onChange(
            selectedAsset.id
          );

          setIsOpen(false);
        }}
      />
    </>
  );
}

export default function FlashDealsEditor({
  value,
  settings,
  onChange,
  onSettingsChange,
}: FlashDealsEditorProps) {
  const content =
    value as FlashDealsContent;

  const flashSettings =
    settings as FlashDealsSettings;

  const sourceType =
    String(
      flashSettings.sourceType ||
        "MANUAL"
    )
      .trim()
      .toUpperCase() as FlashDealSourceType;

  const layout =
    String(
      flashSettings.layout ||
        "BANNER_TOP"
    )
      .trim()
      .toUpperCase() as FlashDealsLayout;

  const productIds =
    Array.isArray(
      content.productIds
    )
      ? content.productIds.filter(
          (
            id
          ): id is string =>
            typeof id ===
              "string" &&
            Boolean(id.trim())
        )
      : [];

  const updateContent = (
    changes:
      Partial<FlashDealsContent>
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const updateSettings = (
    changes:
      Partial<FlashDealsSettings>
  ) => {
    onSettingsChange({
      ...settings,
      ...changes,
    });
  };

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff1e6] text-[#c2410c]">
              <Sparkles
                size={20}
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Flash deal campaign
              </h2>

              <p className="mt-1 text-sm text-[#6d7175]">
                Build a rich promotional
                section with banners,
                countdown and products.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <FieldLabel>
              Badge
            </FieldLabel>

            <input
              type="text"
              value={
                content.badge ||
                ""
              }
              onChange={(event) =>
                updateContent({
                  badge:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Limited Time Offer"
            />
          </div>

          <div>
            <FieldLabel>
              Title
            </FieldLabel>

            <input
              type="text"
              value={
                content.title ||
                ""
              }
              onChange={(event) =>
                updateContent({
                  title:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Flash Deals"
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>
              Subtitle
            </FieldLabel>

            <textarea
              value={
                content.subtitle ||
                ""
              }
              onChange={(event) =>
                updateContent({
                  subtitle:
                    event.target
                      .value,
                })
              }
              rows={3}
              className="admin-input min-h-24 resize-y"
              placeholder="Save big on selected products for a limited time."
            />
          </div>

          <div>
            <FieldLabel>
              Button label
            </FieldLabel>

            <input
              type="text"
              value={
                content.buttonLabel ||
                ""
              }
              onChange={(event) =>
                updateContent({
                  buttonLabel:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Shop Now"
            />
          </div>

          <div>
            <FieldLabel>
              Button link
            </FieldLabel>

            <input
              type="text"
              value={
                content.buttonUrl ||
                ""
              }
              onChange={(event) =>
                updateContent({
                  buttonUrl:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="/offers"
            />
          </div>

          <div className="md:col-span-2">
            <BooleanCard
              label="Open button in a new tab"
              value={
                content.openInNewTab ===
                true
              }
              onChange={(
                openInNewTab
              ) =>
                updateContent({
                  openInNewTab,
                })
              }
            />
          </div>

          <div className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <BooleanCard
                label="Show badge text"
                description="Show or hide the small promotional text such as LIMITED TIME OFFER."
                value={
                  flashSettings.showBadge !==
                  false
                }
                onChange={(
                  showBadge
                ) =>
                  updateSettings({
                    showBadge,
                  })
                }
              />

              <BooleanCard
                label="Show title"
                description="Show or hide the main Flash Deals heading."
                value={
                  flashSettings.showTitle !==
                  false
                }
                onChange={(
                  showTitle
                ) =>
                  updateSettings({
                    showTitle,
                  })
                }
              />

              <BooleanCard
                label="Show subtitle"
                description="Show or hide the supporting promotional text."
                value={
                  flashSettings.showSubtitle !==
                  false
                }
                onChange={(
                  showSubtitle
                ) =>
                  updateSettings({
                    showSubtitle,
                  })
                }
              />

              <BooleanCard
                label="Show Shop Now button"
                description="Show or hide the campaign call-to-action button."
                value={
                  flashSettings.showButton !==
                  false
                }
                onChange={(
                  showButton
                ) =>
                  updateSettings({
                    showButton,
                  })
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold text-[#202223]">
            Campaign media
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Use different artwork for
            desktop and mobile screens.
          </p>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <MediaField
            label="Desktop banner"
            description="Wide campaign artwork for desktop, laptop and kiosk."
            recommendedSize="1920 × 600 px"
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
            description="Portrait or compact artwork optimized for mobile phones."
            recommendedSize="1080 × 1350 px"
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

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <Clock3
                size={20}
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Campaign timing
              </h2>

              <p className="mt-1 text-sm text-[#6d7175]">
                These values control the
                customer-facing countdown.
                They are separate from the
                section publishing schedule.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <FieldLabel>
              Deal starts
            </FieldLabel>

            <input
              type="datetime-local"
              value={normalizeDateTimeLocal(
                content.startAt
              )}
              onChange={(event) =>
                updateContent({
                  startAt:
                    event.target
                      .value ||
                    null,
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Deal ends
            </FieldLabel>

            <input
              type="datetime-local"
              value={normalizeDateTimeLocal(
                content.endAt
              )}
              onChange={(event) =>
                updateContent({
                  endAt:
                    event.target
                      .value ||
                    null,
                })
              }
              className="admin-input"
            />
          </div>

          <div className="md:col-span-2">
            <BooleanCard
              label="Show countdown"
              description="Display days, hours, minutes and seconds until the deal ends."
              value={
                flashSettings.showCountdown !==
                false
              }
              onChange={(
                showCountdown
              ) =>
                updateSettings({
                  showCountdown,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold text-[#202223]">
            Product source
          </h2>

          <p className="mt-1 text-sm text-[#6d7175]">
            Choose how products are loaded
            into the flash-deal carousel.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <FieldLabel>
              Source type
            </FieldLabel>

            <select
              value={sourceType}
              onChange={(event) => {
                const nextSource =
                  event.target
                    .value as FlashDealSourceType;

                updateSettings({
                  sourceType:
                    nextSource,
                });

                updateContent({
                  productIds: [],
                  categoryId: null,
                  brandId: null,
                  collectionId: null,
                  campaignId: null,
                });
              }}
              className="admin-input"
            >
              <option value="MANUAL">
                Manual products
              </option>

              <option value="PROMOTION">
                Promotion campaign
              </option>

              <option value="CATEGORY">
                Category
              </option>

              <option value="BRAND">
                Brand
              </option>

              <option value="COLLECTION">
                Collection
              </option>
            </select>
          </div>

          {sourceType ===
          "MANUAL" ? (
            <ProductPicker
              selectedIds={
                productIds
              }
              onChange={(
                nextIds
              ) =>
                updateContent({
                  productIds:
                    nextIds,
                  categoryId: null,
                  brandId: null,
                  collectionId:
                  null,
                  campaignId: null,
                })
              }
            />
          ) : null}

          {sourceType ===
          "CATEGORY" ? (
            <CategoryPicker
              selectedId={
                content.categoryId ||
                null
              }
              onChange={(
                categoryId
              ) =>
                updateContent({
                  categoryId,
                  brandId: null,
                  collectionId:
                  null,
                  campaignId: null,
                  productIds: [],
                })
              }
              title="Select deal category"
              description="Products from this category will populate the flash deal."
            />
          ) : null}

          {sourceType ===
          "BRAND" ? (
            <BrandPicker
              selectedId={
                content.brandId ||
                null
              }
              onChange={(
                brandId
              ) =>
                updateContent({
                  brandId,
                  categoryId: null,
                  campaignId: null,
                  collectionId:
                  null,
                  productIds: [],
                })
              }
              title="Select deal brand"
              description="Products from this brand will populate the flash deal."
            />
          ) : null}

          {sourceType ===
          "COLLECTION" ? (
            <CollectionPicker
              selectedId={
                content.collectionId ||
                null
              }
              onChange={(
                collectionId
              ) =>
                updateContent({
                  collectionId,

                  categoryId:
                    null,

                  brandId:
                    null,

                  campaignId:
                    null,

                  productIds:
                    [],
                })
              }
              title="Select deal collection"
              description="All eligible products assigned to this collection will populate the Flash Deals carousel."
            />
          ) : null}

          {sourceType ===
          "PROMOTION" ? (
            <div className="rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-5">
              <FieldLabel hint="PromotionPicker will replace this field">
                Campaign ID
              </FieldLabel>

              <input
                type="text"
                value={
                  content.campaignId ||
                  ""
                }
                onChange={(event) =>
                  updateContent({
                    campaignId:
                      event.target
                        .value ||
                      null,
                    categoryId: null,
                    brandId: null,
                    collectionId:
                    null,                
                    productIds: [],
                  })
                }
                className="admin-input bg-white font-mono"
                placeholder="Promotion UUID"
              />

              <p className="mt-2 text-xs leading-5 text-[#6d7175]">
                This keeps your existing
                campaign field functional
                until the reusable
                PromotionPicker is built.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3efff] text-[#6d28d9]">
              <Palette
                size={20}
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Layout and styling
              </h2>

              <p className="mt-1 text-sm text-[#6d7175]">
                Match the campaign to the
                MyShops storefront theme.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <FieldLabel>
              Layout
            </FieldLabel>

            <select
              value={layout}
              onChange={(event) =>
                updateSettings({
                  layout:
                    event.target
                      .value as FlashDealsLayout,
                })
              }
              className="admin-input"
            >
              <option value="BANNER_TOP">
                Banner above products
              </option>

              <option value="SIDE_BANNER">
                Side banner and products
              </option>

              <option value="BACKGROUND_BANNER">
                Banner as section background
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Content alignment
            </FieldLabel>

            <select
              value={
                flashSettings.contentAlignment ||
                "LEFT"
              }
              onChange={(event) =>
                updateSettings({
                  contentAlignment:
                    event.target
                      .value as
                      | "LEFT"
                      | "CENTER"
                      | "RIGHT",
                })
              }
              className="admin-input"
            >
              <option value="LEFT">
                Left
              </option>

              <option value="CENTER">
                Center
              </option>

              <option value="RIGHT">
                Right
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Background color
            </FieldLabel>

            <div className="flex gap-3">
              <input
                type="color"
                value={
                  flashSettings.backgroundColor ||
                  "#111827"
                }
                onChange={(event) =>
                  updateSettings({
                    backgroundColor:
                      event.target
                        .value,
                  })
                }
                className="h-11 w-14 rounded-lg border border-[#babfc3] bg-white p-1"
              />

              <input
                type="text"
                value={
                  flashSettings.backgroundColor ||
                  "#111827"
                }
                onChange={(event) =>
                  updateSettings({
                    backgroundColor:
                      event.target
                        .value,
                  })
                }
                className="admin-input font-mono"
              />
            </div>
          </div>

          <div>
            <FieldLabel>
              Text color
            </FieldLabel>

            <div className="flex gap-3">
              <input
                type="color"
                value={
                  flashSettings.textColor ||
                  "#FFFFFF"
                }
                onChange={(event) =>
                  updateSettings({
                    textColor:
                      event.target
                        .value,
                  })
                }
                className="h-11 w-14 rounded-lg border border-[#babfc3] bg-white p-1"
              />

              <input
                type="text"
                value={
                  flashSettings.textColor ||
                  "#FFFFFF"
                }
                onChange={(event) =>
                  updateSettings({
                    textColor:
                      event.target
                        .value,
                  })
                }
                className="admin-input font-mono"
              />
            </div>
          </div>

          <div>
            <FieldLabel>
              Overlay color
            </FieldLabel>

            <div className="flex gap-3">
              <input
                type="color"
                value={
                  flashSettings.overlayColor ||
                  "#000000"
                }
                onChange={(event) =>
                  updateSettings({
                    overlayColor:
                      event.target
                        .value,
                  })
                }
                className="h-11 w-14 rounded-lg border border-[#babfc3] bg-white p-1"
              />

              <input
                type="text"
                value={
                  flashSettings.overlayColor ||
                  "#000000"
                }
                onChange={(event) =>
                  updateSettings({
                    overlayColor:
                      event.target
                        .value,
                  })
                }
                className="admin-input font-mono"
              />
            </div>
          </div>

          <div>
            <FieldLabel>
              Overlay opacity
            </FieldLabel>

            <input
              type="number"
              min={0}
              max={100}
              value={
                flashSettings.overlayOpacity ??
                35
              }
              onChange={(event) =>
                updateSettings({
                  overlayOpacity:
                    Number(
                      event.target
                        .value
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Card style
            </FieldLabel>

            <select
              value={
                flashSettings.cardStyle ||
                "ROUNDED"
              }
              onChange={(event) =>
                updateSettings({
                  cardStyle:
                    event.target
                      .value as
                      | "ROUNDED"
                      | "SQUARE",
                })
              }
              className="admin-input"
            >
              <option value="ROUNDED">
                Rounded
              </option>

              <option value="SQUARE">
                Square
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Maximum products
            </FieldLabel>

            <input
              type="number"
              min={1}
              max={50}
              value={
                flashSettings.maximumProducts ??
                10
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  maximumProducts:
                    Number(
                      event.target
                        .value
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          {[
            [
              "itemsDesktop",
              "Desktop items",
              5,
            ],

            [
              "itemsTablet",
              "Tablet items",
              3,
            ],

            [
              "itemsMobile",
              "Mobile items",
              2,
            ],

            [
              "itemsKiosk",
              "Kiosk items",
              3,
            ],
          ].map(
            ([
              key,
              label,
              fallback,
            ]) => (
              <div
                key={
                  key
                }
              >
                <FieldLabel>
                  {
                    label
                  }
                </FieldLabel>

                <input
                  type="number"
                  min={1}
                  max={8}
                  value={
                    Number(
                      flashSettings[
                        key as keyof FlashDealsSettings
                      ] ??
                        fallback
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    updateSettings({
                      [key]:
                        Number(
                          event
                            .target
                            .value
                        ),
                    })
                  }
                  className="admin-input"
                />
              </div>
            )
          )}

          {/*
          |--------------------------------------------------------------------------
          | View All
          |--------------------------------------------------------------------------
          */}

          <div className="md:col-span-2">
            <BooleanCard
              label="Show View All"
              description="Display a View All link above the Flash Deals product carousel."
              value={
                flashSettings.showViewAll !==
                false
              }
              onChange={(
                showViewAll
              ) =>
                updateSettings({
                  showViewAll,
                })
              }
            />
          </div>

          {flashSettings.showViewAll !==
          false ? (
            <>
              <div>
                <FieldLabel>
                  View All label
                </FieldLabel>

                <input
                  type="text"
                  value={
                    content.viewAllLabel ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateContent({
                      viewAllLabel:
                        event.target
                          .value,
                    })
                  }
                  className="admin-input"
                  placeholder="View All"
                />

                <p className="mt-1.5 text-xs leading-5 text-[#6d7175]">
                  Customer-facing link
                  text.
                </p>
              </div>

              <div>
                <FieldLabel>
                  View All link
                </FieldLabel>

                <input
                  type="text"
                  value={
                    content.viewAllUrl ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateContent({
                      viewAllUrl:
                        event.target
                          .value,
                    })
                  }
                  className="admin-input"
                  placeholder="/collections/hot-deals"
                />

                <p className="mt-1.5 text-xs leading-5 text-[#6d7175]">
                  Example:
                  {" "}
                  /collections/hot-deals
                </p>
              </div>
            </>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Carousel Navigation
          |--------------------------------------------------------------------------
          */}

          <div className="md:col-span-2">
            <BooleanCard
              label="Show carousel navigation"
              description="Display previous and next product buttons."
              value={
                flashSettings.showNavigation !==
                false
              }
              onChange={(
                showNavigation
              ) =>
                updateSettings({
                  showNavigation,
                })
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}