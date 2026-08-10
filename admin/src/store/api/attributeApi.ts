import {
  baseApi,
} from "./baseApi";

import type {
  AttributeFormValues,
  AttributeListParams,
  AttributeListResponse,
  AttributeOptionFormValue,
  AttributeOptionResponse,
  AttributePayload,
  AttributeResponse,
  CategoryAssignmentFormValue,
  DeleteAttributeResponse,
} from "@/types/attribute";

/*
|--------------------------------------------------------------------------
| Attribute Import Types
|--------------------------------------------------------------------------
*/

export type AttributeImportMode =
  | "CREATE_ONLY"
  | "UPDATE_ONLY"
  | "CREATE_OR_UPDATE";

export interface AttributeImportRequest {
  file:
    File;

  importMode?:
    AttributeImportMode;

  continueOnError?:
    boolean;
}

export interface AttributeImportResultItem {
  rowNumber:
    number;

  id?:
    string;

  name?:
    string;

  code?:
    string;

  inputType?:
    string;

  action?:
    | "CREATED"
    | "UPDATED"
    | "SKIPPED";

  message?:
    string;
}

export interface AttributeImportErrorItem {
  rowNumber:
    number;

  code?:
    string;

  name?:
    string;

  message:
    string;
}

export interface AttributeImportResponse {
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

    partiallySuccessful:
      boolean;

    importMode:
      AttributeImportMode;

    headers:
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
      AttributeImportResultItem[];

    errors:
      AttributeImportErrorItem[];
  };
}

/*
|--------------------------------------------------------------------------
| Payload Mapper
|--------------------------------------------------------------------------
*/

function toPayload(
  values:
    AttributeFormValues
): AttributePayload {
  return {
    name:
      values.name.trim(),

    code:
      values.code.trim(),

    description:
      values.description
        ?.trim() ||
      null,

    inputType:
      values.inputType,

    dataType:
      values.dataType,

    unit:
      values.unit
        ?.trim() ||
      null,

    isVariantDefining:
      values.isVariantDefining,

    isFilterable:
      values.isFilterable,

    isSearchable:
      values.isSearchable,

    isComparable:
      values.isComparable,

    isRequired:
      values.isRequired,

    displayOrder:
      Number(
        values.displayOrder ||
        0
      ),

    isActive:
      values.isActive,

    options:
      values.options.map(
        (
          option
        ) => ({
          ...(
            option.id
              ? {
                  id:
                    option.id,
                }
              : {}
          ),

          label:
            option.label.trim(),

          value:
            option.value.trim(),

          swatchValue:
            option.swatchValue
              ?.trim() ||
            null,

          displayOrder:
            Number(
              option.displayOrder ||
              0
            ),

          isActive:
            option.isActive,
        })
      ),

    categoryAssignments:
      values.categoryAssignments.map(
        (
          assignment
        ) => ({
          categoryId:
            assignment.categoryId,

          isRequired:
            assignment.isRequired,

          isFilterable:
            assignment.isFilterable,

          isVariantDefining:
            assignment.isVariantDefining,

          displayOrder:
            Number(
              assignment.displayOrder ||
              0
            ),

          isActive:
            assignment.isActive,
        })
      ),
  };
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const attributeApi =
  baseApi.injectEndpoints({
    endpoints:
      (
        builder
      ) => ({
        /*
        |--------------------------------------------------------------------------
        | List Attributes
        |--------------------------------------------------------------------------
        */

        getAttributes:
          builder.query<
            AttributeListResponse,
            AttributeListParams | void
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/attributes",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (
                result
              ) => [
                ...(
                  result?.data ||
                  []
                ).map(
                  (
                    attribute
                  ) => ({
                    type:
                      "Attributes" as const,

                    id:
                      attribute.id,
                  })
                ),

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Get Attribute
        |--------------------------------------------------------------------------
        */

        getAttributeById:
          builder.query<
            AttributeResponse,
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/attributes/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Attributes" as const,

                  id,
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Create Attribute
        |--------------------------------------------------------------------------
        */

        createAttribute:
          builder.mutation<
            AttributeResponse,
            AttributeFormValues
          >({
            query:
              (
                values
              ) => ({
                url:
                  "/attributes",

                method:
                  "POST",

                body:
                  toPayload(
                    values
                  ),
              }),

            invalidatesTags: [
              {
                type:
                  "Attributes",

                id:
                  "LIST",
              },
            ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Update Attribute
        |--------------------------------------------------------------------------
        */

        updateAttribute:
          builder.mutation<
            AttributeResponse,
            {
              id:
                string;

              values:
                AttributeFormValues;
            }
          >({
            query:
              ({
                id,
                values,
              }) => ({
                url:
                  `/attributes/${id}`,

                method:
                  "PUT",

                body:
                  toPayload(
                    values
                  ),
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Attributes" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Change Status
        |--------------------------------------------------------------------------
        */

        changeAttributeStatus:
          builder.mutation<
            AttributeResponse,
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
                  `/attributes/${id}/status`,

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
                    "Attributes" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Create Attribute Option
        |--------------------------------------------------------------------------
        */

        createAttributeOption:
          builder.mutation<
            AttributeOptionResponse,
            {
              attributeId:
                string;

              option:
                Omit<
                  AttributeOptionFormValue,
                  "clientId" |
                  "id"
                >;
            }
          >({
            query:
              ({
                attributeId,
                option,
              }) => ({
                url:
                  `/attributes/${attributeId}/options`,

                method:
                  "POST",

                body:
                  option,
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Attributes" as const,

                  id:
                    argument.attributeId,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Update Attribute Option
        |--------------------------------------------------------------------------
        */

        updateAttributeOption:
          builder.mutation<
            AttributeOptionResponse,
            {
              attributeId:
                string;

              optionId:
                string;

              option:
                Partial<
                  Omit<
                    AttributeOptionFormValue,
                    "clientId" |
                    "id"
                  >
                >;
            }
          >({
            query:
              ({
                attributeId,
                optionId,
                option,
              }) => ({
                url:
                  `/attributes/${attributeId}/options/${optionId}`,

                method:
                  "PUT",

                body:
                  option,
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Attributes" as const,

                  id:
                    argument.attributeId,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Delete Attribute Option
        |--------------------------------------------------------------------------
        */

        deleteAttributeOption:
          builder.mutation<
            DeleteAttributeResponse,
            {
              attributeId:
                string;

              optionId:
                string;
            }
          >({
            query:
              ({
                attributeId,
                optionId,
              }) => ({
                url:
                  `/attributes/${attributeId}/options/${optionId}`,

                method:
                  "DELETE",
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Attributes" as const,

                  id:
                    argument.attributeId,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Replace Category Assignments
        |--------------------------------------------------------------------------
        */

        replaceAttributeCategories:
          builder.mutation<
            AttributeResponse,
            {
              attributeId:
                string;

              categoryAssignments:
                CategoryAssignmentFormValue[];
            }
          >({
            query:
              ({
                attributeId,
                categoryAssignments,
              }) => ({
                url:
                  `/attributes/${attributeId}/categories`,

                method:
                  "PUT",

                body: {
                  categoryAssignments:
                    categoryAssignments.map(
                      (
                        assignment
                      ) => ({
                        categoryId:
                          assignment.categoryId,

                        isRequired:
                          assignment.isRequired,

                        isFilterable:
                          assignment.isFilterable,

                        isVariantDefining:
                          assignment.isVariantDefining,

                        displayOrder:
                          Number(
                            assignment.displayOrder ||
                            0
                          ),

                        isActive:
                          assignment.isActive,
                      })
                    ),
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
                    "Attributes" as const,

                  id:
                    argument.attributeId,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Delete Attribute
        |--------------------------------------------------------------------------
        */

        deleteAttribute:
          builder.mutation<
            DeleteAttributeResponse,
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/attributes/${id}`,

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
                    "Attributes" as const,

                  id,
                },

                {
                  type:
                    "Attributes" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
        |--------------------------------------------------------------------------
        | Import Attributes CSV
        |--------------------------------------------------------------------------
        */

        importAttributesCsv:
          builder.mutation<
            AttributeImportResponse,
            AttributeImportRequest
          >({
            query:
              ({
                file,
                importMode =
                  "CREATE_OR_UPDATE",
                continueOnError =
                  true,
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
                    "/attribute-import/import",

                  method:
                    "POST",

                  body:
                    formData,
                };
              },

            invalidatesTags: [
              {
                type:
                  "Attributes",

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
  useGetAttributesQuery,
  useGetAttributeByIdQuery,

  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useChangeAttributeStatusMutation,

  useCreateAttributeOptionMutation,
  useUpdateAttributeOptionMutation,
  useDeleteAttributeOptionMutation,

  useReplaceAttributeCategoriesMutation,

  useDeleteAttributeMutation,

  useImportAttributesCsvMutation,
} =
  attributeApi;