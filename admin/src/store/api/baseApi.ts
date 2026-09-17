import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import type { RootState } from "../index";

import {
  clearCredentials,
  setCredentials,
} from "../slices/authSlice";

import type { AuthUser } from "@/types/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

/**
 * Response returned by:
 *
 * POST /admin/auth/refresh
 */
interface RefreshResponse {
  success: boolean;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

/**
 * Standard RTK Query base query.
 *
 * credentials: "include" is important
 * because the refresh token is stored
 * by the backend as an HttpOnly cookie.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,

  credentials: "include",

  prepareHeaders: (
    headers,
    { getState }
  ) => {
    const state =
      getState() as RootState;

    const token =
      state.auth.accessToken;

    if (token) {
      headers.set(
        "authorization",
        `Bearer ${token}`
      );
    }

    return headers;
  },
});

/**
 * Shared refresh promise.
 *
 * This prevents multiple API requests
 * from refreshing the token at the
 * same time.
 *
 * This is especially important because
 * the backend rotates refresh tokens.
 */
let refreshPromise:
  Promise<
    RefreshResponse["data"] | null
  > | null = null;

/**
 * Extract URL from RTK Query args.
 */
const getRequestUrl = (
  args: string | FetchArgs
): string => {
  if (typeof args === "string") {
    return args;
  }

  return args.url;
};

/**
 * Authentication endpoints should not
 * themselves trigger another refresh.
 */
const isAuthRequest = (
  args: string | FetchArgs
): boolean => {
  const url =
    getRequestUrl(args);

  return (
    url.includes(
      "/admin/auth/login"
    ) ||
    url.includes(
      "/admin/auth/refresh"
    ) ||
    url.includes(
      "/admin/auth/logout"
    )
  );
};

/**
 * Save refreshed authentication data
 * so browser refreshes continue using
 * the latest access token.
 */
const persistSession = (
  user: AuthUser,
  accessToken: string
) => {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    "myshops.admin.accessToken",
    accessToken
  );

  localStorage.setItem(
    "myshops.admin.user",
    JSON.stringify(user)
  );
};

/**
 * Remove local authentication state.
 *
 * This should happen only when refresh
 * authentication fails or the newly
 * refreshed token is also rejected.
 */
const clearLocalSession = () => {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "myshops.admin.accessToken"
  );

  localStorage.removeItem(
    "myshops.admin.user"
  );
};

/**
 * RTK Query base query with automatic
 * access-token refresh.
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (
  args,
  api,
  extraOptions
) => {
  /**
   * Remember which token this request
   * originally used.
   */
  const stateBeforeRequest =
    api.getState() as RootState;

  const tokenBeforeRequest =
    stateBeforeRequest.auth.accessToken;

  /**
   * Execute the original request.
   */
  let result =
    await rawBaseQuery(
      args,
      api,
      extraOptions
    );

  /**
   * If the response is not 401,
   * return normally.
   *
   * Also never attempt token refresh
   * for login / refresh / logout calls.
   */
  if (
    result.error?.status !== 401 ||
    isAuthRequest(args)
  ) {
    return result;
  }

  /**
   * Another API request may already
   * have successfully refreshed the
   * access token while this request
   * was waiting.
   *
   * If Redux now contains a different
   * access token, retry immediately
   * using that token.
   */
  const stateAfter401 =
    api.getState() as RootState;

  const currentToken =
    stateAfter401.auth.accessToken;

  if (
    currentToken &&
    tokenBeforeRequest &&
    currentToken !==
      tokenBeforeRequest
  ) {
    result =
      await rawBaseQuery(
        args,
        api,
        extraOptions
      );

    return result;
  }

  /**
   * If no refresh operation is currently
   * running, start one.
   */
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshResult =
        await rawBaseQuery(
          {
            url:
              "/admin/auth/refresh",
            method:
              "POST",
          },
          api,
          extraOptions
        );

      /**
       * Refresh token is missing,
       * expired, revoked, or invalid.
       */
      if (
        refreshResult.error
      ) {
        return null;
      }

      /**
       * Explicit cast of the refresh
       * endpoint response.
       */
      const response =
        refreshResult.data as RefreshResponse;

      /**
       * Validate expected backend
       * response structure.
       */
      if (
        !response ||
        response.success !== true ||
        !response.data ||
        !response.data.accessToken ||
        !response.data.user
      ) {
        return null;
      }

      const {
        user,
        accessToken,
      } = response.data;

      /**
       * Immediately update Redux.
       *
       * Future RTK Query requests will
       * now use the new access token.
       */
      api.dispatch(
        setCredentials({
          user,
          accessToken,
        })
      );

      /**
       * Also update localStorage so the
       * newest access token survives a
       * browser reload.
       */
      persistSession(
        user,
        accessToken
      );

      return {
        user,
        accessToken,
      };
    })().finally(() => {
      /**
       * Allow another refresh operation
       * in the future when this new
       * access token eventually expires.
       */
      refreshPromise = null;
    });
  }

  /**
   * All simultaneous 401 requests wait
   * for the same refresh operation.
   */
  const refreshedSession =
    await refreshPromise;

  /**
   * Refresh failed.
   *
   * Only now do we clear the user's
   * session.
   */
  if (!refreshedSession) {
    clearLocalSession();

    api.dispatch(
      clearCredentials()
    );

    return result;
  }

  /**
   * Refresh succeeded.
   *
   * Retry the original request.
   *
   * prepareHeaders() will automatically
   * read the new access token from Redux.
   */
  result =
    await rawBaseQuery(
      args,
      api,
      extraOptions
    );

  /**
   * If the newly refreshed access token
   * is still rejected, clear the session.
   */
  if (
    result.error?.status === 401
  ) {
    clearLocalSession();

    api.dispatch(
      clearCredentials()
    );
  }

  return result;
};

/**
 * Main MyShops Admin RTK Query API.
 */
export const baseApi =
  createApi({
    reducerPath: "api",

    baseQuery:
      baseQueryWithReauth,

    tagTypes: [
      "Settings",
      "CmsPages",
      "CmsSectionTypes",
      "CmsPageSections",
      "MediaFolders",
      "MediaAssets",
      "NavigationMenus",
      "NavigationItems",
      "Categories",
      "CategoryTree",
      "Brands",
      "Attributes",
      "Products",
      "PriceLists",
      "VariantPrices",
      "PriceMatrix",
      "PricingImport",
      "Collections",
      "Coupons",
      "Suppliers",
      "InventoryLocations",
      "Inventory",
      "InstagramPosts",
      "PaymentExceptions",
      "PreBooking",
    ],

    endpoints: () => ({}),
  });