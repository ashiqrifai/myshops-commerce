"use client";

import Link from "next/link";

import {
  CirclePlus,
  Pencil,
  Shapes,
  Trash2,
} from "lucide-react";

import type {
  Attribute,
} from "@/types/attribute";

interface AttributeListProps {
  attributes: Attribute[];
  isChangingStatus: boolean;
  isDeleting: boolean;
  onStatusChange: (attribute: Attribute) => void;
  onDelete: (attribute: Attribute) => void;
}

export default function AttributeList({
  attributes,
  isChangingStatus,
  isDeleting,
  onStatusChange,
  onDelete,
}: AttributeListProps) {
  if (attributes.length === 0) {
    return <EmptyAttributeState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
          <tr>
            <th className="px-5 py-3 font-semibold">
              Attribute
            </th>
            <th className="px-5 py-3 font-semibold">
              Input type
            </th>
            <th className="px-5 py-3 font-semibold">
              Data type
            </th>
            <th className="px-5 py-3 font-semibold">
              Variant
            </th>
            <th className="px-5 py-3 font-semibold">
              Filterable
            </th>
            <th className="px-5 py-3 font-semibold">
              Required
            </th>
            <th className="px-5 py-3 font-semibold">
              Options
            </th>
            <th className="px-5 py-3 font-semibold">
              Categories
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
          {attributes.map((attribute) => (
            <tr
              key={attribute.id}
              className="border-t border-[#e1e3e5] hover:bg-[#fafbfb]"
            >
              <td className="px-5 py-4">
                <Link
                  href={`/admin/attributes/${attribute.id}`}
                  className="font-semibold text-[#202223] hover:text-[#005bd3]"
                >
                  {attribute.name}
                </Link>

                <p className="mt-1 font-mono text-xs text-[#8c9196]">
                  {attribute.code}
                </p>
              </td>

              <td className="px-5 py-4">
                <TypeBadge value={attribute.inputType} />
              </td>

              <td className="px-5 py-4 text-[#5c5f62]">
                {formatEnum(attribute.dataType)}
              </td>

              <td className="px-5 py-4">
                <BooleanBadge
                  value={attribute.isVariantDefining}
                  positiveLabel="Variant"
                />
              </td>

              <td className="px-5 py-4">
                <BooleanBadge
                  value={attribute.isFilterable}
                  positiveLabel="Filter"
                />
              </td>

              <td className="px-5 py-4">
                <BooleanBadge
                  value={attribute.isRequired}
                  positiveLabel="Required"
                />
              </td>

              <td className="px-5 py-4 text-[#5c5f62]">
                {attribute.options?.length || 0}
              </td>

              <td className="px-5 py-4 text-[#5c5f62]">
                {attribute.categoryAssignments?.length || 0}
              </td>

              <td className="px-5 py-4">
                <StatusBadge isActive={attribute.isActive} />
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onStatusChange(attribute)
                    }
                    disabled={isChangingStatus}
                    className="rounded-lg border border-[#babfc3] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
                  >
                    {attribute.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <Link
                    href={`/admin/attributes/${attribute.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#5c5f62] hover:bg-[#f6f6f7]"
                    aria-label="Edit attribute"
                  >
                    <Pencil size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => onDelete(attribute)}
                    disabled={isDeleting}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f0b9ad] bg-white text-[#a23b2a] hover:bg-[#fbeae5] disabled:opacity-50"
                    aria-label="Delete attribute"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TypeBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium text-[#5c5f62]">
      {formatEnum(value)}
    </span>
  );
}

function BooleanBadge({
  value,
  positiveLabel,
}: {
  value: boolean;
  positiveLabel: string;
}) {
  return value ? (
    <span className="inline-flex rounded-full bg-[#e3f1df] px-2.5 py-1 text-xs font-medium text-[#1f6f1f]">
      {positiveLabel}
    </span>
  ) : (
    <span className="text-xs text-[#8c9196]">No</span>
  );
}

function StatusBadge({
  isActive,
}: {
  isActive: boolean;
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
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function EmptyAttributeState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f3]">
          <Shapes
            size={22}
            className="text-[#6d7175]"
          />
        </div>

        <h2 className="mt-4 text-base font-semibold">
          No attributes found
        </h2>

        <p className="mt-2 text-sm text-[#6d7175]">
          Create the attributes used for product
          specifications, filters and variants.
        </p>

        <Link
          href="/admin/attributes/new"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
        >
          <CirclePlus size={16} />
          Add attribute
        </Link>
      </div>
    </div>
  );
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}
