"use client";

import {
  forwardRef,
  useId,
} from "react";

import type {
  InputHTMLAttributes,
} from "react";

import {
  CalendarDays,
  LoaderCircle,
} from "lucide-react";

import BaseFormField from "./BaseFormField";

import type {
  BaseFormFieldProps,
} from "./BaseFormField";

export type DateFieldType =
  | "date"
  | "datetime-local"
  | "month";

export interface DateFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "type" | "size"
    >,
    Omit<
      BaseFormFieldProps,
      "children" | "id"
    > {
  id?: string;

  type?: DateFieldType;

  loading?: boolean;

  inputClassName?: string;

  containerClassName?: string;
}

const DateField = forwardRef<
  HTMLInputElement,
  DateFieldProps
>(
  (
    {
      id: providedId,

      label,
      required = false,
      error,
      helpText,
      description,
      tooltip,
      layout = "vertical",

      type = "date",

      disabled = false,
      loading = false,

      className = "",
      labelClassName = "",
      contentClassName = "",
      errorClassName = "",
      helpTextClassName = "",

      inputClassName = "",
      containerClassName = "",

      ...inputProps
    },
    ref
  ) => {
    const generatedId =
      useId();

    const id =
      providedId ||
      `date-field-${generatedId.replace(
        /:/g,
        ""
      )}`;

    const isDisabled =
      disabled ||
      loading;

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
      .join(" ") ||
      undefined;

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
        labelClassName={
          labelClassName
        }
        contentClassName={
          contentClassName
        }
        errorClassName={
          errorClassName
        }
        helpTextClassName={
          helpTextClassName
        }
      >
        <div
          className={[
            "relative",
            containerClassName,
          ].join(" ")}
        >
          <CalendarDays
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8c9196]"
          />

          <input
            {...inputProps}
            ref={ref}
            id={id}
            type={type}
            disabled={isDisabled}
            required={required}
            aria-invalid={
              Boolean(error)
            }
            aria-describedby={
              describedBy
            }
            className={[
              "block h-10 w-full rounded-lg border bg-white py-2 pl-10 text-sm text-[#202223] outline-none transition",

              loading
                ? "pr-10"
                : "pr-3",

              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-[#babfc3] hover:border-[#8c9196] focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",

              isDisabled
                ? "cursor-not-allowed bg-[#f6f6f7] text-[#8c9196]"
                : "",

              inputClassName,
            ].join(" ")}
          />

          {loading && (
            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
            </div>
          )}
        </div>
      </BaseFormField>
    );
  }
);

DateField.displayName =
  "DateField";

export default DateField;