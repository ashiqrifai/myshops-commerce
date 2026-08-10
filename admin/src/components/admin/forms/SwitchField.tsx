"use client";

import { forwardRef, useId } from "react";

import BaseFormField from "./BaseFormField";
import type { BaseFormFieldProps } from "./BaseFormField";

export interface SwitchFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "type" | "size"
    >,
    Omit<BaseFormFieldProps, "children" | "id"> {
  id?: string;

  switchLabel?: React.ReactNode;
}

const SwitchField = forwardRef<
  HTMLInputElement,
  SwitchFieldProps
>(
  (
    {
      id: providedId,

      label,
      switchLabel,

      required = false,
      error,
      helpText,
      description,
      tooltip,

      layout = "vertical",

      disabled = false,

      checked,
      defaultChecked,

      className = "",
      labelClassName = "",
      contentClassName = "",
      errorClassName = "",
      helpTextClassName = "",

      ...inputProps
    },
    ref
  ) => {
    const generatedId = useId();

    const id =
      providedId ||
      `switch-${generatedId.replace(/:/g, "")}`;

    const describedBy = [
      description
        ? `${id}-description`
        : null,

      error
        ? `${id}-error`
        : null,

      !error && helpText
        ? `${id}-help`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <BaseFormField
        id={id}
        label={label}
        required={required}
        error={error}
        helpText={helpText}
        description={description}
        tooltip={tooltip}
        layout={layout}
        disabled={disabled}
        className={className}
        labelClassName={labelClassName}
        contentClassName={contentClassName}
        errorClassName={errorClassName}
        helpTextClassName={helpTextClassName}
      >
        <label
          htmlFor={id}
          className={[
            "inline-flex cursor-pointer items-center gap-3",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "",
          ].join(" ")}
        >
          <input
            {...inputProps}
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              describedBy || undefined
            }
            className="peer sr-only"
          />

          <span
            className={[
              "relative h-6 w-11 rounded-full transition-all",
              "bg-[#d1d5db]",
              "peer-checked:bg-[#303030]",
              "peer-focus:ring-2 peer-focus:ring-[#303030]/20",
              "peer-disabled:bg-[#e5e7eb]",
            ].join(" ")}
          >
            <span
              className={[
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                "peer-checked:translate-x-5",
              ].join(" ")}
            />
          </span>

          {switchLabel && (
            <span className="text-sm font-medium text-[#303030]">
              {switchLabel}
            </span>
          )}
        </label>
      </BaseFormField>
    );
  }
);

SwitchField.displayName =
  "SwitchField";

export default SwitchField;