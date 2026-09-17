const {Op}=require("sequelize");
const db=require("../../models");
const plain=x=>!x?null:(typeof x.get==="function"?x.get({plain:true}):x);
const num=x=>x==null?null:Number(x);

const itemPayload=x=>{
  const r=plain(x); if(!r)return null;
  return {
    id:r.id,itemType:r.itemType,productId:r.productId||null,productVariantId:r.productVariantId||null,
    protectionSchemeId:r.protectionSchemeId||null,label:r.label,description:r.description||null,
    quantity:Number(r.quantity||1),isIncluded:r.isIncluded===true,sortOrder:Number(r.sortOrder||0),
    product:r.product?{id:r.product.id,name:r.product.name,slug:r.product.slug,productType:r.product.productType,parentSku:r.product.parentSku||null}:null,
    productVariant:r.productVariant?{id:r.productVariant.id,productId:r.productVariant.productId,sku:r.productVariant.sku,barcode:r.productVariant.barcode||null,name:r.productVariant.name,isDefault:r.productVariant.isDefault===true}:null,
    protectionScheme:r.protectionScheme?{
      id:r.protectionScheme.id,code:r.protectionScheme.code,name:r.protectionScheme.name,
      schemeType:r.protectionScheme.schemeType,description:r.protectionScheme.description||null,
      durationMonths:r.protectionScheme.durationMonths??null,pricingMethod:r.protectionScheme.pricingMethod,
      percentage:num(r.protectionScheme.percentage),fixedAmount:num(r.protectionScheme.fixedAmount),
      currencyCode:r.protectionScheme.currencyCode||"AED",coverageStartMode:r.protectionScheme.coverageStartMode,
      validFrom:r.protectionScheme.validFrom||null,validUntil:r.protectionScheme.validUntil||null
    }:null
  };
};
const bundlePayload=x=>{const r=plain(x);return !r?null:{
  id:r.id,code:r.code,name:r.name,description:r.description||null,priceMode:r.priceMode,
  priceAmount:r.priceMode==="FREE"?null:num(r.priceAmount),currencyCode:r.currencyCode||"AED",
  startsAt:r.startsAt||null,endsAt:r.endsAt||null,badgeText:r.badgeText||null,
  isDefault:r.isDefault===true,sortOrder:Number(r.sortOrder||0),items:(r.items||[]).map(itemPayload).filter(Boolean)
}};
const activeDates=(from,to,now)=>({[Op.and]:[
  {[Op.or]:[{[from]:{[Op.is]:null}},{[from]:{[Op.lte]:now}}]},
  {[Op.or]:[{[to]:{[Op.is]:null}},{[to]:{[Op.gte]:now}}]}
]});

async function load({companyId,productId,productVariantId,channelCode,now}){
  return db.BundlePromotionConfig.findOne({
    where:{companyId,productId,channelCode,isActive:true,productVariantId:productVariantId||{[Op.is]:null}},
    include:[{
      model:db.BundlePromotion,as:"bundles",required:false,separate:true,
      where:{isActive:true,...activeDates("startsAt","endsAt",now)},
      order:[["sortOrder","ASC"],["createdAt","ASC"]],
      include:[{
        model:db.BundlePromotionItem,as:"items",required:false,separate:true,
        where:{isActive:true,isIncluded:true},order:[["sortOrder","ASC"],["createdAt","ASC"]],
        include:[
          {model:db.Product,as:"product",required:false,where:{companyId,status:"ACTIVE"}},
          {model:db.ProductVariant,as:"productVariant",required:false,where:{status:"ACTIVE"}},
          {model:db.ProtectionScheme,as:"protectionScheme",required:false,
           where:{companyId,isActive:true,...activeDates("validFrom","validUntil",now)}}
        ]
      }]
    }]
  });
}
function build(config,source){
  const r=plain(config); if(!r)return null;
  let bundles=(r.bundles||[]).map(bundlePayload).filter(Boolean).map(b=>({
    ...b,items:b.items.filter(i=>i.itemType==="TEXT"||(i.itemType==="PRODUCT"&&i.product)||(i.itemType==="PROTECTION_PLAN"&&i.protectionScheme))
  })).filter(b=>b.items.length);
  if(r.maxBundlesDisplayed!=null)bundles=bundles.slice(0,Number(r.maxBundlesDisplayed));
  if(!bundles.length)return null;
  return {configId:r.id,source,productId:r.productId,productVariantId:r.productVariantId||null,
    channelCode:r.channelCode,bundlesOptional:r.bundlesOptional===true,
    maxBundleSelectionsPerUnit:Number(r.maxBundleSelectionsPerUnit||1),
    maxBundlesDisplayed:r.maxBundlesDisplayed==null?null:Number(r.maxBundlesDisplayed),bundles};
}
async function resolveForVariant({companyId,productId,productVariantId,channelCode="WEBSITE",effectiveDate=new Date()}){
  const now=effectiveDate instanceof Date?effectiveDate:new Date(effectiveDate);
  if(productVariantId){
    const exact=build(await load({companyId,productId,productVariantId,channelCode,now}),"VARIANT");
    if(exact)return exact;
  }
  return build(await load({companyId,productId,productVariantId:null,channelCode,now}),"PRODUCT");
}
async function resolveForVariants({companyId,productId,productVariantIds,channelCode="WEBSITE",effectiveDate=new Date()}){
  const ids=[...new Set((productVariantIds||[]).filter(Boolean))];
  return Object.fromEntries(await Promise.all(ids.map(async id=>[id,await resolveForVariant({companyId,productId,productVariantId:id,channelCode,effectiveDate})])));
}
module.exports={resolveForVariant,resolveForVariants};
