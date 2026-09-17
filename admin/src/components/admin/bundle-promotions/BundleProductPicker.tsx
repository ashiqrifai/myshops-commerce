"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useGetProductByIdQuery,
  useGetProductsQuery,
} from "@/store/api/productApi";

type Variant = {
  id: string;
  sku: string;
  name: string;
  status?: string | null;
  zohoItemId?: string | null;
  zohoItemCode?: string | null;
};

type Product = {
  id: string;
  name: string;
  parentSku?: string | null;
  variants?: Variant[];
};

export interface BundleProductSelection {
  productId:
    string | null;

  productVariantId:
    string | null;

  productName?:
    string | null;

  variantName?:
    string | null;

  sku?:
    string | null;

  zohoItemId?:
    string | null;
}

export default function BundleProductPicker({
  value,
  onChange,
}: {
  value:
    BundleProductSelection;

  onChange: (
    value:
      BundleProductSelection
  ) => void;
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const {
    data:
      productResponse,
    isFetching,
    error,
  } =
    useGetProductsQuery({
      page:
        1,

      pageSize:
        50,

      status:
        "ACTIVE",

      search:
        search.trim() ||
        undefined,

      sortBy:
        "name",

      sortDirection:
        "ASC",
    });

  const products =
    (
      productResponse
        ?.data ||
      []
    ) as Product[];

  const {
    data:
      detailResponse,
    isFetching:
      detailLoading,
  } =
    useGetProductByIdQuery(
      value.productId ||
        "",
      {
        skip:
          !value.productId,
      }
    );

  const selectedProduct =
    (
      detailResponse
        ?.data ||
      products.find(
        (
          product
        ) =>
          product.id ===
          value.productId
      ) ||
      null
    ) as Product | null;

  const variants =
    useMemo(
      () =>
        (
          selectedProduct
            ?.variants ||
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
        selectedProduct,
      ]
    );

  const selectedVariant =
    variants.find(
      (
        variant
      ) =>
        variant.id ===
        value.productVariantId
    ) ||
    null;

  return (
    <div className="md:col-span-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <input
            className="admin-input"
            placeholder="Search bundle product / SKU"
            value={
              search
            }
            onChange={
              (
                event
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
            }
          />

          {isFetching ? (
            <p className="mt-1 text-xs text-[#6d7175]">
              Searching products...
            </p>
          ) : null}

          {error ? (
            <p className="mt-1 text-xs text-red-600">
              Unable to load products.
            </p>
          ) : null}
        </div>

        <select
          className="admin-input"
          value={
            value.productId ||
            ""
          }
          onChange={
            (
              event
            ) => {
              const product =
                products.find(
                  (
                    item
                  ) =>
                    item.id ===
                    event
                      .target
                      .value
                );

              onChange({
                productId:
                  event
                    .target
                    .value ||
                  null,

                productVariantId:
                  null,

                productName:
                  product
                    ?.name ||
                  null,

                variantName:
                  null,

                sku:
                  null,

                zohoItemId:
                  null,
              });
            }
          }
        >
          <option value="">
            Select product
          </option>

          {products.map(
            (
              product
            ) => (
              <option
                key={
                  product.id
                }
                value={
                  product.id
                }
              >
                {
                  product.name
                }
                {product.parentSku
                  ? ` — ${product.parentSku}`
                  : ""}
              </option>
            )
          )}
        </select>

        <select
          className="admin-input"
          disabled={
            !value.productId ||
            detailLoading
          }
          value={
            value.productVariantId ||
            ""
          }
          onChange={
            (
              event
            ) => {
              const variant =
                variants.find(
                  (
                    item
                  ) =>
                    item.id ===
                    event
                      .target
                      .value
                );

              onChange({
                productId:
                  value.productId,

                productVariantId:
                  event
                    .target
                    .value ||
                  null,

                productName:
                  selectedProduct
                    ?.name ||
                  value.productName ||
                  null,

                variantName:
                  variant
                    ?.name ||
                  null,

                sku:
                  variant
                    ?.sku ||
                  null,

                zohoItemId:
                  variant
                    ?.zohoItemId ||
                  null,
              });
            }
          }
        >
          <option value="">
            Default/all variant
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
                {
                  variant.sku
                }{" "}
                —{" "}
                {
                  variant.name
                }
              </option>
            )
          )}
        </select>
      </div>

      {selectedVariant ? (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <span className="text-[#6d7175]">
            SKU:{" "}
            <strong className="text-[#202223]">
              {
                selectedVariant
                  .sku
              }
            </strong>
          </span>

          {selectedVariant
            .zohoItemId ? (
            <span className="font-semibold text-emerald-700">
              Zoho mapped
              {" · "}
              {
                selectedVariant
                  .zohoItemId
              }
            </span>
          ) : (
            <span className="font-semibold text-amber-700">
              Zoho mapping not available
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
