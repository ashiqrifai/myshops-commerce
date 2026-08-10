"use client";

import Link from "next/link";

import {
  CirclePlus,
  FolderTree,
} from "lucide-react";

import CategoryTreeItem from "./CategoryTreeItem";

import type {
  Category,
} from "@/types/category";

interface CategoryTreeProps {
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

export default function CategoryTree({
  categories,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: CategoryTreeProps) {
  if (
    categories.length ===
    0
  ) {
    return (
      <EmptyCategoryState />
    );
  }

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-xl border border-[#e1e3e5]">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[minmax(0,1fr)_130px_110px_160px] gap-3 bg-[#f6f6f7] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
            <span>
              Category
            </span>

            <span>
              Visibility
            </span>

            <span>
              Status
            </span>

            <span className="text-right">
              Actions
            </span>
          </div>

          {categories.map(
            (category) => (
              <CategoryTreeItem
                key={
                  category.id
                }
                category={
                  category
                }
                depth={0}
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
        </div>
      </div>
    </div>
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

        <p className="mt-2 text-sm leading-6 text-[#6d7175]">
          Create your first root
          category or adjust the
          current search filters.
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