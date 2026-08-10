"use client";

import { forwardRef } from "react";

import {
  LoaderCircle,
} from "lucide-react";

import BaseFormField from "./BaseFormField";

import type {
  BaseFormFieldProps,
} from "./BaseFormField";

export interface TextFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "size"
    >,
    Omit<
      BaseFormFieldProps,
      "children"
    > {
  loading?: boolean;

  startAdornment?: React.ReactNode;

  endAdornment?: React.ReactNode;

  inputClassName?: string;

  containerClassName?: string;
}

const TextField = forwardRef<
  HTMLInputElement,
  TextFieldProps
>(
  (
    {
      id,
      label,
      required,
      error,
      helpText,
      description,
      tooltip,

      layout,

      disabled = false,

      loading = false,

      startAdornment,
      endAdornment,

      className,
      labelClassName,
      contentClassName,
      errorClassName,
      helpTextClassName,

      containerClassName,
      inputClassName,

      ...inputProps
    },
    ref
  ) => {
    const isDisabled =
      disabled || loading;

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
        disabled={isDisabled}
        className={className}
        labelClassName={labelClassName}
        contentClassName={contentClassName}
        errorClassName={errorClassName}
        helpTextClassName={helpTextClassName}
      >
        <div
          className={[
            "relative",
            containerClassName || "",
          ].join(" ")}
        >
          {startAdornment && (
            <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
              {startAdornment}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={isDisabled}
            aria-invalid={Boolean(error)}
            aria-describedby={[
              error
                ? `${id}-error`
                : "",
              !error && helpText
                ? `${id}-help`
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            className={[
              "block h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#202223] outline-none transition",

              startAdornment
                ? "pl-10"
                : "",

              endAdornment || loading
                ? "pr-10"
                : "",

              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-[#babfc3] hover:border-[#8c9196] focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",

              isDisabled
                ? "cursor-not-allowed bg-[#f6f6f7] text-[#8c9196]"
                : "",

              inputClassName || "",
            ].join(" ")}
            {...inputProps}
          />

          {loading ? (
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            </div>
          ) : (
            endAdornment && (
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
                {endAdornment}
              </div>
            )
          )}
        </div>
      </BaseFormField>
    );
  }
);

TextField.displayName =
  "TextField";

export default TextField;