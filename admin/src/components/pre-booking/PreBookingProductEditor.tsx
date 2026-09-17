"use client";

import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useCreatePreBookingCampaignProductMutation,
  useDeletePreBookingCampaignProductMutation,
  useUpdatePreBookingCampaignProductMutation,
} from "@/store/api/preBookingApi";

import {
  useGetProductsQuery,
} from "@/store/api/productApi";

import PreBookingAllocationEditor from "./PreBookingAllocationEditor";
import PreBookingBundleEditor from "./PreBookingBundleEditor";

import type {
  PreBookingCampaignProduct,
} from "@/types/preBooking";

import type {
  Product,
} from "@/types/product";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface PreBookingProductEditorProps {
  campaignId:
    string;

  campaignProducts:
    PreBookingCampaignProduct[];

  onChanged?:
    () => void;
}

/*
|--------------------------------------------------------------------------
| Campaign Product Form
|--------------------------------------------------------------------------
*/

interface CampaignProductFormValues {
  displayTitle:
    string;

  shortDescription:
    string;

  badgeText:
    string;

  minimumQuantity:
    number;

  maximumQuantityPerOrder:
    number;

  priceOverride:
    number | null;

  currencyCode:
    string;

  isActive:
    boolean;

  sortOrder:
    number;
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

export default function PreBookingProductEditor({
  campaignId,
  campaignProducts,
  onChanged,
}: PreBookingProductEditorProps) {
  const [
    addingProduct,
    setAddingProduct,
  ] =
    useState(
      false
    );

  const sortedProducts =
    useMemo(
      () =>
        [
          ...(
            campaignProducts ||
            []
          ),
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              a.sortOrder ||
              0
            ) -
            Number(
              b.sortOrder ||
              0
            )
        ),
      [
        campaignProducts,
      ]
    );

  return (
    <section className="rounded-xl border border-[#e1e3e5] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e1e3e5] p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#202223]">
            Pre-booking products
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6d7175]">
            Add existing catalogue products to this campaign. Each product can use either direct allocation or optional bundles with separate allocations.
          </p>
        </div>

        {!addingProduct ? (
          <button
            type="button"
            onClick={() =>
              setAddingProduct(
                true
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus
              size={
                16
              }
            />

            Add product
          </button>
        ) : null}
      </div>

      <div className="space-y-5 p-5">
        {addingProduct ? (
          <AddProductPanel
            campaignId={
              campaignId
            }
            existingProductIds={
              sortedProducts.map(
                (
                  item
                ) =>
                  item.productId
              )
            }
            onCancel={() =>
              setAddingProduct(
                false
              )
            }
            onChanged={() => {
              setAddingProduct(
                false
              );

              onChanged?.();
            }}
          />
        ) : null}

        {sortedProducts.length ===
        0 ? (
          <EmptyState
            onAdd={() =>
              setAddingProduct(
                true
              )
            }
          />
        ) : (
          <div className="space-y-5">
            {sortedProducts.map(
              (
                campaignProduct
              ) => (
                <ExistingCampaignProduct
                  key={
                    campaignProduct.id
                  }
                  campaignProduct={
                    campaignProduct
                  }
                  onChanged={
                    onChanged
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

/*
|--------------------------------------------------------------------------
| Add Product Panel
|--------------------------------------------------------------------------
*/

function AddProductPanel({
  campaignId,
  existingProductIds,
  onCancel,
  onChanged,
}: {
  campaignId:
    string;

  existingProductIds:
    string[];

  onCancel:
    () => void;

  onChanged:
    () => void;
}) {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<
      Product |
      null
    >(
      null
    );

  const [
    createCampaignProduct,
    {
      isLoading:
        creating,
    },
  ] =
    useCreatePreBookingCampaignProductMutation();

  const {
    data,
    isFetching,
  } =
    useGetProductsQuery({
      page:
        1,

      pageSize:
        50,

      search:
        search.trim() ||
        undefined,

      status:
        "ACTIVE",

      sortBy:
        "name",

      sortDirection:
        "ASC",
    });

  const products =
    useMemo(
      () =>
        (
          data?.data ||
          []
        ).filter(
          (
            product
          ) =>
            !existingProductIds.includes(
              product.id
            )
        ),
      [
        data,
        existingProductIds,
      ]
    );

  const add =
    async () => {
      if (
        !selectedProduct
      ) {
        window.alert(
          "Select a product first."
        );

        return;
      }

      try {
        await createCampaignProduct({
          campaignId,

          body: {
            productId:
              selectedProduct.id,

            displayTitle:
              selectedProduct.name,

            shortDescription:
              selectedProduct
                .shortDescription ||
              null,

            badgeText:
              null,

            minimumQuantity:
              1,

            maximumQuantityPerOrder:
              1,

            priceOverride:
              null,

            currencyCode:
              "AED",

            isActive:
              true,

            sortOrder:
              existingProductIds.length,
          },
        }).unwrap();

        onChanged();
      } catch (
        error: any
      ) {
        window.alert(
          getErrorMessage(
            error,
            "Unable to add product to campaign."
          )
        );
      }
    };

  return (
    <div className="rounded-xl border border-[#d8dde3] bg-[#fafbfb] p-4">
      <div>
        <h3 className="text-sm font-semibold text-[#202223]">
          Add catalogue product
        </h3>

        <p className="mt-1 text-xs leading-5 text-[#6d7175]">
          Search the existing product catalogue and select the product you want to offer for pre-booking.
        </p>
      </div>

      <div className="relative mt-4">
        <Search
          size={
            17
          }
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
        />

        <input
          value={
            search
          }
          onChange={(
            event
          ) => {
            setSearch(
              event
                .target
                .value
            );

            setSelectedProduct(
              null
            );
          }}
          className="admin-input pl-10"
          placeholder="Search product name or SKU..."
        />
      </div>

      <div className="mt-3 max-h-[320px] overflow-y-auto rounded-lg border border-[#e1e3e5] bg-white">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-[#6d7175]">
            <LoaderCircle
              size={
                17
              }
              className="animate-spin"
            />

            Loading products...
          </div>
        ) : products.length ===
          0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#6d7175]">
            No available products found.
          </div>
        ) : (
          products.map(
            (
              product
            ) => {
              const selected =
                selectedProduct
                  ?.id ===
                product.id;

              const defaultVariant =
                product.variants?.find(
                  (
                    variant
                  ) =>
                    variant.isDefault
                ) ||
                product.variants?.[0];

              return (
                <button
                  key={
                    product.id
                  }
                  type="button"
                  onClick={() =>
                    setSelectedProduct(
                      product
                    )
                  }
                  className={[
                    "flex w-full items-center justify-between gap-4 border-b border-[#eef0f2] px-4 py-3 text-left last:border-b-0",
                    selected
                      ? "bg-[#f1f2f3]"
                      : "hover:bg-[#fafbfb]",
                  ].join(
                    " "
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#202223]">
                      {
                        product.name
                      }
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6d7175]">
                      {product.parentSku ? (
                        <span>
                          Parent SKU:{" "}
                          <span className="font-mono">
                            {
                              product.parentSku
                            }
                          </span>
                        </span>
                      ) : null}

                      {defaultVariant?.sku ? (
                        <span>
                          SKU:{" "}
                          <span className="font-mono">
                            {
                              defaultVariant.sku
                            }
                          </span>
                        </span>
                      ) : null}

                      <span>
                        {
                          product.variants
                            ?.length ||
                          0
                        }{" "}
                        variant
                        {(
                          product.variants
                            ?.length ||
                          0
                        ) ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={[
                      "h-4 w-4 shrink-0 rounded-full border",
                      selected
                        ? "border-[#303030] bg-[#303030]"
                        : "border-[#babfc3] bg-white",
                    ].join(
                      " "
                    )}
                  />
                </button>
              );
            }
          )
        )}
      </div>

      {selectedProduct ? (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-800">
            Selected
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {
              selectedProduct.name
            }
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={
            creating
          }
          onClick={
            onCancel
          }
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            creating ||
            !selectedProduct
          }
          onClick={
            add
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {creating ? (
            <LoaderCircle
              size={
                16
              }
              className="animate-spin"
            />
          ) : (
            <PackagePlus
              size={
                16
              }
            />
          )}

          Add product
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Existing Campaign Product
|--------------------------------------------------------------------------
*/

function ExistingCampaignProduct({
  campaignProduct,
  onChanged,
}: {
  campaignProduct:
    PreBookingCampaignProduct;

  onChanged?:
    () => void;
}) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(
      true
    );

  const [
    editing,
    setEditing,
  ] =
    useState(
      false
    );

  const [
    updateCampaignProduct,
    {
      isLoading:
        updating,
    },
  ] =
    useUpdatePreBookingCampaignProductMutation();

  const [
    deleteCampaignProduct,
    {
      isLoading:
        deleting,
    },
  ] =
    useDeletePreBookingCampaignProductMutation();

  const product =
    campaignProduct.product;

  if (!product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">
          Product reference is missing for this campaign product.
        </p>
      </div>
    );
  }

  const update =
    async (
      values:
        CampaignProductFormValues
    ) => {
      try {
        await updateCampaignProduct({
          campaignProductId:
            campaignProduct.id,

          body: {
            displayTitle:
              values.displayTitle.trim() ||
              null,

            shortDescription:
              values.shortDescription.trim() ||
              null,

            badgeText:
              values.badgeText.trim() ||
              null,

            minimumQuantity:
              values.minimumQuantity,

            maximumQuantityPerOrder:
              values.maximumQuantityPerOrder,

            priceOverride:
              values.priceOverride,

            currencyCode:
              values.currencyCode,

            isActive:
              values.isActive,

            sortOrder:
              values.sortOrder,
          },
        }).unwrap();

        setEditing(
          false
        );

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          getErrorMessage(
            error,
            "Unable to update pre-booking product."
          )
        );
      }
    };

  const remove =
    async () => {
      const confirmed =
        window.confirm(
          `Remove "${product.name}" from this pre-booking campaign?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteCampaignProduct(
          campaignProduct.id
        ).unwrap();

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          getErrorMessage(
            error,
            "Unable to remove pre-booking product."
          )
        );
      }
    };

  if (
    editing
  ) {
    return (
      <CampaignProductForm
        initialValues={{
          displayTitle:
            campaignProduct.displayTitle ||
            product.name,

          shortDescription:
            campaignProduct.shortDescription ||
            "",

          badgeText:
            campaignProduct.badgeText ||
            "",

          minimumQuantity:
            Number(
              campaignProduct.minimumQuantity ||
              1
            ),

          maximumQuantityPerOrder:
            Number(
              campaignProduct.maximumQuantityPerOrder ||
              1
            ),

          priceOverride:
            campaignProduct.priceOverride ===
              null ||
            campaignProduct.priceOverride ===
              undefined
              ? null
              : Number(
                  campaignProduct.priceOverride
                ),

          currencyCode:
            campaignProduct.currencyCode ||
            "AED",

          isActive:
            campaignProduct.isActive,

          sortOrder:
            Number(
              campaignProduct.sortOrder ||
              0
            ),
        }}
        isSaving={
          updating
        }
        onCancel={() =>
          setEditing(
            false
          )
        }
        onSave={
          update
        }
      />
    );
  }

  const bundles =
    campaignProduct.bundles ||
    [];

  /*
   * A campaign-product association may include all allocations
   * depending on association loading. For direct allocation we
   * explicitly keep only records where bundleId is null.
   */
  const directAllocations =
    (
      campaignProduct.allocations ||
      []
    ).filter(
      (
        allocation
      ) =>
        !allocation.bundleId
    );

  return (
    <section className="overflow-hidden rounded-xl border border-[#d8dde3] bg-white">
      {/* Product Header */}

      <div className="bg-[#fafbfb] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[#202223]">
                {
                  campaignProduct.displayTitle ||
                  product.name
                }
              </h3>

              {campaignProduct.badgeText ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {
                    campaignProduct.badgeText
                  }
                </span>
              ) : null}

              {!campaignProduct.isActive ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Disabled
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-[#6d7175]">
              {
                product.name
              }

              {product.parentSku
                ? ` · ${product.parentSku}`
                : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 font-semibold text-[#4a4d50]">
                {
                  product.variants
                    ?.length ||
                  0
                }{" "}
                variants
              </span>

              <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 font-semibold text-[#4a4d50]">
                {
                  bundles.length
                }{" "}
                bundles
              </span>

              <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 font-semibold text-[#4a4d50]">
                {
                  directAllocations.length
                }{" "}
                direct allocations
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() =>
                setEditing(
                  true
                )
              }
              className="h-9 rounded-lg border border-[#babfc3] bg-white px-3 text-xs font-semibold hover:bg-[#f6f6f7]"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={
                deleting
              }
              onClick={
                remove
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
              title="Remove product"
            >
              {deleting ? (
                <LoaderCircle
                  size={
                    15
                  }
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={
                    15
                  }
                />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white hover:bg-[#f6f6f7]"
              aria-label={
                expanded
                  ? "Collapse product"
                  : "Expand product"
              }
            >
              {expanded ? (
                <ChevronUp
                  size={
                    16
                  }
                />
              ) : (
                <ChevronDown
                  size={
                    16
                  }
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-7 border-t border-[#e1e3e5] p-4">
          {/* Direct Allocation */}

          <section>
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[#202223]">
                  Direct pre-booking allocation
                </h4>

                <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                  Use this when the customer can pre-book the product without selecting a bundle.
                </p>
              </div>

              <PreBookingAllocationEditor
                mode="PRODUCT"
                campaignProductId={
                  campaignProduct.id
                }
                variants={
                  product.variants ||
                  []
                }
                allocations={
                  directAllocations
                }
                onChanged={
                  onChanged
                }
              />
            </div>
          </section>

          {/* Bundles */}

          <section className="border-t border-[#e1e3e5] pt-6">
            <PreBookingBundleEditor
              campaignProductId={
                campaignProduct.id
              }
              parentProduct={
                product
              }
              bundles={
                bundles
              }
              onChanged={
                onChanged
              }
            />
          </section>
        </div>
      ) : null}
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Campaign Product Form
|--------------------------------------------------------------------------
*/

function CampaignProductForm({
  initialValues,
  isSaving = false,
  onSave,
  onCancel,
}: {
  initialValues:
    CampaignProductFormValues;

  isSaving?:
    boolean;

  onSave: (
    values:
      CampaignProductFormValues
  ) => Promise<void>;

  onCancel:
    () => void;
}) {
  const [
    values,
    setValues,
  ] =
    useState<
      CampaignProductFormValues
    >(
      initialValues
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const busy =
    saving ||
    isSaving;

  const set = <
    K extends keyof CampaignProductFormValues,
  >(
    field: K,
    value:
      CampaignProductFormValues[K]
  ) => {
    setValues(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  };

  const submit =
    async () => {
      if (
        values.minimumQuantity <
        1
      ) {
        window.alert(
          "Minimum quantity must be at least 1."
        );

        return;
      }

      if (
        values.maximumQuantityPerOrder <
        values.minimumQuantity
      ) {
        window.alert(
          "Maximum quantity per order cannot be lower than minimum quantity."
        );

        return;
      }

      if (
        values.priceOverride !==
          null &&
        values.priceOverride <
          0
      ) {
        window.alert(
          "Price override cannot be negative."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        await onSave(
          values
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <div className="rounded-xl border border-[#d8dde3] bg-[#fafbfb] p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel>
            Customer-facing title
          </FieldLabel>

          <input
            value={
              values.displayTitle
            }
            onChange={(
              event
            ) =>
              set(
                "displayTitle",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>
            Short description
          </FieldLabel>

          <textarea
            rows={
              3
            }
            value={
              values.shortDescription
            }
            onChange={(
              event
            ) =>
              set(
                "shortDescription",
                event
                  .target
                  .value
              )
            }
            className="admin-input min-h-[90px]"
          />
        </div>

        <div>
          <FieldLabel>
            Badge
          </FieldLabel>

          <input
            value={
              values.badgeText
            }
            onChange={(
              event
            ) =>
              set(
                "badgeText",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
            placeholder="Pre-Book Now"
          />
        </div>

        <div>
          <FieldLabel>
            Currency
          </FieldLabel>

          <input
            maxLength={
              3
            }
            value={
              values.currencyCode
            }
            onChange={(
              event
            ) =>
              set(
                "currencyCode",
                event
                  .target
                  .value
                  .toUpperCase()
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Minimum quantity
          </FieldLabel>

          <input
            type="number"
            min={
              1
            }
            value={
              values.minimumQuantity
            }
            onChange={(
              event
            ) =>
              set(
                "minimumQuantity",
                Math.max(
                  1,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    1
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Maximum quantity per order
          </FieldLabel>

          <input
            type="number"
            min={
              1
            }
            value={
              values.maximumQuantityPerOrder
            }
            onChange={(
              event
            ) =>
              set(
                "maximumQuantityPerOrder",
                Math.max(
                  1,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    1
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Price override
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            step="0.01"
            value={
              values.priceOverride ??
              ""
            }
            onChange={(
              event
            ) =>
              set(
                "priceOverride",
                event
                  .target
                  .value ===
                  ""
                  ? null
                  : Number(
                      event
                        .target
                        .value
                    )
              )
            }
            className="admin-input"
            placeholder="Leave blank to use normal price"
          />

          <p className="mt-1 text-xs text-[#6d7175]">
            Leave blank to use the normal resolved product price.
          </p>
        </div>

        <div>
          <FieldLabel>
            Sort order
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            value={
              values.sortOrder
            }
            onChange={(
              event
            ) =>
              set(
                "sortOrder",
                Math.max(
                  0,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    0
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-start gap-3 rounded-lg border border-[#babfc3] bg-white p-4">
            <input
              type="checkbox"
              checked={
                values.isActive
              }
              onChange={(
                event
              ) =>
                set(
                  "isActive",
                  event
                    .target
                    .checked
                )
              }
              className="mt-1"
            />

            <span>
              <span className="block text-sm font-semibold text-[#202223]">
                Active for pre-booking
              </span>

              <span className="mt-1 block text-xs text-[#6d7175]">
                Disable this product without removing it from the campaign.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={
            busy
          }
          onClick={
            onCancel
          }
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            busy
          }
          onClick={
            submit
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle
              size={
                16
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                16
              }
            />
          )}

          Save product
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyState({
  onAdd,
}: {
  onAdd:
    () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] px-6 py-12 text-center">
      <PackagePlus
        size={
          28
        }
        className="mx-auto text-[#8c9196]"
      />

      <h3 className="mt-3 text-base font-semibold text-[#202223]">
        No products added
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7175]">
        Add an existing catalogue product to start configuring pre-booking allocations and optional bundles.
      </p>

      <button
        type="button"
        onClick={
          onAdd
        }
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
      >
        <Plus
          size={
            16
          }
        />

        Add product
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Field Label
|--------------------------------------------------------------------------
*/

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#202223]">
      {
        children
      }
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error: any,
  fallback:
    string
) {
  return (
    error?.data
      ?.error
      ?.message ||
    error?.data
      ?.message ||
    fallback
  );
}