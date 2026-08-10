"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Plus, RefreshCcw } from "lucide-react";
import { useGetAttributesQuery } from "@/store/api/attributeApi";
import { useGenerateProductVariantsMutation } from "@/store/api/productApi";
import type { Attribute } from "@/types/attribute";

export default function VariantBuilder({
  productId,
  categoryIds,
  parentSku,
  onGenerated,
}: {
  productId?: string;
  categoryIds: string[];
  parentSku: string | null;
  onGenerated?: () => void;
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [skuPrefix, setSkuPrefix] = useState(parentSku || "");

  const { data, isLoading } = useGetAttributesQuery({
    page: 1,
    pageSize: 200,
    isActive: true,
    isVariantDefining: true,
    sortBy: "displayOrder",
    sortDirection: "ASC",
  });

  const [generateVariants, { isLoading: generating }] =
    useGenerateProductVariantsMutation();

  const attributes = useMemo(
    () =>
      (data?.data || []).filter(
        (attribute) =>
          attribute.isVariantDefining &&
          (attribute.categoryAssignments || []).some(
            (assignment) =>
              assignment.isActive &&
              assignment.isVariantDefining &&
              categoryIds.includes(assignment.categoryId)
          )
      ),
    [data, categoryIds]
  );

  const combinationCount = useMemo(() => {
    const groups = Object.values(selections).filter((ids) => ids.length);
    return groups.length ? groups.reduce((total, ids) => total * ids.length, 1) : 0;
  }, [selections]);

  const generate = async () => {
    if (!productId) {
      window.alert("Save the product first, then generate variants.");
      return;
    }

    const attributeSelections = Object.entries(selections)
      .filter(([, optionIds]) => optionIds.length)
      .map(([attributeId, optionIds]) => ({ attributeId, optionIds }));

    if (!attributeSelections.length) {
      window.alert("Select at least one variant option.");
      return;
    }

    try {
      await generateVariants({
        id: productId,
        attributeSelections,
        replaceExisting,
        skuPrefix: skuPrefix || null,
      }).unwrap();
      onGenerated?.();
    } catch (error: any) {
      window.alert(error?.data?.message || "Unable to generate variants.");
    }
  };

  if (!categoryIds.length) {
    return <Empty text="Select a category to load variant attributes." />;
  }

  if (isLoading) {
    return <p className="text-sm text-[#6d7175]">Loading variant attributes...</p>;
  }

  if (!attributes.length) {
    return <Empty text="No variant-defining attributes are assigned to the selected categories." />;
  }

  return (
    <div className="space-y-5">
      {!productId && (
        <div className="rounded-xl border border-[#f1c87a] bg-[#fff7e3] p-4 text-sm text-[#72510d]">
          Save this variable product first. The variant generator becomes available on the edit page.
        </div>
      )}

      {attributes.map((attribute) => (
        <AttributeSelector
          key={attribute.id}
          attribute={attribute}
          selected={selections[attribute.id] || []}
          onChange={(optionIds) =>
            setSelections((current) => ({ ...current, [attribute.id]: optionIds }))
          }
        />
      ))}

      <div className="grid gap-4 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <label className="mb-1.5 block text-sm font-medium">SKU prefix</label>
          <input
            value={skuPrefix}
            onChange={(event) => setSkuPrefix(event.target.value)}
            className="admin-input"
            placeholder="IPH16"
          />
        </div>

        <div className="rounded-lg bg-white p-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6d7175]">Variants</p>
          <p className="mt-1 text-2xl font-semibold">{combinationCount}</p>
        </div>

        <label className="flex items-start gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(event) => setReplaceExisting(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">Replace existing generated variants</span>
            <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
              Variants outside the new combinations will be removed.
            </span>
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={generating || !productId || combinationCount === 0}
        onClick={generate}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {generating ? <LoaderCircle size={17} className="animate-spin" /> : replaceExisting ? <RefreshCcw size={17} /> : <Plus size={17} />}
        {generating ? "Generating..." : "Generate variants"}
      </button>
    </div>
  );
}

function AttributeSelector({
  attribute,
  selected,
  onChange,
}: {
  attribute: Attribute;
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold">{attribute.name}</label>
        <span className="text-xs text-[#6d7175]">{selected.length} selected</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(attribute.options || [])
          .filter((option) => option.isActive)
          .map((option) => {
            const checked = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onChange(
                    checked
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id]
                  )
                }
                className={[
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                  checked
                    ? "border-[#303030] bg-[#303030] text-white"
                    : "border-[#babfc3] bg-white hover:bg-[#f6f6f7]",
                ].join(" ")}
              >
                {option.swatchValue && (
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: option.swatchValue }}
                  />
                )}
                {option.label}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] p-6 text-center text-sm text-[#6d7175]">
      {text}
    </div>
  );
}
