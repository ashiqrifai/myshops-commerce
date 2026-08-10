"use client";

import {
  forwardRef,
  useId,
} from "react";

import type {
  SelectHTMLAttributes,
} from "react";

import {
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

import BaseFormField from "./BaseFormField";

import type {
  BaseFormFieldProps,
} from "./BaseFormField";

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      "children" | "size"
    >,
    Omit<
      BaseFormFieldProps,
      "children" | "id"
    > {
  id?: string;

  options: SelectFieldOption[];

  placeholder?: string;

  loading?: boolean;

  selectClassName?: string;

  containerClassName?: string;
}

const SelectField = forwardRef<
  HTMLSelectElement,
  SelectFieldProps
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

      options,
      placeholder = "Select an option",

      disabled = false,
      loading = false,

      value,
      defaultValue,

      className = "",
      labelClassName = "",
      contentClassName = "",
      errorClassName = "",
      helpTextClassName = "",

      selectClassName = "",
      containerClassName = "",

      ...selectProps
    },
    ref
  ) => {
    const generatedId =
      useId();

    const id =
      providedId ||
      `select-field-${generatedId.replace(
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

      !error &&
      helpText
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
        labelClassName={labelClassName}
        contentClassName={contentClassName}
        errorClassName={errorClassName}
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
          <select
            {...selectProps}
            ref={ref}
            id={id}
            value={value}
            defaultValue={defaultValue}
            disabled={isDisabled}
            required={required}
            aria-invalid={
              Boolean(error)
            }
            aria-describedby={
              describedBy
            }
            className={[
              "block h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-[#202223] outline-none transition",

              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-[#babfc3] hover:border-[#8c9196] focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",

              isDisabled
                ? "cursor-not-allowed bg-[#f6f6f7] text-[#8c9196]"
                : "",

              selectClassName,
            ].join(" ")}
          >
            {placeholder && (
              <option
                value=""
                disabled={required}
              >
                {placeholder}
              </option>
            )}

            {options.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={
                    option.disabled
                  }
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
            {loading ? (
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
            ) : (
              <ChevronDown
                size={16}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </BaseFormField>
    );
  }
);

SelectField.displayName =
  "SelectField";

export default SelectField;