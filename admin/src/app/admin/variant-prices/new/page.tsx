"use client";

import {
  ArrowLeft,
  BadgeDollarSign,
  LoaderCircle,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useSelector,
} from "react-redux";

import VariantPriceForm from "@/components/admin/pricing/VariantPriceForm";

import {
  useGetPriceListsQuery,
} from "@/store/api/priceListApi";

import {
  useGetProductsQuery,
} from "@/store/api/productApi";

import {
  useCreateVariantPriceMutation,
} from "@/store/api/variantPriceApi";

import type {
  RootState,
} from "@/store";

import type {
  VariantPriceFormValues,
} from "@/types/variantPrice";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error:
    unknown
) {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return "An unexpected error occurred.";
  }

  const apiError =
    error as {
      data?: {
        message?:
          string;

        error?:
          string;

        errors?: Array<{
          msg?:
            string;

          message?:
            string;
        }>;
      };

      message?:
        string;

      error?:
        string;
    };

  if (
    apiError.data
      ?.message
  ) {
    return apiError.data.message;
  }

  if (
    apiError.data
      ?.error
  ) {
    return apiError.data.error;
  }

  if (
    apiError.data
      ?.errors
      ?.length
  ) {
    return (
      apiError.data
        .errors[0]
        ?.msg ||
      apiError.data
        .errors[0]
        ?.message ||
      "Validation failed."
    );
  }

  if (
    apiError.message
  ) {
    return apiError.message;
  }

  if (
    apiError.error
  ) {
    return apiError.error;
  }

  return "An unexpected error occurred.";
}

/*
|--------------------------------------------------------------------------
| Loading State
|--------------------------------------------------------------------------
*/

function PageLoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-[#e1e3e5] bg-white">
      <div className="flex flex-col items-center text-center">
        <LoaderCircle
          size={
            30
          }
          className="animate-spin text-[#6d7175]"
        />

        <p className="mt-4 text-sm font-semibold text-[#202223]">
          Preparing variant
          pricing
        </p>

        <p className="mt-1 text-sm text-[#6d7175]">
          Loading products and
          price lists...
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function NewVariantPricePage() {
  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  const {
    initialized,
    accessToken,
  } = useSelector(
    (
      state:
        RootState
    ) =>
      state.auth
  );

  const shouldSkipQueries =
    !initialized ||
    !accessToken;

  /*
  |--------------------------------------------------------------------------
  | Price Lists
  |--------------------------------------------------------------------------
  */

  const {
    data:
      priceListResponse,

    isLoading:
      isLoadingPriceLists,

    isFetching:
      isFetchingPriceLists,

    error:
      priceListError,

    refetch:
      refetchPriceLists,
  } =
    useGetPriceListsQuery(
      {
        page:
          1,

        pageSize:
          200,

        isActive:
          true,

        sortBy:
          "priority",

        sortDirection:
          "ASC",
      },
      {
        skip:
          shouldSkipQueries,

        refetchOnMountOrArgChange:
          true,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  const {
    data:
      productResponse,

    isLoading:
      isLoadingProducts,

    isFetching:
      isFetchingProducts,

    error:
      productError,

    refetch:
      refetchProducts,
  } =
    useGetProductsQuery(
      {
        page:
          1,

        pageSize:
          200,

        status:
          "ACTIVE",

        sortBy:
          "name",

        sortDirection:
          "ASC",
      },
      {
        skip:
          shouldSkipQueries,

        refetchOnMountOrArgChange:
          true,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Mutation
  |--------------------------------------------------------------------------
  */

  const [
    createVariantPrice,
    {
      isLoading:
        isCreating,
    },
  ] =
    useCreateVariantPriceMutation();

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const priceLists =
    useMemo(
      () =>
        priceListResponse
          ?.data ||
        [],
      [
        priceListResponse,
      ]
    );

  const products =
    useMemo(
      () =>
        productResponse
          ?.data ||
        [],
      [
        productResponse,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleCancel =
    () => {
      router.push(
        "/admin/variant-prices"
      );
    };

  const handleSubmit =
    async (
      values:
        VariantPriceFormValues
    ) => {
      await createVariantPrice(
        values
      ).unwrap();

      router.push(
        "/admin/variant-prices"
      );

      router.refresh();
    };

  const handleRetry =
    async () => {
      await Promise.allSettled(
        [
          refetchPriceLists(),
          refetchProducts(),
        ]
      );
    };

  /*
  |--------------------------------------------------------------------------
  | States
  |--------------------------------------------------------------------------
  */

  const isInitialLoading =
    !shouldSkipQueries &&
    (
      isLoadingPriceLists ||
      isLoadingProducts
    );

  const isLookupFetching =
    isFetchingPriceLists ||
    isFetchingProducts;

  const lookupError =
    priceListError ||
    productError;

  const lookupErrorMessage =
    lookupError
      ? getErrorMessage(
          lookupError
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-5">
      {/*
      ----------------------------------------------------------------------
      Page Header
      ----------------------------------------------------------------------
      */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={
              handleCancel
            }
            disabled={
              isCreating
            }
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#6d7175] transition hover:text-[#202223] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft
              size={
                16
              }
            />

            Variant Pricing
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#202223]">
              Create Variant
              Price
            </h1>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold text-[#6d7175]">
              <BadgeDollarSign
                size={
                  14
                }
              />

              New Price
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Assign a price to
            a product variant
            for a specific
            price list,
            quantity range
            and validity
            period.
          </p>
        </div>
      </div>

      {/*
      ----------------------------------------------------------------------
      Authentication Initialization
      ----------------------------------------------------------------------
      */}

      {!initialized && (
        <PageLoadingState />
      )}

      {/*
      ----------------------------------------------------------------------
      Missing Session
      ----------------------------------------------------------------------
      */}

      {initialized &&
        !accessToken && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              Authentication
              required
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Your session is
              not available.
              Please sign in
              again before
              creating a
              variant price.
            </p>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Lookup Error
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        lookupErrorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to
                  prepare the
                  pricing form
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {
                    lookupErrorMessage
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={
                  isLookupFetching
                }
                onClick={
                  handleRetry
                }
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLookupFetching
                  ? "Retrying..."
                  : "Try Again"}
              </button>
            </div>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Initial Loading
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !lookupError &&
        isInitialLoading && (
          <PageLoadingState />
        )}

      {/*
      ----------------------------------------------------------------------
      Missing Lookup Data
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !lookupError &&
        !isInitialLoading &&
        priceLists.length ===
          0 && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              No active price
              lists available
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Create or
              activate at
              least one price
              list before
              assigning
              prices to
              product
              variants.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/price-lists/new"
                )
              }
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-amber-900 px-3 text-sm font-semibold text-white transition hover:bg-amber-950"
            >
              Create Price List
            </button>
          </div>
        )}

      {initialized &&
        accessToken &&
        !lookupError &&
        !isInitialLoading &&
        products.length ===
          0 && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              No active
              products
              available
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Create or
              activate a
              product before
              assigning
              variant
              pricing.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/products/new"
                )
              }
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-amber-900 px-3 text-sm font-semibold text-white transition hover:bg-amber-950"
            >
              Create Product
            </button>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Form
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !lookupError &&
        !isInitialLoading &&
        priceLists.length >
          0 &&
        products.length >
          0 && (
          <VariantPriceForm
            mode="create"
            priceLists={
              priceLists
            }
            products={
              products
            }
            loadingPriceLists={
              isFetchingPriceLists
            }
            loadingProducts={
              isFetchingProducts
            }
            submitting={
              isCreating
            }
            onSubmit={
              handleSubmit
            }
            onCancel={
              handleCancel
            }
          />
        )}
    </div>
  );
}