import type { Metadata } from "next";
import Link from "next/link";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";
import ProductListingFilters,{type ProductListingFiltersData} from "@/components/storefront/product-listing/ProductListingFilters";
import ProductListingToolbar from "@/components/storefront/product-listing/ProductListingToolbar";
import { getStorefrontPage } from "@/lib/storefront/storefront-api";
import { splitGlobalStorefrontSections } from "@/lib/storefront/storefront-sections";
import type { StorefrontProduct,StorefrontSection } from "@/types/storefront";

export const metadata:Metadata={title:"Bestsellers | MyShops",description:"Shop bestselling products at MyShops UAE.",alternates:{canonical:"/products/bestsellers"}};
interface Props{searchParams:Promise<Record<string,string|string[]|undefined>>}
interface Content{title?:string;subtitle?:string;productIds?:string[];productIdsResolved?:StorefrontProduct[]}
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
const csv=(v:string|string[]|undefined)=>{const x=one(v);return x?x.split(",").map(s=>s.trim()).filter(Boolean):[]};
const num=(v:string|string[]|undefined)=>{const x=one(v);if(x===undefined||x==="")return null;const n=Number(x);return Number.isFinite(n)?n:null};
const pageno=(v:string|string[]|undefined)=>{const n=Number(one(v)||1);return Number.isFinite(n)&&n>=1?Math.floor(n):1};
const norm=(v:unknown)=>String(v||"").trim().toLowerCase();
const find=(ss:StorefrontSection[])=>ss.find(s=>{const c=(s.content||{}) as Content,t=norm(c.title);return norm(s.type?.code)==="product_carousel"&&(t==="bestsellers"||t==="best sellers"||t.includes("bestseller"))})||null;

const buildFilters=(ps:StorefrontProduct[]):ProductListingFiltersData=>{
 const cm=new Map<string,{id:string;label:string;count:number}>(),bm=new Map<string,{id:string;label:string;count:number}>(),prices:number[]=[];let currencyCode="AED";
 for(const p of ps){if(p.primaryCategory?.id){const x=cm.get(p.primaryCategory.id);x?x.count++:cm.set(p.primaryCategory.id,{id:p.primaryCategory.id,label:p.primaryCategory.name,count:1})}if(p.brand?.id){const x=bm.get(p.brand.id);x?x.count++:bm.set(p.brand.id,{id:p.brand.id,label:p.brand.name,count:1})}const n=Number(p.price?.sellingPrice);if(Number.isFinite(n))prices.push(n);if(p.price?.currencyCode)currencyCode=p.price.currencyCode}
 return {categories:[...cm.values()].sort((a,b)=>a.label.localeCompare(b.label)),brands:[...bm.values()].sort((a,b)=>a.label.localeCompare(b.label)),minimumPrice:prices.length?Math.min(...prices):null,maximumPrice:prices.length?Math.max(...prices):null,currencyCode};
};
const applyFilters=(ps:StorefrontProduct[],q:{search:string;categoryIds:string[];brandIds:string[];minPrice:number|null;maxPrice:number|null})=>{
 const s=norm(q.search),cs=new Set(q.categoryIds),bs=new Set(q.brandIds);
 return ps.filter(p=>{if(s){const h=[p.name,p.parentSku,p.defaultVariant?.sku,p.defaultVariant?.barcode,p.brand?.name,p.primaryCategory?.name].filter(Boolean).join(" ").toLowerCase();if(!h.includes(s))return false}if(cs.size&&(!p.primaryCategory?.id||!cs.has(p.primaryCategory.id)))return false;if(bs.size&&(!p.brand?.id||!bs.has(p.brand.id)))return false;const r=p.price?.sellingPrice,n=r!=null&&Number.isFinite(Number(r))?Number(r):null;if(q.minPrice!==null&&(n===null||n<q.minPrice))return false;if(q.maxPrice!==null&&(n===null||n>q.maxPrice))return false;return true});
};
const sortProducts=(ps:StorefrontProduct[],s:string)=>{const r=[...ps],price=(p:StorefrontProduct)=>{const n=Number(p.price?.sellingPrice);return Number.isFinite(n)?n:Number.POSITIVE_INFINITY};if(s==="PRICE_ASC")r.sort((a,b)=>price(a)-price(b));else if(s==="PRICE_DESC")r.sort((a,b)=>price(b)-price(a));else if(s==="NAME_ASC")r.sort((a,b)=>a.name.localeCompare(b.name));else if(s==="NAME_DESC")r.sort((a,b)=>b.name.localeCompare(a.name));return r};
const pageUrl=(q:Record<string,string|string[]|undefined>,n:number)=>{const p=new URLSearchParams();Object.entries(q).forEach(([k,v])=>{if(k==="page"||v===undefined||v==="")return;p.set(k,Array.isArray(v)?v.join(","):v)});if(n>1)p.set("page",String(n));const x=p.toString();return x?`/products/bestsellers?${x}`:"/products/bestsellers"};

export default async function BestsellersPage({searchParams}:Props){
 const q=await searchParams,storefront=await getStorefrontPage({slug:"/",channel:"WEBSITE"}),global=splitGlobalStorefrontSections(storefront.page.sections),section=find(global.pageSections),content=(section?.content||{}) as Content,all=Array.isArray(content.productIdsResolved)?content.productIdsResolved:[],filters=buildFilters(all);
 let products=applyFilters(all,{search:one(q.search)||"",categoryIds:csv(q.categoryIds),brandIds:csv(q.brandIds),minPrice:num(q.minPrice),maxPrice:num(q.maxPrice)});
 products=sortProducts(products,String(one(q.sort)||"FEATURED").toUpperCase());
 const size=24,total=products.length,pages=Math.max(1,Math.ceil(total/size)),page=Math.min(pageno(q.page),pages),start=(page-1)*size,shown=products.slice(start,start+size),from=total?start+1:0,to=total?Math.min(start+shown.length,total):0;
 return <StorefrontShell storefront={storefront}><StorefrontHeader storefront={storefront} announcementSection={global.announcementSection} headerSection={global.headerSection} navigationSection={global.navigationSection}/><main className="flex-1 bg-storefront-background"><div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8"><div className="border-b border-storefront-border-light pb-6"><h1 className="text-3xl font-black sm:text-4xl">Bestsellers</h1>{content.subtitle?<p className="mt-2 text-sm text-storefront-muted">{content.subtitle}</p>:null}<p className="mt-2 text-sm text-storefront-muted">{all.length} {all.length===1?"product":"products"}</p></div><section className="mt-7"><div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]"><aside className="hidden self-start rounded-2xl border border-storefront-border-light bg-storefront-surface p-5 lg:sticky lg:top-24 lg:block"><ProductListingFilters filters={filters}/></aside><div className="min-w-0"><ProductListingToolbar totalItems={total} filters={filters} searchPlaceholder="Search bestsellers"/>{total?<p className="mb-5 text-sm text-storefront-muted">Showing {from} - {to} of {total}</p>:null}{shown.length?<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{shown.map(p=><StorefrontProductCard key={p.id} product={p}/>)}</div>:<div className="rounded-2xl border border-storefront-border-light bg-storefront-surface px-6 py-16 text-center"><h2 className="text-xl font-bold">No products found</h2><p className="mt-2 text-sm text-storefront-muted">Try changing or clearing your filters.</p><Link href="/products/bestsellers" className="mt-6 inline-flex h-11 items-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-bold text-white">Clear filters</Link></div>}{pages>1?<nav className="mt-10 flex items-center justify-center gap-3">{page>1?<Link href={pageUrl(q,page-1)} className="h-11 rounded-storefront-button border px-5 py-3 text-sm">Previous</Link>:null}<span className="text-sm text-storefront-muted">Page {page} of {pages}</span>{page<pages?<Link href={pageUrl(q,page+1)} className="h-11 rounded-storefront-button bg-storefront-primary px-5 py-3 text-sm font-bold text-white">Next</Link>:null}</nav>:null}</div></div></section></div></main><StorefrontFooter storefront={storefront}/></StorefrontShell>;
}
