"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  useGetCollectionProductsQuery,
  useReplaceCollectionProductsMutation,
} from "@/store/api/collectionApi";

import {
  useGetProductsQuery,
} from "@/store/api/productApi";

import type {
  CollectionAssignedProduct,
} from "@/types/collection";

import type {
  Product,
} from "@/types/product";

interface CollectionProductBrowserProps {
  collectionId:
    string;

  disabled?:
    boolean;

  onSaved?: (
    productCount:
      number
  ) => void;
}

export default function CollectionProductBrowser({
  collectionId,
  disabled = false,
  onSaved,
}: CollectionProductBrowserProps) {
  const [
    availableSearch,
    setAvailableSearch,
  ] = useState("");

  const [
    selectedSearch,
    setSelectedSearch,
  ] = useState("");

  const [
    selectedAvailableIds,
    setSelectedAvailableIds,
  ] = useState<
    string[]
  >([]);

  const [
    selectedAssignedIds,
    setSelectedAssignedIds,
  ] = useState<
    string[]
  >([]);

  const [
    workingProductIds,
    setWorkingProductIds,
  ] = useState<
    string[]
  >([]);

  const [
    assignmentsInitialized,
    setAssignmentsInitialized,
  ] = useState(false);

  const productQueryParams =
    useMemo(
      () => ({
        page:
          1,

        pageSize:
          100,

        search:
          availableSearch.trim() ||
          undefined,

        sortBy:
          "name" as const,

        sortDirection:
          "ASC" as const,
      }),
      [
        availableSearch,
      ]
    );

  const {
    data:
      productsResponse,
    isLoading:
      isLoadingProducts,
    isFetching:
      isFetchingProducts,
    isError:
      isProductsError,
    refetch:
      refetchProducts,
  } =
    useGetProductsQuery(
      productQueryParams
    );

  const {
    data:
      assignedResponse,
    isLoading:
      isLoadingAssigned,
    isFetching:
      isFetchingAssigned,
    isError:
      isAssignedError,
    refetch:
      refetchAssigned,
  } =
    useGetCollectionProductsQuery(
      {
        id:
          collectionId,

        page:
          1,

        pageSize:
          100,
      },
      {
        skip:
          !collectionId,
      }
    );

  const [
    replaceCollectionProducts,
    {
      isLoading:
        isSaving,
    },
  ] =
    useReplaceCollectionProductsMutation();

  const products =
    productsResponse?.data ||
    [];

  const assignedProducts =
    useMemo(
      () =>
        extractAssignedProducts(
          assignedResponse
        ),
      [
        assignedResponse,
      ]
    );

  useEffect(
    () => {
      if (
        assignmentsInitialized ||
        isLoadingAssigned ||
        isFetchingAssigned
      ) {
        return;
      }

      setWorkingProductIds(
        assignedProducts.map(
          (
            product
          ) =>
            product.id
        )
      );

      setAssignmentsInitialized(
        true
      );
    },
    [
      assignedProducts,
      assignmentsInitialized,
      isFetchingAssigned,
      isLoadingAssigned,
    ]
  );

  const allKnownProducts =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            Product
          >();

        assignedProducts.forEach(
          (
            product
          ) => {
            map.set(
              product.id,
              product
            );
          }
        );

        products.forEach(
          (
            product
          ) => {
            map.set(
              product.id,
              product
            );
          }
        );

        return map;
      },
      [
        assignedProducts,
        products,
      ]
    );

  const workingProductIdSet =
    useMemo(
      () =>
        new Set(
          workingProductIds
        ),
      [
        workingProductIds,
      ]
    );

  const availableProducts =
    useMemo(
      () =>
        products.filter(
          (
            product
          ) =>
            !workingProductIdSet.has(
              product.id
            )
        ),
      [
        products,
        workingProductIdSet,
      ]
    );

  const selectedProducts =
    useMemo(
      () => {
        const normalizedSearch =
          selectedSearch
            .trim()
            .toLowerCase();

        return workingProductIds
          .map(
            (
              productId
            ) =>
              allKnownProducts.get(
                productId
              )
          )
          .filter(
            (
              product
            ): product is Product =>
              Boolean(
                product
              )
          )
          .filter(
            (
              product
            ) =>
              matchesProductSearch(
                product,
                normalizedSearch
              )
          );
      },
      [
        allKnownProducts,
        selectedSearch,
        workingProductIds,
      ]
    );

  const originalAssignedIds =
    useMemo(
      () =>
        assignedProducts
          .map(
            (
              product
            ) =>
              product.id
          )
          .sort(),
      [
        assignedProducts,
      ]
    );

  const currentAssignedIds =
    useMemo(
      () =>
        [
          ...workingProductIds,
        ].sort(),
      [
        workingProductIds,
      ]
    );

  const hasUnsavedChanges =
    useMemo(
      () =>
        originalAssignedIds.join(
          "|"
        ) !==
        currentAssignedIds.join(
          "|"
        ),
      [
        currentAssignedIds,
        originalAssignedIds,
      ]
    );

  const handleToggleAvailable =
    (
      productId:
        string
    ) => {
      setSelectedAvailableIds(
        (
          current
        ) =>
          current.includes(
            productId
          )
            ? current.filter(
                (
                  id
                ) =>
                  id !==
                  productId
              )
            : [
                ...current,
                productId,
              ]
      );
    };

  const handleToggleAssigned =
    (
      productId:
        string
    ) => {
      setSelectedAssignedIds(
        (
          current
        ) =>
          current.includes(
            productId
          )
            ? current.filter(
                (
                  id
                ) =>
                  id !==
                  productId
              )
            : [
                ...current,
                productId,
              ]
      );
    };

  const handleSelectAllAvailable =
    () => {
      const visibleIds =
        availableProducts.map(
          (
            product
          ) =>
            product.id
        );

      const allSelected =
        visibleIds.length >
          0 &&
        visibleIds.every(
          (
            id
          ) =>
            selectedAvailableIds.includes(
              id
            )
        );

      if (
        allSelected
      ) {
        setSelectedAvailableIds(
          (
            current
          ) =>
            current.filter(
              (
                id
              ) =>
                !visibleIds.includes(
                  id
                )
            )
        );

        return;
      }

      setSelectedAvailableIds(
        (
          current
        ) =>
          Array.from(
            new Set([
              ...current,
              ...visibleIds,
            ])
          )
      );
    };

  const handleSelectAllAssigned =
    () => {
      const visibleIds =
        selectedProducts.map(
          (
            product
          ) =>
            product.id
        );

      const allSelected =
        visibleIds.length >
          0 &&
        visibleIds.every(
          (
            id
          ) =>
            selectedAssignedIds.includes(
              id
            )
        );

      if (
        allSelected
      ) {
        setSelectedAssignedIds(
          (
            current
          ) =>
            current.filter(
              (
                id
              ) =>
                !visibleIds.includes(
                  id
                )
            )
        );

        return;
      }

      setSelectedAssignedIds(
        (
          current
        ) =>
          Array.from(
            new Set([
              ...current,
              ...visibleIds,
            ])
          )
      );
    };

  const handleAddProducts =
    () => {
      if (
        selectedAvailableIds.length ===
        0
      ) {
        return;
      }

      setWorkingProductIds(
        (
          current
        ) =>
          Array.from(
            new Set([
              ...current,
              ...selectedAvailableIds,
            ])
          )
      );

      setSelectedAvailableIds(
        []
      );
    };

  const handleRemoveProducts =
    () => {
      if (
        selectedAssignedIds.length ===
        0
      ) {
        return;
      }

      const idsToRemove =
        new Set(
          selectedAssignedIds
        );

      setWorkingProductIds(
        (
          current
        ) =>
          current.filter(
            (
              id
            ) =>
              !idsToRemove.has(
                id
              )
          )
      );

      setSelectedAssignedIds(
        []
      );
    };

  const handleReset =
    () => {
      setWorkingProductIds(
        assignedProducts.map(
          (
            product
          ) =>
            product.id
        )
      );

      setSelectedAvailableIds(
        []
      );

      setSelectedAssignedIds(
        []
      );
    };

  const handleRefresh =
    async () => {
      try {
        await Promise.all([
          refetchProducts(),
          refetchAssigned(),
        ]);

        setAssignmentsInitialized(
          false
        );

        setSelectedAvailableIds(
          []
        );

        setSelectedAssignedIds(
          []
        );
      } catch {
        toast.error(
          "Unable to refresh collection products."
        );
      }
    };

  const handleSave =
    async () => {
      if (
        !collectionId
      ) {
        toast.error(
          "Collection ID is missing."
        );

        return;
      }

      try {
        await replaceCollectionProducts({
          id:
            collectionId,

          productIds:
            workingProductIds,
        }).unwrap();

        toast.success(
          "Collection products updated successfully."
        );

        await refetchAssigned();

        setAssignmentsInitialized(
          false
        );

        setSelectedAvailableIds(
          []
        );

        setSelectedAssignedIds(
          []
        );

        onSaved?.(
          workingProductIds.length
        );
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update collection products."
          )
        );
      }
    };

  const isLoading =
    isLoadingProducts ||
    isLoadingAssigned;

  const hasError =
    isProductsError ||
    isAssignedError;

  if (
    isLoading
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <div className="text-center">
          <LoaderCircle
            size={26}
            className="mx-auto animate-spin text-[#6d7175]"
          />

          <p className="mt-3 text-sm text-[#6d7175]">
            Loading collection
            products...
          </p>
        </div>
      </div>
    );
  }

  if (
    hasError
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-base font-semibold text-[#202223]">
            Unable to load products
          </h2>

          <p className="mt-2 text-sm text-[#6d7175]">
            Check the product and
            collection product API
            routes.
          </p>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            <RefreshCw
              size={16}
            />

            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex flex-col gap-4 border-b border-[#e1e3e5] pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#202223]">
            Collection products
          </h2>

          <p className="mt-1 text-sm leading-5 text-[#6d7175]">
            Select products from the
            catalog and add them to this
            collection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              isFetchingProducts ||
              isFetchingAssigned ||
              isSaving
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                isFetchingProducts ||
                isFetchingAssigned
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={
              handleReset
            }
            disabled={
              !hasUnsavedChanges ||
              isSaving ||
              disabled
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              !hasUnsavedChanges ||
              isSaving ||
              disabled
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save
                size={17}
              />
            )}

            {isSaving
              ? "Saving..."
              : "Save assignments"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_70px_minmax(0,1fr)]">
        <ProductPanel
          title="Available products"
          count={
            availableProducts.length
          }
          totalCount={
            productsResponse
              ?.pagination
              .totalItems
          }
          search={
            availableSearch
          }
          searchPlaceholder="Search catalog products..."
          onSearchChange={
            setAvailableSearch
          }
          products={
            availableProducts
          }
          selectedIds={
            selectedAvailableIds
          }
          onToggle={
            handleToggleAvailable
          }
          onSelectAll={
            handleSelectAllAvailable
          }
          emptyTitle="No available products"
          emptyDescription={
            availableSearch
              ? "No catalog products match your search."
              : "All loaded products are already assigned to this collection."
          }
          isFetching={
            isFetchingProducts
          }
        />

        <div className="flex items-center justify-center">
          <div className="flex w-full flex-row justify-center gap-2 xl:flex-col">
            <button
              type="button"
              title="Add selected products"
              aria-label="Add selected products"
              onClick={
                handleAddProducts
              }
              disabled={
                selectedAvailableIds.length ===
                  0 ||
                isSaving ||
                disabled
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#303030] text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight
                size={18}
                className="hidden xl:block"
              />

              <ArrowRight
                size={18}
                className="rotate-90 xl:hidden"
              />
            </button>

            <button
              type="button"
              title="Remove selected products"
              aria-label="Remove selected products"
              onClick={
                handleRemoveProducts
              }
              disabled={
                selectedAssignedIds.length ===
                  0 ||
                isSaving ||
                disabled
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft
                size={18}
                className="hidden xl:block"
              />

              <ArrowLeft
                size={18}
                className="rotate-90 xl:hidden"
              />
            </button>
          </div>
        </div>

        <ProductPanel
          title="Products in collection"
          count={
            selectedProducts.length
          }
          totalCount={
            workingProductIds.length
          }
          search={
            selectedSearch
          }
          searchPlaceholder="Search selected products..."
          onSearchChange={
            setSelectedSearch
          }
          products={
            selectedProducts
          }
          selectedIds={
            selectedAssignedIds
          }
          onToggle={
            handleToggleAssigned
          }
          onSelectAll={
            handleSelectAllAssigned
          }
          emptyTitle="No products assigned"
          emptyDescription={
            selectedSearch
              ? "No assigned products match your search."
              : "Select catalog products and add them to this collection."
          }
          isFetching={
            isFetchingAssigned
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#202223]">
            {
              workingProductIds.length
            }{" "}
            {workingProductIds.length ===
            1
              ? "product"
              : "products"}{" "}
            selected
          </p>

          <p className="mt-1 text-xs text-[#6d7175]">
            Changes are not applied
            until you save the
            assignments.
          </p>
        </div>

        {hasUnsavedChanges ? (
          <span className="inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Unsaved changes
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">
            <Check
              size={13}
            />

            Up to date
          </span>
        )}
      </div>
    </div>
  );
}

interface ProductPanelProps {
  title:
    string;

  count:
    number;

  totalCount?:
    number;

  search:
    string;

  searchPlaceholder:
    string;

  onSearchChange: (
    value:
      string
  ) => void;

  products:
    Product[];

  selectedIds:
    string[];

  onToggle: (
    productId:
      string
  ) => void;

  onSelectAll:
    () => void;

  emptyTitle:
    string;

  emptyDescription:
    string;

  isFetching:
    boolean;
}

function ProductPanel({
  title,
  count,
  totalCount,
  search,
  searchPlaceholder,
  onSearchChange,
  products,
  selectedIds,
  onToggle,
  onSelectAll,
  emptyTitle,
  emptyDescription,
  isFetching,
}: ProductPanelProps) {
  const allVisibleSelected =
    products.length >
      0 &&
    products.every(
      (
        product
      ) =>
        selectedIds.includes(
          product.id
        )
    );

  return (
    <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
      <div className="border-b border-[#e1e3e5] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#202223]">
              {title}
            </h3>

            <p className="mt-1 text-xs text-[#6d7175]">
              {count} shown
              {typeof totalCount ===
                "number" &&
              totalCount !==
                count
                ? ` of ${totalCount}`
                : ""}
            </p>
          </div>

          {isFetching && (
            <LoaderCircle
              size={17}
              className="animate-spin text-[#6d7175]"
            />
          )}
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              onSearchChange(
                event.target
                  .value
              )
            }
            className="admin-input pl-9"
            placeholder={
              searchPlaceholder
            }
          />
        </div>
      </div>

      <div className="flex min-h-[430px] flex-col">
        <label className="flex cursor-pointer items-center gap-3 border-b border-[#e1e3e5] bg-[#f6f6f7] px-4 py-3">
          <input
            type="checkbox"
            checked={
              allVisibleSelected
            }
            onChange={
              onSelectAll
            }
            disabled={
              products.length ===
              0
            }
            className="h-4 w-4 rounded border-[#8c9196]"
          />

          <span className="text-xs font-semibold text-[#4a4f53]">
            Select all visible
          </span>
        </label>

        {products.length ===
        0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f2f3] text-[#6d7175]">
              <ImageIcon
                size={21}
              />
            </div>

            <h4 className="mt-4 text-sm font-semibold text-[#202223]">
              {emptyTitle}
            </h4>

            <p className="mt-2 max-w-xs text-xs leading-5 text-[#6d7175]">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto">
            {products.map(
              (
                product
              ) => (
                <ProductRow
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  selected={
                    selectedIds.includes(
                      product.id
                    )
                  }
                  onToggle={() =>
                    onToggle(
                      product.id
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

interface ProductRowProps {
  product:
    Product;

  selected:
    boolean;

  onToggle:
    () => void;
}

function ProductRow({
  product,
  selected,
  onToggle,
}: ProductRowProps) {
  const imageUrl =
    getProductImageUrl(
      product
    );

  const sku =
    getProductSku(
      product
    );

  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-3 border-b border-[#f1f2f3] px-4 py-3 transition last:border-b-0",
        selected
          ? "bg-blue-50"
          : "hover:bg-[#fafafa]",
      ].join(
        " "
      )}
    >
      <input
        type="checkbox"
        checked={
          selected
        }
        onChange={
          onToggle
        }
        className="mt-4 h-4 w-4 shrink-0 rounded border-[#8c9196]"
      />

      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              imageUrl
            }
            alt={
              product.name
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon
            size={18}
            className="text-[#8c9196]"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[#202223]">
            {product.name}
          </p>

          <ProductStatusBadge
            status={
              product.status
            }
          />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6d7175]">
          {sku && (
            <span className="font-mono">
              {sku}
            </span>
          )}

          {product.brand
            ?.name && (
            <>
              <span>
                •
              </span>

              <span>
                {
                  product
                    .brand
                    .name
                }
              </span>
            </>
          )}

          {product
            .primaryCategory
            ?.name && (
            <>
              <span>
                •
              </span>

              <span>
                {
                  product
                    .primaryCategory
                    .name
                }
              </span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] uppercase tracking-wide text-[#8c9196]">
          {
            product.productType
          }
          {product.variants
            ?.length
            ? ` · ${product.variants.length} ${
                product.variants
                  .length ===
                1
                  ? "variant"
                  : "variants"
              }`
            : ""}
        </p>
      </div>
    </label>
  );
}

function ProductStatusBadge({
  status,
}: {
  status:
    Product["status"];
}) {
  const classes:
    Record<
      Product["status"],
      string
    > = {
      ACTIVE:
        "bg-green-100 text-green-800",

      DRAFT:
        "bg-amber-100 text-amber-800",

      INACTIVE:
        "bg-[#e4e5e7] text-[#6d7175]",

      ARCHIVED:
        "bg-red-100 text-red-800",
    };

  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        classes[
          status
        ],
      ].join(
        " "
      )}
    >
      {status}
    </span>
  );
}

function extractAssignedProducts(
  response:
    unknown
): Product[] {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return [];
  }

  const typedResponse =
    response as {
      data?:
        unknown;

      products?:
        unknown;
    };

  const rawData =
    typedResponse.data ??
    typedResponse.products;

  if (
    !Array.isArray(
      rawData
    )
  ) {
    return [];
  }

  return rawData
    .map(
      (
        item
      ) =>
        extractProductFromAssignment(
          item
        )
    )
    .filter(
      (
        product
      ): product is Product =>
        Boolean(
          product
        )
    );
}

function extractProductFromAssignment(
  item:
    unknown
): Product | null {
  if (
    !item ||
    typeof item !==
      "object"
  ) {
    return null;
  }

  const assignment =
    item as
      CollectionAssignedProduct &
      Product & {
        product?:
          Product | null;
      };

  if (
    assignment.product?.id
  ) {
    return assignment.product;
  }

  if (
    assignment.id &&
    assignment.name
  ) {
    return assignment as Product;
  }

  return null;
}

function matchesProductSearch(
  product:
    Product,
  normalizedSearch:
    string
): boolean {
  if (
    !normalizedSearch
  ) {
    return true;
  }

  const searchableValues =
    [
      product.name,
      product.slug,
      product.parentSku,
      product.brand
        ?.name,
      product
        .primaryCategory
        ?.name,
      ...(
        product.variants ||
        []
      ).flatMap(
        (
          variant
        ) => [
          variant.name,
          variant.sku,
          variant.barcode,
        ]
      ),
    ];

  return searchableValues.some(
    (
      value
    ) =>
      String(
        value ||
          ""
      )
        .toLowerCase()
        .includes(
          normalizedSearch
        )
  );
}

function getProductSku(
  product:
    Product
): string | null {
  if (
    product.parentSku
  ) {
    return product.parentSku;
  }

  const defaultVariant =
    product.variants?.find(
      (
        variant
      ) =>
        variant.isDefault
    );

  if (
    defaultVariant?.sku
  ) {
    return defaultVariant.sku;
  }

  return (
    product.variants?.[0]
      ?.sku ||
    null
  );
}

function getProductImageUrl(
  product:
    Product
): string | null {
  const activeImages =
    (
      product.images ||
      []
    )
      .filter(
        (
          image
        ) =>
          image.isActive !==
          false
      )
      .sort(
        (
          first,
          second
        ) =>
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
      (
        image
      ) =>
        image.imageRole ===
        "PRIMARY"
    ) ||
    activeImages[0];

  const asset =
    primaryImage?.mediaAsset;

  if (!asset) {
    return null;
  }

  const flexibleAsset =
    asset as typeof asset & {
      publicUrl?:
        string | null;

      url?:
        string | null;

      variants?: Array<{
        publicUrl?:
          string | null;

        url?:
          string | null;

        isPrimary?:
          boolean;

        variantType?:
          string;
      }>;
    };

  const variants =
    flexibleAsset.variants ||
    [];

  const primaryVariant =
    variants.find(
      (
        variant
      ) =>
        variant.isPrimary &&
        (
          variant.publicUrl
          
        )
    );

  if (
    primaryVariant
  ) {
    return (
      primaryVariant.publicUrl ||      
      null
    );
  }

  const thumbnailVariant =
    variants.find(
      (
        variant
      ) =>
        [
          "THUMBNAIL",
          "SMALL",
          "MEDIUM",
        ].includes(
          String(
            variant.variantType ||
              ""
          ).toUpperCase()
        ) &&
        (
          variant.publicUrl         
        )
    );

  if (
    thumbnailVariant
  ) {
    return (
      thumbnailVariant.publicUrl ||      
      null
    );
  }

  return (
    flexibleAsset.publicUrl ||
    flexibleAsset.url ||
    variants[0]
      ?.publicUrl ||
    variants[0]?.url ||
    null
  );
}

function getApiErrorMessage(
  error:
    unknown,
  fallback:
    string
): string {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return fallback;
  }

  const apiError =
    error as {
      data?: {
        error?: {
          message?:
            string;
        };

        message?:
          string;

        errors?: Array<{
          message?:
            string;
        }>;
      };
    };

  return (
    apiError.data?.error
      ?.message ||
    apiError.data?.message ||
    apiError.data
      ?.errors?.[0]
      ?.message ||
    fallback
  );
}