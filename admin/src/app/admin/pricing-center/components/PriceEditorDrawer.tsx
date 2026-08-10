"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  BadgeDollarSign,
  X,
} from "lucide-react";

import VariantPriceForm from "@/components/admin/pricing/VariantPriceForm";

import {
  useCreateVariantPriceMutation,
  useUpdateVariantPriceMutation,
} from "@/store/api/variantPriceApi";

import type {
  Product,
} from "@/types/product";

import type {
  VariantPrice,
  VariantPriceFormValues,
} from "@/types/variantPrice";

import type {
  PriceMatrixPrice,
  PriceMatrixPriceList,
  PriceMatrixVariant,
} from "@/types/priceMatrix";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface PriceEditorDrawerProps {
  open:
    boolean;

  product:
    Product | null;

  variant:
    PriceMatrixVariant | null;

  priceList:
    PriceMatrixPriceList | null;

  price:
    PriceMatrixPrice | null;

  onClose:
    () => void;

  onSaved:
    () =>
      Promise<void> |
      void;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function buildEditablePrice(
  product:
    Product,

  variant:
    PriceMatrixVariant,

  priceList:
    PriceMatrixPriceList,

  price:
    PriceMatrixPrice
): VariantPrice {
  return {
    id:
      price.id,

    companyId:
      product.companyId,

    productVariantId:
      variant.id,

    priceListId:
      priceList.id,

    regularPrice:
      Number(
        price.regularPrice
      ),

    sellingPrice:
      Number(
        price.sellingPrice
      ),

    compareAtPrice:
      price.compareAtPrice ===
        null ||
      price.compareAtPrice ===
        undefined
        ? null
        : Number(
            price.compareAtPrice
          ),

    costPrice:
      price.costPrice ===
        null ||
      price.costPrice ===
        undefined
        ? null
        : Number(
            price.costPrice
          ),

    minimumQuantity:
      Number(
        price.minimumQuantity
      ),

    maximumQuantity:
      price.maximumQuantity ===
        null ||
      price.maximumQuantity ===
        undefined
        ? null
        : Number(
            price.maximumQuantity
          ),

    validFrom:
      price.validFrom ??
      null,

    validUntil:
      price.validUntil ??
      null,

    priority:
      Number(
        price.priority ??
          100
      ),

    isActive:
      price.isActive !==
      false,

    createdBy:
      null,

    updatedBy:
      null,

    createdAt:
      price.createdAt ||
      "",

    updatedAt:
      price.updatedAt ||
      "",

    discountAmount:
      Number(
        price.discountAmount ||
          0
      ),

    discountPercent:
      Number(
        price.discountPercent ||
          0
      ),

    variant: {
      id:
        variant.id,

      companyId:
        product.companyId,

      productId:
        product.id,

      name:
        variant.name,

      sku:
        variant.sku,

      isActive:
        variant.status ===
        "ACTIVE",

      product: {
        id:
          product.id,

        name:
          product.name,

        slug:
          product.slug,

        status:
          product.status,

        isActive:
          product.status ===
          "ACTIVE",
      },
    },

    priceList:
      priceList as unknown as VariantPrice["priceList"],
  };
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function PriceEditorDrawer({
  open,
  product,
  variant,
  priceList,
  price,
  onClose,
  onSaved,
}: PriceEditorDrawerProps) {
  const [
    createVariantPrice,
    {
      isLoading:
        creating,
    },
  ] =
    useCreateVariantPriceMutation();

  const [
    updateVariantPrice,
    {
      isLoading:
        updating,
    },
  ] =
    useUpdateVariantPriceMutation();

  const mode:
    | "create"
    | "edit" =
    price
      ? "edit"
      : "create";

  const submitting =
    creating ||
    updating;

  const initialValue =
    useMemo(
      () => {
        if (
          !product ||
          !variant ||
          !priceList ||
          !price
        ) {
          return null;
        }

        return buildEditablePrice(
          product,
          variant,
          priceList,
          price
        );
      },
      [
        product,
        variant,
        priceList,
        price,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Escape Key and Body Scroll Lock
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow =
        "hidden";

      const handleKeyDown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
              "Escape" &&
            !submitting
          ) {
            onClose();
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.body.style
          .overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      open,
      submitting,
      onClose,
    ]
  );

  if (
    !open ||
    !product ||
    !variant ||
    !priceList
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      values:
        VariantPriceFormValues
    ) => {
      if (
        mode ===
          "edit" &&
        price
      ) {
        await updateVariantPrice({
          id:
            price.id,

          body:
            values,
        }).unwrap();
      } else {
        await createVariantPrice(
          values
        ).unwrap();
      }

      await onSaved();

      onClose();
    };

  return (
    <div className="fixed inset-0 z-[100]">
      {/*
      ----------------------------------------------------------------------
      Backdrop
      ----------------------------------------------------------------------
      */}

      <button
        type="button"
        aria-label="Close price editor"
        disabled={
          submitting
        }
        onClick={
          onClose
        }
        className={[
          "absolute inset-0 bg-black/35 backdrop-blur-[1px]",
          "disabled:cursor-not-allowed",
        ].join(" ")}
      />

      {/*
      ----------------------------------------------------------------------
      Drawer
      ----------------------------------------------------------------------
      */}

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-editor-title"
        className={[
          "absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col",
          "border-l border-[#d2d5d8] bg-[#f6f6f7]",
          "shadow-2xl",
        ].join(" ")}
      >
        {/*
        --------------------------------------------------------------------
        Drawer Header
        --------------------------------------------------------------------
        */}

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d2d5d8] bg-white px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f2f3] text-[#303030]">
              <BadgeDollarSign
                size={
                  20
                }
              />
            </div>

            <div className="min-w-0">
              <h2
                id="price-editor-title"
                className="text-lg font-semibold text-[#202223]"
              >
                {mode ===
                "edit"
                  ? "Edit Variant Price"
                  : "Add Variant Price"}
              </h2>

              <p className="mt-1 truncate text-sm text-[#6d7175]">
                {
                  product.name
                }
                {" · "}
                {
                  variant.name
                }
                {" · "}
                {
                  priceList.name
                }
              </p>

              <p className="mt-1 font-mono text-xs text-[#8c9196]">
                {
                  variant.sku
                }
                {" · "}
                {
                  priceList.currencyCode
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close price editor"
            disabled={
              submitting
            }
            onClick={
              onClose
            }
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              "border border-[#d2d5d8] bg-white text-[#6d7175]",
              "transition hover:bg-[#f6f6f7] hover:text-[#202223]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <X
              size={
                18
              }
            />
          </button>
        </header>

        {/*
        --------------------------------------------------------------------
        Drawer Body
        --------------------------------------------------------------------
        */}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <VariantPriceForm
            mode={
              mode
            }
            initialValue={
              initialValue
            }
            initialSelection={{
              productId:
                product.id,

              productVariantId:
                variant.id,

              priceListId:
                priceList.id,
            }}
            lockSelection
            products={[
              product,
            ]}
            priceLists={[
              priceList as unknown as VariantPrice["priceList"],
            ]}
            loadingProducts={
              false
            }
            loadingPriceLists={
              false
            }
            submitting={
              submitting
            }
            onSubmit={
              handleSubmit
            }
            onCancel={
              onClose
            }
          />
        </div>
      </aside>
    </div>
  );
}