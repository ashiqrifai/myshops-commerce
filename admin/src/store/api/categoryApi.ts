import {
  baseApi,
} from "./baseApi";

import type {
  CategoryFormValues,
  CategoryListParams,
  CategoryListResponse,
  CategoryResponse,
  CategoryStatusRequest,
  CategoryTreeParams,
  CategoryTreeResponse,
  DeleteCategoryResponse,
  ReorderCategoriesRequest,
  ReorderCategoriesResponse,
  Category,
} from "@/types/category";

/*
|--------------------------------------------------------------------------
| Category Import Types
|--------------------------------------------------------------------------
*/

export type CategoryImportMode =
  | "CREATE_ONLY"
  | "UPDATE_ONLY"
  | "CREATE_OR_UPDATE";

export interface CategoryImportResultRow {
  rowNumber:
    number;

  id?:
    string;

  name?:
    string;

  slug?:
    string;

  parentSlug?:
    string | null;

  action?:
    | "CREATED"
    | "UPDATED"
    | "SKIPPED";

  message?:
    string;
}

export interface CategoryImportErrorRow {
  rowNumber:
    number;

  slug?:
    string;

  parentSlug?:
    string | null;

  message:
    string;
}

export interface CategoryImportResponse {
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
      CategoryImportMode;

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
      CategoryImportResultRow[];

    errors:
      CategoryImportErrorRow[];
  };
}

/*
|--------------------------------------------------------------------------
| Category API
|--------------------------------------------------------------------------
*/

export const categoryApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        /*
        |--------------------------------------------------------------------------
        | Category List
        |--------------------------------------------------------------------------
        */

        getCategories:
          builder.query<
            CategoryListResponse,
            CategoryListParams | void
          >({
            query:
              (params) => ({
                url:
                  "/categories",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (result) => {
                const categories =
                  result?.data
                    .categories ||
                  [];

                return [
                  ...categories.map(
                    (category) => ({
                      type:
                        "Categories" as const,

                      id:
                        category.id,
                    })
                  ),

                  {
                    type:
                      "Categories" as const,

                    id:
                      "LIST",
                  },
                ];
              },
          }),

        /*
        |--------------------------------------------------------------------------
        | Category Tree
        |--------------------------------------------------------------------------
        */

        getCategoryTree:
          builder.query<
            CategoryTreeResponse,
            CategoryTreeParams | void
          >({
            query:
              (params) => ({
                url:
                  "/categories/tree",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (result) => {
                const categories =
                  flattenCategories(
                    result?.data
                      .categories ||
                      []
                  );

                return [
                  {
                    type:
                      "CategoryTree" as const,

                    id:
                      "TREE",
                  },

                  ...categories.map(
                    (category) => ({
                      type:
                        "Categories" as const,

                      id:
                        category.id,
                    })
                  ),
                ];
              },
          }),

        /*
        |--------------------------------------------------------------------------
        | Single Category
        |--------------------------------------------------------------------------
        */

        getCategoryById:
          builder.query<
            CategoryResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/categories/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Categories" as const,

                  id,
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Create Category
        |--------------------------------------------------------------------------
        */

        createCategory:
          builder.mutation<
            CategoryResponse,
            CategoryFormValues
          >({
            query:
              (body) => ({
                url:
                  "/categories",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "Categories",

                id:
                  "LIST",
              },

              {
                type:
                  "CategoryTree",

                id:
                  "TREE",
              },
            ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Update Category
        |--------------------------------------------------------------------------
        */

        updateCategory:
          builder.mutation<
            CategoryResponse,
            {
              id:
                string;

              body:
                Partial<
                  CategoryFormValues
                >;
            }
          >({
            query:
              ({
                id,
                body,
              }) => ({
                url:
                  `/categories/${id}`,

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
                    "Categories",

                  id:
                    argument.id,
                },

                {
                  type:
                    "Categories",

                  id:
                    "LIST",
                },

                {
                  type:
                    "CategoryTree",

                  id:
                    "TREE",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Change Category Status
        |--------------------------------------------------------------------------
        */

        changeCategoryStatus:
          builder.mutation<
            CategoryResponse,
            CategoryStatusRequest
          >({
            query:
              ({
                id,
                isActive,
                includeChildren,
              }) => ({
                url:
                  `/categories/${id}/status`,

                method:
                  "PATCH",

                body: {
                  isActive,

                  includeChildren:
                    includeChildren ||
                    false,
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
                    "Categories",

                  id:
                    argument.id,
                },

                {
                  type:
                    "Categories",

                  id:
                    "LIST",
                },

                {
                  type:
                    "CategoryTree",

                  id:
                    "TREE",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Reorder Categories
        |--------------------------------------------------------------------------
        */

        reorderCategories:
          builder.mutation<
            ReorderCategoriesResponse,
            ReorderCategoriesRequest
          >({
            query:
              (body) => ({
                url:
                  "/categories/reorder/bulk",

                method:
                  "PATCH",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "Categories",

                id:
                  "LIST",
              },

              {
                type:
                  "CategoryTree",

                id:
                  "TREE",
              },
            ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Delete Category
        |--------------------------------------------------------------------------
        */

        deleteCategory:
          builder.mutation<
            DeleteCategoryResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/categories/${id}`,

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
                    "Categories",

                  id,
                },

                {
                  type:
                    "Categories",

                  id:
                    "LIST",
                },

                {
                  type:
                    "CategoryTree",

                  id:
                    "TREE",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Import Categories CSV
        |--------------------------------------------------------------------------
        */

        importCategoriesCsv:
          builder.mutation<
            CategoryImportResponse,
            {
              file:
                File;

              importMode:
                CategoryImportMode;

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
                    "/category-import/import",

                  method:
                    "POST",

                  body:
                    formData,
                };
              },

            invalidatesTags: [
              {
                type:
                  "Categories",

                id:
                  "LIST",
              },

              {
                type:
                  "CategoryTree",

                id:
                  "TREE",
              },
            ],
          }),
      }),

    overrideExisting:
      false,
  });

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function flattenCategories(
  categories:
    Category[]
): Category[] {
  return categories.flatMap(
    (
      category
    ) => [
      category,

      ...flattenCategories(
        category.children ??
          []
      ),
    ]
  );
}

/*
|--------------------------------------------------------------------------
| Hooks
|--------------------------------------------------------------------------
*/

export const {
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useChangeCategoryStatusMutation,
  useReorderCategoriesMutation,
  useDeleteCategoryMutation,
  useImportCategoriesCsvMutation,
} = categoryApi;