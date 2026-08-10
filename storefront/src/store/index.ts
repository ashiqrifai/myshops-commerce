"use client";

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import recentlyViewedReducer from "./slices/recentlyViewedSlice";
import customerAuthReducer from "./slices/customerAuthSlice";
import notificationReducer from "./slices/notificationSlice";

export const makeStore = () => configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    recentlyViewed: recentlyViewedReducer,
    customerAuth: customerAuthReducer,
    notifications: notificationReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
