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
  useParams,
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
  useGetVariantPriceByIdQuery,
  useUpdateVariantPriceMutation,
} from "@/store/api/variantPriceApi";

import type {
  RootState,
} from "@/store";

import type {
  VariantPriceFormValues,
} from "@/types/variantPrice";

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error: unknown
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
      status?:
        number | string;

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

function PageLoadingState({
  message =
    "Loading variant price...",
}: {
  message?:
    string;
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-[#e1e3e5] bg-white">
      <div className="flex flex-col items-center text-center">
        <LoaderCircle
          size={30}
          className="animate-spin text-[#6d7175]"
        />

        <p className="mt-4 text-sm font-semibold text-[#202223]">
          Preparing pricing
          form
        </p>

        <p className="mt-1 text-sm text-[#6d7175]">
          {message}
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

export default function EditVariantPricePage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id:
        string;
    }>();

  const variantPriceId =
    Array.isArray(
      params.id
    )
      ? params.id[0]
      : params.id;

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
    !accessToken ||
    !variantPriceId;

  /*
  |--------------------------------------------------------------------------
  | Existing Variant Price
  |--------------------------------------------------------------------------
  */

  const {
    data:
      variantPriceResponse,

    isLoading:
      isLoadingVariantPrice,

    isFetching:
      isFetchingVariantPrice,

    error:
      variantPriceError,

    refetch:
      refetchVariantPrice,
  } =
    useGetVariantPriceByIdQuery(
      variantPriceId,
      {
        skip:
          shouldSkipQueries,

        refetchOnMountOrArgChange:
          true,
      }
    );

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
  | Update Mutation
  |--------------------------------------------------------------------------
  */

  const [
    updateVariantPrice,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdateVariantPriceMutation();

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const variantPrice =
    variantPriceResponse
      ?.data ||
    null;

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
      if (
        !variantPriceId
      ) {
        throw new Error(
          "Variant price ID is missing."
        );
      }

      await updateVariantPrice({
        id:
          variantPriceId,

        body:
          values,
      }).unwrap();

      router.push(
        "/admin/variant-prices"
      );

      router.refresh();
    };

  const handleRetry =
    async () => {
      const requests = [
        refetchVariantPrice(),
        refetchPriceLists(),
        refetchProducts(),
      ];

      await Promise.allSettled(
        requests
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Page States
  |--------------------------------------------------------------------------
  */

  const isInitialLoading =
    !shouldSkipQueries &&
    (
      isLoadingVariantPrice ||
      isLoadingPriceLists ||
      isLoadingProducts
    );

  const isLookupFetching =
    isFetchingVariantPrice ||
    isFetchingPriceLists ||
    isFetchingProducts;

  const lookupError =
    variantPriceError ||
    priceListError ||
    productError;

  const lookupErrorMessage =
    lookupError
      ? getErrorMessage(
          lookupError
        )
      : null;

  const selectedProductId =
    variantPrice
      ?.variant
      ?.product
      ?.id ||
    variantPrice
      ?.variant
      ?.productId ||
    "";

  const selectedProductExists =
    !selectedProductId ||
    products.some(
      (
        product
      ) =>
        product.id ===
        selectedProductId
    );

  const selectedPriceListExists =
    !variantPrice ||
    priceLists.some(
      (
        priceList
      ) =>
        priceList.id ===
        variantPrice.priceListId
    );

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
              isUpdating
            }
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#6d7175] transition hover:text-[#202223] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft
              size={16}
            />

            Variant Pricing
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#202223]">
              Edit Variant
              Price
            </h1>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold text-[#6d7175]">
              <BadgeDollarSign
                size={14}
              />

              Edit Price
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Update the price,
            quantity tier,
            effective dates,
            priority or status
            for this product
            variant.
          </p>
        </div>
      </div>

      {/*
      ----------------------------------------------------------------------
      Authentication Initialization
      ----------------------------------------------------------------------
      */}

      {!initialized && (
        <PageLoadingState
          message="Initializing your session..."
        />
      )}

      {/*
      ----------------------------------------------------------------------
      Missing Authentication
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
              editing this
              variant price.
            </p>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Missing Route ID
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !variantPriceId && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-red-800">
              Invalid variant
              price
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              The variant
              price ID is
              missing from the
              page URL.
            </p>

            <button
              type="button"
              onClick={
                handleCancel
              }
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-red-700 px-3 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Return to Variant
              Pricing
            </button>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Lookup Error
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        variantPriceId &&
        lookupErrorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to
                  load the
                  variant
                  price
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
        variantPriceId &&
        !lookupError &&
        isInitialLoading && (
          <PageLoadingState />
        )}

      {/*
      ----------------------------------------------------------------------
      Record Missing
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        variantPriceId &&
        !lookupError &&
        !isInitialLoading &&
        !variantPrice && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              Variant price
              not found
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              This price may
              have been deleted
              or may no longer
              be available.
            </p>

            <button
              type="button"
              onClick={
                handleCancel
              }
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-amber-900 px-3 text-sm font-semibold text-white transition hover:bg-amber-950"
            >
              Return to Variant
              Pricing
            </button>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Related Product Missing
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !lookupError &&
        !isInitialLoading &&
        variantPrice &&
        !selectedProductExists && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              Related product
              is unavailable
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              The product
              attached to this
              price was not
              returned by the
              product list.
              Confirm that the
              product still
              exists and is
              accessible.
            </p>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Related Price List Missing
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !lookupError &&
        !isInitialLoading &&
        variantPrice &&
        !selectedPriceListExists && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-900">
              Related price
              list is
              unavailable
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              The price list
              attached to this
              record was not
              returned by the
              price-list query.
              Confirm that it
              still exists and
              is accessible.
            </p>
          </div>
        )}

      {/*
      ----------------------------------------------------------------------
      Edit Form
      ----------------------------------------------------------------------
      */}

      {initialized &&
        accessToken &&
        !lookupError &&
        !isInitialLoading &&
        variantPrice &&
        selectedProductExists &&
        selectedPriceListExists && (
          <VariantPriceForm
            key={
              variantPrice.id
            }
            mode="edit"
            initialValue={
              variantPrice
            }
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
              isUpdating
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