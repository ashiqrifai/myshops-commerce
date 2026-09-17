"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ImageIcon,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import {
  useGetMediaAssetsQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
} from "@/types/media";

interface InstagramPostMediaPickerProps {
  value:
    string | null;

  onChange:
    (
      value:
        string | null
    ) => void;
}

export default function InstagramPostMediaPicker({
  value,
  onChange,
}: InstagramPostMediaPickerProps) {
  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Remember Selected Asset
  |--------------------------------------------------------------------------
  |
  | Important:
  | Do NOT depend only on the current media search result to display the
  | selected image.
  |--------------------------------------------------------------------------
  */

  const [
    rememberedAsset,
    setRememberedAsset,
  ] =
    useState<
      MediaAsset |
      null
    >(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | Media Query
  |--------------------------------------------------------------------------
  */

  const {
    data:
      assetsResponse,

    isLoading:
      isLoadingAssets,

    isFetching:
      isFetchingAssets,

    isError:
      isMediaError,
  } =
    useGetMediaAssetsQuery({
      page:
        1,

      pageSize:
        100,

      search:
        isOpen &&
        search.trim()
          ? search.trim()
          : undefined,

      assetType:
        "IMAGE",

      status:
        "READY",

      isActive:
        true,

      sortBy:
        "createdAt",

      sortDirection:
        "DESC",
    });

  /*
  |--------------------------------------------------------------------------
  | Assets
  |--------------------------------------------------------------------------
  */

  const assets =
    useMemo(
      () =>
        assetsResponse
          ?.data ||
        [],
      [
        assetsResponse,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Locate Existing Selection
  |--------------------------------------------------------------------------
  */

  const assetFromCurrentResult =
    useMemo(
      () => {
        if (
          !value
        ) {
          return null;
        }

        return (
          assets.find(
            (
              asset
            ) =>
              asset.id ===
              value
          ) ||
          null
        );
      },
      [
        assets,
        value,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Remember Asset When Found
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        assetFromCurrentResult
      ) {
        setRememberedAsset(
          assetFromCurrentResult
        );
      }
    },
    [
      assetFromCurrentResult,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Clear Remembered Asset
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !value
      ) {
        setRememberedAsset(
          null
        );
      }
    },
    [
      value,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Selected Asset
  |--------------------------------------------------------------------------
  */

  const selectedAsset =
    rememberedAsset &&
    rememberedAsset.id ===
      value
      ? rememberedAsset
      : assetFromCurrentResult;

  /*
  |--------------------------------------------------------------------------
  | Select Asset
  |--------------------------------------------------------------------------
  */

  const selectAsset = (
    asset:
      MediaAsset
  ) => {
    /*
     * Remember the full object BEFORE changing the ID.
     */

    setRememberedAsset(
      asset
    );

    onChange(
      asset.id
    );

    setSearch(
      ""
    );

    setIsOpen(
      false
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Remove
  |--------------------------------------------------------------------------
  */

  const removeAsset =
    () => {
      setRememberedAsset(
        null
      );

      onChange(
        null
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Open Picker
  |--------------------------------------------------------------------------
  */

  const openPicker =
    () => {
      setSearch(
        ""
      );

      setIsOpen(
        true
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Close Picker
  |--------------------------------------------------------------------------
  */

  const closePicker =
    () => {
      setSearch(
        ""
      );

      setIsOpen(
        false
      );
    };

  return (
    <>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium">
            Instagram image
          </label>

          {value ? (
            <button
              type="button"
              onClick={
                removeAsset
              }
              className="text-xs font-medium text-[#a23b2a] hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>

        <p className="mb-2 text-xs leading-5 text-[#6d7175]">
          Select the image to display in the Instagram gallery.
        </p>

        {/* Selected */}

        {value ? (
          <div className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-3">
            {selectedAsset ? (
              <div className="flex gap-3">
                <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                  {getAssetUrl(
                    selectedAsset
                  ) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        getAssetUrl(
                          selectedAsset
                        ) ||
                        ""
                      }
                      alt={
                        selectedAsset
                          .altText ||
                        selectedAsset
                          .title ||
                        selectedAsset
                          .originalFileName
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon
                      size={
                        24
                      }
                      className="text-[#8c9196]"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {selectedAsset
                      .title ||
                      selectedAsset
                        .originalFileName}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#6d7175]">
                    {
                      selectedAsset
                        .originalFileName
                    }
                  </p>

                  <button
                    type="button"
                    onClick={
                      openPicker
                    }
                    className="mt-3 text-sm font-medium text-[#005bd3] hover:underline"
                  >
                    Change image
                  </button>
                </div>
              </div>
            ) : isLoadingAssets ? (
              <div className="flex h-24 items-center justify-center">
                <LoaderCircle
                  size={
                    20
                  }
                  className="animate-spin text-[#6d7175]"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-[#fff4e5] p-3">
                <p className="text-sm text-[#7a4b00]">
                  The selected image is outside the current Media Studio results.
                </p>

                <button
                  type="button"
                  onClick={
                    openPicker
                  }
                  className="mt-2 text-sm font-semibold text-[#005bd3] hover:underline"
                >
                  Choose image
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={
              openPicker
            }
            className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] px-4 py-5 text-center hover:border-[#8c9196] hover:bg-[#f6f6f7]"
          >
            <ImageIcon
              size={
                25
              }
              className="text-[#6d7175]"
            />

            <span className="mt-2 text-sm font-semibold">
              Select from Media
            </span>

            <span className="mt-1 text-xs text-[#6d7175]">
              Choose an existing image asset
            </span>
          </button>
        )}
      </div>

      {/* Picker Modal */}

      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header */}

            <header className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Select Instagram image
                </h2>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Choose an image from Media Studio.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePicker
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                aria-label="Close media selector"
              >
                <X
                  size={
                    19
                  }
                />
              </button>
            </header>

            {/* Search */}

            <div className="border-b border-[#e1e3e5] p-4">
              <div className="relative">
                <Search
                  size={
                    17
                  }
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  className="admin-input pl-10"
                  placeholder="Search media assets..."
                  autoFocus
                />
              </div>
            </div>

            {/* Content */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {isLoadingAssets ||
              isFetchingAssets ? (
                <div className="flex min-h-80 items-center justify-center">
                  <div className="text-center">
                    <LoaderCircle
                      size={
                        24
                      }
                      className="mx-auto animate-spin text-[#6d7175]"
                    />

                    <p className="mt-3 text-sm text-[#6d7175]">
                      Loading media...
                    </p>
                  </div>
                </div>
              ) : isMediaError ? (
                <div className="flex min-h-80 items-center justify-center text-center">
                  <div>
                    <p className="text-sm font-semibold text-[#a23b2a]">
                      Unable to load Media Studio
                    </p>

                    <p className="mt-2 text-xs text-[#6d7175]">
                      Please check the media API and permissions.
                    </p>
                  </div>
                </div>
              ) : assets.length ===
                0 ? (
                <div className="flex min-h-80 items-center justify-center text-center">
                  <div>
                    <ImageIcon
                      size={
                        30
                      }
                      className="mx-auto text-[#8c9196]"
                    />

                    <p className="mt-3 text-sm font-semibold">
                      No images found
                    </p>

                    <p className="mt-1 text-xs text-[#6d7175]">
                      Try another search.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {assets.map(
                    (
                      asset
                    ) => {
                      const isSelected =
                        asset.id ===
                        value;

                      const imageUrl =
                        getAssetUrl(
                          asset
                        );

                      return (
                        <button
                          key={
                            asset.id
                          }
                          type="button"
                          onClick={() =>
                            selectAsset(
                              asset
                            )
                          }
                          className={[
                            "overflow-hidden rounded-xl border bg-white text-left transition hover:shadow-md",

                            isSelected
                              ? "border-[#005bd3] ring-2 ring-[#005bd3]/20"
                              : "border-[#e1e3e5]",
                          ].join(
                            " "
                          )}
                        >
                          <div className="relative aspect-square bg-[#f6f6f7]">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  asset.altText ||
                                  asset.title ||
                                  asset.originalFileName
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ImageIcon
                                  size={
                                    28
                                  }
                                  className="text-[#8c9196]"
                                />
                              </div>
                            )}

                            {isSelected ? (
                              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#005bd3] text-white">
                                <Check
                                  size={
                                    16
                                  }
                                />
                              </span>
                            ) : null}
                          </div>

                          <div className="p-3">
                            <p className="truncate text-sm font-semibold">
                              {asset.title ||
                                asset.originalFileName}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#6d7175]">
                              {
                                asset.originalFileName
                              }
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Asset URL
|--------------------------------------------------------------------------
*/

function getAssetUrl(
  asset:
    MediaAsset
): string | null {
  const previewWebp =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "PREVIEW" &&
        variant.format ===
          "webp" &&
        Boolean(
          variant.publicUrl
        )
    );

  const preview =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "PREVIEW" &&
        Boolean(
          variant.publicUrl
        )
    );

  const thumbnailWebp =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.format ===
          "webp" &&
        Boolean(
          variant.publicUrl
        )
    );

  const thumbnail =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "THUMBNAIL" &&
        Boolean(
          variant.publicUrl
        )
    );

  const rawUrl =
    previewWebp
      ?.publicUrl ||
    preview
      ?.publicUrl ||
    thumbnailWebp
      ?.publicUrl ||
    thumbnail
      ?.publicUrl ||
    asset.previewPath ||
    asset.thumbnailPath ||
    asset.publicUrl ||
    null;

  return resolveMediaUrl(
    rawUrl
  );
}

/*
|--------------------------------------------------------------------------
| Resolve Media URL
|--------------------------------------------------------------------------
*/

function resolveMediaUrl(
  value:
    string |
    null |
    undefined
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
    ) ||
    value.startsWith(
      "data:"
    ) ||
    value.startsWith(
      "blob:"
    )
  ) {
    return value;
  }

  const backendUrl =
    process.env
      .NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5080";

  const normalizedBackendUrl =
    backendUrl.replace(
      /\/+$/,
      ""
    );

  let normalizedPath =
    value.startsWith(
      "/"
    )
      ? value
      : `/${value}`;

  if (
    !normalizedPath.startsWith(
      "/media/"
    )
  ) {
    normalizedPath =
      `/media${normalizedPath}`;
  }

  return `${normalizedBackendUrl}${normalizedPath}`;
}