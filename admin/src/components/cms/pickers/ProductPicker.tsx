"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ImageIcon,
  LoaderCircle,
  PackageSearch,
  Search,
  Trash2,
} from "lucide-react";

import {
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import {
  useGetProductsQuery,
} from "@/store/api/productApi";

import type {
  Product,
} from "@/types/product";

interface ProductPickerProps {
  selectedIds: string[];

  onChange: (
    productIds: string[]
  ) => void;
}

const BACKEND_URL = (
  process.env
    .NEXT_PUBLIC_BACKEND_URL ||
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080"
)
  .replace(
    /\/api\/v1\/?$/,
    ""
  )
  .replace(/\/$/, "");

const toAbsoluteUrl = (
  value?:
    | string
    | null
): string | null => {
  if (!value) {
    return null;
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith(
      "http://"
    ) ||
    normalized.startsWith(
      "https://"
    ) ||
    normalized.startsWith(
      "data:"
    )
  ) {
    return normalized;
  }

  return `${BACKEND_URL}${
    normalized.startsWith("/")
      ? normalized
      : `/${normalized}`
  }`;
};

const getProductImageUrl = (
  product: Product
): string | null => {
  const activeImages =
    (product.images || [])
      .filter(
        (image) =>
          image.isActive !==
          false
      )
      .sort(
        (first, second) =>
          Number(
            first.displayOrder ||
              0
          ) -
          Number(
            second.displayOrder ||
              0
          )
      );

  const primaryImage =
    activeImages.find(
      (image) =>
        image.imageRole ===
        "PRIMARY"
    ) ||
    activeImages[0];

  const mediaAsset =
    primaryImage?.mediaAsset;

  if (!mediaAsset) {
    return null;
  }

  const asset =
    mediaAsset as unknown as {
      publicUrl?:
        | string
        | null;

      previewUrl?:
        | string
        | null;

      thumbnailUrl?:
        | string
        | null;

      previewPath?:
        | string
        | null;

      thumbnailPath?:
        | string
        | null;
    };

  if (asset.publicUrl) {
    return toAbsoluteUrl(
      asset.publicUrl
    );
  }

  if (asset.previewUrl) {
    return toAbsoluteUrl(
      asset.previewUrl
    );
  }

  if (asset.thumbnailUrl) {
    return toAbsoluteUrl(
      asset.thumbnailUrl
    );
  }

  if (asset.previewPath) {
    return toAbsoluteUrl(
      `/media/${asset.previewPath}`
    );
  }

  if (asset.thumbnailPath) {
    return toAbsoluteUrl(
      `/media/${asset.thumbnailPath}`
    );
  }

  return null;
};

const getProductSku = (
  product: Product
): string => {
  return (
    product.parentSku ||
    product.variants?.find(
      (variant) =>
        variant.isDefault
    )?.sku ||
    product.variants?.[0]
      ?.sku ||
    "No SKU"
  );
};


export default function ProductPicker({
  selectedIds,
  onChange,
}: ProductPickerProps) {
  const productIds =
    Array.isArray(selectedIds)
      ? selectedIds.filter(
          (
            id
          ): id is string =>
            typeof id ===
              "string" &&
            Boolean(id.trim())
        )
      : [];

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const deferredSearch =
    useDeferredValue(
      searchText.trim()
    );

  const {
    data:
      productsResponse,

    isLoading,
    isFetching,
    isError,
  } =
    useGetProductsQuery({
      page: 1,
      pageSize: 200,
      search:
        deferredSearch ||
        undefined,
      status: "ACTIVE",
      sortBy: "name",
      sortDirection: "ASC",
    });

  const products =
    productsResponse?.data ||
    [];

  const productMap =
    useMemo(() => {
      return new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );
    }, [products]);

  const availableProducts =
    useMemo(() => {
      const selectedSet =
        new Set(productIds);

      return products.filter(
        (product) =>
          !selectedSet.has(
            product.id
          )
      );
    }, [
      products,
      productIds,
    ]);

  const addProduct = (
    productId: string
  ) => {
    if (
      productIds.includes(
        productId
      )
    ) {
      return;
    }

    onChange([
      ...productIds,
      productId,
    ]);
  };

  const removeProduct = (
    productId: string
  ) => {
    onChange(
      productIds.filter(
        (id) =>
          id !== productId
      )
    );
  };

  const moveProduct = (
    productId: string,
    direction:
      | "UP"
      | "DOWN"
  ) => {
    const currentIndex =
      productIds.indexOf(
        productId
      );

    if (
      currentIndex < 0
    ) {
      return;
    }

    const targetIndex =
      direction === "UP"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        productIds.length
    ) {
      return;
    }

    const nextIds = [
      ...productIds,
    ];

    [
      nextIds[currentIndex],
      nextIds[targetIndex],
    ] = [
      nextIds[targetIndex],
      nextIds[currentIndex],
    ];

    onChange(nextIds);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <PackageSearch
                size={20}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#202223]">
                Select products
              </h3>

              <p className="mt-1 text-sm text-[#6d7175]">
                Search the catalogue
                and add products to
                this section.
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175]"
            />

            <input
              type="search"
              value={searchText}
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target
                    .value
                )
              }
              placeholder="Search by product name, SKU or brand"
              className="h-11 w-full rounded-lg border border-[#babfc3] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
            />

            {isFetching ? (
              <LoaderCircle
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6d7175]"
              />
            ) : null}
          </div>
        </div>

        <div className="max-h-[430px] overflow-y-auto">
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <LoaderCircle
                size={24}
                className="animate-spin text-[#6d7175]"
              />
            </div>
          ) : isError ? (
            <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
              <p className="font-medium text-[#202223]">
                Unable to load products
              </p>
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
              <p className="font-medium text-[#202223]">
                No products found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e1e3e5]">
              {availableProducts.map(
                (product) => {
                  const imageUrl =
                    getProductImageUrl(
                      product
                    );

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#f6f6f7]"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <ImageIcon
                            size={22}
                            className="text-[#8c9196]"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#202223]">
                          {product.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#6d7175]">
                          {getProductSku(
                            product
                          )}
                          {product.brand?.name
                            ? ` · ${product.brand.name}`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addProduct(
                            product.id
                          )
                        }
                        className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium text-[#202223]"
                      >
                        <Check size={16} />
                        Add
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#e1e3e5] bg-white">
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[#202223]">
              Selected products
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              The order below controls
              the storefront display
              order.
            </p>
          </div>

          <span className="rounded-full bg-[#f1f2f3] px-3 py-1 text-xs font-semibold text-[#4b4f52]">
            {productIds.length} selected
          </span>
        </div>

        {productIds.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center p-6 text-center">
            <p className="font-medium text-[#202223]">
              No products selected
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e1e3e5]">
            {productIds.map(
              (productId, index) => {
                const product =
                  productMap.get(
                    productId
                  );

                const imageUrl =
                  product
                    ? getProductImageUrl(
                        product
                      )
                    : null;

                return (
                  <div
                    key={productId}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f2f3] text-xs font-semibold text-[#4b4f52]">
                      {index + 1}
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={product?.name || "Product"}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon
                          size={22}
                          className="text-[#8c9196]"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#202223]">
                        {product?.name || "Selected product"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#6d7175]">
                        {product
                          ? getProductSku(product)
                          : productId}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() =>
                          moveProduct(
                            productId,
                            "UP"
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#202223] disabled:opacity-40"
                        aria-label="Move product up"
                      >
                        <ArrowUp size={16} />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          productIds.length - 1
                        }
                        onClick={() =>
                          moveProduct(
                            productId,
                            "DOWN"
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#202223] disabled:opacity-40"
                        aria-label="Move product down"
                      >
                        <ArrowDown size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeProduct(
                            productId
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                        aria-label="Remove product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
