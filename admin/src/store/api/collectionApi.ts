import {
  baseApi,
} from "./baseApi";

import type {
  CollectionFormValues,
  CollectionListParams,
  CollectionListResponse,
  CollectionResponse,
  DeleteCollectionResponse,
  CollectionProductsParams,
  CollectionProductsResponse,
  ReplaceCollectionProductsRequest,
  ReplaceCollectionProductsResponse,
} from "@/types/collection";

/*
|--------------------------------------------------------------------------
| Collection Import Types
|--------------------------------------------------------------------------
*/

export type CollectionImportMode =
  | "CREATE_ONLY"
  | "UPDATE_ONLY"
  | "CREATE_OR_UPDATE";

export interface CollectionImportResultRow {
  rowNumber:
    number;

  id?:
    string;

  name?:
    string;

  slug?:
    string;

  collectionType?:
    "MANUAL" |
    "SMART";

  action?:
    | "CREATED"
    | "UPDATED"
    | "SKIPPED";

  message?:
    string;
}

export interface CollectionImportErrorRow {
  rowNumber:
    number;

  slug?:
    string;

  message:
    string;
}

export interface CollectionImportResponse {
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
      CollectionImportMode;

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
      CollectionImportResultRow[];

    errors:
      CollectionImportErrorRow[];
  };
}

/*
|--------------------------------------------------------------------------
| Collection API
|--------------------------------------------------------------------------
*/

export const collectionApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        /*
        |--------------------------------------------------------------------------
        | Collections
        |--------------------------------------------------------------------------
        */

        getCollections:
          builder.query<
            CollectionListResponse,
            CollectionListParams | void
          >({
            query:
              (params) => ({
                url:
                  "/collections",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (result) => {
                const collections =
                  result?.data ||
                  [];

                return [
                  ...collections.map(
                    (
                      collection
                    ) => ({
                      type:
                        "Collections" as const,

                      id:
                        collection.id,
                    })
                  ),

                  {
                    type:
                      "Collections" as const,

                    id:
                      "LIST",
                  },
                ];
              },
          }),

        getCollectionById:
          builder.query<
            CollectionResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/collections/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Collections" as const,

                  id,
                },
              ],
          }),

        createCollection:
          builder.mutation<
            CollectionResponse,
            CollectionFormValues
          >({
            query:
              (body) => ({
                url:
                  "/collections",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "Collections",

                id:
                  "LIST",
              },
            ],
          }),

        refreshSmartCollection:
          builder.mutation<
            {
              success:
                boolean;
              message:
                string;
              data:
                unknown;
            },
            string
          >({
            query:
              (id) => ({
                url:
                  `/collections/${id}/refresh-smart`,
                method:
                  "POST",
              }),

            invalidatesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Collections" as const,
                  id,
                },
                {
                  type:
                    "Collections" as const,
                  id:
                    "LIST",
                },
              ],
          }),

        updateCollection:
          builder.mutation<
            CollectionResponse,
            {
              id:
                string;

              body:
                Partial<
                  CollectionFormValues
                >;
            }
          >({
            query:
              ({
                id,
                body,
              }) => ({
                url:
                  `/collections/${id}`,

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
                    "Collections" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Collections" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        changeCollectionStatus:
          builder.mutation<
            CollectionResponse,
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
                  `/collections/${id}/status`,

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
                    "Collections" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Collections" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        deleteCollection:
          builder.mutation<
            DeleteCollectionResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/collections/${id}`,

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
                    "Collections" as const,

                  id,
                },

                {
                  type:
                    "Collections" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Collection Products
        |--------------------------------------------------------------------------
        */

        getCollectionProducts:
          builder.query<
            CollectionProductsResponse,
            CollectionProductsParams
          >({
            query:
              ({
                id,
                ...params
              }) => ({
                url:
                  `/collections/${id}/products`,

                params,
              }),

            providesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Collections" as const,

                  id:
                    argument.id,
                },
              ],
          }),

        replaceCollectionProducts:
          builder.mutation<
            ReplaceCollectionProductsResponse,
            ReplaceCollectionProductsRequest
          >({
            query:
              ({
                id,
                productIds,
              }) => ({
                url:
                  `/collections/${id}/products`,

                method:
                  "PUT",

                body: {
                  productIds,
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
                    "Collections" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Collections" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Import Collections CSV
        |--------------------------------------------------------------------------
        */

        importCollectionsCsv:
          builder.mutation<
            CollectionImportResponse,
            {
              file:
                File;

              importMode:
                CollectionImportMode;

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
                    "/collection-import/import",

                  method:
                    "POST",

                  body:
                    formData,
                };
              },

            invalidatesTags: [
              {
                type:
                  "Collections",

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
  useGetCollectionsQuery,
  useGetCollectionByIdQuery,
  useCreateCollectionMutation,
  useRefreshSmartCollectionMutation,
  useUpdateCollectionMutation,
  useChangeCollectionStatusMutation,
  useDeleteCollectionMutation,
  useGetCollectionProductsQuery,
  useReplaceCollectionProductsMutation,
  useImportCollectionsCsvMutation,
} = collectionApi;