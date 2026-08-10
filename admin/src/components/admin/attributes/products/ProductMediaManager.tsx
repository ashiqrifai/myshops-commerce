"use client";

import { useMemo, useState } from "react";
import { Check, ImageIcon, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { useGetMediaAssetsQuery } from "@/store/api/mediaApi";
import type { MediaAsset } from "@/types/media";
import type { ProductImage, ProductImageRole } from "@/types/product";

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export default function ProductMediaManager({ images, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useGetMediaAssetsQuery({
    page: 1,
    pageSize: 100,
    search: open && search.trim() ? search.trim() : undefined,
    assetType: "IMAGE",
    status: "READY",
    isActive: true,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const assets = data?.data || [];
  const selectedIds = useMemo(
    () => new Set(images.map((item) => item.mediaAssetId)),
    [images]
  );

  const addAsset = (asset: MediaAsset) => {
    if (selectedIds.has(asset.id)) return;
    const hasPrimary = images.some((image) => image.imageRole === "PRIMARY");

    onChange([
      ...images,
      {
        mediaAssetId: asset.id,
        imageRole: hasPrimary ? "GALLERY" : "PRIMARY",
        altText: asset.altText || asset.title || asset.originalFileName,
        title: asset.title || asset.originalFileName,
        displayOrder: images.length,
        isActive: true,
        mediaAsset: asset,
      },
    ]);
  };

  const update = (index: number, patch: Partial<ProductImage>) => {
    let next = images.map((image, itemIndex) =>
      itemIndex === index ? { ...image, ...patch } : image
    );

    if (patch.imageRole === "PRIMARY") {
      next = next.map((image, itemIndex) => ({
        ...image,
        imageRole:
          itemIndex === index
            ? "PRIMARY"
            : image.imageRole === "PRIMARY"
              ? "GALLERY"
              : image.imageRole,
      }));
    }
    onChange(next);
  };

  const remove = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    if (next.length && !next.some((item) => item.imageRole === "PRIMARY")) {
      next[0] = { ...next[0], imageRole: "PRIMARY" };
    }
    onChange(next.map((item, i) => ({ ...item, displayOrder: i })));
  };

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] px-5 py-8 hover:bg-[#f6f6f7]"
        >
          <ImageIcon size={30} className="text-[#6d7175]" />
          <span className="mt-3 text-sm font-semibold">Add product images</span>
          <span className="mt-1 text-xs text-[#6d7175]">Select assets from Media Studio</span>
        </button>
      ) : (
        <div className="space-y-3">
          {images.map((image, index) => {
            const url = image.mediaAsset ? getAssetUrl(image.mediaAsset) : null;
            return (
              <div
                key={`${image.mediaAssetId}-${index}`}
                className="grid gap-3 rounded-xl border border-[#e1e3e5] p-3 lg:grid-cols-[96px_minmax(0,1fr)_150px_44px] lg:items-center"
              >
                <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg bg-[#f6f6f7]">
                  {url ? (
                    <img src={url} alt={image.altText || ""} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-[#8c9196]" />
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={image.altText || ""}
                    onChange={(event) => update(index, { altText: event.target.value })}
                    className="admin-input"
                    placeholder="Alt text"
                  />
                  <input
                    value={image.title || ""}
                    onChange={(event) => update(index, { title: event.target.value })}
                    className="admin-input"
                    placeholder="Image title"
                  />
                </div>

                <select
                  value={image.imageRole}
                  onChange={(event) =>
                    update(index, { imageRole: event.target.value as ProductImageRole })
                  }
                  className="admin-input"
                >
                  <option value="PRIMARY">Primary</option>
                  <option value="GALLERY">Gallery</option>
                  <option value="SWATCH">Swatch</option>
                  <option value="LIFESTYLE">Lifestyle</option>
                </select>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5]"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
      >
        <Plus size={17} />
        Add images
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Add product media</h2>
                <p className="mt-1 text-sm text-[#6d7175]">Choose one or more images from Media Studio.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]">
                <X size={19} />
              </button>
            </header>

            <div className="border-b border-[#e1e3e5] p-4">
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="admin-input pl-10"
                  placeholder="Search media assets..."
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {isLoading || isFetching ? (
                <div className="flex min-h-80 items-center justify-center">
                  <LoaderCircle className="animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <div className="flex min-h-80 items-center justify-center text-sm text-[#6d7175]">
                  No ready image assets found.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {assets.map((asset) => {
                    const selected = selectedIds.has(asset.id);
                    const url = getAssetUrl(asset);

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        disabled={selected}
                        onClick={() => addAsset(asset)}
                        className={[
                          "overflow-hidden rounded-xl border bg-white text-left transition",
                          selected ? "border-[#005bd3] opacity-65" : "border-[#e1e3e5] hover:shadow-md",
                        ].join(" ")}
                      >
                        <div className="relative aspect-square bg-[#f6f6f7]">
                          {url ? (
                            <img
                              src={url}
                              alt={asset.altText || asset.title || asset.originalFileName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon size={28} className="text-[#8c9196]" />
                            </div>
                          )}
                          {selected && (
                            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#005bd3] text-white">
                              <Check size={16} />
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold">{asset.title || asset.originalFileName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getAssetUrl(asset: MediaAsset): string | null {
  const raw =
    asset.variants?.find((variant) => variant.variantType === "PREVIEW" && variant.publicUrl)?.publicUrl ||
    asset.variants?.find((variant) => variant.variantType === "THUMBNAIL" && variant.publicUrl)?.publicUrl ||
    asset.previewPath ||
    asset.thumbnailPath ||
    asset.publicUrl ||
    null;

  if (!raw) return null;
  if (/^(https?:|data:|blob:)/.test(raw)) return raw;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5080";
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (!path.startsWith("/media/")) path = `/media${path}`;
  return `${backendUrl.replace(/\/+$/, "")}${path}`;
}
