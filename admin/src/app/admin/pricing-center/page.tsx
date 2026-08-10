"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BadgePercent,
  Boxes,
  Calculator,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Grid3X3,
  PackageSearch,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";



import {
    useExecutePricingImportMutation,
    usePreviewPricingImportMutation,
  } from "@/store/api/pricingImportApi";

import PriceEditorDrawer from "./components/PriceEditorDrawer";

import {
  useGetProductByIdQuery,
  useGetProductsQuery,
} from "@/store/api/productApi";

import {
  useGetPriceMatrixQuery,
} from "@/store/api/pricingFacadeApi";

import type {
  PriceMatrixPrice,
  PriceMatrixPriceList,
  PriceMatrixVariant,
} from "@/types/priceMatrix";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type PricingCenterTab =
  | "PRICE_MATRIX"
  | "QUANTITY_TIERS"
  | "BULK_UPDATE"
  | "CSV_IMPORT"
  | "PRICE_RESOLVER";

interface PricingCenterTabConfig {
  id:
    PricingCenterTab;

  label:
    string;

  description:
    string;

  icon:
    React.ComponentType<{
      size?:
        number;

      className?:
        string;
    }>;

  enabled:
    boolean;
}

/*
|--------------------------------------------------------------------------
| Tab Configuration
|--------------------------------------------------------------------------
*/

const PRICING_CENTER_TABS:
  PricingCenterTabConfig[] =
  [
    {
      id:
        "PRICE_MATRIX",

      label:
        "Price Matrix",

      description:
        "View variant prices across multiple price lists.",

      icon:
        Grid3X3,

      enabled:
        true,
    },

    {
      id:
        "QUANTITY_TIERS",

      label:
        "Quantity Tiers",

      description:
        "Manage volume and quantity-based pricing.",

      icon:
        Boxes,

      enabled:
        true,
    },

    {
      id:
        "BULK_UPDATE",

      label:
        "Bulk Update",

      description:
        "Update prices for many variants at once.",

      icon:
        BadgePercent,

      enabled:
        true,
    },

    {
      id:
        "CSV_IMPORT",

      label:
        "CSV Import",

      description:
        "Import and validate pricing from a spreadsheet.",

      icon:
        Upload,

      enabled:
        true,
    },

    {
      id:
        "PRICE_RESOLVER",

      label:
        "Price Resolver",

      description:
        "Test which pricing rule will be selected.",

      icon:
        Calculator,

      enabled:
        true,
    },
  ];

/*
|--------------------------------------------------------------------------
| Placeholder Panel
|--------------------------------------------------------------------------
*/

interface PlaceholderPanelProps {
  title:
    string;

  description:
    string;

  icon:
    React.ComponentType<{
      size?:
        number;

      className?:
        string;
    }>;

  children?:
    React.ReactNode;
}

function PlaceholderPanel({
  title,
  description,
  icon:
    Icon,
  children,
}: PlaceholderPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-[#e1e3e5] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f2f3] text-[#6d7175]">
              <Icon
                size={
                  18
                }
              />
            </div>

            <h2 className="text-base font-semibold text-[#202223]">
              {title}
            </h2>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            {
              description
            }
          </p>
        </div>
      </header>

      <div className="p-5">
        {children || (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#c9cccf] bg-[#fafafa] px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Icon
                size={
                  24
                }
                className="text-[#6d7175]"
              />
            </div>

            <h3 className="mt-5 text-base font-semibold text-[#202223]">
              {
                title
              }{" "}
              is ready for
              integration
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-[#6d7175]">
              The Pricing
              Center shell is
              complete. We
              will connect
              this workspace
              to the pricing
              backend in the
              next step.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}



/*
|--------------------------------------------------------------------------
| Price Matrix Helpers
|--------------------------------------------------------------------------
*/

const formatMoney = (
    value: number,
    currencyCode?: string | null
  ) => {
    const currency =
      currencyCode || "AED";
  
    try {
      return new Intl.NumberFormat(
        "en-US",
        {
          style:
            "currency",
  
          currency,
  
          minimumFractionDigits:
            2,
  
          maximumFractionDigits:
            2,
        }
      ).format(
        Number(value || 0)
      );
    } catch {
      return `${currency} ${Number(
        value || 0
      ).toFixed(2)}`;
    }
  };
  

  type PriceVisualState =
    | "MISSING"
    | "ACTIVE"
    | "DISCOUNTED"
    | "FUTURE"
    | "EXPIRED"
    | "INACTIVE";

  interface PriceStatePresentation {
    state: PriceVisualState;
    label: string;
    buttonClassName: string;
    badgeClassName: string;
    amountClassName: string;
    helperText?: string;
  }

  const getPriceRecord = (
    price: PriceMatrixPrice
  ) =>
    price as unknown as Record<
      string,
      unknown
    >;

  const getStringValue = (
    record: Record<string, unknown>,
    keys: string[]
  ) => {
    for (const key of keys) {
      const value = record[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }
    }

    return null;
  };

  const getBooleanValue = (
    record: Record<string, unknown>,
    keys: string[]
  ) => {
    for (const key of keys) {
      const value = record[key];

      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const normalized =
          value.trim().toUpperCase();

        if (
          ["TRUE", "YES", "Y", "1"].includes(
            normalized
          )
        ) {
          return true;
        }

        if (
          ["FALSE", "NO", "N", "0"].includes(
            normalized
          )
        ) {
          return false;
        }
      }

      if (typeof value === "number") {
        return value !== 0;
      }
    }

    return null;
  };

  const parsePriceDate = (
    value: string | null
  ) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const formatPriceDate = (
    date: Date
  ) =>
    new Intl.DateTimeFormat(
      "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);

  const getNumberValue = (
    record: Record<string, unknown>,
    keys: string[]
  ) => {
    for (const key of keys) {
      const value = record[key];

      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        return value;
      }

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        const parsed = Number(value);

        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  };

  interface PriceCardMetadata {
    priority: number | null;
    minimumQuantity: number | null;
    maximumQuantity: number | null;
    customerGroup: string | null;
    validFrom: Date | null;
    validTo: Date | null;
  }

  const getPriceCardMetadata = (
    price: PriceMatrixPrice
  ): PriceCardMetadata => {
    const record = getPriceRecord(price);

    return {
      priority:
        getNumberValue(
          record,
          [
            "priority",
            "pricingPriority",
            "rulePriority",
          ]
        ),

      minimumQuantity:
        getNumberValue(
          record,
          [
            "minimumQuantity",
            "minQuantity",
            "quantityFrom",
            "minQty",
          ]
        ),

      maximumQuantity:
        getNumberValue(
          record,
          [
            "maximumQuantity",
            "maxQuantity",
            "quantityTo",
            "maxQty",
          ]
        ),

      customerGroup:
        getStringValue(
          record,
          [
            "customerGroupName",
            "customerGroup",
            "segmentName",
            "segment",
          ]
        ),

      validFrom:
        parsePriceDate(
          getStringValue(
            record,
            [
              "validFrom",
              "startDate",
              "effectiveFrom",
              "effectiveDate",
              "startsAt",
            ]
          )
        ),

      validTo:
        parsePriceDate(
          getStringValue(
            record,
            [
              "validTo",
              "endDate",
              "effectiveTo",
              "expiryDate",
              "expiresAt",
            ]
          )
        ),
    };
  };

  const getDiscountPercentage = (
    price: PriceMatrixPrice
  ) => {
    const regularPrice =
      Number(price.regularPrice || 0);

    const sellingPrice =
      Number(price.sellingPrice || 0);

    if (
      regularPrice <= 0 ||
      sellingPrice >= regularPrice
    ) {
      return null;
    }

    return Math.round(
      ((regularPrice - sellingPrice) /
        regularPrice) *
        100
    );
  };

  const getPriceStatePresentation = (
    price: PriceMatrixPrice | null
  ): PriceStatePresentation => {
    if (!price) {
      return {
        state: "MISSING",
        label: "Missing",
        buttonClassName:
          "border-dashed border-[#c9cccf] bg-[#fafafa] hover:border-[#8c9196] hover:bg-white",
        badgeClassName:
          "bg-[#f1f2f3] text-[#6d7175]",
        amountClassName:
          "text-[#8c9196]",
      };
    }

    const record = getPriceRecord(price);

    const status =
      (
        getStringValue(
          record,
          [
            "status",
            "priceStatus",
            "recordStatus",
          ]
        ) || ""
      ).toUpperCase();

    const isActive =
      getBooleanValue(
        record,
        [
          "isActive",
          "active",
          "enabled",
        ]
      );

    const startsAt =
      parsePriceDate(
        getStringValue(
          record,
          [
            "validFrom",
            "startDate",
            "effectiveFrom",
            "effectiveDate",
            "startsAt",
          ]
        )
      );

    const endsAt =
      parsePriceDate(
        getStringValue(
          record,
          [
            "validTo",
            "endDate",
            "effectiveTo",
            "expiryDate",
            "expiresAt",
          ]
        )
      );

    const now = new Date();

    if (
      isActive === false ||
      ["INACTIVE", "DISABLED", "ARCHIVED"].includes(
        status
      )
    ) {
      return {
        state: "INACTIVE",
        label: "Inactive",
        buttonClassName:
          "border-red-200 bg-red-50/70 hover:border-red-300 hover:bg-red-50",
        badgeClassName:
          "bg-red-100 text-red-800",
        amountClassName:
          "text-red-900",
        helperText:
          "Not available for pricing",
      };
    }

    if (
      startsAt &&
      startsAt.getTime() > now.getTime()
    ) {
      return {
        state: "FUTURE",
        label: "Future",
        buttonClassName:
          "border-blue-200 bg-blue-50/70 hover:border-blue-300 hover:bg-blue-50",
        badgeClassName:
          "bg-blue-100 text-blue-800",
        amountClassName:
          "text-blue-950",
        helperText:
          `Starts ${formatPriceDate(startsAt)}`,
      };
    }

    if (
      endsAt &&
      endsAt.getTime() < now.getTime()
    ) {
      return {
        state: "EXPIRED",
        label: "Expired",
        buttonClassName:
          "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100",
        badgeClassName:
          "bg-slate-200 text-slate-700",
        amountClassName:
          "text-slate-600",
        helperText:
          `Ended ${formatPriceDate(endsAt)}`,
      };
    }

    if (
      getDiscountPercentage(price) !==
      null
    ) {
      return {
        state: "DISCOUNTED",
        label: "Discount",
        buttonClassName:
          "border-amber-200 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50",
        badgeClassName:
          "bg-amber-100 text-amber-800",
        amountClassName:
          "text-amber-950",
      };
    }

    return {
      state: "ACTIVE",
      label: "Active",
      buttonClassName:
        "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50",
      badgeClassName:
        "bg-green-100 text-green-800",
      amountClassName:
        "text-[#202223]",
    };
  };

  const getApiErrorMessage = (
    error: unknown
  ) => {
    if (
      !error ||
      typeof error !==
        "object"
    ) {
      return "An unexpected error occurred.";
    }
  
    const errorRecord =
      error as {
        data?: unknown;
        error?: string;
        message?: string;
      };
  
    const data =
      errorRecord.data;
  
    if (
      typeof data ===
      "string"
    ) {
      return data;
    }
  
    if (
      data &&
      typeof data ===
        "object"
    ) {
      const dataRecord =
        data as {
          message?: unknown;
          error?: unknown;
          code?: unknown;
        };
  
      if (
        typeof dataRecord.message ===
        "string"
      ) {
        return dataRecord.message;
      }
  
      if (
        typeof dataRecord.error ===
        "string"
      ) {
        return dataRecord.error;
      }
  
      if (
        dataRecord.error &&
        typeof dataRecord.error ===
          "object"
      ) {
        const nestedError =
          dataRecord.error as {
            message?: unknown;
            code?: unknown;
          };
  
        if (
          typeof nestedError.message ===
          "string"
        ) {
          return nestedError.message;
        }
  
        if (
          typeof nestedError.code ===
          "string"
        ) {
          return nestedError.code;
        }
      }
  
      if (
        typeof dataRecord.code ===
        "string"
      ) {
        return dataRecord.code;
      }
    }
  
    if (
      typeof errorRecord.message ===
      "string"
    ) {
      return errorRecord.message;
    }
  
    if (
      typeof errorRecord.error ===
      "string"
    ) {
      return errorRecord.error;
    }
  
    return "An unexpected error occurred.";
  };


  interface SelectedPriceCell {
    variant:
      PriceMatrixVariant;
  
    priceList:
      PriceMatrixPriceList;
  
    price:
      PriceMatrixPrice |
      null;
  }


  interface ActiveMatrixCell {
    rowIndex:
      number;

    columnIndex:
      number;

    variantId:
      string;

    priceListId:
      string;
  }

/*
|--------------------------------------------------------------------------
| Price Matrix Preview
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Live Price Matrix
|--------------------------------------------------------------------------
*/

interface PriceMatrixPreviewProps {
    refreshSignal:
      number;
  }
  
  function PriceMatrixPreview({
    refreshSignal,
  }: PriceMatrixPreviewProps) {
    const [
      selectedProductId,
      setSelectedProductId,
    ] =
      useState("");
    
      const [
        selectedPriceCell,
        setSelectedPriceCell,
      ] =
        useState<
          SelectedPriceCell |
          null
        >(null);

    const [
      activeCell,
      setActiveCell,
    ] =
      useState<
        ActiveMatrixCell |
        null
      >(null);
  
    const [
      productSearch,
      setProductSearch,
    ] =
      useState("");
  
    const deferredProductSearch =
      useDeferredValue(
        productSearch
      );


      const openPriceEditor =
  (
    variant:
      PriceMatrixVariant,

    priceList:
      PriceMatrixPriceList,

    price:
      PriceMatrixPrice |
      null
  ) => {
    setSelectedPriceCell({
      variant,
      priceList,
      price,
    });
  };

  const selectMatrixCell = (
    rowIndex:
      number,

    columnIndex:
      number,

    variant:
      PriceMatrixVariant,

    priceList:
      PriceMatrixPriceList
  ) => {
    setActiveCell({
      rowIndex,
      columnIndex,
      variantId:
        variant.id,
      priceListId:
        priceList.id,
    });
  };

const closePriceEditor =
  () => {
    setSelectedPriceCell(
      null
    );
  };

const handlePriceSaved =
  async () => {
    await refetchMatrix();
  };
  
    /*
    |--------------------------------------------------------------------------
    | Products
    |--------------------------------------------------------------------------
    */
  
    const {
      data:
        productResponse,
  
      isLoading:
        productsLoading,
  
      isFetching:
        productsFetching,
  
      isError:
        productsError,
    } =
      useGetProductsQuery({
        page:
          1,
  
        pageSize:
          50,
  
          search:
          selectedProductId
            ? undefined
            : deferredProductSearch ||
              undefined,
  
        status:
          "ACTIVE",
  
        sortBy:
          "name",
  
        sortDirection:
          "ASC",
      });
  
    const products =
      productResponse?.data ||
      [];

    const {
      data:
        selectedProductResponse,

      isFetching:
        selectedProductFetching,

      isError:
        selectedProductError,
    } =
      useGetProductByIdQuery(
        selectedProductId,
        {
          skip:
            !selectedProductId,
        }
      );

    const selectedProduct =
      selectedProductResponse
        ?.data ||
      null;
  
    /*
    |--------------------------------------------------------------------------
    | Price Matrix
    |--------------------------------------------------------------------------
    */
  
    const {
      data:
        matrixResponse,
  
      error:
        matrixError,
  
      isLoading:
        matrixLoading,
  
      isFetching:
        matrixFetching,
  
      isError:
        matrixHasError,
  
      refetch:
        refetchMatrix,
    } =
      useGetPriceMatrixQuery(
        {
          productId:
            selectedProductId,
  
          quantity:
            1,
  
          includeInactive:
            false,
        },
        {
          skip:
            !selectedProductId,
        }
      );
  
    const matrix =
      matrixResponse?.data;

    const matrixMetrics =
      useMemo(
        () => {
          const variantCount =
            Number(
              matrix?.summary
                ?.variantCount ??
                matrix?.rows
                  ?.length ??
                0
            );

          const priceListCount =
            Number(
              matrix?.summary
                ?.priceListCount ??
                matrix?.priceLists
                  ?.length ??
                0
            );

          const totalCellCount =
            Number(
              matrix?.summary
                ?.totalCellCount ??
                variantCount *
                  priceListCount
            );

          const populatedCellCount =
            Number(
              matrix?.summary
                ?.populatedCellCount ??
                matrix?.rows
                  ?.reduce(
                    (
                      total,
                      row
                    ) =>
                      total +
                      matrix.priceLists.reduce(
                        (
                          rowTotal,
                          priceList
                        ) =>
                          rowTotal +
                          (
                            row.prices[
                              priceList.id
                            ]
                              ? 1
                              : 0
                          ),
                        0
                      ),
                    0
                  ) ??
                0
            );

          const emptyCellCount =
            Math.max(
              0,
              Number(
                matrix?.summary
                  ?.emptyCellCount ??
                  totalCellCount -
                    populatedCellCount
              )
            );

          const coveragePercent =
            totalCellCount >
            0
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    (
                      populatedCellCount /
                      totalCellCount
                    ) *
                      100
                  )
                )
              : 0;

          return {
            variantCount,
            priceListCount,
            totalCellCount,
            populatedCellCount,
            emptyCellCount,
            coveragePercent,
          };
        },
        [
          matrix,
        ]
      );
  

    const activeCellDetails =
      useMemo(
        () => {
          if (
            !matrix ||
            !activeCell
          ) {
            return null;
          }

          const row =
            matrix.rows[
              activeCell
                .rowIndex
            ];

          const priceList =
            matrix.priceLists[
              activeCell
                .columnIndex
            ];

          if (
            !row ||
            !priceList ||
            row.variant.id !==
              activeCell
                .variantId ||
            priceList.id !==
              activeCell
                .priceListId
          ) {
            return null;
          }

          const price =
            row.prices[
              priceList.id
            ] ||
            null;

          return {
            row,
            priceList,
            price,
            state:
              getPriceStatePresentation(
                price
              ),
          };
        },
        [
          matrix,
          activeCell,
        ]
      );

    /*
    |--------------------------------------------------------------------------
    | Refresh From Page Header
    |--------------------------------------------------------------------------
    */
  
    useEffect(() => {
      if (
        selectedProductId &&
        refreshSignal >
          0
      ) {
        void refetchMatrix();
      }
    }, [
      refreshSignal,
      selectedProductId,
      refetchMatrix,
    ]);
  
    /*
    |--------------------------------------------------------------------------
    | Product Selection
    |--------------------------------------------------------------------------
    */
  
    const handleProductChange = (
      productId: string
    ) => {
      setSelectedProductId(
        productId
      );

      setSelectedPriceCell(
        null
      );

      setActiveCell(
        null
      );
    };
  
    const isLoadingMatrix =
      matrixLoading ||
      matrixFetching;
  
    return (
      <>
        <PlaceholderPanel
        title="Price Matrix"
        description="Select a product and compare the current selling price of each variant across all applicable price lists."
        icon={
          Grid3X3
        }
      >
        <div className="space-y-5">
          {/*
          --------------------------------------------------------------------
          Product Selector
          --------------------------------------------------------------------
          */}
  
          <div className="rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,1fr)_minmax(320px,2fr)]">
              <div>
                <label
                  htmlFor="price-matrix-product-search"
                  className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]"
                >
                  Search products
                </label>
  
                <div className="relative mt-2">
                  <Search
                    size={
                      16
                    }
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                  />
  
                  <input
                    id="price-matrix-product-search"
                    type="search"
                    value={
                      productSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setProductSearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Search by product name or SKU..."
                    className={[
                      "h-10 w-full rounded-lg border border-[#babfc3] bg-white",
                      "pl-10 pr-3 text-sm text-[#202223]",
                      "outline-none transition",
                      "placeholder:text-[#8c9196]",
                      "focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",
                    ].join(
                      " "
                    )}
                  />
                </div>
              </div>
  
              <div>
                <label
                  htmlFor="price-matrix-product"
                  className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]"
                >
                  Product
                </label>
  
                <select
                  id="price-matrix-product"
                  value={
                    selectedProductId
                  }
                  disabled={
                    productsLoading
                  }
                  onChange={(
                    event
                  ) =>
                    handleProductChange(
                      event
                        .target
                        .value
                    )
                  }
                  className={[
                    "mt-2 h-10 w-full rounded-lg border border-[#babfc3]",
                    "bg-white px-3 text-sm text-[#202223]",
                    "outline-none transition",
                    "focus:border-[#303030] focus:ring-2 focus:ring-[#303030]/10",
                    "disabled:cursor-not-allowed disabled:bg-[#f1f2f3] disabled:text-[#8c9196]",
                  ].join(
                    " "
                  )}
                >
                  <option value="">
                    {productsLoading
                      ? "Loading products..."
                      : "Select a product"}
                  </option>
  
                  {products.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {
                          product.name
                        }
  
                        {product.parentSku
                          ? ` — ${product.parentSku}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
  
                {productsFetching &&
                  !productsLoading && (
                    <p className="mt-1 text-xs text-[#6d7175]">
                      Updating product
                      results...
                    </p>
                  )}
  
                {productsError && (
                  <p className="mt-1 text-xs text-red-700">
                    Products could
                    not be loaded.
                  </p>
                )}
              </div>
            </div>
          </div>
  
          {selectedProductId &&
            selectedProductFetching && (
              <p className="text-xs text-[#6d7175]">
                Loading selected product details...
              </p>
            )}

          {selectedProductId &&
            selectedProductError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-800">
                  Selected product details could not be loaded.
                </p>
              </div>
            )}

          {/*
          --------------------------------------------------------------------
          No Product Selected
          --------------------------------------------------------------------
          */}
  
          {!selectedProductId && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#c9cccf] bg-[#fafafa] px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <PackageSearch
                  size={
                    25
                  }
                  className="text-[#6d7175]"
                />
              </div>
  
              <h3 className="mt-5 text-base font-semibold text-[#202223]">
                Select a product
              </h3>
  
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#6d7175]">
                Choose an active
                product to display
                its variants and
                prices across all
                applicable price
                lists.
              </p>
            </div>
          )}
  
          {/*
          --------------------------------------------------------------------
          Loading
          --------------------------------------------------------------------
          */}
  
          {selectedProductId &&
            isLoadingMatrix &&
            !matrix && (
              <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
                <div className="border-b border-[#e1e3e5] bg-[#f6f6f7] px-4 py-4">
                  <div className="h-5 w-56 animate-pulse rounded bg-[#e1e3e5]" />
                </div>
  
                {[
                  1,
                  2,
                  3,
                  4,
                ].map(
                  (row) => (
                    <div
                      key={
                        row
                      }
                      className="flex items-center gap-5 border-b border-[#f1f2f3] px-4 py-4 last:border-b-0"
                    >
                      <div className="h-10 w-64 animate-pulse rounded bg-[#f1f2f3]" />
  
                      <div className="ml-auto h-10 w-32 animate-pulse rounded bg-[#f1f2f3]" />
  
                      <div className="h-10 w-32 animate-pulse rounded bg-[#f1f2f3]" />
  
                      <div className="h-10 w-32 animate-pulse rounded bg-[#f1f2f3]" />
                    </div>
                  )
                )}
              </div>
            )}
  
          {/*
          --------------------------------------------------------------------
          Error
          --------------------------------------------------------------------
          */}
  
          {selectedProductId &&
            matrixHasError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={
                      20
                    }
                    className="mt-0.5 shrink-0 text-red-700"
                  />
  
                  <div>
                    <h3 className="text-sm font-semibold text-red-900">
                      Price matrix
                      could not be
                      loaded
                    </h3>
  
                    <p className="mt-1 text-sm leading-6 text-red-800">
                      {
                        getApiErrorMessage(
                          matrixError
                        )
                      }
                    </p>
  
                    <button
                      type="button"
                      onClick={() =>
                        void refetchMatrix()
                      }
                      className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-semibold text-red-800 hover:bg-red-100"
                    >
                      <RefreshCw
                        size={
                          15
                        }
                      />
  
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
  
          {/*
          --------------------------------------------------------------------
          Matrix Header and Summary
          --------------------------------------------------------------------
          */}
  
          {matrix &&
            !matrixHasError && (
              <>
                <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
                  <div className="flex flex-col gap-4 border-b border-[#e1e3e5] p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[#202223]">
                          {
                            matrix
                              .product
                              .name
                          }
                        </h3>

                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                          {
                            matrix
                              .product
                              .status
                          }
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#6d7175]">
                        Pricing completeness
                        across all variants
                        and active price lists.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f6f6f7] px-3 py-1.5">
                      <CheckCircle2
                        size={
                          15
                        }
                        className={
                          matrixMetrics
                            .coveragePercent ===
                          100
                            ? "text-green-700"
                            : "text-[#6d7175]"
                        }
                      />

                      <span className="text-xs font-semibold text-[#202223]">
                        {matrixMetrics
                          .coveragePercent
                          .toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits:
                                0,
                              maximumFractionDigits:
                                1,
                            }
                          )}
                        % coverage
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-[#e1e3e5] sm:grid-cols-3 xl:grid-cols-5">
                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Variants
                      </p>

                      <p className="mt-2 text-2xl font-bold tabular-nums text-[#202223]">
                        {
                          matrixMetrics
                            .variantCount
                        }
                      </p>
                    </div>

                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Price lists
                      </p>

                      <p className="mt-2 text-2xl font-bold tabular-nums text-[#202223]">
                        {
                          matrixMetrics
                            .priceListCount
                        }
                      </p>
                    </div>

                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Configured
                      </p>

                      <p className="mt-2 text-2xl font-bold tabular-nums text-green-700">
                        {
                          matrixMetrics
                            .populatedCellCount
                        }
                      </p>
                    </div>

                    <div className="bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Missing
                      </p>

                      <p className="mt-2 text-2xl font-bold tabular-nums text-amber-700">
                        {
                          matrixMetrics
                            .emptyCellCount
                        }
                      </p>
                    </div>

                    <div className="col-span-2 bg-white p-4 sm:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Coverage
                      </p>

                      <p className="mt-2 text-2xl font-bold tabular-nums text-[#202223]">
                        {matrixMetrics
                          .coveragePercent
                          .toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits:
                                0,
                              maximumFractionDigits:
                                1,
                            }
                          )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#e1e3e5] p-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[#202223]">
                        Price coverage
                      </p>

                      <p className="text-xs tabular-nums text-[#6d7175]">
                        {
                          matrixMetrics
                            .populatedCellCount
                        }
                        {" / "}
                        {
                          matrixMetrics
                            .totalCellCount
                        }{" "}
                        cells configured
                      </p>
                    </div>

                    <div
                      role="progressbar"
                      aria-label="Price matrix coverage"
                      aria-valuemin={
                        0
                      }
                      aria-valuemax={
                        100
                      }
                      aria-valuenow={
                        Math.round(
                          matrixMetrics
                            .coveragePercent
                        )
                      }
                      className="h-2.5 overflow-hidden rounded-full bg-[#e4e5e7]"
                    >
                      <div
                        className={[
                          "h-full rounded-full transition-all duration-300",
                          matrixMetrics
                            .coveragePercent ===
                          100
                            ? "bg-green-600"
                            : matrixMetrics
                                  .coveragePercent >=
                                75
                              ? "bg-blue-600"
                              : matrixMetrics
                                    .coveragePercent >=
                                  40
                                ? "bg-amber-500"
                                : "bg-red-500",
                        ].join(
                          " "
                        )}
                        style={{
                          width:
                            `${matrixMetrics.coveragePercent}%`,
                        }}
                      />
                    </div>

                    {matrixMetrics
                      .totalCellCount ===
                      0 && (
                      <p className="mt-2 text-xs text-[#6d7175]">
                        Coverage will
                        appear after the
                        product has both
                        variants and
                        active price
                        lists.
                      </p>
                    )}

                    {matrixMetrics
                      .totalCellCount >
                      0 &&
                      matrixMetrics
                        .emptyCellCount >
                        0 && (
                        <p className="mt-2 text-xs text-[#6d7175]">
                          Add prices to
                          the missing
                          cells below to
                          improve
                          coverage.
                        </p>
                      )}

                    {matrixMetrics
                      .totalCellCount >
                      0 &&
                      matrixMetrics
                        .emptyCellCount ===
                        0 && (
                        <p className="mt-2 text-xs font-medium text-green-700">
                          Every variant
                          has a price in
                          every displayed
                          price list.
                        </p>
                      )}
                  </div>
                </div>

                {/*
                ----------------------------------------------------------------
                Matrix Table
                ----------------------------------------------------------------
                */}
  
                <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
                  <div className="overflow-x-auto">
                    <table className="min-w-max table-auto text-left">
                      <thead className="bg-[#f6f6f7]">
                        <tr className="border-b border-[#e1e3e5]">
                          <th className="sticky left-0 z-20 min-w-[280px] bg-[#f6f6f7] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                            Variant
                          </th>
  
                          {matrix.priceLists.map(
                            (
                              priceList
                            ) => (
                              <th
                                key={
                                  priceList.id
                                }
                                className="min-w-[180px] px-4 py-3 text-right"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#202223]">
                                  {
                                    priceList.name
                                  }
                                </p>
  
                                <p className="mt-1 text-[11px] font-medium text-[#8c9196]">
                                  {
                                    priceList.currencyCode
                                  }
  
                                  {" · "}
  
                                  {
                                    priceList.channelCode
                                  }
                                </p>
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
  
                      <tbody>
                        {matrix.rows.map(
                          (
                            row,
                            rowIndex
                          ) => (
                            <tr
                              key={
                                row
                                  .variant
                                  .id
                              }
                              className="border-b border-[#f1f2f3] last:border-b-0 hover:bg-[#fafafa]"
                            >
                              <td className="sticky left-0 z-10 bg-white px-4 py-4">
                                <p className="text-sm font-semibold text-[#202223]">
                                  {
                                    row
                                      .variant
                                      .name
                                  }
                                </p>
  
                                <p className="mt-1 font-mono text-xs text-[#6d7175]">
                                  {
                                    row
                                      .variant
                                      .sku
                                  }
                                </p>
                              </td>
  
                              {matrix.priceLists.map(
                                (
                                  priceList,
                                  columnIndex
                                ) => {
                                  const price =
                                    row
                                      .prices[
                                      priceList
                                        .id
                                    ];

                                  const priceState =
                                    getPriceStatePresentation(
                                      price
                                    );

                                  const discountPercentage =
                                    price
                                      ? getDiscountPercentage(
                                          price
                                        )
                                      : null;

                                  const priceMetadata =
                                    price
                                      ? getPriceCardMetadata(
                                          price
                                        )
                                      : null;

                                  const isActiveCell =
                                    activeCell
                                      ?.rowIndex ===
                                      rowIndex &&
                                    activeCell
                                      ?.columnIndex ===
                                      columnIndex;
  
                                  return (
                                    <td
                                      key={
                                        `${row.variant.id}-${priceList.id}`
                                      }
                                      className="px-2 py-2 text-right"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          selectMatrixCell(
                                            rowIndex,
                                            columnIndex,
                                            row.variant,
                                            priceList
                                          );

                                          openPriceEditor(
                                            row.variant,
                                            priceList,
                                            price
                                          );
                                        }}
                                        aria-label={
                                          price
                                            ? `${priceState.label} price for ${row.variant.name} in ${priceList.name}`
                                            : `Add price for ${row.variant.name} in ${priceList.name}`
                                        }
                                        aria-pressed={
                                          isActiveCell
                                        }
                                        data-matrix-row={
                                          rowIndex
                                        }
                                        data-matrix-column={
                                          columnIndex
                                        }
                                        className={[
                                          "group ml-auto flex min-h-[190px] w-full min-w-[210px]",
                                          "items-stretch rounded-xl border px-3 py-3",
                                          "text-right transition hover:shadow-sm",
                                          "focus:outline-none focus:ring-2 focus:ring-[#303030]/15",
                                          priceState
                                            .buttonClassName,
                                          isActiveCell
                                            ? "relative z-[1] ring-2 ring-[#303030] ring-offset-2 shadow-md"
                                            : "",
                                        ].join(
                                          " "
                                        )}
                                      >
                                        {price ? (
                                          <div className="flex w-full flex-col">
                                            {isActiveCell && (
                                              <div className="mb-2 flex items-center justify-between rounded-lg bg-[#303030] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                                <span>
                                                  Selected
                                                </span>

                                                <span>
                                                  R
                                                  {
                                                    rowIndex +
                                                    1
                                                  }
                                                  {" · "}
                                                  C
                                                  {
                                                    columnIndex +
                                                    1
                                                  }
                                                </span>
                                              </div>
                                            )}

                                            <div className="flex w-full items-center justify-between gap-2">
                                              <span
                                                className={[
                                                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                                  priceState
                                                    .badgeClassName,
                                                ].join(
                                                  " "
                                                )}
                                              >
                                                {
                                                  priceState
                                                    .label
                                                }
                                              </span>

                                              {discountPercentage !==
                                                null && (
                                                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 shadow-sm">
                                                  -
                                                  {
                                                    discountPercentage
                                                  }
                                                  %
                                                </span>
                                              )}
                                            </div>

                                            <div className="mt-3 text-right">
                                              <p
                                                className={[
                                                  "text-base font-bold tabular-nums",
                                                  priceState
                                                    .amountClassName,
                                                ].join(
                                                  " "
                                                )}
                                              >
                                                {formatMoney(
                                                  price.sellingPrice,
                                                  priceList.currencyCode
                                                )}
                                              </p>

                                              {Number(
                                                price.regularPrice
                                              ) >
                                                Number(
                                                  price.sellingPrice
                                                ) && (
                                                <p className="mt-0.5 text-xs tabular-nums text-[#8c9196] line-through">
                                                  {formatMoney(
                                                    price.regularPrice,
                                                    priceList.currencyCode
                                                  )}
                                                </p>
                                              )}
                                            </div>

                                            <div className="mt-3 space-y-1 border-t border-black/5 pt-2 text-[11px]">
                                              <div className="flex items-center justify-between gap-3">
                                                <span className="text-[#8c9196]">
                                                  Price list
                                                </span>

                                                <span className="max-w-[110px] truncate font-semibold text-[#303030]">
                                                  {
                                                    priceList.name
                                                  }
                                                </span>
                                              </div>

                                              <div className="flex items-center justify-between gap-3">
                                                <span className="text-[#8c9196]">
                                                  Channel
                                                </span>

                                                <span className="font-semibold text-[#303030]">
                                                  {
                                                    priceList.channelCode
                                                  }
                                                </span>
                                              </div>

                                              {priceMetadata
                                                ?.customerGroup && (
                                                <div className="flex items-center justify-between gap-3">
                                                  <span className="text-[#8c9196]">
                                                    Customer
                                                  </span>

                                                  <span className="max-w-[110px] truncate font-semibold text-[#303030]">
                                                    {
                                                      priceMetadata
                                                        .customerGroup
                                                    }
                                                  </span>
                                                </div>
                                              )}

                                              {priceMetadata
                                                ?.priority !==
                                                null &&
                                                priceMetadata
                                                  ?.priority !==
                                                  undefined && (
                                                  <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[#8c9196]">
                                                      Priority
                                                    </span>

                                                    <span className="font-semibold tabular-nums text-[#303030]">
                                                      {
                                                        priceMetadata
                                                          .priority
                                                      }
                                                    </span>
                                                  </div>
                                                )}

                                              {(priceMetadata
                                                ?.minimumQuantity !==
                                                null ||
                                                priceMetadata
                                                  ?.maximumQuantity !==
                                                  null) && (
                                                <div className="flex items-center justify-between gap-3">
                                                  <span className="text-[#8c9196]">
                                                    Quantity
                                                  </span>

                                                  <span className="font-semibold tabular-nums text-[#303030]">
                                                    {
                                                      priceMetadata
                                                        ?.minimumQuantity ??
                                                      1
                                                    }
                                                    {" – "}
                                                    {
                                                      priceMetadata
                                                        ?.maximumQuantity ??
                                                      "∞"
                                                    }
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            {priceState
                                              .helperText && (
                                              <p className="mt-2 text-right text-[11px] font-semibold text-[#6d7175]">
                                                {
                                                  priceState
                                                    .helperText
                                                }
                                              </p>
                                            )}

                                            <span className="mt-2 hidden items-center justify-end gap-1 border-t border-black/5 pt-2 text-[11px] font-semibold text-[#6d7175] group-hover:flex">
                                              <Pencil
                                                size={
                                                  11
                                                }
                                              />

                                              Edit Price
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="relative flex w-full flex-col items-center justify-center gap-2 text-[#8c9196] transition group-hover:text-[#202223]">
                                            {isActiveCell && (
                                              <span className="absolute left-0 top-0 rounded-full bg-[#303030] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                                Selected
                                              </span>
                                            )}

                                            <span className="rounded-full bg-white p-1.5 shadow-sm">
                                              <Plus
                                                size={
                                                  16
                                                }
                                              />
                                            </span>

                                            <span className="text-sm font-semibold">
                                              Add Price
                                            </span>

                                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#8c9196]">
                                              No pricing configured
                                            </span>

                                            <span className="mt-1 text-[11px] font-medium text-[#8c9196]">
                                              {
                                                priceList.name
                                              }
                                              {" · "}
                                              {
                                                priceList.channelCode
                                              }
                                            </span>
                                          </div>
                                        )}
                                      </button>
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
  
                  {matrix.rows.length ===
                    0 && (
                    <div className="px-6 py-12 text-center">
                      <PackageSearch
                        size={
                          26
                        }
                        className="mx-auto text-[#8c9196]"
                      />
  
                      <p className="mt-3 text-sm font-semibold text-[#202223]">
                        No variants
                        found
                      </p>
  
                      <p className="mt-1 text-sm text-[#6d7175]">
                        This product
                        does not have
                        any active
                        variants.
                      </p>
                    </div>
                  )}
                </div>
  
                {activeCellDetails && (
                  <div className="overflow-hidden rounded-xl border border-[#d2d5d8] bg-white shadow-sm">
                    <div className="flex flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c9196]">
                            Selected cell
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#202223]">
                            {
                              activeCellDetails
                                .row
                                .variant
                                .name
                            }
                          </p>

                          <p className="mt-0.5 font-mono text-xs text-[#6d7175]">
                            {
                              activeCellDetails
                                .row
                                .variant
                                .sku
                            }
                          </p>
                        </div>

                        <div className="hidden h-10 w-px bg-[#e1e3e5] sm:block" />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c9196]">
                            Price list
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#202223]">
                            {
                              activeCellDetails
                                .priceList
                                .name
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-[#6d7175]">
                            {
                              activeCellDetails
                                .priceList
                                .currencyCode
                            }
                            {" · "}
                            {
                              activeCellDetails
                                .priceList
                                .channelCode
                            }
                          </p>
                        </div>

                        <div className="hidden h-10 w-px bg-[#e1e3e5] sm:block" />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c9196]">
                            State
                          </p>

                          <span
                            className={[
                              "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              activeCellDetails
                                .state
                                .badgeClassName,
                            ].join(
                              " "
                            )}
                          >
                            {
                              activeCellDetails
                                .state
                                .label
                            }
                          </span>
                        </div>

                        <div className="hidden h-10 w-px bg-[#e1e3e5] sm:block" />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c9196]">
                            Position
                          </p>

                          <p className="mt-1 text-sm font-semibold tabular-nums text-[#202223]">
                            Row{" "}
                            {
                              (
                                activeCell
                                  ?.rowIndex ??
                                0
                              ) +
                              1
                            }
                            {" · "}
                            Column{" "}
                            {
                              (
                                activeCell
                                  ?.columnIndex ??
                                0
                              ) +
                              1
                            }
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#f6f6f7] px-3 py-2 text-xs font-medium text-[#6d7175]">
                        This selection
                        will be used by
                        keyboard
                        navigation.
                      </div>
                    </div>
                  </div>
                )}

                {matrixFetching && (
                  <p className="text-right text-xs text-[#6d7175]">
                    Refreshing matrix...
                  </p>
                )}
              </>
            )}
        </div>
        </PlaceholderPanel>

        <PriceEditorDrawer
          open={
            Boolean(
              selectedPriceCell
            )
          }
          product={
            selectedProduct
          }
          variant={
            selectedPriceCell
              ?.variant ||
            null
          }
          priceList={
            selectedPriceCell
              ?.priceList ||
            null
          }
          price={
            selectedPriceCell
              ?.price ||
            null
          }
          onClose={
            closePriceEditor
          }
          onSaved={
            handlePriceSaved
          }
        />
      </>
    );
  }


/*
|--------------------------------------------------------------------------
| CSV Import Workspace
|--------------------------------------------------------------------------
*/

type CsvImportStage =
  | "EMPTY"
  | "FILE_SELECTED"
  | "VALIDATED"
  | "READY";

type CsvValidationStatus =
  | "VALID"
  | "WARNING"
  | "ERROR";

type CsvValidationFilter =
  | "ALL"
  | CsvValidationStatus;

interface CsvImportFileInfo {
  name:
    string;

  size:
    number;
}

interface CsvPricingRow {
  rowNumber:
    number;

  productSku:
    string;

  variantSku:
    string;

  priceListCode:
    string;

  currencyCode:
    string;

  sellingPrice:
    string;

  regularPrice:
    string;

  priority:
    string;

  validFrom:
    string;

  validTo:
    string;

  status:
    string;

  minimumQuantity:
    string;

  maximumQuantity:
    string;

    compareAtPrice: string;
}

interface CsvValidationResult {
  row:
    CsvPricingRow;

  status:
    CsvValidationStatus;

  action:
    "CREATE_OR_UPDATE" |
    "SKIP";

  messages:
    string[];
}

const formatFileSize = (
  bytes:
    number
) => {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes /
    1024;

  if (
    kilobytes <
    1024
  ) {
    return `${kilobytes.toFixed(
      1
    )} KB`;
  }

  return `${(
    kilobytes /
    1024
  ).toFixed(
    1
  )} MB`;
};


const normalizeCsvHeader = (
  value:
    string
) =>
  value
    .trim()
    .replace(
      /^\uFEFF/,
      ""
    )
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );

const splitCsvLine = (
  line:
    string
) => {
  const values:
    string[] =
    [];

  let current =
    "";

  let insideQuotes =
    false;

  for (
    let index =
      0;
    index <
    line.length;
    index +=
      1
  ) {
    const character =
      line[
        index
      ];

    if (
      character ===
      '"'
  ) {
      if (
        insideQuotes &&
        line[
          index +
            1
        ] ===
          '"'
      ) {
        current +=
          '"';

        index +=
          1;
      } else {
        insideQuotes =
          !insideQuotes;
      }

      continue;
    }

    if (
      character ===
        "," &&
      !insideQuotes
    ) {
      values.push(
        current.trim()
      );

      current =
        "";

      continue;
    }

    current +=
      character;
  }

  values.push(
    current.trim()
  );

  return values;
};

const parseCsvText = (
  csvText:
    string
) => {
  const lines =
    csvText
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      )
      .split(
        "\n"
      )
      .filter(
        (
          line
        ) =>
          line.trim()
      );

  if (
    lines.length ===
    0
  ) {
    return {
      rows:
        [] as CsvPricingRow[],

      error:
        "The CSV file is empty.",
    };
  }

  const headerValues =
    splitCsvLine(
      lines[
        0
      ]
    );

  const headerIndex =
    new Map<
      string,
      number
    >();

  headerValues.forEach(
    (
      header,
      index
    ) => {
      headerIndex.set(
        normalizeCsvHeader(
          header
        ),
        index
      );
    }
  );

  const getValue = (
    values:
      string[],

    aliases:
      string[]
  ) => {
    for (
      const alias of
      aliases
    ) {
      const index =
        headerIndex.get(
          normalizeCsvHeader(
            alias
          )
        );

      if (
        index !==
        undefined
      ) {
        return (
          values[
            index
          ] ||
          ""
        ).trim();
      }
    }

    return "";
  };

  const rows =
    lines
      .slice(
        1
      )
      .map(
        (
          line,
          index
        ) => {
          const values =
            splitCsvLine(
              line
            );

          return {
            rowNumber:
              index +
              2,

            productSku:
              getValue(
                values,
                [
                  "productSku",
                  "product sku",
                ]
              ),

            variantSku:
              getValue(
                values,
                [
                  "variantSku",
                  "variant sku",
                  "sku",
                ]
              ),

            priceListCode:
              getValue(
                values,
                [
                  "priceListCode",
                  "price list code",
                  "priceList",
                  "price list",
                ]
              ),

            currencyCode:
              getValue(
                values,
                [
                  "currencyCode",
                  "currency code",
                  "currency",
                ]
              ),

            sellingPrice:
              getValue(
                values,
                [
                  "sellingPrice",
                  "selling price",
                  "price",
                ]
              ),

            regularPrice:
              getValue(
                values,
                [
                  "regularPrice",
                  "regular price",
                ]
              ),

              compareAtPrice:
    getValue(
        values,
        [
            "compareAtPrice",
            "compare at price",
            "compare_at_price",
        ]
    ),

            priority:
              getValue(
                values,
                [
                  "priority",
                ]
              ),

            validFrom:
              getValue(
                values,
                [
                  "validFrom",
                  "valid from",
                ]
              ),

            validTo:
              getValue(
                values,
                [
                  "validTo",
                  "valid to",
                ]
              ),

            status:
              getValue(
                values,
                [
                  "status",
                ]
              ),

            minimumQuantity:
              getValue(
                values,
                [
                  "minimumQuantity",
                  "minimum quantity",
                  "minQty",
                ]
              ),

            maximumQuantity:
              getValue(
                values,
                [
                  "maximumQuantity",
                  "maximum quantity",
                  "maxQty",
                ]
              ),


          };
        }
      );

  return {
    rows,
    error:
      null as string |
      null,
  };
};

const isValidIsoDate = (
  value:
    string
) => {
  if (
    !value
  ) {
    return true;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  return !Number.isNaN(
    date.getTime()
  );
};

const validateCsvRows = (
  rows:
    CsvPricingRow[]
) => {
  const duplicateKeys =
    new Set<
      string
    >();

  return rows.map(
    (
      row
    ): CsvValidationResult => {
      const errors:
        string[] =
        [];

      const warnings:
        string[] =
        [];

      if (
        !row.variantSku
      ) {
        errors.push(
          "Variant SKU is required."
        );
      }

      if (
        !row.priceListCode
      ) {
        errors.push(
          "Price list code is required."
        );
      }

      if (
        !row.sellingPrice
      ) {
        errors.push(
          "Selling price is required."
        );
      } else {
        const sellingPrice =
          Number(
            row.sellingPrice
          );

        if (
          !Number.isFinite(
            sellingPrice
          )
        ) {
          errors.push(
            "Selling price must be numeric."
          );
        } else if (
          sellingPrice <
          0
        ) {
          errors.push(
            "Selling price cannot be negative."
          );
        }
      }

      if (
        row.regularPrice
      ) {
        const regularPrice =
          Number(
            row.regularPrice
          );

        const sellingPrice =
          Number(
            row.sellingPrice
          );

        if (
          !Number.isFinite(
            regularPrice
          )
        ) {
          errors.push(
            "Regular price must be numeric."
          );
        } else if (
          regularPrice <
          0
        ) {
          errors.push(
            "Regular price cannot be negative."
          );
        } else if (
          Number.isFinite(
            sellingPrice
          ) &&
          regularPrice <
          sellingPrice
        ) {
          warnings.push(
            "Regular price is lower than selling price."
          );
        } else if (
          Number.isFinite(
            sellingPrice
          ) &&
          regularPrice ===
          sellingPrice
        ) {
          warnings.push(
            "Regular price equals selling price."
          );
        }
      }

      const normalizedCurrency =
        row.currencyCode
          .trim()
          .toUpperCase();

      if (
        normalizedCurrency &&
        !/^[A-Z]{3}$/.test(
          normalizedCurrency
        )
      ) {
        errors.push(
          "Currency code must contain three letters."
        );
      }

      if (
        !isValidIsoDate(
          row.validFrom
        )
      ) {
        errors.push(
          "Valid From must use YYYY-MM-DD."
        );
      }

      if (
        !isValidIsoDate(
          row.validTo
        )
      ) {
        errors.push(
          "Valid To must use YYYY-MM-DD."
        );
      }

      if (
        isValidIsoDate(
          row.validFrom
        ) &&
        isValidIsoDate(
          row.validTo
        ) &&
        row.validFrom &&
        row.validTo &&
        row.validTo <
        row.validFrom
      ) {
        errors.push(
          "Valid To cannot be earlier than Valid From."
        );
      }

      if (
        row.priority &&
        (
          !Number.isInteger(
            Number(
              row.priority
            )
          ) ||
          Number(
            row.priority
          ) <
          0
        )
      ) {
        errors.push(
          "Priority must be a non-negative whole number."
        );
      }

      const minimumQuantity =
        row.minimumQuantity
          ? Number(
              row.minimumQuantity
            )
          : null;

      const maximumQuantity =
        row.maximumQuantity
          ? Number(
              row.maximumQuantity
            )
          : null;

      if (
        minimumQuantity !==
          null &&
        (
          !Number.isInteger(
            minimumQuantity
          ) ||
          minimumQuantity <
          1
        )
      ) {
        errors.push(
          "Minimum quantity must be a positive whole number."
        );
      }

      if (
        maximumQuantity !==
          null &&
        (
          !Number.isInteger(
            maximumQuantity
          ) ||
          maximumQuantity <
          1
        )
      ) {
        errors.push(
          "Maximum quantity must be a positive whole number."
        );
      }

      if (
        minimumQuantity !==
          null &&
        maximumQuantity !==
          null &&
        maximumQuantity <
        minimumQuantity
      ) {
        errors.push(
          "Maximum quantity cannot be lower than minimum quantity."
        );
      }

      const status =
        row.status
          .trim()
          .toUpperCase();

      if (
        status &&
        ![
          "ACTIVE",
          "INACTIVE",
        ].includes(
          status
        )
      ) {
        errors.push(
          "Status must be ACTIVE or INACTIVE."
        );
      }

      const duplicateKey =
        `${row.variantSku.trim().toUpperCase()}::${row.priceListCode.trim().toUpperCase()}::${row.minimumQuantity || "1"}::${row.maximumQuantity || ""}`;

      if (
        row.variantSku &&
        row.priceListCode
      ) {
        if (
          duplicateKeys.has(
            duplicateKey
          )
        ) {
          errors.push(
            "Duplicate variant and price-list row."
          );
        } else {
          duplicateKeys.add(
            duplicateKey
          );
        }
      }

      if (
        !row.productSku
      ) {
        warnings.push(
          "Product SKU is empty; the backend will resolve by variant SKU."
        );
      }

      const statusValue:
        CsvValidationStatus =
        errors.length >
        0
          ? "ERROR"
          : warnings.length >
              0
            ? "WARNING"
            : "VALID";

      return {
        row,

        status:
          statusValue,

        action:
          errors.length >
          0
            ? "SKIP"
            : "CREATE_OR_UPDATE",

        messages:
          [
            ...errors,
            ...warnings,
          ],
      };
    }
  );
};

function CsvImportWorkspace() {
  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<
      CsvImportFileInfo |
      null
    >(null);

  const [
    isDragging,
    setIsDragging,
  ] =
    useState(
      false
    );


    const [
        previewPricingImport,
        {
            isLoading: previewLoading,
        },
    ] = usePreviewPricingImportMutation();
    
    const [
        previewResult,
        setPreviewResult,
    ] = useState<any>(null);

  
    const [
        executePricingImport,
        {
          isLoading:
            importing,
        },
      ] =
        useExecutePricingImportMutation();
      
      const [
        importResult,
        setImportResult,
      ] =
        useState<any>(
          null
        );


  const [
    validationResults,
    setValidationResults,
  ] =
    useState<
      CsvValidationResult[]
    >([]);

  const [
    validationFilter,
    setValidationFilter,
  ] =
    useState<
      CsvValidationFilter
    >(
      "ALL"
    );

  const [
    fileError,
    setFileError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const validationSummary =
    useMemo(
      () => {
        const valid =
          validationResults.filter(
            (
              result
            ) =>
              result.status ===
              "VALID"
          ).length;

        const warnings =
          validationResults.filter(
            (
              result
            ) =>
              result.status ===
              "WARNING"
          ).length;

        const errors =
          validationResults.filter(
            (
              result
            ) =>
              result.status ===
              "ERROR"
          ).length;

        return {
          rows:
            validationResults.length,

          valid,

          warnings,

          errors,
        };
      },
      [
        validationResults,
      ]
    );

  const filteredValidationResults =
    useMemo(
      () =>
        validationFilter ===
          "ALL"
          ? validationResults
          : validationResults.filter(
              (
                result
              ) =>
                result.status ===
                validationFilter
            ),
      [
        validationResults,
        validationFilter,
      ]
    );

  const stage:
    CsvImportStage =
    validationResults.length >
      0
      ? validationSummary.errors ===
        0
        ? "READY"
        : "VALIDATED"
      : selectedFile
        ? "FILE_SELECTED"
        : "EMPTY";

  const downloadBlankTemplate =
    () => {
      const columns = [
        "productSku",
        "variantSku",
        "priceListCode",
        "currencyCode",
        "sellingPrice",
        "regularPrice",
        "priority",
        "validFrom",
        "validTo",
        "status",
        "minimumQuantity",
        "maximumQuantity",
      ];

      const example = [
        "IPHONE-16",
        "IPHONE-16-BLK-128",
        "RETAIL",
        "AED",
        "4999.00",
        "5299.00",
        "100",
        "2026-08-01",
        "2026-12-31",
        "ACTIVE",
        "1",
        "",
      ];

      const csv =
        [
          columns.join(
            ","
          ),
          example.join(
            ","
          ),
        ].join(
          "\n"
        );

      const blob =
        new Blob(
          [
            csv,
          ],
          {
            type:
              "text/csv;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        "pricing-import-template.csv";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url
      );
    };

  const acceptFile = async (
    file:
      File |
      undefined
  ) => {
    if (
      !file
    ) {
      return;
    }

    const isCsv =
      file.type ===
        "text/csv" ||
      file.name
        .toLowerCase()
        .endsWith(
          ".csv"
        );

    if (
      !isCsv
    ) {
      setFileError(
        "Please select a CSV file."
      );

      setSelectedFile(
        null
      );

      setValidationResults(
        []
      );

      return;
    }

    try {
      const csvText =
        await file.text();

      const parsed =
        parseCsvText(
          csvText
        );

      if (
        parsed.error
      ) {
        setFileError(
          parsed.error
        );

        setSelectedFile(
          null
        );

        setValidationResults(
          []
        );

        return;
      }

      const results =
        validateCsvRows(
          parsed.rows
        );

      setSelectedFile({
        name:
          file.name,

        size:
          file.size,
      });

      setValidationResults(
        results
      );

      setValidationFilter(
        "ALL"
      );

      setFileError(
        null
      );
    } catch {
      setFileError(
        "The CSV file could not be read."
      );

      setSelectedFile(
        null
      );

      setValidationResults(
        []
      );
    }
  };

  const handlePreview = async () => {

    try {

        const rows =
            validationResults
                .filter(
                    x => x.status !== "ERROR"
                )
                .map(
                    x => x.row
                );

        const response =
            await previewPricingImport({
                rows,
            }).unwrap();

        console.log(response);

        setPreviewResult(
            response.data
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to generate preview."
        );

    }

};


const handleImport =
  async () => {
    if (
      !previewResult ||
      previewResult.summary
        .changeCount <=
        0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Apply ${previewResult.summary.changeCount} pricing change(s)?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const rows =
        validationResults
          .filter(
            (
              result
            ) =>
              result.status !==
              "ERROR"
          )
          .map(
            (
              result
            ) =>
              result.row
          );

      const response =
        await executePricingImport({
          rows,
        }).unwrap();

      setImportResult(
        response.data
      );

      window.alert(
        [
          "Pricing import completed successfully.",
          `Created: ${response.data.summary.created}`,
          `Updated: ${response.data.summary.updated}`,
          `Deactivated: ${response.data.summary.deactivated}`,
          `Unchanged: ${response.data.summary.unchanged}`,
          `Skipped: ${response.data.summary.skipped}`,
        ].join(
          "\n"
        )
      );

      const refreshedPreview =
        await previewPricingImport({
          rows,
        }).unwrap();

      setPreviewResult(
        refreshedPreview.data
      );
    } catch (
      error
    ) {
      console.error(
        "Pricing import error:",
        error
      );

      window.alert(
        getApiErrorMessage(
          error
        )
      );
    }
  };

  return (
    <PlaceholderPanel
      title="CSV Import"
      description="Export pricing, update it in Excel and import the CSV back through a guided validation workflow."
      icon={
        FileSpreadsheet
      }
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
          <header className="border-b border-[#e1e3e5] bg-[#fafafa] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#303030] shadow-sm">
                <Download
                  size={
                    18
                  }
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#202223]">
                  Export or
                  download a
                  template
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#6d7175]">
                  Start with a
                  blank template
                  or export
                  existing prices
                  before making
                  changes in
                  Excel.
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={
                downloadBlankTemplate
              }
              className="rounded-xl border border-[#babfc3] bg-white p-4 text-left transition hover:border-[#303030] hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <FileSpreadsheet
                  size={
                    18
                  }
                  className="text-[#6d7175]"
                />

                <Download
                  size={
                    15
                  }
                  className="text-[#8c9196]"
                />
              </div>

              <p className="mt-4 text-sm font-semibold text-[#202223]">
                Blank Template
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Download the
                standard CSV
                columns with one
                example row.
              </p>
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4 text-left opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <FileSpreadsheet
                  size={
                    18
                  }
                  className="text-[#8c9196]"
                />

                <span className="rounded-full bg-[#e4e5e7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6d7175]">
                  Next
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-[#202223]">
                Current Product
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Export all
                pricing rows for
                one selected
                product.
              </p>
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4 text-left opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <FileSpreadsheet
                  size={
                    18
                  }
                  className="text-[#8c9196]"
                />

                <span className="rounded-full bg-[#e4e5e7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6d7175]">
                  Next
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-[#202223]">
                Price List
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Export prices
                belonging to one
                price list.
              </p>
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4 text-left opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <FileSpreadsheet
                  size={
                    18
                  }
                  className="text-[#8c9196]"
                />

                <span className="rounded-full bg-[#e4e5e7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6d7175]">
                  Later
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-[#202223]">
                All Prices
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Export the full
                pricing catalogue
                for offline
                editing.
              </p>
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
          <header className="border-b border-[#e1e3e5] bg-[#fafafa] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#303030] shadow-sm">
                <FileUp
                  size={
                    18
                  }
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#202223]">
                  Upload pricing
                  CSV
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#6d7175]">
                  Choose the file
                  edited in Excel.
                  No price changes
                  are saved during
                  this step.
                </p>
              </div>
            </div>
          </header>

          <div className="p-4">
            <label
              onDragEnter={(
                event
              ) => {
                event.preventDefault();

                setIsDragging(
                  true
                );
              }}
              onDragOver={(
                event
              ) => {
                event.preventDefault();

                setIsDragging(
                  true
                );
              }}
              onDragLeave={(
                event
              ) => {
                event.preventDefault();

                setIsDragging(
                  false
                );
              }}
              onDrop={(
                event
              ) => {
                event.preventDefault();

                setIsDragging(
                  false
                );

                void acceptFile(
                  event
                    .dataTransfer
                    .files[
                    0
                  ]
                );
              }}
              className={[
                "flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition",
                isDragging
                  ? "border-[#303030] bg-[#f6f6f7]"
                  : "border-[#c9cccf] bg-[#fafafa] hover:border-[#8c9196] hover:bg-white",
              ].join(
                " "
              )}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(
                  event
                ) =>
                  void acceptFile(
                    event
                      .target
                      .files?.[
                      0
                    ]
                  )
                }
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Upload
                  size={
                    24
                  }
                  className="text-[#6d7175]"
                />
              </div>

              <h4 className="mt-4 text-base font-semibold text-[#202223]">
                Drag and drop a
                CSV file here
              </h4>

              <p className="mt-2 text-sm text-[#6d7175]">
                or click to browse
                from your computer
              </p>

              <span className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] shadow-sm">
                Browse CSV
              </span>

              <p className="mt-3 text-xs text-[#8c9196]">
                CSV files only
              </p>
            </label>

            {fileError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={
                      17
                    }
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <p className="text-sm font-medium text-red-800">
                    {
                      fileError
                    }
                  </p>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-green-700 shadow-sm">
                    <FileSpreadsheet
                      size={
                        18
                      }
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-green-950">
                      {
                        selectedFile
                          .name
                      }
                    </p>

                    <p className="mt-0.5 text-xs text-green-800">
                      {formatFileSize(
                        selectedFile
                          .size
                      )}
                      {" · "}
                      Ready for
                      validation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(
                      null
                    );

                    setValidationResults(
                      []
                    );

                    setFileError(
                      null
                    );

                    setValidationFilter(
                      "ALL"
                    );
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-green-300 bg-white px-3 text-sm font-semibold text-green-800 hover:bg-green-100"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
          <header className="border-b border-[#e1e3e5] bg-[#fafafa] px-5 py-4">
            <h3 className="text-sm font-semibold text-[#202223]">
              Import workflow
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              The file is parsed
              and checked in the
              browser before any
              pricing data is sent
              to the backend.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-px bg-[#e1e3e5] md:grid-cols-4">
            {[
              {
                number:
                  "1",

                title:
                  "Upload",

                description:
                  "Select the pricing CSV.",

                active:
                  Boolean(
                    selectedFile
                  ),
              },

              {
                number:
                  "2",

                title:
                  "Validate",

                description:
                  "Check row values and formats.",

                active:
                  validationResults.length >
                  0,
              },

              {
                number:
                  "3",

                title:
                  "Preview",

                description:
                  "Review creates and updates.",

                active:
                  stage ===
                  "READY",
              },

              {
                number:
                  "4",

                title:
                  "Import",

                description:
                  "Apply approved changes.",

                active:
                  false,
              },
            ].map(
              (
                step
              ) => (
                <div
                  key={
                    step.number
                  }
                  className={[
                    "bg-white p-4",
                    step.active
                      ? ""
                      : "opacity-55",
                  ].join(
                    " "
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        step.active
                          ? "bg-[#303030] text-white"
                          : "bg-[#e4e5e7] text-[#6d7175]",
                      ].join(
                        " "
                      )}
                    >
                      {
                        step.number
                      }
                    </span>

                    <p className="text-sm font-semibold text-[#202223]">
                      {
                        step.title
                      }
                    </p>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#6d7175]">
                    {
                      step.description
                    }
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {validationResults.length >
          0 && (
          <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
            <header className="flex flex-col gap-4 border-b border-[#e1e3e5] bg-[#fafafa] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#202223]">
                  Validation
                  results
                </h3>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Review every
                  row before
                  continuing to
                  preview.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    id:
                      "ALL" as const,

                    label:
                      "All",

                    count:
                      validationSummary
                        .rows,
                  },

                  {
                    id:
                      "VALID" as const,

                    label:
                      "Valid",

                    count:
                      validationSummary
                        .valid,
                  },

                  {
                    id:
                      "WARNING" as const,

                    label:
                      "Warnings",

                    count:
                      validationSummary
                        .warnings,
                  },

                  {
                    id:
                      "ERROR" as const,

                    label:
                      "Errors",

                    count:
                      validationSummary
                        .errors,
                  },
                ].map(
                  (
                    filter
                  ) => (
                    <button
                      key={
                        filter.id
                      }
                      type="button"
                      onClick={() =>
                        setValidationFilter(
                          filter.id
                        )
                      }
                      className={[
                        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                        validationFilter ===
                        filter.id
                          ? "border-[#303030] bg-[#303030] text-white"
                          : "border-[#babfc3] bg-white text-[#303030] hover:bg-[#f6f6f7]",
                      ].join(
                        " "
                      )}
                    >
                      {
                        filter.label
                      }

                      <span
                        className={[
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          validationFilter ===
                          filter.id
                            ? "bg-white/15 text-white"
                            : "bg-[#f1f2f3] text-[#6d7175]",
                        ].join(
                          " "
                        )}
                      >
                        {
                          filter.count
                        }
                      </span>
                    </button>
                  )
                )}
              </div>
            </header>

            <div className="grid grid-cols-2 gap-px bg-[#e1e3e5] sm:grid-cols-4">
              <div className="bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                  Rows
                </p>

                <p className="mt-2 text-2xl font-bold tabular-nums text-[#202223]">
                  {
                    validationSummary
                      .rows
                  }
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                  Valid
                </p>

                <p className="mt-2 text-2xl font-bold tabular-nums text-green-700">
                  {
                    validationSummary
                      .valid
                  }
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                  Warnings
                </p>

                <p className="mt-2 text-2xl font-bold tabular-nums text-amber-700">
                  {
                    validationSummary
                      .warnings
                  }
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                  Errors
                </p>

                <p className="mt-2 text-2xl font-bold tabular-nums text-red-700">
                  {
                    validationSummary
                      .errors
                  }
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-[#e1e3e5]">
              <table className="min-w-full text-left">
                <thead className="bg-[#f6f6f7]">
                  <tr className="border-b border-[#e1e3e5]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Row
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Status
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Variant SKU
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Price List
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Selling Price
                    </th>

                    <th className="min-w-[320px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Validation Message
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredValidationResults.map(
                    (
                      result
                    ) => {
                      const statusClassName =
                        result.status ===
                        "VALID"
                          ? "bg-green-100 text-green-800"
                          : result.status ===
                              "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800";

                      return (
                        <tr
                          key={
                            `${result.row.rowNumber}-${result.row.variantSku}-${result.row.priceListCode}`
                          }
                          className="border-b border-[#f1f2f3] last:border-b-0"
                        >
                          <td className="px-4 py-3 text-sm font-semibold tabular-nums text-[#202223]">
                            {
                              result
                                .row
                                .rowNumber
                            }
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                statusClassName,
                              ].join(
                                " "
                              )}
                            >
                              {
                                result
                                  .status
                              }
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono text-xs text-[#303030]">
                            {
                              result
                                .row
                                .variantSku ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 text-sm text-[#303030]">
                            {
                              result
                                .row
                                .priceListCode ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-[#202223]">
                            {
                              result
                                .row
                                .sellingPrice ||
                              "—"
                            }
                          </td>

                          <td className="px-4 py-3 text-sm leading-6 text-[#6d7175]">
                            {result
                              .messages
                              .length >
                            0
                              ? result.messages.join(
                                  " "
                                )
                              : "Row is valid."}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {filteredValidationResults.length ===
                0 && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-[#202223]">
                    No rows match
                    this filter.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#e1e3e5] bg-[#fafafa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {validationSummary
                  .errors >
                  0 ? (
                  <p className="text-sm font-semibold text-red-800">
                    Fix the
                    validation
                    errors before
                    continuing.
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-green-800">
                    Validation
                    passed. The
                    file is ready
                    for preview.
                  </p>
                )}

                <p className="mt-1 text-xs text-[#6d7175]">
                  Backend
                  validation will
                  run again before
                  import.
                </p>
              </div>

              <button
    type="button"
    onClick={handlePreview}
    disabled={
        validationSummary.errors > 0 ||
        previewLoading
    }
    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-40"
>
    {previewLoading
        ? "Generating Preview..."
        : "Continue to Preview"}
</button>

            </div>

            <pre>

</pre>
          </section>
        )}

{
previewResult && (

<section className="rounded-xl border border-[#e1e3e5] bg-white mt-5">

<div className="border-b p-4">

<h3 className="text-lg font-bold">

Backend Preview

</h3>

</div>

<div className="grid grid-cols-5 gap-4 p-4">

<div>

<div className="text-xs text-gray-500">

Create

</div>

<div className="text-2xl font-bold text-green-700">

{previewResult.summary.create}

</div>

</div>

<div>

<div className="text-xs text-gray-500">

Update

</div>

<div className="text-2xl font-bold text-amber-700">

{previewResult.summary.update}

</div>

</div>

<div>

<div className="text-xs text-gray-500">

No Change

</div>

<div className="text-2xl font-bold">

{previewResult.summary.no_change}

</div>

</div>

<div>

<div className="text-xs text-gray-500">

Deactivate

</div>

<div className="text-2xl font-bold text-red-700">

{previewResult.summary.deactivate}

</div>

</div>

<div>

<div className="text-xs text-gray-500">

Skip

</div>

<div className="text-2xl font-bold">

{previewResult.summary.skip}

</div>

</div>

</div>

<div className="overflow-auto">

<table className="min-w-full">

<thead>

<tr>

<th>Row</th>

<th>SKU</th>

<th>Action</th>

<th>Changed Fields</th>

</tr>

</thead>

<tbody>

{previewResult.rows.map((row:any)=>(

<tr key={row.rowNumber}>

<td>{row.rowNumber}</td>

<td>{row.variant?.sku}</td>

<td>{row.action}</td>

<td>{row.changedFields.join(", ")}</td>

</tr>

))}

</tbody>

</table>

</div>

</section>

)}



      </div>

      <div className="p-4 border-t border-[#e1e3e5] flex justify-end">
      <button
  type="button"
  onClick={
    handleImport
  }
  disabled={
    importing ||
    !previewResult ||
    previewResult.summary
      .changeCount <=
      0
  }
  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-40"
>
  {importing
    ? "Importing..."
    : `Import ${previewResult?.summary?.changeCount || 0} Record${
        previewResult?.summary?.changeCount ===
        1
          ? ""
          : "s"
      }`}
</button>
</div>
    </PlaceholderPanel>
  );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function PricingCenterPage() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<PricingCenterTab>(
      "PRICE_MATRIX"
    );

    const [
        refreshing,
        setRefreshing,
      ] =
        useState(false);
      
      const [
        refreshSignal,
        setRefreshSignal,
      ] =
        useState(0);

  const activeTabConfig =
    useMemo(
      () =>
        PRICING_CENTER_TABS.find(
          (
            tab
          ) =>
            tab.id ===
            activeTab
        ) ||
        PRICING_CENTER_TABS[0],
      [
        activeTab,
      ]
    );

    const handleRefresh =
    async () => {
      setRefreshing(
        true
      );
  
      setRefreshSignal(
        (current) =>
          current + 1
      );
  
      window.setTimeout(
        () => {
          setRefreshing(
            false
          );
        },
        500
      );
    };

  const renderActiveTab =
    () => {
      switch (
        activeTab
      ) {
        case "PRICE_MATRIX":
            return (
                <PriceMatrixPreview
                refreshSignal={
                    refreshSignal
                }
                />
            );

        case "QUANTITY_TIERS":
          return (
            <PlaceholderPanel
              title="Quantity Tiers"
              description="View and maintain quantity-based pricing ranges for product variants."
              icon={
                Boxes
              }
            />
          );

        case "BULK_UPDATE":
          return (
            <PlaceholderPanel
              title="Bulk Update"
              description="Increase, decrease, copy or round prices across many variants and price lists."
              icon={
                BadgePercent
              }
            />
          );

        case "CSV_IMPORT":
          return (
            <CsvImportWorkspace />
          );

        case "PRICE_RESOLVER":
          return (
            <PlaceholderPanel
              title="Price Resolver"
              description="Test the pricing engine using a variant, quantity, date, channel and currency."
              icon={
                Calculator
              }
            />
          );

        default:
          return null;
      }
    };

  return (
    <div className="space-y-5">
      {/*
      ----------------------------------------------------------------------
      Page Header
      ----------------------------------------------------------------------
      */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#202223]">
              Pricing Center
            </h1>

            <span className="inline-flex rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold text-[#6d7175]">
              Pricing
              Workspace
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Manage price
            matrices,
            quantity tiers,
            bulk changes,
            imports and
            pricing-rule
            resolution from
            one central
            workspace.
          </p>
        </div>

        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={
            handleRefresh
          }
          className={[
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg",
            "border border-[#babfc3] bg-white px-4",
            "text-sm font-semibold text-[#202223]",
            "transition hover:bg-[#f6f6f7]",
            "focus:outline-none focus:ring-2 focus:ring-[#303030]/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          <RefreshCw
            size={
              16
            }
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/*
      ----------------------------------------------------------------------
      Workspace Navigation
      ----------------------------------------------------------------------
      */}

      <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white shadow-sm">
        <header className="border-b border-[#e1e3e5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#202223]">
            Pricing
            Operations
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#6d7175]">
            Choose a pricing
            tool to continue.
          </p>
        </header>

        <div className="p-3">
          <div
            role="tablist"
            aria-label="Pricing Center tools"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5"
          >
            {PRICING_CENTER_TABS.map(
              (
                tab
              ) => {
                const Icon =
                  tab.icon;

                const isActive =
                  activeTab ===
                  tab.id;

                return (
                  <button
                    key={
                      tab.id
                    }
                    type="button"
                    role="tab"
                    aria-selected={
                      isActive
                    }
                    disabled={
                      !tab.enabled
                    }
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={[
                      "group flex min-h-[92px] items-start gap-3 rounded-xl border p-3 text-left transition",

                      isActive
                        ? "border-[#303030] bg-[#f6f6f7] shadow-sm"
                        : "border-transparent bg-white hover:border-[#d2d5d8] hover:bg-[#fafafa]",

                      !tab.enabled
                        ? "cursor-not-allowed opacity-50"
                        : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",

                        isActive
                          ? "bg-[#303030] text-white"
                          : "bg-[#f1f2f3] text-[#6d7175] group-hover:text-[#202223]",
                      ].join(" ")}
                    >
                      <Icon
                        size={
                          17
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={[
                          "text-sm font-semibold",

                          isActive
                            ? "text-[#202223]"
                            : "text-[#303030]",
                        ].join(" ")}
                      >
                        {
                          tab.label
                        }
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                        {
                          tab.description
                        }
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/*
      ----------------------------------------------------------------------
      Active Workspace
      ----------------------------------------------------------------------
      */}

      <div
        role="tabpanel"
        aria-label={
          activeTabConfig.label
        }
      >
        {renderActiveTab()}
      </div>
    </div>
  );
}