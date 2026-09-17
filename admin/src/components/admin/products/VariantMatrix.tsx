"use client";

import {
  CheckCircle2,
  Copy,
  CopyCheck,
  ImageIcon,
  Power,
  PowerOff,
  RefreshCcw,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  ProductImage,
  ProductStatus,
  ProductVariant,
} from "@/types/product";

import ProductMediaManager from "./ProductMediaManager";

interface VariantMatrixProps {
  variants: ProductVariant[];
  parentSku?: string | null;
  onChange: (
    variants: ProductVariant[]
  ) => void;
}

type CopyableField =
  | "sku"
  | "barcode"
  | "weight"
  | "weightUnit"
  | "status";

interface ValidationState {
  duplicateSkuIndexes: Set<number>;
  duplicateBarcodeIndexes: Set<number>;
  missingSkuIndexes: Set<number>;
}

const normalizeValue = (
  value?: string | null
): string => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const sanitizeSkuPart = (
  value?: string | null
): string => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getAttributeLabel = (
  variant: ProductVariant,
  attributeId: string
): string => {
  const match =
    variant.attributeValues.find(
      (value) =>
        value.attributeId ===
        attributeId
    );
    return (
      match?.attribute?.name ||
      attributeId
    );
};

const getAttributeValue = (
  variant: ProductVariant,
  attributeId: string
): string => {
  const match =
    variant.attributeValues.find(
      (value) =>
        value.attributeId ===
        attributeId
    );

  return (
    match?.displayValue ||
    match?.option?.label ||
    ""
  );
};

const buildValidationState = (
  variants: ProductVariant[]
): ValidationState => {
  const skuMap = new Map<
    string,
    number[]
  >();

  const barcodeMap = new Map<
    string,
    number[]
  >();

  const missingSkuIndexes =
    new Set<number>();

  variants.forEach(
    (variant, index) => {
      const sku = normalizeValue(
        variant.sku
      );

      const barcode =
        normalizeValue(
          variant.barcode
        );

      if (!sku) {
        missingSkuIndexes.add(index);
      } else {
        const indexes =
          skuMap.get(sku) || [];

        indexes.push(index);
        skuMap.set(sku, indexes);
      }

      if (barcode) {
        const indexes =
          barcodeMap.get(barcode) ||
          [];

        indexes.push(index);

        barcodeMap.set(
          barcode,
          indexes
        );
      }
    }
  );

  const duplicateSkuIndexes =
    new Set<number>();

  const duplicateBarcodeIndexes =
    new Set<number>();

  skuMap.forEach((indexes) => {
    if (indexes.length > 1) {
      indexes.forEach((index) =>
        duplicateSkuIndexes.add(
          index
        )
      );
    }
  });

  barcodeMap.forEach((indexes) => {
    if (indexes.length > 1) {
      indexes.forEach((index) =>
        duplicateBarcodeIndexes.add(
          index
        )
      );
    }
  });

  return {
    duplicateSkuIndexes,
    duplicateBarcodeIndexes,
    missingSkuIndexes,
  };
};

export default function VariantMatrix({
  variants,
  parentSku,
  onChange,
}: VariantMatrixProps) {
  const [
    selectedIndexes,
    setSelectedIndexes,
  ] = useState<Set<number>>(
    new Set()
  );

  const [
    copyField,
    setCopyField,
  ] =
    useState<CopyableField>("weight");

  const [
    mediaVariantIndex,
    setMediaVariantIndex,
  ] =
    useState<number | null>(
      null
    );

  const [
    bulkMediaOpen,
    setBulkMediaOpen,
  ] = useState(false);

  const [
    bulkMedia,
    setBulkMedia,
  ] = useState<ProductImage[]>(
    []
  );

  const [
    bulkMediaMode,
    setBulkMediaMode,
  ] = useState<
    "REPLACE" | "APPEND"
  >("REPLACE");

  const attributeColumns =
    useMemo(() => {
      const map = new Map<
        string,
        string
      >();

      variants.forEach((variant) => {
        variant.attributeValues.forEach(
          (value) => {
            if (
              !map.has(
                value.attributeId
              )
            ) {
              map.set(
                value.attributeId,
                value.attribute
                  ?.name ||                 
                  value.displayValue ||
                  "Attribute"
              );
            }
          }
        );
      });

      return Array.from(
        map.entries()
      ).map(([id, label]) => ({
        id,
        label,
      }));
    }, [variants]);

  const validation = useMemo(
    () =>
      buildValidationState(
        variants
      ),
    [variants]
  );

  const selectedCount =
    selectedIndexes.size;

  const allSelected =
    variants.length > 0 &&
    selectedCount ===
      variants.length;

  const hasErrors =
    validation
      .duplicateSkuIndexes.size >
      0 ||
    validation
      .duplicateBarcodeIndexes
      .size > 0 ||
    validation.missingSkuIndexes
      .size > 0;

  const updateVariant = (
    index: number,
    patch: Partial<ProductVariant>
  ) => {
    onChange(
      variants.map(
        (variant, currentIndex) =>
          currentIndex === index
            ? {
                ...variant,
                ...patch,
              }
            : variant
      )
    );
  };

  const toggleRow = (
    index: number
  ) => {
    setSelectedIndexes(
      (current) => {
        const next = new Set(
          current
        );

        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }

        return next;
      }
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIndexes(
        new Set()
      );
      return;
    }

    setSelectedIndexes(
      new Set(
        variants.map(
          (_, index) => index
        )
      )
    );
  };

  const openBulkMedia = () => {
    if (!selectedCount) {
      return;
    }

    setBulkMedia([]);
    setBulkMediaMode(
      "REPLACE"
    );
    setBulkMediaOpen(true);
  };

  const applyBulkMedia = () => {
    if (
      !selectedCount ||
      !bulkMedia.length
    ) {
      return;
    }

    const nextVariants =
      variants.map(
        (variant, index) => {
          if (
            !selectedIndexes.has(
              index
            )
          ) {
            return variant;
          }

          const incomingImages =
            bulkMedia.map(
              (
                image,
                imageIndex
              ) => ({
                ...image,
                id: undefined,
                variantId:
                  variant.id ||
                  null,
                displayOrder:
                  imageIndex,
              })
            );

          if (
            bulkMediaMode ===
            "REPLACE"
          ) {
            return {
              ...variant,
              images:
                incomingImages,
            };
          }

          const incomingHasPrimary =
            incomingImages.some(
              (image) =>
                image.imageRole ===
                "PRIMARY"
            );

          const existingImages =
            (
              variant.images || []
            ).map((image) => ({
              ...image,
              imageRole:
                incomingHasPrimary &&
                image.imageRole ===
                  "PRIMARY"
                  ? "GALLERY"
                  : image.imageRole,
            }));

          const merged = [
            ...existingImages,
          ];

          const usedKeys =
            new Set(
              merged.map(
                (image) =>
                  `${image.mediaAssetId}:${image.imageRole}`
              )
            );

          incomingImages.forEach(
            (image) => {
              const key =
                `${image.mediaAssetId}:${image.imageRole}`;

              if (
                !usedKeys.has(key)
              ) {
                usedKeys.add(key);
                merged.push(image);
              }
            }
          );

          return {
            ...variant,
            images:
              merged.map(
                (
                  image,
                  imageIndex
                ) => ({
                  ...image,
                  variantId:
                    variant.id ||
                    null,
                  displayOrder:
                    imageIndex,
                })
              ),
          };
        }
      );

    onChange(nextVariants);
    setBulkMediaOpen(false);
    setBulkMedia([]);
  };

  const makeDefault = (
    index: number
  ) => {
    onChange(
      variants.map(
        (variant, currentIndex) => ({
          ...variant,
          isDefault:
            currentIndex === index,
        })
      )
    );
  };

  const duplicateVariant = (
    index: number
  ) => {
    const source =
      variants[index];

    const copiedVariant: ProductVariant =
      {
        ...source,

        id: undefined,

        sku: source.sku
          ? `${source.sku}-COPY`
          : "",

        barcode: null,

        name: source.name
          ? `${source.name} Copy`
          : "Variant Copy",

        isDefault: false,

        variantKey: `${
          source.variantKey ||
          "MANUAL"
        }-COPY-${Date.now()}`,

        sortOrder:
          variants.length,

        attributeValues:
          source.attributeValues.map(
            (value) => ({
              ...value,
              id: undefined,
              productVariantId:
                undefined,
            })
          ),

        channels:
          source.channels.map(
            (channel) => ({
              ...channel,
              id: undefined,
              productVariantId:
                undefined,
            })
          ),

        images: [],
      };

    onChange([
      ...variants,
      copiedVariant,
    ]);
  };

  const removeVariant = (
    index: number
  ) => {
    const next =
      variants.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );

    if (
      next.length > 0 &&
      !next.some(
        (variant) =>
          variant.isDefault
      )
    ) {
      next[0] = {
        ...next[0],
        isDefault: true,
      };
    }

    onChange(
      next.map(
        (variant, currentIndex) => ({
          ...variant,
          sortOrder: currentIndex,
        })
      )
    );

    setSelectedIndexes(
      (current) => {
        const nextSelected =
          new Set<number>();

        current.forEach(
          (selectedIndex) => {
            if (
              selectedIndex < index
            ) {
              nextSelected.add(
                selectedIndex
              );
            }

            if (
              selectedIndex > index
            ) {
              nextSelected.add(
                selectedIndex - 1
              );
            }
          }
        );

        return nextSelected;
      }
    );
  };

  const removeSelected = () => {
    if (!selectedCount) {
      return;
    }

    const next =
      variants
        .filter(
          (_, index) =>
            !selectedIndexes.has(
              index
            )
        )
        .map(
          (
            variant,
            index
          ) => ({
            ...variant,
            sortOrder: index,
          })
        );

    if (
      next.length > 0 &&
      !next.some(
        (variant) =>
          variant.isDefault
      )
    ) {
      next[0] = {
        ...next[0],
        isDefault: true,
      };
    }

    onChange(next);
    setSelectedIndexes(
      new Set()
    );
  };

  const setSelectedStatus = (
    status: ProductStatus
  ) => {
    if (!selectedCount) {
      return;
    }

    onChange(
      variants.map(
        (variant, index) =>
          selectedIndexes.has(
            index
          )
            ? {
                ...variant,
                status,
              }
            : variant
      )
    );
  };

  const copyDown = () => {
    if (variants.length < 2) {
      return;
    }

    const sourceIndex =
      selectedCount === 1
        ? Array.from(
            selectedIndexes
          )[0]
        : 0;

    const source =
      variants[sourceIndex];

    if (!source) {
      return;
    }

    const targetIndexes =
      selectedCount > 1
        ? selectedIndexes
        : new Set(
            variants.map(
              (_, index) => index
            )
          );

    onChange(
      variants.map(
        (variant, index) => {
          if (
            index === sourceIndex ||
            !targetIndexes.has(index)
          ) {
            return variant;
          }

          return {
            ...variant,
            [copyField]:
              source[copyField],
          };
        }
      )
    );
  };

  const generateSkus = () => {
    const prefix =
      sanitizeSkuPart(
        parentSku
      );

    if (!prefix) {
      window.alert(
        "Enter a parent SKU before generating variant SKUs."
      );
      return;
    }

    onChange(
      variants.map(
        (variant, index) => {
          const parts =
            variant.attributeValues
              .sort(
                (
                  left,
                  right
                ) =>
                  left.sortOrder -
                  right.sortOrder
              )
              .map((value) =>
                sanitizeSkuPart(
                  value.displayValue ||
                    value.option?.label
                )
              )
              .filter(Boolean);

          const suffix =
            parts.length > 0
              ? parts.join("-")
              : String(index + 1);

          return {
            ...variant,
            sku: `${prefix}-${suffix}`,
          };
        }
      )
    );
  };

  if (!variants.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
          <RefreshCcw
            size={21}
            className="text-[#6d7175]"
          />
        </div>

        <h3 className="mt-4 text-sm font-semibold">
          No variants created
        </h3>

        <p className="mt-1 text-sm text-[#6d7175]">
          Generate combinations using the
          variant generator above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
          >
            <CopyCheck size={15} />

            {allSelected
              ? "Clear selection"
              : "Select all"}
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedStatus(
                "ACTIVE"
              )
            }
            disabled={!selectedCount}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-40"
          >
            <Power size={15} />
            Enable
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedStatus(
                "INACTIVE"
              )
            }
            disabled={!selectedCount}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-40"
          >
            <PowerOff size={15} />
            Disable
          </button>

          <button
            type="button"
            onClick={
              removeSelected
            }
            disabled={!selectedCount}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 size={15} />
            Delete
          </button>

          <button
            type="button"
            onClick={openBulkMedia}
            disabled={!selectedCount}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-40"
          >
            <ImageIcon size={15} />
            Bulk media
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={copyField}
            onChange={(event) =>
              setCopyField(
                event.target
                  .value as CopyableField
              )
            }
            className="admin-input h-9 min-w-[150px] py-1 text-sm"
          >
            <option value="weight">
              Weight
            </option>

            <option value="weightUnit">
              Weight unit
            </option>

            <option value="status">
              Status
            </option>

            <option value="sku">
              SKU
            </option>

            <option value="barcode">
              Barcode
            </option>
          </select>

          <button
            type="button"
            onClick={copyDown}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
          >
            <Copy size={15} />
            Copy down
          </button>

          <button
            type="button"
            onClick={
              generateSkus
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#303030] px-3 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            <Sparkles size={15} />
            Generate SKUs
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">
            {variants.length} variants
          </p>

          {selectedCount > 0 && (
            <span className="rounded-full bg-[#ebebeb] px-2.5 py-1 text-xs font-medium">
              {selectedCount} selected
            </span>
          )}
        </div>

        {hasErrors ? (
          <div className="flex items-center gap-2 text-xs font-medium text-[#a23b2a]">
            <TriangleAlert
              size={15}
            />
            Resolve highlighted variant
            errors before saving.
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-green-700">
            <CheckCircle2
              size={15}
            />
            Variant data looks valid.
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e1e3e5]">
        <table className="w-full min-w-[1380px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-20 bg-[#f6f6f7] text-xs uppercase tracking-wide text-[#6d7175]">
            <tr>
              <th className="sticky left-0 z-30 w-[48px] border-r border-[#e1e3e5] bg-[#f6f6f7] px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all variants"
                />
              </th>

              <th className="sticky left-[48px] z-30 w-[72px] border-r border-[#e1e3e5] bg-[#f6f6f7] px-3 py-3">
                Default
              </th>

              {attributeColumns.map(
                (attribute) => (
                  <th
                    key={attribute.id}
                    className="min-w-[140px] px-3 py-3"
                  >
                    {attribute.label}
                  </th>
                )
              )}

              <th className="min-w-[220px] px-3 py-3">
                Variant name
              </th>

              <th className="min-w-[190px] px-3 py-3">
                SKU
              </th>

              <th className="min-w-[170px] px-3 py-3">
                Barcode
              </th>

              <th className="min-w-[120px] px-3 py-3">
                Weight
              </th>

              <th className="min-w-[110px] px-3 py-3">
                Unit
              </th>

              <th className="min-w-[140px] px-3 py-3">
                Status
              </th>

              <th className="w-[110px] px-3 py-3">
                Media
              </th>

              <th className="w-[110px] px-3 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {variants.map(
              (variant, index) => {
                const selected =
                  selectedIndexes.has(
                    index
                  );

                const duplicateSku =
                  validation
                    .duplicateSkuIndexes
                    .has(index);

                const duplicateBarcode =
                  validation
                    .duplicateBarcodeIndexes
                    .has(index);

                const missingSku =
                  validation
                    .missingSkuIndexes
                    .has(index);

                return (
                  <tr
                    key={
                      variant.id ||
                      variant.variantKey ||
                      index
                    }
                    className={[
                      "border-t border-[#e1e3e5]",
                      selected
                        ? "bg-[#f4f6f8]"
                        : "bg-white",
                    ].join(" ")}
                  >
                    <td className="sticky left-0 z-10 border-r border-[#e1e3e5] bg-inherit px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleRow(index)
                        }
                        aria-label={`Select ${variant.name}`}
                      />
                    </td>

                    <td className="sticky left-[48px] z-10 border-r border-[#e1e3e5] bg-inherit px-3 py-3 text-center">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={
                          variant.isDefault
                        }
                        onChange={() =>
                          makeDefault(index)
                        }
                        aria-label={`Set ${variant.name} as default`}
                      />
                    </td>

                    {attributeColumns.map(
                      (attribute) => (
                        <td
                          key={
                            attribute.id
                          }
                          className="px-3 py-3"
                        >
                          <div className="rounded-lg border border-[#e1e3e5] bg-[#fafafa] px-3 py-2">
                            <p className="truncate text-sm font-medium">
                              {getAttributeValue(
                                variant,
                                attribute.id
                              ) || "—"}
                            </p>
                          </div>
                        </td>
                      )
                    )}

                    <td className="px-3 py-3">
                      <input
                        value={
                          variant.name
                        }
                        onChange={(
                          event
                        ) =>
                          updateVariant(
                            index,
                            {
                              name:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="admin-input min-w-[210px]"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={
                          variant.sku
                        }
                        onChange={(
                          event
                        ) =>
                          updateVariant(
                            index,
                            {
                              sku:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className={[
                          "admin-input min-w-[180px] font-mono",
                          duplicateSku ||
                          missingSku
                            ? "border-[#d72c0d] bg-[#fff8f6]"
                            : "",
                        ].join(" ")}
                      />

                      {missingSku && (
                        <p className="mt-1 text-[11px] text-[#a23b2a]">
                          SKU is required
                        </p>
                      )}

                      {duplicateSku && (
                        <p className="mt-1 text-[11px] text-[#a23b2a]">
                          Duplicate SKU
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={
                          variant.barcode ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateVariant(
                            index,
                            {
                              barcode:
                                event
                                  .target
                                  .value ||
                                null,
                            }
                          )
                        }
                        className={[
                          "admin-input min-w-[160px] font-mono",
                          duplicateBarcode
                            ? "border-[#d72c0d] bg-[#fff8f6]"
                            : "",
                        ].join(" ")}
                      />

                      {duplicateBarcode && (
                        <p className="mt-1 text-[11px] text-[#a23b2a]">
                          Duplicate barcode
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={
                          variant.weight ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateVariant(
                            index,
                            {
                              weight:
                                event
                                  .target
                                  .value ===
                                ""
                                  ? null
                                  : Number(
                                      event
                                        .target
                                        .value
                                    ),
                            }
                          )
                        }
                        className="admin-input min-w-[110px]"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={
                          variant.weightUnit ||
                          "KG"
                        }
                        onChange={(
                          event
                        ) =>
                          updateVariant(
                            index,
                            {
                              weightUnit:
                                event
                                  .target
                                  .value as ProductVariant["weightUnit"],
                            }
                          )
                        }
                        className="admin-input min-w-[100px]"
                      >
                        <option value="G">
                          G
                        </option>
                        <option value="KG">
                          KG
                        </option>
                        <option value="LB">
                          LB
                        </option>
                        <option value="OZ">
                          OZ
                        </option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={
                          variant.status
                        }
                        onChange={(
                          event
                        ) =>
                          updateVariant(
                            index,
                            {
                              status:
                                event
                                  .target
                                  .value as ProductStatus,
                            }
                          )
                        }
                        className="admin-input min-w-[130px]"
                      >
                        <option value="DRAFT">
                          Draft
                        </option>
                        <option value="ACTIVE">
                          Active
                        </option>
                        <option value="INACTIVE">
                          Inactive
                        </option>
                        <option value="ARCHIVED">
                          Archived
                        </option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setMediaVariantIndex(
                            index
                          )
                        }
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
                        title={`Manage media for ${variant.name}`}
                      >
                        <ImageIcon
                          size={16}
                        />

                        {variant.images
                          ?.length || 0}
                      </button>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            duplicateVariant(
                              index
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                          title="Duplicate variant"
                        >
                          <Copy
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeVariant(
                              index
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a23b2a] hover:bg-[#fbeae5]"
                          title="Remove variant"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {bulkMediaOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Bulk variant media
                </h2>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Apply the same media to {selectedCount} selected variant{selectedCount === 1 ? "" : "s"}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBulkMediaOpen(false);
                  setBulkMedia([]);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                aria-label="Close bulk variant media"
              >
                <X size={19} />
              </button>
            </header>

            <div className="border-b border-[#e1e3e5] bg-[#fafbfb] px-5 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d8dbde] bg-white p-4">
                  <input
                    type="radio"
                    name="bulkMediaMode"
                    checked={bulkMediaMode === "REPLACE"}
                    onChange={() => setBulkMediaMode("REPLACE")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Replace variant media
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                      Remove the current media from every selected variant and assign this media set.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d8dbde] bg-white p-4">
                  <input
                    type="radio"
                    name="bulkMediaMode"
                    checked={bulkMediaMode === "APPEND"}
                    onChange={() => setBulkMediaMode("APPEND")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Add to existing media
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                      Keep existing media and add the selected media. A new primary image replaces the previous primary role.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ProductMediaManager
                images={bulkMedia}
                variantId={null}
                title="Choose shared variant media"
                description="Select the media once. It will be copied to every selected variant when you apply the update."
                emptyTitle="Add shared variant media"
                emptyDescription="Choose the Black, Silver, Orange or other shared colour media from Media Studio"
                onChange={setBulkMedia}
              />
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e3e5] px-5 py-4">
              <p className="text-xs text-[#6d7175]">
                The changes are saved to the product form. Click Save Product after applying.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkMediaOpen(false);
                    setBulkMedia([]);
                  }}
                  className="h-10 rounded-lg border border-[#babfc3] bg-white px-5 text-sm font-semibold hover:bg-[#f6f6f7]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={applyBulkMedia}
                  disabled={!bulkMedia.length}
                  className="h-10 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Apply to {selectedCount} variant{selectedCount === 1 ? "" : "s"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}

      {mediaVariantIndex !==
        null &&
      variants[
        mediaVariantIndex
      ] ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Variant media
                </h2>

                <p className="mt-1 text-sm text-[#6d7175]">
                  {
                    variants[
                      mediaVariantIndex
                    ].name
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMediaVariantIndex(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                aria-label="Close variant media"
              >
                <X size={19} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ProductMediaManager
                images={
                  variants[
                    mediaVariantIndex
                  ].images || []
                }
                variantId={
                  variants[
                    mediaVariantIndex
                  ].id || null
                }
                title={`Add media for ${
                  variants[
                    mediaVariantIndex
                  ].name
                }`}
                description="Select the primary, gallery, lifestyle, swatch or video media for this specific variant."
                emptyTitle="Add variant media"
                emptyDescription="Select images or videos for this variant from Media Studio"
                onChange={(
                  images
                ) => {
                  const currentVariant =
                    variants[
                      mediaVariantIndex
                    ];

                  updateVariant(
                    mediaVariantIndex,
                    {
                      images:
                        images.map(
                          (
                            image,
                            imageIndex
                          ) => ({
                            ...image,

                            variantId:
                              currentVariant
                                .id ||
                              null,

                            displayOrder:
                              imageIndex,
                          })
                        ),
                    }
                  );
                }}
              />
            </div>

            <footer className="flex justify-end border-t border-[#e1e3e5] px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setMediaVariantIndex(
                    null
                  )
                }
                className="h-10 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white"
              >
                Done
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}