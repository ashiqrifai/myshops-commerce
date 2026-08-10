import { baseApi } from "./baseApi";

import type {
  BulkUpdateSettingsRequest,
  SettingsResponse,
  SystemSetting,
} from "@/types/settings";

interface SettingsQueryParams {
  channel?: string;
  group?: string;
  search?: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<
      SettingsResponse,
      SettingsQueryParams | void
    >({
      query: (params) => ({
        url: "/admin/settings",
        params: params || undefined,
      }),

      providesTags: (result) =>
        result
          ? [
              ...result.data.map((setting) => ({
                type: "Settings" as const,
                id: setting.id,
              })),
              {
                type: "Settings",
                id: "LIST",
              },
            ]
          : [
              {
                type: "Settings",
                id: "LIST",
              },
            ],
    }),

    updateSetting: builder.mutation<
      {
        success: boolean;
        message: string;
        data: SystemSetting;
      },
      {
        id: string;
        value: unknown;
      }
    >({
      query: ({ id, value }) => ({
        url: `/admin/settings/${id}`,
        method: "PATCH",
        body: {
          value,
        },
      }),

      invalidatesTags: (_result, _error, argument) => [
        {
          type: "Settings",
          id: argument.id,
        },
        {
          type: "Settings",
          id: "LIST",
        },
      ],
    }),

    bulkUpdateSettings: builder.mutation<
      SettingsResponse & {
        message?: string;
      },
      BulkUpdateSettingsRequest
    >({
      query: (body) => ({
        url: "/admin/settings",
        method: "PUT",
        body,
      }),

      invalidatesTags: [
        {
          type: "Settings",
          id: "LIST",
        },
      ],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingMutation,
  useBulkUpdateSettingsMutation,
} = settingsApi;