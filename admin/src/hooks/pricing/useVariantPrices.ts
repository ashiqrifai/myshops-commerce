"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useSelector,
} from "react-redux";

import type {
  RootState,
} from "@/store";

import {
  useGetVariantPricesQuery,
  useCreateVariantPriceMutation,
  useUpdateVariantPriceMutation,
  useDeleteVariantPriceMutation,
  useChangeVariantPriceStatusMutation,
} from "@/store/api/variantPriceApi";

import type {
  VariantPrice,
  VariantPriceFormValues,
  VariantPriceListParams,
} from "@/types/variantPrice";

export function useVariantPrices() {
  const router =
    useRouter();

  const {
    initialized,
    accessToken,
  } = useSelector(
    (state: RootState) =>
      state.auth
  );

  const [queryParams, setQueryParams] =
    useState<VariantPriceListParams>({
      page: 1,
      pageSize: 25,
      sortBy: "priority",
      sortDirection: "ASC",
    });

  const shouldSkipQuery =
    !initialized ||
    !accessToken;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } =
    useGetVariantPricesQuery(
      queryParams,
      {
        skip:
          shouldSkipQuery,

        refetchOnMountOrArgChange:
          true,
      }
    );

  const [
    createVariantPrice,
    createState,
  ] =
    useCreateVariantPriceMutation();

  const [
    updateVariantPrice,
    updateState,
  ] =
    useUpdateVariantPriceMutation();

  const [
    deleteVariantPrice,
    deleteState,
  ] =
    useDeleteVariantPriceMutation();

  const [
    changeVariantPriceStatus,
    statusState,
  ] =
    useChangeVariantPriceStatusMutation();

  const variantPrices =
    data?.data ?? [];

  const pagination =
    data?.pagination;

  const busy =
    isLoading ||
    isFetching ||
    createState.isLoading ||
    updateState.isLoading ||
    deleteState.isLoading ||
    statusState.isLoading;

  const setFilters = (
    values: Partial<VariantPriceListParams>
  ) => {
    setQueryParams(
      (previous) => ({
        ...previous,
        ...values,
        page: 1,
      })
    );
  };

  const setPage = (
    page: number
  ) => {
    setQueryParams(
      (previous) => ({
        ...previous,
        page,
      })
    );
  };

  const setPageSize = (
    pageSize: number
  ) => {
    setQueryParams(
      (previous) => ({
        ...previous,
        pageSize,
        page: 1,
      })
    );
  };

  const resetFilters =
    () => {
      setQueryParams({
        page: 1,
        pageSize: 25,
        sortBy:
          "priority",
        sortDirection:
          "ASC",
      });
    };

  const create =
    async (
      values: VariantPriceFormValues
    ) => {
      return await createVariantPrice(
        values
      ).unwrap();
    };

  const update =
    async (
      id: string,
      values: Partial<VariantPriceFormValues>
    ) => {
      return await updateVariantPrice({
        id,
        body: values,
      }).unwrap();
    };

  const remove =
    async (
      id: string
    ) => {
      return await deleteVariantPrice(
        id
      ).unwrap();
    };

  const changeStatus =
    async (
      id: string,
      isActive: boolean
    ) => {
      return await changeVariantPriceStatus(
        {
          id,
          isActive,
        }
      ).unwrap();
    };

  const openCreate =
    () =>
      router.push(
        "/admin/variant-prices/new"
      );

  const openEdit =
    (
      variantPrice:
        | VariantPrice
        | string
    ) => {
      const id =
        typeof variantPrice ===
        "string"
          ? variantPrice
          : variantPrice.id;

      router.push(
        `/admin/variant-prices/${id}/edit`
      );
    };

  const refresh =
    () =>
      refetch();

  return useMemo(
    () => ({
      initialized,

      accessToken,

      busy,

      error,

      variantPrices,

      pagination,

      queryParams,

      setQueryParams,

      setFilters,

      setPage,

      setPageSize,

      resetFilters,

      refresh,

      create,

      update,

      remove,

      changeStatus,

      openCreate,

      openEdit,
    }),
    [
      initialized,
      accessToken,
      busy,
      error,
      variantPrices,
      pagination,
      queryParams,
    ]
  );
}