"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  FileText,
  FolderTree,
  ImageIcon,
  LoaderCircle,
  Package,
  Save,
  Settings2,
  Shapes,
  Store,
} from "lucide-react";

import { useGetBrandsQuery } from "@/store/api/brandApi";
import ProductCategorySelector from "./ProductCategorySelector";
import ProductMediaManager from "./ProductMediaManager";
import ProductSpecificationEditor from "./ProductSpecificationEditor";
import ProductChannelPanel from "./ProductChannelPanel";
import VariantBuilder from "./VariantBuilder";
import VariantMatrix from "./VariantMatrix";
import ProductPreviewModal from "../../../app/admin/products/components/ProductPreviewModal"

import type {
  Product,
  ProductFormValues,
  ProductStatus,
  ProductType,
} from "@/types/product";

interface Props {
  product?: Product | null;
  isSaving: boolean;
  submitLabel?: string;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onRefresh?: () => void;
}

const defaults: ProductFormValues = {
  name: "",
  slug: "",
  productType: "SIMPLE",
  status: "DRAFT",
  parentSku: null,
  brandId: null,
  primaryCategoryId: null,
  categoryIds: [],
  shortDescription: null,
  description: null,
  features: [],
  whatsInTheBox: [],
  warrantyText: null,
  taxCode: null,
  taxPercent: 5,
  sortOrder: 0,
  isFeatured: false,
  isSearchable: true,
  metaTitle: null,
  metaDescription: null,
  metaKeywords: null,
  canonicalUrl: null,
  images: [],
  channels: [
    {
      channelCode: "WEBSITE",
      isVisible: true,
      publishStatus: "DRAFT",
      channelTitle: null,
      channelDescription: null,
    },
    {
      channelCode: "KIOSK",
      isVisible: true,
      publishStatus: "DRAFT",
      channelTitle: null,
      channelDescription: null,
    },
  ],
  attributeValues: [],
  variants: [],
};

export default function ProductForm({
  product,
  isSaving,
  submitLabel = "Save product",
  onSubmit,
  onRefresh,
}: Props) {
  const [values, setValues] = useState<ProductFormValues>(
    product ? mapProduct(product) : defaults
  );
  const [slugEdited, setSlugEdited] = useState(Boolean(product?.slug));
  const [previewOpen, setPreviewOpen] =
  useState(false);

  const { data: brandsResponse } = useGetBrandsQuery({
    page: 1,
    pageSize: 200,
    isActive: true,
    sortBy: "name",
    sortDirection: "ASC",
  });

  const brands = brandsResponse?.data || [];

  useEffect(() => {
    setValues(product ? mapProduct(product) : defaults);
    setSlugEdited(Boolean(product?.slug));
  }, [product]);

  const setField = <K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const validationError = useMemo(() => {
    if (!values.name.trim()) return "Product name is required.";
    if (!values.slug.trim()) return "Product URL slug is required.";
    if (!values.primaryCategoryId) return "Select a primary category.";

    if (
      values.variants.some(
        (variant) => !variant.name.trim() || !variant.sku.trim()
      )
    ) {
      return "Every variant requires a name and SKU.";
    }

    const skus = values.variants
      .map((variant) => variant.sku.trim().toLowerCase())
      .filter(Boolean);

    if (new Set(skus).size !== skus.length) {
      return "Variant SKUs must be unique.";
    }

    const barcodes = values.variants
  .map((variant) =>
    String(variant.barcode || "")
      .trim()
      .toLowerCase()
  )
  .filter(Boolean);

if (
  new Set(barcodes).size !==
  barcodes.length
) {
  return "Variant barcodes must be unique.";
}

    return null;
  }, [values]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validationError) {
      window.alert(validationError);
      return;
    }

    await onSubmit(values);
  };

  const selectedBrand = brands.find((brand) => brand.id === values.brandId);

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
      <header className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
        >
          <ArrowLeft size={16} />
          Products
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {product ? "Edit product" : "Create product"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage catalogue content, specifications, media, channels and sellable variants.
            </p>
          </div>

          <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() =>
      setPreviewOpen(true)
    }
    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-5 text-sm font-semibold hover:bg-[#f6f6f7]"
  >
    👁 Preview
  </button>

  <div className="space-y-3">
  

  <SaveButton
    loading={isSaving}
    label={submitLabel}
    full
  />
</div>
</div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card icon={<Package size={18} />} title="Product identity" description="Core catalogue information and product structure.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Product name" required>
                <input
                  value={values.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setField("name", name);
                    if (!slugEdited) setField("slug", slugify(name));
                  }}
                  className="admin-input"
                />
              </Field>

              <Field label="URL slug" required>
                <input
                  value={values.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setField("slug", slugify(event.target.value));
                  }}
                  className="admin-input"
                />
              </Field>

              <Field label="Product type">
                <select
                  value={values.productType}
                  onChange={(event) =>
                    setField("productType", event.target.value as ProductType)
                  }
                  className="admin-input"
                >
                  <option value="SIMPLE">Simple</option>
                  <option value="VARIABLE">Variable</option>
                </select>
              </Field>

              <Field label="Parent SKU">
                <input
                  value={values.parentSku || ""}
                  onChange={(event) => setField("parentSku", event.target.value)}
                  className="admin-input font-mono"
                />
              </Field>

              <Field label="Brand">
                <select
                  value={values.brandId || ""}
                  onChange={(event) => setField("brandId", event.target.value || null)}
                  className="admin-input"
                >
                  <option value="">No brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Tax code">
                <input
                  value={values.taxCode || ""}
                  onChange={(event) => setField("taxCode", event.target.value)}
                  className="admin-input"
                />
              </Field>
            </div>

            <Field label="Short description">
              <textarea
                rows={3}
                value={values.shortDescription || ""}
                onChange={(event) => setField("shortDescription", event.target.value)}
                className="admin-input min-h-[96px] resize-y py-3"
              />
            </Field>

            <Field label="Full description">
              <textarea
                rows={8}
                value={values.description || ""}
                onChange={(event) => setField("description", event.target.value)}
                className="admin-input min-h-[190px] resize-y py-3"
              />
            </Field>
          </Card>

          <Card icon={<FolderTree size={18} />} title="Product categories" description="Choose primary and secondary catalogue categories.">
            <ProductCategorySelector
              primaryCategoryId={values.primaryCategoryId}
              categoryIds={values.categoryIds}
              onChange={(next) => setValues((current) => ({ ...current, ...next }))}
            />
          </Card>

          <Card icon={<ImageIcon size={18} />} title="Product media" description="Build the primary image and gallery from Media Studio.">
            <ProductMediaManager
              images={values.images}
              onChange={(images) => setField("images", images)}
            />
          </Card>

          <Card icon={<Shapes size={18} />} title="Specifications" description="Category-driven product specification values.">
            <ProductSpecificationEditor
              categoryIds={values.categoryIds}
              values={values.attributeValues}
              onChange={(attributeValues) => setField("attributeValues", attributeValues)}
            />
          </Card>

          <Card icon={<FileText size={18} />} title="Merchandising content" description="Features, included items and warranty information.">
            <ListEditor
              label="Key features"
              values={values.features}
              onChange={(features) => setField("features", features)}
            />
            <ListEditor
              label="What's in the box"
              values={values.whatsInTheBox}
              onChange={(items) => setField("whatsInTheBox", items)}
            />
            <Field label="Warranty text">
              <textarea
                rows={4}
                value={values.warrantyText || ""}
                onChange={(event) => setField("warrantyText", event.target.value)}
                className="admin-input min-h-[110px] resize-y py-3"
              />
            </Field>
          </Card>

          {values.productType === "VARIABLE" && (
            <Card icon={<Boxes size={18} />} title="Variant generator" description="Generate SKU combinations from category variant attributes.">
              <VariantBuilder
                productId={product?.id}
                categoryIds={values.categoryIds}
                parentSku={values.parentSku}
                onGenerated={onRefresh}
              />
            </Card>
          )}

          <Card icon={<Boxes size={18} />} title="Variants" description="Edit the actual sellable SKUs used by pricing, inventory and orders.">
          <VariantMatrix
  variants={values.variants}
  parentSku={values.parentSku}
  onChange={(variants) =>
    setField("variants", variants)
  }
/>
          </Card>

          <Card icon={<Store size={18} />} title="Channel visibility" description="Control website and AI kiosk publication.">
            <ProductChannelPanel
              value={values.channels}
              onChange={(channels) => setField("channels", channels)}
            />
          </Card>

          <Card icon={<FileText size={18} />} title="Search engine optimization" description="Control product search result metadata.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Meta title">
                <input
                  value={values.metaTitle || ""}
                  onChange={(event) => setField("metaTitle", event.target.value)}
                  className="admin-input"
                />
              </Field>
              <Field label="Canonical URL">
                <input
                  value={values.canonicalUrl || ""}
                  onChange={(event) => setField("canonicalUrl", event.target.value)}
                  className="admin-input"
                />
              </Field>
            </div>

            <Field label="Meta description">
              <textarea
                rows={4}
                value={values.metaDescription || ""}
                onChange={(event) => setField("metaDescription", event.target.value)}
                className="admin-input min-h-[110px] resize-y py-3"
              />
            </Field>

            <Field label="Meta keywords">
              <textarea
                rows={3}
                value={values.metaKeywords || ""}
                onChange={(event) => setField("metaKeywords", event.target.value)}
                className="admin-input min-h-[90px] resize-y py-3"
              />
            </Field>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card icon={<Settings2 size={18} />} title="Catalogue settings">
            <Field label="Product status">
              <select
                value={values.status}
                onChange={(event) => setField("status", event.target.value as ProductStatus)}
                className="admin-input"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>

            <Toggle
              label="Featured"
              description="Allow featured catalogue placements."
              checked={values.isFeatured}
              onChange={(checked) => setField("isFeatured", checked)}
            />

            <Toggle
              label="Searchable"
              description="Include this product in search."
              checked={values.isSearchable}
              onChange={(checked) => setField("isSearchable", checked)}
            />

            <Field label="Tax percentage">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={values.taxPercent}
                onChange={(event) => setField("taxPercent", Number(event.target.value))}
                className="admin-input"
              />
            </Field>

            <Field label="Sort order">
              <input
                type="number"
                min={0}
                value={values.sortOrder}
                onChange={(event) => setField("sortOrder", Number(event.target.value))}
                className="admin-input"
              />
            </Field>
          </Card>

          <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Product summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Summary label="Brand" value={selectedBrand?.name || "No brand"} />
              <Summary label="Type" value={values.productType} />
              <Summary label="Categories" value={String(values.categoryIds.length)} />
              <Summary label="Images" value={String(values.images.length)} />
              <Summary label="Variants" value={String(values.variants.length)} />
              <Summary label="URL" value={`/${values.slug || "product"}`} mono />
            </dl>
          </section>

          {validationError && (
            <div className="rounded-xl border border-[#f0b9ad] bg-[#fbeae5] p-4 text-sm text-[#a23b2a]">
              {validationError}
            </div>
          )}

          <div className="sticky bottom-4 rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-lg">
            <SaveButton loading={isSaving} label={submitLabel} full />
          </div>
        </aside>
      </div>


      <ProductPreviewModal
  open={previewOpen}
  values={values}
  brandName={
    selectedBrand?.name || null
  }
  categoryName={
    product?.primaryCategory
      ?.name || null
  }
  onClose={() =>
    setPreviewOpen(false)
  }
/>

    </form>
  );
}

function mapProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    productType: product.productType,
    status: product.status,
    parentSku: product.parentSku || null,
    brandId: product.brandId || null,
    primaryCategoryId: product.primaryCategoryId || null,
    categoryIds:
      product.categoryAssignments?.map((assignment) => assignment.categoryId) || [],
    shortDescription: product.shortDescription || null,
    description: product.description || null,
    features: product.features || [],
    whatsInTheBox: product.whatsInTheBox || [],
    warrantyText: product.warrantyText || null,
    taxCode: product.taxCode || null,
    taxPercent: Number(product.taxPercent || 0),
    sortOrder: product.sortOrder || 0,
    isFeatured: product.isFeatured,
    isSearchable: product.isSearchable,
    metaTitle: product.metaTitle || null,
    metaDescription: product.metaDescription || null,
    metaKeywords: product.metaKeywords || null,
    canonicalUrl: product.canonicalUrl || null,
    images: product.images || [],
    channels: product.channels || [],
    attributeValues: product.attributeValues || [],
    variants: product.variants || [],
  };
}

function Card({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-[#5c5f62]">{icon}</div>}
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-[#6d7175]">{description}</p>}
        </div>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-[#d72c0d]">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#e1e3e5] p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[#6d7175]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-[#303030]" : "bg-[#babfc3]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function ListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        rows={5}
        value={values.join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n"))}
        className="admin-input min-h-[120px] resize-y py-3"
        placeholder="One item per line"
      />
    </Field>
  );
}

function SaveButton({
  loading,
  label,
  full = false,
}: {
  loading: boolean;
  label: string;
  full?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={[
        "flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white disabled:opacity-50",
        full ? "w-full" : "",
      ].join(" ")}
    >
      {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
      {loading ? "Saving..." : label}
    </button>
  );
}

function Summary({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[#6d7175]">{label}</dt>
      <dd className={["max-w-[190px] break-words text-right font-medium", mono ? "font-mono text-xs" : ""].join(" ")}>
        {value}
      </dd>
    </div>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
