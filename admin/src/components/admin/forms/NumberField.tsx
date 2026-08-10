"use client";

import {
  forwardRef,
  useId,
} from "react";

import type {
  InputHTMLAttributes,
  ReactNode,
} from "react";

import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
} from "lucide-react";

import BaseFormField from "./BaseFormField";

import type {
  BaseFormFieldProps,
} from "./BaseFormField";

export interface NumberFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      | "type"
      | "size"
      | "value"
      | "defaultValue"
      | "onChange"
    >,
    Omit<
      BaseFormFieldProps,
      "children" | "id"
    > {
  id?: string;

  value?: number | string | null;

  defaultValue?: number | string;

  onValueChange?: (
    value: number | null,
    rawValue: string
  ) => void;

  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  loading?: boolean;

  startAdornment?: ReactNode;

  endAdornment?: ReactNode;

  allowEmpty?: boolean;

  showStepControls?: boolean;

  formatValue?: (
    value: number
  ) => string;

  parseValue?: (
    rawValue: string
  ) => number | null;

  inputClassName?: string;

  containerClassName?: string;
}

const NumberField = forwardRef<
  HTMLInputElement,
  NumberFieldProps
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

      value,
      defaultValue,
      onValueChange,
      onChange,

      min,
      max,
      step = 1,

      disabled = false,
      readOnly = false,
      loading = false,

      startAdornment,
      endAdornment,

      allowEmpty = true,
      showStepControls = false,

      formatValue,
      parseValue,

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
      `number-field-${generatedId.replace(
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

    const resolvedValue =
      value === null
        ? ""
        : value;

    const handleChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      onChange?.(
        event
      );

      const rawValue =
        event.target.value;

      if (
        rawValue.trim() ===
        ""
      ) {
        onValueChange?.(
          allowEmpty
            ? null
            : normalizeNumber(
                0,
                min,
                max
              ),
          rawValue
        );

        return;
      }

      const parsedValue =
        parseValue
          ? parseValue(
              rawValue
            )
          : parseNumber(
              rawValue
            );

      if (
        parsedValue ===
        null
      ) {
        onValueChange?.(
          null,
          rawValue
        );

        return;
      }

      onValueChange?.(
        normalizeNumber(
          parsedValue,
          min,
          max
        ),
        rawValue
      );
    };

    const handleStep = (
      direction:
        | "increment"
        | "decrement"
    ) => {
      if (
        isDisabled ||
        readOnly
      ) {
        return;
      }

      const currentValue =
        resolveCurrentNumber(
          value,
          defaultValue
        );

      const numericStep =
        getNumericConstraint(
          step,
          1
        );

      const nextValue =
        direction ===
        "increment"
          ? currentValue +
            numericStep
          : currentValue -
            numericStep;

      const normalizedValue =
        normalizeNumber(
          nextValue,
          min,
          max
        );

      onValueChange?.(
        normalizedValue,
        String(
          normalizedValue
        )
      );
    };

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
          {startAdornment && (
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center text-[#8c9196]">
              {startAdornment}
            </div>
          )}

          <input
            {...inputProps}
            ref={ref}
            id={id}
            type="number"
            value={resolvedValue}
            defaultValue={defaultValue}
            min={min}
            max={max}
            step={step}
            disabled={isDisabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={
              Boolean(error)
            }
            aria-describedby={
              describedBy
            }
            onChange={
              handleChange
            }
            className={[
              "block h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#202223] outline-none transition placeholder:text-[#8c9196]",

              startAdornment
                ? "pl-10"
                : "",

              endAdornment ||
              loading ||
              showStepControls
                ? showStepControls
                  ? "pr-14"
                  : "pr-10"
                : "",

              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-[#babfc3] hover:border-[#8c9196] focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",

              isDisabled
                ? "cursor-not-allowed bg-[#f6f6f7] text-[#8c9196]"
                : "",

              readOnly &&
              !isDisabled
                ? "cursor-default bg-[#fafafa]"
                : "",

              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",

              inputClassName,
            ].join(" ")}
          />

          {loading ? (
            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="animate-spin"
              />
            </div>
          ) : showStepControls ? (
            <StepControls
              disabled={
                isDisabled ||
                readOnly
              }
              onIncrement={() =>
                handleStep(
                  "increment"
                )
              }
              onDecrement={() =>
                handleStep(
                  "decrement"
                )
              }
            />
          ) : (
            endAdornment && (
              <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#8c9196]">
                {endAdornment}
              </div>
            )
          )}
        </div>

        {formatValue &&
          typeof value ===
            "number" &&
          Number.isFinite(
            value
          ) && (
            <p className="mt-1.5 text-sm text-[#6d7175]">
              {formatValue(
                value
              )}
            </p>
          )}
      </BaseFormField>
    );
  }
);

NumberField.displayName =
  "NumberField";

export default NumberField;

function StepControls({
  disabled,
  onIncrement,
  onDecrement,
}: {
  disabled: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="absolute bottom-px right-px top-px flex w-11 flex-col overflow-hidden rounded-r-[7px] border-l border-[#d8dadd] bg-[#fafafa]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Increase value"
        disabled={disabled}
        onClick={onIncrement}
        className="flex flex-1 items-center justify-center border-b border-[#d8dadd] text-[#6d7175] transition hover:bg-[#f1f2f3] hover:text-[#202223] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronUp
          size={13}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        tabIndex={-1}
        aria-label="Decrease value"
        disabled={disabled}
        onClick={onDecrement}
        className="flex flex-1 items-center justify-center text-[#6d7175] transition hover:bg-[#f1f2f3] hover:text-[#202223] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronDown
          size={13}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function parseNumber(
  rawValue: string
) {
  const parsedValue =
    Number(
      rawValue
    );

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : null;
}

function resolveCurrentNumber(
  value:
    | number
    | string
    | null
    | undefined,
  defaultValue:
    | number
    | string
    | undefined
) {
  const sourceValue =
    value !== undefined &&
    value !== null &&
    value !== ""
      ? value
      : defaultValue;

  const numericValue =
    Number(
      sourceValue
    );

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : 0;
}

function normalizeNumber(
  value: number,
  min:
    | number
    | string
    | undefined,
  max:
    | number
    | string
    | undefined
) {
  const minimum =
    getNumericConstraint(
      min
    );

  const maximum =
    getNumericConstraint(
      max
    );

  let normalizedValue =
    value;

  if (
    minimum !== null
  ) {
    normalizedValue =
      Math.max(
        normalizedValue,
        minimum
      );
  }

  if (
    maximum !== null
  ) {
    normalizedValue =
      Math.min(
        normalizedValue,
        maximum
      );
  }

  return normalizedValue;
}

function getNumericConstraint(
  value:
    | number
    | string
    | undefined,
  fallback?: number
) {
  if (
    value ===
      undefined ||
    value ===
      ""
  ) {
    return fallback ??
      null;
  }

  const numericValue =
    Number(
      value
    );

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback ??
        null;
}