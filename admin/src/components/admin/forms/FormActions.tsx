"use client";

import {
  ArrowLeft,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";

interface FormActionsProps {
  onSave: () => void;
  onCancel: () => void;

  saveLabel?: string;
  savingLabel?: string;
  cancelLabel?: string;

  isSaving?: boolean;
  saveDisabled?: boolean;
  cancelDisabled?: boolean;

  onDelete?: () => void;
  deleteLabel?: string;
  isDeleting?: boolean;
  deleteDisabled?: boolean;

  sticky?: boolean;
  className?: string;
}

export default function FormActions({
  onSave,
  onCancel,

  saveLabel = "Save",
  savingLabel = "Saving...",
  cancelLabel = "Cancel",

  isSaving = false,
  saveDisabled = false,
  cancelDisabled = false,

  onDelete,
  deleteLabel = "Delete",
  isDeleting = false,
  deleteDisabled = false,

  sticky = false,
  className = "",
}: FormActionsProps) {
  const isBusy =
    isSaving ||
    isDeleting;

  return (
    <div
      className={[
        "flex flex-col-reverse gap-3 border-t border-[#e1e3e5] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        sticky
          ? "sticky bottom-0 z-30 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
          : "",
        className,
      ].join(" ")}
    >
      <div>
        {onDelete && (
          <button
            type="button"
            disabled={
              deleteDisabled ||
              isBusy
            }
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Trash2
                size={17}
                aria-hidden="true"
              />
            )}

            {isDeleting
              ? "Deleting..."
              : deleteLabel}
          </button>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={
            cancelDisabled ||
            isBusy
          }
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] transition hover:border-[#8c9196] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft
            size={17}
            aria-hidden="true"
          />

          {cancelLabel}
        </button>

        <button
          type="button"
          disabled={
            saveDisabled ||
            isBusy
          }
          onClick={onSave}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#303030] bg-[#303030] px-4 text-sm font-semibold text-white transition hover:border-[#1a1a1a] hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Save
              size={17}
              aria-hidden="true"
            />
          )}

          {isSaving
            ? savingLabel
            : saveLabel}
        </button>
      </div>
    </div>
  );
}