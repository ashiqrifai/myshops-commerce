import type {
  CustomerAccount,
} from "./slices/customerAuthSlice";

const STORAGE_KEY =
  "myshops:customer-auth:v1";

export interface PersistedCustomerAuth {
  customer:
    | CustomerAccount
    | null;

  accessToken:
    | string
    | null;
}

export const loadCustomerAuthState =
  ():
    PersistedCustomerAuth => {
    if (
      typeof window ===
      "undefined"
    ) {
      return {
        customer:
          null,

        accessToken:
          null,
      };
    }

    try {
      const raw =
        window.localStorage
          .getItem(
            STORAGE_KEY
          );

      if (!raw) {
        return {
          customer:
            null,

          accessToken:
            null,
        };
      }

      const parsed =
        JSON.parse(
          raw
        ) as
          Partial<
            PersistedCustomerAuth
          >;

      return {
        customer:
          parsed.customer ||
          null,

        accessToken:
          parsed.accessToken ||
          null,
      };
    } catch (
      error
    ) {
      console.warn(
        "Unable to load customer authentication state:",
        error
      );

      return {
        customer:
          null,

        accessToken:
          null,
      };
    }
  };

export const saveCustomerAuthState =
  (
    state:
      PersistedCustomerAuth
  ) => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      window.localStorage
        .setItem(
          STORAGE_KEY,
          JSON.stringify({
            customer:
              state.customer,

            accessToken:
              state.accessToken,
          })
        );
    } catch (
      error
    ) {
      console.warn(
        "Unable to save customer authentication state:",
        error
      );
    }
  };

export const clearCustomerAuthStorage =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    window.localStorage
      .removeItem(
        STORAGE_KEY
      );
  };
