"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  Category,
} from "@/types/category";

interface CategoryTreeItemProps {
  category:
    Category;

  depth:
    number;

  isChangingStatus:
    boolean;

  isDeleting:
    boolean;

  onStatusChange:
    (
      category:
        Category
    ) => void;

  onDelete:
    (
      category:
        Category
    ) => void;
}

export default function CategoryTreeItem({
  category,
  depth,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: CategoryTreeItemProps) {
  const [
    isExpanded,
    setIsExpanded,
  ] = useState(true);

  const children =
    category.children ||
    [];

  const hasChildren =
    children.length > 0;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_130px_110px_160px] items-center gap-3 border-t border-[#e1e3e5] px-4 py-3 first:border-t-0 hover:bg-[#fafbfb]">
        <div
          className="flex min-w-0 items-center"
          style={{
            paddingLeft:
              depth * 24,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setIsExpanded(
                (current) =>
                  !current
              )
            }
            disabled={
              !hasChildren
            }
            className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#6d7175] hover:bg-[#f1f2f3] disabled:cursor-default disabled:opacity-30"
            aria-label={
              isExpanded
                ? "Collapse category"
                : "Expand category"
            }
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown
                  size={16}
                />
              ) : (
                <ChevronRight
                  size={16}
                />
              )
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-[#babfc3]" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/categories/${category.id}`}
                className="truncate text-sm font-semibold text-[#202223] hover:text-[#005bd3]"
              >
                {category.name}
              </Link>

              {category.isFeatured && (
                <span className="rounded-full bg-[#fff5d8] px-2 py-0.5 text-[11px] font-medium text-[#8a6116]">
                  Featured
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-xs text-[#6d7175]">
              {category.categoryPath ||
                category.slug}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {category.showInMenu && (
            <VisibilityBadge>
              Menu
            </VisibilityBadge>
          )}

          {category.showOnHome && (
            <VisibilityBadge>
              Home
            </VisibilityBadge>
          )}

          {!category.showInMenu &&
            !category.showOnHome && (
              <span className="text-xs text-[#8c9196]">
                Hidden
              </span>
            )}
        </div>

        <StatusBadge
          isActive={
            category.isActive
          }
        />

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                category
              )
            }
            disabled={
              isChangingStatus
            }
            className="rounded-lg border border-[#babfc3] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            {category.isActive
              ? "Deactivate"
              : "Activate"}
          </button>

          <Link
            href={`/admin/categories/${category.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#5c5f62] hover:bg-[#f6f6f7]"
            aria-label="Edit category"
          >
            <Pencil
              size={14}
            />
          </Link>

          <button
            type="button"
            onClick={() =>
              onDelete(
                category
              )
            }
            disabled={
              isDeleting
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f0b9ad] bg-white text-[#a23b2a] hover:bg-[#fbeae5] disabled:opacity-50"
            aria-label="Delete category"
          >
            <Trash2
              size={14}
            />
          </button>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        children.map(
          (child) => (
            <CategoryTreeItem
              key={
                child.id
              }
              category={
                child
              }
              depth={
                depth + 1
              }
              isChangingStatus={
                isChangingStatus
              }
              isDeleting={
                isDeleting
              }
              onStatusChange={
                onStatusChange
              }
              onDelete={
                onDelete
              }
            />
          )
        )}
    </>
  );
}

function StatusBadge({
  isActive,
}: {
  isActive:
    boolean;
}) {
  return (
    <span
      className={[
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-[#e3f1df] text-[#1f6f1f]"
          : "bg-[#fbeae5] text-[#a23b2a]",
      ].join(" ")}
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function VisibilityBadge({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[11px] font-medium text-[#005bd3]">
      {children}
    </span>
  );
}