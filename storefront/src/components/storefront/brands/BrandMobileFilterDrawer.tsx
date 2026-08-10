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
  PublicBrandFilter,
} from "@/types/publicBrand";

import BrandFilters from "./BrandFilters";

export default function BrandMobileFilterDrawer({
  filters,
}: {
  filters:
    PublicBrandFilter[];
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      document.body
        .style
        .overflow =
        open
          ? "hidden"
          : "";

      return () => {
        document.body
          .style
          .overflow =
          "";
      };
    },
    [
      open,
    ]
  );

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(
            true
          )
        }
        className="flex h-11 items-center justify-center gap-2 rounded-storefront-button border border-storefront bg-white px-4 text-sm font-bold text-storefront-text lg:hidden"
      >
        <SlidersHorizontal
          size={
            16
          }
        />

        Filters
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/45"
          />

          <aside className="absolute inset-y-0 right-0 w-[min(92vw,420px)] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-black text-storefront-text">
                  Refine products
                </p>

                <p className="mt-1 text-xs text-storefront-muted">
                  Category and price filters
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-storefront"
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>

            <BrandFilters
              filters={
                filters
              }
              onApplied={() =>
                setOpen(
                  false
                )
              }
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}