import {
    baseApi,
  } from "./baseApi";
  
  import type {
    NavigationItem,
    NavigationItemFormValues,
    NavigationMenuFormValues,
    NavigationMenuListParams,
    NavigationMenuListResponse,
    NavigationMenuResponse,
    ReorderNavigationItemsRequest,
  } from "@/types/navigation";
  
  export const navigationApi =
    baseApi.injectEndpoints({
      endpoints: (builder) => ({
        getNavigationMenus:
          builder.query<
            NavigationMenuListResponse,
            NavigationMenuListParams | void
          >({
            query: (params) => ({
              url: "/admin/cms/navigation",
              params: {
                page: 1,
                pageSize: 100,
                sortBy: "name",
                sortDirection: "ASC",
                ...(params || {}),
              },
            }),
            providesTags: (
              result
            ) => {
              const menus =
                result?.data ??
                [];
  
              return [
                ...menus.map(
                  (menu) => ({
                    type:
                      "NavigationMenus" as const,
  
                    id:
                      menu.id,
                  })
                ),
  
                {
                  type:
                    "NavigationMenus" as const,
  
                  id:
                    "LIST",
                },
              ];
            },
          }),
  
        getNavigationMenuById:
          builder.query<
            NavigationMenuResponse,
            string
          >({
            query: (id) => ({
              url:
                `/admin/cms/navigation/${id}`,
            }),
  
            providesTags: (
              result,
              _error,
              id
            ) => {
              const itemTags =
                result?.data.items
                  ? flattenItems(
                      result.data
                        .items
                    ).map(
                      (item) => ({
                        type:
                          "NavigationItems" as const,
  
                        id:
                          item.id,
                      })
                    )
                  : [];
  
              return [
                {
                  type:
                    "NavigationMenus" as const,
  
                  id,
                },
  
                {
                  type:
                    "NavigationItems" as const,
  
                  id:
                    `MENU-${id}`,
                },
  
                ...itemTags,
              ];
            },
          }),
  
        createNavigationMenu:
          builder.mutation<
            NavigationMenuResponse,
            NavigationMenuFormValues
          >({
            query: (body) => ({
              url:
                "/admin/cms/navigation",
  
              method:
                "POST",
  
              body,
            }),
  
            invalidatesTags: [
              {
                type:
                  "NavigationMenus",
  
                id:
                  "LIST",
              },
            ],
          }),
  
        updateNavigationMenu:
          builder.mutation<
            NavigationMenuResponse,
            {
              id: string;
  
              body:
                Partial<NavigationMenuFormValues>;
            }
          >({
            query: ({
              id,
              body,
            }) => ({
              url:
                `/admin/cms/navigation/${id}`,
  
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
                  "NavigationMenus",
  
                id:
                  argument.id,
              },
  
              {
                type:
                  "NavigationMenus",
  
                id:
                  "LIST",
              },
            ],
          }),
  
        changeNavigationMenuActive:
          builder.mutation<
            NavigationMenuResponse,
            {
              id: string;
              isActive: boolean;
            }
          >({
            query: ({
              id,
              isActive,
            }) => ({
              url:
                `/admin/cms/navigation/${id}/active`,
  
              method:
                "PATCH",
  
              body: {
                isActive,
              },
            }),
  
            invalidatesTags: (
              _result,
              _error,
              argument
            ) => [
              {
                type:
                  "NavigationMenus",
  
                id:
                  argument.id,
              },
  
              {
                type:
                  "NavigationMenus",
  
                id:
                  "LIST",
              },
            ],
          }),
  
        createNavigationItem:
          builder.mutation<
            NavigationMenuResponse,
            {
              menuId: string;
  
              body:
                NavigationItemFormValues;
            }
          >({
            query: ({
              menuId,
              body,
            }) => ({
              url:
                `/admin/cms/navigation/${menuId}/items`,
  
              method:
                "POST",
  
              body,
            }),
  
            invalidatesTags: (
              _result,
              _error,
              argument
            ) => [
              {
                type:
                  "NavigationMenus",
  
                id:
                  argument.menuId,
              },
  
              {
                type:
                  "NavigationItems",
  
                id:
                  `MENU-${argument.menuId}`,
              },
  
              {
                type:
                  "NavigationMenus",
  
                id:
                  "LIST",
              },
            ],
          }),
  
        updateNavigationItem:
          builder.mutation<
            NavigationMenuResponse,
            {
              menuId: string;
              itemId: string;
  
              body:
                Partial<NavigationItemFormValues> & {
                  isActive?: boolean;
                };
            }
          >({
            query: ({
              itemId,
              body,
            }) => ({
              url:
                `/admin/cms/navigation/items/${itemId}`,
  
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
                  "NavigationMenus",
  
                id:
                  argument.menuId,
              },
  
              {
                type:
                  "NavigationItems",
  
                id:
                  argument.itemId,
              },
  
              {
                type:
                  "NavigationItems",
  
                id:
                  `MENU-${argument.menuId}`,
              },
            ],
          }),
  
        deleteNavigationItem:
          builder.mutation<
            NavigationMenuResponse,
            {
              menuId: string;
              itemId: string;
            }
          >({
            query: ({
              itemId,
            }) => ({
              url:
                `/admin/cms/navigation/items/${itemId}`,
  
              method:
                "DELETE",
            }),
  
            invalidatesTags: (
              _result,
              _error,
              argument
            ) => [
              {
                type:
                  "NavigationMenus",
  
                id:
                  argument.menuId,
              },
  
              {
                type:
                  "NavigationItems",
  
                id:
                  `MENU-${argument.menuId}`,
              },
  
              {
                type:
                  "NavigationMenus",
  
                id:
                  "LIST",
              },
            ],
          }),
  
        reorderNavigationItems:
          builder.mutation<
            NavigationMenuResponse,
            ReorderNavigationItemsRequest
          >({
            query: ({
              menuId,
              items,
            }) => ({
              url:
                `/admin/cms/navigation/${menuId}/reorder`,
  
              method:
                "POST",
  
              body: {
                items,
              },
            }),
  
            invalidatesTags: (
              _result,
              _error,
              argument
            ) => [
              {
                type:
                  "NavigationMenus",
  
                id:
                  argument.menuId,
              },
  
              {
                type:
                  "NavigationItems",
  
                id:
                  `MENU-${argument.menuId}`,
              },
            ],
          }),
      }),
  
      overrideExisting: false,
    });
  
    function flattenItems(
        items: NavigationItem[]
      ): NavigationItem[] {
        return items.flatMap(
          (item) => [
            item,
            ...flattenItems(
              item.children || []
            ),
          ]
        );
      }
  

      export const {
        useGetNavigationMenusQuery,
        useGetNavigationMenuByIdQuery,
        useCreateNavigationMenuMutation,
        useUpdateNavigationMenuMutation,
        useChangeNavigationMenuActiveMutation,
        useCreateNavigationItemMutation,
        useUpdateNavigationItemMutation,
        useDeleteNavigationItemMutation,
        useReorderNavigationItemsMutation,
      } = navigationApi;