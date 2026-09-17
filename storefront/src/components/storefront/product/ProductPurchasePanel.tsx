"use client";

import Link from "next/link";

import {
  AlertCircle,
  CalendarDays,
  Check,
  Gift,
  Heart,
  Info,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProductGallery from "./ProductGallery";
import BundlePromotionSelector from "./BundlePromotionSelector";
import TabbyPromo from "@/components/storefront/tabby/TabbyPromo";
import TamaraWidget from "@/components/storefront/tamara/TamaraWidget";



import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  addItem,
  setItemExtendedWarranty,
} from "@/store/slices/cartSlice";

import type {
  CartItem,
} from "@/store/slices/cartSlice";

import type {
  CartBundleSelection,
} from "@/types/bundlePromotion";

import {
  makeSelectIsProductWishlisted,
  toggleWishlistItem,
} from "@/store/slices/wishlistSlice";

import {
  addRecentlyViewed,
} from "@/store/slices/recentlyViewedSlice";

import type {
  PublicProductData,
  PublicProductImage,
  PublicProductVariant,
} from "@/types/publicProduct";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

import {
  useProductDeliveryEligibility,
} from "@/hooks/useProductDeliveryEligibility";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

type ProtectionSchemeType =
  | "EXTENDED_WARRANTY"
  | "DAMAGE_PROTECTION";

type ProtectionPricingMethod =
  | "PERCENTAGE"
  | "FIXED";

type ProtectionPricingSource =
  | "PRODUCT"
  | "BRAND"
  | "CATEGORY"
  | "DEFAULT";

interface ProtectionPlan {
  schemeId: string;

  assignmentId:
    | string
    | null;

  code: string;

  name: string;

  description:
    | string
    | null;

  schemeType:
    ProtectionSchemeType;

  durationMonths:
    | number
    | null;

  coverageStartMode:
    | string
    | null;

  pricingMethod:
    ProtectionPricingMethod;

  percentage:
    | number
    | null;

  fixedAmount:
    | number
    | null;

  productUnitPrice: number;

  unitPrice: number;

  currencyCode: string;

  pricingSource:
    ProtectionPricingSource;

  termsAndConditions:
    | string
    | null;

  sortOrder: number;
}

interface ProtectionResolverData {
  eligible: boolean;

  reason:
    | string
    | null;

  message: string;

  pricing?: {
    sellingPrice:
      | number
      | null;

    currencyCode: string;

    minimumEligibleProductAmount?:
      number;
  };

  plans: ProtectionPlan[];
}

interface ProtectionApiResponse {
  success: boolean;

  data?:
    ProtectionResolverData;

  error?: {
    code?: string;

    message?: string;

    details?: unknown[];
  };
}

const getProtectionTypeLabel = (
  schemeType:
    ProtectionSchemeType
) =>
  schemeType ===
  "DAMAGE_PROTECTION"
    ? "Damage Protection"
    : "Extended Warranty";

const getProtectionDurationLabel = (
  durationMonths:
    | number
    | null
) => {
  if (!durationMonths) {
    return null;
  }

  if (
    durationMonths % 12 ===
    0
  ) {
    const years =
      durationMonths / 12;

    return `${years} ${
      years === 1
        ? "Year"
        : "Years"
    }`;
  }

  return `${durationMonths} Months`;
};

const getImageUrl = (
  image:
    | PublicProductImage
    | undefined
) => {
  const asset =
    image?.mediaAsset;

  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "MEDIUM" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "SMALL" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.isPrimary &&
        variant.publicUrl
    );

  return (
    preferred?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

const variantMatches = (
  variant:
    PublicProductVariant,
  selections:
    Record<string, string>
) =>
  Object.entries(
    selections
  ).every(
    ([
      attributeId,
      optionId,
    ]) =>
      variant.attributes.some(
        (value) =>
          value.attributeId ===
            attributeId &&
          (value.option?.id ||
            value.optionId ||
            value.displayValue) ===
            optionId
      )
  );

const addCalendarDays = (
  date:
    Date,
  days:
    number
) => {
  const result =
    new Date(
      date
    );

  result.setDate(
    result.getDate() +
      days
  );

  return result;
};

const formatDeliveryDate = (
  date:
    Date
) =>
  new Intl.DateTimeFormat(
    "en-AE",
    {
      weekday:
        "short",
      day:
        "numeric",
      month:
        "short",
    }
  ).format(
    date
  );

const getDeliveryDateText = (
  minDays:
    number |
    null,
  maxDays:
    number |
    null
) => {
  if (
    minDays === null &&
    maxDays === null
  ) {
    return null;
  }

  const today =
    new Date();

  const safeMin =
    Math.max(
      Number(
        minDays ??
        maxDays ??
        0
      ),
      0
    );

  const safeMax =
    Math.max(
      Number(
        maxDays ??
        minDays ??
        safeMin
      ),
      safeMin
    );

  const minDate =
    addCalendarDays(
      today,
      safeMin
    );

  const maxDate =
    addCalendarDays(
      today,
      safeMax
    );

  if (
    safeMin ===
    safeMax
  ) {
    return `Delivered to you by ${formatDeliveryDate(
      maxDate
    )}`;
  }

  return `Delivered to you ${formatDeliveryDate(
    minDate
  )} – ${formatDeliveryDate(
    maxDate
  )}`;
};

export default function ProductPurchasePanel({
  data,
}: {
  data:
    PublicProductData;
}) {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const {
    product,
  } = data;

  const wishlistSelector =
    useMemo(
      () =>
        makeSelectIsProductWishlisted(
          product.id
        ),
      [
        product.id,
      ]
    );

  const isWishlisted =
    useAppSelector(
      wishlistSelector
    );

  const initialVariant =
    product.variants.find(
      (variant) =>
        variant.id ===
        product.defaultVariantId
    ) ||
    product.variants[0];

  const initialSelections =
    Object.fromEntries(
      initialVariant.attributes
        .filter(
          (value) =>
            value.attribute
              ?.isVariantDefining
        )
        .map((value) => [
          value.attributeId,
          value.option?.id ||
            value.optionId ||
            value.displayValue ||
            "",
        ])
    );

  /*
  |--------------------------------------------------------------------------
  | Product Type / Variant Selectors
  |--------------------------------------------------------------------------
  |
  | SIMPLE:
  | - Still has one internal ProductVariant for pricing/inventory/cart.
  | - Does not show customer-facing variant selectors.
  |
  | VARIABLE:
  | - Shows only real variant-defining selectors returned by the backend.
  | - Every selectable combination must resolve to a real ProductVariant.
  |--------------------------------------------------------------------------
  */

  const isVariableProduct =
    product.productType ===
      "VARIABLE" &&
    product.variantSelectors.length >
      0;

  const [
    selections,
    setSelections,
  ] =
    useState<
      Record<string, string>
    >(
      initialSelections
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    selectedBundleSelections,
    setSelectedBundleSelections,
  ] =
    useState<
      CartBundleSelection[]
    >([]);

  const [
    addedMessage,
    setAddedMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    protectionPlans,
    setProtectionPlans,
  ] =
    useState<
      ProtectionPlan[]
    >([]);

  const [
    protectionResolver,
    setProtectionResolver,
  ] =
    useState<
      ProtectionResolverData |
      null
    >(null);

  const [
    selectedProtectionSchemeId,
    setSelectedProtectionSchemeId,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    protectionLoading,
    setProtectionLoading,
  ] =
    useState(false);

  const [
    protectionError,
    setProtectionError,
  ] =
    useState<
      string |
      null
    >(null);

  const selectedVariant =
    useMemo(
      () => {
        const exactVariant =
          product.variants.find(
            (variant) =>
              variantMatches(
                variant,
                selections
              )
          );

        /*
         * The selector buttons below prevent invalid combinations,
         * so an exact variant should normally always exist.
         *
         * Keep the initial variant only as a defensive fallback for
         * malformed/legacy product data.
         */
        return (
          exactVariant ||
          initialVariant
        );
      },
      [
        product.variants,
        selections,
        initialVariant,
      ]
    );

  const bundleConfig =
    data.bundlePromotions
      ?.byVariant
      ?.[selectedVariant.id] ||
    (
      data.bundlePromotions
        ?.selected
        ?.productVariantId ===
      selectedVariant.id
        ? data.bundlePromotions
            .selected
        : null
    );

  useEffect(
    () => {
      setSelectedBundleSelections(
        []
      );
    },
    [
      selectedVariant.id,
    ]
  );

  const bundledProtectionSchemeIds =
    useMemo(
      () =>
        new Set(
          selectedBundleSelections
            .flatMap(
              (bundle) =>
                bundle.items
                  .filter(
                    (item) =>
                      item.itemType ===
                        "PROTECTION_PLAN" &&
                      item.protectionSchemeId
                  )
                  .map(
                    (item) =>
                      String(
                        item.protectionSchemeId
                      )
                  )
            )
        ),
      [
        selectedBundleSelections,
      ]
    );

  useEffect(
    () => {
      if (
        selectedProtectionSchemeId &&
        bundledProtectionSchemeIds.has(
          selectedProtectionSchemeId
        )
      ) {
        setSelectedProtectionSchemeId(
          null
        );
      }
    },
    [
      selectedProtectionSchemeId,
      bundledProtectionSchemeIds,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Live Express Delivery Eligibility
  |--------------------------------------------------------------------------
  |
  | No customer-location detection is used here.
  |
  | DXB/SHJ:
  | DXB_WAREHOUSE + DXB_WAFI + DXB_DEIRA_CC
  |
  | Abu Dhabi:
  | AUH_SAJ
  |
  | The selected PDP quantity is sent to the inventory eligibility API.
  |
  |--------------------------------------------------------------------------
  */

  const effectiveDelivery =
  selectedVariant.delivery ||
  product.delivery;

const expressDeliveryEnabled =
  effectiveDelivery
    ?.expressDeliveryEnabled ===
  true;

/*
|--------------------------------------------------------------------------
| Live Express Delivery Eligibility
|--------------------------------------------------------------------------
|
| Only perform the inventory eligibility request when Express Delivery is
| actually enabled for this product/variant.
|--------------------------------------------------------------------------
*/

const {
  eligibility:
    deliveryEligibility,

  loading:
    deliveryEligibilityLoading,
} =
  useProductDeliveryEligibility({
    productVariantId:
      selectedVariant.id,

    quantity,

    enabled:
      expressDeliveryEnabled,
  });

const showDubaiSharjahExpress =
  expressDeliveryEnabled &&
  deliveryEligibility
    ?.dubaiSharjah
    ?.eligible ===
    true;

const showAbuDhabiExpress =
  expressDeliveryEnabled &&
  deliveryEligibility
    ?.abuDhabi
    ?.eligible ===
    true;
  /*
  |--------------------------------------------------------------------------
  | Standard Delivery
  |--------------------------------------------------------------------------
  |
  | Keep the existing product delivery dates for the standard-delivery card.
  | They are no longer used to determine express eligibility.
  |
  |--------------------------------------------------------------------------
  */

  const delivery =
  effectiveDelivery;

  
  const deliveryDateText =
    getDeliveryDateText(
      delivery
        ?.deliveryMinDays ??
        null,
      delivery
        ?.deliveryMaxDays ??
        null
    );

    const gallery = useMemo(() => {
      const variantImages =
        Array.isArray(
          selectedVariant.images
        )
          ? selectedVariant.images
          : [];
    
      const productImages =
        Array.isArray(
          product.gallery
        )
          ? product.gallery
          : [];
    
      return variantImages.length
        ? [...variantImages].sort(
            (first, second) =>
              Number(
                first.displayOrder || 0
              ) -
              Number(
                second.displayOrder || 0
              )
          )
        : [...productImages].sort(
            (first, second) =>
              Number(
                first.displayOrder || 0
              ) -
              Number(
                second.displayOrder || 0
              )
          );
    }, [
      selectedVariant.id,
      selectedVariant.images,
      product.gallery,
    ]);

  useEffect(
    () => {
      const image =
        selectedVariant
          .images[0] ||
        product.gallery[0];

      dispatch(
        addRecentlyViewed({
          productId:
            product.id,

          productSlug:
            product.slug,

          productName:
            product.name,

          productType:
            product.productType,

          variantId:
            selectedVariant.id,

          variantName:
            selectedVariant.name,

          sku:
            selectedVariant.sku,

          imageUrl:
            getImageUrl(
              image
            ),

          brandName:
            product.brand
              ?.name ||
            null,

          categoryName:
            product
              .primaryCategory
              ?.name ||
            null,

          unitPrice:
            selectedVariant
              .price
              ?.sellingPrice ===
              null ||
            selectedVariant
              .price
              ?.sellingPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .sellingPrice
                ),

          compareAtPrice:
            selectedVariant
              .price
              ?.compareAtPrice ===
              null ||
            selectedVariant
              .price
              ?.compareAtPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .compareAtPrice
                ),

          currencyCode:
            selectedVariant
              .price
              ?.currencyCode ||
            data.company
              .currency ||
            "AED",

          taxPercent:
            Number(
              product.taxPercent ||
              0
            ),

          isTaxInclusive:
            selectedVariant
              .price
              ?.isTaxInclusive !==
            false,

          viewedAt:
            new Date()
              .toISOString(),
        })
      );
    },
    [
      dispatch,
      product.id,
      product.slug,
      product.name,
      product.productType,
      product.brand
        ?.name,
      product
        .primaryCategory
        ?.name,
      product.taxPercent,
      product.gallery,
      selectedVariant.id,
      selectedVariant.name,
      selectedVariant.sku,
      selectedVariant.images,
      selectedVariant.price,
      data.company
        .currency,
    ]
  );

  const currencyCode =
    selectedVariant.price
      ?.currencyCode ||
    data.company.currency ||
    "AED";

  /*
  |--------------------------------------------------------------------------
  | Combined Discount / Gift Voucher Display
  |--------------------------------------------------------------------------
  |
  | The backend returns the final selling price after both the normal price
  | discount and the Gift Voucher discount. Prefer those authoritative fields
  | and keep a compareAtPrice fallback for older product responses.
  |--------------------------------------------------------------------------
  */

  const regularPrice =
    selectedVariant.price
      ?.regularPrice !=
      null
      ? Number(
          selectedVariant.price
            .regularPrice
        )
      : null;

  const sellingPrice =
    selectedVariant.price
      ?.sellingPrice !=
      null
      ? Number(
          selectedVariant.price
            .sellingPrice
        )
      : null;

  const compareAtPrice =
    selectedVariant.price
      ?.compareAtPrice !=
      null
      ? Number(
          selectedVariant.price
            .compareAtPrice
        )
      : null;

  const backendTotalDiscountAmount =
    selectedVariant.price
      ?.totalDiscountAmount !=
      null
      ? Number(
          selectedVariant.price
            .totalDiscountAmount
        )
      : null;

  const backendTotalDiscountPercent =
    selectedVariant.price
      ?.totalDiscountPercent !=
      null
      ? Number(
          selectedVariant.price
            .totalDiscountPercent
        )
      : null;

  const giftVoucherDiscountAmount =
    selectedVariant.price
      ?.giftVoucherDiscountAmount !=
      null
      ? Number(
          selectedVariant.price
            .giftVoucherDiscountAmount
        )
      : 0;

  const hasGiftVoucherDiscount =
    Number.isFinite(
      giftVoucherDiscountAmount
    ) &&
    giftVoucherDiscountAmount >
      0;

  const displayOriginalPrice =
    regularPrice != null &&
    sellingPrice != null &&
    regularPrice >
      sellingPrice
      ? regularPrice
      : compareAtPrice != null &&
          sellingPrice != null &&
          compareAtPrice >
            sellingPrice
        ? compareAtPrice
        : null;

  const discountAmount =
    backendTotalDiscountAmount !=
      null &&
    Number.isFinite(
      backendTotalDiscountAmount
    ) &&
    backendTotalDiscountAmount >
      0
      ? backendTotalDiscountAmount
      : displayOriginalPrice !=
            null &&
          sellingPrice !=
            null &&
          displayOriginalPrice >
            sellingPrice
        ? displayOriginalPrice -
          sellingPrice
        : 0;

  const discountPercentage =
    backendTotalDiscountPercent !=
      null &&
    Number.isFinite(
      backendTotalDiscountPercent
    ) &&
    backendTotalDiscountPercent >
      0
      ? Math.round(
          backendTotalDiscountPercent
        )
      : displayOriginalPrice !=
            null &&
          sellingPrice !=
            null &&
          displayOriginalPrice >
            sellingPrice
        ? Math.round(
            (
              (
                displayOriginalPrice -
                sellingPrice
              ) /
              displayOriginalPrice
            ) *
              100
          )
        : null;

  const hasDiscount =
    discountPercentage != null &&
    discountPercentage >
      0 &&
    discountAmount >
      0;

  const giftVoucherValidUntil =
    selectedVariant.price
      ?.giftVoucher
      ?.validUntil ||
    null;

  const formattedGiftVoucherValidUntil =
    giftVoucherValidUntil
      ? new Intl.DateTimeFormat(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ).format(
          new Date(
            giftVoucherValidUntil
          )
        )
      : null;

  const numericSellingPrice =
    Number(
      selectedVariant.price
        ?.sellingPrice ||
        0
    );

  const selectedProtectionPlan =
    useMemo(
      () =>
        protectionPlans.find(
          (plan) =>
            plan.schemeId ===
            selectedProtectionSchemeId
        ) ||
        null,
      [
        protectionPlans,
        selectedProtectionSchemeId,
      ]
    );

    useEffect(
      () => {
        if (
          !product.id ||
          !selectedVariant.id
        ) {
          return;
        }
  
        const controller =
          new AbortController();
  
        const loadProtectionPlans =
          async () => {
            setProtectionLoading(
              true
            );
  
            setProtectionError(
              null
            );
  
            setProtectionPlans(
              []
            );
  
            setProtectionResolver(
              null
            );
  
            setSelectedProtectionSchemeId(
              null
            );
  
            try {
              /*
              |--------------------------------------------------------------------------
              | Request Parameters
              |--------------------------------------------------------------------------
              |
              | Do NOT add:
              |
              | _ts: String(Date.now())
              |
              | The previous timestamp parameter forced every request to have a
              | completely unique URL even when product/variant/quantity had not
              | changed.
              |--------------------------------------------------------------------------
              */
  
              const params =
                new URLSearchParams({
                  productId:
                    product.id,
  
                  productVariantId:
                    selectedVariant.id,
  
                  channelCode:
                    "WEBSITE",
  
                  currencyCode:
                    currencyCode ||
                    "AED",
  
                  quantity:
                    String(
                      Math.max(
                        1,
                        quantity
                      )
                    ),
                });
  
              /*
              |--------------------------------------------------------------------------
              | Load Protection Plans
              |--------------------------------------------------------------------------
              |
              | Keep no-store for now.
              |
              | Protection eligibility and price are authoritative server-side
              | values, so we still want the backend to resolve the latest data.
              |--------------------------------------------------------------------------
              */
  
              const response =
                await fetch(
                  `${API_URL}/public/protection/plans?${params.toString()}`,
                  {
                    method:
                      "GET",
  
                    headers: {
                      Accept:
                        "application/json",
  
                      "x-company-code":
                        COMPANY_CODE,
                    },
  
                    credentials:
                      "include",
  
                    cache:
                      "no-store",
  
                    signal:
                      controller.signal,
                  }
                );
  
              /*
              |--------------------------------------------------------------------------
              | Response
              |--------------------------------------------------------------------------
              */
  
              const payload =
                (await response.json()) as
                  ProtectionApiResponse;
  
              if (
                !response.ok ||
                !payload.success
              ) {
                throw new Error(
                  payload.error
                    ?.message ||
                    "Unable to load protection plans."
                );
              }
  
              if (
                !payload.data
              ) {
                throw new Error(
                  "Protection plan response is empty."
                );
              }
  
              /*
              |--------------------------------------------------------------------------
              | Resolver Result
              |--------------------------------------------------------------------------
              */
  
              setProtectionResolver(
                payload.data
              );
  
              setProtectionPlans(
                Array.isArray(
                  payload.data.plans
                )
                  ? payload.data.plans
                  : []
              );
            } catch (
              error
            ) {
              /*
              |--------------------------------------------------------------------------
              | Aborted Request
              |--------------------------------------------------------------------------
              |
              | Variant/quantity changes can abort the previous request.
              | This is expected and should not display an error.
              |--------------------------------------------------------------------------
              */
  
              if (
                error instanceof
                  DOMException &&
                error.name ===
                  "AbortError"
              ) {
                return;
              }
  
              console.error(
                "Unable to load protection plans:",
                error
              );
  
              setProtectionError(
                error instanceof
                  Error
                  ? error.message
                  : "Unable to load protection plans."
              );
            } finally {
              /*
              |--------------------------------------------------------------------------
              | Loading State
              |--------------------------------------------------------------------------
              |
              | Do not allow an old aborted request to turn off the loading state
              | belonging to a newer request.
              |--------------------------------------------------------------------------
              */
  
              if (
                !controller.signal
                  .aborted
              ) {
                setProtectionLoading(
                  false
                );
              }
            }
          };
  
        void loadProtectionPlans();
  
        /*
        |--------------------------------------------------------------------------
        | Cleanup
        |--------------------------------------------------------------------------
        */
  
        return () => {
          controller.abort();
        };
      },
      [
        product.id,
        selectedVariant.id,
        currencyCode,
        quantity,
      ]
    );

  const tabbyFourPayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            4
        )
      : 0;

  const tabbyTwelvePayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            12
        )
      : 0;

  const tamaraFourPayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            4
        )
      : 0;

  const tamaraMonthlyPayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            12
        )
      : 0;

  /*
|--------------------------------------------------------------------------
| Purchase Availability
|--------------------------------------------------------------------------
|
| Variant availability represents real physical inventory.
|
| An Always Available product remains purchasable even when the selected
| variant has zero physical stock.
|
| Express delivery and store pickup continue to use real inventory.
|--------------------------------------------------------------------------
*/

const alwaysAvailableForSale =
product
  .alwaysAvailableForSale ===
true;

const physicalAvailabilityMessage =
selectedVariant
  .availability
  .message ||
"";

const physicallyOutOfStock =
selectedVariant
  .availability
  .status ===
  "OUT_OF_STOCK" ||
/out of stock|unavailable/i.test(
  physicalAvailabilityMessage
);

const isUnavailable =
!alwaysAvailableForSale &&
physicallyOutOfStock;

const availabilityMessage =
alwaysAvailableForSale &&
physicallyOutOfStock
  ? "Available to order"
  : (
      physicalAvailabilityMessage ||
      "Available to order"
    );

  const isOptionAvailable = (
    attributeId: string,
    optionId: string
  ) => {
    /*
     * Preserve every currently selected attribute except the selector
     * being changed. The option stays enabled only when at least one
     * real variant supports that resulting combination.
     */
    const otherSelections =
      Object.fromEntries(
        Object.entries(
          selections
        ).filter(
          ([
            selectedAttributeId,
          ]) =>
            selectedAttributeId !==
            attributeId
        )
      );

    return product.variants.some(
      (variant) => {
        const hasRequestedOption =
          variant.attributes.some(
            (value) =>
              value.attributeId ===
                attributeId &&
              (value.option?.id ||
                value.optionId ||
                value.displayValue) ===
                optionId
          );

        if (
          !hasRequestedOption
        ) {
          return false;
        }

        return variantMatches(
          variant,
          otherSelections
        );
      }
    );
  };

  const selectOption = (
    attributeId: string,
    optionId: string
  ) => {
    if (
      !isOptionAvailable(
        attributeId,
        optionId
      )
    ) {
      return;
    }

    const nextSelections = {
      ...selections,
      [attributeId]:
        optionId,
    };

    const exactVariant =
      product.variants.find(
        (variant) =>
          variantMatches(
            variant,
            nextSelections
          )
      );

    if (
      !exactVariant
    ) {
      /*
       * Do not let the visible selector state drift away from the
       * actual sellable ProductVariant underneath it.
       */
      return;
    }

    setSelections(
      Object.fromEntries(
        exactVariant.attributes
          .filter(
            (value) =>
              value.attribute
                ?.isVariantDefining
          )
          .map((value) => [
            value.attributeId,
            value.option?.id ||
              value.optionId ||
              value.displayValue ||
              "",
          ])
      )
    );
  };

  const buildCartItem =
    (): CartItem | null => {
      const price =
        selectedVariant.price;

      if (
        !price ||
        !Number.isFinite(
          Number(
            price.sellingPrice
          )
        )
      ) {
        return null;
      }

      const selectedAttributes =
        selectedVariant.attributes
          .filter(
            (value) =>
              value.attribute
                ?.isVariantDefining
          )
          .map((value) => ({
            attributeId:
              value.attributeId,

            attributeName:
              value.attribute
                ?.name ||
              "Option",

            optionId:
              value.option?.id ||
              value.optionId ||
              value.displayValue ||
              "",

            optionLabel:
              value.option
                ?.label ||
              value.displayValue ||
              "",

            swatchValue:
              value.option
                ?.swatchValue ||
              null,
          }));

      const image =
        selectedVariant
          .images[0] ||
        product.gallery[0];

      return {
        key:
          `${product.id}:${selectedVariant.id}:${selectedBundleSelections
            .map(
              (bundle) =>
                `${bundle.bundlePromotionId}x${bundle.selectionQuantity}`
            )
            .sort()
            .join("|") || "NO_BUNDLE"}`,

        productId:
          product.id,

        productSlug:
          product.slug,

        productName:
          product.name,

        variantId:
          selectedVariant.id,

        sku:
          selectedVariant.sku,

        imageUrl:
          getImageUrl(
            image
          ),

        unitPrice:
          Number(
            price.sellingPrice
          ),

        compareAtPrice:
          price.compareAtPrice ===
            null ||
          price.compareAtPrice ===
            undefined
            ? null
            : Number(
                price.compareAtPrice
              ),

        regularPrice:
          price.regularPrice == null
            ? null
            : Number(
                price.regularPrice
              ),

        baseSellingPrice:
          price.baseSellingPrice == null
            ? Number(
                price.sellingPrice
              )
            : Number(
                price.baseSellingPrice
              ),

        priceDiscountAmount:
          price.priceDiscountAmount == null
            ? null
            : Number(
                price.priceDiscountAmount
              ),

        giftVoucherDiscountAmount:
          price.giftVoucherDiscountAmount == null
            ? null
            : Number(
                price.giftVoucherDiscountAmount
              ),

        totalDiscountAmount:
          price.totalDiscountAmount == null
            ? null
            : Number(
                price.totalDiscountAmount
              ),

        totalDiscountPercent:
          price.totalDiscountPercent == null
            ? null
            : Number(
                price.totalDiscountPercent
              ),

        giftVoucher:
          price.giftVoucher
            ? {
                ...price.giftVoucher,
                discountAmount:
                  Number(
                    price.giftVoucher.discountAmount ||
                    price.giftVoucherDiscountAmount ||
                    0
                  ),
                internalValue:
                  Number(
                    price.giftVoucher.internalValue ||
                    0
                  ),
                externalValue:
                  Number(
                    price.giftVoucher.externalValue ||
                    0
                  ),
              }
            : null,

        currencyCode:
          price.currencyCode ||
          currencyCode,

        taxPercent:
          Number(
            product.taxPercent ||
              0
          ),

        isTaxInclusive:
          price.isTaxInclusive,

        quantity,

        bundleSelections:
          selectedBundleSelections,

        selectedAttributes,
      };
    };

  const addToCart = (
    buyNow = false
  ) => {
    if (
      isUnavailable
    ) {
      setAddedMessage(
        "This selected variant is currently unavailable."
      );

      return;
    }

    const cartItem =
      buildCartItem();

    if (!cartItem) {
      setAddedMessage(
        "This variant does not have a valid price."
      );

      return;
    }

    dispatch(
      addItem(cartItem)
    );

    if (
      selectedProtectionPlan
    ) {
      const protectionUnitPrice =
        Number(
          selectedProtectionPlan
            .unitPrice ||
            0
        );

      const protectionTotalPrice =
        protectionUnitPrice *
        Math.max(
          1,
          quantity
        );

      dispatch(
        setItemExtendedWarranty({
          key:
            cartItem.key,

          warranty: {
            schemeId:
              selectedProtectionPlan
                .schemeId,

            assignmentId:
              selectedProtectionPlan
                .assignmentId,

            code:
              selectedProtectionPlan
                .code,

            name:
              selectedProtectionPlan
                .name,

            schemeType:
              selectedProtectionPlan
                .schemeType,

            durationMonths:
              selectedProtectionPlan
                .durationMonths,

            periodYears:
              selectedProtectionPlan
                .durationMonths &&
              selectedProtectionPlan
                .durationMonths %
                12 ===
                0
                ? selectedProtectionPlan
                    .durationMonths /
                  12
                : null,

            pricingMethod:
              selectedProtectionPlan
                .pricingMethod,

            percentage:
              selectedProtectionPlan
                .percentage,

            fixedAmount:
              selectedProtectionPlan
                .fixedAmount,

            unitPrice:
              Number(
                protectionUnitPrice.toFixed(
                  2
                )
              ),

            totalPrice:
              Number(
                protectionTotalPrice.toFixed(
                  2
                )
              ),

            currencyCode:
              selectedProtectionPlan
                .currencyCode ||
              currencyCode,

            pricingSource:
              selectedProtectionPlan
                .pricingSource,

            coverageStartMode:
              selectedProtectionPlan
                .coverageStartMode,
          },
        })
      );
    }

    setAddedMessage(
      selectedProtectionPlan
        ? `${product.name} and ${selectedProtectionPlan.name} added to your cart.`
        : `${product.name} added to your cart.`
    );

    if (buyNow) {
      router.push(
        "/cart"
      );
    }
  };


  const toggleWishlist =
    () => {
      const image =
        selectedVariant
          .images[0] ||
        product.gallery[0];

      dispatch(
        toggleWishlistItem({
          productId:
            product.id,

          productSlug:
            product.slug,

          productName:
            product.name,

          productType:
            product.productType,

          imageUrl:
            getImageUrl(
              image
            ),

          brandName:
            product.brand
              ?.name ||
            null,

          categoryName:
            product
              .primaryCategory
              ?.name ||
            null,

          variantId:
            selectedVariant.id,

          sku:
            selectedVariant.sku,

          unitPrice:
            selectedVariant
              .price
              ?.sellingPrice ===
              null ||
            selectedVariant
              .price
              ?.sellingPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .sellingPrice
                ),

          compareAtPrice:
            selectedVariant
              .price
              ?.compareAtPrice ===
              null ||
            selectedVariant
              .price
              ?.compareAtPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .compareAtPrice
                ),

          currencyCode,

          taxPercent:
            Number(
              product.taxPercent ||
              0
            ),

          isTaxInclusive:
            selectedVariant
              .price
              ?.isTaxInclusive !==
            false,

          addedAt:
            new Date()
              .toISOString(),
        })
      );
    };

  return (
    <>
    <section className="grid min-w-0 gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.9fr)_330px] xl:gap-8">
    <div className="min-w-0 lg:col-start-1 lg:row-start-1 xl:col-auto xl:row-auto">
      <ProductGallery
        key={selectedVariant.id}
        images={gallery}
        productName={product.name}
        variantName={
          selectedVariant.name
        }
        isWishlisted={
          isWishlisted
        }
        onToggleWishlist={
          toggleWishlist
        }
      />
        
      </div>

      <div className="min-w-0 max-w-full py-1 lg:col-start-2 lg:row-start-1 xl:col-auto xl:row-auto">
        {product.brand ? (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="inline-block text-[12px] font-bold uppercase tracking-[0.04em] text-storefront-text sm:text-sm"
          >
            {
              product.brand
                .name
            }
          </Link>
        ) : null}

        <h1 className="mt-2 break-words text-[26px] font-bold leading-[1.14] tracking-tight text-storefront-text sm:text-[30px] lg:text-[34px]">
          {product.name}
        </h1>

        

        <div className="mt-5 max-w-xl sm:mt-7">
          <div className="flex min-w-0 flex-wrap items-end gap-2 sm:gap-3">
            {selectedVariant.price
              ?.sellingPrice !=
            null ? (
              <StorefrontMoney
                amount={
                  selectedVariant.price
                    .sellingPrice
                }
                currencyCode={
                  currencyCode
                }
                className="text-[28px] font-bold leading-none text-storefront-text sm:text-[32px] lg:text-[36px]"
              />
            ) : (
              <span className="text-xl font-black text-storefront-text">
                Price unavailable
              </span>
            )}

            {hasDiscount &&
            displayOriginalPrice !=
              null ? (
              <StorefrontMoney
                amount={
                  displayOriginalPrice
                }
                currencyCode={
                  currencyCode
                }
                className="pb-1 text-lg font-bold text-storefront-muted line-through"
              />
            ) : null}

            {hasDiscount &&
            discountPercentage ? (
              <span className="mb-0.5 inline-flex items-center rounded-full bg-[#E52E3A] px-3 py-1.5 text-xs font-black text-white">
                {discountPercentage}% OFF
              </span>
            ) : null}
          </div>

          {hasDiscount ? (
            <div className="mt-4 flex items-center gap-2 border-t border-[#ECEFF2] pt-3">
              <Tag
                size={18}
                strokeWidth={2.5}
                className="shrink-0 text-[#E52E3A]"
              />

              <div className="flex flex-wrap items-baseline gap-1.5 text-[#E52E3A]">
                <StorefrontMoney
                  amount={
                    discountAmount
                  }
                  currencyCode={
                    currencyCode
                  }
                  className="text-sm font-black text-[#E52E3A]"
                />

                {discountPercentage ? (
                  <span className="text-sm font-black">
                    ({discountPercentage}%)
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {hasGiftVoucherDiscount ? (
            <div className="mt-3 flex items-center gap-2 border-t border-[#ECEFF2] pt-3">
              <Gift
                size={19}
                strokeWidth={2.4}
                className="shrink-0 text-[#6C2CF5]"
              />

              <p className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-storefront-text">
                Gift voucher discount{" "}
                <StorefrontMoney
                  amount={
                    giftVoucherDiscountAmount
                  }
                  currencyCode={
                    currencyCode
                  }
                  className="inline font-black text-[#6C2CF5]"
                  symbolClassName="h-[0.8em]"
                />{" "}
                applied
              </p>

              <Info
                size={17}
                strokeWidth={2.2}
                className="shrink-0 text-storefront-muted"
                aria-hidden="true"
              />
            </div>
          ) : null}

          {hasGiftVoucherDiscount &&
          formattedGiftVoucherValidUntil ? (
            <div className="mt-3 flex items-center gap-2 border-t border-[#ECEFF2] pt-3">
              <CalendarDays
                size={17}
                strokeWidth={2.2}
                className="shrink-0 text-storefront-muted"
              />

              <p className="text-[12px] font-semibold leading-5 text-storefront-muted">
                Offer valid till{" "}
                {formattedGiftVoucherValidUntil}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-black text-storefront-text">
            Quantity:
          </span>

          <div className="flex h-9 items-center rounded-lg border border-[#d9dde3] bg-white">
            <button
              type="button"
              onClick={() =>
                setQuantity(
                  Math.max(
                    1,
                    quantity - 1
                  )
                )
              }
              className="flex h-full w-9 items-center justify-center"
              aria-label="Decrease quantity"
            >
              <Minus
                size={17}
              />
            </button>

            <span className="min-w-8 text-center text-[13px] font-black">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity(
                  quantity + 1
                )
              }
              className="flex h-full w-9 items-center justify-center"
              aria-label="Increase quantity"
            >
              <Plus
                size={17}
              />
            </button>
          </div>
        </div>

        <div className="mt-3 max-w-xl border-b border-[#d9dde3] pb-4">
          <p className="text-[13px] font-semibold text-[#6b7280]">
            {selectedVariant
              .price
              ?.isTaxInclusive
              ? "All prices include VAT"
              : "VAT calculated at checkout"}
          </p>

          <div
            className={[
              "mt-3 flex items-center gap-2 text-[13px] font-black",
              isUnavailable
                ? "text-red-600"
                : "text-emerald-700",
            ].join(
              " "
            )}
          >
            <span
              className={[
                "h-2.5 w-2.5 rounded-full",
                isUnavailable
                  ? "bg-red-600"
                  : "bg-emerald-600",
              ].join(
                " "
              )}
            />

            {
              availabilityMessage
            }
          </div>

          {/* Live Express Delivery */}

          {deliveryEligibilityLoading ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#d9dde3] bg-white px-3 py-2.5 text-[12px] font-semibold text-storefront-muted">
              <LoaderCircle
                size={
                  15
                }
                className="animate-spin"
              />

              Checking express delivery availability…
            </div>
          ) : null}

          {!deliveryEligibilityLoading &&
          (showDubaiSharjahExpress ||
            showAbuDhabiExpress) ? (
            <div className="mt-3 space-y-2">
              {showDubaiSharjahExpress ? (
                <div className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#b9e5e1] bg-[#f1fbfa] px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9f5f2] text-[#159b91]">
                    <Zap
                      size={
                        17
                      }
                      strokeWidth={
                        2.4
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-black text-[#117f77]">
                        MyExpressDelivery
                      </span>

                      <span className="rounded-full bg-[#159b91] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        Express
                      </span>
                    </div>

                    <p className="mt-0.5 break-words text-[12px] font-bold leading-4 text-storefront-text sm:text-[13px]">
                      2-Hour Delivery — Dubai / Sharjah
                    </p>
                  </div>
                </div>
              ) : null}

              {showAbuDhabiExpress ? (
                <div className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#b9e5e1] bg-[#f1fbfa] px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9f5f2] text-[#159b91]">
                    <Zap
                      size={
                        17
                      }
                      strokeWidth={
                        2.4
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-black text-[#117f77]">
                        MyExpressDelivery
                      </span>

                      <span className="rounded-full bg-[#159b91] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        Express
                      </span>
                    </div>

                    <p className="mt-0.5 break-words text-[12px] font-bold leading-4 text-storefront-text sm:text-[13px]">
                      1-Hour Delivery — Abu Dhabi
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {deliveryDateText ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#d9dde3] bg-white px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-storefront-text">
                <Truck
                  size={17}
                  strokeWidth={2}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold text-storefront-muted">
                  Standard Delivery
                </p>

                <p className="mt-0.5 break-words text-[12px] font-bold leading-4 text-storefront-text sm:text-[13px]">
                  {
                    deliveryDateText
                  }
                </p>

                {delivery
                  ?.deliveryNote ? (
                  <p className="mt-0.5 text-[11px] text-storefront-muted">
                    {
                      delivery
                        .deliveryNote
                    }
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <Link
            href="#related-products"
            className="mt-4 flex items-center justify-between text-[13px] font-black text-storefront-text outline-none transition hover:text-storefront-primary focus:outline-none focus-visible:ring-0"
          >
            <span>
              Related Products
            </span>

            <span
              aria-hidden="true"
              className="text-lg leading-none"
            >
              ›
            </span>
          </Link>
        </div>

        {isVariableProduct ? (
          <div className="mt-4 space-y-4">
            {product.variantSelectors.map(
              (selector) => (
                <div
                  key={
                    selector.id
                  }
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <h2 className="text-[13px] font-bold text-storefront-text">
                      {
                        selector.name
                      }:
                    </h2>

                    <span className="text-[12px] font-medium text-storefront-muted">
                      {
                        selector.options.find(
                          (option) =>
                            option.id ===
                            selections[
                              selector.id
                            ]
                        )?.label ||
                        "Select"
                      }
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selector.options.map(
                      (option) => {
                        const selected =
                          selections[
                            selector.id
                          ] ===
                          option.id;

                        const available =
                          isOptionAvailable(
                            selector.id,
                            option.id
                          );

                        return (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            disabled={
                              !available
                            }
                            onClick={() =>
                              selectOption(
                                selector.id,
                                option.id
                              )
                            }
                            aria-pressed={
                              selected
                            }
                            aria-disabled={
                              !available
                            }
                            title={
                              available
                                ? option.label
                                : `${option.label} is not available with the currently selected options`
                            }
                            className={[
                              "inline-flex h-9 min-w-[68px] items-center justify-center gap-2 rounded-lg border px-3 text-[12px] font-bold transition",

                              selected
                                ? "border-[#bfc5cc] bg-[#f7f7f8] text-storefront-text ring-1 ring-[#d9dde3]"
                                : available
                                  ? "border-[#d9dde3] bg-white text-storefront-muted hover:border-[#bfc5cc]"
                                  : "cursor-not-allowed border-[#e5e7eb] bg-[#f7f7f8] text-[#b6bbc2] opacity-60",
                            ].join(
                              " "
                            )}
                          >
                            {option.swatchValue ? (
                              <span
                                className={[
                                  "h-4 w-4 rounded-full border",
                                  available
                                    ? "border-[#d9dde3]"
                                    : "border-[#e5e7eb] opacity-50",
                                ].join(
                                  " "
                                )}
                                style={{
                                  backgroundColor:
                                    option.swatchValue,
                                }}
                              />
                            ) : null}

                            <span
                              className={
                                available
                                  ? ""
                                  : "line-through decoration-1"
                              }
                            >
                              {
                                option.label
                              }
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ) : null}


        {/*
         * TEMPORARILY DISABLED:
         * Tabby and Tamara promotional widgets.
         *
         * Integration code is intentionally retained
         * so both providers can be re-enabled later.
         *
         * {numericSellingPrice > 0 ? (
         *   <div className="mt-4 w-full min-w-0 max-w-xl overflow-hidden">
         *     <TabbyPromo
         *       key={`${selectedVariant.id}-${numericSellingPrice}`}
         *       amount={numericSellingPrice}
         *       currencyCode={currencyCode}
         *       source="product"
         *     />
         *   </div>
         * ) : null}
         *
         * {numericSellingPrice > 0 ? (
         *   <div className="mt-3 w-full min-w-0 max-w-xl overflow-hidden">
         *     <TamaraWidget
         *       key={`${selectedVariant.id}-${numericSellingPrice}`}
         *       amount={numericSellingPrice}
         *       country="AE"
         *       language="en"
         *     />
         *   </div>
         * ) : null}
         */}

        

        {product.shortDescription ? (
          <p className="mt-5 text-sm leading-7 text-storefront-muted">
            {
              product.shortDescription
            }
          </p>
        ) : null}

        

      </div>

      <div className="min-w-0 lg:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1">
        <div className="w-full min-w-0 max-w-full rounded-[18px] border border-[#d9dde3] bg-white p-4 shadow-none sm:p-5 xl:sticky xl:top-6">
         

        




          <BundlePromotionSelector
            config={
              bundleConfig
            }
            quantity={
              quantity
            }
            value={
              selectedBundleSelections
            }
            onChange={
              setSelectedBundleSelections
            }
          />

          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={20}
                className="shrink-0 text-storefront-text"
              />

              <p className="text-base font-black text-storefront-text">
                Protect your purchase
              </p>
            </div>

            <p className="mt-1 text-[12px] leading-5 text-storefront-muted">
              Add optional extended warranty or damage protection.
            </p>

            {protectionLoading ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-storefront-secondary/50 px-3 py-3 text-xs font-bold text-storefront-muted">
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />

                Checking protection plans…
              </div>
            ) : null}

            {!protectionLoading &&
            protectionError ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-xs leading-5 text-red-700">
                  Protection plans are temporarily unavailable. You can still buy this product.
                </p>
              </div>
            ) : null}

            {!protectionLoading &&
            !protectionError &&
            protectionResolver &&
            !protectionResolver.eligible ? (
              <p className="mt-4 rounded-xl bg-storefront-secondary/50 px-3 py-3 text-xs leading-5 text-storefront-muted">
                {
                  protectionResolver.message
                }
              </p>
            ) : null}

            {!protectionLoading &&
            !protectionError &&
            protectionPlans.length >
              0 ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProtectionSchemeId(
                      null
                    )
                  }
                  className={[
                    "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                    selectedProtectionSchemeId ===
                    null
                      ? "border-[#d1d5db] bg-[#fafafa] ring-0"
                      : "border-[#d9dde3] bg-white hover:border-[#c5cbd2]",
                  ].join(
                    " "
                  )}
                >
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selectedProtectionSchemeId ===
                      null
                        ? "border-[#bfc5cc] bg-storefront-primary text-white"
                        : "border-[#d9dde3] bg-white text-transparent",
                    ].join(
                      " "
                    )}
                  >
                    <Check
                      size={12}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-storefront-text sm:text-sm">
                      No additional protection
                    </p>

                    <p className="mt-0.5 text-[11px] text-storefront-muted">
                      Standard product warranty only.
                    </p>
                  </div>
                  <StorefrontMoney
                      amount={
                        0
                      }
                      currencyCode={
                        currencyCode
                      }
                      className="text-xs font-black text-storefront-muted"
                    />
                </button>

                {protectionPlans
                  .filter(
                    (plan) =>
                      !bundledProtectionSchemeIds.has(
                        plan.schemeId
                      )
                  )
                  .map(
                  (
                    plan
                  ) => {
                    const selected =
                      selectedProtectionSchemeId ===
                      plan.schemeId;

                    const duration =
                      getProtectionDurationLabel(
                        plan.durationMonths
                      );

                    return (
                      <button
                        key={
                          plan.schemeId
                        }
                        type="button"
                        onClick={() =>
                          setSelectedProtectionSchemeId(
                            plan.schemeId
                          )
                        }
                        className={[
                          "flex w-full min-w-0 items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition",
                          selected
                            ? "border-[#d1d5db] bg-[#fafafa] ring-0"
                            : "border-[#d9dde3] bg-white hover:border-[#c5cbd2]",
                        ].join(
                          " "
                        )}
                      >
                        <span
                          className={[
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-[#bfc5cc] bg-storefront-primary text-white"
                              : "border-[#d9dde3] bg-white text-transparent",
                          ].join(
                            " "
                          )}
                        >
                          <Check
                            size={12}
                          />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-wide text-storefront-primary">
                            {getProtectionTypeLabel(
                              plan.schemeType
                            )}
                          </p>

                          <p className="mt-0.5 text-sm font-black leading-5 text-storefront-text">
                            {
                              plan.name
                            }
                          </p>

                          {duration ? (
                            <p className="mt-0.5 text-[11px] text-storefront-muted">
                              {
                                duration
                              }{" "}
                              coverage
                            </p>
                          ) : null}
                        </div>

                        <div className="max-w-[100px] shrink-0 whitespace-nowrap text-right">
                          <StorefrontMoney
                            amount={
                              Number(
                                plan.unitPrice ||
                                  0
                              )
                            }
                            currencyCode={
                              plan.currencyCode ||
                              currencyCode
                            }
                            className="text-[12px] font-bold text-storefront-text sm:text-sm"
                          />

                          {plan.pricingMethod ===
                            "PERCENTAGE" &&
                          plan.percentage !==
                            null ? (
                            <p className="mt-0.5 text-[10px] text-storefront-muted">
                              {
                                plan.percentage
                              }
                              %
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(
                false
              )
            }
            className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-storefront-primary px-5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-7 sm:text-base"
          >
            <ShoppingCart
              size={21}
            />

            {isUnavailable
              ? "Unavailable"
              : "Add to Cart"}
          </button>

          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(true)
            }
            className="mt-3 h-12 w-full rounded-xl border border-[#d9dde3] bg-white text-sm font-bold text-storefront-primary transition hover:bg-storefront-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>

          <button
            type="button"
            onClick={
              toggleWishlist
            }
            aria-pressed={
              isWishlisted
            }
            className={[
              "mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold transition",
              isWishlisted
                ? "border-[#bfc5cc] bg-storefront-primary text-white"
                : "border-[#d9dde3] bg-white text-storefront-text hover:border-[#bfc5cc]",
            ].join(
              " "
            )}
          >
            <Heart
              size={17}
              fill={
                isWishlisted
                  ? "currentColor"
                  : "none"
              }
            />

            {isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"}
          </button>

          {addedMessage ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              {
                addedMessage
              }
            </p>
          ) : null}
        </div>
      </div>

      <div className="hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[1fr_1fr_auto] gap-2">
          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(
                false
              )
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-storefront-primary px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart
              size={17}
            />

            {isUnavailable
              ? "Unavailable"
              : "Add to Cart"}
          </button>

          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(true)
            }
            className="h-12 rounded-xl border border-[#d9dde3] bg-white px-3 text-xs font-black text-storefront-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>

          <button
            type="button"
            onClick={
              toggleWishlist
            }
            aria-pressed={
              isWishlisted
            }
            aria-label={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
            className={[
              "flex h-12 w-12 items-center justify-center rounded-xl border transition",
              isWishlisted
                ? "border-[#bfc5cc] bg-storefront-primary text-white"
                : "border-[#d9dde3] bg-white text-storefront-text",
            ].join(
              " "
            )}
          >
            <Heart
              size={18}
              fill={
                isWishlisted
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    </section>

    </>
  );
}