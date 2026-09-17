import { baseApi } from "./baseApi";
import type {
  GiftVoucherPromotionFormValues,
  GiftVoucherPromotionListParams,
  GiftVoucherPromotionListResponse,
  GiftVoucherPromotionResponse,
} from "@/types/giftVoucherPromotion";

const GV_BASE = "/gift-voucher-promotions";

const toIso = (value: string) => {
  if (!value) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const buildPayload = (values: GiftVoucherPromotionFormValues) => ({
  code: values.code.trim(),
  name: values.name.trim(),
  description: values.description.trim() || null,
  discountType: values.discountType,
  discountValue: Number(values.discountValue),
  fundingType: values.fundingType,
  fundingSource: values.fundingSource.trim() || null,
  currencyCode: values.currencyCode || "AED",
  channelCode: values.channelCode || "WEBSITE",
  validFrom: toIso(values.validFrom),
  validUntil: toIso(values.validUntil),
  priority: Number(values.priority || 100),
  isActive: values.isActive,
  items: values.items.map((item) => ({
    productId: item.productId,
    productVariantId: item.productVariantId || null,
    isActive: item.isActive !== false,
  })),
});

export const giftVoucherPromotionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGiftVoucherPromotions: builder.query<GiftVoucherPromotionListResponse, GiftVoucherPromotionListParams>({
      query: (params) => ({ url: GV_BASE, params }),
    }),
    getGiftVoucherPromotionById: builder.query<GiftVoucherPromotionResponse, string>({
      query: (id) => ({ url: `${GV_BASE}/${id}` }),
    }),
    createGiftVoucherPromotion: builder.mutation<GiftVoucherPromotionResponse, GiftVoucherPromotionFormValues>({
      query: (values) => ({ url: GV_BASE, method: "POST", body: buildPayload(values) }),
    }),
    updateGiftVoucherPromotion: builder.mutation<GiftVoucherPromotionResponse, { id: string; values: GiftVoucherPromotionFormValues }>({
      query: ({ id, values }) => ({ url: `${GV_BASE}/${id}`, method: "PUT", body: buildPayload(values) }),
    }),
    changeGiftVoucherPromotionStatus: builder.mutation<GiftVoucherPromotionResponse, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `${GV_BASE}/${id}/status`, method: "PATCH", body: { isActive } }),
    }),
    deleteGiftVoucherPromotion: builder.mutation<{ success: boolean; message?: string; data: { id: string } }, string>({
      query: (id) => ({ url: `${GV_BASE}/${id}`, method: "DELETE" }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGiftVoucherPromotionsQuery,
  useGetGiftVoucherPromotionByIdQuery,
  useCreateGiftVoucherPromotionMutation,
  useUpdateGiftVoucherPromotionMutation,
  useChangeGiftVoucherPromotionStatusMutation,
  useDeleteGiftVoucherPromotionMutation,
} = giftVoucherPromotionApi;
