"use client";

import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  LoaderCircle,
  Plus,
  Replace,
  Store,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

import {
  useGetMediaAssetByIdQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
} from "@/types/media";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface StoreSlide {
  id: string;

  name?: string;
  location?: string;
  description?: string;

  desktopAssetId?:
    | string
    | null;

  mobileAssetId?:
    | string
    | null;

  linkLabel?: string;
  linkUrl?: string;

  openInNewTab?: boolean;
  isActive?: boolean;
}

interface StoreVisitCarouselContent {
  eyebrow?: string;

  title?: string;

  description?: string;

  buttonLabel?: string;

  buttonUrl?: string;

  stores?: StoreSlide[];
}

interface StoreVisitCarouselSettings {
    autoplay?: boolean;
  
    autoplayInterval?: number;
  
    showArrows?: boolean;
  
    showDots?: boolean;
  
    loop?: boolean;
  
    desktopHeight?: number;
  
    mobileImageHeight?: number;
  
    leftWidthPercent?: number;
  
    borderRadius?: number;
  
    backgroundColor?: string;
  
    textColor?: string;
  
    imageFit?:
      | "COVER"
      | "CONTAIN";
  
    itemsDesktop?: number;
  
    itemsTablet?: number;
  
    itemsMobile?: number;
  
    cardImageHeightDesktop?: number;
  
    cardImageHeightMobile?: number;
  
    sectionPaddingY?: number;
  
    sectionPaddingX?: number;
  }

interface StoreVisitCarouselEditorProps {
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

  onChange: (
    value:
      Record<
        string,
        unknown
      >
  ) => void;

  onSettingsChange: (
    value:
      Record<
        string,
        unknown
      >
  ) => void;
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/api\/v1\/?$/,
  ""
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const createId = (): string =>
  typeof crypto !==
    "undefined" &&
  typeof crypto.randomUUID ===
    "function"
    ? crypto.randomUUID()
    : `store-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

const createStore =
  (): StoreSlide => ({
    id:
      createId(),

    name:
      "",

    location:
      "",

    description:
      "",

    desktopAssetId:
      null,

    mobileAssetId:
      null,

    linkLabel:
      "",

    linkUrl:
      "",

    openInNewTab:
      false,

    isActive:
      true,
  });

const clampInteger = (
  value:
    unknown,

  minimum:
    number,

  maximum:
    number,

  fallback:
    number
): number => {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  return Math.min(
    maximum,

    Math.max(
      minimum,
      Math.round(
        parsed
      )
    )
  );
};

const resolveMediaUrl = (
  value?:
    string |
    null
): string | null => {
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
    value.startsWith(
      "/"
    )
      ? value
      : `/${value}`
  }`;
};

const getAssetPreviewUrl = (
  asset?:
    MediaAsset |
    null
): string | null => {
  if (!asset) {
    return null;
  }

  const preferredTypes = [
    "PREVIEW",
    "MEDIUM",
    "SMALL",
    "THUMBNAIL",
    "ORIGINAL",
  ];

  for (
    const variantType of
      preferredTypes
  ) {
    const variant =
      asset.variants?.find(
        (
          item
        ) =>
          item.variantType ===
            variantType &&
          item.isActive &&
          Boolean(
            item.publicUrl
          )
      );

    if (
      variant
        ?.publicUrl
    ) {
      return resolveMediaUrl(
        variant.publicUrl
      );
    }
  }

  return resolveMediaUrl(
    asset.publicUrl ||
      asset.previewPath ||
      asset.thumbnailPath ||
      null
  );
};

/*
|--------------------------------------------------------------------------
| Field Label
|--------------------------------------------------------------------------
*/

function FieldLabel({
  children,
  hint,
}: {
  children:
    React.ReactNode;

  hint?:
    string;
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
  label:
    string;

  value:
    string |
    null;

  onChange: (
    assetId:
      string |
      null
  ) => void;
}) {
  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false
    );

  const [
    selectedAsset,
    setSelectedAsset,
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
      value || "",
      {
        skip:
          !value,
      }
    );

  const queriedAsset =
    data?.data ||
    null;

  const asset =
    selectedAsset ||
    queriedAsset;

  const previewUrl =
    getAssetPreviewUrl(
      asset
    );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] px-4 py-3">
          <p className="text-sm font-medium text-[#202223]">
            {label}
          </p>
        </div>

        {isFetching &&
        !selectedAsset ? (
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
              src={
                previewUrl
              }
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
                  setIsOpen(
                    true
                  )
                }
                className="flex h-8 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium"
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
                  setSelectedAsset(
                    null
                  );

                  onChange(
                    null
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600"
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
              setIsOpen(
                true
              )
            }
            className="flex aspect-[16/7] w-full flex-col items-center justify-center bg-[#f6f6f7] p-4 text-center hover:bg-[#eef0f2]"
          >
            <ImageIcon
              size={
                25
              }
              className="text-[#8c9196]"
            />

            <span className="mt-2 text-sm font-semibold">
              Select store image
            </span>
          </button>
        )}
      </div>

      <MediaAssetPicker
        isOpen={
          isOpen
        }
        selectedAssetId={
          value
        }
        title={
          `Select ${label}`
        }
        description="Choose store photography from the media library."
        classification="STORE"
        onClose={() =>
          setIsOpen(
            false
          )
        }
        onSelect={(
          selected
        ) => {
          setSelectedAsset(
            selected
          );

          onChange(
            selected.id
          );

          setIsOpen(
            false
          );
        }}
      />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Editor
|--------------------------------------------------------------------------
*/

export default function StoreVisitCarouselEditor({
  value,
  settings,
  onChange,
  onSettingsChange,
}: StoreVisitCarouselEditorProps) {
  const content =
    value as
      StoreVisitCarouselContent;

  const carouselSettings =
    settings as
      StoreVisitCarouselSettings;

  const stores =
    Array.isArray(
      content.stores
    )
      ? content.stores
      : [];

  const updateContent = (
    changes:
      Partial<
        StoreVisitCarouselContent
      >
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const updateSettings = (
    changes:
      Partial<
        StoreVisitCarouselSettings
      >
  ) => {
    onSettingsChange({
      ...settings,
      ...changes,
    });
  };

  const updateStore = (
    index:
      number,

    changes:
      Partial<
        StoreSlide
      >
  ) => {
    const next =
      stores.map(
        (
          store,
          storeIndex
        ) =>
          storeIndex ===
          index
            ? {
                ...store,
                ...changes,
              }
            : store
      );

    updateContent({
      stores:
        next,
    });
  };

  const addStore =
    () => {
      updateContent({
        stores: [
          ...stores,
          createStore(),
        ],
      });
    };

  const removeStore = (
    index:
      number
  ) => {
    updateContent({
      stores:
        stores.filter(
          (
            _,
            storeIndex
          ) =>
            storeIndex !==
            index
        ),
    });
  };

  const moveStore = (
    index:
      number,

    direction:
      -1 |
      1
  ) => {
    const target =
      index +
      direction;

    if (
      target <
        0 ||
      target >=
        stores.length
    ) {
      return;
    }

    const next = [
      ...stores,
    ];

    [
      next[index],
      next[target],
    ] = [
      next[target],
      next[index],
    ];

    updateContent({
      stores:
        next,
    });
  };

  return (
    <div className="space-y-6">
      {/*
      |--------------------------------------------------------------------------
      | Fixed Left Panel
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <Store
                size={
                  20
                }
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Fixed left panel
              </h2>

              <p className="mt-1 text-sm text-[#6d7175]">
                This content remains visible while the store carousel changes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <FieldLabel>
              Eyebrow
            </FieldLabel>

            <input
              value={
                content.eyebrow ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  eyebrow:
                    event
                      .target
                      .value,
                })
              }
              className="admin-input"
              placeholder="VISIT US"
            />
          </div>

          <div>
            <FieldLabel>
              Heading
            </FieldLabel>

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
                    event
                      .target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Visit a MyShops Store"
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel>
              Description
            </FieldLabel>

            <textarea
              rows={
                3
              }
              value={
                content.description ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  description:
                    event
                      .target
                      .value,
                })
              }
              className="admin-input min-h-24"
              placeholder="Experience our latest products in person."
            />
          </div>

          <div>
            <FieldLabel>
              Button label
            </FieldLabel>

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
                    event
                      .target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Find a Store"
            />
          </div>

          <div>
            <FieldLabel>
              Button URL
            </FieldLabel>

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
                    event
                      .target
                      .value,
                })
              }
              className="admin-input"
              placeholder="/stores"
            />
          </div>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Carousel Settings
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#e1e3e5] px-6 py-5">
          <h2 className="text-base font-semibold">
            Carousel settings
          </h2>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] px-4 py-3">
            <input
              type="checkbox"
              checked={
                carouselSettings.autoplay !==
                false
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  autoplay:
                    event
                      .target
                      .checked,
                })
              }
            />

            <span className="text-sm font-medium">
              Autoplay
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] px-4 py-3">
            <input
              type="checkbox"
              checked={
                carouselSettings.showArrows !==
                false
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  showArrows:
                    event
                      .target
                      .checked,
                })
              }
            />

            <span className="text-sm font-medium">
              Show arrows
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] px-4 py-3">
            <input
              type="checkbox"
              checked={
                carouselSettings.showDots !==
                false
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  showDots:
                    event
                      .target
                      .checked,
                })
              }
            />

            <span className="text-sm font-medium">
              Show dots
            </span>
          </label>

          <div>
            <FieldLabel>
              Autoplay interval
              <span className="ml-1 text-xs text-[#8c9196]">
                milliseconds
              </span>
            </FieldLabel>

            <input
              type="number"
              min={
                1500
              }
              max={
                30000
              }
              step={
                500
              }
              value={
                carouselSettings
                  .autoplayInterval ??
                5000
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  autoplayInterval:
                    clampInteger(
                      event
                        .target
                        .value,
                      1500,
                      30000,
                      5000
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Desktop height
            </FieldLabel>

            <input
              type="number"
              min={
                280
              }
              max={
                800
              }
              value={
                carouselSettings
                  .desktopHeight ??
                430
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  desktopHeight:
                    clampInteger(
                      event
                        .target
                        .value,
                      280,
                      800,
                      430
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Mobile image height
            </FieldLabel>

            <input
              type="number"
              min={
                180
              }
              max={
                600
              }
              value={
                carouselSettings
                  .mobileImageHeight ??
                280
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  mobileImageHeight:
                    clampInteger(
                      event
                        .target
                        .value,
                      180,
                      600,
                      280
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Left panel width %
            </FieldLabel>

            <input
              type="number"
              min={
                25
              }
              max={
                50
              }
              value={
                carouselSettings
                  .leftWidthPercent ??
                32
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  leftWidthPercent:
                    clampInteger(
                      event
                        .target
                        .value,
                      25,
                      50,
                      32
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Border radius
            </FieldLabel>

            <input
              type="number"
              min={
                0
              }
              max={
                48
              }
              value={
                carouselSettings
                  .borderRadius ??
                16
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  borderRadius:
                    clampInteger(
                      event
                        .target
                        .value,
                      0,
                      48,
                      16
                    ),
                })
              }
              className="admin-input"
            />
          </div>

          <div>
            <FieldLabel>
              Left background
            </FieldLabel>

            <input
              type="color"
              value={
                carouselSettings
                  .backgroundColor ||
                "#F4F5F5"
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  backgroundColor:
                    event
                      .target
                      .value,
                })
              }
              className="h-10 w-full rounded-lg border border-[#babfc3] bg-white p-1"
            />
          </div>

          <div>
            <FieldLabel>
              Text colour
            </FieldLabel>

            <input
              type="color"
              value={
                carouselSettings
                  .textColor ||
                "#111111"
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  textColor:
                    event
                      .target
                      .value,
                })
              }
              className="h-10 w-full rounded-lg border border-[#babfc3] bg-white p-1"
            />
          </div>

          <div>
            <FieldLabel>
              Store image fit
            </FieldLabel>

            <select
              value={
                carouselSettings
                  .imageFit ||
                "COVER"
              }
              onChange={(
                event
              ) =>
                updateSettings({
                  imageFit:
                    event
                      .target
                      .value as
                      | "COVER"
                      | "CONTAIN",
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
            </select>
          </div>
        </div>
      </section>

      {/*
      |--------------------------------------------------------------------------
      | Stores
      |--------------------------------------------------------------------------
      */}

      <section className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-base font-semibold">
              Store slides
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Add the stores displayed on the right side of the section.
            </p>
          </div>

          <button
            type="button"
            onClick={
              addStore
            }
            className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            <Plus
              size={
                16
              }
            />

            Add store
          </button>
        </div>

        <div className="space-y-5 p-6">
          {stores.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7] p-10 text-center">
              <Store
                size={
                  32
                }
                className="mx-auto text-[#8c9196]"
              />

              <p className="mt-3 font-medium">
                No stores added
              </p>

              <p className="mt-1 text-sm text-[#6d7175]">
                Add your first MyShops store slide.
              </p>
            </div>
          ) : (
            stores.map(
              (
                store,
                index
              ) => (
                <article
                  key={
                    store.id ||
                    index
                  }
                  className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-[#fafafa]"
                >
                  <header className="flex items-center justify-between border-b border-[#e1e3e5] bg-white px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {store.name ||
                          `Store ${index + 1}`}
                      </p>

                      <p className="mt-0.5 text-xs text-[#6d7175]">
                        Slide{" "}
                        {index +
                          1}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          index ===
                          0
                        }
                        onClick={() =>
                          moveStore(
                            index,
                            -1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white disabled:opacity-35"
                      >
                        <ArrowUp
                          size={
                            15
                          }
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          stores.length -
                            1
                        }
                        onClick={() =>
                          moveStore(
                            index,
                            1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white disabled:opacity-35"
                      >
                        <ArrowDown
                          size={
                            15
                          }
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeStore(
                            index
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2
                          size={
                            15
                          }
                        />
                      </button>
                    </div>
                  </header>

                  <div className="grid gap-4 p-5 lg:grid-cols-2">
                    <MediaField
                      label="Desktop image"
                      value={
                        store.desktopAssetId ||
                        null
                      }
                      onChange={(
                        desktopAssetId
                      ) =>
                        updateStore(
                          index,
                          {
                            desktopAssetId,
                          }
                        )
                      }
                    />

                    <MediaField
                      label="Mobile image (optional)"
                      value={
                        store.mobileAssetId ||
                        null
                      }
                      onChange={(
                        mobileAssetId
                      ) =>
                        updateStore(
                          index,
                          {
                            mobileAssetId,
                          }
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-4 border-t border-[#e1e3e5] bg-white p-5 md:grid-cols-2">
                    <div>
                      <FieldLabel>
                        Store name
                      </FieldLabel>

                      <input
                        value={
                          store.name ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              name:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="MyShops Dubai Mall"
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        Location
                      </FieldLabel>

                      <input
                        value={
                          store.location ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              location:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="Level 2, Dubai Mall"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FieldLabel>
                        Description
                      </FieldLabel>

                      <textarea
                        rows={
                          2
                        }
                        value={
                          store.description ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              description:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="Discover the latest smartphones, laptops and electronics."
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        Store link label
                      </FieldLabel>

                      <input
                        value={
                          store.linkLabel ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              linkLabel:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="View Store"
                      />
                    </div>

                    <div>
                      <FieldLabel>
                        Store link
                      </FieldLabel>

                      <input
                        value={
                          store.linkUrl ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              linkUrl:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="admin-input"
                        placeholder="/stores/dubai-mall"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-lg border border-[#e1e3e5] px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          store.isActive !==
                          false
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              isActive:
                                event
                                  .target
                                  .checked,
                            }
                          )
                        }
                      />

                      <span className="text-sm font-medium">
                        Active
                      </span>
                    </label>

                    <label className="flex items-center gap-3 rounded-lg border border-[#e1e3e5] px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          store.openInNewTab ===
                          true
                        }
                        onChange={(
                          event
                        ) =>
                          updateStore(
                            index,
                            {
                              openInNewTab:
                                event
                                  .target
                                  .checked,
                            }
                          )
                        }
                      />

                      <span className="text-sm font-medium">
                        Open store link in new tab
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