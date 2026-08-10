"use client";

import {
  LoaderCircle,
} from "lucide-react";

interface StudioSaveBarProps {
  isDirty: boolean;
  isSaving?: boolean;
  saveLabel?: string;
  discardLabel?: string;
  message?: string;
  onSave: () => void;
  onDiscard: () => void;
}

export default function StudioSaveBar({
  isDirty,
  isSaving = false,
  saveLabel = "Save",
  discardLabel = "Discard",
  message = "Unsaved changes",
  onSave,
  onDiscard,
}: StudioSaveBarProps) {
  if (!isDirty) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#c9cccf] bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-[#303030]">
        {message}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={
            onDiscard
          }
          disabled={
            isSaving
          }
          className="flex h-9 items-center justify-center rounded-lg border border-[#c9cccf] bg-white px-3 text-xs font-semibold text-[#303030] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {discardLabel}
        </button>

        <button
          type="button"
          onClick={
            onSave
          }
          disabled={
            isSaving
          }
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#303030] px-3 text-xs font-semibold text-white transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && (
            <LoaderCircle
              size={14}
              className="animate-spin"
            />
          )}

          {isSaving
            ? "Saving..."
            : saveLabel}
        </button>
      </div>
    </div>
  );
}