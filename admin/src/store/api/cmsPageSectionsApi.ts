import { baseApi } from "./baseApi";

import type {
  CmsPageSectionResponse,
  CmsPageSectionsResponse,
  CmsSectionTypeListParams,
  CmsSectionTypeResponse,
  CmsSectionTypesResponse,
  CreateCmsPageSectionRequest,
  ReorderCmsPageSectionsRequest,
  UpdateCmsPageSectionRequest,
} from "@/types/cms";

export const cmsPageSectionsApi =
  baseApi.injectEndpoints({
    endpoints: (builder) => ({
      getCmsSectionTypes: builder.query<
        CmsSectionTypesResponse,
        CmsSectionTypeListParams | void
      >({
        query: (params) => ({
          url: "/admin/cms/section-types",
          params: params || undefined,
        }),

        providesTags: (result) => {
          const sectionTypes =
            result?.data ?? [];

          return [
            ...sectionTypes.map(
              (sectionType) => ({
                type: "CmsSectionTypes" as const,
                id: sectionType.id,
              })
            ),
            {
              type: "CmsSectionTypes" as const,
              id: "LIST",
            },
          ];
        },
      }),

      getCmsSectionTypeById:
        builder.query<
          CmsSectionTypeResponse,
          string
        >({
          query: (id) => ({
            url: `/admin/cms/section-types/${id}`,
          }),

          providesTags: (
            _result,
            _error,
            id
          ) => [
            {
              type: "CmsSectionTypes" as const,
              id,
            },
          ],
        }),

      getCmsPageSections: builder.query<
        CmsPageSectionsResponse,
        string
      >({
        query: (pageId) => ({
          url: `/admin/cms/pages/${pageId}/sections`,
        }),

        providesTags: (
          result,
          _error,
          pageId
        ) => {
          const sections =
            result?.data ?? [];

          return [
            ...sections.map((section) => ({
              type: "CmsPageSections" as const,
              id: section.id,
            })),
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${pageId}`,
            },
          ];
        },
      }),

      getCmsPageSectionById:
        builder.query<
          CmsPageSectionResponse,
          {
            pageId: string;
            sectionId: string;
          }
        >({
          query: ({
            pageId,
            sectionId,
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections/${sectionId}`,
          }),

          providesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: argument.sectionId,
            },
          ],
        }),

      createCmsPageSection:
        builder.mutation<
          CmsPageSectionResponse,
          CreateCmsPageSectionRequest
        >({
          query: ({
            pageId,
            ...body
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections`,
            method: "POST",
            body,
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${argument.pageId}`,
            },
          ],
        }),

      updateCmsPageSection:
        builder.mutation<
          CmsPageSectionResponse,
          UpdateCmsPageSectionRequest
        >({
          query: ({
            pageId,
            sectionId,
            body,
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections/${sectionId}`,
            method: "PUT",
            body,
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: argument.sectionId,
            },
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${argument.pageId}`,
            },
          ],
        }),

      changeCmsPageSectionEnabled:
        builder.mutation<
          CmsPageSectionResponse,
          {
            pageId: string;
            sectionId: string;
            isEnabled: boolean;
          }
        >({
          query: ({
            pageId,
            sectionId,
            isEnabled,
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections/${sectionId}/enabled`,
            method: "PATCH",
            body: {
              isEnabled,
            },
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: argument.sectionId,
            },
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${argument.pageId}`,
            },
          ],
        }),

      reorderCmsPageSections:
        builder.mutation<
          CmsPageSectionsResponse,
          ReorderCmsPageSectionsRequest
        >({
          query: ({
            pageId,
            sections,
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections/reorder`,
            method: "PUT",
            body: {
              sections,
            },
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${argument.pageId}`,
            },
          ],
        }),

      duplicateCmsPageSection:
        builder.mutation<
          CmsPageSectionResponse,
          {
            pageId: string;
            sectionId: string;
          }
        >({
          query: ({
            pageId,
            sectionId,
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections/${sectionId}/duplicate`,
            method: "POST",
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${argument.pageId}`,
            },
          ],
        }),

      deleteCmsPageSection:
        builder.mutation<
          {
            success: boolean;
            message: string;
            data: {
              id: string;
            };
          },
          {
            pageId: string;
            sectionId: string;
          }
        >({
          query: ({
            pageId,
            sectionId,
          }) => ({
            url: `/admin/cms/pages/${pageId}/sections/${sectionId}`,
            method: "DELETE",
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type: "CmsPageSections" as const,
              id: `PAGE-${argument.pageId}`,
            },
          ],
        }),
    }),

    overrideExisting: false,
  });

export const {
  useGetCmsSectionTypesQuery,
  useGetCmsSectionTypeByIdQuery,
  useGetCmsPageSectionsQuery,
  useGetCmsPageSectionByIdQuery,
  useCreateCmsPageSectionMutation,
  useUpdateCmsPageSectionMutation,
  useChangeCmsPageSectionEnabledMutation,
  useReorderCmsPageSectionsMutation,
  useDuplicateCmsPageSectionMutation,
  useDeleteCmsPageSectionMutation,
} = cmsPageSectionsApi;