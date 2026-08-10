"use client";

import {
  forwardRef,
  useId,
} from "react";

import type {
  TextareaHTMLAttributes,
} from "react";

import {
  LoaderCircle,
} from "lucide-react";

import BaseFormField from "./BaseFormField";

import type {
  BaseFormFieldProps,
} from "./BaseFormField";

export interface TextareaFieldProps
  extends Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      "children"
    >,
    Omit<
      BaseFormFieldProps,
      "children" | "id"
    > {
  id?: string;

  loading?: boolean;

  showCharacterCount?: boolean;

  resize?:
    | "none"
    | "vertical"
    | "horizontal"
    | "both";

  textareaClassName?: string;

  containerClassName?: string;
}

const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
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

      disabled = false,
      loading = false,

      value,
      defaultValue,
      maxLength,

      showCharacterCount = false,
      resize = "vertical",

      className = "",
      labelClassName = "",
      contentClassName = "",
      errorClassName = "",
      helpTextClassName = "",

      textareaClassName = "",
      containerClassName = "",

      rows = 4,

      onChange,

      ...textareaProps
    },
    ref
  ) => {
    const generatedId =
      useId();

    const id =
      providedId ||
      `textarea-${generatedId.replace(
        /:/g,
        ""
      )}`;

    const isDisabled =
      disabled ||
      loading;

    const characterCount =
      getCharacterCount(
        value,
        defaultValue
      );

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
          <textarea
            {...textareaProps}
            ref={ref}
            id={id}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            maxLength={maxLength}
            disabled={isDisabled}
            required={required}
            aria-invalid={
              Boolean(error)
            }
            aria-describedby={
              describedBy
            }
            onChange={onChange}
            className={[
              "block min-h-24 w-full rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 text-[#202223] outline-none transition placeholder:text-[#8c9196]",

              getResizeClassName(
                resize
              ),

              loading
                ? "pr-10"
                : "",

              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-[#babfc3] hover:border-[#8c9196] focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",

              isDisabled
                ? "cursor-not-allowed bg-[#f6f6f7] text-[#8c9196]"
                : "",

              textareaClassName,
            ].join(" ")}
          />

          {loading && (
            <div className="pointer-events-none absolute right-3 top-3 flex items-center text-[#8c9196]">
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
            </div>
          )}
        </div>

        {showCharacterCount && (
          <CharacterCount
            current={
              characterCount
            }
            maximum={
              maxLength
            }
            hasError={
              Boolean(error)
            }
          />
        )}
      </BaseFormField>
    );
  }
);

TextareaField.displayName =
  "TextareaField";

export default TextareaField;

function CharacterCount({
  current,
  maximum,
  hasError,
}: {
  current: number;
  maximum?: number;
  hasError: boolean;
}) {
  const hasExceededMaximum =
    maximum !== undefined &&
    current > maximum;

  return (
    <p
      aria-live="polite"
      className={[
        "mt-1.5 text-right text-xs tabular-nums",

        hasError ||
        hasExceededMaximum
          ? "text-red-600"
          : "text-[#8c9196]",
      ].join(" ")}
    >
      {maximum !== undefined
        ? `${current} / ${maximum}`
        : `${current} characters`}
    </p>
  );
}

function getCharacterCount(
  value:
    | string
    | readonly string[]
    | number
    | undefined,
  defaultValue:
    | string
    | readonly string[]
    | number
    | undefined
) {
  const resolvedValue =
    value !== undefined
      ? value
      : defaultValue;

  if (
    resolvedValue ===
      undefined ||
    resolvedValue ===
      null
  ) {
    return 0;
  }

  if (
    Array.isArray(
      resolvedValue
    )
  ) {
    return resolvedValue.join(
      ","
    ).length;
  }

  return String(
    resolvedValue
  ).length;
}

function getResizeClassName(
  resize:
    | "none"
    | "vertical"
    | "horizontal"
    | "both"
) {
  switch (resize) {
    case "none":
      return "resize-none";

    case "horizontal":
      return "resize-x";

    case "both":
      return "resize";

    default:
      return "resize-y";
  }
}