"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  LoaderCircle,
  PackageSearch,
  Save,
} from "lucide-react";

import FormCard from "@/components/admin/forms/FormCard";
import SelectField from "@/components/admin/forms/SelectField";
import TextField from "@/components/admin/forms/TextField";

import type {
  PriceList,
} from "@/types/priceList";

import type {
  Product,
} from "@/types/product";

import type {
  VariantPrice,
  VariantPriceFormValues,
} from "@/types/variantPrice";

/*
|--------------------------------------------------------------------------
| Form Errors
|--------------------------------------------------------------------------
*/

export interface VariantPriceFormErrors {
  productId?: string;

  productVariantId?: string;

  priceListId?: string;

  regularPrice?: string;

  sellingPrice?: string;

  compareAtPrice?: string;

  costPrice?: string;

  minimumQuantity?: string;

  maximumQuantity?: string;

  validFrom?: string;

  validUntil?: string;

  priority?: string;

  form?: string;
}

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface VariantPriceInitialSelection {
  productId: string;

  productVariantId: string;

  priceListId: string;
}

interface VariantPriceFormProps {
  mode:
    | "create"
    | "edit";

  initialValue?:
    | VariantPrice
    | null;

  initialSelection?:
    | VariantPriceInitialSelection
    | null;

  lockSelection?:
    boolean;

  priceLists:
    PriceList[];

  products:
    Product[];

  loadingPriceLists?:
    boolean;

  loadingProducts?:
    boolean;

  submitting?:
    boolean;

  onSubmit:
    (
      values:
        VariantPriceFormValues
    ) =>
      Promise<void> |
      void;

  onCancel:
    () => void;
}

/*
|--------------------------------------------------------------------------
| Local State
|--------------------------------------------------------------------------
*/

interface LocalFormState {
  productId: string;

  productVariantId: string;

  priceListId: string;

  regularPrice: string;

  sellingPrice: string;

  compareAtPrice: string;

  costPrice: string;

  minimumQuantity: string;

  maximumQuantity: string;

  validFrom: string;

  validUntil: string;

  priority: string;

  isActive: boolean;
}

const EMPTY_FORM:
  LocalFormState = {
  productId:
    "",

  productVariantId:
    "",

  priceListId:
    "",

  regularPrice:
    "",

  sellingPrice:
    "",

  compareAtPrice:
    "",

  costPrice:
    "",

  minimumQuantity:
    "1",

  maximumQuantity:
    "",

  validFrom:
    "",

  validUntil:
    "",

  priority:
    "100",

  isActive:
    true,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toInputDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function toInputNumber(
  value:
    | string
    | number
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function toNullableNumber(
  value:
    string
) {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  return Number(
    normalized
  );
}

function toApiDate(
  value:
    string
) {
  if (!value) {
    return null;
  }

  return new Date(
    `${value}T00:00:00.000Z`
  ).toISOString();
}

function getInitialFormState(
  initialValue?:
    | VariantPrice
    | null,

  initialSelection?:
    | VariantPriceInitialSelection
    | null
): LocalFormState {
  if (!initialValue) {
    return {
      ...EMPTY_FORM,

      productId:
        initialSelection
          ?.productId ||
        "",

      productVariantId:
        initialSelection
          ?.productVariantId ||
        "",

      priceListId:
        initialSelection
          ?.priceListId ||
        "",
    };
  }

  return {
    productId:
      initialValue.variant
        ?.product?.id ||
      initialValue.variant
        ?.productId ||
      initialSelection
        ?.productId ||
      "",

    productVariantId:
      initialValue.productVariantId ||
      initialSelection
        ?.productVariantId ||
      "",

    priceListId:
      initialValue.priceListId ||
      initialSelection
        ?.priceListId ||
      "",

    regularPrice:
      toInputNumber(
        initialValue.regularPrice
      ),

    sellingPrice:
      toInputNumber(
        initialValue.sellingPrice
      ),

    compareAtPrice:
      toInputNumber(
        initialValue.compareAtPrice
      ),

    costPrice:
      toInputNumber(
        initialValue.costPrice
      ),

    minimumQuantity:
      toInputNumber(
        initialValue.minimumQuantity
      ) || "1",

    maximumQuantity:
      toInputNumber(
        initialValue.maximumQuantity
      ),

    validFrom:
      toInputDate(
        initialValue.validFrom
      ),

    validUntil:
      toInputDate(
        initialValue.validUntil
      ),

    priority:
      String(
        initialValue.priority ??
          100
      ),

    isActive:
      initialValue.isActive,
  };
}

function validateForm(
  form:
    LocalFormState
) {
  const errors:
    VariantPriceFormErrors =
    {};

  if (!form.productId) {
    errors.productId =
      "Product is required.";
  }

  if (
    !form.productVariantId
  ) {
    errors.productVariantId =
      "Product variant is required.";
  }

  if (!form.priceListId) {
    errors.priceListId =
      "Price list is required.";
  }

  const regularPrice =
    Number(
      form.regularPrice
    );

  const sellingPrice =
    Number(
      form.sellingPrice
    );

  if (
    form.regularPrice ===
      "" ||
    !Number.isFinite(
      regularPrice
    ) ||
    regularPrice < 0
  ) {
    errors.regularPrice =
      "Enter a regular price greater than or equal to 0.";
  }

  if (
    form.sellingPrice ===
      "" ||
    !Number.isFinite(
      sellingPrice
    ) ||
    sellingPrice < 0
  ) {
    errors.sellingPrice =
      "Enter a selling price greater than or equal to 0.";
  }

  if (
    form.compareAtPrice
  ) {
    const compareAtPrice =
      Number(
        form.compareAtPrice
      );

    if (
      !Number.isFinite(
        compareAtPrice
      ) ||
      compareAtPrice < 0
    ) {
      errors.compareAtPrice =
        "Compare-at price must be greater than or equal to 0.";
    } else if (
      Number.isFinite(
        sellingPrice
      ) &&
      sellingPrice >
        compareAtPrice
    ) {
      errors.compareAtPrice =
        "Compare-at price cannot be less than the selling price.";
    }
  }

  if (form.costPrice) {
    const costPrice =
      Number(
        form.costPrice
      );

    if (
      !Number.isFinite(
        costPrice
      ) ||
      costPrice < 0
    ) {
      errors.costPrice =
        "Cost price must be greater than or equal to 0.";
    }
  }

  const minimumQuantity =
    Number(
      form.minimumQuantity
    );

  if (
    !Number.isFinite(
      minimumQuantity
    ) ||
    minimumQuantity < 1
  ) {
    errors.minimumQuantity =
      "Minimum quantity must be at least 1.";
  }

  if (
    form.maximumQuantity
  ) {
    const maximumQuantity =
      Number(
        form.maximumQuantity
      );

    if (
      !Number.isFinite(
        maximumQuantity
      ) ||
      maximumQuantity < 1
    ) {
      errors.maximumQuantity =
        "Maximum quantity must be at least 1.";
    } else if (
      Number.isFinite(
        minimumQuantity
      ) &&
      maximumQuantity <
        minimumQuantity
    ) {
      errors.maximumQuantity =
        "Maximum quantity cannot be less than minimum quantity.";
    }
  }

  if (
    form.validFrom &&
    form.validUntil &&
    new Date(
      form.validUntil
    ).getTime() <
      new Date(
        form.validFrom
      ).getTime()
  ) {
    errors.validUntil =
      "Valid until cannot be earlier than valid from.";
  }

  const priority =
    Number(
      form.priority
    );

  if (
    !Number.isInteger(
      priority
    ) ||
    priority < 0 ||
    priority > 999999
  ) {
    errors.priority =
      "Priority must be an integer between 0 and 999999.";
  }

  return errors;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function VariantPriceForm({
  mode,
  initialValue,
  initialSelection,
  lockSelection = false,
  priceLists,
  products,
  loadingPriceLists = false,
  loadingProducts = false,
  submitting = false,
  onSubmit,
  onCancel,
}: VariantPriceFormProps) {
  const [
    form,
    setForm,
  ] =
    useState<LocalFormState>(
      () =>
        getInitialFormState(
          initialValue,
          initialSelection
        )
    );

  const [
    errors,
    setErrors,
  ] =
    useState<VariantPriceFormErrors>(
      {}
    );

  useEffect(
    () => {
      setForm(
        getInitialFormState(
          initialValue,
          initialSelection
        )
      );

      setErrors({});
    },
    [
      initialValue,
      initialSelection,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Options
  |--------------------------------------------------------------------------
  */

  const priceListOptions =
    useMemo(
      () =>
        priceLists.map(
          (
            priceList
          ) => ({
            value:
              priceList.id,

            label:
              `${priceList.name} (${priceList.code}) — ${priceList.currencyCode}`,
          })
        ),
      [
        priceLists,
      ]
    );

  const productOptions =
    useMemo(
      () =>
        products.map(
          (
            product
          ) => ({
            value:
              product.id,

            label:
              product.parentSku
                ? `${product.name} (${product.parentSku})`
                : product.name,
          })
        ),
      [
        products,
      ]
    );

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (
            product
          ) =>
            product.id ===
            form.productId
        ) ||
        null,
      [
        products,
        form.productId,
      ]
    );

  const availableVariants =
    useMemo(
      () =>
        (
          selectedProduct
            ?.variants ||
          []
        )
          .filter(
            (
              variant
            ) =>
              Boolean(
                variant.id
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              Number(
                first.sortOrder ||
                  0
              ) -
              Number(
                second.sortOrder ||
                  0
              )
          ),
      [
        selectedProduct,
      ]
    );

  const variantOptions =
    useMemo(
      () =>
        availableVariants.map(
          (
            variant
          ) => ({
            value:
              variant.id as string,

            label:
              `${
                variant.name ||
                (variant.isDefault
                  ? "Default variant"
                  : "Variant")
              } — ${variant.sku}`,
          })
        ),
      [
        availableVariants,
      ]
    );

  const selectedPriceList =
    useMemo(
      () =>
        priceLists.find(
          (
            priceList
          ) =>
            priceList.id ===
            form.priceListId
        ),
      [
        priceLists,
        form.priceListId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Calculated Values
  |--------------------------------------------------------------------------
  */

  const discount =
    useMemo(
      () => {
        const regular =
          Number(
            form.regularPrice
          );

        const selling =
          Number(
            form.sellingPrice
          );

        if (
          !Number.isFinite(
            regular
          ) ||
          !Number.isFinite(
            selling
          ) ||
          regular <= 0 ||
          selling >= regular
        ) {
          return {
            amount:
              0,

            percentage:
              0,
          };
        }

        const amount =
          regular -
          selling;

        return {
          amount,

          percentage:
            (
              amount /
              regular
            ) *
            100,
        };
      },
      [
        form.regularPrice,
        form.sellingPrice,
      ]
    );

  const currencyCode =
    selectedPriceList
      ?.currencyCode ||
    "AED";

  /*
  |--------------------------------------------------------------------------
  | Field Handlers
  |--------------------------------------------------------------------------
  */

  const updateField =
    <
      K extends keyof LocalFormState,
    >(
      field:
        K,
      value:
        LocalFormState[K]
    ) => {
      setForm(
        (
          previous
        ) => ({
          ...previous,

          [field]:
            value,
        })
      );

      setErrors(
        (
          previous
        ) => ({
          ...previous,

          [field]:
            undefined,

          form:
            undefined,
        })
      );
    };

  const handleProductChange =
    (
      productId:
        string
    ) => {
      setForm(
        (
          previous
        ) => ({
          ...previous,

          productId,

          productVariantId:
            "",
        })
      );

      setErrors(
        (
          previous
        ) => ({
          ...previous,

          productId:
            undefined,

          productVariantId:
            undefined,

          form:
            undefined,
        })
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const validationErrors =
        validateForm(
          form
        );

      if (
        Object.keys(
          validationErrors
        ).length >
        0
      ) {
        setErrors(
          validationErrors
        );

        return;
      }

      try {
        await onSubmit({
          productVariantId:
            form.productVariantId,

          priceListId:
            form.priceListId,

          regularPrice:
            Number(
              form.regularPrice
            ),

          sellingPrice:
            Number(
              form.sellingPrice
            ),

          compareAtPrice:
            toNullableNumber(
              form.compareAtPrice
            ),

          costPrice:
            toNullableNumber(
              form.costPrice
            ),

          minimumQuantity:
            Number(
              form.minimumQuantity
            ),

          maximumQuantity:
            toNullableNumber(
              form.maximumQuantity
            ),

          validFrom:
            toApiDate(
              form.validFrom
            ),

          validUntil:
            toApiDate(
              form.validUntil
            ),

          priority:
            Number(
              form.priority
            ),

          isActive:
            form.isActive,
        });
      } catch (
        submitError
      ) {
        const apiError =
          submitError as {
            data?: {
              message?: string;

              errors?: Array<{
                msg?: string;
                message?: string;
              }>;
            };

            message?: string;
          };

        setErrors({
          form:
            apiError.data
              ?.message ||
            apiError.data
              ?.errors?.[0]
              ?.msg ||
            apiError.data
              ?.errors?.[0]
              ?.message ||
            apiError.message ||
            "Unable to save the variant price.",
        });
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      {errors.form && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-red-800">
            Unable to save
            variant price
          </p>

          <p className="mt-1 text-sm text-red-700">
            {
              errors.form
            }
          </p>
        </div>
      )}

      <FormCard
        title="Product and price list"
        description="Choose the product variant and the price list where this price will apply."
        headerContent={
          <PackageSearch
            size={
              20
            }
            className="text-[#6d7175]"
          />
        }
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SelectField
            id="variant-price-product"
            label="Product"
            required
            value={
              form.productId
            }
            options={
              productOptions
            }
            placeholder="Select a product"
            loading={
              loadingProducts
            }
            disabled={
              submitting ||
              mode ===
                "edit" ||
              lockSelection
            }
            error={
              errors.productId
            }
            onChange={(
              event
            ) =>
              handleProductChange(
                event.target
                  .value
              )
            }
          />

          <SelectField
            id="variant-price-variant"
            label="Product variant"
            required
            value={
              form.productVariantId
            }
            options={
              variantOptions
            }
            placeholder={
              !form.productId
                ? "Select a product first"
                : availableVariants.length ===
                    0
                  ? "No variants available"
                  : "Select a variant"
            }
            disabled={
              submitting ||
              lockSelection ||
              !form.productId ||
              availableVariants.length ===
                0
            }
            error={
              errors.productVariantId
            }
            helpText={
              form.productId &&
              availableVariants.length ===
                0
                ? "The selected product has no available variants."
                : undefined
            }
            onChange={(
              event
            ) =>
              updateField(
                "productVariantId",
                event.target
                  .value
              )
            }
          />

          <div className="lg:col-span-2">
            <SelectField
              id="variant-price-price-list"
              label="Price list"
              required
              value={
                form.priceListId
              }
              options={
                priceListOptions
              }
              placeholder="Select a price list"
              loading={
                loadingPriceLists
              }
              disabled={
                submitting ||
                lockSelection
              }
              error={
                errors.priceListId
              }
              onChange={(
                event
              ) =>
                updateField(
                  "priceListId",
                  event.target
                    .value
                )
              }
            />
          </div>
        </div>
      </FormCard>

      <FormCard
        title="Price details"
        description="Enter the regular price, actual selling price and optional reference or cost prices."
        headerContent={
          <BadgeDollarSign
            size={
              20
            }
            className="text-[#6d7175]"
          />
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            id="variant-price-regular"
            label={`Regular price (${currencyCode})`}
            required
            type="number"
            min="0"
            step="0.0001"
            value={
              form.regularPrice
            }
            disabled={
              submitting
            }
            error={
              errors.regularPrice
            }
            placeholder="0.00"
            onChange={(
              event
            ) =>
              updateField(
                "regularPrice",
                event.target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-selling"
            label={`Selling price (${currencyCode})`}
            required
            type="number"
            min="0"
            step="0.0001"
            value={
              form.sellingPrice
            }
            disabled={
              submitting
            }
            error={
              errors.sellingPrice
            }
            placeholder="0.00"
            onChange={(
              event
            ) =>
              updateField(
                "sellingPrice",
                event.target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-compare-at"
            label={`Compare-at price (${currencyCode})`}
            type="number"
            min="0"
            step="0.0001"
            value={
              form.compareAtPrice
            }
            disabled={
              submitting
            }
            error={
              errors.compareAtPrice
            }
            placeholder="Optional"
            helpText="Used to show a crossed-out reference price."
            onChange={(
              event
            ) =>
              updateField(
                "compareAtPrice",
                event.target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-cost"
            label={`Cost price (${currencyCode})`}
            type="number"
            min="0"
            step="0.0001"
            value={
              form.costPrice
            }
            disabled={
              submitting
            }
            error={
              errors.costPrice
            }
            placeholder="Optional"
            helpText="Internal cost for margin reporting."
            onChange={(
              event
            ) =>
              updateField(
                "costPrice",
                event.target
                  .value
              )
            }
          />
        </div>

        {discount.percentage >
          0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-semibold text-emerald-800">
              Discount
            </span>

            <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-bold text-emerald-700 shadow-sm">
              {discount.percentage.toLocaleString(
                "en-US",
                {
                  maximumFractionDigits:
                    2,
                }
              )}
              %
            </span>

            <span className="text-sm text-emerald-700">
              Customer saves{" "}
              {new Intl.NumberFormat(
                "en-US",
                {
                  style:
                    "currency",

                  currency:
                    currencyCode,

                  minimumFractionDigits:
                    2,

                  maximumFractionDigits:
                    2,
                }
              ).format(
                discount.amount
              )}
            </span>
          </div>
        )}
      </FormCard>

      <FormCard
        title="Quantity tier"
        description="Define the quantity range where this price applies. Leave maximum quantity empty for an open-ended tier."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField
            id="variant-price-minimum-quantity"
            label="Minimum quantity"
            required
            type="number"
            min="1"
            step="0.0001"
            value={
              form.minimumQuantity
            }
            disabled={
              submitting
            }
            error={
              errors.minimumQuantity
            }
            helpText="The lowest quantity eligible for this price."
            onChange={(
              event
            ) =>
              updateField(
                "minimumQuantity",
                event.target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-maximum-quantity"
            label="Maximum quantity"
            type="number"
            min="1"
            step="0.0001"
            value={
              form.maximumQuantity
            }
            disabled={
              submitting
            }
            error={
              errors.maximumQuantity
            }
            placeholder="No maximum"
            helpText="Leave empty when the tier has no upper limit."
            onChange={(
              event
            ) =>
              updateField(
                "maximumQuantity",
                event.target
                  .value
              )
            }
          />
        </div>
      </FormCard>

      <FormCard
        title="Effective dates"
        description="Schedule when this price becomes valid and when it expires. Leave both empty for a permanent price."
        headerContent={
          <CalendarDays
            size={
              20
            }
            className="text-[#6d7175]"
          />
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField
            id="variant-price-valid-from"
            label="Valid from"
            type="date"
            value={
              form.validFrom
            }
            disabled={
              submitting
            }
            error={
              errors.validFrom
            }
            onChange={(
              event
            ) =>
              updateField(
                "validFrom",
                event.target
                  .value
              )
            }
          />

          <TextField
            id="variant-price-valid-until"
            label="Valid until"
            type="date"
            min={
              form.validFrom ||
              undefined
            }
            value={
              form.validUntil
            }
            disabled={
              submitting
            }
            error={
              errors.validUntil
            }
            onChange={(
              event
            ) =>
              updateField(
                "validUntil",
                event.target
                  .value
              )
            }
          />
        </div>
      </FormCard>

      <FormCard
        title="Rules and status"
        description="Lower priority numbers are evaluated before higher numbers when multiple eligible prices exist."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField
            id="variant-price-priority"
            label="Priority"
            required
            type="number"
            min="0"
            max="999999"
            step="1"
            value={
              form.priority
            }
            disabled={
              submitting
            }
            error={
              errors.priority
            }
            helpText="Use 100 for the normal priority."
            onChange={(
              event
            ) =>
              updateField(
                "priority",
                event.target
                  .value
              )
            }
          />

          <div>
            <p className="mb-2 text-sm font-medium text-[#202223]">
              Status
            </p>

            <label
              className={[
                "flex min-h-10 cursor-pointer items-center justify-between rounded-lg border px-4 py-3",
                "border-[#babfc3] bg-white transition hover:border-[#8c9196]",
                submitting
                  ? "cursor-not-allowed bg-[#f6f6f7] opacity-60"
                  : "",
              ].join(" ")}
            >
              <div>
                <p className="text-sm font-semibold text-[#202223]">
                  Active price
                </p>

                <p className="mt-1 text-xs text-[#6d7175]">
                  Active prices
                  can be selected
                  by the pricing
                  resolver.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                disabled={
                  submitting
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "isActive",
                    event.target
                      .checked
                  )
                }
                className="h-4 w-4 rounded border-[#8c9196] text-[#303030] focus:ring-[#303030]/20"
              />
            </label>
          </div>
        </div>
      </FormCard>

      <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 rounded-xl border border-[#e1e3e5] bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={
            submitting
          }
          onClick={
            onCancel
          }
          className={[
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg",
            "border border-[#babfc3] bg-white px-4",
            "text-sm font-semibold text-[#202223]",
            "transition hover:bg-[#f6f6f7]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          <ArrowLeft
            size={
              16
            }
          />

          Cancel
        </button>

        <button
          type="submit"
          disabled={
            submitting
          }
          className={[
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg",
            "bg-[#303030] px-5",
            "text-sm font-semibold text-white",
            "transition hover:bg-[#1f1f1f]",
            "focus:outline-none focus:ring-2 focus:ring-[#303030]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          {submitting ? (
            <LoaderCircle
              size={
                17
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                17
              }
            />
          )}

          {submitting
            ? "Saving..."
            : mode ===
                "create"
              ? "Create Price"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}