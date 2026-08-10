"use client";

import {
  Archive,
  Copy,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import type {
  MediaAsset,
  MediaAssetClassification,
  MediaAssetUsage,
} from "@/types/media";

interface UpdateAssetBody {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  classification?: MediaAssetClassification;
  isPublic?: boolean;
}

interface MediaAssetDrawerProps {
  asset: MediaAsset | null;
  usageRecords: MediaAssetUsage[];
  apiBaseUrl: string;
  isLoading: boolean;
  isLoadingUsage: boolean;
  isSaving: boolean;
  isArchiving: boolean;
  isRestoring: boolean;
  isReprocessing: boolean;
  onClose: () => void;
  onSave: (
    assetId: string,
    body: UpdateAssetBody
  ) => Promise<void>;
  onArchive: (
    assetId: string
  ) => Promise<void>;
  onRestore: (
    assetId: string
  ) => Promise<void>;
  onReprocess: (
    assetId: string
  ) => Promise<void>;
}

const classifications: MediaAssetClassification[] =
  [
    "MARKETING",
    "PRODUCT",
    "CATEGORY",
    "BRAND",
    "CMS",
    "PROMOTION",
    "LEGAL",
    "BLOG",
    "STORE",
    "AI",
    "DOWNLOAD",
    "OTHER",
  ];

const resolveMediaUrl = (
  apiBaseUrl: string,
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

  return `${apiBaseUrl}${url}`;
};

const formatFileSize = (
  value: string | number
): string => {
  const bytes = Number(value || 0);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

interface AssetDrawerFormProps
  extends Omit<
    MediaAssetDrawerProps,
    "asset" | "isLoading"
  > {
  asset: MediaAsset;
}

function AssetDrawerForm({
  asset,
  usageRecords,
  apiBaseUrl,
  isLoadingUsage,
  isSaving,
  isArchiving,
  isRestoring,
  isReprocessing,
  onClose,
  onSave,
  onArchive,
  onRestore,
  onReprocess,
}: AssetDrawerFormProps) {
  const [title, setTitle] =
    useState(asset.title || "");

  const [altText, setAltText] =
    useState(asset.altText || "");

  const [caption, setCaption] =
    useState(asset.caption || "");

  const [
    description,
    setDescription,
  ] = useState(
    asset.description || ""
  );

  const [
    classification,
    setClassification,
  ] =
    useState<MediaAssetClassification>(
      asset.classification
    );

  const [isPublic, setIsPublic] =
    useState(asset.isPublic);

  const previewUrl = useMemo(() => {
    const previewVariant =
      asset.variants?.find(
        (variant) =>
          variant.variantType ===
            "PREVIEW" &&
          variant.format === "webp"
      );

    return resolveMediaUrl(
      apiBaseUrl,
      previewVariant?.publicUrl ||
        asset.publicUrl
    );
  }, [apiBaseUrl, asset]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (asset.status === "ARCHIVED") {
      return;
    }

    await onSave(asset.id, {
      title: title.trim() || null,
      altText:
        altText.trim() || null,
      caption:
        caption.trim() || null,
      description:
        description.trim() || null,
      classification,
      isPublic,
    });
  };

  const copyUrl = async (
    url?: string | null
  ) => {
    const resolved =
      resolveMediaUrl(
        apiBaseUrl,
        url
      );

    if (!resolved) {
      return;
    }

    await navigator.clipboard.writeText(
      resolved
    );

    toast.success(
      "Media URL copied."
    );
  };

  const handleArchiveClick = async () => {
    if (usageRecords.length > 0) {
      toast.error(
        `This asset is used in ${usageRecords.length} location${
          usageRecords.length === 1
            ? ""
            : "s"
        } and cannot be archived.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Archive this media asset? The database record and physical files will be preserved."
      );

    if (!confirmed) {
      return;
    }

    await onArchive(asset.id);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col"
    >
      <div className="flex items-start justify-between border-b border-[#e1e3e5] px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[#8c9196]">
            Media asset
          </p>

          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold">
              {asset.title ||
                asset.originalFileName}
            </h2>

            {asset.status ===
              "ARCHIVED" && (
              <span className="rounded-full bg-[#fbeae5] px-2 py-0.5 text-[10px] font-semibold text-[#a23b2a]">
                Archived
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
          aria-label="Close asset details"
        >
          <X size={19} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-[#e1e3e5] bg-[#f6f6f7] p-5">
          <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
            {asset.assetType ===
              "IMAGE" &&
            previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={
                  asset.altText ||
                  asset.title ||
                  asset.originalFileName
                }
                className="max-h-[340px] w-full object-contain p-4"
              />
            ) : (
              <div className="text-center">
                <FileText
                  size={48}
                  className="mx-auto text-[#8c9196]"
                />

                <p className="mt-3 text-sm font-medium">
                  {asset.assetType}
                </p>
              </div>
            )}
          </div>

          {asset.publicUrl && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  copyUrl(
                    asset.publicUrl
                  )
                }
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white text-sm font-medium hover:bg-[#f6f6f7]"
              >
                <Copy size={15} />
                Copy URL
              </button>

              <a
                href={
                  resolveMediaUrl(
                    apiBaseUrl,
                    asset.publicUrl
                  ) || "#"
                }
                target="_blank"
                rel="noreferrer"
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white text-sm font-medium hover:bg-[#f6f6f7]"
              >
                <ExternalLink
                  size={15}
                />
                Open
              </a>
            </div>
          )}
        </div>

        <div className="space-y-6 p-5">
          <section>
            <h3 className="text-sm font-semibold">
              Details
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  disabled={
                    asset.status ===
                    "ARCHIVED"
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Alternative text
                </label>

                <input
                  value={altText}
                  onChange={(event) =>
                    setAltText(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  disabled={
                    asset.status ===
                    "ARCHIVED"
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Classification
                </label>

                <select
                  value={classification}
                  onChange={(event) =>
                    setClassification(
                      event.target
                        .value as MediaAssetClassification
                    )
                  }
                  className="admin-input"
                  disabled={
                    asset.status ===
                    "ARCHIVED"
                  }
                >
                  {classifications.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Caption
                </label>

                <input
                  value={caption}
                  onChange={(event) =>
                    setCaption(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  disabled={
                    asset.status ===
                    "ARCHIVED"
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  className="admin-input min-h-[90px] resize-y"
                  disabled={
                    asset.status ===
                    "ARCHIVED"
                  }
                />
              </div>

              <button
                type="button"
                disabled={
                  asset.status ===
                  "ARCHIVED"
                }
                onClick={() =>
                  setIsPublic(
                    (current) =>
                      !current
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border border-[#e1e3e5] p-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium">
                    Public asset
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Available through a public media URL.
                  </p>
                </div>

                <div
                  className={[
                    "relative h-6 w-11 rounded-full transition",
                    isPublic
                      ? "bg-[#303030]"
                      : "bg-[#c9cccf]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                      isPublic
                        ? "left-[22px]"
                        : "left-0.5",
                    ].join(" ")}
                  />
                </div>
              </button>
            </div>
          </section>

          <section className="border-t border-[#e1e3e5] pt-5">
            <h3 className="text-sm font-semibold">
              File information
            </h3>

            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#8c9196]">
                  Status
                </dt>

                <dd className="mt-1 font-medium">
                  {asset.status}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-[#8c9196]">
                  Type
                </dt>

                <dd className="mt-1 font-medium">
                  {asset.assetType}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-[#8c9196]">
                  Format
                </dt>

                <dd className="mt-1 font-medium uppercase">
                  {asset.extension}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-[#8c9196]">
                  File size
                </dt>

                <dd className="mt-1 font-medium">
                  {formatFileSize(
                    asset.fileSize
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-[#8c9196]">
                  Dimensions
                </dt>

                <dd className="mt-1 font-medium">
                  {asset.width &&
                  asset.height
                    ? `${asset.width} × ${asset.height}`
                    : "Not applicable"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-[#8c9196]">
                  Orientation
                </dt>

                <dd className="mt-1 font-medium">
                  {asset.orientation}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-xs text-[#8c9196]">
                  Dominant colour
                </dt>

                <dd className="mt-1 flex items-center gap-2 font-medium">
                  {asset.dominantColor && (
                    <span
                      className="h-4 w-4 rounded border"
                      style={{
                        backgroundColor:
                          asset.dominantColor,
                      }}
                    />
                  )}

                  {asset.dominantColor ||
                    "Not available"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-t border-[#e1e3e5] pt-5">
            <h3 className="text-sm font-semibold">
              Generated variants
            </h3>

            <p className="mt-1 text-xs text-[#6d7175]">
              {
                asset.variants
                  ?.length || 0
              }{" "}
              stored versions
            </p>

            <div className="mt-4 space-y-2">
              {asset.variants?.map(
                (variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-lg border border-[#e1e3e5] px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold">
                        {
                          variant.variantType
                        }{" "}
                        ·{" "}
                        {variant.format.toUpperCase()}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#6d7175]">
                        {variant.width &&
                        variant.height
                          ? `${variant.width} × ${variant.height}`
                          : "Original dimensions"}
                        {" · "}
                        {formatFileSize(
                          variant.fileSize
                        )}
                      </p>
                    </div>

                    {variant.publicUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          copyUrl(
                            variant.publicUrl
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                        aria-label="Copy variant URL"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          <section className="border-t border-[#e1e3e5] pt-5">
            <h3 className="text-sm font-semibold">
              Asset usage
            </h3>

            <p className="mt-1 text-xs text-[#6d7175]">
              Places currently using this asset.
            </p>

            {isLoadingUsage ? (
              <div className="flex justify-center py-6">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              </div>
            ) : usageRecords.length ===
              0 ? (
              <div className="mt-4 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
                <p className="text-sm font-medium">
                  Not currently in use
                </p>

                <p className="mt-1 text-xs text-[#6d7175]">
                  This asset may safely be archived.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {usageRecords.map(
                  (usage) => (
                    <div
                      key={usage.id}
                      className="rounded-lg border border-[#e1e3e5] px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold">
                          {usage.module}
                        </p>

                        <span className="rounded-full bg-[#f1f2f3] px-2 py-0.5 text-[10px]">
                          {usage.entityType}
                        </span>
                      </div>

                      <p className="mt-2 text-sm">
                        {usage.usageContext ||
                          usage.fieldName}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
                        {usage.fieldName}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#e1e3e5] bg-white p-4">
        {asset.status !==
          "ARCHIVED" && (
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <Save size={16} />
            )}

            {isSaving
              ? "Saving..."
              : "Save changes"}
          </button>
        )}

        {asset.assetType ===
          "IMAGE" &&
          asset.status !==
            "ARCHIVED" && (
            <button
              type="button"
              onClick={() =>
                onReprocess(
                  asset.id
                )
              }
              disabled={
                isReprocessing
              }
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
            >
              {isReprocessing ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <RefreshCcw
                  size={16}
                />
              )}

              {isReprocessing
                ? "Reprocessing..."
                : "Regenerate variants"}
            </button>
          )}

        {asset.status ===
        "ARCHIVED" ? (
          <button
            type="button"
            onClick={() =>
              onRestore(asset.id)
            }
            disabled={isRestoring}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            {isRestoring ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <RotateCcw size={16} />
            )}

            {isRestoring
              ? "Restoring..."
              : "Restore asset"}
          </button>
        ) : (
          <button
            type="button"
            onClick={
              handleArchiveClick
            }
            disabled={
              isArchiving ||
              usageRecords.length > 0
            }
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isArchiving ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <Archive size={16} />
            )}

            {isArchiving
              ? "Archiving..."
              : usageRecords.length >
                  0
                ? "Asset is in use"
                : "Archive asset"}
          </button>
        )}
      </div>
    </form>
  );
}

export default function MediaAssetDrawer({
  asset,
  usageRecords,
  apiBaseUrl,
  isLoading,
  isLoadingUsage,
  isSaving,
  isArchiving,
  isRestoring,
  isReprocessing,
  onClose,
  onSave,
  onArchive,
  onRestore,
  onReprocess,
}: MediaAssetDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-[110] bg-black/25"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-[520px] border-l border-[#dfe3e8] bg-white shadow-2xl"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {isLoading || !asset ? (
          <div className="flex h-full items-center justify-center">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : (
          <AssetDrawerForm
            key={`${asset.id}-${asset.status}`}
            asset={asset}
            usageRecords={
              usageRecords
            }
            apiBaseUrl={
              apiBaseUrl
            }
            isLoadingUsage={
              isLoadingUsage
            }
            isSaving={isSaving}
            isArchiving={
              isArchiving
            }
            isRestoring={
              isRestoring
            }
            isReprocessing={
              isReprocessing
            }
            onClose={onClose}
            onSave={onSave}
            onArchive={onArchive}
            onRestore={onRestore}
            onReprocess={
              onReprocess
            }
          />
        )}
      </aside>
    </div>
  );
}