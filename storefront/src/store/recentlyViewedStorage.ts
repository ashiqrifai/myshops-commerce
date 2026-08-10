import type {
  RecentlyViewedState,
} from "./slices/recentlyViewedSlice";

const STORAGE_KEY =
  "myshops:recently-viewed:v1";

interface PersistedRecentlyViewed {
  items:
    RecentlyViewedState["items"];
}

export const loadRecentlyViewedState =
  ():
    | PersistedRecentlyViewed
    | null => {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    try {
      const raw =
        window.localStorage
          .getItem(
            STORAGE_KEY
          );

      if (!raw) {
        return null;
      }

      const parsed =
        JSON.parse(
          raw
        ) as
          Partial<
            PersistedRecentlyViewed
          >;

      return {
        items:
          Array.isArray(
            parsed.items
          )
            ? parsed.items
            : [],
      };
    } catch (
      error
    ) {
      console.warn(
        "Unable to load recently viewed products:",
        error
      );

      return null;
    }
  };

export const saveRecentlyViewedState =
  (
    state:
      RecentlyViewedState
  ) => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      const payload:
        PersistedRecentlyViewed = {
          items:
            state.items,
        };

      window.localStorage
        .setItem(
          STORAGE_KEY,
          JSON.stringify(
            payload
          )
        );
    } catch (
      error
    ) {
      console.warn(
        "Unable to save recently viewed products:",
        error
      );
    }
  };
