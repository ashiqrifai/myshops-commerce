"use client";

import Link from "next/link";

import {
  CirclePlus,
  FolderTree,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  Category,
} from "@/types/category";

interface CategoryListProps {
  categories:
    Category[];

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

export default function CategoryList({
  categories,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: CategoryListProps) {
  if (
    categories.length ===
    0
  ) {
    return (
      <EmptyCategoryState />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left text-sm">
        <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
          <tr>
            <th className="px-5 py-3 font-semibold">
              Category
            </th>

            <th className="px-5 py-3 font-semibold">
              Parent
            </th>

            <th className="px-5 py-3 font-semibold">
              Level
            </th>

            <th className="px-5 py-3 font-semibold">
              Sort
            </th>

            <th className="px-5 py-3 font-semibold">
              Visibility
            </th>

            <th className="px-5 py-3 font-semibold">
              Status
            </th>

            <th className="px-5 py-3 text-right font-semibold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {categories.map(
            (category) => (
              <tr
                key={
                  category.id
                }
                className="border-t border-[#e1e3e5] hover:bg-[#fafbfb]"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="font-semibold text-[#202223] hover:text-[#005bd3]"
                  >
                    {
                      category.name
                    }
                  </Link>

                  <p className="mt-1 max-w-md truncate text-xs text-[#6d7175]">
                    {category.categoryPath ||
                      category.name}
                  </p>

                  <p className="mt-1 font-mono text-xs text-[#8c9196]">
                    /{
                      category.slug
                    }
                  </p>
                </td>

                <td className="px-5 py-4 text-[#5c5f62]">
                  {category.parent
                    ?.name ||
                    "Root"}
                </td>

                <td className="px-5 py-4 text-[#5c5f62]">
                  {
                    category.level
                  }
                </td>

                <td className="px-5 py-4 text-[#5c5f62]">
                  {
                    category.sortOrder
                  }
                </td>

                <td className="px-5 py-4">
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

                    {category.isFeatured && (
                      <VisibilityBadge>
                        Featured
                      </VisibilityBadge>
                    )}

                    {!category.showInMenu &&
                      !category.showOnHome &&
                      !category.isFeatured && (
                        <span className="text-xs text-[#8c9196]">
                          Hidden
                        </span>
                      )}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge
                    isActive={
                      category.isActive
                    }
                  />
                </td>

                <td className="px-5 py-4">
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
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
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
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
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

function EmptyCategoryState() {
  return (
    <div className="flex min-h-[340px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f3]">
          <FolderTree
            size={22}
            className="text-[#6d7175]"
          />
        </div>

        <h2 className="mt-4 text-base font-semibold">
          No categories found
        </h2>

        <p className="mt-2 text-sm text-[#6d7175]">
          No categories match the
          selected filters.
        </p>

        <Link
          href="/admin/categories/new"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
        >
          <CirclePlus
            size={16}
          />

          Add category
        </Link>
      </div>
    </div>
  );
}