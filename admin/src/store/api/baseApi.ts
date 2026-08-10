import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import type {
  RootState,
} from "../index";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const rawBaseQuery =
  fetchBaseQuery({
    baseUrl: API_URL,

    credentials:
      "include",

    prepareHeaders: (
      headers,
      {
        getState,
      }
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

export const baseApi =
  createApi({
    reducerPath:
      "api",

    baseQuery:
      rawBaseQuery,

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
    ],

    endpoints:
      () => ({}),
  });