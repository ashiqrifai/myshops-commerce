"use client";
import { useRouter } from "next/navigation";
import { CouponForm } from "@/components/admin/coupons";
import { useCreateCouponMutation } from "@/store/api/couponApi";
import type { CouponFormValues } from "@/types/coupon";

export default function CreateCouponPage(){
  const router=useRouter();
  const [createCoupon,{isLoading}]=useCreateCouponMutation();
  return <CouponForm mode="create" isSaving={isLoading} onCancel={()=>router.push("/admin/coupons")} onSubmit={async(values:CouponFormValues)=>{
    try{
      const r=await createCoupon(values).unwrap();
      window.alert(r.message||"Coupon created successfully.");
      router.push("/admin/coupons");
    }catch(e){window.alert(msg(e,"Unable to create coupon."));}
  }}/>;
}
function msg(e:unknown,f:string){if(typeof e==="object"&&e){const a=e as {data?:{message?:unknown;error?:unknown};message?:unknown};if(typeof a.data?.message==="string")return a.data.message;if(typeof a.data?.error==="string")return a.data.error;if(typeof a.message==="string")return a.message;}return f;}
