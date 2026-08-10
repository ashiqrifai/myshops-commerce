import type {
    ReactNode,
  } from "react";
  
  import {
    AlertCircle,
    HelpCircle,
  } from "lucide-react";
  
  export type FormFieldLayout =
    | "vertical"
    | "horizontal";
  
  export interface BaseFormFieldProps {
    children: ReactNode;
  
    id?: string;
  
    label?: ReactNode;
  
    required?: boolean;
  
    error?: string | null;
  
    helpText?: ReactNode;
  
    description?: ReactNode;
  
    tooltip?: string;
  
    layout?: FormFieldLayout;
  
    disabled?: boolean;
  
    className?: string;
  
    labelClassName?: string;
  
    contentClassName?: string;
  
    errorClassName?: string;
  
    helpTextClassName?: string;
  }
  
  export default function BaseFormField({
    children,
    id,
    label,
    required = false,
    error,
    helpText,
    description,
    tooltip,
    layout = "vertical",
    disabled = false,
    className = "",
    labelClassName = "",
    contentClassName = "",
    errorClassName = "",
    helpTextClassName = "",
  }: BaseFormFieldProps) {
    const errorId =
      id && error
        ? `${id}-error`
        : undefined;
  
    const helpTextId =
      id &&
      helpText &&
      !error
        ? `${id}-help`
        : undefined;
  
    const descriptionId =
      id && description
        ? `${id}-description`
        : undefined;
  
    const fieldContent = (
      <>
        <div
          className={[
            "min-w-0",
            contentClassName,
          ].join(" ")}
        >
          {children}
        </div>
  
        {error && (
          <FieldError
            id={errorId}
            message={error}
            className={errorClassName}
          />
        )}
  
        {!error && helpText && (
          <FieldHelpText
            id={helpTextId}
            className={helpTextClassName}
          >
            {helpText}
          </FieldHelpText>
        )}
      </>
    );
  
    if (layout === "horizontal") {
      return (
        <div
          className={[
            "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] sm:gap-6",
            disabled
              ? "opacity-60"
              : "",
            className,
          ].join(" ")}
          data-field-error={
            error ? "true" : "false"
          }
          data-field-disabled={
            disabled
              ? "true"
              : "false"
          }
        >
          <div className="min-w-0 pt-2">
            {label && (
              <FieldLabel
                htmlFor={id}
                required={required}
                tooltip={tooltip}
                className={labelClassName}
              >
                {label}
              </FieldLabel>
            )}
  
            {description && (
              <FieldDescription
                id={descriptionId}
              >
                {description}
              </FieldDescription>
            )}
          </div>
  
          <div className="min-w-0">
            {fieldContent}
          </div>
        </div>
      );
    }
  
    return (
      <div
        className={[
          "min-w-0",
          disabled
            ? "opacity-60"
            : "",
          className,
        ].join(" ")}
        data-field-error={
          error ? "true" : "false"
        }
        data-field-disabled={
          disabled
            ? "true"
            : "false"
        }
      >
        {label && (
          <FieldLabel
            htmlFor={id}
            required={required}
            tooltip={tooltip}
            className={labelClassName}
          >
            {label}
          </FieldLabel>
        )}
  
        {description && (
          <FieldDescription
            id={descriptionId}
          >
            {description}
          </FieldDescription>
        )}
  
        <div
          className={[
            label || description
              ? "mt-1.5"
              : "",
          ].join(" ")}
        >
          {fieldContent}
        </div>
      </div>
    );
  }
  
  interface FieldLabelProps {
    children: ReactNode;
  
    htmlFor?: string;
  
    required?: boolean;
  
    tooltip?: string;
  
    className?: string;
  }
  
  function FieldLabel({
    children,
    htmlFor,
    required = false,
    tooltip,
    className = "",
  }: FieldLabelProps) {
    const content = (
      <>
        <span>
          {children}
        </span>
  
        {required && (
          <>
            <span
              aria-hidden="true"
              className="ml-1 text-red-600"
            >
              *
            </span>
  
            <span className="sr-only">
              required
            </span>
          </>
        )}
  
        {tooltip && (
          <span
            title={tooltip}
            aria-label={tooltip}
            className="ml-1.5 inline-flex cursor-help items-center text-[#8c9196]"
          >
            <HelpCircle
              size={14}
              aria-hidden="true"
            />
          </span>
        )}
      </>
    );
  
    const sharedClassName = [
      "inline-flex items-center text-sm font-semibold text-[#303030]",
      className,
    ].join(" ");
  
    if (htmlFor) {
      return (
        <label
          htmlFor={htmlFor}
          className={sharedClassName}
        >
          {content}
        </label>
      );
    }
  
    return (
      <div
        className={sharedClassName}
      >
        {content}
      </div>
    );
  }
  
  function FieldDescription({
    id,
    children,
  }: {
    id?: string;
    children: ReactNode;
  }) {
    return (
      <p
        id={id}
        className="mt-1 text-sm leading-5 text-[#6d7175]"
      >
        {children}
      </p>
    );
  }
  
  function FieldError({
    id,
    message,
    className = "",
  }: {
    id?: string;
    message: string;
    className?: string;
  }) {
    return (
      <p
        id={id}
        role="alert"
        className={[
          "mt-1.5 flex items-start gap-1.5 text-sm leading-5 text-red-600",
          className,
        ].join(" ")}
      >
        <AlertCircle
          size={15}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
  
        <span>
          {message}
        </span>
      </p>
    );
  }
  
  function FieldHelpText({
    id,
    children,
    className = "",
  }: {
    id?: string;
    children: ReactNode;
    className?: string;
  }) {
    return (
      <p
        id={id}
        className={[
          "mt-1.5 text-sm leading-5 text-[#6d7175]",
          className,
        ].join(" ")}
      >
        {children}
      </p>
    );
  }