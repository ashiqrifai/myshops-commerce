"use client";

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CartFeedbackState {
  drawerOpen: boolean;
  lastAddedItemKey: string | null;
  feedbackSequence: number;
}

const initialState: CartFeedbackState = {
  drawerOpen: false,
  lastAddedItemKey: null,
  feedbackSequence: 0,
};

const slice = createSlice({
  name: "cartFeedback",
  initialState,
  reducers: {
    showAddedToCart(state, action: PayloadAction<string>) {
      state.drawerOpen = true;
      state.lastAddedItemKey = action.payload;
      state.feedbackSequence += 1;
    },
    closeAddedToCart(state) {
      state.drawerOpen = false;
    },
  },
});

export const { showAddedToCart, closeAddedToCart } = slice.actions;
export default slice.reducer;

interface RootWithFeedback {
  cartFeedback: CartFeedbackState;
}

export const selectCartFeedbackOpen = (state: RootWithFeedback) =>
  state.cartFeedback.drawerOpen;

export const selectLastAddedItemKey = (state: RootWithFeedback) =>
  state.cartFeedback.lastAddedItemKey;

export const selectCartFeedbackSequence = (state: RootWithFeedback) =>
  state.cartFeedback.feedbackSequence;
