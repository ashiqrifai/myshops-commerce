const { Op }=require("sequelize");
const db=require("../models");
const money=v=>Number(Number(v||0).toFixed(4));
const fail=(m,s,c)=>{const e=new Error(m);e.statusCode=s;e.code=c;throw e};
const dateWhere=(a,b,n)=>({[Op.and]:[
 {[Op.or]:[{[a]:{[Op.is]:null}},{[a]:{[Op.lte]:n}}]},
 {[Op.or]:[{[b]:{[Op.is]:null}},{[b]:{[Op.gte]:n}}]}
]});
const normalize=item=>{
 const x=item?.bundleSelections;if(x==null)return[];
 if(!Array.isArray(x))fail("bundleSelections must be an array.",400,"BUNDLE_SELECTIONS_INVALID");
 return x.map((s,i)=>{const id=String(s?.bundlePromotionId||"").trim(),q=Number(s?.selectionQuantity??1);
  if(!id)fail(`bundleSelections[${i}].bundlePromotionId is required.`,400,"BUNDLE_PROMOTION_ID_REQUIRED");
  if(!Number.isInteger(q)||q<1||q>999)fail(`bundleSelections[${i}].selectionQuantity is invalid.`,400,"BUNDLE_SELECTION_QUANTITY_INVALID");
  return{bundlePromotionId:id,selectionQuantity:q};
 });
};
async function getConfig(o){
 const common={companyId:o.companyId,productId:o.productId,channelCode:o.channelCode,isActive:true};
 if(o.productVariantId){const c=await db.BundlePromotionConfig.findOne({where:{...common,productVariantId:o.productVariantId},transaction:o.transaction});if(c)return{config:c,source:"VARIANT"}}
 const c=await db.BundlePromotionConfig.findOne({where:{...common,productVariantId:{[Op.is]:null}},transaction:o.transaction});
 return{config:c,source:"PRODUCT"};
}
async function getBundle(o){
 return db.BundlePromotion.findOne({where:{id:o.id,companyId:o.companyId,configId:o.configId,isActive:true,...dateWhere("startsAt","endsAt",o.now)},
  include:[{model:db.BundlePromotionItem,as:"items",required:false,separate:true,where:{isActive:true,isIncluded:true},order:[["sortOrder","ASC"]],
   include:[
    {model:db.Product,as:"product",required:false,where:{companyId:o.companyId,status:"ACTIVE"}},
    {model:db.ProductVariant,as:"productVariant",required:false,where:{companyId:o.companyId,status:"ACTIVE"}},
    {model:db.ProtectionScheme,as:"protectionScheme",required:false,where:{companyId:o.companyId,isActive:true,...dateWhere("validFrom","validUntil",o.now)}}
   ]}],transaction:o.transaction});
}
const snap=(i,sq)=>{
 const q=Number(i.quantity||1);if(!Number.isInteger(q)||q<1)fail("Bundle item quantity is invalid.",409,"BUNDLE_ITEM_QUANTITY_INVALID");
 if(i.itemType==="PRODUCT"&&(!i.product||(i.productVariantId&&!i.productVariant)))fail(`Bundle product item ${i.label} is unavailable.`,409,"BUNDLE_PRODUCT_ITEM_UNAVAILABLE");
 if(i.itemType==="PROTECTION_PLAN"&&!i.protectionScheme)fail(`Bundle protection item ${i.label} is unavailable.`,409,"BUNDLE_PROTECTION_ITEM_UNAVAILABLE");
 return{bundlePromotionItemId:i.id,itemType:i.itemType,productId:i.productId||null,productVariantId:i.productVariantId||null,
  protectionSchemeId:i.protectionSchemeId||null,sku:i.productVariant?.sku||null,productName:i.product?.name||null,variantName:i.productVariant?.name||null,
  protectionSchemeCode:i.protectionScheme?.code||null,protectionSchemeName:i.protectionScheme?.name||null,protectionSchemeType:i.protectionScheme?.schemeType||null,
  protectionDurationMonths:i.protectionScheme?.durationMonths??null,protectionCoverageStartMode:i.protectionScheme?.coverageStartMode||null,
  label:i.label,description:i.description||null,quantityPerBundle:q,selectionQuantity:sq,totalQuantity:q*sq,isIncluded:true,sortOrder:Number(i.sortOrder||0)};
};
async function resolveBundleSelections(o){
 const selections=normalize(o.requestedItem);if(!selections.length)return{configId:null,source:null,selections:[],bundleChargeAmount:0};
 const mainQty=Number(o.mainQuantity);if(!Number.isInteger(mainQty)||mainQty<1)fail("Main quantity is invalid.",400,"BUNDLE_MAIN_QUANTITY_INVALID");
 const found=await getConfig({...o,channelCode:o.channelCode||"WEBSITE"});
 if(!found.config)fail("No active bundle configuration is available.",409,"BUNDLE_CONFIG_NOT_AVAILABLE");
 const total=selections.reduce((n,s)=>n+s.selectionQuantity,0),max=mainQty*Number(found.config.maxBundleSelectionsPerUnit||1);
 if(total>max)fail(`A maximum of ${max} bundle selection(s) is allowed.`,409,"BUNDLE_SELECTION_LIMIT_EXCEEDED");
 if(new Set(selections.map(x=>x.bundlePromotionId)).size!==selections.length)fail("Duplicate bundle selection; increase selectionQuantity instead.",400,"BUNDLE_SELECTION_DUPLICATE");
 let bundleChargeAmount=0;const resolved=[];const now=o.effectiveDate||new Date();
 for(const s of selections){
  const b=await getBundle({companyId:o.companyId,configId:found.config.id,id:s.bundlePromotionId,now,transaction:o.transaction});
  if(!b)fail("Selected bundle is no longer available.",409,"BUNDLE_PROMOTION_NOT_AVAILABLE");

  const items=(b.items||[]).map(i=>snap(i,s.selectionQuantity));
  if(!items.length)fail("Selected bundle has no available items.",409,"BUNDLE_ITEMS_NOT_AVAILABLE");

  const mode=String(b.priceMode||"FREE").toUpperCase();
  const amount=b.priceAmount==null?null:money(b.priceAmount);
  let chargedUnitAmount=0;

  if(mode==="ADD_ON"){
   if(amount==null||amount<0)fail("ADD_ON price is invalid.",409,"BUNDLE_PRICE_INVALID");
   chargedUnitAmount=amount;
  }
  else if(mode==="FREE"){
   chargedUnitAmount=0;
  }
  else if(mode==="FIXED_TOTAL"){
   if(amount==null||amount<0)fail("FIXED_TOTAL price is invalid.",409,"BUNDLE_PRICE_INVALID");

   if(selections.length!==1)
    fail(
     "FIXED_TOTAL bundle must be the only bundle promotion selected on this cart line.",
     409,
     "BUNDLE_FIXED_TOTAL_EXCLUSIVE"
    );

   if(s.selectionQuantity!==mainQty)
    fail(
     "FIXED_TOTAL bundle must apply to the full main-product quantity.",
     409,
     "BUNDLE_FIXED_TOTAL_QUANTITY_INVALID"
    );

   const mainUnitPrice=Number(o.mainUnitPrice);

   if(!Number.isFinite(mainUnitPrice)||mainUnitPrice<0)
    fail(
     "Main product price is invalid for FIXED_TOTAL bundle calculation.",
     409,
     "BUNDLE_MAIN_PRICE_INVALID"
    );

   chargedUnitAmount=money(
    amount-mainUnitPrice
   );
  }
  else{
   fail("Unsupported bundle price mode.",409,"BUNDLE_PRICE_MODE_INVALID");
  }

  const chargedAmount=money(
   chargedUnitAmount*s.selectionQuantity
  );

  bundleChargeAmount=money(
   bundleChargeAmount+chargedAmount
  );

  resolved.push({
   configId:found.config.id,
   bundlePromotionId:b.id,
   bundleCode:b.code,
   bundleName:b.name,
   bundleDescription:b.description||null,
   priceMode:mode,
   priceAmount:amount,
   chargedUnitAmount,
   selectionQuantity:s.selectionQuantity,
   chargedAmount,
   currencyCode:b.currencyCode||o.currencyCode||"AED",
   source:found.source,
   badgeText:b.badgeText||null,
   startsAt:b.startsAt||null,
   endsAt:b.endsAt||null,
   items
  });
 }
 return{
  configId:found.config.id,
  source:found.source,
  selections:resolved,
  bundleChargeAmount
 };
}
module.exports={resolveBundleSelections};
