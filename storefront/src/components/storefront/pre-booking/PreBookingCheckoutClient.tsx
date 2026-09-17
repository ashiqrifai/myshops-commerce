"use client";
import{useEffect,useState}from"react";
import{CreditCard,LoaderCircle,MapPin}from"lucide-react";
import{useAppSelector}from"@/store/hooks";
import{selectCustomer,selectCustomerAccessToken,selectCustomerAuthenticated}from"@/store/slices/customerAuthSlice";
import type{PublicPreBookingCheckoutSession}from"@/lib/storefront/public-pre-booking-checkout-api";
import{createPreBookingOrder}from"@/lib/storefront/public-pre-booking-order-api";
import{createNetworkInternationalHostedCheckout}from"@/lib/payments/networkInternationalApi";
import{checkTabbyPrescore,createTabbyCheckout}from"@/lib/payments/tabbyApi";

type Method="CARD"|"TABBY";
export default function PreBookingCheckoutClient({session}:{session:PublicPreBookingCheckoutSession}){
 const customer=useAppSelector(selectCustomer),token=useAppSelector(selectCustomerAccessToken),auth=useAppSelector(selectCustomerAuthenticated);
 const [method,setMethod]=useState<Method>("CARD"),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[tabbyOk,setTabbyOk]=useState(false),[checking,setChecking]=useState(false);
 const [f,setF]=useState({firstName:"",lastName:"",email:"",phone:"",addressLine1:"",addressLine2:"",emirate:"Dubai",city:"",area:"",landmark:"",notes:""});
 useEffect(()=>{if(customer)setF(v=>({...v,firstName:v.firstName||customer.firstName||"",lastName:v.lastName||customer.lastName||"",email:v.email||customer.email||"",phone:v.phone||customer.mobile||""}));},[customer]);
 useEffect(()=>{const email=f.email.trim(),phone=f.phone.trim();if(!session.campaign.paymentMethods.tabby||!email||phone.replace(/\D/g,"").length<9){setTabbyOk(false);return;}const t=setTimeout(async()=>{setChecking(true);try{const r=await checkTabbyPrescore({amount:session.pricing.totalAmount,currency:session.pricing.currencyCode,firstName:f.firstName.trim(),lastName:f.lastName.trim(),email,phone,city:f.city.trim()||f.emirate,address:[f.addressLine1,f.addressLine2,f.area,f.emirate].filter(Boolean).join(", "),lang:"en",items:[{id:session.selection.productVariantId,title:session.selection.productName,quantity:session.selection.quantity,unitPrice:session.pricing.productUnitPrice,referenceId:session.selection.sku,category:"Electronics"}]});setTabbyOk(r.eligible===true);if(r.eligible!==true&&method==="TABBY")setMethod("CARD");}catch{setTabbyOk(false);}finally{setChecking(false);}},450);return()=>clearTimeout(t);},[f.email,f.phone,f.firstName,f.lastName,f.city,f.emirate,f.addressLine1,f.addressLine2,f.area,method,session]);
 const update=(k:keyof typeof f,v:string)=>{setF(x=>({...x,[k]:v}));setError(null);};
 const submit=async()=>{if(busy)return; if(!f.firstName.trim()||!f.email.includes("@")||f.phone.replace(/\D/g,"").length<9||!f.addressLine1.trim()||!f.emirate.trim()||!f.city.trim()||!f.area.trim()){setError("Please complete your contact and delivery details.");return;}if(method==="TABBY"&&!tabbyOk){setError(checking?"Please wait while Tabby availability is checked.":"Tabby is not available for these details. Please use Card.");return;}
 setBusy(true);setError(null);try{const x=await createPreBookingOrder({publicToken:session.publicToken,customer:{firstName:f.firstName.trim(),lastName:f.lastName.trim(),email:f.email.trim(),phone:f.phone.trim()},shippingAddress:{addressLine1:f.addressLine1.trim(),addressLine2:f.addressLine2.trim(),emirate:f.emirate.trim(),city:f.city.trim(),area:f.area.trim(),landmark:f.landmark.trim()},paymentMethod:method,notes:f.notes.trim(),accessToken:auth?token:null});const orderId=x.order.id;localStorage.setItem("myshops_pending_prebooking_order_id",orderId);localStorage.setItem("myshops_pending_prebooking_token",session.publicToken);
 if(method==="CARD"){const p=await createNetworkInternationalHostedCheckout({orderId,accessToken:auth?token:null});if(!p.data?.paymentUrl)throw new Error("Network International did not return a secure payment URL.");localStorage.setItem("myshops_pending_network_order_id",orderId);window.location.assign(p.data.paymentUrl);return;}
 const t=await createTabbyCheckout(orderId);if(!t.checkoutUrl)throw new Error(t.message||"Tabby did not return a checkout URL.");localStorage.setItem("myshops_pending_tabby_order_id",orderId);window.location.assign(t.checkoutUrl);
 }catch(e){setError(e instanceof Error?e.message:"Unable to continue to payment.");setBusy(false);}};
 if(session.status==="EXPIRED")return <div className="rounded-2xl border bg-white p-6"><p className="font-bold">This reservation has expired.</p></div>;
 return <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
  <section className="rounded-[22px] border border-storefront-border bg-white p-6 sm:p-8">
   <div className="flex items-center gap-2"><MapPin size={18}/><h2 className="text-xl font-black">Contact & delivery details</h2></div>
   <div className="mt-5 grid gap-4 sm:grid-cols-2">
    {([["firstName","First name"],["lastName","Last name"],["email","Email"],["phone","Mobile"],["addressLine1","Address line 1"],["addressLine2","Address line 2"],["emirate","Emirate"],["city","City"],["area","Area"],["landmark","Landmark"]] as const).map(([k,l])=><label key={k} className={k==="addressLine1"||k==="addressLine2"?"sm:col-span-2":""}><span className="mb-1 block text-xs font-bold">{l}</span><input value={f[k]} onChange={e=>update(k,e.target.value)} className="h-11 w-full rounded-xl border border-storefront-border px-3 outline-none focus:border-[#28ABB5]"/></label>)}
   </div>
   <div className="mt-7 border-t pt-6"><div className="flex items-center gap-2"><CreditCard size={18}/><h2 className="text-xl font-black">Payment method</h2></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
     {session.campaign.paymentMethods.card&&<button type="button" onClick={()=>setMethod("CARD")} className={`rounded-xl border p-4 text-left ${method==="CARD"?"border-[#28ABB5] ring-1 ring-[#28ABB5]":"border-storefront-border"}`}><b>Credit or debit card</b><p className="mt-1 text-xs text-storefront-muted">Secure payment powered by Network International</p></button>}
     {session.campaign.paymentMethods.tabby&&<button type="button" disabled={!tabbyOk} onClick={()=>setMethod("TABBY")} className={`rounded-xl border p-4 text-left ${method==="TABBY"?"border-[#28ABB5] ring-1 ring-[#28ABB5]":"border-storefront-border"} disabled:opacity-50`}><b>Pay Later with Tabby</b><p className="mt-1 text-xs text-storefront-muted">{checking?"Checking Tabby availability…":tabbyOk?"Available for these details":"Enter valid email/mobile to check eligibility"}</p></button>}
    </div>
   </div>
  </section>
  <aside className="h-fit rounded-[22px] border border-storefront-border bg-white p-6"><h2 className="text-lg font-black">Order summary</h2><p className="mt-4 font-bold">{session.selection.productName}</p><p className="text-sm text-storefront-muted">{session.selection.variantName}</p><div className="mt-5 flex justify-between border-t pt-4"><span>Total</span><b>{new Intl.NumberFormat("en-AE",{style:"currency",currency:session.pricing.currencyCode}).format(session.pricing.totalAmount)}</b></div>{error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<button type="button" onClick={submit} disabled={busy} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#28ABB5] px-4 font-black text-white disabled:bg-slate-300">{busy&&<LoaderCircle size={17} className="animate-spin"/>}{busy?"Starting payment…":method==="TABBY"?"Continue with Tabby":"Pay securely by card"}</button></aside>
 </div>;
}
