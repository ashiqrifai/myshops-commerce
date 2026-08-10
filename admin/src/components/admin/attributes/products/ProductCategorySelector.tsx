"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, FolderTree, Search } from "lucide-react";
import { useGetCategoryTreeQuery } from "@/store/api/categoryApi";
import type { Category } from "@/types/category";

interface Props {
  primaryCategoryId: string | null;
  categoryIds: string[];
  onChange: (value: {
    primaryCategoryId: string | null;
    categoryIds: string[];
  }) => void;
}

export default function ProductCategorySelector({
  primaryCategoryId,
  categoryIds,
  onChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useGetCategoryTreeQuery({ isActive: true });
  const categories = data?.data?.categories || [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? filterTree(categories, term) : categories;
  }, [categories, search]);

  const selected = new Set(categoryIds);

  const toggle = (category: Category) => {
    const next = new Set(selected);
    if (next.has(category.id)) {
      next.delete(category.id);
      onChange({
        primaryCategoryId:
          primaryCategoryId === category.id ? Array.from(next)[0] || null : primaryCategoryId,
        categoryIds: Array.from(next),
      });
    } else {
      next.add(category.id);
      onChange({
        primaryCategoryId: primaryCategoryId || category.id,
        categoryIds: Array.from(next),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-input pl-10"
          placeholder="Search categories..."
        />
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#e1e3e5]">
        {isLoading ? (
          <p className="p-4 text-sm text-[#6d7175]">Loading categories...</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-[#6d7175]">No categories found.</p>
        ) : (
          filtered.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              depth={0}
              expanded={expanded}
              selected={selected}
              primaryCategoryId={primaryCategoryId}
              onToggleExpanded={(id) =>
                setExpanded((current) => {
                  const next = new Set(current);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
              onToggle={toggle}
              onSetPrimary={(id) => {
                const next = new Set(selected);
                next.add(id);
                onChange({ primaryCategoryId: id, categoryIds: Array.from(next) });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  depth,
  expanded,
  selected,
  primaryCategoryId,
  onToggleExpanded,
  onToggle,
  onSetPrimary,
}: {
  category: Category;
  depth: number;
  expanded: Set<string>;
  selected: Set<string>;
  primaryCategoryId: string | null;
  onToggleExpanded: (id: string) => void;
  onToggle: (category: Category) => void;
  onSetPrimary: (id: string) => void;
}) {
  const children = category.children || [];
  const isExpanded = expanded.has(category.id);
  const isSelected = selected.has(category.id);
  const isPrimary = primaryCategoryId === category.id;

  return (
    <>
      <div
        className="flex items-center gap-2 border-b border-[#f1f2f3] px-3 py-2.5"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {children.length ? (
          <button
            type="button"
            onClick={() => onToggleExpanded(category.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#f1f2f3]"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="h-7 w-7" />
        )}

        <button
          type="button"
          onClick={() => onToggle(category)}
          className={[
            "flex h-5 w-5 items-center justify-center rounded border",
            isSelected ? "border-[#303030] bg-[#303030] text-white" : "border-[#babfc3] bg-white",
          ].join(" ")}
        >
          {isSelected && <Check size={14} />}
        </button>

        <FolderTree size={16} className="text-[#6d7175]" />
        <button type="button" onClick={() => onToggle(category)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {category.name}
        </button>

        {isSelected && (
          <button
            type="button"
            onClick={() => onSetPrimary(category.id)}
            className={[
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              isPrimary ? "bg-[#e3f1df] text-[#2f6f24]" : "bg-[#f1f2f3] text-[#6d7175]",
            ].join(" ")}
          >
            {isPrimary ? "Primary" : "Set primary"}
          </button>
        )}
      </div>

      {children.length && isExpanded
        ? children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              primaryCategoryId={primaryCategoryId}
              onToggleExpanded={onToggleExpanded}
              onToggle={onToggle}
              onSetPrimary={onSetPrimary}
            />
          ))
        : null}
    </>
  );
}

function filterTree(categories: Category[], term: string): Category[] {
  return categories.flatMap((category) => {
    const children = filterTree(category.children || [], term);
    if (
      category.name.toLowerCase().includes(term) ||
      category.slug.toLowerCase().includes(term) ||
      children.length
    ) {
      return [{ ...category, children }];
    }
    return [];
  });
}
