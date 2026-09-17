"use client";

import {
  ArrowDown,
  ArrowUp,
  Grid3X3,
  ImageIcon,
  LoaderCircle,
  Plus,
  Replace,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";
import { useGetMediaAssetByIdQuery } from "@/store/api/mediaApi";

import type { MediaAsset } from "@/types/media";

type MobileDisplayMode =
  | "STACK"
  | "GRID"
  | "CAROUSEL";

type HeightMode =
  | "UNIFORM"
  | "PER_ITEM";

type ImageFit =
  | "COVER"
  | "CONTAIN"
  | "FILL";

type ImagePosition =
  | "CENTER"
  | "LEFT"
  | "RIGHT"
  | "TOP"
  | "BOTTOM";

interface PromotionBannerItem {
  id: string;

  desktopAssetId?: string | null;
  tabletAssetId?: string | null;
  mobileAssetId?: string | null;

  altText?: string;
  linkUrl?: string;
  openInNewTab?: boolean;

  buttonLabel?: string;
  buttonUrl?: string;
  buttonPosition?:
    | "LEFT"
    | "CENTER"
    | "RIGHT";

  desktopSpan?: number;
  tabletSpan?: number;
  mobileSpan?: number;

  desktopHeight?: number;
  tabletHeight?: number;
  mobileHeight?: number;

  imageFit?: ImageFit;
  imagePosition?: ImagePosition;
}

interface PromotionBannerGridContent {
  title?: string;
  subtitle?: string;
  items?: PromotionBannerItem[];
}

interface PromotionBannerGridSettings {
  layoutPreset?: string;
  heightMode?: HeightMode;
  mobileDisplayMode?: MobileDisplayMode;

  desktopGap?: number;
  tabletGap?: number;
  mobileGap?: number;

  desktopHeight?: number;
  tabletHeight?: number;
  mobileHeight?: number;

  borderRadius?: number;
  sectionPaddingTop?: number;
  sectionPaddingBottom?: number;
}

interface PromotionBannerGridEditorProps {
  value: Record<string, unknown>;
  settings: Record<string, unknown>;

  onChange: (
    value: Record<string, unknown>
  ) => void;

  onSettingsChange: (
    value: Record<string, unknown>
  ) => void;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const clampInteger = (
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.round(number)
    )
  );
};

const createBannerId = (): string =>
  typeof crypto !== "undefined" &&
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `banner-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

const createBanner = (
  overrides: Partial<PromotionBannerItem> = {}
): PromotionBannerItem => ({
  id: createBannerId(),

  desktopAssetId: null,
  tabletAssetId: null,
  mobileAssetId: null,

  altText: "",
  linkUrl: "",
  openInNewTab: false,

  buttonLabel: "",
  buttonUrl: "",
  buttonPosition: "LEFT",

  desktopSpan: 4,
  tabletSpan: 3,
  mobileSpan: 1,

  desktopHeight: 420,
  tabletHeight: 320,
  mobileHeight: 280,

  imageFit: "COVER",
  imagePosition: "CENTER",

  ...overrides,
});

const resolveMediaUrl = (
  value?: string | null
): string | null => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `${API_BASE_URL}${
    value.startsWith("/")
      ? value
      : `/${value}`
  }`;
};

const getAssetPreviewUrl = (
  asset?: MediaAsset | null
): string | null => {
  if (!asset) {
    return null;
  }

  const enriched =
    asset as MediaAsset & {
      previewUrl?: string | null;
      thumbnailUrl?: string | null;
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
          Boolean(item.publicUrl)
      );

    if (variant?.publicUrl) {
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
};

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
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
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (
    assetId: string | null
  ) => void;
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    locallySelectedAsset,
    setLocallySelectedAsset,
  ] = useState<
    MediaAsset | null
  >(null);

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

  /*
   * Supports both possible API shapes:
   *
   * {
   *   data: {
   *     asset: {...}
   *   }
   * }
   *
   * and:
   *
   * {
   *   data: {...}
   * }
   */
  const response =
    data as
      | {
          data?:
            | MediaAsset
            | {
                asset?:
                  MediaAsset;
              };
        }
      | undefined;

  const queriedAsset =
    response?.data &&
    typeof response.data ===
      "object" &&
    "asset" in response.data
      ? response.data.asset ||
        null
      : (response?.data as
          | MediaAsset
          | undefined) ||
        null;

  const asset =
    locallySelectedAsset ||
    queriedAsset;

  const previewUrl =
    getAssetPreviewUrl(
      asset
    );

  const handleRemove = () => {
    setLocallySelectedAsset(
      null
    );

    onChange(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] px-4 py-3">
          <p className="text-sm font-medium text-[#202223]">
            {label}
          </p>
        </div>

        {isFetching &&
        !locallySelectedAsset ? (
          <div className="flex aspect-[16/7] items-center justify-center bg-[#f6f6f7]">
            <LoaderCircle
              size={22}
              className="animate-spin text-[#6d7175]"
            />
          </div>
        ) : previewUrl ? (
          <div className="relative aspect-[16/7] bg-[#f6f6f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={
                asset?.altText ||
                asset?.title ||
                label
              }
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-black/45 p-2">
              <button
                type="button"
                onClick={() =>
                  setIsOpen(true)
                }
                className="flex h-8 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium"
              >
                <Replace
                  size={14}
                />

                Replace
              </button>

              <button
                type="button"
                onClick={
                  handleRemove
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600"
                aria-label={`Remove ${label}`}
              >
                <Trash2
                  size={14}
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
            className="flex aspect-[16/7] w-full flex-col items-center justify-center bg-[#f6f6f7] p-4 text-center hover:bg-[#eef0f2]"
          >
            <ImageIcon
              size={25}
              className="text-[#8c9196]"
            />

            <span className="mt-2 text-sm font-semibold">
              Select image
            </span>
          </button>
        )}
      </div>

      <MediaAssetPicker
        isOpen={isOpen}
        selectedAssetId={
          value
        }
        title={`Select ${label}`}
        description="Choose promotional artwork from the media library."
        classification="PROMOTION"
        onClose={() =>
          setIsOpen(false)
        }
        onSelect={(
          selectedAsset
        ) => {
          /*
           * Show the preview immediately
           * without waiting for another API
           * request.
           */
          setLocallySelectedAsset(
            selectedAsset
          );

          /*
           * Store the asset UUID inside the
           * corresponding banner item.
           */ 
          onChange(
            selectedAsset.id
          );

          setIsOpen(false);
        }}
      />
    </>
  );
}

const PRESETS: Record<
  string,
  number[]
> = {
  FULL_WIDTH: [12],
  TWO_EQUAL: [6, 6],
  THREE_EQUAL: [4, 4, 4],
  FEATURED_LEFT: [6, 3, 3],
  FEATURED_RIGHT: [3, 3, 6],
  TWO_THIRDS_LEFT: [8, 4],
  TWO_THIRDS_RIGHT: [4, 8],
  FOUR_EQUAL: [3, 3, 3, 3],
};

export default function PromotionBannerGridEditor({
  value,
  settings,
  onChange,
  onSettingsChange,
}: PromotionBannerGridEditorProps) {
  const content =
    value as PromotionBannerGridContent;

  const gridSettings =
    settings as PromotionBannerGridSettings;

  const items =
    Array.isArray(content.items)
      ? content.items
      : [];

  const updateContent = (
    changes:
      Partial<PromotionBannerGridContent>
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const updateSettings = (
    changes:
      Partial<PromotionBannerGridSettings>
  ) => {
    onSettingsChange({
      ...settings,
      ...changes,
    });
  };

  const updateItem = (
    index: number,
    changes:
      Partial<PromotionBannerItem>
  ) => {
    const nextItems =
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes,
            }
          : item
      );

    updateContent({
      items: nextItems,
    });
  };

  const addBanner = () => {
    updateContent({
      items: [
        ...items,
        createBanner(),
      ],
    });
  };

  const removeBanner = (
    index: number
  ) => {
    updateContent({
      items: items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    });
  };

  const moveBanner = (
    index: number,
    direction: -1 | 1
  ) => {
    const targetIndex =
      index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= items.length
    ) {
      return;
    }

    const nextItems =
      [...items];

    [
      nextItems[index],
      nextItems[targetIndex],
    ] = [
      nextItems[targetIndex],
      nextItems[index],
    ];

    updateContent({
      items: nextItems,
    });
  };

  const applyPreset = (
    preset: string
  ) => {
    const spans =
      PRESETS[preset];

    if (!spans) {
      updateSettings({
        layoutPreset: "CUSTOM",
      });

      return;
    }

    const nextItems =
      spans.map(
        (desktopSpan, index) => {
          const current =
            items[index] ||
            createBanner();

          return {
            ...current,
            desktopSpan,
            tabletSpan:
              spans.length === 1
                ? 6
                : spans.length === 2
                  ? 3
                  : index === 0 &&
                      desktopSpan >= 6
                    ? 6
                    : 3,
            mobileSpan: 1,
          };
        }
      );

    updateContent({
      items: nextItems,
    });

    updateSettings({
      layoutPreset: preset,
    });
  };

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <Grid3X3 size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Promotion banner grid
              </h2>

              <p className="mt-1 text-sm text-[#6d7175]">
                Build responsive campaign layouts using a dynamic 12-column desktop grid.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <FieldLabel>
              Optional heading
            </FieldLabel>

            <input
              value={
                content.title || ""
              }
              onChange={(event) =>
                updateContent({
                  title:
                    event.target.value,
                })
              }
              className="admin-input"
              placeholder="Featured offers"
            />
          </div>

          <div>
            <FieldLabel>
              Optional subtitle
            </FieldLabel>

            <input
              value={
                content.subtitle ||
                ""
              }
              onChange={(event) =>
                updateContent({
                  subtitle:
                    event.target.value,
                })
              }
              className="admin-input"
              placeholder="Campaigns selected for you"
            />
          </div>

          <div>
            <FieldLabel>
              Layout preset
            </FieldLabel>

            <select
              value={
                gridSettings.layoutPreset ||
                "CUSTOM"
              }
              onChange={(event) =>
                applyPreset(
                  event.target.value
                )
              }
              className="admin-input"
            >
              <option value="CUSTOM">
                Custom
              </option>
              <option value="FULL_WIDTH">
                Full width
              </option>
              <option value="TWO_EQUAL">
                Two equal
              </option>
              <option value="THREE_EQUAL">
                Three equal
              </option>
              <option value="FEATURED_LEFT">
                Featured left
              </option>
              <option value="FEATURED_RIGHT">
                Featured right
              </option>
              <option value="TWO_THIRDS_LEFT">
                Two-thirds left
              </option>
              <option value="TWO_THIRDS_RIGHT">
                Two-thirds right
              </option>
              <option value="FOUR_EQUAL">
                Four equal
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Height mode
            </FieldLabel>

            <select
              value={
                gridSettings.heightMode ||
                "UNIFORM"
              }
              onChange={(event) =>
                updateSettings({
                  heightMode:
                    event.target
                      .value as HeightMode,
                })
              }
              className="admin-input"
            >
              <option value="UNIFORM">
                Uniform per breakpoint
              </option>
              <option value="PER_ITEM">
                Per banner
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Mobile display
            </FieldLabel>

            <select
              value={
                gridSettings.mobileDisplayMode ||
                "STACK"
              }
              onChange={(event) =>
                updateSettings({
                  mobileDisplayMode:
                    event.target
                      .value as MobileDisplayMode,
                })
              }
              className="admin-input"
            >
              <option value="STACK">
                Stacked
              </option>
              <option value="GRID">
                Grid
              </option>
              <option value="CAROUSEL">
                Horizontal carousel
              </option>
            </select>
          </div>

          <div>
            <FieldLabel>
              Border radius
            </FieldLabel>

            <input
              type="number"
              min={0}
              max={48}
              value={
                gridSettings.borderRadius ??
                16
              }
              onChange={(event) =>
                updateSettings({
                  borderRadius:
                    clampInteger(
                      event.target.value,
                      0,
                      48,
                      16
                    ),
                })
              }
              className="admin-input"
            />
          </div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold">
            Responsive spacing and height
          </h2>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-3">
          {[
            [
              "desktopGap",
              "Desktop gap",
              24,
            ],
            [
              "tabletGap",
              "Tablet gap",
              16,
            ],
            [
              "mobileGap",
              "Mobile gap",
              12,
            ],
          ].map(
            ([key, label, fallback]) => (
              <div key={String(key)}>
                <FieldLabel>
                  {String(label)}
                </FieldLabel>

                <input
                  type="number"
                  min={0}
                  max={64}
                  value={
                    Number(
                      gridSettings[
                        key as keyof PromotionBannerGridSettings
                      ] ?? fallback
                    )
                  }
                  onChange={(event) =>
                    updateSettings({
                      [key]:
                        clampInteger(
                          event.target.value,
                          0,
                          64,
                          Number(fallback)
                        ),
                    })
                  }
                  className="admin-input"
                />
              </div>
            )
          )}

          {[
            [
              "desktopHeight",
              "Desktop uniform height",
              420,
            ],
            [
              "tabletHeight",
              "Tablet uniform height",
              320,
            ],
            [
              "mobileHeight",
              "Mobile uniform height",
              280,
            ],
          ].map(
            ([key, label, fallback]) => (
              <div key={String(key)}>
                <FieldLabel>
                  {String(label)}
                </FieldLabel>

                <input
                  type="number"
                  min={120}
                  max={1200}
                  disabled={
                    gridSettings.heightMode ===
                    "PER_ITEM"
                  }
                  value={
                    Number(
                      gridSettings[
                        key as keyof PromotionBannerGridSettings
                      ] ?? fallback
                    )
                  }
                  onChange={(event) =>
                    updateSettings({
                      [key]:
                        clampInteger(
                          event.target.value,
                          120,
                          1200,
                          Number(fallback)
                        ),
                    })
                  }
                  className="admin-input disabled:bg-[#f1f2f3]"
                />
              </div>
            )
          )}
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-base font-semibold">
              Banners
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Column spans are independently configurable for every breakpoint.
            </p>
          </div>

          <button
            type="button"
            onClick={addBanner}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            <Plus size={16} />
            Add banner
          </button>
        </div>

        <div className="space-y-5 p-6">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7] p-10 text-center">
              <Grid3X3
                size={32}
                className="mx-auto text-[#8c9196]"
              />

              <p className="mt-3 font-medium">
                No promotional banners
              </p>

              <p className="mt-1 text-sm text-[#6d7175]">
                Add a banner or select a layout preset.
              </p>
            </div>
          ) : (
            items.map(
              (item, index) => (
                <article
                  key={
                    item.id ||
                    `banner-${index}`
                  }
                  className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-[#fafafa]"
                >
                  <header className="flex items-center justify-between gap-4 border-b border-[#e1e3e5] bg-white px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold">
                        Banner {index + 1}
                      </p>

                      <p className="mt-0.5 text-xs text-[#6d7175]">
                        Desktop span {item.desktopSpan ?? 4}/12
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() =>
                          moveBanner(
                            index,
                            -1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white disabled:opacity-35"
                        aria-label="Move banner up"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          items.length - 1
                        }
                        onClick={() =>
                          moveBanner(
                            index,
                            1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white disabled:opacity-35"
                        aria-label="Move banner down"
                      >
                        <ArrowDown size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeBanner(index)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                        aria-label="Remove banner"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </header>

                  <div className="grid gap-4 p-5 lg:grid-cols-3">
                    <MediaField
                      label="Desktop image"
                      value={
                        item.desktopAssetId ||
                        null
                      }
                      onChange={(
                        desktopAssetId
                      ) =>
                        updateItem(index, {
                          desktopAssetId,
                        })
                      }
                    />

                    <MediaField
                      label="Tablet image (optional)"
                      value={
                        item.tabletAssetId ||
                        null
                      }
                      onChange={(
                        tabletAssetId
                      ) =>
                        updateItem(index, {
                          tabletAssetId,
                        })
                      }
                    />

                    <MediaField
                      label="Mobile image (optional)"
                      value={
                        item.mobileAssetId ||
                        null
                      }
                      onChange={(
                        mobileAssetId
                      ) =>
                        updateItem(index, {
                          mobileAssetId,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-4 border-t border-[#e1e3e5] bg-white p-5 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      [
                        "desktopSpan",
                        "Desktop span",
                        1,
                        12,
                        4,
                      ],
                      [
                        "tabletSpan",
                        "Tablet span",
                        1,
                        6,
                        3,
                      ],
                      [
                        "mobileSpan",
                        "Mobile span",
                        1,
                        2,
                        1,
                      ],
                    ].map(
                      ([
                        key,
                        label,
                        min,
                        max,
                        fallback,
                      ]) => (
                        <div key={String(key)}>
                          <FieldLabel>
                            {String(label)}
                          </FieldLabel>

                          <input
                            type="number"
                            min={Number(min)}
                            max={Number(max)}
                            value={
                              Number(
                                item[
                                  key as keyof PromotionBannerItem
                                ] ??
                                  fallback
                              )
                            }
                            onChange={(event) =>
                              updateItem(index, {
                                [key]:
                                  clampInteger(
                                    event.target.value,
                                    Number(min),
                                    Number(max),
                                    Number(fallback)
                                  ),
                              })
                            }
                            className="admin-input"
                          />
                        </div>
                      )
                    )}

                    {gridSettings.heightMode ===
                    "PER_ITEM"
                      ? [
                          [
                            "desktopHeight",
                            "Desktop height",
                            420,
                          ],
                          [
                            "tabletHeight",
                            "Tablet height",
                            320,
                          ],
                          [
                            "mobileHeight",
                            "Mobile height",
                            280,
                          ],
                        ].map(
                          ([
                            key,
                            label,
                            fallback,
                          ]) => (
                            <div
                              key={String(key)}
                            >
                              <FieldLabel>
                                {String(label)}
                              </FieldLabel>

                              <input
                                type="number"
                                min={120}
                                max={1200}
                                value={
                                  Number(
                                    item[
                                      key as keyof PromotionBannerItem
                                    ] ??
                                      fallback
                                  )
                                }
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    {
                                      [key]:
                                        clampInteger(
                                          event.target.value,
                                          120,
                                          1200,
                                          Number(
                                            fallback
                                          )
                                        ),
                                    }
                                  )
                                }
                                className="admin-input"
                              />
                            </div>
                          )
                        )
                      : null}

                    <div>
                      <FieldLabel>
                        Image fit
                      </FieldLabel>

                      <select
                        value={
                          item.imageFit ||
                          "COVER"
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            imageFit:
                              event.target
                                .value as ImageFit,
                          })
                        }
                        className="admin-input"
                      >
                        <option value="COVER">
                          Cover
                        </option>
                        <option value="CONTAIN">
                          Contain
                        </option>
                        <option value="FILL">
                          Fill
                        </option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>
                        Image position
                      </FieldLabel>

                      <select
                        value={
                          item.imagePosition ||
                          "CENTER"
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            imagePosition:
                              event.target
                                .value as ImagePosition,
                          })
                        }
                        className="admin-input"
                      >
                        <option value="CENTER">
                          Center
                        </option>
                        <option value="LEFT">
                          Left
                        </option>
                        <option value="RIGHT">
                          Right
                        </option>
                        <option value="TOP">
                          Top
                        </option>
                        <option value="BOTTOM">
                          Bottom
                        </option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>
                        Alternative text
                      </FieldLabel>

                      <input
                        value={
                          item.altText || ""
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            altText:
                              event.target.value,
                          })
                        }
                        className="admin-input"
                        placeholder="Describe this promotion"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <FieldLabel>
                        Click URL
                      </FieldLabel>

                      <input
                        value={
                          item.linkUrl || ""
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            linkUrl:
                              event.target.value,
                          })
                        }
                        className="admin-input"
                        placeholder="/gaming"
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        CTA label
                      </FieldLabel>

                      <input
                        value={
                          item.buttonLabel || ""
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            buttonLabel:
                              event.target.value,
                          })
                        }
                        className="admin-input"
                        placeholder="Shop Now"
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        CTA URL
                      </FieldLabel>

                      <input
                        value={
                          item.buttonUrl || ""
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            buttonUrl:
                              event.target.value,
                          })
                        }
                        className="admin-input"
                        placeholder="/category/large-appliances"
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        CTA position
                      </FieldLabel>

                      <select
                        value={
                          item.buttonPosition ||
                          "LEFT"
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            buttonPosition:
                              event.target.value as
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

                    <label className="flex items-center gap-3 rounded-lg border border-[#e1e3e5] px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          item.openInNewTab ===
                          true
                        }
                        onChange={(event) =>
                          updateItem(index, {
                            openInNewTab:
                              event.target
                                .checked,
                          })
                        }
                      />

                      <span className="text-sm font-medium">
                        Open in new tab
                      </span>
                    </label>
                  </div>
                </article>
              )
            )
          )}
        </div>
      </section>
    </div>
  );
}
