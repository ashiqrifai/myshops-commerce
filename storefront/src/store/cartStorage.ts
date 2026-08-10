import type {
  CartState,
} from "./slices/cartSlice";

const STORAGE_KEY =
  "myshops-storefront-cart-v1";

export function loadCartState():
  | CartState
  | undefined {
  if (
    typeof window ===
    "undefined"
  ) {
    return undefined;
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return undefined;
    }

    const parsed =
      JSON.parse(raw) as
        | Partial<CartState>
        | null;

    if (
      !parsed ||
      !Array.isArray(
        parsed.items
      )
    ) {
      return undefined;
    }

    return {
      items:
        parsed.items,
      hydrated:
        true,
    };
  } catch {
    return undefined;
  }
}

export function saveCartState(
  state: CartState
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items:
          state.items,
      })
    );
  } catch {
    // Ignore storage failures.
  }
}

export function clearCartStorage(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.removeItem(
      STORAGE_KEY
    );
  } catch {
    // Ignore storage failures.
  }
}
