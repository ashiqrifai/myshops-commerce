"use client";

import {
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import type {
  CmsPageSection,
} from "@/types/cms";

interface SortableSectionCardProps {
  section: CmsPageSection;
  actionLoading: boolean;
  onToggleEnabled: (
    section: CmsPageSection
  ) => Promise<void>;
  onDuplicate: (
    section: CmsPageSection
  ) => Promise<void>;
  onDelete: (
    section: CmsPageSection
  ) => void;
  onEdit: (
    section: CmsPageSection
  ) => void;
}

const getObjectCount = (
  value: unknown
): number => {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.keys(value).length;
  }

  return 0;
};

const formatDate = (
  value?: string | null
): string => {
  if (!value) {
    return "No schedule";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No schedule";
  }

  return new Intl.DateTimeFormat(
    "en-AE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
};

export default function SortableSectionCard({
  section,
  actionLoading,
  onToggleEnabled,
  onDuplicate,
  onDelete,
  onEdit,
}: SortableSectionCardProps) {
  const [expanded, setExpanded] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
  });

  const style: React.CSSProperties = {
    transform:
      CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const settingsCount =
    getObjectCount(section.settings);

  const contentCount =
    getObjectCount(section.content);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "admin-card relative overflow-visible",
        !section.isEnabled
          ? "opacity-70"
          : "",
        isDragging
          ? "shadow-xl"
          : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-[#8c9196] hover:bg-[#f1f2f3] active:cursor-grabbing"
          aria-label={`Reorder ${section.name}`}
        >
          <GripVertical size={19} />
        </button>

        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) => !current
            )
          }
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
          aria-label={
            expanded
              ? "Collapse section"
              : "Expand section"
          }
        >
          {expanded ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f2f3] text-xs font-bold">
            {section.displayOrder}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold">
                {section.name}
              </h2>

              <span className="rounded-full bg-[#f1f2f3] px-2 py-0.5 text-[10px] font-medium text-[#6d7175]">
                {section.sectionType.category}
              </span>

              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  section.isEnabled
                    ? "bg-[#e3f1df] text-[#276749]"
                    : "bg-[#fbeae5] text-[#a23b2a]",
                ].join(" ")}
              >
                {section.isEnabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>

            <p className="mt-1 truncate font-mono text-[11px] text-[#8c9196]">
              {section.sectionType.code}
              {" · "}
              {section.code}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(section)}
          className="hidden h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] sm:flex"
        >
          <Pencil size={15} />
          Edit
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current
              )
            }
            disabled={actionLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
            aria-label={`Actions for ${section.name}`}
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-40 w-52 rounded-xl border border-[#e1e3e5] bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(section);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]"
              >
                <Pencil size={15} />
                Edit section
              </button>

              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await onDuplicate(section);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]"
              >
                <Copy size={15} />
                Duplicate
              </button>

              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await onToggleEnabled(
                    section
                  );
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]"
              >
                {section.isEnabled ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}

                {section.isEnabled
                  ? "Disable"
                  : "Enable"}
              </button>

              <div className="my-1 border-t border-[#e1e3e5]" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(section);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 size={15} />
                Remove section
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#e1e3e5] bg-[#fafafa] px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8c9196]">
                Settings
              </p>

              <p className="mt-1 text-sm font-medium">
                {settingsCount} configured
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8c9196]">
                Content
              </p>

              <p className="mt-1 text-sm font-medium">
                {contentCount} fields
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8c9196]">
                Visibility
              </p>

              <p className="mt-1 text-sm font-medium">
                {[
                  section.visibility.desktop &&
                    "Desktop",
                  section.visibility.tablet &&
                    "Tablet",
                  section.visibility.mobile &&
                    "Mobile",
                  section.visibility.kiosk &&
                    "Kiosk",
                ]
                  .filter(Boolean)
                  .join(", ") || "Hidden"}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#8c9196]">
                <Clock3 size={11} />
                Schedule
              </p>

              <p className="mt-1 text-sm font-medium">
                {section.publishStartAt
                  ? formatDate(
                      section.publishStartAt
                    )
                  : "Always available"}
              </p>
            </div>
          </div>

          {section.sectionType.description && (
            <p className="mt-5 border-t border-[#e1e3e5] pt-4 text-sm leading-6 text-[#6d7175]">
              {
                section.sectionType
                  .description
              }
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => onEdit(section)}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
            >
              <Pencil size={15} />
              Edit settings and content
            </button>
          </div>
        </div>
      )}
    </article>
  );
}