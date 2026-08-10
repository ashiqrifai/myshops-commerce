"use client";

import {
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

import type {
  NavigationItem,
} from "./NavigationDrawer.types";

import {
  getItemChildren,
  getItemLabel,
  getItemUrl,
} from "./navigationDrawer.utils";

interface DrawerMenuItemProps {
  item: NavigationItem;
  open: boolean;
  onOpenChildren: (
    item: NavigationItem
  ) => void;
  onNavigate: () => void;
}

export default function DrawerMenuItem({
  item,
  open,
  onOpenChildren,
  onNavigate,
}: DrawerMenuItemProps) {
  const label =
    getItemLabel(item);

  const hasChildren =
    getItemChildren(item).length > 0;

  if (hasChildren) {
    return (
      <button
        type="button"
        onClick={() =>
          onOpenChildren(item)
        }
        tabIndex={open ? 0 : -1}
        className="group flex min-h-11 w-full items-center justify-between gap-4 px-6 py-2.5 text-left transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-slate-800">
            {label}
          </span>

          {item.description ? (
            <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
              {item.description}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {item.badgeText ? (
            <span className="rounded-full bg-storefront-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-storefront-primary">
              {item.badgeText}
            </span>
          ) : null}

          <ChevronRight
            size={18}
            aria-hidden="true"
            className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
          />
        </span>
      </button>
    );
  }

  return (
    <Link
      href={getItemUrl(item)}
      onClick={onNavigate}
      tabIndex={open ? 0 : -1}
      className="flex min-h-11 items-center justify-between gap-4 px-6 py-2.5 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-slate-800">
          {label}
        </span>

        {item.description ? (
          <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
            {item.description}
          </span>
        ) : null}
      </span>

      {item.badgeText ? (
        <span className="shrink-0 rounded-full bg-storefront-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-storefront-primary">
          {item.badgeText}
        </span>
      ) : null}
    </Link>
  );
}
