import {
  baseApi,
} from "./baseApi";

import type {
  BrandFormValues,
  BrandListParams,
  BrandListResponse,
  BrandResponse,
  DeleteBrandResponse,
} from "@/types/brand";

/*
|--------------------------------------------------------------------------
| Brand Import Types
|--------------------------------------------------------------------------
*/

export type BrandImportMode =
  | "CREATE_ONLY"
  | "UPDATE_ONLY"
  | "CREATE_OR_UPDATE";

export interface BrandImportResultRow {
  rowNumber:
    number;

  id?:
    string;

  name?:
    string;

  code?:
    string;

  slug?:
    string;

  action?:
    | "CREATED"
    | "UPDATED"
    | "SKIPPED";

  message?:
    string;
}

export interface BrandImportErrorRow {
  rowNumber:
    number;

  code?:
    string;

  slug?:
    string;

  message:
    string;
}

export interface BrandImportResponse {
  success:
    boolean;

  message:
    string;

  file?: {
    originalName:
      string;

    mimeType:
      string;

    size:
      number;
  };

  data: {
    success:
      boolean;

    partiallySuccessful?:
      boolean;

    importMode:
      BrandImportMode;

    headers?:
      string[];

    summary: {
      total:
        number;

      created:
        number;

      updated:
        number;

      skipped:
        number;

      failed:
        number;
    };

    results:
      BrandImportResultRow[];

    errors:
      BrandImportErrorRow[];
  };
}

/*
|--------------------------------------------------------------------------
| Brand API
|--------------------------------------------------------------------------
*/

export const brandApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        /*
        |--------------------------------------------------------------------------
        | List Brands
        |--------------------------------------------------------------------------
        */

        getBrands:
          builder.query<
            BrandListResponse,
            BrandListParams | void
          >({
            query:
              (params) => ({
                url:
                  "/brands",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (result) => {
                const brands =
                  result?.data ||
                  [];

                return [
                  ...brands.map(
                    (brand) => ({
                      type:
                        "Brands" as const,

                      id:
                        brand.id,
                    })
                  ),

                  {
                    type:
                      "Brands" as const,

                    id:
                      "LIST",
                  },
                ];
              },
          }),

        /*
        |--------------------------------------------------------------------------
        | Get Brand
        |--------------------------------------------------------------------------
        */

        getBrandById:
          builder.query<
            BrandResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/brands/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Brands" as const,

                  id,
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Create Brand
        |--------------------------------------------------------------------------
        */

        createBrand:
          builder.mutation<
            BrandResponse,
            BrandFormValues
          >({
            query:
              (body) => ({
                url:
                  "/brands",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "Brands",

                id:
                  "LIST",
              },
            ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Update Brand
        |--------------------------------------------------------------------------
        */

        updateBrand:
          builder.mutation<
            BrandResponse,
            {
              id:
                string;

              body:
                Partial<
                  BrandFormValues
                >;
            }
          >({
            query:
              ({
                id,
                body,
              }) => ({
                url:
                  `/brands/${id}`,

                method:
                  "PUT",

                body,
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Brands" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Brands" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Change Brand Status
        |--------------------------------------------------------------------------
        */

        changeBrandStatus:
          builder.mutation<
            BrandResponse,
            {
              id:
                string;

              isActive:
                boolean;
            }
          >({
            query:
              ({
                id,
                isActive,
              }) => ({
                url:
                  `/brands/${id}/status`,

                method:
                  "PATCH",

                body: {
                  isActive,
                },
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Brands" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Brands" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Delete Brand
        |--------------------------------------------------------------------------
        */

        deleteBrand:
          builder.mutation<
            DeleteBrandResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/brands/${id}`,

                method:
                  "DELETE",
              }),

            invalidatesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Brands" as const,

                  id,
                },

                {
                  type:
                    "Brands" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Import Brands CSV
        |--------------------------------------------------------------------------
        */

        importBrandsCsv:
          builder.mutation<
            BrandImportResponse,
            {
              file:
                File;

              importMode:
                BrandImportMode;

              continueOnError:
                boolean;
            }
          >({
            query:
              ({
                file,
                importMode,
                continueOnError,
              }) => {
                const formData =
                  new FormData();

                formData.append(
                  "file",
                  file
                );

                formData.append(
                  "importMode",
                  importMode
                );

                formData.append(
                  "continueOnError",
                  String(
                    continueOnError
                  )
                );

                return {
                  url:
                    "/brand-import/import",

                  method:
                    "POST",

                  body:
                    formData,
                };
              },

            invalidatesTags: [
              {
                type:
                  "Brands",

                id:
                  "LIST",
              },
            ],
          }),
      }),

    overrideExisting:
      false,
  });

/*
|--------------------------------------------------------------------------
| Hooks
|--------------------------------------------------------------------------
*/

export const {
  useGetBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useChangeBrandStatusMutation,
  useDeleteBrandMutation,
  useImportBrandsCsvMutation,
} = brandApi;