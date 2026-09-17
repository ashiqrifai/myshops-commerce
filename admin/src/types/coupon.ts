export type CouponDiscountType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface Coupon {
  id:string;
  companyId:string;
  code:string;
  name:string;
  description:string|null;
  discountType:CouponDiscountType;
  discountValue:number|string;
  minimumOrderAmount:number|string;
  maximumDiscountAmount:number|string|null;
  currencyCode:string;
  channelCode:string;
  usageLimit:number|null;
  perCustomerLimit:number|null;
  firstOrderOnly:boolean;
  validFrom:string|null;
  validUntil:string|null;
  isActive:boolean;
  createdAt:string;
  updatedAt:string;
}

export interface CouponFormValues {
  code:string;
  name:string;
  description:string|null;
  discountType:CouponDiscountType;
  discountValue:number;
  minimumOrderAmount:number;
  maximumDiscountAmount:number|null;
  currencyCode:string;
  channelCode:string;
  usageLimit:number|null;
  perCustomerLimit:number|null;
  firstOrderOnly:boolean;
  validFrom:string|null;
  validUntil:string|null;
  isActive:boolean;
}

export interface CouponListParams {
  page?:number;
  pageSize?:number;
  search?:string;
  discountType?:CouponDiscountType|"";
  channelCode?:string;
  isActive?:boolean;
}

export interface CouponPagination { page:number; pageSize:number; totalItems:number; totalPages:number; }
export interface CouponListResponse { success:boolean; data:Coupon[]; pagination:CouponPagination; }
export interface CouponResponse { success:boolean; message?:string; data:Coupon; }
export interface DeleteCouponResponse { success:boolean; message?:string; data:{id:string}; }
