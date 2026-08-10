import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface WishlistItem {
  productId: string;
  productSlug: string;
  productName: string;
  productType: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  variantId: string | null;
  sku: string | null;
  unitPrice: number | null;
  compareAtPrice: number | null;
  currencyCode: string;
  taxPercent: number;
  isTaxInclusive: boolean;
  addedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  hydrated: boolean;
}

const initialState: WishlistState = {
  items: [],
  hydrated: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    hydrateWishlist(state, action: PayloadAction<WishlistItem[]>) {
      const unique = new Map<string, WishlistItem>();

      (Array.isArray(action.payload) ? action.payload : []).forEach((item) => {
        if (item?.productId) {
          unique.set(item.productId, item);
        }
      });

      state.items = Array.from(unique.values());
      state.hydrated = true;
    },

    addWishlistItem(state, action: PayloadAction<WishlistItem>) {
      const index = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (index >= 0) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
        };
        return;
      }

      state.items.unshift(action.payload);
    },

    removeWishlistItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },

    toggleWishlistItem(state, action: PayloadAction<WishlistItem>) {
      const exists = state.items.some(
        (item) => item.productId === action.payload.productId
      );

      state.items = exists
        ? state.items.filter(
            (item) => item.productId !== action.payload.productId
          )
        : [action.payload, ...state.items];
    },

    clearWishlist(state) {
      state.items = [];
    },
  },
});

export const {
  hydrateWishlist,
  addWishlistItem,
  removeWishlistItem,
  toggleWishlistItem,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;

interface RootWithWishlist {
  wishlist: WishlistState;
}

export const selectWishlistItems = (state: RootWithWishlist) =>
  state.wishlist.items;

export const selectWishlistHydrated = (state: RootWithWishlist) =>
  state.wishlist.hydrated;

export const selectWishlistItemCount = createSelector(
  [selectWishlistItems],
  (items) => items.length
);

export const makeSelectIsProductWishlisted = (productId: string) =>
  createSelector(
    [selectWishlistItems],
    (items) => items.some((item) => item.productId === productId)
  );
