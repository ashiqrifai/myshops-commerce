"use client";

import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  LoaderCircle,
  Plus,
  Replace,
  Trash2,
} from "lucide-react";

import { useMemo, useState } from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";
import { useGetMediaAssetByIdQuery } from "@/store/api/mediaApi";
import type { MediaAsset } from "@/types/media";

interface TrustBenefitsEditorProps {
  value: Record<string, unknown>;
  settings: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onSettingsChange: (value: Record<string, unknown>) => void;
}

interface TrustBenefitItem {
  id: string;
  title: string;
  subtitle: string;
  iconAssetId: string | null;
  isActive: boolean;
}

interface IconMediaFieldProps {
  value: string | null;
  onChange: (assetId: string | null) => void;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

const getAssetPreviewUrl = (
  asset?: MediaAsset | null
): string | null => {
  if (!asset) return null;

  const preferredTypes = [
    "PREVIEW",
    "THUMBNAIL",
    "SMALL",
    "MEDIUM",
    "ORIGINAL",
  ];

  for (const variantType of preferredTypes) {
    const variant = asset.variants?.find(
      (item) =>
        item.variantType === variantType &&
        item.isActive &&
        Boolean(item.publicUrl)
    );

    if (variant?.publicUrl) {
      return resolveMediaUrl(variant.publicUrl);
    }
  }

  return resolveMediaUrl(asset.publicUrl);
};

const createBenefitId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `benefit-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const createEmptyBenefit = (): TrustBenefitItem => ({
  id: createBenefitId(),
  title: "",
  subtitle: "",
  iconAssetId: null,
  isActive: true,
});

const normalizeBenefit = (
  input: unknown
): TrustBenefitItem => {
  const source =
    input &&
    typeof input === "object" &&
    !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  return {
    id:
      typeof source.id === "string" &&
      source.id.trim()
        ? source.id
        : createBenefitId(),

    title:
      typeof source.title === "string"
        ? source.title
        : "",

    subtitle:
      typeof source.subtitle === "string"
        ? source.subtitle
        : "",

    iconAssetId:
      typeof source.iconAssetId === "string"
        ? source.iconAssetId
        : null,

    isActive:
      source.isActive !== false,
  };
};

function IconMediaField({
  value,
  onChange,
}: IconMediaFieldProps) {
  const [pickerOpen, setPickerOpen] =
    useState(false);

  const {
    data,
    isLoading,
    isFetching,
  } = useGetMediaAssetByIdQuery(
    value || "",
    {
      skip: !value,
    }
  );

  const asset = data?.data || null;
  const previewUrl = getAssetPreviewUrl(asset);

  const handleSelection = (
    selectedAsset: MediaAsset
  ) => {
    onChange(selectedAsset.id);
    setPickerOpen(false);
  };

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium">
          Icon
        </label>

        {!value ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex min-h-[130px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-[#fafafa] px-4 text-center transition hover:border-[#8c9196] hover:bg-[#f6f6f7]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <ImageIcon
                size={20}
                className="text-[#6d7175]"
              />
            </div>

            <p className="mt-3 text-sm font-semibold">
              Choose icon
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              Select from the Digital Asset Library.
            </p>
          </button>
        ) : isLoading || isFetching ? (
          <div className="flex min-h-[130px] items-center justify-center rounded-xl border border-[#e1e3e5] bg-[#fafafa]">
            <LoaderCircle
              size={22}
              className="animate-spin"
            />
          </div>
        ) : asset && previewUrl ? (
          <div className="rounded-xl border border-[#e1e3e5] bg-white p-4">
            <div className="flex h-[100px] items-center justify-center rounded-lg bg-[#f6f6f7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={
                  asset.altText ||
                  asset.title ||
                  "Benefit icon"
                }
                className="max-h-[72px] max-w-[72px] object-contain"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
              >
                <Replace size={15} />
                Replace
              </button>

              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-red-700 hover:bg-red-50"
                aria-label="Remove icon"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-left"
          >
            <p className="text-sm font-semibold text-red-800">
              Selected icon unavailable
            </p>

            <p className="mt-1 text-xs text-red-700">
              Click to choose a replacement.
            </p>
          </button>
        )}
      </div>

      {pickerOpen ? (
        <MediaAssetPicker
          key={value || "benefit-icon-empty"}
          isOpen
          selectedAssetId={value}
          title="Select benefit icon"
          description="Choose an icon for this trust benefit."
          classification="CMS"
          allowPdf={false}
          onClose={() => setPickerOpen(false)}
          onSelect={handleSelection}
        />
      ) : null}
    </>
  );
}

export default function TrustBenefitsEditor({
  value,
  settings,
  onChange,
  onSettingsChange,
}: TrustBenefitsEditorProps) {
  const benefits = useMemo(() => {
    const raw =
      Array.isArray(value.items)
        ? value.items
        : [];

    return raw.map(normalizeBenefit);
  }, [value.items]);

  const updateBenefits = (
    next: TrustBenefitItem[]
  ) => {
    onChange({
      ...value,
      items: next,
    });
  };

  const handleChange = (
    index: number,
    updates: Partial<TrustBenefitItem>
  ) => {
    updateBenefits(
      benefits.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...updates,
            }
          : item
      )
    );
  };

  const handleAdd = () => {
    updateBenefits([
      ...benefits,
      createEmptyBenefit(),
    ]);
  };

  const handleDelete = (
    index: number
  ) => {
    updateBenefits(
      benefits.filter(
        (_item, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  const handleMove = (
    index: number,
    direction: "UP" | "DOWN"
  ) => {
    const target =
      direction === "UP"
        ? index - 1
        : index + 1;

    if (
      target < 0 ||
      target >= benefits.length
    ) {
      return;
    }

    const next = [...benefits];

    [next[index], next[target]] = [
      next[target],
      next[index],
    ];

    updateBenefits(next);
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#e1e3e5] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Trust benefits
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#6d7175]">
            Configure delivery, warranty, returns and authenticity cards.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
        >
          <Plus size={17} />
          Add benefit
        </button>
      </div>

      <div className="border-b border-[#e1e3e5] bg-white p-5">
        <h3 className="text-sm font-semibold">
          Layout &amp; spacing
        </h3>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          Choose grid or carousel independently for desktop and mobile, then control the vertical spacing around the section.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Desktop display
            </label>

            <select
              value={
                typeof settings.desktopDisplay === "string"
                  ? settings.desktopDisplay
                  : "GRID"
              }
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  desktopDisplay: event.target.value,
                })
              }
              className="admin-input"
            >
              <option value="GRID">Grid</option>
              <option value="CAROUSEL">Carousel</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Mobile display
            </label>

            <select
              value={
                typeof settings.mobileDisplay === "string"
                  ? settings.mobileDisplay
                  : "GRID"
              }
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  mobileDisplay: event.target.value,
                })
              }
              className="admin-input"
            >
              <option value="GRID">Grid</option>
              <option value="CAROUSEL">Carousel</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4">
            <input
              type="checkbox"
              checked={settings.showArrows !== false}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  showArrows: event.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-[#8c9196] accent-[#303030]"
            />

            <span>
              <span className="block text-sm font-medium">
                Show arrows
              </span>

              <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                Display left and right carousel navigation arrows.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4">
            <input
              type="checkbox"
              checked={settings.autoScroll === true}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  autoScroll: event.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-[#8c9196] accent-[#303030]"
            />

            <span>
              <span className="block text-sm font-medium">
                Auto scroll
              </span>

              <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                Automatically scroll when a carousel display is enabled.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4">
            <input
              type="checkbox"
              checked={settings.infiniteLoop !== false}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  infiniteLoop: event.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-[#8c9196] accent-[#303030]"
            />

            <span>
              <span className="block text-sm font-medium">
                Infinite loop
              </span>

              <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                Continue from the first card after reaching the last card.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 max-w-sm">
          <label className="mb-1.5 block text-xs font-medium">
            Auto scroll interval (seconds)
          </label>

          <input
            type="number"
            min={2}
            max={30}
            value={Number(settings.autoScrollInterval ?? 4)}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                autoScrollInterval: Math.max(
                  2,
                  Math.min(30, Number(event.target.value) || 4)
                ),
              })
            }
            className="admin-input"
          />

          <p className="mt-1 text-xs text-[#6d7175]">
            Used only when Auto scroll is enabled.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Desktop columns
            </label>

            <select
              value={Number(
                settings.columnsDesktop ??
                  4
              )}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  columnsDesktop:
                    Number(
                      event.target.value
                    ),
                })
              }
              className="admin-input"
            >
              {[1, 2, 3, 4].map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Tablet columns
            </label>

            <select
              value={Number(
                settings.columnsTablet ??
                  2
              )}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  columnsTablet:
                    Number(
                      event.target.value
                    ),
                })
              }
              className="admin-input"
            >
              {[1, 2, 3, 4].map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Mobile columns
            </label>

            <select
              value={Number(
                settings.columnsMobile ??
                  1
              )}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  columnsMobile:
                    Number(
                      event.target.value
                    ),
                })
              }
              className="admin-input"
            >
              {[1, 2].map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Top gap (px)
            </label>

            <input
              type="number"
              min={0}
              max={200}
              value={Number(settings.paddingTop ?? 12)}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  paddingTop: Math.max(0, Number(event.target.value) || 0),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Bottom gap (px)
            </label>

            <input
              type="number"
              min={0}
              max={200}
              value={Number(settings.paddingBottom ?? 12)}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  paddingBottom: Math.max(0, Number(event.target.value) || 0),
                })
              }
              className="admin-input"
            />
          </div>
        </div>
      </div>

      {benefits.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h3 className="text-base font-semibold">
            No trust benefits
          </h3>

          <p className="mt-2 text-sm text-[#6d7175]">
            Add your first benefit card.
          </p>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Add benefit
          </button>
        </div>
      ) : (
        <div className="space-y-5 bg-[#f6f6f7] p-5">
          {benefits.map(
            (item, index) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-sm"
              >
                <header className="flex items-center justify-between gap-4 border-b border-[#e1e3e5] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {item.title ||
                        `Benefit ${index + 1}`}
                    </p>

                    <p className="mt-1 text-xs text-[#6d7175]">
                      {item.isActive
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        handleMove(
                          index,
                          "UP"
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white disabled:opacity-40"
                      aria-label="Move benefit up"
                    >
                      <ArrowUp size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        index ===
                        benefits.length - 1
                      }
                      onClick={() =>
                        handleMove(
                          index,
                          "DOWN"
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white disabled:opacity-40"
                      aria-label="Move benefit down"
                    >
                      <ArrowDown size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(index)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                      aria-label="Delete benefit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </header>

                <div className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <IconMediaField
                    value={item.iconAssetId}
                    onChange={(assetId) =>
                      handleChange(
                        index,
                        {
                          iconAssetId:
                            assetId,
                        }
                      )
                    }
                  />

                  <div className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Title
                      </label>

                      <input
                        value={item.title}
                        onChange={(event) =>
                          handleChange(
                            index,
                            {
                              title:
                                event.target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="24-Hour Delivery"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Subtitle
                      </label>

                      <input
                        value={item.subtitle}
                        onChange={(event) =>
                          handleChange(
                            index,
                            {
                              subtitle:
                                event.target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="Fast shipping across Emirates"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-5 rounded-xl border border-[#e1e3e5] bg-white p-4">
                      <div>
                        <p className="text-sm font-medium">
                          Active benefit
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                          Inactive benefits remain saved but are not shown publicly.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleChange(
                            index,
                            {
                              isActive:
                                !item.isActive,
                            }
                          )
                        }
                        className={[
                          "relative h-6 w-11 shrink-0 rounded-full transition",
                          item.isActive
                            ? "bg-[#303030]"
                            : "bg-[#c9cccf]",
                        ].join(" ")}
                        aria-pressed={item.isActive}
                      >
                        <span
                          className={[
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                            item.isActive
                              ? "left-[22px]"
                              : "left-0.5",
                          ].join(" ")}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}
