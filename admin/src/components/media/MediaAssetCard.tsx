"use client";

import {
  Check,
  FileText,
  Film,
  ImageIcon,
  Lock,
  MoreHorizontal,
} from "lucide-react";

import type {
  MediaAsset,
} from "@/types/media";

interface MediaAssetCardProps {
  asset: MediaAsset;
  selected: boolean;
  apiBaseUrl: string;
  onSelect: (
    asset: MediaAsset
  ) => void;
}

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
  ).toFixed(1)} MB`;
};

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

const getThumbnailUrl = (
  asset: MediaAsset,
  apiBaseUrl: string
): string | null => {
  const thumbnailVariant =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.format === "webp"
    );

  return resolveMediaUrl(
    apiBaseUrl,
    thumbnailVariant?.publicUrl ||
      asset.publicUrl
  );
};

export default function MediaAssetCard({
  asset,
  selected,
  apiBaseUrl,
  onSelect,
}: MediaAssetCardProps) {
  const thumbnailUrl =
    getThumbnailUrl(
      asset,
      apiBaseUrl
    );

  return (
    <button
      type="button"
      onClick={() => onSelect(asset)}
      className={[
        "group relative overflow-hidden rounded-xl border bg-white text-left transition",
        selected
          ? "border-[#303030] ring-1 ring-[#303030]"
          : "border-[#e1e3e5] hover:border-[#babfc3] hover:shadow-md",
      ].join(" ")}
    >
      <div className="relative aspect-square overflow-hidden bg-[#f6f6f7]">
      {asset.assetType === "IMAGE" &&
thumbnailUrl ? (
  <img
    src={thumbnailUrl}
    alt={
      asset.altText ||
      asset.title ||
      asset.originalFileName
    }
    className="h-full w-full object-contain p-3 transition duration-200 group-hover:scale-[1.02]"
  />
) : asset.assetType === "VIDEO" &&
thumbnailUrl ? (
  <video
    src={thumbnailUrl}
    muted
    preload="metadata"
    playsInline
    className="h-full w-full object-cover"
  />
) : asset.assetType === "VIDEO" ? (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <Film
        size={42}
        className="mx-auto text-[#8c9196]"
      />

      <p className="mt-2 text-xs font-medium text-[#6d7175]">
        VIDEO
      </p>
    </div>
  </div>
) : asset.assetType === "PDF" ? (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <FileText
        size={42}
        className="mx-auto text-[#8c9196]"
      />

      <p className="mt-2 text-xs font-medium text-[#6d7175]">
        PDF
      </p>
    </div>
  </div>
) : (
  <div className="flex h-full items-center justify-center">
    <ImageIcon
      size={38}
      className="text-[#8c9196]"
    />
  </div>
)}

        {!asset.isPublic && (
          <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
            <Lock size={13} />
          </div>
        )}

        {selected && (
          <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#303030] text-white">
            <Check size={15} />
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-sm transition group-hover:opacity-100">
          <MoreHorizontal size={15} />
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium">
          {asset.title ||
            asset.originalFileName}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-[#6d7175]">
            {asset.width &&
            asset.height
              ? `${asset.width} × ${asset.height}`
              : asset.extension.toUpperCase()}
          </p>

          <p className="shrink-0 text-xs text-[#8c9196]">
            {formatFileSize(
              asset.fileSize
            )}
          </p>
        </div>
      </div>
    </button>
  );
}