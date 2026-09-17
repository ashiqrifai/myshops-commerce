"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetProductByIdQuery, useGetProductsQuery } from "@/store/api/productApi";
import type { GiftVoucherPromotionItem } from "@/types/giftVoucherPromotion";

type ProductRow = { id: string; name: string; status?: string | null; variants?: VariantRow[] };
type VariantRow = { id: string; productId?: string; sku: string; name: string; status?: string | null };

export default function ProductAssignmentPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: GiftVoucherPromotionItem[];
  onChange: (value: GiftVoucherPromotionItem[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");

  const { data: productResponse, isFetching: isFetchingProducts } = useGetProductsQuery({
    page: 1,
    pageSize: 200,
    status: "ACTIVE",
    search: search.trim() || undefined,
    sortBy: "name",
    sortDirection: "ASC",
  });

  const products = ((productResponse?.data || []) as unknown as ProductRow[]);

  const { data: detailResponse, isFetching: isFetchingDetail } = useGetProductByIdQuery(productId, { skip: !productId });
  const detailData = (detailResponse as unknown as { data?: ProductRow | { product?: ProductRow } } | undefined)?.data;
  const selectedProduct = detailData && "product" in detailData
    ? detailData.product || null
    : (detailData as ProductRow | undefined) || products.find((p) => p.id === productId) || null;

  const variants = useMemo(
    () => (selectedProduct?.variants || []).filter((v) => !v.status || v.status === "ACTIVE"),
    [selectedProduct]
  );

  const add = () => {
    if (!productId) return;
    const normalizedVariant = variantId || null;
    if (value.some((x) => x.productId === productId && (x.productVariantId || null) === normalizedVariant)) {
      window.alert("This product / variant is already assigned.");
      return;
    }
    const product = products.find((p) => p.id === productId) || selectedProduct;
    const variant = variants.find((v) => v.id === normalizedVariant);
    onChange([
      ...value,
      {
        productId,
        productVariantId: normalizedVariant,
        isActive: true,
        product: product ? { id: product.id, name: product.name } : null,
        productVariant: variant ? { id: variant.id, productId, sku: variant.sku, name: variant.name } : null,
      },
    ]);
    setVariantId("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[#202223]">Product assignments</h3>
        <p className="mt-1 text-sm text-[#6d7175]">Assign to a whole product or one specific variant.</p>
      </div>

      <div className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product</label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="admin-input pl-9" disabled={disabled} />
            </div>
            <select value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId(""); }} className="admin-input" disabled={disabled || isFetchingProducts}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Variant</label>
            <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="admin-input" disabled={disabled || !productId || isFetchingDetail}>
              <option value="">All variants</option>
              {variants.map((v) => <option key={v.id} value={v.id}>{v.sku} — {v.name}</option>)}
            </select>
            <p className="text-xs text-[#8c9196]">Leave “All variants” for a product-level promotion.</p>
          </div>

          <div className="flex items-end">
            <button type="button" onClick={add} disabled={disabled || !productId} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
        <table className="min-w-full divide-y divide-[#e1e3e5]">
          <thead className="bg-[#f6f6f7]"><tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]"><th className="px-4 py-3">Product</th><th className="px-4 py-3">Variant</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-[#e1e3e5] bg-white">
            {!value.length ? <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-[#6d7175]">No products assigned yet.</td></tr> : value.map((item, index) => (
              <tr key={`${item.productId}:${item.productVariantId || "ALL"}`} className="text-sm">
                <td className="px-4 py-4 font-medium">{item.product?.name || item.productId}</td>
                <td className="px-4 py-4 text-[#6d7175]">{item.productVariantId ? (item.productVariant ? `${item.productVariant.sku} — ${item.productVariant.name}` : item.productVariantId) : "All variants"}</td>
                <td className="px-4 py-4 text-right"><button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} disabled={disabled} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 disabled:opacity-50"><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
