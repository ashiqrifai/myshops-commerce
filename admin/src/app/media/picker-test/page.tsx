"use client";

import {
  ImageIcon,
} from "lucide-react";

import {
  useState,
} from "react";

import AdminShell from "@/components/admin/AdminShell";
import MediaAssetPicker from "@/components/media/MediaAssetPicker";

import type {
  MediaAsset,
} from "@/types/media";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

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

export default function MediaPickerTestPage() {
  const [pickerOpen, setPickerOpen] =
    useState(false);

  const [
    selectedAsset,
    setSelectedAsset,
  ] = useState<MediaAsset | null>(
    null
  );

  const previewUrl =
    resolveMediaUrl(
      selectedAsset?.publicUrl
    );

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl p-8">
        <div className="admin-card p-6">
          <h1 className="text-2xl font-semibold">
            Media Asset Picker Test
          </h1>

          <p className="mt-2 text-sm text-[#6d7175]">
            This page is only for testing
            the reusable DAM picker before
            connecting it to CMS fields.
          </p>

          <div className="mt-6 rounded-xl border border-[#e1e3e5] p-5">
            {selectedAsset ? (
              <div className="flex items-center gap-5">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f6f6f7]">
                  {selectedAsset.assetType ===
                    "IMAGE" &&
                  previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt={
                        selectedAsset.altText ||
                        selectedAsset.title ||
                        selectedAsset.originalFileName
                      }
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <ImageIcon
                      size={32}
                      className="text-[#8c9196]"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-[#6d7175]">
                    Selected asset
                  </p>

                  <h2 className="mt-1 truncate text-lg font-semibold">
                    {selectedAsset.title ||
                      selectedAsset.originalFileName}
                  </h2>

                  <p className="mt-2 font-mono text-xs text-[#6d7175]">
                    {selectedAsset.id}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <ImageIcon
                  size={34}
                  className="mx-auto text-[#8c9196]"
                />

                <p className="mt-3 text-sm text-[#6d7175]">
                  No asset selected.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setPickerOpen(true)
              }
              className="mt-5 h-10 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
            >
              Select media
            </button>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <MediaAssetPicker
          key={
            selectedAsset?.id ||
            "empty-selection"
          }
          isOpen
          selectedAssetId={
            selectedAsset?.id ||
            null
          }
          title="Select CMS media"
          description="Choose an image from the shared MyShops DAM."
          onClose={() =>
            setPickerOpen(false)
          }
          onSelect={(asset) => {
            setSelectedAsset(asset);
            setPickerOpen(false);
          }}
        />
      )}
    </AdminShell>
  );
}