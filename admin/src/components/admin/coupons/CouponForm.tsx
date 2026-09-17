"use client";

import { useMemo,useState } from "react";
import type { CouponDiscountType,CouponFormValues } from "@/types/coupon";

const DEFAULTS:CouponFormValues={
  code:"",name:"",description:null,discountType:"PERCENTAGE",discountValue:10,
  minimumOrderAmount:0,maximumDiscountAmount:null,currencyCode:"AED",channelCode:"WEBSITE",
  usageLimit:null,perCustomerLimit:1,firstOrderOnly:false,validFrom:null,validUntil:null,isActive:true,
};

const dt=(v:string|null|undefined)=>{
  if(!v) return "";
  const d=new Date(v); if(Number.isNaN(d.getTime())) return "";
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
};
const optNum=(v:string)=>v.trim()===""?null:Number(v);

export default function CouponForm({
  mode,initialValues,isSaving=false,onCancel,onSubmit,
}:{
  mode:"create"|"edit";
  initialValues?:Partial<CouponFormValues>;
  isSaving?:boolean;
  onCancel:()=>void;
  onSubmit:(values:CouponFormValues)=>Promise<void>;
}){
  const start=useMemo(()=>({...DEFAULTS,...initialValues}),[initialValues]);
  const [v,setV]=useState(start);
  const [error,setError]=useState<string|null>(null);
  const set=<K extends keyof CouponFormValues>(k:K,val:CouponFormValues[K])=>{setV(c=>({...c,[k]:val}));setError(null);};

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    const code=v.code.trim().toUpperCase();
    const name=v.name.trim();
    if(!code){setError("Coupon code is required.");return;}
    if(!name){setError("Coupon name is required.");return;}
    if(v.discountType==="PERCENTAGE"&&(v.discountValue<=0||v.discountValue>100)){setError("Percentage discount must be greater than 0 and no more than 100.");return;}
    if(v.discountType==="FIXED"&&v.discountValue<=0){setError("Fixed discount must be greater than 0.");return;}
    if(v.validFrom&&v.validUntil&&new Date(v.validUntil)<new Date(v.validFrom)){setError("Valid until must be later than or equal to valid from.");return;}
    await onSubmit({...v,code,name,description:v.description?.trim()||null,discountValue:v.discountType==="FREE_SHIPPING"?0:Number(v.discountValue),maximumDiscountAmount:v.discountType==="FREE_SHIPPING"?null:v.maximumDiscountAmount,currencyCode:v.currencyCode.toUpperCase(),channelCode:v.channelCode.toUpperCase()});
  };

  const cls="h-10 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm text-[#303030] outline-none focus:border-[#303030]";
  return <form onSubmit={submit} className="mx-auto w-full max-w-[1100px] space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#6d7175]">Promotions</p><h1 className="mt-1 text-2xl font-semibold text-[#202223]">{mode==="create"?"New Coupon":"Edit Coupon"}</h1><p className="mt-1 text-sm text-[#6d7175]">Configure coupon value, limits and validity.</p></div>
      <div className="flex gap-2"><button type="button" onClick={onCancel} disabled={isSaving} className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold">Cancel</button><button type="submit" disabled={isSaving} className="h-10 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white">{isSaving?"Saving...":mode==="create"?"Create Coupon":"Save Changes"}</button></div>
    </div>
    {error?<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>:null}

    <Section title="Coupon details"><div className="grid gap-4 md:grid-cols-2">
      <Field label="Coupon code"><input className={cls} value={v.code} onChange={e=>set("code",e.target.value.toUpperCase().replace(/\s+/g,""))}/></Field>
      <Field label="Coupon name"><input className={cls} value={v.name} onChange={e=>set("name",e.target.value)}/></Field>
      <div className="md:col-span-2"><Field label="Description"><textarea className="min-h-[90px] w-full rounded-lg border border-[#babfc3] p-3 text-sm" value={v.description||""} onChange={e=>set("description",e.target.value)}/></Field></div>
    </div></Section>

    <Section title="Discount"><div className="grid gap-4 md:grid-cols-3">
      <Field label="Discount type"><select className={cls} value={v.discountType} onChange={e=>set("discountType",e.target.value as CouponDiscountType)}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option><option value="FREE_SHIPPING">Free shipping</option></select></Field>
      <Field label="Discount value"><input className={cls} type="number" min="0" step="0.01" disabled={v.discountType==="FREE_SHIPPING"} value={v.discountType==="FREE_SHIPPING"?0:v.discountValue} onChange={e=>set("discountValue",Number(e.target.value))}/></Field>
      <Field label="Maximum discount"><input className={cls} type="number" min="0" step="0.01" disabled={v.discountType==="FREE_SHIPPING"} value={v.maximumDiscountAmount??""} onChange={e=>set("maximumDiscountAmount",optNum(e.target.value))}/></Field>
      <Field label="Minimum order amount"><input className={cls} type="number" min="0" step="0.01" value={v.minimumOrderAmount} onChange={e=>set("minimumOrderAmount",Number(e.target.value))}/></Field>
      <Field label="Currency"><select className={cls} value={v.currencyCode} onChange={e=>set("currencyCode",e.target.value)}><option>AED</option><option>USD</option><option>SAR</option></select></Field>
      <Field label="Channel"><select className={cls} value={v.channelCode} onChange={e=>set("channelCode",e.target.value)}><option>WEBSITE</option><option>MOBILE</option><option>KIOSK</option><option>ALL</option></select></Field>
    </div></Section>

    <Section title="Usage rules"><div className="grid gap-4 md:grid-cols-2">
      <Field label="Total usage limit"><input className={cls} type="number" min="1" value={v.usageLimit??""} onChange={e=>set("usageLimit",optNum(e.target.value))}/></Field>
      <Field label="Limit per customer"><input className={cls} type="number" min="1" value={v.perCustomerLimit??""} onChange={e=>set("perCustomerLimit",optNum(e.target.value))}/></Field>
      <Check label="First order only" checked={v.firstOrderOnly} onChange={x=>set("firstOrderOnly",x)}/>
      <Check label="Active" checked={v.isActive} onChange={x=>set("isActive",x)}/>
    </div></Section>

    <Section title="Validity"><div className="grid gap-4 md:grid-cols-2">
      <Field label="Valid from"><input className={cls} type="datetime-local" value={dt(v.validFrom)} onChange={e=>set("validFrom",e.target.value?new Date(e.target.value).toISOString():null)}/></Field>
      <Field label="Valid until"><input className={cls} type="datetime-local" value={dt(v.validUntil)} onChange={e=>set("validUntil",e.target.value?new Date(e.target.value).toISOString():null)}/></Field>
    </div></Section>
  </form>;
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-xl border border-[#e1e3e5] bg-white p-5"><h2 className="mb-5 text-base font-semibold text-[#202223]">{title}</h2>{children}</section>;}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-2 block text-sm font-medium text-[#303030]">{label}</span>{children}</label>;}
function Check({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] p-4"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span className="text-sm font-semibold">{label}</span></label>;}
