"use client";

import {
  Film,
  GripVertical,
  ImageIcon,
  Trash2,
} from "lucide-react";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import type {
  ProductImage,
  ProductImageRole,
} from "@/types/product";

interface Props {
  image: ProductImage;
  index: number;
  url: string | null;
  isVideo: boolean;

  onUpdate: (
    index: number,
    patch: Partial<ProductImage>
  ) => void;

  onRemove: (
    index: number
  ) => void;
}

export default function SortableProductMediaItem({
  image,
  index,
  url,
  isVideo,
  onUpdate,
  onRemove,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.mediaAssetId,
  });

  const style: React.CSSProperties = {
    transform:
      CSS.Transform.toString(
        transform
      ),
    transition,
    position: "relative",
    zIndex: isDragging
      ? 50
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "grid gap-3 rounded-xl border bg-white p-3 transition",
        "lg:grid-cols-[44px_112px_minmax(0,1fr)_170px_44px]",
        "lg:items-center",
        isDragging
          ? "border-[#303030] opacity-75 shadow-xl"
          : "border-[#e1e3e5]",
      ].join(" ")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-10 w-10 touch-none cursor-grab items-center justify-center rounded-lg text-[#8c9196] hover:bg-[#f1f2f3] active:cursor-grabbing"
        aria-label={`Reorder ${
          image.title ||
          image.altText ||
          "product media"
        }`}
        title="Drag to reorder"
      >
        <GripVertical size={19} />
      </button>

      <div className="relative flex h-24 w-28 items-center justify-center overflow-hidden rounded-lg bg-[#f6f6f7]">
        {url ? (
          isVideo ? (
            <video
              src={url}
              muted
              preload="metadata"
              playsInline
              onMouseEnter={(event) => {
                void event.currentTarget
                  .play()
                  .catch(() => undefined);
              }}
              onMouseLeave={(event) => {
                event.currentTarget.pause();
                event.currentTarget.currentTime =
                  0;
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={image.altText || ""}
              className="h-full w-full object-cover"
            />
          )
        ) : isVideo ? (
          <Film
            size={25}
            className="text-[#8c9196]"
          />
        ) : (
          <ImageIcon
            size={24}
            className="text-[#8c9196]"
          />
        )}

        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          {isVideo
            ? "Video"
            : image.imageRole}
        </span>

        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-white/95 px-1.5 py-1 text-[10px] font-semibold shadow-sm">
          {index + 1}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={image.altText || ""}
          onChange={(event) =>
            onUpdate(index, {
              altText:
                event.target.value,
            })
          }
          className="admin-input"
          placeholder={
            isVideo
              ? "Video accessibility label"
              : "Alt text"
          }
        />

        <input
          value={image.title || ""}
          onChange={(event) =>
            onUpdate(index, {
              title:
                event.target.value,
            })
          }
          className="admin-input"
          placeholder={
            isVideo
              ? "Video title"
              : "Image title"
          }
        />
      </div>

      <select
        value={image.imageRole}
        onChange={(event) =>
          onUpdate(index, {
            imageRole:
              event.target
                .value as ProductImageRole,
          })
        }
        className="admin-input"
      >
        {isVideo ? (
          <option value="VIDEO">
            Product video
          </option>
        ) : (
          <>
            <option value="PRIMARY">
              Primary
            </option>

            <option value="GALLERY">
              Gallery
            </option>

            <option value="LIFESTYLE">
              Lifestyle
            </option>

            <option value="SWATCH">
              Swatch
            </option>
          </>
        )}
      </select>

      <button
        type="button"
        onClick={() =>
          onRemove(index)
        }
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5]"
        aria-label="Remove product media"
        title="Remove media"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}