"use client";

import type {
  ReactNode,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export type CrudPageFeedbackType =
  | "success"
  | "error"
  | "info"
  | "warning";

export interface CrudPageFeedback {
  type:
    CrudPageFeedbackType;

  message:
    string;

  title?:
    string;
}

interface CrudPageLayoutProps {
  toolbar:
    ReactNode;

  children:
    ReactNode;

  summary?:
    ReactNode;

  filters?:
    ReactNode;

  feedback?:
    CrudPageFeedback | null;

  errorMessage?:
    string | null;

  onDismissFeedback?:
    () => void;

  beforeContent?:
    ReactNode;

  afterContent?:
    ReactNode;

  dialogs?:
    ReactNode;

  className?:
    string;

  contentClassName?:
    string;

  tableContainerClassName?:
    string;

  gap?:
    "sm"
    | "md"
    | "lg";

  showTableCard?:
    boolean;
}

export default function CrudPageLayout({
  toolbar,
  children,
  summary,
  filters,
  feedback,
  errorMessage,
  onDismissFeedback,
  beforeContent,
  afterContent,
  dialogs,
  className = "",
  contentClassName = "",
  tableContainerClassName = "",
  gap = "md",
  showTableCard = true,
}: CrudPageLayoutProps) {
  const gapClassName =
    getGapClassName(
      gap
    );

  const displayedFeedback =
    errorMessage
      ? {
          type:
            "error" as const,

          title:
            "Unable to load records",

          message:
            errorMessage,
        }
      : feedback;

  return (
    <>
      <main
        className={[
          "min-w-0",
          className,
        ].join(" ")}
      >
        <div
          className={[
            "flex min-w-0 flex-col",
            gapClassName,
            contentClassName,
          ].join(" ")}
        >
          {toolbar}

          {displayedFeedback && (
            <FeedbackBanner
              feedback={
                displayedFeedback
              }
              onDismiss={
                errorMessage
                  ? undefined
                  : onDismissFeedback
              }
            />
          )}

          {summary}

          {beforeContent}

          {filters}

          {showTableCard ? (
            <section
              aria-label="Records"
              className={[
                "min-w-0 overflow-hidden rounded-xl border border-[#e1e3e5] bg-white shadow-sm",
                tableContainerClassName,
              ].join(" ")}
            >
              {children}
            </section>
          ) : (
            <section
              aria-label="Records"
              className={[
                "min-w-0",
                tableContainerClassName,
              ].join(" ")}
            >
              {children}
            </section>
          )}

          {afterContent}
        </div>
      </main>

      {dialogs}
    </>
  );
}

interface FeedbackBannerProps {
  feedback:
    CrudPageFeedback;

  onDismiss?:
    () => void;
}

function FeedbackBanner({
  feedback,
  onDismiss,
}: FeedbackBannerProps) {
  const configuration =
    getFeedbackConfiguration(
      feedback.type
    );

  const Icon =
    configuration.icon;

  const title =
    feedback.title ||
    configuration.defaultTitle;

  return (
    <section
      role={
        feedback.type ===
        "error"
          ? "alert"
          : "status"
      }
      aria-live={
        feedback.type ===
        "error"
          ? "assertive"
          : "polite"
      }
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-sm",
        configuration.containerClassName,
      ].join(" ")}
    >
      <div
        className={[
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          configuration.iconContainerClassName,
        ].join(" ")}
      >
        <Icon
          size={17}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h2
          className={[
            "text-sm font-semibold",
            configuration.titleClassName,
          ].join(" ")}
        >
          {title}
        </h2>

        <p
          className={[
            "mt-0.5 text-sm leading-6",
            configuration.messageClassName,
          ].join(" ")}
        >
          {feedback.message}
        </p>
      </div>

      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss message"
          onClick={
            onDismiss
          }
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            configuration.dismissClassName,
          ].join(" ")}
        >
          <X
            size={16}
            aria-hidden="true"
          />
        </button>
      )}
    </section>
  );
}

function getFeedbackConfiguration(
  type:
    CrudPageFeedbackType
) {
  switch (type) {
    case "success":
      return {
        icon:
          CheckCircle2,

        defaultTitle:
          "Success",

        containerClassName:
          "border-emerald-200 bg-emerald-50",

        iconContainerClassName:
          "bg-emerald-100 text-emerald-700",

        titleClassName:
          "text-emerald-900",

        messageClassName:
          "text-emerald-800",

        dismissClassName:
          "text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-700",
      };

    case "warning":
      return {
        icon:
          AlertCircle,

        defaultTitle:
          "Attention required",

        containerClassName:
          "border-amber-200 bg-amber-50",

        iconContainerClassName:
          "bg-amber-100 text-amber-700",

        titleClassName:
          "text-amber-900",

        messageClassName:
          "text-amber-800",

        dismissClassName:
          "text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-700",
      };

    case "info":
      return {
        icon:
          Info,

        defaultTitle:
          "Information",

        containerClassName:
          "border-blue-200 bg-blue-50",

        iconContainerClassName:
          "bg-blue-100 text-blue-700",

        titleClassName:
          "text-blue-900",

        messageClassName:
          "text-blue-800",

        dismissClassName:
          "text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-700",
      };

    default:
      return {
        icon:
          AlertCircle,

        defaultTitle:
          "Something went wrong",

        containerClassName:
          "border-red-200 bg-red-50",

        iconContainerClassName:
          "bg-red-100 text-red-700",

        titleClassName:
          "text-red-900",

        messageClassName:
          "text-red-800",

        dismissClassName:
          "text-red-700 hover:bg-red-100 focus-visible:ring-red-700",
      };
  }
}

function getGapClassName(
  gap:
    "sm"
    | "md"
    | "lg"
) {
  switch (gap) {
    case "sm":
      return "gap-3";

    case "lg":
      return "gap-6";

    default:
      return "gap-4";
  }
}