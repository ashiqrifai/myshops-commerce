"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from "lucide-react";

export type StudioAlignmentValue =
  | "LEFT"
  | "CENTER"
  | "RIGHT";

interface StudioAlignmentPickerProps {
  id: string;
  label: string;
  value: StudioAlignmentValue;
  onChange: (
    value: StudioAlignmentValue
  ) => void;
  helperText?: string | null;
  disabled?: boolean;
}

const ALIGNMENT_OPTIONS: Array<{
  value: StudioAlignmentValue;
  label: string;
  icon: typeof AlignLeft;
}> = [
  {
    value: "LEFT",
    label: "Left",
    icon: AlignLeft,
  },
  {
    value: "CENTER",
    label: "Center",
    icon: AlignCenter,
  },
  {
    value: "RIGHT",
    label: "Right",
    icon: AlignRight,
  },
];

export default function StudioAlignmentPicker({
  id,
  label,
  value,
  onChange,
  helperText,
  disabled = false,
}: StudioAlignmentPickerProps) {
  return (
    <fieldset
      disabled={
        disabled
      }
    >
      <legend className="mb-1.5 block text-xs font-medium text-[#303030]">
        {label}
      </legend>

      <div
        id={
          id
        }
        className="grid grid-cols-3 gap-2"
      >
        {ALIGNMENT_OPTIONS.map(
          (option) => {
            const Icon =
              option.icon;

            const isSelected =
              value ===
              option.value;

            return (
              <button
                key={
                  option.value
                }
                type="button"
                onClick={() =>
                  onChange(
                    option.value
                  )
                }
                disabled={
                  disabled
                }
                aria-pressed={
                  isSelected
                }
                className={[
                  "flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",

                  isSelected
                    ? "border-[#005bd3] bg-[#eef4ff] text-[#005bd3] ring-1 ring-[#005bd3]/20"
                    : "border-[#c9cccf] bg-white text-[#303030] hover:bg-[#f6f6f7]",

                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "",
                ].join(
                  " "
                )}
              >
                <Icon
                  size={15}
                />

                {option.label}
              </button>
            );
          }
        )}
      </div>

      {helperText && (
        <p className="mt-1.5 text-xs leading-5 text-[#6d7175]">
          {helperText}
        </p>
      )}
    </fieldset>
  );
}