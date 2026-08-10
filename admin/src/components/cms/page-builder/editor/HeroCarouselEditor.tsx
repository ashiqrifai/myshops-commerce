"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  ImageIcon,
  LoaderCircle,
  Plus,
  Replace,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

import {
  useGetMediaAssetByIdQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
} from "@/types/media";

interface HeroCarouselEditorProps {
  value: Record<string, unknown>;

  onChange: (
    value: Record<string, unknown>
  ) => void;
}

type HeroTextAlignment =
  | "LEFT"
  | "CENTER"
  | "RIGHT";

type HeroTextPosition =
  | "TOP_LEFT"
  | "TOP_CENTER"
  | "TOP_RIGHT"
  | "CENTER_LEFT"
  | "CENTER"
  | "CENTER_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_CENTER"
  | "BOTTOM_RIGHT";

interface HeroCarouselSlide {
  id: string;

  desktopAssetId: string | null;
  mobileAssetId: string | null;

  eyebrow: string;
  title: string;
  description: string;

  buttonLabel: string;
  buttonUrl: string;

  secondaryButtonLabel: string;
  secondaryButtonUrl: string;

  textAlignment: HeroTextAlignment;
  textPosition: HeroTextPosition;
  textColor: string;

  openInNewTab: boolean;
  isActive: boolean;
}

interface SlideMediaFieldProps {
  label: string;
  description: string;

  value: string | null;

  classification:
    | "CMS"
    | "MARKETING"
    | "PROMOTION";

  onChange: (
    assetId: string | null
  ) => void;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const createSlideId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `slide-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const createEmptySlide =
  (): HeroCarouselSlide => ({
    id: createSlideId(),

    desktopAssetId: null,
    mobileAssetId: null,

    eyebrow: "",
    title: "",
    description: "",

    buttonLabel: "",
    buttonUrl: "",

    secondaryButtonLabel: "",
    secondaryButtonUrl: "",

    textAlignment: "LEFT",
    textPosition: "CENTER_LEFT",
    textColor: "#FFFFFF",

    openInNewTab: false,
    isActive: true,
  });

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) {
    return null;
  }

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
  if (!asset) {
    return null;
  }

  const preferredTypes = [
    "PREVIEW",
    "THUMBNAIL",
    "MEDIUM",
    "SMALL",
    "ORIGINAL",
  ];

  for (const variantType of preferredTypes) {
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

  return resolveMediaUrl(
    asset.publicUrl
  );
};

const normalizeSlide = (
  input: unknown
): HeroCarouselSlide => {
  const source =
    input &&
    typeof input === "object" &&
    !Array.isArray(input)
      ? (input as Record<
          string,
          unknown
        >)
      : {};

  const alignment =
    source.textAlignment ===
      "CENTER" ||
    source.textAlignment ===
      "RIGHT"
      ? source.textAlignment
      : "LEFT";

  const validPositions:
    HeroTextPosition[] = [
    "TOP_LEFT",
    "TOP_CENTER",
    "TOP_RIGHT",
    "CENTER_LEFT",
    "CENTER",
    "CENTER_RIGHT",
    "BOTTOM_LEFT",
    "BOTTOM_CENTER",
    "BOTTOM_RIGHT",
  ];

  const textPosition =
    validPositions.includes(
      source.textPosition as HeroTextPosition
    )
      ? (source.textPosition as HeroTextPosition)
      : "CENTER_LEFT";

  return {
    id:
      typeof source.id === "string" &&
      source.id.trim()
        ? source.id
        : createSlideId(),

    desktopAssetId:
      typeof source.desktopAssetId ===
      "string"
        ? source.desktopAssetId
        : null,

    mobileAssetId:
      typeof source.mobileAssetId ===
      "string"
        ? source.mobileAssetId
        : null,

    eyebrow:
      typeof source.eyebrow ===
      "string"
        ? source.eyebrow
        : "",

    title:
      typeof source.title === "string"
        ? source.title
        : "",

    description:
      typeof source.description ===
      "string"
        ? source.description
        : "",

    buttonLabel:
      typeof source.buttonLabel ===
      "string"
        ? source.buttonLabel
        : "",

    buttonUrl:
      typeof source.buttonUrl ===
      "string"
        ? source.buttonUrl
        : "",

    secondaryButtonLabel:
      typeof source.secondaryButtonLabel ===
      "string"
        ? source.secondaryButtonLabel
        : "",

    secondaryButtonUrl:
      typeof source.secondaryButtonUrl ===
      "string"
        ? source.secondaryButtonUrl
        : "",

    textAlignment: alignment,

    textPosition,

    textColor:
      typeof source.textColor ===
        "string" &&
      /^#[0-9A-Fa-f]{6}$/.test(
        source.textColor
      )
        ? source.textColor.toUpperCase()
        : "#FFFFFF",

    openInNewTab:
      source.openInNewTab === true,

    isActive:
      source.isActive !== false,
  };
};

function SlideMediaField({
  label,
  description,
  value,
  classification,
  onChange,
}: SlideMediaFieldProps) {
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

  const previewUrl =
    getAssetPreviewUrl(asset);

  const handleAssetSelection = (
    selectedAsset: MediaAsset
  ) => {
    onChange(selectedAsset.id);
    setPickerOpen(false);
  };

  return (
    <>
      <div>
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <label className="text-sm font-medium">
              {label}
            </label>

            <p className="mt-1 text-xs leading-5 text-[#6d7175]">
              {description}
            </p>
          </div>

          {value ? (
            <span className="rounded-full bg-[#e3f1df] px-2 py-1 text-[10px] font-medium text-[#276749]">
              Selected
            </span>
          ) : null}
        </div>

        {!value ? (
          <button
            type="button"
            onClick={() =>
              setPickerOpen(true)
            }
            className="flex min-h-[190px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-[#fafafa] px-5 text-center transition hover:border-[#8c9196] hover:bg-[#f6f6f7]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
              <ImageIcon
                size={21}
                className="text-[#6d7175]"
              />
            </div>

            <p className="mt-3 text-sm font-semibold">
              Choose image
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              Select from the Digital
              Asset Library.
            </p>
          </button>
        ) : isLoading ||
          isFetching ? (
          <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-[#e1e3e5] bg-[#fafafa]">
            <div className="text-center">
              <LoaderCircle
                size={22}
                className="mx-auto animate-spin"
              />

              <p className="mt-2 text-xs text-[#6d7175]">
                Loading image...
              </p>
            </div>
          </div>
        ) : asset && previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
            <div className="flex min-h-[190px] items-center justify-center bg-[#f6f6f7] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={
                  asset.altText ||
                  asset.title ||
                  asset.originalFileName
                }
                className="max-h-[230px] w-full object-contain"
              />
            </div>

            <div className="p-4">
              <p className="truncate text-sm font-semibold">
                {asset.title ||
                  asset.originalFileName}
              </p>

              <p className="mt-1 text-xs text-[#6d7175]">
                {asset.width &&
                asset.height
                  ? `${asset.width} × ${asset.height}`
                  : asset.extension.toUpperCase()}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPickerOpen(true)
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
                >
                  <Replace size={15} />
                  Replace
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChange(null)
                  }
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Selected image unavailable
            </p>

            <p className="mt-1 text-xs text-red-700">
              The saved asset could not
              be loaded.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setPickerOpen(true)
                }
                className="h-9 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700"
              >
                Choose replacement
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange(null)
                }
                className="h-9 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {pickerOpen ? (
        <MediaAssetPicker
          key={
            value ||
            `${label}-empty`
          }
          isOpen
          selectedAssetId={value}
          title={`Select ${label}`}
          description={description}
          classification={
            classification
          }
          allowPdf={false}
          onClose={() =>
            setPickerOpen(false)
          }
          onSelect={
            handleAssetSelection
          }
        />
      ) : null}
    </>
  );
}

export default function HeroCarouselEditor({
  value,
  onChange,
}: HeroCarouselEditorProps) {
  const slides = useMemo(() => {
    const rawSlides =
      Array.isArray(value.slides)
        ? value.slides
        : [];

    return rawSlides.map(
      normalizeSlide
    );
  }, [value.slides]);

  const updateSlides = (
    nextSlides: HeroCarouselSlide[]
  ) => {
    onChange({
      ...value,
      slides: nextSlides,
    });
  };

  const handleAddSlide = () => {
    updateSlides([
      ...slides,
      createEmptySlide(),
    ]);
  };

  const handleSlideChange = (
    slideIndex: number,
    updates: Partial<HeroCarouselSlide>
  ) => {
    updateSlides(
      slides.map((slide, index) =>
        index === slideIndex
          ? {
              ...slide,
              ...updates,
            }
          : slide
      )
    );
  };

  const handleDuplicateSlide = (
    slideIndex: number
  ) => {
    const source =
      slides[slideIndex];

    if (!source) {
      return;
    }

    const duplicate: HeroCarouselSlide =
      {
        ...source,
        id: createSlideId(),
        title: source.title
          ? `${source.title} Copy`
          : "",
      };

    const nextSlides = [
      ...slides,
    ];

    nextSlides.splice(
      slideIndex + 1,
      0,
      duplicate
    );

    updateSlides(nextSlides);
  };

  const handleDeleteSlide = (
    slideIndex: number
  ) => {
    updateSlides(
      slides.filter(
        (_slide, index) =>
          index !== slideIndex
      )
    );
  };

  const handleMoveSlide = (
    slideIndex: number,
    direction: "UP" | "DOWN"
  ) => {
    const targetIndex =
      direction === "UP"
        ? slideIndex - 1
        : slideIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= slides.length
    ) {
      return;
    }

    const nextSlides = [
      ...slides,
    ];

    const temporary =
      nextSlides[slideIndex];

    nextSlides[slideIndex] =
      nextSlides[targetIndex];

    nextSlides[targetIndex] =
      temporary;

    updateSlides(nextSlides);
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#e1e3e5] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Hero slides
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#6d7175]">
            Create responsive homepage
            slides using desktop and mobile
            images from the Digital Asset
            Library.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddSlide}
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
        >
          <Plus size={17} />
          Add slide
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3]">
            <ImageIcon
              size={26}
              className="text-[#6d7175]"
            />
          </div>

          <h3 className="mt-4 text-base font-semibold">
            No hero slides
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7175]">
            Add the first slide and select
            desktop and mobile images from
            your media library.
          </p>

          <button
            type="button"
            onClick={handleAddSlide}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Add first slide
          </button>
        </div>
      ) : (
        <div className="space-y-5 bg-[#f6f6f7] p-5">
          {slides.map(
            (slide, slideIndex) => (
              <article
                key={slide.id}
                className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-sm"
              >
                <header className="flex flex-col gap-4 border-b border-[#e1e3e5] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f2f3] text-sm font-semibold">
                      {slideIndex + 1}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold">
                        {slide.title ||
                          `Slide ${
                            slideIndex +
                            1
                          }`}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-xs text-[#6d7175]">
                        <span>
                          {slide.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                        {slide.desktopAssetId ? (
                          <>
                            <span>•</span>

                            <span>
                              Desktop image
                              selected
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleMoveSlide(
                          slideIndex,
                          "UP"
                        )
                      }
                      disabled={
                        slideIndex === 0
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move slide up"
                    >
                      <ArrowUp
                        size={16}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleMoveSlide(
                          slideIndex,
                          "DOWN"
                        )
                      }
                      disabled={
                        slideIndex ===
                        slides.length - 1
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move slide down"
                    >
                      <ArrowDown
                        size={16}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDuplicateSlide(
                          slideIndex
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
                    >
                      <Copy size={15} />
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteSlide(
                          slideIndex
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </header>

                <div className="space-y-7 p-5">
                  <section>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold">
                        Slide images
                      </h4>

                      <p className="mt-1 text-xs text-[#6d7175]">
                        Desktop image is
                        required. Mobile image
                        is recommended for
                        portrait screens.
                      </p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <SlideMediaField
                        label="Desktop image"
                        description="Recommended size: 1920 × 700 WebP."
                        value={
                          slide.desktopAssetId
                        }
                        classification="CMS"
                        onChange={(
                          assetId
                        ) =>
                          handleSlideChange(
                            slideIndex,
                            {
                              desktopAssetId:
                                assetId,
                            }
                          )
                        }
                      />

                      <SlideMediaField
                        label="Mobile image"
                        description="Recommended size: 900 × 1200 WebP."
                        value={
                          slide.mobileAssetId
                        }
                        classification="CMS"
                        onChange={(
                          assetId
                        ) =>
                          handleSlideChange(
                            slideIndex,
                            {
                              mobileAssetId:
                                assetId,
                            }
                          )
                        }
                      />
                    </div>
                  </section>

                  <section className="border-t border-[#e1e3e5] pt-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold">
                        Slide content
                      </h4>

                      <p className="mt-1 text-xs text-[#6d7175]">
                        Add the promotional
                        heading, description and
                        action buttons.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Eyebrow text
                        </label>

                        <input
                          value={
                            slide.eyebrow
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                eyebrow:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="NEW TECHNOLOGY"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Slide title
                        </label>

                        <input
                          value={
                            slide.title
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                title:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="Upgrade Your Everyday"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium">
                          Description
                        </label>

                        <textarea
                          value={
                            slide.description
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                description:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input min-h-[110px] resize-y"
                          placeholder="Describe the offer, campaign or featured product range."
                        />
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-[#e1e3e5] pt-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold">
                        Primary button
                      </h4>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Button label
                        </label>

                        <input
                          value={
                            slide.buttonLabel
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                buttonLabel:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="Shop Now"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Button URL
                        </label>

                        <input
                          value={
                            slide.buttonUrl
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                buttonUrl:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="/products"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-[#e1e3e5] pt-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold">
                        Secondary button
                      </h4>

                      <p className="mt-1 text-xs text-[#6d7175]">
                        Optional secondary
                        action displayed beside
                        the primary button.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Button label
                        </label>

                        <input
                          value={
                            slide.secondaryButtonLabel
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                secondaryButtonLabel:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="View Offers"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Button URL
                        </label>

                        <input
                          value={
                            slide.secondaryButtonUrl
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                secondaryButtonUrl:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="/offers"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-[#e1e3e5] pt-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold">
                        Text appearance
                      </h4>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Text alignment
                        </label>

                        <select
                          value={
                            slide.textAlignment
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                textAlignment:
                                  event
                                    .target
                                    .value as HeroTextAlignment,
                              }
                            )
                          }
                          className="admin-input"
                        >
                          <option value="LEFT">
                            Left
                          </option>

                          <option value="CENTER">
                            Centre
                          </option>

                          <option value="RIGHT">
                            Right
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Text position
                        </label>

                        <select
                          value={
                            slide.textPosition
                          }
                          onChange={(
                            event
                          ) =>
                            handleSlideChange(
                              slideIndex,
                              {
                                textPosition:
                                  event
                                    .target
                                    .value as HeroTextPosition,
                              }
                            )
                          }
                          className="admin-input"
                        >
                          <option value="TOP_LEFT">
                            Top left
                          </option>

                          <option value="TOP_CENTER">
                            Top centre
                          </option>

                          <option value="TOP_RIGHT">
                            Top right
                          </option>

                          <option value="CENTER_LEFT">
                            Centre left
                          </option>

                          <option value="CENTER">
                            Centre
                          </option>

                          <option value="CENTER_RIGHT">
                            Centre right
                          </option>

                          <option value="BOTTOM_LEFT">
                            Bottom left
                          </option>

                          <option value="BOTTOM_CENTER">
                            Bottom centre
                          </option>

                          <option value="BOTTOM_RIGHT">
                            Bottom right
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Text colour
                        </label>

                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={
                              slide.textColor
                            }
                            onChange={(
                              event
                            ) =>
                              handleSlideChange(
                                slideIndex,
                                {
                                  textColor:
                                    event
                                      .target
                                      .value.toUpperCase(),
                                }
                              )
                            }
                            className="h-[42px] w-12 rounded-lg border border-[#8c9196] bg-white p-1"
                          />

                          <input
                            value={
                              slide.textColor
                            }
                            onChange={(
                              event
                            ) =>
                              handleSlideChange(
                                slideIndex,
                                {
                                  textColor:
                                    event
                                      .target
                                      .value,
                                }
                              )
                            }
                            className="admin-input font-mono uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-[#e1e3e5] pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start justify-between gap-5 rounded-xl border border-[#e1e3e5] bg-white p-4">
                        <div>
                          <p className="text-sm font-medium">
                            Open links in new tab
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                            Applies to the primary
                            and secondary buttons.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleSlideChange(
                              slideIndex,
                              {
                                openInNewTab:
                                  !slide.openInNewTab,
                              }
                            )
                          }
                          className={[
                            "relative h-6 w-11 shrink-0 rounded-full transition",
                            slide.openInNewTab
                              ? "bg-[#303030]"
                              : "bg-[#c9cccf]",
                          ].join(" ")}
                          aria-pressed={
                            slide.openInNewTab
                          }
                        >
                          <span
                            className={[
                              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                              slide.openInNewTab
                                ? "left-[22px]"
                                : "left-0.5",
                            ].join(" ")}
                          />
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-5 rounded-xl border border-[#e1e3e5] bg-white p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={16}
                            />

                            <p className="text-sm font-medium">
                              Active slide
                            </p>
                          </div>

                          <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                            Inactive slides remain
                            saved but are not shown
                            publicly.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleSlideChange(
                              slideIndex,
                              {
                                isActive:
                                  !slide.isActive,
                              }
                            )
                          }
                          className={[
                            "relative h-6 w-11 shrink-0 rounded-full transition",
                            slide.isActive
                              ? "bg-[#303030]"
                              : "bg-[#c9cccf]",
                          ].join(" ")}
                          aria-pressed={
                            slide.isActive
                          }
                        >
                          <span
                            className={[
                              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                              slide.isActive
                                ? "left-[22px]"
                                : "left-0.5",
                            ].join(" ")}
                          />
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}