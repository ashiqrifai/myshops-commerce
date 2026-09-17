"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  useGetProductsQuery,
  useGetProductByIdQuery,
} from "@/store/api/productApi";

import {
  useGetInventoryLocationsQuery,
} from "@/store/api/inventoryLocationApi";

interface InventoryProductListItem {
  id: string;
  name: string;
  parentSku?:
    | string
    | null;
  isDirectDelivery?:
    boolean;
}

interface InventoryProductVariant {
  id: string;
  sku: string;
  barcode?:
    | string
    | null;
  name: string;
  status?: string;
}

interface InventoryProductDetails {
  id: string;
  name: string;
  isDirectDelivery?:
    boolean;
  variants?:
    InventoryProductVariant[];
}

interface Props {
  open: boolean;
  saving: boolean;

  onClose:
    () => void;

  onSave:
    (values: {
      inventoryLocationId: string;
      productVariantId: string;
      quantityOnHand: number;
      quantityReserved: number;
    }) => Promise<void>;
}

export default function NewInventoryBalanceDialog({
  open,
  saving,
  onClose,
  onSave,
}: Props) {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    selectedProductId,
    setSelectedProductId,
  ] =
    useState(
      ""
    );

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] =
    useState(
      ""
    );

  const [
    selectedLocationId,
    setSelectedLocationId,
  ] =
    useState(
      ""
    );

  const [
    onHand,
    setOnHand,
  ] =
    useState(
      "0"
    );

  const [
    reserved,
    setReserved,
  ] =
    useState(
      "0"
    );

  const {
    data:
      productsResponse,
    isFetching:
      productsFetching,
  } =
    useGetProductsQuery(
      {
        page:
          1,

        pageSize:
          50,

        search:
          search.trim() ||
          undefined,

        status:
          "ACTIVE",
      } as never,
      {
        skip:
          !open,
      }
    );

  const products =
    (
      productsResponse
        ?.data ||
      []
    ) as unknown as
      InventoryProductListItem[];

  const {
    data:
      productResponse,
    isFetching:
      productFetching,
  } =
    useGetProductByIdQuery(
      selectedProductId,
      {
        skip:
          !open ||
          !selectedProductId,
      }
    );

  const product =
    (
      productResponse
        ?.data ||
      null
    ) as unknown as
      InventoryProductDetails |
      null;

  const variants =
    useMemo(
      () =>
        (
          product?.variants ||
          []
        ).filter(
          (
            variant
          ) =>
            !variant.status ||
            variant.status ===
            "ACTIVE"
        ),
      [
        product,
      ]
    );

  const {
    data:
      locationsResponse,
  } =
    useGetInventoryLocationsQuery(
      {
        page:
          1,

        pageSize:
          200,

        isActive:
          true,

        sortBy:
          "sortOrder",

        sortDirection:
          "ASC",
      },
      {
        skip:
          !open,
      }
    );

  const locations =
    locationsResponse
      ?.data ||
    [];

  if (
    !open
  ) {
    return null;
  }

  const selectedProduct =
    products.find(
      (
        item
      ) =>
        item.id ===
        selectedProductId
    ) ||
    null;

  const directDelivery =
    product
      ?.isDirectDelivery ===
      true ||
    selectedProduct
      ?.isDirectDelivery ===
      true;

  const handleSave =
    async () => {
      if (
        !selectedLocationId ||
        !selectedVariantId ||
        directDelivery
      ) {
        return;
      }

      await onSave({
        inventoryLocationId:
          selectedLocationId,

        productVariantId:
          selectedVariantId,

        quantityOnHand:
          Number(
            onHand ||
            0
          ),

        quantityReserved:
          Number(
            reserved ||
            0
          ),
      });
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e1e3e5] bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Add location inventory
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Select a product variant and location, then enter its opening balance.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
          >
            <X
              size={
                18
              }
            />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="text-sm font-semibold text-[#202223]">
              Search product
            </label>

            <div className="relative mt-2">
              <Search
                size={
                  16
                }
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                className="admin-input pl-9"
                placeholder="Product name or SKU..."
              />
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#202223]">
              Product
            </span>

            <select
              value={
                selectedProductId
              }
              onChange={(
                event
              ) => {
                setSelectedProductId(
                  event.target
                    .value
                );

                setSelectedVariantId(
                  ""
                );
              }}
              className="admin-input mt-2"
            >
              <option value="">
                {productsFetching
                  ? "Loading products..."
                  : "Select product"}
              </option>

              {products.map(
                (
                  item
                ) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {item.name}
                    {item.parentSku
                      ? ` · ${item.parentSku}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          {directDelivery ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              This is a direct-delivery product. Internal location inventory is not maintained for this product.
            </div>
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold text-[#202223]">
              Variant
            </span>

            <select
              value={
                selectedVariantId
              }
              onChange={(
                event
              ) =>
                setSelectedVariantId(
                  event.target
                    .value
                )
              }
              disabled={
                !selectedProductId ||
                directDelivery ||
                productFetching
              }
              className="admin-input mt-2 disabled:opacity-50"
            >
              <option value="">
                {productFetching
                  ? "Loading variants..."
                  : "Select variant"}
              </option>

              {variants.map(
                (
                  variant
                ) => (
                  <option
                    key={
                      variant.id
                    }
                    value={
                      variant.id
                    }
                  >
                    {variant.sku}
                    {" · "}
                    {variant.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#202223]">
              Inventory location
            </span>

            <select
              value={
                selectedLocationId
              }
              onChange={(
                event
              ) =>
                setSelectedLocationId(
                  event.target
                    .value
                )
              }
              className="admin-input mt-2"
            >
              <option value="">
                Select location
              </option>

              {locations.map(
                (
                  location
                ) => (
                  <option
                    key={
                      location.id
                    }
                    value={
                      location.id
                    }
                  >
                    {location.name}
                    {" · "}
                    {location.locationType}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-[#202223]">
                On hand
              </span>

              <input
                type="number"
                min={
                  0
                }
                step="0.0001"
                value={
                  onHand
                }
                onChange={(
                  event
                ) =>
                  setOnHand(
                    event.target
                      .value
                  )
                }
                className="admin-input mt-2"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-[#202223]">
                Reserved
              </span>

              <input
                type="number"
                min={
                  0
                }
                step="0.0001"
                value={
                  reserved
                }
                onChange={(
                  event
                ) =>
                  setReserved(
                    event.target
                      .value
                  )
                }
                className="admin-input mt-2"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#e1e3e5] pt-5">
            <button
              type="button"
              onClick={
                onClose
              }
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                saving ||
                directDelivery ||
                !selectedVariantId ||
                !selectedLocationId
              }
              onClick={
                handleSave
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  size={
                    16
                  }
                  className="animate-spin"
                />
              ) : (
                <Plus
                  size={
                    16
                  }
                />
              )}

              Save balance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
