import type { WishlistState } from "./slices/wishlistSlice";

const STORAGE_KEY = "myshops:wishlist:v1";

export const loadWishlistState = (): Pick<WishlistState, "items"> | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
    };
  } catch {
    return null;
  }
};

export const saveWishlistState = (state: WishlistState) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: state.items })
  );
};
