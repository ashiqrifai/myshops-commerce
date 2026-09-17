const API_URL=process.env.NEXT_PUBLIC_API_URL||"http://localhost:5080/api/v1";
const COMPANY_CODE=process.env.NEXT_PUBLIC_COMPANY_CODE||"MYSHOPS";
async function post(path:string,body:unknown,accessToken?:string|null){
  const headers:Record<string,string>={Accept:"application/json","Content-Type":"application/json","x-company-code":COMPANY_CODE};
  if(accessToken)headers.Authorization=`Bearer ${accessToken}`;
  const r=await fetch(`${API_URL}${path}`,{method:"POST",headers,credentials:"include",body:JSON.stringify(body),cache:"no-store"});
  const p=await r.json().catch(()=>null);
  if(!r.ok||p?.success!==true)throw new Error(p?.error?.message||p?.message||`Request failed. HTTP ${r.status}`);
  return p.data;
}
export const createPreBookingOrder=(x:{publicToken:string;customer:{firstName:string;lastName:string;email:string;phone:string};shippingAddress:{addressLine1:string;addressLine2:string;emirate:string;city:string;area:string;landmark:string};paymentMethod:"CARD"|"TABBY"|"TAMARA";notes?:string;accessToken?:string|null})=>
  post(`/public/pre-booking/checkout-sessions/${encodeURIComponent(x.publicToken)}/order`,{customer:x.customer,shippingAddress:x.shippingAddress,paymentMethod:x.paymentMethod,notes:x.notes||""},x.accessToken);
export const finalizePreBookingOrder=(orderId:string)=>post(`/public/pre-booking/checkout-sessions/orders/${encodeURIComponent(orderId)}/finalize`,{});
