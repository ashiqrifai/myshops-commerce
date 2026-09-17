import {
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import type {
  PayloadAction,
} from "@reduxjs/toolkit";

import type { CartBundleSelection } from "@/types/bundlePromotion";

export interface CartSelectedAttribute {
  attributeId:
    string;

  attributeName:
    string;

  optionId:
    string;

  optionLabel:
    string;

  swatchValue?:
    | string
    | null;
}

export type ProtectionSchemeType =
  | "EXTENDED_WARRANTY"
  | "DAMAGE_PROTECTION";

export type ProtectionPricingMethod =
  | "PERCENTAGE"
  | "FIXED";

export type ProtectionPricingSource =
  | "PRODUCT"
  | "BRAND"
  | "CATEGORY"
  | "DEFAULT";

export interface CartExtendedWarranty {
  schemeId:
    string;

  assignmentId:
    | string
    | null;

  code:
    string;

  name:
    string;

  schemeType:
    ProtectionSchemeType;

  durationMonths:
    | number
    | null;

  periodYears:
    | number
    | null;

  pricingMethod:
    ProtectionPricingMethod;

  percentage:
    | number
    | null;

  fixedAmount:
    | number
    | null;

  unitPrice:
    number;

  totalPrice:
    number;

  currencyCode:
    string;

  pricingSource:
    ProtectionPricingSource;

  coverageStartMode:
    | string
    | null;
}

export type CartFulfilmentMethod =
  | "DELIVERY"
  | "PICKUP";

export interface CartGiftVoucher {
  promotionId: string | null;
  code: string | null;
  name: string | null;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  fundingType?: string | null;
  fundingSource?: string | null;
  internalValue?: number;
  externalValue?: number;
  validFrom: string | null;
  validUntil: string | null;
  currencyCode?: string | null;
}

export interface CartItem {
  key:
    string;

  productId:
    string;

  productSlug:
    string;

  productName:
    string;

  variantId:
    string;

  sku:
    string;

  imageUrl:
    | string
    | null;

  unitPrice:
    number;

  compareAtPrice:
    | number
    | null;

  regularPrice?: number | null;
  baseSellingPrice?: number | null;
  priceDiscountAmount?: number | null;
  giftVoucherDiscountAmount?: number | null;
  totalDiscountAmount?: number | null;
  totalDiscountPercent?: number | null;
  giftVoucher?: CartGiftVoucher | null;

  currencyCode:
    string;

  taxPercent:
    number;

  isTaxInclusive:
    boolean;

  quantity:
    number;

  fulfilmentMethod?:
    CartFulfilmentMethod;

  pickupLocationId?:
    string | null;

  pickupLocationCode?:
    string | null;

  pickupLocationName?:
    string | null;

  pickupLeadTimeMinutes?:
    number | null;

  extendedWarranty?:
    | CartExtendedWarranty
    | null;

  bundleSelections?:
    CartBundleSelection[];

  selectedAttributes:
    CartSelectedAttribute[];
}

/*
 * Real validated coupon returned
 * by the backend coupon API.
 *
 * The frontend stores this only
 * for display and continuity between
 * Cart -> Checkout.
 *
 * The backend validates the coupon
 * again during final order placement.
 */
export interface CartCoupon {
  code:
    string;

  name:
    string;

  discountType:
    | "PERCENTAGE"
    | "FIXED"
    | "FREE_SHIPPING";

  discountValue:
    number;

  merchandiseDiscount:
    number;

  deliveryDiscount:
    number;

  discountAmount:
    number;

  finalDeliveryAmount:
    number;
}

export interface CartState {
  items:
    CartItem[];

  appliedCoupon:
    | CartCoupon
    | null;

  hydrated:
    boolean;
}

const initialState:
  CartState = {
  items:
    [],

  appliedCoupon:
    null,

  hydrated:
    false,
};

const clampQuantity = (
  value:
    number
) => {
  const quantity =
    Math.floor(
      Number(
        value
      )
    );

  if (
    !Number.isFinite(
      quantity
    )
  ) {
    return 1;
  }

  return Math.max(
    1,

    Math.min(
      quantity,
      999
    )
  );
};

const cartSlice =
  createSlice({
    name:
      "cart",

    initialState,

    reducers: {
      hydrateCart(
        state,
        action:
          PayloadAction<{
            items:
              CartItem[];
      
            appliedCoupon:
              | CartCoupon
              | null;
          }>
      ) {
        state.items =
          Array.isArray(
            action.payload.items
          )
            ? action.payload.items.map(
                (item) => ({
                  ...item,

                  fulfilmentMethod:
                    item.fulfilmentMethod ||
                    "DELIVERY",

                  pickupLocationId:
                    item.pickupLocationId ||
                    null,

                  pickupLocationCode:
                    item.pickupLocationCode ||
                    null,

                  pickupLocationName:
                    item.pickupLocationName ||
                    null,

                  pickupLeadTimeMinutes:
                    item.pickupLeadTimeMinutes ??
                    null,

                  regularPrice:
                    item.regularPrice ??
                    item.compareAtPrice ??
                    null,

                  baseSellingPrice:
                    item.baseSellingPrice ??
                    item.unitPrice,

                  priceDiscountAmount:
                    item.priceDiscountAmount ??
                    null,

                  giftVoucherDiscountAmount:
                    item.giftVoucherDiscountAmount ??
                    null,

                  totalDiscountAmount:
                    item.totalDiscountAmount ??
                    null,

                  totalDiscountPercent:
                    item.totalDiscountPercent ??
                    null,

                  giftVoucher:
                    item.giftVoucher ??
                    null,

                  bundleSelections:
                    Array.isArray(item.bundleSelections) ? item.bundleSelections : [],
                })
              )
            : [];
      
        state.appliedCoupon =
          action.payload
            .appliedCoupon ||
          null;
      
        state.hydrated =
          true;
      },

      addItem(
        state,
        action:
          PayloadAction<
            CartItem
          >
      ) {
        const incoming = {
          ...action.payload,

          quantity:
            clampQuantity(
              action.payload
                .quantity
            ),

          fulfilmentMethod:
            action.payload
              .fulfilmentMethod ||
            "DELIVERY",

          pickupLocationId:
            action.payload
              .pickupLocationId ||
            null,

          pickupLocationCode:
            action.payload
              .pickupLocationCode ||
            null,

          pickupLocationName:
            action.payload
              .pickupLocationName ||
            null,

          pickupLeadTimeMinutes:
            action.payload
              .pickupLeadTimeMinutes ??
            null,

          bundleSelections:
            Array.isArray(action.payload.bundleSelections) ? action.payload.bundleSelections : [],
        };

        const existing =
          state.items.find(
            (
              item
            ) =>
              item.key ===
              incoming.key
          );

        if (
          existing
        ) {
          existing.quantity =
            clampQuantity(
              existing.quantity +
                incoming.quantity
            );

          existing.unitPrice =
            incoming.unitPrice;

          existing.compareAtPrice =
            incoming.compareAtPrice;

          existing.regularPrice =
            incoming.regularPrice;

          existing.baseSellingPrice =
            incoming.baseSellingPrice;

          existing.priceDiscountAmount =
            incoming.priceDiscountAmount;

          existing.giftVoucherDiscountAmount =
            incoming.giftVoucherDiscountAmount;

          existing.totalDiscountAmount =
            incoming.totalDiscountAmount;

          existing.totalDiscountPercent =
            incoming.totalDiscountPercent;

          existing.giftVoucher =
            incoming.giftVoucher;

          existing.imageUrl =
            incoming.imageUrl;

          existing.selectedAttributes =
            incoming.selectedAttributes;

          if (
            incoming.extendedWarranty !==
            undefined
          ) {
            existing.extendedWarranty =
              incoming.extendedWarranty;
          }

          existing.bundleSelections = incoming.bundleSelections;

          /*
           * Cart contents changed.
           *
           * The existing coupon calculation may
           * no longer be valid because minimum
           * order value or discount amount can
           * change.
           *
           * Clear it and require revalidation.
           */
          state.appliedCoupon =
            null;

          return;
        }

        state.items.push(
          incoming
        );

        /*
         * Cart changed, so invalidate
         * the previously validated coupon.
         */
        state.appliedCoupon =
          null;
      },

      setItemQuantity(
        state,
        action:
          PayloadAction<{
            key:
              string;

            quantity:
              number;
          }>
      ) {
        const item =
          state.items.find(
            (
              entry
            ) =>
              entry.key ===
              action.payload
                .key
          );

        if (
          !item
        ) {
          return;
        }

        const nextQuantity =
          clampQuantity(
            action.payload
              .quantity
          );

        if (
          item.quantity ===
          nextQuantity
        ) {
          return;
        }

        item.quantity =
          nextQuantity;
        if (Array.isArray(item.bundleSelections)) {
          item.bundleSelections = item.bundleSelections.map((bundle) =>
            bundle.priceMode === "FIXED_TOTAL"
              ? { ...bundle, selectionQuantity: nextQuantity }
              : bundle
          );
        }

        /*
         * Quantity changed.
         * Coupon must be validated again.
         */
        state.appliedCoupon =
          null;
      },

      incrementItem(
        state,
        action:
          PayloadAction<
            string
          >
      ) {
        const item =
          state.items.find(
            (
              entry
            ) =>
              entry.key ===
              action.payload
          );

        if (
          item
        ) {
          item.quantity =
            clampQuantity(
              item.quantity +
                1
            );
          if (Array.isArray(item.bundleSelections)) {
            item.bundleSelections = item.bundleSelections.map((bundle) =>
              bundle.priceMode === "FIXED_TOTAL"
                ? { ...bundle, selectionQuantity: item.quantity }
                : bundle
            );
          }

          state.appliedCoupon =
            null;
        }
      },

      decrementItem(
        state,
        action:
          PayloadAction<
            string
          >
      ) {
        const item =
          state.items.find(
            (
              entry
            ) =>
              entry.key ===
              action.payload
          );

        if (
          !item
        ) {
          return;
        }

        if (
          item.quantity <=
          1
        ) {
          state.items =
            state.items.filter(
              (
                entry
              ) =>
                entry.key !==
                action.payload
            );

          state.appliedCoupon =
            null;

          return;
        }

        item.quantity -=
          1;
        if (Array.isArray(item.bundleSelections)) {
          item.bundleSelections = item.bundleSelections.map((bundle) =>
            bundle.priceMode === "FIXED_TOTAL"
              ? { ...bundle, selectionQuantity: item.quantity }
              : bundle
          );
        }

        state.appliedCoupon =
          null;
      },

      setItemFulfilment(
        state,
        action:
          PayloadAction<{
            key:
              string;

            fulfilmentMethod:
              CartFulfilmentMethod;

            pickupLocationId?:
              string | null;

            pickupLocationCode?:
              string | null;

            pickupLocationName?:
              string | null;

            pickupLeadTimeMinutes?:
              number | null;
          }>
      ) {
        const item =
          state.items.find(
            (
              entry
            ) =>
              entry.key ===
              action.payload.key
          );

        if (!item) {
          return;
        }

        item.fulfilmentMethod =
          action.payload
            .fulfilmentMethod;

        if (
          action.payload
            .fulfilmentMethod ===
          "PICKUP"
        ) {
          item.pickupLocationId =
            action.payload
              .pickupLocationId ||
            null;

          item.pickupLocationCode =
            action.payload
              .pickupLocationCode ||
            null;

          item.pickupLocationName =
            action.payload
              .pickupLocationName ||
            null;

          item.pickupLeadTimeMinutes =
            action.payload
              .pickupLeadTimeMinutes ??
            null;
        } else {
          item.pickupLocationId =
            null;

          item.pickupLocationCode =
            null;

          item.pickupLocationName =
            null;

          item.pickupLeadTimeMinutes =
            null;
        }

        state.appliedCoupon =
          null;
      },

      setItemExtendedWarranty(
        state,
        action:
          PayloadAction<{
            key:
              string;

            warranty:
              | CartExtendedWarranty
              | null;
          }>
      ) {
        const item =
          state.items.find(
            (
              entry
            ) =>
              entry.key ===
              action.payload
                .key
          );

        if (
          !item
        ) {
          return;
        }

        item.extendedWarranty =
          action.payload
            .warranty;

        /*
         * Warranty changes the cart value.
         */
        state.appliedCoupon =
          null;
      },

      removeItem(
        state,
        action:
          PayloadAction<
            string
          >
      ) {
        const previousLength =
          state.items.length;

        state.items =
          state.items.filter(
            (
              item
            ) =>
              item.key !==
              action.payload
          );

        if (
          previousLength !==
          state.items.length
        ) {
          state.appliedCoupon =
            null;
        }
      },

      /*
       * Store a coupon only after the
       * backend has validated it.
       */
      setAppliedCoupon(
        state,
        action:
          PayloadAction<
            CartCoupon
          >
      ) {
        state.appliedCoupon =
          action.payload;
      },

      clearAppliedCoupon(
        state
      ) {
        state.appliedCoupon =
          null;
      },

      clearCart(
        state
      ) {
        state.items =
          [];

        /*
         * Order completed / cart cleared,
         * therefore the coupon must also go.
         */
        state.appliedCoupon =
          null;
      },
    },
  });

export const {
  hydrateCart,
  addItem,
  setItemQuantity,
  incrementItem,
  decrementItem,
  setItemExtendedWarranty,
  setItemFulfilment,
  removeItem,
  setAppliedCoupon,
  clearAppliedCoupon,
  clearCart,
} =
  cartSlice.actions;

export default
  cartSlice.reducer;

interface RootWithCart {
  cart:
    CartState;
}

export const selectCart =
  (
    state:
      RootWithCart
  ) =>
    state.cart;

export const selectCartItems =
  (
    state:
      RootWithCart
  ) =>
    state.cart
      .items;

export const selectCartHydrated =
  (
    state:
      RootWithCart
  ) =>
    state.cart
      .hydrated;

export const selectAppliedCoupon =
  (
    state:
      RootWithCart
  ) =>
    state.cart
      .appliedCoupon;

export const selectCartItemCount =
  createSelector(
    [
      selectCartItems,
    ],

    (
      items
    ) =>
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,

        0
      )
  );

export const selectCartProductSubtotal =
  createSelector(
    [
      selectCartItems,
    ],

    (
      items
    ) =>
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          item.unitPrice *
            item.quantity,

        0
      )
  );

export const selectCartBundleSubtotal =
  createSelector(
    [selectCartItems],
    (items) =>
      items.reduce(
        (total, item) =>
          total +
          (item.bundleSelections || []).reduce(
            (sum, bundle) => {
              const q = Number(bundle.selectionQuantity || 1);
              if (bundle.priceMode === "ADD_ON") {
                return sum + Number(bundle.priceAmount || 0) * q;
              }
              if (bundle.priceMode === "FIXED_TOTAL" && bundle.priceAmount != null) {
                return sum + (Number(bundle.priceAmount) - item.unitPrice) * q;
              }
              return sum;
            },
            0
          ),
        0
      )
  );

export const selectCartWarrantySubtotal =
  createSelector(
    [
      selectCartItems,
    ],

    (
      items
    ) =>
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          (
            item.extendedWarranty
              ?.unitPrice ||
            0
          ) *
            item.quantity,

        0
      )
  );

export const selectCartSubtotal =
  createSelector(
    [
      selectCartProductSubtotal,
      selectCartWarrantySubtotal,
      selectCartBundleSubtotal,
    ],

    (
      productSubtotal,
      warrantySubtotal,
      bundleSubtotal
    ) =>
      productSubtotal +
      warrantySubtotal +
      bundleSubtotal
  );

export const selectCartTax =
  createSelector(
    [
      selectCartItems,
    ],

    (
      items
    ) =>
      items.reduce(
        (
          total,
          item
        ) => {
          if (
            item.isTaxInclusive
          ) {
            return total;
          }

          const productLine =
            item.unitPrice *
            item.quantity;

          const warrantyLine =
            (
              item.extendedWarranty
                ?.unitPrice ||
              0
            ) *
            item.quantity;

          return (
            total +
            (
              productLine +
              warrantyLine
            ) *
              (
                item.taxPercent /
                100
              )
          );
        },

        0
      )
  );

export const selectCartTotal =
  createSelector(
    [
      selectCartSubtotal,
      selectCartTax,
    ],

    (
      subtotal,
      tax
    ) =>
      subtotal +
      tax
  );

/*
 * Coupon-specific selectors.
 */

export const selectCartCouponDiscount =
  createSelector(
    [
      selectAppliedCoupon,
    ],

    (
      coupon
    ) =>
      coupon
        ?.merchandiseDiscount ||
      0
  );

export const selectCartCouponDeliveryDiscount =
  createSelector(
    [
      selectAppliedCoupon,
    ],

    (
      coupon
    ) =>
      coupon
        ?.deliveryDiscount ||
      0
  );

export const selectCartCouponBenefit =
  createSelector(
    [
      selectAppliedCoupon,
    ],

    (
      coupon
    ) =>
      coupon
        ?.discountAmount ||
      0
  );
