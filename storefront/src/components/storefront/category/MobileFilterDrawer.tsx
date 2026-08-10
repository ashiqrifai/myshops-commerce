"use client";

import {
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  PublicCategoryFilter,
} from "@/types/publicCategory";

import CategoryFilters from "./CategoryFilters";

export default function MobileFilterDrawer({
  filters,
}: {
  filters: PublicCategoryFilter[];
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  useEffect(() => {
    document.body.style.overflow =
      open ? "hidden" : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-storefront-button border border-storefront bg-white text-sm font-bold text-storefront-text lg:hidden"
      >
        <SlidersHorizontal
          size={17}
        />
        Filters
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setOpen(false)
            }
            className="absolute inset-0 bg-black/45"
          />

          <aside className="absolute inset-y-0 right-0 w-[min(92vw,420px)] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-lg font-black text-storefront-text">
                Refine products
              </p>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-storefront"
              >
                <X size={18} />
              </button>
            </div>

            <CategoryFilters
              filters={filters}
              onApplied={() =>
                setOpen(false)
              }
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
