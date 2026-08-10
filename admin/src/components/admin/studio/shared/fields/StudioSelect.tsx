"use client";

import type {
  ChangeEvent,
} from "react";

export interface StudioSelectOption<
  Value extends string = string
> {
  value: Value;
  label: string;
  disabled?: boolean;
}

interface StudioSelectProps<
  Value extends string = string
> {
  id: string;
  label: string;
  value: Value;

  options:
    StudioSelectOption<Value>[];

  onChange: (
    value: Value
  ) => void;

  placeholder?: string;
  helperText?: string | null;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
}

export default function StudioSelect<
  Value extends string = string
>({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  helperText,
  error,
  disabled = false,
  required = false,
}: StudioSelectProps<Value>) {
  const descriptionId =
    error
      ? `${id}-error`
      : helperText
        ? `${id}-helper`
        : undefined;

  const handleChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    onChange(
      event.target.value as Value
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

      <select
        id={
          id
        }
        value={
          value
        }
        onChange={
          handleChange
        }
        disabled={
          disabled
        }
        required={
          required
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
          "focus:border-[#005bd3] focus:ring-2 focus:ring-[#005bd3]/15",
          "disabled:cursor-not-allowed disabled:bg-[#f1f2f3] disabled:text-[#8c9196]",

          error
            ? "border-[#d72c0d]"
            : "border-[#c9cccf]",
        ].join(
          " "
        )}
      >
        {placeholder && (
          <option
            value=""
            disabled
          >
            {placeholder}
          </option>
        )}

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
              disabled={
                option.disabled
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>

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