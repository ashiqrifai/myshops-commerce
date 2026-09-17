import { baseApi } from "./baseApi";
import type {
  DeleteSupplierResponse,
  SupplierFormValues,
  SupplierListParams,
  SupplierListResponse,
  SupplierResponse,
} from "@/types/supplier";

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<SupplierListResponse, SupplierListParams | void>({
      query: (params) => ({ url: "/suppliers", params: params || undefined }),
      providesTags: (result) => [
        ...(result?.data || []).map((supplier) => ({ type: "Suppliers" as const, id: supplier.id })),
        { type: "Suppliers" as const, id: "LIST" },
      ],
    }),

    getSupplierById: builder.query<SupplierResponse, string>({
      query: (id) => ({ url: `/suppliers/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Suppliers" as const, id }],
    }),

    createSupplier: builder.mutation<SupplierResponse, SupplierFormValues>({
      query: (body) => ({ url: "/suppliers", method: "POST", body }),
      invalidatesTags: [{ type: "Suppliers", id: "LIST" }],
    }),

    updateSupplier: builder.mutation<SupplierResponse, { id: string; body: Partial<SupplierFormValues> }>({
      query: ({ id, body }) => ({ url: `/suppliers/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Suppliers" as const, id: arg.id },
        { type: "Suppliers" as const, id: "LIST" },
      ],
    }),

    changeSupplierStatus: builder.mutation<SupplierResponse, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/suppliers/${id}/status`, method: "PATCH", body: { isActive } }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Suppliers" as const, id: arg.id },
        { type: "Suppliers" as const, id: "LIST" },
      ],
    }),

    deleteSupplier: builder.mutation<DeleteSupplierResponse, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Suppliers" as const, id },
        { type: "Suppliers" as const, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useChangeSupplierStatusMutation,
  useDeleteSupplierMutation,
} = supplierApi;
