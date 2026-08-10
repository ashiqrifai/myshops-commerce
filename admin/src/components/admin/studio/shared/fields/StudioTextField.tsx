"use client";

import type {
  ChangeEvent,
  HTMLInputTypeAttribute,
} from "react";

interface StudioTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  helperText?: string | null;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
}

export default function StudioTextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helperText,
  error,
  disabled = false,
  required = false,
  autoComplete = "off",
  maxLength,
}: StudioTextFieldProps) {
  const descriptionId =
    error
      ? `${id}-error`
      : helperText
        ? `${id}-helper`
        : undefined;

  const handleChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    onChange(
      event.target.value
    );
  };

  return (
    <div>
      <label
        htmlFor={
          id
        }
        className="mb-1.5 block text-xs font-medium text-[#303030]"
      >
        {label}

        {required && (
          <span
            className="ml-1 text-[#b42318]"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      <input
        id={
          id
        }
        type={
          type
        }
        value={
          value
        }
        onChange={
          handleChange
        }
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        required={
          required
        }
        autoComplete={
          autoComplete
        }
        maxLength={
          maxLength
        }
        aria-invalid={
          Boolean(
            error
          )
        }
        aria-describedby={
          descriptionId
        }
        className={[
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#202223] outline-none transition",
          "placeholder:text-[#8c9196]",
          "focus:border-[#005bd3] focus:ring-2 focus:ring-[#005bd3]/15",
          "disabled:cursor-not-allowed disabled:bg-[#f1f2f3] disabled:text-[#8c9196]",

          error
            ? "border-[#d72c0d]"
            : "border-[#c9cccf]",
        ].join(
          " "
        )}
      />

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs leading-5 text-[#b42318]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${id}-helper`}
          className="mt-1.5 text-xs leading-5 text-[#6d7175]"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}