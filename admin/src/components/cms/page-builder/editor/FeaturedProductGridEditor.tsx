"use client";

import ProductPicker from "@/components/cms/pickers/ProductPicker";

interface FeaturedProductGridContent {
  title?: string;
  subtitle?: string;
  productIds?: string[];
  categoryId?: string | null;
  brandId?: string | null;
}

interface FeaturedProductGridEditorProps {
  value: Record<string, unknown>;
  onChange: (
    value: Record<string, unknown>
  ) => void;
}

export default function FeaturedProductGridEditor({
  value,
  onChange,
}: FeaturedProductGridEditorProps) {
  const content =
    value as FeaturedProductGridContent;

  const productIds =
    Array.isArray(content.productIds)
      ? content.productIds
      : [];

  const updateContent = (
    changes:
      Partial<FeaturedProductGridContent>
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#202223]">
            Title
          </label>

          <input
            type="text"
            value={content.title || ""}
            onChange={(event) =>
              updateContent({
                title:
                  event.target.value,
              })
            }
            className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
            placeholder="Featured Products"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#202223]">
            Subtitle
          </label>

          <input
            type="text"
            value={content.subtitle || ""}
            onChange={(event) =>
              updateContent({
                subtitle:
                  event.target.value,
              })
            }
            className="h-11 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#202223] outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
            placeholder="Optional supporting text"
          />
        </div>
      </div>

      <ProductPicker
        selectedIds={productIds}
        onChange={(nextIds) =>
          updateContent({
            productIds: nextIds,
          })
        }
      />
    </div>
  );
}
