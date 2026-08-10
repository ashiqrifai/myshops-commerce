import {
  baseApi,
} from "./baseApi";

import type {
  CreateMediaFolderBody,
  MediaAssetLifecycleResponse,
  MediaAssetResponse,
  MediaAssetUsageResponse,
  MediaAssetsListParams,
  MediaAssetsResponse,
  MediaFolderResponse,
  MediaFolderTreeResponse,
  UpdateMediaAssetRequest,
  UploadMediaAssetResponse,
} from "@/types/media";

export const mediaApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        getMediaFolderTree:
          builder.query<
            MediaFolderTreeResponse,
            void
          >({
            query: () => ({
              url:
                "/admin/media/folders/tree",
            }),

            providesTags:
              (result) => {
                const folders =
                  result?.data ||
                  [];

                const collectFolderTags =
                  (
                    folderList:
                      typeof folders
                  ): Array<{
                    type:
                      "MediaFolders";

                    id:
                      string;
                  }> => {
                    return folderList.flatMap(
                      (
                        folder
                      ) => [
                        {
                          type:
                            "MediaFolders" as const,

                          id:
                            folder.id,
                        },

                        ...collectFolderTags(
                          folder.children ||
                            []
                        ),
                      ]
                    );
                  };

                return [
                  ...collectFolderTags(
                    folders
                  ),

                  {
                    type:
                      "MediaFolders" as const,

                    id:
                      "TREE",
                  },
                ];
              },
          }),

        getMediaAssets:
          builder.query<
            MediaAssetsResponse,
            | MediaAssetsListParams
            | void
          >({
            query:
              (params) => ({
                url:
                  "/admin/media/assets",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (result) => {
                const assets =
                  result?.data ||
                  [];

                return [
                  ...assets.map(
                    (
                      asset
                    ) => ({
                      type:
                        "MediaAssets" as const,

                      id:
                        asset.id,
                    })
                  ),

                  {
                    type:
                      "MediaAssets" as const,

                    id:
                      "LIST",
                  },
                ];
              },
          }),

        getMediaAssetById:
          builder.query<
            MediaAssetResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/media/assets/${id}`,
              }),

            providesTags: (
              _result,
              _error,
              id
            ) => [
              {
                type:
                  "MediaAssets" as const,

                id,
              },
            ],
          }),

        uploadMediaAsset:
          builder.mutation<
            UploadMediaAssetResponse,
            FormData
          >({
            query:
              (
                formData
              ) => ({
                url:
                  "/admin/media/assets/upload",

                method:
                  "POST",

                body:
                  formData,
              }),

            /*
             * Do not manually add:
             *
             * Content-Type:
             * multipart/form-data
             *
             * The browser must generate
             * the multipart boundary.
             */

            invalidatesTags: [
              {
                type:
                  "MediaAssets",

                id:
                  "LIST",
              },

              {
                type:
                  "MediaFolders",

                id:
                  "TREE",
              },
            ],
          }),

        createMediaFolder:
          builder.mutation<
            MediaFolderResponse,
            CreateMediaFolderBody
          >({
            query:
              (body) => ({
                url:
                  "/admin/media/folders",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "MediaFolders",

                id:
                  "TREE",
              },
            ],
          }),

        getMediaAssetUsage:
          builder.query<
            MediaAssetUsageResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/media/assets/${id}/usage`,
              }),

            providesTags: (
              _result,
              _error,
              id
            ) => [
              {
                type:
                  "MediaAssets" as const,

                id:
                  `USAGE-${id}`,
              },
            ],
          }),

        archiveMediaAsset:
          builder.mutation<
            MediaAssetLifecycleResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/media/assets/${id}/archive`,

                method:
                  "PATCH",
              }),

            invalidatesTags: (
              _result,
              _error,
              id
            ) => [
              {
                type:
                  "MediaAssets" as const,

                id,
              },

              {
                type:
                  "MediaAssets" as const,

                id:
                  "LIST",
              },

              {
                type:
                  "MediaFolders" as const,

                id:
                  "TREE",
              },
            ],
          }),

        restoreMediaAsset:
          builder.mutation<
            MediaAssetLifecycleResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/media/assets/${id}/restore`,

                method:
                  "PATCH",
              }),

            invalidatesTags: (
              _result,
              _error,
              id
            ) => [
              {
                type:
                  "MediaAssets" as const,

                id,
              },

              {
                type:
                  "MediaAssets" as const,

                id:
                  "LIST",
              },

              {
                type:
                  "MediaFolders" as const,

                id:
                  "TREE",
              },
            ],
          }),

        reprocessMediaAsset:
          builder.mutation<
            MediaAssetResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/media/assets/${id}/reprocess`,

                method:
                  "POST",
              }),

            invalidatesTags: (
              _result,
              _error,
              id
            ) => [
              {
                type:
                  "MediaAssets" as const,

                id,
              },

              {
                type:
                  "MediaAssets" as const,

                id:
                  "LIST",
              },
            ],
          }),

        updateMediaAsset:
          builder.mutation<
            MediaAssetResponse,
            UpdateMediaAssetRequest
          >({
            query: ({
              id,
              body,
            }) => ({
              url:
                `/admin/media/assets/${id}`,

              method:
                "PUT",

              body,
            }),

            invalidatesTags: (
              _result,
              _error,
              argument
            ) => [
              {
                type:
                  "MediaAssets" as const,

                id:
                  argument.id,
              },

              {
                type:
                  "MediaAssets" as const,

                id:
                  "LIST",
              },

              {
                type:
                  "MediaFolders" as const,

                id:
                  "TREE",
              },
            ],
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useGetMediaFolderTreeQuery,
  useCreateMediaFolderMutation,
  useGetMediaAssetsQuery,
  useGetMediaAssetByIdQuery,
  useGetMediaAssetUsageQuery,
  useUploadMediaAssetMutation,
  useUpdateMediaAssetMutation,
  useArchiveMediaAssetMutation,
  useRestoreMediaAssetMutation,
  useReprocessMediaAssetMutation,
} = mediaApi;