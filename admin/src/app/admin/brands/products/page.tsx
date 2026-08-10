"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Package, Plus, Search, Trash2 } from "lucide-react";
import { useDeleteProductMutation, useGetProductsQuery } from "@/store/api/productApi";
import type { ProductStatus, ProductType } from "@/types/product";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [productType, setProductType] = useState<ProductType | "">("");

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    pageSize: 30,
    search: search.trim() || undefined,
    status: status || undefined,
    productType: productType || undefined,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const products = data?.data || [];
  const pagination = data?.pagination;

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await deleteProduct(id).unwrap();
    } catch (error: any) {
      window.alert(error?.data?.message || "Unable to delete product.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-[#6d7175]">Manage catalogue products and sellable variants.</p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
        >
          <Plus size={17} />
          Create product
        </Link>
      </header>

      <section className="mt-6 rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-[#e1e3e5] p-4 md:grid-cols-[minmax(0,1fr)_190px_190px]">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="admin-input pl-10"
              placeholder="Search name, slug or SKU..."
            />
          </div>

          <select
            value={productType}
            onChange={(event) => {
              setProductType(event.target.value as ProductType | "");
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All types</option>
            <option value="SIMPLE">Simple</option>
            <option value="VARIABLE">Variable</option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ProductStatus | "");
              setPage(1);
            }}
            className="admin-input"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#6d7175]">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={34} className="mx-auto text-[#8c9196]" />
            <p className="mt-3 text-sm font-semibold">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-[#e1e3e5]">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-1 font-mono text-xs text-[#6d7175]">{product.parentSku || "—"}</p>
                    </td>
                    <td className="px-4 py-3">{product.productType}</td>
                    <td className="px-4 py-3">{product.brand?.name || "—"}</td>
                    <td className="px-4 py-3">{product.primaryCategory?.name || "—"}</td>
                    <td className="px-4 py-3">{product.variants?.length || 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => remove(product.id, product.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5]"
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
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e1e3e5] px-4 py-3">
            <p className="text-sm text-[#6d7175]">
              Page {pagination.page} of {pagination.totalPages}
              {isFetching ? " · Refreshing..." : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-[#babfc3] px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-[#babfc3] px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const className =
    status === "ACTIVE"
      ? "bg-[#e3f1df] text-[#2f6f24]"
      : status === "DRAFT"
        ? "bg-[#fff3d6] text-[#72510d]"
        : status === "ARCHIVED"
          ? "bg-[#f1f2f3] text-[#5c5f62]"
          : "bg-[#fbeae5] text-[#a23b2a]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}
