"use client";
import { Plus, Trash2 } from "lucide-react";
import { useMemo,useState } from "react";
import { useGetProductByIdQuery,useGetProductsQuery } from "@/store/api/productApi";
import { useGetProtectionSchemesQuery } from "@/store/api/protectionApi";
import BundleProductPicker from "./BundleProductPicker";
import type { Bundle,BundleConfig,BundleItem,BundleItemType } from "@/types/bundlePromotion";
type Variant={id:string;sku:string;name:string;status?:string|null;zohoItemId?:string|null};type Product={id:string;name:string;variants?:Variant[]};
export interface BundleFormValue extends BundleConfig{bundles:Bundle[]}
const ni=(t:BundleItemType="PRODUCT"):BundleItem=>({itemType:t,productId:null,productVariantId:null,protectionSchemeId:null,label:"",description:"",quantity:1,isIncluded:true,sortOrder:0,isActive:true});
const nb=():Bundle=>({code:"",name:"",description:"",priceMode:"FREE",priceAmount:null,currencyCode:"AED",startsAt:null,endsAt:null,badgeText:"",isDefault:false,sortOrder:0,isActive:true,items:[]});
export default function BundlePromotionForm({title,subtitle,initialValue,isSaving=false,onCancel,onSubmit}:{title:string;subtitle:string;initialValue?:BundleFormValue;isSaving?:boolean;onCancel:()=>void;onSubmit:(v:BundleFormValue)=>Promise<void>}){
 const [v,setV]=useState<BundleFormValue>(initialValue||{productId:"",productVariantId:null,channelCode:"WEBSITE",bundlesOptional:true,maxBundleSelectionsPerUnit:1,maxBundlesDisplayed:4,isActive:true,bundles:[nb()]});const [search,setSearch]=useState("");
 const {data:pr}=useGetProductsQuery({page:1,pageSize:50,status:"ACTIVE",search:search.trim()||undefined,sortBy:"name",sortDirection:"ASC"});const products=(pr?.data||[]) as unknown as Product[];
 const {data:pd}=useGetProductByIdQuery(v.productId,{skip:!v.productId});const raw=(pd as unknown as {data?:Product|{product?:Product}}|undefined)?.data;const product=raw&&"product" in raw?(raw.product||null):(raw as Product|undefined)||products.find(p=>p.id===v.productId)||null;const variants=useMemo(()=>(product?.variants||[]).filter(x=>!x.status||x.status==="ACTIVE"),[product]);
 const {data:ps}=useGetProtectionSchemesQuery({page:1,pageSize:100,isActive:true,sortBy:"sortOrder",sortDirection:"ASC"});
 const setBundle=(i:number,b:Bundle)=>setV(x=>({...x,bundles:x.bundles.map((q,n)=>n===i?b:q)}));
 const addItem=(bi:number,t:BundleItemType)=>setBundle(bi,{...v.bundles[bi],items:[...(v.bundles[bi].items||[]),ni(t)]});
 const setItem=(bi:number,ii:number,item:BundleItem)=>setBundle(bi,{...v.bundles[bi],items:(v.bundles[bi].items||[]).map((x,n)=>n===ii?item:x)});
 const save=async()=>{if(!v.productId)return alert("Select a product.");if(!v.bundles.length)return alert("Add a bundle.");for(const b of v.bundles){if(!b.code.trim()||!b.name.trim())return alert("Every bundle needs code and name.");if(!(b.items||[]).length)return alert(`Add items to ${b.name||b.code}.`);}await onSubmit(v)};
 return <div className="mx-auto max-w-7xl space-y-6 pb-12"><header className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-[#6d7175]">{subtitle}</p></div><div className="flex gap-2"><button onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={isSaving} onClick={save} className="rounded-lg bg-[#303030] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSaving?"Saving...":"Save"}</button></div></header>
 <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Applies to</h2><div className="mt-4 grid gap-4 lg:grid-cols-4"><div className="lg:col-span-2"><label className="text-sm font-medium">Product</label><input className="admin-input mt-2" placeholder="Search products" value={search} onChange={e=>setSearch(e.target.value)}/><select className="admin-input mt-2" value={v.productId} onChange={e=>setV({...v,productId:e.target.value,productVariantId:null})}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div><label className="text-sm font-medium">Variant</label><select className="admin-input mt-2" value={v.productVariantId||""} onChange={e=>setV({...v,productVariantId:e.target.value||null})}><option value="">All variants</option>{variants.map(x=><option key={x.id} value={x.id}>{x.sku} — {x.name}</option>)}</select>{v.productVariantId?<p className="mt-1 text-xs text-[#6d7175]">Zoho: {variants.find(x=>x.id===v.productVariantId)?.zohoItemId||"Not mapped"}</p>:null}</div><div><label className="text-sm font-medium">Channel</label><select className="admin-input mt-2" value={v.channelCode} onChange={e=>setV({...v,channelCode:e.target.value as "WEBSITE"|"KIOSK"})}><option>WEBSITE</option><option>KIOSK</option></select></div></div><div className="mt-4 grid gap-4 md:grid-cols-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.bundlesOptional} onChange={e=>setV({...v,bundlesOptional:e.target.checked})}/> Optional</label><input className="admin-input" type="number" min={1} value={v.maxBundleSelectionsPerUnit} onChange={e=>setV({...v,maxBundleSelectionsPerUnit:Number(e.target.value||1)})}/><input className="admin-input" type="number" min={1} value={v.maxBundlesDisplayed} onChange={e=>setV({...v,maxBundlesDisplayed:Number(e.target.value||1)})}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.isActive} onChange={e=>setV({...v,isActive:e.target.checked})}/> Active</label></div></section>
 {v.bundles.map((b,bi)=><section key={b.id||bi} className="rounded-xl border bg-white p-5"><div className="flex justify-between"><h2 className="font-semibold">Bundle {bi+1}</h2><button onClick={()=>setV({...v,bundles:v.bundles.filter((_,n)=>n!==bi)})} className="text-red-600"><Trash2 size={18}/></button></div><div className="mt-4 grid gap-3 md:grid-cols-4"><input className="admin-input" placeholder="CODE" value={b.code} onChange={e=>setBundle(bi,{...b,code:e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g,"_")})}/><input className="admin-input" placeholder="Bundle name" value={b.name} onChange={e=>setBundle(bi,{...b,name:e.target.value})}/><select className="admin-input" value={b.priceMode} onChange={e=>{const m=e.target.value as Bundle["priceMode"];setBundle(bi,{...b,priceMode:m,priceAmount:m==="FREE"?null:b.priceAmount})}}><option>FREE</option><option>ADD_ON</option><option>FIXED_TOTAL</option></select>{b.priceMode==="FREE"?<div className="admin-input text-sm text-[#6d7175]">No charge</div>:<input type="number" min={0} step="0.01" className="admin-input" placeholder="Price" value={b.priceAmount??""} onChange={e=>setBundle(bi,{...b,priceAmount:Number(e.target.value||0)})}/>}<input className="admin-input md:col-span-2" placeholder="Description" value={b.description||""} onChange={e=>setBundle(bi,{...b,description:e.target.value})}/><input className="admin-input" placeholder="Badge text" value={b.badgeText||""} onChange={e=>setBundle(bi,{...b,badgeText:e.target.value})}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.isDefault} onChange={e=>setBundle(bi,{...b,isDefault:e.target.checked})}/> Default</label></div>
 <div className="mt-5 border-t pt-5"><div className="mb-3 flex flex-wrap gap-2"><button onClick={()=>addItem(bi,"PRODUCT")} className="rounded-lg border px-3 py-2 text-xs font-semibold"><Plus size={14} className="inline"/> Product</button><button onClick={()=>addItem(bi,"PROTECTION_PLAN")} className="rounded-lg border px-3 py-2 text-xs font-semibold"><Plus size={14} className="inline"/> Protection</button><button onClick={()=>addItem(bi,"TEXT")} className="rounded-lg border px-3 py-2 text-xs font-semibold"><Plus size={14} className="inline"/> Text</button></div><div className="space-y-3">{(b.items||[]).map((it,ii)=><div key={it.id||ii} className="rounded-lg bg-[#f6f6f7] p-3"><div className="grid gap-3 md:grid-cols-5"><select className="admin-input" value={it.itemType} onChange={e=>setItem(bi,ii,ni(e.target.value as BundleItemType))}><option>PRODUCT</option><option>PROTECTION_PLAN</option><option>TEXT</option></select>{it.itemType==="PRODUCT"?(
  <BundleProductPicker
    value={{
      productId:
        it.productId ||
        null,

      productVariantId:
        it.productVariantId ||
        null,

      productName:
        it.product?.name ||
        null,

      variantName:
        it.productVariant?.name ||
        null,

      sku:
        it.productVariant?.sku ||
        null,

      zohoItemId:
        it.productVariant?.zohoItemId ||
        null,
    }}
    onChange={(selection)=>{
      setItem(
        bi,
        ii,
        {
          ...it,

          productId:
            selection.productId,

          productVariantId:
            selection.productVariantId,

          label:
            selection.variantName ||
            selection.productName ||
            it.label,

          productVariant:
            selection.productVariantId
              ? {
                  id:
                    selection.productVariantId,

                  sku:
                    selection.sku ||
                    "",

                  name:
                    selection.variantName ||
                    selection.productName ||
                    "",

                  zohoItemId:
                    selection.zohoItemId ||
                    null,
                }
              : null,
        }
      );
    }}
  />
):it.itemType==="PROTECTION_PLAN"?<select className="admin-input md:col-span-2" value={it.protectionSchemeId||""} onChange={e=>{const sc=ps?.data.find(x=>x.id===e.target.value);setItem(bi,ii,{...it,protectionSchemeId:e.target.value||null,label:sc?.name||it.label})}}><option value="">Protection plan</option>{(ps?.data||[]).map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select>:<input className="admin-input md:col-span-2" placeholder="Text label" value={it.label} onChange={e=>setItem(bi,ii,{...it,label:e.target.value})}/>}<input className="admin-input" type="number" min={1} value={it.quantity} onChange={e=>setItem(bi,ii,{...it,quantity:Number(e.target.value||1)})}/><button onClick={()=>setBundle(bi,{...b,items:(b.items||[]).filter((_,n)=>n!==ii)})} className="text-red-600"><Trash2 size={16}/></button></div>{it.productVariant?.zohoItemId?<p className="mt-1 text-xs text-emerald-700">Zoho Item ID: {it.productVariant.zohoItemId}</p>:it.itemType==="PRODUCT"&&it.productVariantId?<p className="mt-1 text-xs text-amber-700">Zoho mapping not available in current product list response.</p>:null}</div>)}</div></div></section>)}
 <button onClick={()=>setV({...v,bundles:[...v.bundles,{...nb(),sortOrder:v.bundles.length}]})} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"><Plus size={16}/> Add another bundle</button></div>;
}
