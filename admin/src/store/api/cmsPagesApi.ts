import { baseApi } from "./baseApi";

import type {
  CmsPageFormValues,
  CmsPageListParams,
  CmsPageListResponse,
  CmsPageResponse,
  CmsPageStatus,
} from "@/types/cms";

export const cmsPagesApi =
  baseApi.injectEndpoints({
    endpoints: (builder) => ({
      getCmsPages: builder.query<
        CmsPageListResponse,
        CmsPageListParams | void
      >({
        query: (params) => ({
          url: "/admin/cms/pages",
          params: params || undefined,
        }),

        providesTags: (result) =>
          result
            ? [
                ...result.data.map((page) => ({
                  type: "CmsPages" as const,
                  id: page.id,
                })),
                {
                  type: "CmsPages" as const,
                  id: "LIST",
                },
              ]
            : [
                {
                  type: "CmsPages" as const,
                  id: "LIST",
                },
              ],
      }),

      getCmsPageById: builder.query<
        CmsPageResponse,
        string
      >({
        query: (id) => ({
          url: `/admin/cms/pages/${id}`,
        }),

        providesTags: (_result, _error, id) => [
          {
            type: "CmsPages",
            id,
          },
        ],
      }),

      createCmsPage: builder.mutation<
        CmsPageResponse,
        CmsPageFormValues
      >({
        query: (body) => ({
          url: "/admin/cms/pages",
          method: "POST",
          body,
        }),

        invalidatesTags: [
          {
            type: "CmsPages",
            id: "LIST",
          },
        ],
      }),

      updateCmsPage: builder.mutation<
        CmsPageResponse,
        {
          id: string;
          body: Partial<CmsPageFormValues>;
        }
      >({
        query: ({ id, body }) => ({
          url: `/admin/cms/pages/${id}`,
          method: "PUT",
          body,
        }),

        invalidatesTags: (_result, _error, args) => [
          {
            type: "CmsPages",
            id: args.id,
          },
          {
            type: "CmsPages",
            id: "LIST",
          },
        ],
      }),

      changeCmsPageStatus: builder.mutation<
        CmsPageResponse,
        {
          id: string;
          status: CmsPageStatus;
        }
      >({
        query: ({ id, status }) => ({
          url: `/admin/cms/pages/${id}/status`,
          method: "PATCH",
          body: {
            status,
          },
        }),

        invalidatesTags: (_result, _error, args) => [
          {
            type: "CmsPages",
            id: args.id,
          },
          {
            type: "CmsPages",
            id: "LIST",
          },
        ],
      }),

      changeCmsPageActive: builder.mutation<
        CmsPageResponse,
        {
          id: string;
          isActive: boolean;
        }
      >({
        query: ({ id, isActive }) => ({
          url: `/admin/cms/pages/${id}/active`,
          method: "PATCH",
          body: {
            isActive,
          },
        }),

        invalidatesTags: (_result, _error, args) => [
          {
            type: "CmsPages",
            id: args.id,
          },
          {
            type: "CmsPages",
            id: "LIST",
          },
        ],
      }),

      duplicateCmsPage: builder.mutation<
        CmsPageResponse,
        string
      >({
        query: (id) => ({
          url: `/admin/cms/pages/${id}/duplicate`,
          method: "POST",
        }),

        invalidatesTags: [
          {
            type: "CmsPages",
            id: "LIST",
          },
        ],
      }),
    }),
  });

export const {
  useGetCmsPagesQuery,
  useGetCmsPageByIdQuery,
  useCreateCmsPageMutation,
  useUpdateCmsPageMutation,
  useChangeCmsPageStatusMutation,
  useChangeCmsPageActiveMutation,
  useDuplicateCmsPageMutation,
} = cmsPagesApi;