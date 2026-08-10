"use client";

import {
  Plus,
  TreePine,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

interface NavigationTreePanelProps {
  children: ReactNode;

  itemCount: number;

  isEmpty: boolean;

  footer?: ReactNode;

  onAddRoot: () => void;
}

export default function NavigationTreePanel({
  children,
  itemCount,
  isEmpty,
  footer,
  onAddRoot,
}: NavigationTreePanelProps) {
  return (
    <div className="flex h-full min-h-[720px] flex-col bg-white">
      <header className="border-b border-[#e1e3e5] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TreePine
                size={17}
                className="text-[#5c5f62]"
              />

              <h2 className="text-sm font-semibold text-[#202223]">
                Navigation tree
              </h2>
            </div>

            <p className="mt-1 text-xs leading-5 text-[#6d7175]">
              Select an item to design it. Drag items to reorganize the
              hierarchy.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium text-[#5c5f62]">
            {itemCount}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddRoot}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
        >
          <Plus
            size={16}
          />

          Add top-level item
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex min-h-[480px] items-center justify-center p-6">
            <div className="max-w-[240px] text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3]">
                <TreePine
                  size={25}
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                Navigation is empty
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Add a top-level link, dropdown or mega-menu to begin.
              </p>

              <button
                type="button"
                onClick={onAddRoot}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium"
              >
                <Plus
                  size={15}
                />

                Add item
              </button>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {footer}
    </div>
  );
}