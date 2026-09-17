const {Op}=require("sequelize");
const db=require("../../models");
const AppError=require("../../utils/AppError");
const normalizeNullable=v=>{if(v===undefined||v===null)return null;const s=String(v).trim();return s||null;};
const up=(v,f=null)=>{if(v===undefined||v===null)return f;const s=String(v).trim().toUpperCase();return s||f;};
const code=v=>String(v||"").trim().toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_+|_+$/g,"").replace(/_+/g,"_");
const date=(v,n)=>{if(v===undefined||v===null||v==="")return null;const d=v instanceof Date?v:new Date(v);if(Number.isNaN(d.getTime()))throw new AppError(`${n} is invalid.`,400,"GV_PROMOTION_DATE_INVALID");return d;};
const checkRange=(a,b)=>{if(a&&b&&new Date(b)<new Date(a))throw new AppError("Valid until must be later than or equal to valid from.",400,"GV_PROMOTION_DATE_RANGE_INVALID");};
const checkDiscount=(t,v)=>{v=Number(v);if(!Number.isFinite(v)||v<=0)throw new AppError("Gift voucher discount value must be greater than zero.",400,"GV_PROMOTION_DISCOUNT_INVALID");if(t==="PERCENTAGE"&&v>100)throw new AppError("Percentage gift voucher discount cannot exceed 100%.",400,"GV_PROMOTION_PERCENTAGE_INVALID");};
const INCLUDE=[{model:db.GiftVoucherPromotionItem,as:"items",required:false,include:[{model:db.Product,as:"product",required:false,attributes:["id","name","slug","status"]},{model:db.ProductVariant,as:"productVariant",required:false,attributes:["id","productId","sku","name","status"]}]}];
const getGiftVoucherPromotionById=async({companyId,promotionId,transaction})=>{const p=await db.GiftVoucherPromotion.findOne({where:{id:promotionId,companyId},include:INCLUDE,transaction});if(!p)throw new AppError("Gift voucher promotion not found.",404,"GV_PROMOTION_NOT_FOUND");return p;};
const ensureUniqueCode=async({companyId,code:cd,excludeId,transaction})=>{const where={companyId,code:cd};if(excludeId)where.id={[Op.ne]:excludeId};if(await db.GiftVoucherPromotion.findOne({where,transaction}))throw new AppError(`Gift voucher promotion code "${cd}" already exists.`,409,"GV_PROMOTION_CODE_EXISTS");};
const validateAssignment=async({companyId,productId,productVariantId,transaction})=>{const product=await db.Product.findOne({where:{id:productId,companyId},transaction});if(!product)throw new AppError("The selected product was not found.",404,"GV_PROMOTION_PRODUCT_NOT_FOUND");if(productVariantId){const v=await db.ProductVariant.findOne({where:{id:productVariantId,companyId,productId},transaction});if(!v)throw new AppError("The selected product variant does not belong to the selected product.",400,"GV_PROMOTION_VARIANT_INVALID");}};
const replaceItems=async({companyId,promotionId,items,userId,transaction})=>{if(!Array.isArray(items))return;const seen=new Set();for(const item of items){await validateAssignment({companyId,productId:item.productId,productVariantId:item.productVariantId||null,transaction});const k=`${item.productId}:${item.productVariantId||"ALL"}`;if(seen.has(k))throw new AppError("The same product / variant has been assigned more than once.",400,"GV_PROMOTION_DUPLICATE_ASSIGNMENT");seen.add(k);}await db.GiftVoucherPromotionItem.destroy({where:{companyId,giftVoucherPromotionId:promotionId},transaction});if(items.length)await db.GiftVoucherPromotionItem.bulkCreate(items.map(i=>({companyId,giftVoucherPromotionId:promotionId,productId:i.productId,productVariantId:i.productVariantId||null,isActive:i.isActive!==false,createdBy:userId||null,updatedBy:userId||null})),{transaction});};
const listGiftVoucherPromotions=async({companyId,page=1,pageSize=30,search,fundingType,discountType,channelCode,isActive,validOn,sortBy="priority",sortDirection="ASC"})=>{page=Math.max(1,Number(page)||1);pageSize=Math.min(200,Math.max(1,Number(pageSize)||30));const where={companyId};if(search)where[Op.or]=["code","name","description","fundingSource"].map(f=>({[f]:{[Op.iLike]:`%${search}%`}}));if(fundingType)where.fundingType=up(fundingType);if(discountType)where.discountType=up(discountType);if(channelCode)where.channelCode=up(channelCode);if(typeof isActive==="boolean")where.isActive=isActive;if(validOn){const d=date(validOn,"Valid on");where[Op.and]=[{validFrom:{[Op.lte]:d}},{validUntil:{[Op.gte]:d}}];}const allowed=new Set(["code","name","discountType","discountValue","fundingType","fundingSource","validFrom","validUntil","priority","isActive","createdAt","updatedAt"]);const result=await db.GiftVoucherPromotion.findAndCountAll({where,distinct:true,include:INCLUDE,limit:pageSize,offset:(page-1)*pageSize,order:[[allowed.has(sortBy)?sortBy:"priority",up(sortDirection)==="DESC"?"DESC":"ASC"],["priority","ASC"],["createdAt","DESC"]]});return{rows:result.rows,pagination:{page,pageSize,totalItems:result.count,totalPages:Math.ceil(result.count/pageSize)}};};
const createGiftVoucherPromotion=async({companyId,userId,payload})=>{const tx=await db.sequelize.transaction();try{const name=String(payload.name||"").trim();const cd=code(payload.code||name);if(!name)throw new AppError("Gift voucher promotion name is required.",400,"GV_PROMOTION_NAME_REQUIRED");if(!cd)throw new AppError("Gift voucher promotion code is required.",400,"GV_PROMOTION_CODE_REQUIRED");const discountType=up(payload.discountType,"FIXED_AMOUNT");const fundingType=up(payload.fundingType,"INTERNAL");const validFrom=date(payload.validFrom,"Valid from");const validUntil=date(payload.validUntil,"Valid until");if(!validFrom||!validUntil)throw new AppError("Gift voucher promotion validity period is required.",400,"GV_PROMOTION_VALIDITY_REQUIRED");checkRange(validFrom,validUntil);checkDiscount(discountType,payload.discountValue);await ensureUniqueCode({companyId,code:cd,transaction:tx});const p=await db.GiftVoucherPromotion.create({companyId,code:cd,name,description:normalizeNullable(payload.description),discountType,discountValue:Number(payload.discountValue),fundingType,fundingSource:normalizeNullable(payload.fundingSource),currencyCode:up(payload.currencyCode,"AED"),channelCode:up(payload.channelCode,"WEBSITE"),validFrom,validUntil,priority:Number(payload.priority??100),isActive:payload.isActive!==false,createdBy:userId||null,updatedBy:userId||null},{transaction:tx});await replaceItems({companyId,promotionId:p.id,items:Array.isArray(payload.items)?payload.items:[],userId,transaction:tx});await tx.commit();return getGiftVoucherPromotionById({companyId,promotionId:p.id});}catch(e){if(!tx.finished)await tx.rollback();throw e;}};
const updateGiftVoucherPromotion=async({companyId,promotionId,userId,payload})=>{const tx=await db.sequelize.transaction();try{const p=await db.GiftVoucherPromotion.findOne({where:{id:promotionId,companyId},transaction:tx,lock:tx.LOCK.UPDATE});if(!p)throw new AppError("Gift voucher promotion not found.",404,"GV_PROMOTION_NOT_FOUND");const u={updatedBy:userId||null};for(const f of ["description","fundingSource"])if(Object.prototype.hasOwnProperty.call(payload,f))u[f]=normalizeNullable(payload[f]);if(Object.prototype.hasOwnProperty.call(payload,"name")){const n=String(payload.name||"").trim();if(!n)throw new AppError("Gift voucher promotion name cannot be empty.",400,"GV_PROMOTION_NAME_REQUIRED");u.name=n;}if(Object.prototype.hasOwnProperty.call(payload,"code")){const cd=code(payload.code);await ensureUniqueCode({companyId,code:cd,excludeId:p.id,transaction:tx});u.code=cd;}for(const f of ["discountType","fundingType","currencyCode","channelCode"])if(Object.prototype.hasOwnProperty.call(payload,f))u[f]=up(payload[f]);if(Object.prototype.hasOwnProperty.call(payload,"discountValue"))u.discountValue=Number(payload.discountValue);checkDiscount(u.discountType||p.discountType,u.discountValue??Number(p.discountValue));const vf=Object.prototype.hasOwnProperty.call(payload,"validFrom")?date(payload.validFrom,"Valid from"):p.validFrom;const vu=Object.prototype.hasOwnProperty.call(payload,"validUntil")?date(payload.validUntil,"Valid until"):p.validUntil;checkRange(vf,vu);if(Object.prototype.hasOwnProperty.call(payload,"validFrom"))u.validFrom=vf;if(Object.prototype.hasOwnProperty.call(payload,"validUntil"))u.validUntil=vu;if(Object.prototype.hasOwnProperty.call(payload,"priority"))u.priority=Number(payload.priority);if(Object.prototype.hasOwnProperty.call(payload,"isActive"))u.isActive=payload.isActive===true;await p.update(u,{transaction:tx});if(Object.prototype.hasOwnProperty.call(payload,"items"))await replaceItems({companyId,promotionId:p.id,items:Array.isArray(payload.items)?payload.items:[],userId,transaction:tx});await tx.commit();return getGiftVoucherPromotionById({companyId,promotionId:p.id});}catch(e){if(!tx.finished)await tx.rollback();throw e;}};
const changeGiftVoucherPromotionStatus=async({companyId,promotionId,userId,isActive})=>{const p=await db.GiftVoucherPromotion.findOne({where:{id:promotionId,companyId}});if(!p)throw new AppError("Gift voucher promotion not found.",404,"GV_PROMOTION_NOT_FOUND");await p.update({isActive:isActive===true,updatedBy:userId||null});return getGiftVoucherPromotionById({companyId,promotionId:p.id});};
const deleteGiftVoucherPromotion=async({companyId,promotionId})=>{const tx=await db.sequelize.transaction();try{const p=await db.GiftVoucherPromotion.findOne({where:{id:promotionId,companyId},transaction:tx,lock:tx.LOCK.UPDATE});if(!p)throw new AppError("Gift voucher promotion not found.",404,"GV_PROMOTION_NOT_FOUND");await db.GiftVoucherPromotionItem.destroy({where:{companyId,giftVoucherPromotionId:p.id},transaction:tx});await p.destroy({transaction:tx});await tx.commit();return{id:promotionId};}catch(e){if(!tx.finished)await tx.rollback();throw e;}};
const resolveApplicablePromotion=async({companyId,productId,productVariantId,sellingPrice,quantity=1,channelCode="WEBSITE",effectiveDate=new Date(),transaction})=>{const d=date(effectiveDate,"Effective date")||new Date();const ch=up(channelCode,"WEBSITE");const assignments=await db.GiftVoucherPromotionItem.findAll({where:{companyId,productId,isActive:true,[Op.or]:[{productVariantId:null},{productVariantId}]},include:[{model:db.GiftVoucherPromotion,as:"promotion",required:true,where:{companyId,isActive:true,validFrom:{[Op.lte]:d},validUntil:{[Op.gte]:d},channelCode:{[Op.in]:[ch,"ALL"]}}}],transaction});if(!assignments.length)return null;assignments.sort((a,b)=>{const p=Number(a.promotion?.priority??100)-Number(b.promotion?.priority??100);if(p!==0)return p;return(a.productVariantId?0:1)-(b.productVariantId?0:1);});const a=assignments[0],p=a.promotion,sp=Math.max(0,Number(sellingPrice||0)),qty=Math.max(1,Number(quantity||1));let unit=p.discountType==="PERCENTAGE"?sp*(Number(p.discountValue||0)/100):Number(p.discountValue||0);unit=Number(Math.min(sp,Math.max(0,unit)).toFixed(4));const amount=Number((unit*qty).toFixed(4));return{id:p.id,code:p.code,name:p.name,description:p.description,discountType:p.discountType,discountValue:Number(p.discountValue),unitDiscount:unit,discountAmount:amount,fundingType:p.fundingType,fundingSource:p.fundingSource||null,internalValue:p.fundingType==="INTERNAL"?amount:0,externalValue:p.fundingType==="EXTERNAL"?amount:0,currencyCode:p.currencyCode,channelCode:p.channelCode,validFrom:p.validFrom,validUntil:p.validUntil,priority:p.priority,assignment:{id:a.id,productId:a.productId,productVariantId:a.productVariantId}};};

/*
|--------------------------------------------------------------------------
| Resolve Applicable Promotions Batch
|--------------------------------------------------------------------------
|
| Used by public category, collection, brand, search and product APIs.
|
| Prevents N+1 database queries.
|--------------------------------------------------------------------------
*/

const resolveApplicablePromotionsBatch =
  async ({
    companyId,
    items,
    channelCode =
      "WEBSITE",
    effectiveDate =
      new Date(),
    transaction,
  }) => {
    if (
      !Array.isArray(
        items
      ) ||
      !items.length
    ) {
      return new Map();
    }

    const normalizedDate =
      date(
        effectiveDate,
        "Effective date"
      ) ||
      new Date();

    const normalizedChannel =
      up(
        channelCode,
        "WEBSITE"
      );

    /*
    |--------------------------------------------------------------------------
    | Unique Products
    |--------------------------------------------------------------------------
    */

    const productIds = [
      ...new Set(
        items
          .map(
            item =>
              item.productId
          )
          .filter(
            Boolean
          )
      ),
    ];

    if (
      !productIds.length
    ) {
      return new Map();
    }

    /*
    |--------------------------------------------------------------------------
    | Load All Applicable Assignments In ONE Query
    |--------------------------------------------------------------------------
    */

    const assignments =
      await db
        .GiftVoucherPromotionItem
        .findAll({
          where: {
            companyId,

            productId: {
              [Op.in]:
                productIds,
            },

            isActive:
              true,
          },

          include: [
            {
              model:
                db.GiftVoucherPromotion,

              as:
                "promotion",

              required:
                true,

              where: {
                companyId,

                isActive:
                  true,

                validFrom: {
                  [Op.lte]:
                    normalizedDate,
                },

                validUntil: {
                  [Op.gte]:
                    normalizedDate,
                },

                channelCode: {
                  [Op.in]: [
                    normalizedChannel,
                    "ALL",
                  ],
                },
              },
            },
          ],

          transaction,
        });

    /*
    |--------------------------------------------------------------------------
    | Group By Product
    |--------------------------------------------------------------------------
    */

    const assignmentsByProduct =
      new Map();

    for (
      const assignment of
      assignments
    ) {
      const productId =
        assignment.productId;

      if (
        !assignmentsByProduct.has(
          productId
        )
      ) {
        assignmentsByProduct.set(
          productId,
          []
        );
      }

      assignmentsByProduct
        .get(
          productId
        )
        .push(
          assignment
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Resolve Each Requested Variant In Memory
    |--------------------------------------------------------------------------
    */

    const result =
      new Map();

    for (
      const item of
      items
    ) {
      const productAssignments =
        assignmentsByProduct.get(
          item.productId
        ) ||
        [];

      /*
       * Product-level assignment:
       * productVariantId = NULL
       *
       * Variant assignment:
       * exact variant UUID
       */
      const applicable =
        productAssignments
          .filter(
            assignment =>
              !assignment
                .productVariantId ||
              assignment
                .productVariantId ===
                item.productVariantId
          )
          .sort(
            (
              a,
              b
            ) => {
              const aPriority =
                Number(
                  a.promotion
                    ?.priority ??
                  100
                );

              const bPriority =
                Number(
                  b.promotion
                    ?.priority ??
                  100
                );

              if (
                aPriority !==
                bPriority
              ) {
                return (
                  aPriority -
                  bPriority
                );
              }

              /*
               * If priority is equal,
               * variant-specific promotion wins.
               */
              const aSpecific =
                a.productVariantId
                  ? 0
                  : 1;

              const bSpecific =
                b.productVariantId
                  ? 0
                  : 1;

              return (
                aSpecific -
                bSpecific
              );
            }
          );

      const assignment =
        applicable[0];

      if (
        !assignment
      ) {
        continue;
      }

      const promotion =
        assignment.promotion;

      const sellingPrice =
        Math.max(
          0,
          Number(
            item.sellingPrice ||
            0
          )
        );

      const quantity =
        Math.max(
          1,
          Number(
            item.quantity ||
            1
          )
        );

      let unitDiscount =
        0;

      if (
        promotion.discountType ===
        "PERCENTAGE"
      ) {
        unitDiscount =
          sellingPrice *
          (
            Number(
              promotion.discountValue ||
              0
            ) /
            100
          );
      } else {
        unitDiscount =
          Number(
            promotion.discountValue ||
            0
          );
      }

      /*
       * GV cannot reduce price below zero.
       */
      unitDiscount =
        Math.min(
          sellingPrice,
          Math.max(
            0,
            unitDiscount
          )
        );

      unitDiscount =
        Number(
          unitDiscount.toFixed(
            4
          )
        );

      const discountAmount =
        Number(
          (
            unitDiscount *
            quantity
          ).toFixed(
            4
          )
        );

      const key =
        `${item.productId}:${item.productVariantId}`;

      result.set(
        key,
        {
          id:
            promotion.id,

          code:
            promotion.code,

          name:
            promotion.name,

          discountType:
            promotion.discountType,

          discountValue:
            Number(
              promotion.discountValue
            ),

          unitDiscount,

          discountAmount,

          fundingType:
            promotion.fundingType,

          fundingSource:
            promotion.fundingSource ||
            null,

          internalValue:
            promotion.fundingType ===
            "INTERNAL"
              ? discountAmount
              : 0,

          externalValue:
            promotion.fundingType ===
            "EXTERNAL"
              ? discountAmount
              : 0,

          currencyCode:
            promotion.currencyCode,

          validFrom:
            promotion.validFrom,

          validUntil:
            promotion.validUntil,

          priority:
            promotion.priority,
        }
      );
    }

    return result;
  };


module.exports={listGiftVoucherPromotions,getGiftVoucherPromotionById,createGiftVoucherPromotion,updateGiftVoucherPromotion,changeGiftVoucherPromotionStatus,deleteGiftVoucherPromotion,resolveApplicablePromotion,
    listGiftVoucherPromotions,
    getGiftVoucherPromotionById,
    createGiftVoucherPromotion,
    updateGiftVoucherPromotion,
    changeGiftVoucherPromotionStatus,
    deleteGiftVoucherPromotion,
    resolveApplicablePromotion,
    resolveApplicablePromotionsBatch,
};
