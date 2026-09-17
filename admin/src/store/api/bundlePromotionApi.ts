import { baseApi } from "./baseApi";
import type { Bundle, BundleConfig, BundleConfigListResponse, BundleConfigResponse, BundleItem, BundleItemListResponse, BundleItemResponse, BundleListResponse, BundleResponse } from "@/types/bundlePromotion";

const BASE = "/bundle-promotions";
const configBody = (v:BundleConfig) => ({ productId:v.productId, productVariantId:v.productVariantId||null, channelCode:v.channelCode, bundlesOptional:v.bundlesOptional, maxBundleSelectionsPerUnit:Number(v.maxBundleSelectionsPerUnit||1), maxBundlesDisplayed:Number(v.maxBundlesDisplayed||4), isActive:v.isActive });
const bundleBody = (v:Bundle) => ({ code:v.code.trim(), name:v.name.trim(), description:v.description?.trim()||null, priceMode:v.priceMode, priceAmount:v.priceMode==="FREE"?null:Number(v.priceAmount||0), currencyCode:v.currencyCode||"AED", startsAt:v.startsAt||null, endsAt:v.endsAt||null, badgeText:v.badgeText?.trim()||null, isDefault:v.isDefault, sortOrder:Number(v.sortOrder||0), isActive:v.isActive });
const itemBody = (v:BundleItem) => ({ itemType:v.itemType, productId:v.itemType==="PRODUCT"?(v.productId||null):null, productVariantId:v.itemType==="PRODUCT"?(v.productVariantId||null):null, protectionSchemeId:v.itemType==="PROTECTION_PLAN"?(v.protectionSchemeId||null):null, label:v.label.trim(), description:v.description?.trim()||null, quantity:Number(v.quantity||1), isIncluded:v.isIncluded, sortOrder:Number(v.sortOrder||0), isActive:v.isActive });

export const bundlePromotionApi = baseApi.injectEndpoints({ endpoints:(builder)=>({
  getBundleConfigs: builder.query<BundleConfigListResponse, {page?:number;pageSize?:number;channelCode?:string;isActive?:boolean}|void>({ query:(params)=>({url:BASE,params:params||undefined}) }),
  getBundleConfig: builder.query<BundleConfigResponse,string>({ query:(id)=>({url:`${BASE}/${id}`}) }),
  createBundleConfig: builder.mutation<BundleConfigResponse,BundleConfig>({ query:(value)=>({url:BASE,method:"POST",body:configBody(value)}) }),
  updateBundleConfig: builder.mutation<BundleConfigResponse,{id:string;value:BundleConfig}>({ query:({id,value})=>({url:`${BASE}/${id}`,method:"PUT",body:configBody(value)}) }),
  changeBundleConfigStatus: builder.mutation<BundleConfigResponse,{id:string;isActive:boolean}>({ query:({id,isActive})=>({url:`${BASE}/${id}/status`,method:"PATCH",body:{isActive}}) }),
  deleteBundleConfig: builder.mutation<{success:boolean;message?:string},string>({ query:(id)=>({url:`${BASE}/${id}`,method:"DELETE"}) }),
  getBundles: builder.query<BundleListResponse,string>({ query:(configId)=>({url:`${BASE}/${configId}/bundles`}) }),
  createBundle: builder.mutation<BundleResponse,{configId:string;value:Bundle}>({ query:({configId,value})=>({url:`${BASE}/${configId}/bundles`,method:"POST",body:bundleBody(value)}) }),
  updateBundle: builder.mutation<BundleResponse,{bundleId:string;value:Bundle}>({ query:({bundleId,value})=>({url:`${BASE}/bundles/${bundleId}`,method:"PUT",body:bundleBody(value)}) }),
  deleteBundle: builder.mutation<{success:boolean;message?:string},string>({ query:(bundleId)=>({url:`${BASE}/bundles/${bundleId}`,method:"DELETE"}) }),
  getBundleItems: builder.query<BundleItemListResponse,string>({ query:(bundleId)=>({url:`${BASE}/bundles/${bundleId}/items`}) }),
  createBundleItem: builder.mutation<BundleItemResponse,{bundleId:string;value:BundleItem}>({ query:({bundleId,value})=>({url:`${BASE}/bundles/${bundleId}/items`,method:"POST",body:itemBody(value)}) }),
  updateBundleItem: builder.mutation<BundleItemResponse,{itemId:string;value:BundleItem}>({ query:({itemId,value})=>({url:`${BASE}/items/${itemId}`,method:"PUT",body:itemBody(value)}) }),
  deleteBundleItem: builder.mutation<{success:boolean;message?:string},string>({ query:(itemId)=>({url:`${BASE}/items/${itemId}`,method:"DELETE"}) }),
}), overrideExisting:false });

export const { useGetBundleConfigsQuery,useGetBundleConfigQuery,useCreateBundleConfigMutation,useUpdateBundleConfigMutation,useChangeBundleConfigStatusMutation,useDeleteBundleConfigMutation,useGetBundlesQuery,useCreateBundleMutation,useUpdateBundleMutation,useDeleteBundleMutation,useGetBundleItemsQuery,useCreateBundleItemMutation,useUpdateBundleItemMutation,useDeleteBundleItemMutation } = bundlePromotionApi;
