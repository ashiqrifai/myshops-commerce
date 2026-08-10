"use client";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from "lucide-react";

export type InlineToastTone =
  | "success"
  | "error"
  | "info";

export default function InlineToast({
  tone,
  message,
  onClose,
}: {
  tone:
    InlineToastTone;
  message: string;
  onClose:
    () => void;
}) {
  const Icon =
    tone ===
      "success"
      ? CheckCircle2
      : tone ===
          "error"
        ? CircleAlert
        : Info;

  const className =
    tone ===
      "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone ===
          "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <div
      className={`fixed right-4 top-4 z-[100] flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-xl ${className}`}
      role="status"
    >
      <Icon
        size={
          19
        }
        className="mt-0.5 shrink-0"
      />

      <p className="flex-1 text-sm font-bold leading-5">
        {
          message
        }
      </p>

      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Close notification"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-black/5"
      >
        <X
          size={
            15
          }
        />
      </button>
    </div>
  );
}
