import {
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";

import type {
  PayloadAction,
} from "@reduxjs/toolkit";

export interface RecentlyViewedItem {
  productId: string;
  productSlug: string;
  productName: string;
  productType: string;

  variantId:
    | string
    | null;

  variantName:
    | string
    | null;

  sku:
    | string
    | null;

  imageUrl:
    | string
    | null;

  brandName:
    | string
    | null;

  categoryName:
    | string
    | null;

  unitPrice:
    | number
    | null;

  compareAtPrice:
    | number
    | null;

  currencyCode: string;

  taxPercent: number;

  isTaxInclusive: boolean;

  viewedAt: string;
}

export interface RecentlyViewedState {
  items:
    RecentlyViewedItem[];

  hydrated:
    boolean;
}

const MAX_RECENTLY_VIEWED =
  20;

const initialState:
  RecentlyViewedState = {
    items: [],
    hydrated: false,
  };

const normalizeNumber = (
  value:
    | number
    | null
    | undefined
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return null;
  }

  return Number(value);
};

const normalizeItem = (
  item:
    RecentlyViewedItem
): RecentlyViewedItem => ({
  ...item,

  productId:
    String(
      item.productId ||
      ""
    ).trim(),

  productSlug:
    String(
      item.productSlug ||
      ""
    ).trim(),

  productName:
    String(
      item.productName ||
      ""
    ).trim(),

  productType:
    item.productType ||
    "SIMPLE",

  variantId:
    item.variantId ||
    null,

  variantName:
    item.variantName ||
    null,

  sku:
    item.sku ||
    null,

  imageUrl:
    item.imageUrl ||
    null,

  brandName:
    item.brandName ||
    null,

  categoryName:
    item.categoryName ||
    null,

  unitPrice:
    normalizeNumber(
      item.unitPrice
    ),

  compareAtPrice:
    normalizeNumber(
      item.compareAtPrice
    ),

  currencyCode:
    item.currencyCode ||
    "AED",

  taxPercent:
    Number.isFinite(
      Number(
        item.taxPercent
      )
    )
      ? Number(
          item.taxPercent
        )
      : 0,

  isTaxInclusive:
    item.isTaxInclusive !==
    false,

  viewedAt:
    item.viewedAt ||
    new Date()
      .toISOString(),
});

const recentlyViewedSlice =
  createSlice({
    name:
      "recentlyViewed",

    initialState,

    reducers: {
      hydrateRecentlyViewed(
        state,
        action:
          PayloadAction<
            RecentlyViewedItem[]
          >
      ) {
        const unique =
          new Map<
            string,
            RecentlyViewedItem
          >();

        const incoming =
          Array.isArray(
            action.payload
          )
            ? action.payload
            : [];

        incoming.forEach(
          (item) => {
            const normalized =
              normalizeItem(
                item
              );

            if (
              !normalized.productId
            ) {
              return;
            }

            unique.set(
              normalized.productId,
              normalized
            );
          }
        );

        state.items =
          Array.from(
            unique.values()
          )
            .sort(
              (
                first,
                second
              ) =>
                new Date(
                  second.viewedAt
                ).getTime() -
                new Date(
                  first.viewedAt
                ).getTime()
            )
            .slice(
              0,
              MAX_RECENTLY_VIEWED
            );

        state.hydrated =
          true;
      },

      addRecentlyViewed(
        state,
        action:
          PayloadAction<
            RecentlyViewedItem
          >
      ) {
        const incoming =
          normalizeItem(
            action.payload
          );

        if (
          !incoming.productId
        ) {
          return;
        }

        state.items = [
          incoming,

          ...state.items.filter(
            (item) =>
              item.productId !==
              incoming.productId
          ),
        ].slice(
          0,
          MAX_RECENTLY_VIEWED
        );
      },

      removeRecentlyViewed(
        state,
        action:
          PayloadAction<string>
      ) {
        state.items =
          state.items.filter(
            (item) =>
              item.productId !==
              action.payload
          );
      },

      clearRecentlyViewed(
        state
      ) {
        state.items = [];
      },
    },
  });

export const {
  hydrateRecentlyViewed,
  addRecentlyViewed,
  removeRecentlyViewed,
  clearRecentlyViewed,
} =
  recentlyViewedSlice.actions;

export default
  recentlyViewedSlice.reducer;

interface RootWithRecentlyViewed {
  recentlyViewed:
    RecentlyViewedState;
}

export const selectRecentlyViewed =
  (
    state:
      RootWithRecentlyViewed
  ) =>
    state.recentlyViewed;

export const selectRecentlyViewedItems =
  (
    state:
      RootWithRecentlyViewed
  ) =>
    state.recentlyViewed
      .items;

export const selectRecentlyViewedHydrated =
  (
    state:
      RootWithRecentlyViewed
  ) =>
    state.recentlyViewed
      .hydrated;

export const selectRecentlyViewedCount =
  createSelector(
    [
      selectRecentlyViewedItems,
    ],
    (items) =>
      items.length
  );
