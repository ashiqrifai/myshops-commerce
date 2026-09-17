"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Plus,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useCreateAttributeMutation,
  useCreateAttributeOptionMutation,
  useGetAttributesQuery,
} from "@/store/api/attributeApi";

import {
  useExecuteProductMergeMutation,
  usePreviewProductMergeMutation,
} from "@/store/api/productApi";

import type {
  ProductMergePreviewResponse,
  ProductMergePreviewVariant,
} from "@/store/api/productApi";

import type {
  Product,
  ProductVariant,
} from "@/types/product";

import type {
  Attribute,
  AttributeInputType,
} from "@/types/attribute";

type Step =
  | "PARENT"
  | "ATTRIBUTES"
  | "MAPPING"
  | "PREVIEW";

interface SelectedAttribute {
  attributeId: string;
}

interface VariantRow {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  barcode?: string | null;
}

interface Props {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onCompleted: (
    parentProductId: string
  ) => void;
}

const slugify = (
  value: string
) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .replace(
      /-{2,}/g,
      "-"
    );

const buildParentSkuSuggestion =
  (
    value: string
  ) =>
    value
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        ""
      )
      .slice(
        0,
        50
      );

export default function ProductMergeWizard({
  open,
  products,
  onClose,
  onCompleted,
}: Props) {
  const [
    step,
    setStep,
  ] =
    useState<Step>(
      "PARENT"
    );

  const [
    parentProductId,
    setParentProductId,
  ] =
    useState("");

  const [
    parentName,
    setParentName,
  ] =
    useState("");

  const [
    parentSlug,
    setParentSlug,
  ] =
    useState("");

  const [
    parentSku,
    setParentSku,
  ] =
    useState("");

  const [
    defaultVariantId,
    setDefaultVariantId,
  ] =
    useState("");

  const [
    selectedAttributes,
    setSelectedAttributes,
  ] =
    useState<
      SelectedAttribute[]
    >([]);

  const [
    mapping,
    setMapping,
  ] =
    useState<
      Record<
        string,
        Record<
          string,
          string
        >
      >
    >({});

  const [
    quickAttributeOpen,
    setQuickAttributeOpen,
  ] =
    useState(false);

  const [
    quickOptionAttributeId,
    setQuickOptionAttributeId,
  ] =
    useState<
      string | null
    >(null);

  const {
    data:
      attributeData,
    isLoading:
      attributesLoading,
    refetch:
      refetchAttributes,
  } =
    useGetAttributesQuery({
      page:
        1,
      pageSize:
        500,
      isActive:
        true,
      isVariantDefining:
        true,
      sortBy:
        "displayOrder",
      sortDirection:
        "ASC",
    });

  const [
    previewMerge,
    {
      data:
        preview,
      isLoading:
        previewing,
      reset:
        resetPreview,
    },
  ] =
    usePreviewProductMergeMutation();

  const [
    executeMerge,
    {
      isLoading:
        executing,
    },
  ] =
    useExecuteProductMergeMutation();

  const attributes =
    useMemo(
      () =>
        (
          attributeData?.data ||
          []
        ).filter(
          (
            attribute
          ) =>
            attribute
              .isVariantDefining &&
            attribute
              .isActive
        ),
      [
        attributeData,
      ]
    );

  const parentProduct =
    useMemo(
      () =>
        products.find(
          (
            product
          ) =>
            product.id ===
            parentProductId
        ) ||
        products[0] ||
        null,
      [
        products,
        parentProductId,
      ]
    );

  const variantRows =
    useMemo(
      () =>
        products.flatMap(
          (
            product
          ) =>
            (
              product.variants ||
              []
            )
              .filter(
                (
                  variant: ProductVariant
                ) =>
                  variant.status !==
                  "ARCHIVED"
              )
              .map(
                (
                  variant: ProductVariant
                ) => ({
                  productId:
                    product.id,
                  productName:
                    product.name,
                  variantId:
                    variant.id ||
                    "",
                  sku:
                    variant.sku,
                  barcode:
                    variant.barcode ||
                    null,
                })
              )
        ),
      [
        products,
      ]
    );

  useEffect(
    () => {
      if (
        !open ||
        !products.length
      ) {
        return;
      }

      const first =
        products[0];

      const firstVariant =
        first
          .variants?.find(
            (
              variant: ProductVariant
            ) =>
              variant.status !==
              "ARCHIVED"
          );

      setStep(
        "PARENT"
      );

      setParentProductId(
        first.id
      );

      const suggestedName =
        deriveCommonName(
          products.map(
            (
              item
            ) =>
              item.name
          )
        ) ||
        first.name;

      setParentName(
        suggestedName
      );

      setParentSlug(
        slugify(
          suggestedName
        )
      );

      setParentSku(
        first.parentSku ||
          buildParentSkuSuggestion(
            suggestedName
          )
      );

      setDefaultVariantId(
        firstVariant?.id ||
        ""
      );

      setSelectedAttributes(
        []
      );

      setMapping(
        {}
      );

      setQuickAttributeOpen(
        false
      );

      setQuickOptionAttributeId(
        null
      );

      resetPreview();
    },
    [
      open,
      products,
      resetPreview,
    ]
  );

  useEffect(
    () => {
      if (
        !parentProduct
      ) {
        return;
      }

      const firstVariant =
        parentProduct
          .variants?.find(
            (
              variant: ProductVariant
            ) =>
              variant.status !==
              "ARCHIVED"
          );

      if (
        firstVariant?.id
      ) {
        setDefaultVariantId(
          firstVariant.id
        );
      }
    },
    [
      parentProduct,
    ]
  );

  const selectedAttributeModels =
    selectedAttributes
      .map(
        (
          item
        ) =>
          attributes.find(
            (
              attribute
            ) =>
              attribute.id ===
              item.attributeId
          ) ||
          null
      )
      .filter(
        (
          item
        ): item is Attribute =>
          Boolean(
            item
          )
      );

  const allProductsSingleVariant =
    products.every(
      (
        product
      ) =>
        (
          product.variants ||
          []
        ).filter(
          (
            variant
          ) =>
            variant.status !==
            "ARCHIVED"
        ).length ===
        1
    );

  const mappingComplete =
    variantRows.length >
      0 &&
    selectedAttributeModels.length >
      0 &&
    variantRows.every(
      (
        row
      ) =>
        selectedAttributeModels.every(
          (
            attribute
          ) =>
            Boolean(
              mapping[
                row.variantId
              ]?.[
                attribute.id
              ]
            )
        )
    );

  const duplicateCombination =
    useMemo(
      () => {
        if (
          !mappingComplete
        ) {
          return false;
        }

        const keys =
          variantRows.map(
            (
              row
            ) =>
              selectedAttributeModels
                .map(
                  (
                    attribute
                  ) =>
                    `${
                      attribute.id
                    }:${
                      mapping[
                        row.variantId
                      ]?.[
                        attribute.id
                      ]
                    }`
                )
                .sort()
                .join(
                  "|"
                )
          );

        return (
          new Set(
            keys
          ).size !==
          keys.length
        );
      },
      [
        mapping,
        mappingComplete,
        selectedAttributeModels,
        variantRows,
      ]
    );

  if (
    !open
  ) {
    return null;
  }

  const buildRequest =
    () => ({
      sourceProductIds:
        products.map(
          (
            product
          ) =>
            product.id
        ),

      parentProductId,

      defaultVariantId:
        defaultVariantId ||
        null,

      parent: {
        name:
          parentName.trim(),
        slug:
          parentSlug
            .trim()
            .toLowerCase(),
        parentSku:
          parentSku
            .trim()
            .toUpperCase(),
      },

      variantMappings:
        variantRows.map(
          (
            row
          ) => ({
            productId:
              row.productId,
            variantId:
              row.variantId,
            attributes:
              selectedAttributeModels.map(
                (
                  attribute,
                  index
                ) => ({
                  attributeId:
                    attribute.id,
                  optionId:
                    mapping[
                      row.variantId
                    ]?.[
                      attribute.id
                    ],
                  sortOrder:
                    index,
                })
              ),
          })
        ),
    });

  const runPreview =
    async () => {
      if (
        !mappingComplete ||
        duplicateCombination
      ) {
        return;
      }

      try {
        await previewMerge(
          buildRequest()
        ).unwrap();

        setStep(
          "PREVIEW"
        );
      } catch (
        error: any
      ) {
        window.alert(
          getApiErrorMessage(
            error,
            "Unable to preview product merge."
          )
        );
      }
    };

  const confirmMerge =
    async () => {
      if (
        !preview
          ?.canExecute
      ) {
        return;
      }

      if (
        !window.confirm(
          `Merge ${products.length} products into "${parentName}"? The other ${Math.max(
            0,
            products.length -
              1
          )} product records will be archived.`
        )
      ) {
        return;
      }

      try {
        const result =
          await executeMerge(
            buildRequest()
          ).unwrap();

        onCompleted(
          result.data
            .parentProductId
        );
      } catch (
        error: any
      ) {
        window.alert(
          getApiErrorMessage(
            error,
            "Unable to execute product merge."
          )
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-3 md:p-6">
      <div className="flex max-h-[94vh] w-full max-w-[1450px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e1e3e5] px-5 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7175]">
              Catalogue tools
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Merge existing products into one variable product
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Existing child variant IDs, SKUs, pricing, inventory and Zoho references are preserved.
            </p>
          </div>

          <button
            type="button"
            disabled={
              executing
            }
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
            aria-label="Close merge wizard"
          >
            <X
              size={
                19
              }
            />
          </button>
        </header>

        <StepHeader
          step={
            step
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
          {!allProductsSingleVariant ? (
            <div className="rounded-xl border border-[#f1c87a] bg-[#fff7e3] p-4 text-sm text-[#72510d]">
              This first merge workflow supports existing products with exactly one non-archived variant each. One or more selected products do not meet that condition.
            </div>
          ) : step ===
            "PARENT" ? (
            <ParentStep
              products={
                products
              }
              parentProductId={
                parentProductId
              }
              parentName={
                parentName
              }
              parentSlug={
                parentSlug
              }
              parentSku={
                parentSku
              }
              defaultVariantId={
                defaultVariantId
              }
              variantRows={
                variantRows
              }
              onParentProductChange={
                setParentProductId
              }
              onParentNameChange={(
                value
              ) => {
                setParentName(
                  value
                );
              }}
              onParentSlugChange={
                setParentSlug
              }
              onParentSkuChange={
                setParentSku
              }
              onDefaultVariantChange={
                setDefaultVariantId
              }
            />
          ) : step ===
            "ATTRIBUTES" ? (
            <AttributesStep
              attributes={
                attributes
              }
              loading={
                attributesLoading
              }
              selectedAttributes={
                selectedAttributes
              }
              onChange={
                setSelectedAttributes
              }
              onQuickCreate={() =>
                setQuickAttributeOpen(
                  true
                )
              }
              onAddOption={(
                attributeId
              ) =>
                setQuickOptionAttributeId(
                  attributeId
                )
              }
            />
          ) : step ===
            "MAPPING" ? (
            <MappingStep
              rows={
                variantRows
              }
              attributes={
                selectedAttributeModels
              }
              mapping={
                mapping
              }
              duplicateCombination={
                duplicateCombination
              }
              onChange={(
                variantId,
                attributeId,
                optionId
              ) =>
                setMapping(
                  (
                    current
                  ) => ({
                    ...current,
                    [
                      variantId
                    ]: {
                      ...(
                        current[
                          variantId
                        ] ||
                        {}
                      ),
                      [
                        attributeId
                      ]:
                        optionId,
                    },
                  })
                )
              }
              onAddOption={(
                attributeId
              ) =>
                setQuickOptionAttributeId(
                  attributeId
                )
              }
            />
          ) : (
            <PreviewStep
              preview={
                preview
              }
              previewing={
                previewing
              }
            />
          )}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e1e3e5] bg-[#fafbfb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            {step !==
              "PARENT" && (
              <button
                type="button"
                disabled={
                  executing
                }
                onClick={() => {
                  if (
                    step ===
                    "ATTRIBUTES"
                  ) {
                    setStep(
                      "PARENT"
                    );
                  } else if (
                    step ===
                    "MAPPING"
                  ) {
                    setStep(
                      "ATTRIBUTES"
                    );
                  } else {
                    setStep(
                      "MAPPING"
                    );
                  }
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7] disabled:opacity-50"
              >
                <ArrowLeft
                  size={
                    16
                  }
                />
                Back
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={
                executing
              }
              onClick={
                onClose
              }
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7] disabled:opacity-50"
            >
              Cancel
            </button>

            {step ===
            "PARENT" ? (
              <button
                type="button"
                disabled={
                  !parentProductId ||
                  !parentName.trim() ||
                  !parentSlug.trim() ||
                  !parentSku.trim() ||
                  !defaultVariantId ||
                  !allProductsSingleVariant
                }
                onClick={() =>
                  setStep(
                    "ATTRIBUTES"
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next
                <ArrowRight
                  size={
                    16
                  }
                />
              </button>
            ) : step ===
              "ATTRIBUTES" ? (
              <button
                type="button"
                disabled={
                  selectedAttributes.length ===
                  0
                }
                onClick={() =>
                  setStep(
                    "MAPPING"
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Map variants
                <ArrowRight
                  size={
                    16
                  }
                />
              </button>
            ) : step ===
              "MAPPING" ? (
              <button
                type="button"
                disabled={
                  !mappingComplete ||
                  duplicateCombination ||
                  previewing
                }
                onClick={
                  runPreview
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {previewing ? (
                  <LoaderCircle
                    size={
                      16
                    }
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={
                      16
                    }
                  />
                )}
                Preview merge
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  !preview
                    ?.canExecute ||
                  executing
                }
                onClick={
                  confirmMerge
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {executing && (
                  <LoaderCircle
                    size={
                      16
                    }
                    className="animate-spin"
                  />
                )}
                {executing
                  ? "Merging..."
                  : "Confirm merge"}
              </button>
            )}
          </div>
        </footer>
      </div>

      {quickAttributeOpen && (
        <QuickCreateAttributeModal
          parentCategoryId={
            parentProduct
              ?.primaryCategoryId ||
            null
          }
          onClose={() =>
            setQuickAttributeOpen(
              false
            )
          }
          onCreated={async (
            attributeId
          ) => {
            setQuickAttributeOpen(
              false
            );

            await refetchAttributes();

            setSelectedAttributes(
              (
                current
              ) =>
                current.some(
                  (
                    item
                  ) =>
                    item.attributeId ===
                    attributeId
                )
                  ? current
                  : [
                      ...current,
                      {
                        attributeId,
                      },
                    ]
            );
          }}
        />
      )}

      {quickOptionAttributeId && (
        <QuickAddOptionModal
          attribute={
            attributes.find(
              (
                item
              ) =>
                item.id ===
                quickOptionAttributeId
            ) ||
            null
          }
          onClose={() =>
            setQuickOptionAttributeId(
              null
            )
          }
          onCreated={async () => {
            setQuickOptionAttributeId(
              null
            );

            await refetchAttributes();
          }}
        />
      )}
    </div>
  );
}

function StepHeader({
  step,
}: {
  step: Step;
}) {
  const steps: Array<{
    id: Step;
    label: string;
  }> = [
    {
      id:
        "PARENT",
      label:
        "1. Parent",
    },
    {
      id:
        "ATTRIBUTES",
      label:
        "2. Attributes",
    },
    {
      id:
        "MAPPING",
      label:
        "3. Mapping",
    },
    {
      id:
        "PREVIEW",
      label:
        "4. Preview",
    },
  ];

  const activeIndex =
    steps.findIndex(
      (
        item
      ) =>
        item.id ===
        step
    );

  return (
    <div className="grid shrink-0 grid-cols-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
      {steps.map(
        (
          item,
          index
        ) => (
          <div
            key={
              item.id
            }
            className={[
              "px-2 py-3 text-center text-xs font-semibold sm:text-sm",
              index <=
              activeIndex
                ? "text-[#202223]"
                : "text-[#8c9196]",
            ].join(
              " "
            )}
          >
            {
              item.label
            }
          </div>
        )
      )}
    </div>
  );
}

function ParentStep({
  products,
  parentProductId,
  parentName,
  parentSlug,
  parentSku,
  defaultVariantId,
  variantRows,
  onParentProductChange,
  onParentNameChange,
  onParentSlugChange,
  onParentSkuChange,
  onDefaultVariantChange,
}: {
  products: Product[];
  parentProductId: string;
  parentName: string;
  parentSlug: string;
  parentSku: string;
  defaultVariantId: string;
  variantRows: VariantRow[];
  onParentProductChange: (
    value: string
  ) => void;
  onParentNameChange: (
    value: string
  ) => void;
  onParentSlugChange: (
    value: string
  ) => void;
  onParentSkuChange: (
    value: string
  ) => void;
  onDefaultVariantChange: (
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-base font-semibold">
          Choose the surviving product
        </h3>

        <p className="mt-1 text-sm text-[#6d7175]">
          This existing Product ID will become the variable parent. The other selected product records will be archived after their variants are moved.
        </p>

        <div className="mt-4 grid gap-2">
          {products.map(
            (
              product
            ) => {
              const variant =
                product
                  .variants?.find(
                    (
                      item
                    ) =>
                      item.status !==
                      "ARCHIVED"
                  );

              return (
                <label
                  key={
                    product.id
                  }
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4",
                    parentProductId ===
                    product.id
                      ? "border-[#303030] bg-[#f7f7f8]"
                      : "border-[#e1e3e5] bg-white",
                  ].join(
                    " "
                  )}
                >
                  <input
                    type="radio"
                    name="merge-parent"
                    checked={
                      parentProductId ===
                      product.id
                    }
                    onChange={() =>
                      onParentProductChange(
                        product.id
                      )
                    }
                    className="mt-1"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {
                        product.name
                      }
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6d7175]">
                      <span>
                        Parent SKU:{" "}
                        {product.parentSku ||
                          "—"}
                      </span>

                      <span>
                        Child SKU:{" "}
                        {variant?.sku ||
                          "—"}
                      </span>
                    </div>
                  </div>
                </label>
              );
            }
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Parent product name
          </label>

          <input
            value={
              parentName
            }
            onChange={(
              event
            ) =>
              onParentNameChange(
                event
                  .target
                  .value
              )
            }
            className="admin-input"
            placeholder="Apple iPhone 17 Pro Max"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Parent slug
          </label>

          <input
            value={
              parentSlug
            }
            onChange={(
              event
            ) =>
              onParentSlugChange(
                slugify(
                  event
                    .target
                    .value
                )
              )
            }
            className="admin-input"
            placeholder="apple-iphone-17-pro-max"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Parent SKU
          </label>

          <input
            value={
              parentSku
            }
            onChange={(
              event
            ) =>
              onParentSkuChange(
                event
                  .target
                  .value
                  .toUpperCase()
              )
            }
            className="admin-input font-mono"
            placeholder="APIPH17PROMAX"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Default child variant
          </label>

          <select
            value={
              defaultVariantId
            }
            onChange={(
              event
            ) =>
              onDefaultVariantChange(
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          >
            {variantRows.map(
              (
                row
              ) => (
                <option
                  key={
                    row.variantId
                  }
                  value={
                    row.variantId
                  }
                >
                  {
                    row.sku
                  }{" "}
                  —{" "}
                  {
                    row.productName
                  }
                </option>
              )
            )}
          </select>
        </div>
      </section>
    </div>
  );
}

function AttributesStep({
  attributes,
  loading,
  selectedAttributes,
  onChange,
  onQuickCreate,
  onAddOption,
}: {
  attributes: Attribute[];
  loading: boolean;
  selectedAttributes: SelectedAttribute[];
  onChange: (
    value: SelectedAttribute[]
  ) => void;
  onQuickCreate: () => void;
  onAddOption: (
    attributeId: string
  ) => void;
}) {
  const selected =
    new Set(
      selectedAttributes.map(
        (
          item
        ) =>
          item.attributeId
      )
    );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">
            Choose variant-defining attributes
          </h3>

          <p className="mt-1 text-sm text-[#6d7175]">
            Every child must be mapped using the same selected attributes.
          </p>
        </div>

        <button
          type="button"
          onClick={
            onQuickCreate
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
        >
          <Plus
            size={
              16
            }
          />
          Create attribute
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-[#6d7175]">
          Loading attributes...
        </p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {attributes.map(
            (
              attribute
            ) => {
              const checked =
                selected.has(
                  attribute.id
                );

              const activeOptions =
                (
                  attribute.options ||
                  []
                ).filter(
                  (
                    option
                  ) =>
                    option.isActive
                );

              return (
                <div
                  key={
                    attribute.id
                  }
                  className={[
                    "rounded-xl border p-4",
                    checked
                      ? "border-[#303030] bg-[#fafafa]"
                      : "border-[#e1e3e5] bg-white",
                  ].join(
                    " "
                  )}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        checked
                      }
                      onChange={() => {
                        if (
                          checked
                        ) {
                          onChange(
                            selectedAttributes.filter(
                              (
                                item
                              ) =>
                                item.attributeId !==
                                attribute.id
                            )
                          );
                        } else {
                          onChange([
                            ...selectedAttributes,
                            {
                              attributeId:
                                attribute.id,
                            },
                          ]);
                        }
                      }}
                      className="mt-1"
                    />

                    <div className="min-w-0">
                      <p className="font-semibold">
                        {
                          attribute.name
                        }
                      </p>

                      <p className="mt-1 font-mono text-xs text-[#6d7175]">
                        {
                          attribute.code
                        }
                      </p>

                      <p className="mt-2 text-xs text-[#6d7175]">
                        {
                          activeOptions.length
                        }{" "}
                        active option(s)
                      </p>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      onAddOption(
                        attribute.id
                      )
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#303030] hover:underline"
                  >
                    <Plus
                      size={
                        13
                      }
                    />
                    Add option
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function MappingStep({
  rows,
  attributes,
  mapping,
  duplicateCombination,
  onChange,
  onAddOption,
}: {
  rows: VariantRow[];
  attributes: Attribute[];
  mapping: Record<
    string,
    Record<
      string,
      string
    >
  >;
  duplicateCombination: boolean;
  onChange: (
    variantId: string,
    attributeId: string,
    optionId: string
  ) => void;
  onAddOption: (
    attributeId: string
  ) => void;
}) {
  return (
    <div>
      <div>
        <h3 className="text-base font-semibold">
          Map each existing SKU
        </h3>

        <p className="mt-1 text-sm text-[#6d7175]">
          Choose one option for every selected attribute. These mappings become the child variant combinations.
        </p>
      </div>

      {duplicateCombination && (
        <div className="mt-4 flex gap-3 rounded-xl border border-[#e8b4aa] bg-[#fbeae5] p-4 text-sm text-[#8f2f1f]">
          <AlertTriangle
            size={
              18
            }
            className="mt-0.5 shrink-0"
          />
          Two or more SKUs currently have the same variant combination. Every child combination must be unique.
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-[#e1e3e5]">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
            <tr>
              <th className="px-3 py-3">
                Existing product / SKU
              </th>

              {attributes.map(
                (
                  attribute
                ) => (
                  <th
                    key={
                      attribute.id
                    }
                    className="min-w-[190px] px-3 py-3"
                  >
                    <div>
                      {
                        attribute.name
                      }
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onAddOption(
                          attribute.id
                        )
                      }
                      className="mt-1 text-[11px] font-semibold normal-case tracking-normal text-[#303030] hover:underline"
                    >
                      + Add option
                    </button>
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (
                row
              ) => (
                <tr
                  key={
                    row.variantId
                  }
                  className="border-t border-[#e1e3e5]"
                >
                  <td className="px-3 py-3">
                    <p className="max-w-[330px] font-medium">
                      {
                        row.productName
                      }
                    </p>

                    <p className="mt-1 font-mono text-xs text-[#6d7175]">
                      {
                        row.sku
                      }
                    </p>
                  </td>

                  {attributes.map(
                    (
                      attribute
                    ) => (
                      <td
                        key={
                          `${row.variantId}-${attribute.id}`
                        }
                        className="px-3 py-3"
                      >
                        <select
                          value={
                            mapping[
                              row.variantId
                            ]?.[
                              attribute.id
                            ] ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            onChange(
                              row.variantId,
                              attribute.id,
                              event
                                .target
                                .value
                            )
                          }
                          className="admin-input min-w-[170px]"
                        >
                          <option value="">
                            Select...
                          </option>

                          {(
                            attribute.options ||
                            []
                          )
                            .filter(
                              (
                                option
                              ) =>
                                option.isActive
                            )
                            .map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option.id
                                  }
                                  value={
                                    option.id
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              )
                            )}
                        </select>
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewStep({
  preview,
  previewing,
}: {
  preview:
    | ProductMergePreviewResponse
    | undefined;
  previewing: boolean;
}) {
  if (
    previewing
  ) {
    return (
      <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-[#6d7175]">
        <LoaderCircle
          size={
            18
          }
          className="animate-spin"
        />
        Validating merge...
      </div>
    );
  }

  if (
    !preview
  ) {
    return (
      <p className="text-sm text-[#6d7175]">
        No preview is available.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className={[
          "rounded-xl border p-4",
          preview.canExecute
            ? "border-[#b7d7ae] bg-[#edf7ea]"
            : "border-[#e8b4aa] bg-[#fbeae5]",
        ].join(
          " "
        )}
      >
        <div className="flex items-start gap-3">
          {preview.canExecute ? (
            <CheckCircle2
              size={
                20
              }
              className="mt-0.5 shrink-0 text-[#2f6f24]"
            />
          ) : (
            <AlertTriangle
              size={
                20
              }
              className="mt-0.5 shrink-0 text-[#a23b2a]"
            />
          )}

          <div>
            <p className="font-semibold">
              {preview.canExecute
                ? "Merge validation passed"
                : "Merge cannot be executed yet"}
            </p>

            <p className="mt-1 text-sm">
              {preview.canExecute
                ? "Existing variants can be moved safely using the selected mappings."
                : "Correct the errors below, go back, and preview again."}
            </p>
          </div>
        </div>
      </div>

      {preview.data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Source products"
            value={
              preview.data
                .summary
                .sourceProducts
            }
          />

          <Metric
            label="Variants preserved"
            value={
              preview.data
                .summary
                .variants
            }
          />

          <Metric
            label="Products archived"
            value={
              preview.data
                .summary
                .redundantProducts
            }
          />

          <Metric
            label="Historical order items"
            value={
              preview.data
                .summary
                .historicalOrderItems
            }
          />
        </div>
      )}

      {preview.errors.length >
        0 && (
        <MessageList
          title="Errors"
          messages={
            preview.errors
          }
          error
        />
      )}

      {preview.warnings.length >
        0 && (
        <MessageList
          title="Warnings"
          messages={
            preview.warnings
          }
        />
      )}

      {preview.data && (
        <div className="overflow-x-auto rounded-xl border border-[#e1e3e5]">
          <table className="min-w-[950px] w-full text-left text-sm">
            <thead className="bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
              <tr>
                <th className="px-3 py-3">
                  SKU
                </th>
                <th className="px-3 py-3">
                  Barcode
                </th>
                <th className="px-3 py-3">
                  Zoho
                </th>
                <th className="px-3 py-3">
                  New variant attributes
                </th>
              </tr>
            </thead>

            <tbody>
              {preview.data.variants.map(
                (
                  variant: ProductMergePreviewVariant
                ) => (
                  <tr
                    key={
                      variant.variantId
                    }
                    className="border-t border-[#e1e3e5]"
                  >
                    <td className="px-3 py-3 font-mono text-xs">
                      {
                        variant.sku
                      }
                    </td>

                    <td className="px-3 py-3 font-mono text-xs">
                      {variant.barcode ||
                        "—"}
                    </td>

                    <td className="px-3 py-3 text-xs">
                      {variant.zohoItemCode ||
                        variant.zohoItemId ||
                        "—"}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {variant.attributes.map(
                          (
                            attribute: ProductMergePreviewVariant["attributes"][number]
                          ) => (
                            <span
                              key={
                                `${variant.variantId}-${attribute.attributeId}`
                              }
                              className="rounded-full bg-[#f1f2f3] px-2 py-1 text-xs"
                            >
                              {
                                attribute.attributeName ||
                                attribute.attributeCode
                              }
                              :{" "}
                              {
                                attribute.optionLabel ||
                                attribute.optionValue
                              }
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6d7175]">
        {
          label
        }
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {
          value
        }
      </p>
    </div>
  );
}

function MessageList({
  title,
  messages,
  error = false,
}: {
  title: string;
  messages: string[];
  error?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        error
          ? "border-[#e8b4aa] bg-[#fbeae5]"
          : "border-[#f1c87a] bg-[#fff7e3]",
      ].join(
        " "
      )}
    >
      <p className="font-semibold">
        {
          title
        }
      </p>

      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {messages.map(
          (
            message,
            index
          ) => (
            <li
              key={`${message}-${index}`}
            >
              {
                message
              }
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function QuickCreateAttributeModal({
  parentCategoryId,
  onClose,
  onCreated,
}: {
  parentCategoryId: string | null;
  onClose: () => void;
  onCreated: (
    attributeId: string
  ) => void;
}) {
  const [
    name,
    setName,
  ] =
    useState("");

  const [
    code,
    setCode,
  ] =
    useState("");

  const [
    inputType,
    setInputType,
  ] =
    useState<AttributeInputType>(
      "SINGLE_SELECT"
    );

  const [
    optionsText,
    setOptionsText,
  ] =
    useState("");

  const [
    createAttribute,
    {
      isLoading,
    },
  ] =
    useCreateAttributeMutation();

  const submit =
    async () => {
      const optionLabels =
        optionsText
          .split(
            /\r?\n/
          )
          .map(
            (
              item
            ) =>
              item.trim()
          )
          .filter(
            Boolean
          );

      if (
        !name.trim() ||
        !code.trim()
      ) {
        window.alert(
          "Attribute name and code are required."
        );

        return;
      }

      if (
        optionLabels.length <
        1
      ) {
        window.alert(
          "Add at least one option, one per line."
        );

        return;
      }

      try {
        const response =
          await createAttribute({
            name:
              name.trim(),
            code:
              code
                .trim()
                .toUpperCase(),
            description:
              null,
            inputType,
            dataType:
              "STRING",
            unit:
              null,
            isVariantDefining:
              true,
            isFilterable:
              true,
            isSearchable:
              false,
            isComparable:
              false,
            isRequired:
              false,
            displayOrder:
              100,
            isActive:
              true,
            options:
              optionLabels.map(
                (
                  label,
                  index
                ) => ({
                  clientId:
                    `new-${index}-${Date.now()}`,
                  label,
                  value:
                    label
                      .trim()
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9]+/g,
                        "_"
                      )
                      .replace(
                        /^_+|_+$/g,
                        ""
                      ),
                  swatchValue:
                    null,
                  displayOrder:
                    index *
                    10,
                  isActive:
                    true,
                })
              ),
            categoryAssignments:
              parentCategoryId
                ? [
                    {
                      categoryId:
                        parentCategoryId,
                      isRequired:
                        false,
                      isFilterable:
                        true,
                      isVariantDefining:
                        true,
                      displayOrder:
                        100,
                      isActive:
                        true,
                    },
                  ]
                : [],
          }).unwrap();

        onCreated(
          response.data.id
        );
      } catch (
        error: any
      ) {
        window.alert(
          getApiErrorMessage(
            error,
            "Unable to create attribute."
          )
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              Create variant attribute
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              The attribute will be active and variant-defining.
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
                17
              }
            />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Name
            </label>

            <input
              value={
                name
              }
              onChange={(
                event
              ) => {
                const next =
                  event
                    .target
                    .value;

                setName(
                  next
                );

                if (
                  !code
                ) {
                  setCode(
                    next
                      .trim()
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9]+/g,
                        "_"
                      )
                      .replace(
                        /^_+|_+$/g,
                        ""
                      )
                  );
                }
              }}
              className="admin-input"
              placeholder="Storage"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Code
            </label>

            <input
              value={
                code
              }
              onChange={(
                event
              ) =>
                setCode(
                  event
                    .target
                    .value
                    .toUpperCase()
                )
              }
              className="admin-input font-mono"
              placeholder="STORAGE"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Input type
            </label>

            <select
              value={
                inputType
              }
              onChange={(
                event
              ) =>
                setInputType(
                  event
                    .target
                    .value as AttributeInputType
                )
              }
              className="admin-input"
            >
              <option value="SINGLE_SELECT">
                Single select
              </option>

              <option value="COLOR_SWATCH">
                Color swatch
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">
              Options — one per line
            </label>

            <textarea
              rows={
                7
              }
              value={
                optionsText
              }
              onChange={(
                event
              ) =>
                setOptionsText(
                  event
                    .target
                    .value
                )
              }
              className="admin-input resize-y py-3"
              placeholder={`256GB\n512GB\n1TB`}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={
              onClose
            }
            className="h-10 rounded-lg border border-[#babfc3] px-4 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={
              submit
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading && (
              <LoaderCircle
                size={
                  15
                }
                className="animate-spin"
              />
            )}

            Create attribute
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAddOptionModal({
  attribute,
  onClose,
  onCreated,
}: {
  attribute: Attribute | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [
    label,
    setLabel,
  ] =
    useState("");

  const [
    swatchValue,
    setSwatchValue,
  ] =
    useState("");

  const [
    createOption,
    {
      isLoading,
    },
  ] =
    useCreateAttributeOptionMutation();

  if (
    !attribute
  ) {
    return null;
  }

  const submit =
    async () => {
      if (
        !label.trim()
      ) {
        return;
      }

      try {
        await createOption({
          attributeId:
            attribute.id,
          option: {
            label:
              label.trim(),
            value:
              label
                .trim()
                .toUpperCase()
                .replace(
                  /[^A-Z0-9]+/g,
                  "_"
                )
                .replace(
                  /^_+|_+$/g,
                  ""
                ),
            swatchValue:
              swatchValue
                .trim() ||
              null,
            displayOrder:
              (
                attribute
                  .options?.length ||
                0
              ) *
              10,
            isActive:
              true,
          },
        }).unwrap();

        onCreated();
      } catch (
        error: any
      ) {
        window.alert(
          getApiErrorMessage(
            error,
            "Unable to add option."
          )
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              Add{" "}
              {
                attribute.name
              }{" "}
              option
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              The option becomes available immediately in the merge mapping.
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
                17
              }
            />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Label
            </label>

            <input
              value={
                label
              }
              onChange={(
                event
              ) =>
                setLabel(
                  event
                    .target
                    .value
                )
              }
              className="admin-input"
              placeholder="512GB"
            />
          </div>

          {attribute.inputType ===
            "COLOR_SWATCH" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Swatch color
              </label>

              <input
                value={
                  swatchValue
                }
                onChange={(
                  event
                ) =>
                  setSwatchValue(
                    event
                      .target
                      .value
                  )
                }
                className="admin-input font-mono"
                placeholder="#1f3a63"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={
              onClose
            }
            className="h-10 rounded-lg border border-[#babfc3] px-4 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              isLoading ||
              !label.trim()
            }
            onClick={
              submit
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading && (
              <LoaderCircle
                size={
                  15
                }
                className="animate-spin"
              />
            )}

            Add option
          </button>
        </div>
      </div>
    </div>
  );
}

function deriveCommonName(
  names: string[]
) {
  if (
    !names.length
  ) {
    return "";
  }

  const tokenized =
    names.map(
      (
        name
      ) =>
        name
          .trim()
          .split(
            /\s+/
          )
    );

  const first =
    tokenized[0];

  const common: string[] =
    [];

  for (
    let index = 0;
    index <
    first.length;
    index +=
    1
  ) {
    const token =
      first[index];

    if (
      tokenized.every(
        (
          tokens
        ) =>
          tokens[
            index
          ]?.toLowerCase() ===
          token.toLowerCase()
      )
    ) {
      common.push(
        token
      );
    } else {
      break;
    }
  }

  return common.join(
    " "
  );
}

function getApiErrorMessage(
  error: any,
  fallback: string
) {
  return (
    error?.data?.error?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
}
