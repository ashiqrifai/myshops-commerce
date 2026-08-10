"use client";

import { Copy, Trash2 } from "lucide-react";
import type { ProductStatus, ProductVariant } from "@/types/product";

export default function VariantTable({
  variants,
  onChange,
}: {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}) {
  const update = (index: number, patch: Partial<ProductVariant>) => {
    onChange(variants.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    if (next.length && !next.some((item) => item.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
  };

  const duplicate = (index: number) => {
    const source = variants[index];
    onChange([
      ...variants,
      {
        ...source,
        id: undefined,
        sku: `${source.sku}-COPY`,
        barcode: null,
        name: `${source.name} Copy`,
        isDefault: false,
        variantKey: `${source.variantKey || "MANUAL"}-COPY-${Date.now()}`,
        sortOrder: variants.length,
      },
    ]);
  };

  if (!variants.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] p-6 text-center text-sm text-[#6d7175]">
        No variants have been created yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e1e3e5]">
      <table className="min-w-[950px] w-full text-left text-sm">
        <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
          <tr>
            <th className="px-3 py-3">Default</th>
            <th className="px-3 py-3">Variant</th>
            <th className="px-3 py-3">SKU</th>
            <th className="px-3 py-3">Barcode</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant, index) => (
            <tr key={variant.id || variant.variantKey || index} className="border-t border-[#e1e3e5]">
              <td className="px-3 py-3">
                <input
                  type="radio"
                  name="defaultVariant"
                  checked={variant.isDefault}
                  onChange={() =>
                    onChange(variants.map((item, i) => ({ ...item, isDefault: i === index })))
                  }
                />
              </td>

              <td className="px-3 py-3">
                <input
                  value={variant.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  className="admin-input min-w-[220px]"
                />
                {variant.attributeValues.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {variant.attributeValues.map((value) => (
                      <span
                        key={`${value.attributeId}-${value.optionId}`}
                        className="rounded-full bg-[#f1f2f3] px-2 py-1 text-xs text-[#5c5f62]"
                      >
                        {value.displayValue}
                      </span>
                    ))}
                  </div>
                )}
              </td>

              <td className="px-3 py-3">
                <input
                  value={variant.sku}
                  onChange={(event) => update(index, { sku: event.target.value })}
                  className="admin-input min-w-[180px] font-mono"
                />
              </td>

              <td className="px-3 py-3">
                <input
                  value={variant.barcode || ""}
                  onChange={(event) => update(index, { barcode: event.target.value })}
                  className="admin-input min-w-[160px] font-mono"
                />
              </td>

              <td className="px-3 py-3">
                <select
                  value={variant.status}
                  onChange={(event) => update(index, { status: event.target.value as ProductStatus })}
                  className="admin-input min-w-[130px]"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </td>

              <td className="px-3 py-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => duplicate(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5]"
                    title="Remove"
                  >
                    <Trash2 size={16} />
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
