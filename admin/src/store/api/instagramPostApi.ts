import {
    baseApi,
  } from "./baseApi";
  
  import type {
    DeleteInstagramPostResponse,
    InstagramPostFormValues,
    InstagramPostListParams,
    InstagramPostListResponse,
    InstagramPostResponse,
  } from "@/types/instagramPost";
  
  export const instagramPostApi =
    baseApi.injectEndpoints({
      endpoints:
        (builder) => ({
          /*
          |--------------------------------------------------------------------------
          | List Instagram Posts
          |--------------------------------------------------------------------------
          */
  
          getInstagramPosts:
            builder.query<
              InstagramPostListResponse,
              InstagramPostListParams | void
            >({
              query:
                (params) => ({
                  url:
                    "/admin/instagram-posts",
  
                  params:
                    params ||
                    undefined,
                }),
  
              providesTags:
                (result) => {
                  const posts =
                    result?.data ||
                    [];
  
                  return [
                    ...posts.map(
                      (post) => ({
                        type:
                          "InstagramPosts" as const,
  
                        id:
                          post.id,
                      })
                    ),
  
                    {
                      type:
                        "InstagramPosts" as const,
  
                      id:
                        "LIST",
                    },
                  ];
                },
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Get Instagram Post
          |--------------------------------------------------------------------------
          */
  
          getInstagramPostById:
            builder.query<
              InstagramPostResponse,
              string
            >({
              query:
                (id) => ({
                  url:
                    `/admin/instagram-posts/${id}`,
                }),
  
              providesTags:
                (
                  _result,
                  _error,
                  id
                ) => [
                  {
                    type:
                      "InstagramPosts" as const,
  
                    id,
                  },
                ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Create
          |--------------------------------------------------------------------------
          */
  
          createInstagramPost:
            builder.mutation<
              InstagramPostResponse,
              InstagramPostFormValues
            >({
              query:
                (body) => ({
                  url:
                    "/admin/instagram-posts",
  
                  method:
                    "POST",
  
                  body,
                }),
  
              invalidatesTags: [
                {
                  type:
                    "InstagramPosts",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Update
          |--------------------------------------------------------------------------
          */
  
          updateInstagramPost:
            builder.mutation<
              InstagramPostResponse,
              {
                id:
                  string;
  
                body:
                  Partial<
                    InstagramPostFormValues
                  >;
              }
            >({
              query:
                ({
                  id,
                  body,
                }) => ({
                  url:
                    `/admin/instagram-posts/${id}`,
  
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
                      "InstagramPosts" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "InstagramPosts" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Status
          |--------------------------------------------------------------------------
          */
  
          changeInstagramPostStatus:
            builder.mutation<
              InstagramPostResponse,
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
                    `/admin/instagram-posts/${id}/status`,
  
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
                      "InstagramPosts" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "InstagramPosts" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Delete
          |--------------------------------------------------------------------------
          */
  
          deleteInstagramPost:
            builder.mutation<
              DeleteInstagramPostResponse,
              string
            >({
              query:
                (id) => ({
                  url:
                    `/admin/instagram-posts/${id}`,
  
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
                      "InstagramPosts" as const,
  
                    id,
                  },
  
                  {
                    type:
                      "InstagramPosts" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
        }),
  
      overrideExisting:
        false,
    });
  
  export const {
    useGetInstagramPostsQuery,
    useGetInstagramPostByIdQuery,
    useCreateInstagramPostMutation,
    useUpdateInstagramPostMutation,
    useChangeInstagramPostStatusMutation,
    useDeleteInstagramPostMutation,
  } = instagramPostApi;