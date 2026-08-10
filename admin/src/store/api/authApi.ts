import { baseApi } from "./baseApi";

import type {
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/admin/auth/login",
        method: "POST",
        body,
      }),
    }),

    logout: builder.mutation<
      { success: boolean; message: string },
      void
    >({
      query: () => ({
        url: "/admin/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
} = authApi;