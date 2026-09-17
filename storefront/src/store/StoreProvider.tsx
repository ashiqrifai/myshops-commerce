"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import { hydrateCart } from "./slices/cartSlice";
import { hydrateWishlist } from "./slices/wishlistSlice";
import { hydrateRecentlyViewed } from "./slices/recentlyViewedSlice";
import { clearCustomerAuth, hydrateCustomerAuth, setCustomerAuth, setCustomerAuthInitializing } from "./slices/customerAuthSlice";
import { loadCartState, saveCartState } from "./cartStorage";
import { loadWishlistState, saveWishlistState } from "./wishlistStorage";
import { loadRecentlyViewedState, saveRecentlyViewedState } from "./recentlyViewedStorage";
import { clearCustomerAuthStorage, loadCustomerAuthState, saveCustomerAuthState } from "./customerAuthStorage";
import { getCurrentCustomer, refreshCustomer } from "@/lib/customer-auth/customerAuthApi";
import NotificationViewport from "@/components/notifications/NotificationViewport";
import type { AppStore } from "./index";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    const savedCart = loadCartState();
    const savedWishlist = loadWishlistState();
    const savedRecentlyViewed = loadRecentlyViewedState();
    const savedCustomerAuth = loadCustomerAuthState();
    store.dispatch(
      hydrateCart({
        items:
          savedCart?.items ||
          [],
    
        appliedCoupon:
          savedCart?.appliedCoupon ||
          null,
      })
    );
    store.dispatch(hydrateWishlist(savedWishlist?.items || []));
    store.dispatch(hydrateRecentlyViewed(savedRecentlyViewed?.items || []));
    store.dispatch(hydrateCustomerAuth(savedCustomerAuth));

    const validateSession = async () => {
      store.dispatch(setCustomerAuthInitializing(true));
      try {
        if (savedCustomerAuth.accessToken) {
          try {
            const customer = await getCurrentCustomer(savedCustomerAuth.accessToken);
            store.dispatch(setCustomerAuth({ customer, accessToken: savedCustomerAuth.accessToken }));
            return;
          } catch {}
        }
        const refreshed = await refreshCustomer();
        store.dispatch(setCustomerAuth({ customer: refreshed.customer, accessToken: refreshed.accessToken }));
      } catch {
        store.dispatch(clearCustomerAuth());
        clearCustomerAuthStorage();
      }
    };
    void validateSession();

    return store.subscribe(() => {
      const state = store.getState();
      if (state.cart.hydrated) saveCartState(state.cart);
      if (state.wishlist.hydrated) saveWishlistState(state.wishlist);
      if (state.recentlyViewed.hydrated) saveRecentlyViewedState(state.recentlyViewed);
      if (state.customerAuth.hydrated) saveCustomerAuthState({ customer: state.customerAuth.customer, accessToken: state.customerAuth.accessToken });
    });
  }, []);

  return <Provider store={storeRef.current}>{children}<NotificationViewport /></Provider>;
}
