"use client";

import type { ReactNode } from "react";

import {
  Download,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface PageToolbarAction {
  key: string;
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
}

interface PageToolbarProps {
  title?: string;
  subtitle?: string;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchDisabled?: boolean;

  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshDisabled?: boolean;

  onImport?: () => void;
  importLabel?: string;
  importDisabled?: boolean;
  isImporting?: boolean;

  onExport?: () => void;
  exportLabel?: string;
  exportDisabled?: boolean;
  isExporting?: boolean;

  primaryAction?: PageToolbarAction;
  secondaryActions?: PageToolbarAction[];

  leftContent?: ReactNode;
  rightContent?: ReactNode;
  belowContent?: ReactNode;

  className?: string;
  compact?: boolean;
}

export default function PageToolbar({
  title,
  subtitle,

  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search...",
  searchAriaLabel = "Search records",
  searchDisabled = false,

  onRefresh,
  isRefreshing = false,
  refreshDisabled = false,

  onImport,
  importLabel = "Import",
  importDisabled = false,
  isImporting = false,

  onExport,
  exportLabel = "Export",
  exportDisabled = false,
  isExporting = false,

  primaryAction,
  secondaryActions = [],

  leftContent,
  rightContent,
  belowContent,

  className = "",
  compact = false,
}: PageToolbarProps) {
  const visibleSecondaryActions = secondaryActions.filter(
    (action) => !action.hidden
  );

  const hasSearch =
    searchValue !== undefined && Boolean(onSearchChange);

  const hasStandardActions =
    Boolean(onRefresh) ||
    Boolean(onImport) ||
    Boolean(onExport) ||
    visibleSecondaryActions.length > 0 ||
    Boolean(primaryAction && !primaryAction.hidden) ||
    Boolean(rightContent);

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    onSearchSubmit?.();
  };

  const clearSearch = () => {
    if (searchDisabled) {
      return;
    }

    onSearchChange?.("");
  };

  return (
    <section
      aria-label={title ? `${title} toolbar` : "Page toolbar"}
      className={[
        "rounded-xl border border-[#e1e3e5] bg-white shadow-sm",
        compact ? "p-3" : "p-4",
        className,
      ].join(" ")}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h1 className="text-xl font-bold tracking-tight text-[#202223] sm:text-2xl">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {hasSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full sm:max-w-md"
            >
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
              />

              <input
                type="search"
                value={searchValue}
                disabled={searchDisabled}
                aria-label={searchAriaLabel}
                placeholder={searchPlaceholder}
                onChange={(event) =>
                  onSearchChange?.(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-[#babfc3] bg-white py-2 pl-10 pr-10 text-sm text-[#202223] outline-none transition placeholder:text-[#8c9196] hover:border-[#8c9196] focus:border-[#303030] focus:ring-1 focus:ring-[#303030] disabled:cursor-not-allowed disabled:bg-[#f6f6f7] disabled:opacity-60"
              />

              {Boolean(searchValue) && (
                <button
                  type="button"
                  aria-label="Clear search"
                  disabled={searchDisabled}
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#8c9196] transition hover:bg-[#f1f2f3] hover:text-[#303030] disabled:cursor-not-allowed"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </form>
          )}

          {leftContent && (
            <div className="flex flex-wrap items-center gap-2">
              {leftContent}
            </div>
          )}
        </div>

        {hasStandardActions && (
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {rightContent}

            {onRefresh && (
              <ToolbarButton
                label="Refresh"
                icon={RefreshCw}
                onClick={onRefresh}
                disabled={refreshDisabled || isRefreshing}
                loading={isRefreshing}
                iconOnly
              />
            )}

            {onImport && (
              <ToolbarButton
                label={importLabel}
                loadingLabel="Importing..."
                icon={Upload}
                onClick={onImport}
                disabled={importDisabled || isImporting}
                loading={isImporting}
                variant="secondary"
              />
            )}

            {onExport && (
              <ToolbarButton
                label={exportLabel}
                loadingLabel="Exporting..."
                icon={Download}
                onClick={onExport}
                disabled={exportDisabled || isExporting}
                loading={isExporting}
                variant="secondary"
              />
            )}

            {visibleSecondaryActions.map((action) => (
              <ToolbarButton
                key={action.key}
                label={action.label}
                loadingLabel={action.loadingLabel}
                icon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                loading={action.loading}
                variant={action.variant || "secondary"}
              />
            ))}

            {primaryAction && !primaryAction.hidden && (
              <ToolbarButton
                label={primaryAction.label}
                loadingLabel={primaryAction.loadingLabel}
                icon={primaryAction.icon || Plus}
                onClick={primaryAction.onClick}
                disabled={
                  primaryAction.disabled || primaryAction.loading
                }
                loading={primaryAction.loading}
                variant={primaryAction.variant || "primary"}
              />
            )}
          </div>
        )}
      </div>

      {belowContent && (
        <div className="mt-4 border-t border-[#e1e3e5] pt-4">
          {belowContent}
        </div>
      )}
    </section>
  );
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  iconOnly?: boolean;
}

function ToolbarButton({
  label,
  onClick,
  icon: Icon,
  disabled = false,
  loading = false,
  loadingLabel,
  variant = "secondary",
  iconOnly = false,
}: ToolbarButtonProps) {
  const buttonClassName = getButtonClassName(variant);

  return (
    <button
      type="button"
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#303030] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        iconOnly ? "w-10 px-0" : "gap-2 px-3.5",
        buttonClassName,
      ].join(" ")}
    >
      {loading ? (
        <LoaderCircle
          size={17}
          aria-hidden="true"
          className="animate-spin"
        />
      ) : (
        Icon && <Icon size={17} aria-hidden="true" />
      )}

      {!iconOnly && (
        <span>
          {loading && loadingLabel ? loadingLabel : label}
        </span>
      )}
    </button>
  );
}

function getButtonClassName(
  variant: "primary" | "secondary" | "danger"
) {
  switch (variant) {
    case "primary":
      return "border border-[#303030] bg-[#303030] text-white hover:border-[#1a1a1a] hover:bg-[#1a1a1a]";

    case "danger":
      return "border border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700";

    default:
      return "border border-[#babfc3] bg-white text-[#303030] hover:border-[#8c9196] hover:bg-[#f6f6f7]";
  }
}