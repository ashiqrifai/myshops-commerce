"use client";

import {
  BadgeCheck,
  Sparkles,
} from "lucide-react";

import BrandPicker from "@/components/cms/pickers/BrandPicker";
import CategoryPicker from "@/components/cms/pickers/CategoryPicker";
import ProductPicker from "@/components/cms/pickers/ProductPicker";

interface ProductCarouselContent {
  title?: string;
  subtitle?: string;
  productIds?: string[];

  categoryId?:
    | string
    | null;

  brandId?:
    | string
    | null;
}

interface ProductCarouselSettings {
  sourceType?: string;
  sortBy?: string;
}

interface ProductCarouselEditorProps {
  value: Record<string, unknown>;
  settings: Record<string, unknown>;

  onChange: (
    value: Record<string, unknown>
  ) => void;
}

const SOURCE_LABELS: Record<
  string,
  string
> = {
  MANUAL: "Manual selection",
  FEATURED: "Featured products",
  CATEGORY: "Category",
  BRAND: "Brand",
  BEST_SELLERS: "Best sellers",
  NEW_ARRIVALS: "New arrivals",
  FLASH_SALE: "Flash sale",
};

function normalizeSourceType(
  settings: ProductCarouselSettings
) {
  return String(
    settings.sourceType ||
      "MANUAL"
  )
    .trim()
    .toUpperCase();
}

function SourceNotice({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#202223]">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-[#6d7175]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProductCarouselEditor({
  value,
  settings,
  onChange,
}: ProductCarouselEditorProps) {
  const content =
    value as ProductCarouselContent;

  const sourceType =
    normalizeSourceType(
      settings as ProductCarouselSettings
    );

  const productIds =
    Array.isArray(
      content.productIds
    )
      ? content.productIds.filter(
          (
            id
          ): id is string =>
            typeof id ===
              "string" &&
            Boolean(id.trim())
        )
      : [];

  const updateContent = (
    changes:
      Partial<ProductCarouselContent>
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">
              Product carousel content
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Configure the heading and
              products displayed in this
              carousel.
            </p>
          </div>

          <span className="rounded-full bg-[#eef8f9] px-3 py-1 text-xs font-semibold text-[#16828b]">
            {SOURCE_LABELS[
              sourceType
            ] || sourceType}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#202223]">
              Title
            </label>

            <input
              type="text"
              value={
                content.title || ""
              }
              onChange={(event) =>
                updateContent({
                  title:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Featured Products"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#202223]">
              Subtitle
            </label>

            <input
              type="text"
              value={
                content.subtitle || ""
              }
              onChange={(event) =>
                updateContent({
                  subtitle:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Optional supporting text"
            />
          </div>
        </div>

        {sourceType ===
        "MANUAL" ? (
          <ProductPicker
            selectedIds={productIds}
            onChange={(nextIds) =>
              updateContent({
                productIds:
                  nextIds,
                categoryId: null,
                brandId: null,
              })
            }
          />
        ) : null}

        {sourceType ===
        "CATEGORY" ? (
          <CategoryPicker
            selectedId={
              content.categoryId ||
              null
            }
            onChange={(
              categoryId
            ) =>
              updateContent({
                categoryId,
                brandId: null,
                productIds: [],
              })
            }
            title="Select product category"
            description="Choose the category whose products should populate this carousel."
          />
        ) : null}

        {sourceType ===
        "BRAND" ? (
          <BrandPicker
            selectedId={
              content.brandId ||
              null
            }
            onChange={(
              brandId
            ) =>
              updateContent({
                brandId,
                categoryId: null,
                productIds: [],
              })
            }
            title="Select product brand"
            description="Choose the brand whose products should populate this carousel."
          />
        ) : null}

        {sourceType ===
        "FEATURED" ? (
          <SourceNotice
            icon={
              <BadgeCheck
                size={20}
              />
            }
            title="Featured products"
            description="Products marked as featured will be loaded automatically. No manual selection is required."
          />
        ) : null}

        {sourceType ===
        "BEST_SELLERS" ? (
          <SourceNotice
            icon={
              <Sparkles
                size={20}
              />
            }
            title="Best sellers"
            description="The storefront will load the best-selling products automatically."
          />
        ) : null}

        {sourceType ===
        "NEW_ARRIVALS" ? (
          <SourceNotice
            icon={
              <Sparkles
                size={20}
              />
            }
            title="New arrivals"
            description="The storefront will automatically load recently created active products."
          />
        ) : null}

        {sourceType ===
        "FLASH_SALE" ? (
          <SourceNotice
            icon={
              <Sparkles
                size={20}
              />
            }
            title="Flash sale"
            description="Promotion selection will be added through the reusable Promotion Picker."
          />
        ) : null}
      </div>
    </section>
  );
}
