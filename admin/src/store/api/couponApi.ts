import {
  baseApi,
} from "./baseApi";

import type {
  CouponFormValues,
  CouponListParams,
  CouponListResponse,
  CouponResponse,
  DeleteCouponResponse,
} from "@/types/coupon";

export const couponApi =
  baseApi.injectEndpoints({
    endpoints:
      (
        builder
      ) => ({
        /*
         * ------------------------------------------------
         * LIST COUPONS
         * ------------------------------------------------
         */
        getCoupons:
          builder.query<
            CouponListResponse,
            CouponListParams | void
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/pricing/coupons",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (
                result
              ) => {
                const coupons =
                  result?.data ||
                  [];

                return [
                  ...coupons.map(
                    (
                      coupon
                    ) => ({
                      type:
                        "Coupons" as const,

                      id:
                        coupon.id,
                    })
                  ),

                  {
                    type:
                      "Coupons" as const,

                    id:
                      "LIST",
                  },
                ];
              },
          }),

        /*
         * ------------------------------------------------
         * GET ONE COUPON
         * ------------------------------------------------
         */
        getCouponById:
          builder.query<
            CouponResponse,
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/pricing/coupons/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "Coupons" as const,

                  id,
                },
              ],
          }),

        /*
         * ------------------------------------------------
         * CREATE COUPON
         * ------------------------------------------------
         */
        createCoupon:
          builder.mutation<
            CouponResponse,
            CouponFormValues
          >({
            query:
              (
                body
              ) => ({
                url:
                  "/pricing/coupons",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "Coupons",

                id:
                  "LIST",
              },
            ],
          }),

        /*
         * ------------------------------------------------
         * UPDATE COUPON
         * ------------------------------------------------
         */
        updateCoupon:
          builder.mutation<
            CouponResponse,
            {
              id:
                string;

              body:
                Partial<CouponFormValues>;
            }
          >({
            query:
              ({
                id,
                body,
              }) => ({
                url:
                  `/pricing/coupons/${id}`,

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
                    "Coupons" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Coupons" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
         * ------------------------------------------------
         * ACTIVATE / DEACTIVATE COUPON
         * ------------------------------------------------
         */
        changeCouponStatus:
          builder.mutation<
            CouponResponse,
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
                  `/pricing/coupons/${id}/status`,

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
                    "Coupons" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "Coupons" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        /*
         * ------------------------------------------------
         * DELETE COUPON
         * ------------------------------------------------
         */
        deleteCoupon:
          builder.mutation<
            DeleteCouponResponse,
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/pricing/coupons/${id}`,

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
                    "Coupons" as const,

                  id,
                },

                {
                  type:
                    "Coupons" as const,

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
  useGetCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useChangeCouponStatusMutation,
  useDeleteCouponMutation,
} =
  couponApi;