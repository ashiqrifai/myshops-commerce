"use client";

import Link from "next/link";

import {
  Badge,
  CirclePlus,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  Brand,
} from "@/types/brand";

interface BrandListProps {
  brands:
    Brand[];

  isChangingStatus:
    boolean;

  isDeleting:
    boolean;

  onStatusChange:
    (
      brand:
        Brand
    ) => void;

  onDelete:
    (
      brand:
        Brand
    ) => void;
}

export default function BrandList({
  brands,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: BrandListProps) {
  if (
    brands.length ===
    0
  ) {
    return (
      <EmptyBrandState />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left text-sm">
        <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
          <tr>
            <th className="px-5 py-3 font-semibold">
              Brand
            </th>

            <th className="px-5 py-3 font-semibold">
              Code
            </th>

            <th className="px-5 py-3 font-semibold">
              Country
            </th>

            <th className="px-5 py-3 font-semibold">
              Sort
            </th>

            <th className="px-5 py-3 font-semibold">
              Featured
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
          {brands.map(
            (brand) => (
              <tr
                key={
                  brand.id
                }
                className="border-t border-[#e1e3e5] hover:bg-[#fafbfb]"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/brands/${brand.id}`}
                    className="font-semibold text-[#202223] hover:text-[#005bd3]"
                  >
                    {
                      brand.name
                    }
                  </Link>

                  <p className="mt-1 font-mono text-xs text-[#8c9196]">
                    /{
                      brand.slug
                    }
                  </p>
                </td>

                <td className="px-5 py-4 font-mono text-xs text-[#5c5f62]">
                  {
                    brand.code
                  }
                </td>

                <td className="px-5 py-4 text-[#5c5f62]">
                  {brand.countryOfOrigin ||
                    "—"}
                </td>

                <td className="px-5 py-4 text-[#5c5f62]">
                  {
                    brand.sortOrder
                  }
                </td>

                <td className="px-5 py-4">
                  {brand.isFeatured ? (
                    <span className="rounded-full bg-[#fff5d8] px-2.5 py-1 text-xs font-medium text-[#8a6116]">
                      Featured
                    </span>
                  ) : (
                    <span className="text-xs text-[#8c9196]">
                      No
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge
                    isActive={
                      brand.isActive
                    }
                  />
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onStatusChange(
                          brand
                        )
                      }
                      disabled={
                        isChangingStatus
                      }
                      className="rounded-lg border border-[#babfc3] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
                    >
                      {brand.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <Link
                      href={`/admin/brands/${brand.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#5c5f62] hover:bg-[#f6f6f7]"
                      aria-label="Edit brand"
                    >
                      <Pencil
                        size={14}
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          brand
                        )
                      }
                      disabled={
                        isDeleting
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f0b9ad] bg-white text-[#a23b2a] hover:bg-[#fbeae5] disabled:opacity-50"
                      aria-label="Delete brand"
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
      ].join(
        " "
      )}
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function EmptyBrandState() {
  return (
    <div className="flex min-h-[340px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f3]">
          <Badge
            size={22}
            className="text-[#6d7175]"
          />
        </div>

        <h2 className="mt-4 text-base font-semibold">
          No brands found
        </h2>

        <p className="mt-2 text-sm text-[#6d7175]">
          Create your first brand or
          adjust the current filters.
        </p>

        <Link
          href="/admin/brands/new"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
        >
          <CirclePlus
            size={16}
          />

          Add brand
        </Link>
      </div>
    </div>
  );
}
