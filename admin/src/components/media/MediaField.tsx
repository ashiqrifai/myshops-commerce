"use client";

import {
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

import type {
  MediaAsset,
  MediaAssetClassification,
} from "@/types/media";

interface MediaFieldProps {
  label: string;

  description?: string;

  assetId?: string | null;

  asset?: MediaAsset | null;

  classification?: MediaAssetClassification;

  disabled?: boolean;

  required?: boolean;

  recommendedSize?: string;

  previewAspect?: "SQUARE" | "LANDSCAPE" | "PORTRAIT";

  onChange: (
    asset:
      MediaAsset | null
  ) => void;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(
  /\/api\/v1\/?$/,
  ""
);

export default function MediaField({
  label,
  description,
  assetId = null,
  asset = null,
  classification,
  disabled = false,
  required = false,
  recommendedSize,
  previewAspect = "LANDSCAPE",
  onChange,
}: MediaFieldProps) {
  const [
    isPickerOpen,
    setIsPickerOpen,
  ] = useState(false);

  const [
    selectedAsset,
    setSelectedAsset,
  ] = useState<
    MediaAsset | null
  >(
    asset || null
  );

  useEffect(
    () => {
      if (
        asset?.id
      ) {
        setSelectedAsset(
          asset
        );

        return;
      }

      if (!assetId) {
        setSelectedAsset(
          null
        );
      }
    },
    [
      asset,
      assetId,
    ]
  );

  const previewUrl =
    useMemo(
      () =>
        selectedAsset
          ? getAssetPreviewUrl(
              selectedAsset
            )
          : null,
      [
        selectedAsset,
      ]
    );

  const handleSelect =
    (
      selected:
        MediaAsset
    ) => {
      setSelectedAsset(
        selected
      );

      onChange(
        selected
      );

      setIsPickerOpen(
        false
      );
    };

  const handleRemove =
    () => {
      setSelectedAsset(
        null
      );

      onChange(
        null
      );
    };

  const hasSelection =
    Boolean(
      selectedAsset ||
        assetId
    );

  return (
    <>
      <div>
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-[#202223]">
              {label}

              {required && (
                <span className="ml-1 text-red-600">
                  *
                </span>
              )}
            </label>

            {description && (
              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                {description}
              </p>
            )}
          </div>

          {recommendedSize && (
            <span className="shrink-0 rounded-full bg-[#f1f2f3] px-2.5 py-1 text-[10px] font-medium text-[#6d7175]">
              {recommendedSize}
            </span>
          )}
        </div>

        {hasSelection ? (
          <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
            <div
              className={[
                "flex items-center justify-center overflow-hidden bg-[#f6f6f7]",
                getAspectClass(
                  previewAspect
                ),
              ].join(
                " "
              )}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    previewUrl
                  }
                  alt={
                    selectedAsset
                      ?.altText ||
                    selectedAsset
                      ?.title ||
                    selectedAsset
                      ?.originalFileName ||
                    label
                  }
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center px-6 text-center">
                  <ImageIcon
                    size={32}
                    className="text-[#8c9196]"
                  />

                  <p className="mt-2 text-xs text-[#6d7175]">
                    Media asset
                    selected
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[#e1e3e5] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202223]">
                    {selectedAsset
                      ?.title ||
                      selectedAsset
                        ?.originalFileName ||
                      "Selected media asset"}
                  </p>

                  {selectedAsset ? (
                    <p className="mt-1 text-xs text-[#6d7175]">
                      {getAssetDetails(
                        selectedAsset
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 truncate font-mono text-[10px] text-[#8c9196]">
                      {assetId}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={() =>
                      setIsPickerOpen(
                        true
                      )
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Pencil
                      size={14}
                    />

                    Change
                  </button>

                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={
                      handleRemove
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2
                      size={14}
                    />

                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={
              disabled
            }
            onClick={() =>
              setIsPickerOpen(
                true
              )
            }
            className={[
              "flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#babfc3]",
              "bg-[#fafafa] px-6 text-center transition hover:border-[#303030] hover:bg-[#f6f6f7]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              getEmptyAspectClass(
                previewAspect
              ),
            ].join(
              " "
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <ImageIcon
                size={22}
                className="text-[#6d7175]"
              />
            </div>

            <p className="mt-3 text-sm font-semibold text-[#202223]">
              Select media
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-[#6d7175]">
              Choose an image from
              the shared media
              library.
            </p>

            <span className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#303030] px-3 text-sm font-semibold text-white">
              <Plus
                size={15}
              />

              Choose image
            </span>
          </button>
        )}
      </div>

      <MediaAssetPicker
        isOpen={
          isPickerOpen
        }
        selectedAssetId={
          selectedAsset?.id ||
          assetId ||
          null
        }
        title={`Select ${label.toLowerCase()}`}
        description={
          description ||
          `Choose an image for ${label.toLowerCase()}.`
        }
        classification={
          classification
        }
        allowPdf={
          false
        }
        onClose={() =>
          setIsPickerOpen(
            false
          )
        }
        onSelect={
          handleSelect
        }
      />
    </>
  );
}

function resolveMediaUrl(
  url?:
    string |
    null
): string | null {
  if (!url) {
    return null;
  }

  if (
    url.startsWith(
      "http://"
    ) ||
    url.startsWith(
      "https://"
    )
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function getAssetPreviewUrl(
  asset:
    MediaAsset
): string | null {
  const previewVariant =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "PREVIEW" &&
        variant.format ===
          "webp" &&
        variant.isActive !==
          false
    );

  const mediumVariant =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "MEDIUM" &&
        variant.isActive !==
          false
    );

  const thumbnailVariant =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.isActive !==
          false
    );

  return resolveMediaUrl(
    previewVariant?.publicUrl ||
      mediumVariant?.publicUrl ||
      thumbnailVariant?.publicUrl ||
      asset.publicUrl
  );
}

function getAssetDetails(
  asset:
    MediaAsset
): string {
  const details:
    string[] = [];

  if (
    asset.width &&
    asset.height
  ) {
    details.push(
      `${asset.width} × ${asset.height}`
    );
  }

  if (
    asset.extension
  ) {
    details.push(
      asset.extension.toUpperCase()
    );
  }

  if (
    asset.fileSize
  ) {
    details.push(
      formatFileSize(
        asset.fileSize
      )
    );
  }

  return (
    details.join(
      " · "
    ) ||
    asset.classification ||
    "Media asset"
  );
}

function formatFileSize(
  value:
    string |
    number
): string {
  const bytes =
    Number(
      value ||
        0
    );

  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 *
      1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(
      1
    )} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(
    1
  )} MB`;
}

function getAspectClass(
  aspect:
    "SQUARE" |
    "LANDSCAPE" |
    "PORTRAIT"
): string {
  if (
    aspect ===
    "SQUARE"
  ) {
    return "aspect-square";
  }

  if (
    aspect ===
    "PORTRAIT"
  ) {
    return "aspect-[3/4]";
  }

  return "aspect-[16/7]";
}

function getEmptyAspectClass(
  aspect:
    "SQUARE" |
    "LANDSCAPE" |
    "PORTRAIT"
): string {
  if (
    aspect ===
    "SQUARE"
  ) {
    return "min-h-[260px]";
  }

  if (
    aspect ===
    "PORTRAIT"
  ) {
    return "min-h-[320px]";
  }

  return "min-h-[210px]";
}