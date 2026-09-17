"use client";
import { useParams,useRouter } from "next/navigation";
import { CouponForm } from "@/components/admin/coupons";
import { useGetCouponByIdQuery,useUpdateCouponMutation } from "@/store/api/couponApi";
import type { CouponFormValues } from "@/types/coupon";

export default function EditCouponPage(){
  const router=useRouter();
  const params=useParams<{id:string}>();
  const id=typeof params.id==="string"?params.id:"";
  const {data,error,isLoading,isFetching,isError,refetch}=useGetCouponByIdQuery(id,{skip:!id});
  const [updateCoupon,{isLoading:isUpdating}]=useUpdateCouponMutation();
  const c=data?.data;

  if(isLoading||(isFetching&&!c)) return <div className="rounded-xl border bg-white p-8 text-sm text-[#6d7175]">Loading coupon...</div>;
  if(isError||!c) return <div className="rounded-xl border border-red-200 bg-red-50 p-6"><p className="font-semibold text-red-800">Unable to load coupon</p><p className="mt-2 text-sm text-red-700">{msg(error,"Coupon could not be loaded.")}</p><div className="mt-4 flex gap-2"><button onClick={()=>void refetch()} className="rounded-lg border bg-white px-4 py-2 text-sm">Try Again</button><button onClick={()=>router.push("/admin/coupons")} className="rounded-lg bg-[#303030] px-4 py-2 text-sm text-white">Back</button></div></div>;

  const initial:CouponFormValues={
    code:c.code,name:c.name,description:c.description,discountType:c.discountType,
    discountValue:Number(c.discountValue),minimumOrderAmount:Number(c.minimumOrderAmount||0),
    maximumDiscountAmount:c.maximumDiscountAmount===null?null:Number(c.maximumDiscountAmount),
    currencyCode:c.currencyCode,channelCode:c.channelCode,usageLimit:c.usageLimit,
    perCustomerLimit:c.perCustomerLimit,firstOrderOnly:c.firstOrderOnly,
    validFrom:c.validFrom,validUntil:c.validUntil,isActive:c.isActive,
  };

  return <CouponForm mode="edit" initialValues={initial} isSaving={isUpdating} onCancel={()=>router.push("/admin/coupons")} onSubmit={async(values)=>{
    try{
      const r=await updateCoupon({id,body:values}).unwrap();
      window.alert(r.message||"Coupon updated successfully.");
      router.push("/admin/coupons");
    }catch(e){window.alert(msg(e,"Unable to update coupon."));}
  }}/>;
}
function msg(e:unknown,f:string){if(typeof e==="object"&&e){const a=e as {data?:{message?:unknown;error?:unknown};message?:unknown};if(typeof a.data?.message==="string")return a.data.message;if(typeof a.data?.error==="string")return a.data.error;if(typeof a.message==="string")return a.message;}return f;}
