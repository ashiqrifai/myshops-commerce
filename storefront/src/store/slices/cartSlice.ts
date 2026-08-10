import {
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import type {
  PayloadAction,
} from "@reduxjs/toolkit";

export interface CartSelectedAttribute {
  attributeId: string;
  attributeName: string;

  optionId: string;
  optionLabel: string;

  swatchValue?:
    | string
    | null;
}

export interface CartExtendedWarranty {
  code:
    | "EXTENDED_WARRANTY_1_YEAR"
    | "EXTENDED_WARRANTY_2_YEAR";

  periodYears:
    | 1
    | 2;

  percentage: number;
  unitPrice: number;
  currencyCode: string;
}

export interface CartItem {
  key: string;

  productId: string;
  productSlug: string;
  productName: string;

  variantId: string;
  sku: string;

  imageUrl:
    | string
    | null;

  unitPrice: number;

  compareAtPrice:
    | number
    | null;

  currencyCode: string;

  taxPercent: number;

  isTaxInclusive: boolean;

  quantity: number;

  extendedWarranty?:
    | CartExtendedWarranty
    | null;

  selectedAttributes:
    CartSelectedAttribute[];
}

export interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

const initialState: CartState = {
  items: [],
  hydrated: false,
};

const clampQuantity = (
  value: number
) => {
  const quantity =
    Math.floor(
      Number(value)
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
    name: "cart",

    initialState,

    reducers: {
      hydrateCart(
        state,
        action:
          PayloadAction<
            CartItem[]
          >
      ) {
        state.items =
          Array.isArray(
            action.payload
          )
            ? action.payload
            : [];

        state.hydrated =
          true;
      },

      addItem(
        state,
        action:
          PayloadAction<CartItem>
      ) {
        const incoming = {
          ...action.payload,

          quantity:
            clampQuantity(
              action.payload
                .quantity
            ),
        };

        const existing =
          state.items.find(
            (item) =>
              item.key ===
              incoming.key
          );

        if (existing) {
          existing.quantity =
            clampQuantity(
              existing.quantity +
                incoming.quantity
            );

          existing.unitPrice =
            incoming.unitPrice;

          existing.compareAtPrice =
            incoming.compareAtPrice;

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

          return;
        }

        state.items.push(
          incoming
        );
      },

      setItemQuantity(
        state,
        action:
          PayloadAction<{
            key: string;
            quantity: number;
          }>
      ) {
        const item =
          state.items.find(
            (entry) =>
              entry.key ===
              action.payload.key
          );

        if (!item) {
          return;
        }

        item.quantity =
          clampQuantity(
            action.payload
              .quantity
          );
      },

      incrementItem(
        state,
        action:
          PayloadAction<string>
      ) {
        const item =
          state.items.find(
            (entry) =>
              entry.key ===
              action.payload
          );

        if (item) {
          item.quantity =
            clampQuantity(
              item.quantity + 1
            );
        }
      },

      decrementItem(
        state,
        action:
          PayloadAction<string>
      ) {
        const item =
          state.items.find(
            (entry) =>
              entry.key ===
              action.payload
          );

        if (!item) {
          return;
        }

        if (
          item.quantity <= 1
        ) {
          state.items =
            state.items.filter(
              (entry) =>
                entry.key !==
                action.payload
            );

          return;
        }

        item.quantity -= 1;
      },

      setItemExtendedWarranty(
        state,
        action:
          PayloadAction<{
            key: string;
            warranty:
              | CartExtendedWarranty
              | null;
          }>
      ) {
        const item =
          state.items.find(
            (entry) =>
              entry.key ===
              action.payload.key
          );

        if (!item) {
          return;
        }

        item.extendedWarranty =
          action.payload.warranty;
      },

      removeItem(
        state,
        action:
          PayloadAction<string>
      ) {
        state.items =
          state.items.filter(
            (item) =>
              item.key !==
              action.payload
          );
      },

      clearCart(state) {
        state.items = [];
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
  removeItem,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

interface RootWithCart {
  cart: CartState;
}

export const selectCart =
  (
    state: RootWithCart
  ) => state.cart;

export const selectCartItems =
  (
    state: RootWithCart
  ) => state.cart.items;

export const selectCartHydrated =
  (
    state: RootWithCart
  ) =>
    state.cart.hydrated;

export const selectCartItemCount =
  createSelector(
    [selectCartItems],
    (items) =>
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
    [selectCartItems],
    (items) =>
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

export const selectCartWarrantySubtotal =
  createSelector(
    [selectCartItems],
    (items) =>
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          (item.extendedWarranty
            ?.unitPrice ||
            0) *
            item.quantity,
        0
      )
  );

export const selectCartSubtotal =
  createSelector(
    [
      selectCartProductSubtotal,
      selectCartWarrantySubtotal,
    ],
    (
      productSubtotal,
      warrantySubtotal
    ) =>
      productSubtotal +
      warrantySubtotal
  );

export const selectCartTax =
  createSelector(
    [selectCartItems],
    (items) =>
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
            (item.extendedWarranty
              ?.unitPrice ||
              0) *
            item.quantity;

          return (
            total +
            (productLine +
              warrantyLine) *
              (item.taxPercent /
                100)
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
    ) => subtotal + tax
  );
