"use client";

import {
  ImageIcon,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface StudioMediaPickerProps {
  id: string;
  label: string;

  imageUrl?: string | null;
  altText?: string | null;

  helperText?: string | null;
  emptyText?: string;

  selectLabel?: string;
  replaceLabel?: string;

  disabled?: boolean;
  aspectRatio?: "SQUARE" | "LANDSCAPE" | "PORTRAIT";

  onSelect: () => void;
  onClear?: () => void;
}

export default function StudioMediaPicker({
  id,
  label,
  imageUrl,
  altText,
  helperText,
  emptyText = "No image selected",
  selectLabel = "Select image",
  replaceLabel = "Replace image",
  disabled = false,
  aspectRatio = "LANDSCAPE",
  onSelect,
  onClear,
}: StudioMediaPickerProps) {
  const hasImage =
    Boolean(
      imageUrl
    );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          id={`${id}-label`}
          className="block text-xs font-medium text-[#303030]"
        >
          {label}
        </label>

        {hasImage &&
          onClear && (
            <button
              type="button"
              onClick={
                onClear
              }
              disabled={
                disabled
              }
              className="flex items-center gap-1 text-xs font-medium text-[#a23b2a] transition hover:text-[#7a271a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2
                size={13}
              />

              Remove
            </button>
          )}
      </div>

      <div
        aria-labelledby={`${id}-label`}
        className={[
          "overflow-hidden rounded-xl border border-[#c9cccf] bg-[#f6f6f7]",

          aspectRatio ===
          "SQUARE"
            ? "aspect-square"
            : aspectRatio ===
                "PORTRAIT"
              ? "aspect-[4/5]"
              : "aspect-[16/9]",
        ].join(
          " "
        )}
      >
        {hasImage ? (
          <img
            src={
              imageUrl ||
              ""
            }
            alt={
              altText ||
              label
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[150px] items-center justify-center p-6 text-center">
            <div>
              <ImageIcon
                size={26}
                className="mx-auto text-[#8c9196]"
              />

              <p className="mt-3 text-xs font-medium text-[#5c5f62]">
                {emptyText}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={
          onSelect
        }
        disabled={
          disabled
        }
        className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#c9cccf] bg-white px-3 text-xs font-semibold text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {hasImage && (
          <RefreshCw
            size={14}
          />
        )}

        {hasImage
          ? replaceLabel
          : selectLabel}
      </button>

      {helperText && (
        <p className="mt-1.5 text-xs leading-5 text-[#6d7175]">
          {helperText}
        </p>
      )}
    </div>
  );
}