"use client";

import {
  forwardRef,
  useId,
} from "react";

import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

import BaseFormField from "./BaseFormField";

import type {
  BaseFormFieldProps,
} from "./BaseFormField";

export interface CheckboxFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "type" | "size"
    >,
    Omit<
      BaseFormFieldProps,
      "children" | "id"
    > {
  id?: string;
  checkboxLabel?: ReactNode;
  checkboxDescription?: ReactNode;
}

const CheckboxField = forwardRef<
  HTMLInputElement,
  CheckboxFieldProps
>(
  (
    {
      id: providedId,
      label,
      checkboxLabel,
      checkboxDescription,
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
    const generatedId =
      useId();

    const id =
      providedId ||
      `checkbox-${generatedId.replace(
        /:/g,
        ""
      )}`;

    const describedBy = [
      description
        ? `${id}-description`
        : null,
      checkboxDescription
        ? `${id}-checkbox-description`
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
        id={
          label
            ? undefined
            : id
        }
        label={label}
        required={required}
        error={error}
        helpText={helpText}
        description={description}
        tooltip={tooltip}
        layout={layout}
        disabled={disabled}
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
        <label
          htmlFor={id}
          className={[
            "flex items-start gap-3",
            disabled
              ? "cursor-not-allowed"
              : "cursor-pointer",
          ].join(" ")}
        >
          <input
            {...inputProps}
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            defaultChecked={
              defaultChecked
            }
            disabled={disabled}
            required={required}
            aria-invalid={
              Boolean(error)
            }
            aria-describedby={
              describedBy
            }
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#babfc3] accent-[#303030] focus:ring-2 focus:ring-[#303030]/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {(checkboxLabel ||
            checkboxDescription) && (
            <span className="min-w-0">
              {checkboxLabel && (
                <span className="block text-sm font-medium text-[#303030]">
                  {checkboxLabel}
                </span>
              )}

              {checkboxDescription && (
                <span
                  id={`${id}-checkbox-description`}
                  className="mt-0.5 block text-sm leading-5 text-[#6d7175]"
                >
                  {
                    checkboxDescription
                  }
                </span>
              )}
            </span>
          )}
        </label>
      </BaseFormField>
    );
  }
);

CheckboxField.displayName =
  "CheckboxField";

export default CheckboxField;