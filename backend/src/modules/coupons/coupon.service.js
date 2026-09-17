const { Op } = require("sequelize");
const db = require("../../models");
const AppError = require("../../utils/AppError");

const upper = (v,f=null) => v===undefined||v===null||v==="" ? f : String(v).trim().toUpperCase()||f;
const nullable = (v) => v===undefined||v===null||v==="" ? null : String(v).trim()||null;
const numOrNull = (v) => v===undefined||v===null||v==="" ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
const dateOrNull = (v) => {
  if(v===undefined||v===null||v==="") return null;
  const d = v instanceof Date ? v : new Date(v);
  if(Number.isNaN(d.getTime())) throw new AppError("A supplied coupon date is invalid.",400,"COUPON_DATE_INVALID");
  return d;
};
const codeOf = (v) => String(v||"").trim().toUpperCase().replace(/\s+/g,"").replace(/[^A-Z0-9_-]/g,"");

const checkRange = (from,until) => {
  if(from&&until&&new Date(until).getTime()<new Date(from).getTime()){
    throw new AppError("Valid until must be later than or equal to valid from.",400,"COUPON_DATE_RANGE_INVALID");
  }
};

const checkDiscount = (type,value) => {
  if(type==="PERCENTAGE" && !(value>0 && value<=100))
    throw new AppError("Percentage discount must be greater than 0 and no more than 100.",400,"COUPON_PERCENTAGE_INVALID");
  if(type==="FIXED" && !(value>0))
    throw new AppError("Fixed discount must be greater than 0.",400,"COUPON_FIXED_VALUE_INVALID");
  if(!["PERCENTAGE","FIXED","FREE_SHIPPING"].includes(type))
    throw new AppError("Coupon discount type is invalid.",400,"COUPON_DISCOUNT_TYPE_INVALID");
};

const ensureUnique = async ({companyId,code,excludeId,transaction}) => {
  const where={companyId,code};
  if(excludeId) where.id={[Op.ne]:excludeId};
  if(await db.Coupon.findOne({where,transaction}))
    throw new AppError(`A coupon with code "${code}" already exists.`,409,"COUPON_CODE_EXISTS");
};

const getCouponById = async ({companyId,couponId,transaction}) => {
  const coupon=await db.Coupon.findOne({where:{id:couponId,companyId},transaction});
  if(!coupon) throw new AppError("Coupon not found.",404,"COUPON_NOT_FOUND");
  return coupon;
};

const listCoupons = async ({companyId,page=1,pageSize=30,search,discountType,channelCode,isActive}) => {
  const where={companyId};
  if(search) where[Op.or]=[
    {code:{[Op.iLike]:`%${search}%`}},
    {name:{[Op.iLike]:`%${search}%`}},
    {description:{[Op.iLike]:`%${search}%`}},
  ];
  if(discountType) where.discountType=upper(discountType);
  if(channelCode) where.channelCode=upper(channelCode);
  if(typeof isActive==="boolean") where.isActive=isActive;

  const p=Math.max(Number(page)||1,1);
  const ps=Math.min(Math.max(Number(pageSize)||30,1),200);
  const result=await db.Coupon.findAndCountAll({
    where,limit:ps,offset:(p-1)*ps,order:[["createdAt","DESC"],["code","ASC"]]
  });
  return {rows:result.rows,pagination:{page:p,pageSize:ps,totalItems:result.count,totalPages:Math.ceil(result.count/ps)}};
};

const createCoupon = async ({companyId,userId,payload}) => {
  const t=await db.sequelize.transaction();
  try{
    const code=codeOf(payload.code);
    if(!code) throw new AppError("Coupon code is required.",400,"COUPON_CODE_REQUIRED");
    await ensureUnique({companyId,code,transaction:t});
    const type=upper(payload.discountType,"PERCENTAGE");
    const value=type==="FREE_SHIPPING"?0:Number(payload.discountValue||0);
    checkDiscount(type,value);
    const validFrom=dateOrNull(payload.validFrom), validUntil=dateOrNull(payload.validUntil);
    checkRange(validFrom,validUntil);

    const coupon=await db.Coupon.create({
      companyId,code,
      name:String(payload.name||"").trim(),
      description:nullable(payload.description),
      discountType:type,
      discountValue:value,
      minimumOrderAmount:Number(payload.minimumOrderAmount||0),
      maximumDiscountAmount:type==="FREE_SHIPPING"?null:numOrNull(payload.maximumDiscountAmount),
      currencyCode:upper(payload.currencyCode,"AED"),
      channelCode:upper(payload.channelCode,"WEBSITE"),
      usageLimit:numOrNull(payload.usageLimit),
      perCustomerLimit:numOrNull(payload.perCustomerLimit),
      firstOrderOnly:payload.firstOrderOnly===true,
      validFrom,validUntil,
      isActive:payload.isActive!==false,
      createdBy:userId||null,updatedBy:userId||null,
    },{transaction:t});
    await t.commit();
    return getCouponById({companyId,couponId:coupon.id});
  }catch(e){ if(!t.finished) await t.rollback(); throw e; }
};

const updateCoupon = async ({companyId,couponId,userId,payload}) => {
  const t=await db.sequelize.transaction();
  try{
    const coupon=await db.Coupon.findOne({where:{id:couponId,companyId},transaction:t,lock:t.LOCK.UPDATE});
    if(!coupon) throw new AppError("Coupon not found.",404,"COUPON_NOT_FOUND");

    const code=Object.prototype.hasOwnProperty.call(payload,"code")?codeOf(payload.code):coupon.code;
    await ensureUnique({companyId,code,excludeId:coupon.id,transaction:t});

    const type=Object.prototype.hasOwnProperty.call(payload,"discountType")?upper(payload.discountType):coupon.discountType;
    const value=type==="FREE_SHIPPING"?0:(Object.prototype.hasOwnProperty.call(payload,"discountValue")?Number(payload.discountValue||0):Number(coupon.discountValue));
    checkDiscount(type,value);

    const validFrom=Object.prototype.hasOwnProperty.call(payload,"validFrom")?dateOrNull(payload.validFrom):coupon.validFrom;
    const validUntil=Object.prototype.hasOwnProperty.call(payload,"validUntil")?dateOrNull(payload.validUntil):coupon.validUntil;
    checkRange(validFrom,validUntil);

    const patch={code,discountType:type,discountValue:value,validFrom,validUntil,updatedBy:userId||null};
    for(const f of ["name","currencyCode","channelCode"]){
      if(Object.prototype.hasOwnProperty.call(payload,f)) patch[f]=f==="name"?String(payload[f]||"").trim():upper(payload[f]);
    }
    if(Object.prototype.hasOwnProperty.call(payload,"description")) patch.description=nullable(payload.description);
    if(Object.prototype.hasOwnProperty.call(payload,"minimumOrderAmount")) patch.minimumOrderAmount=Number(payload.minimumOrderAmount||0);
    if(Object.prototype.hasOwnProperty.call(payload,"maximumDiscountAmount")) patch.maximumDiscountAmount=type==="FREE_SHIPPING"?null:numOrNull(payload.maximumDiscountAmount);
    if(Object.prototype.hasOwnProperty.call(payload,"usageLimit")) patch.usageLimit=numOrNull(payload.usageLimit);
    if(Object.prototype.hasOwnProperty.call(payload,"perCustomerLimit")) patch.perCustomerLimit=numOrNull(payload.perCustomerLimit);
    if(Object.prototype.hasOwnProperty.call(payload,"firstOrderOnly")) patch.firstOrderOnly=payload.firstOrderOnly===true;
    if(Object.prototype.hasOwnProperty.call(payload,"isActive")) patch.isActive=payload.isActive===true;

    await coupon.update(patch,{transaction:t});
    await t.commit();
    return getCouponById({companyId,couponId:coupon.id});
  }catch(e){ if(!t.finished) await t.rollback(); throw e; }
};

const changeCouponStatus = async ({companyId,couponId,userId,isActive}) => {
  const coupon=await getCouponById({companyId,couponId});
  await coupon.update({isActive:isActive===true,updatedBy:userId||null});
  return getCouponById({companyId,couponId});
};

const deleteCoupon = async ({companyId,couponId}) => {
  const t=await db.sequelize.transaction();
  try{
    const coupon=await db.Coupon.findOne({where:{id:couponId,companyId},transaction:t,lock:t.LOCK.UPDATE});
    if(!coupon) throw new AppError("Coupon not found.",404,"COUPON_NOT_FOUND");
    const used=await db.CouponRedemption.count({where:{companyId,couponId},transaction:t});
    if(used>0) throw new AppError("This coupon has already been redeemed and cannot be deleted. Deactivate it instead.",409,"COUPON_IN_USE");
    await coupon.destroy({transaction:t});
    await t.commit();
    return {id:couponId};
  }catch(e){ if(!t.finished) await t.rollback(); throw e; }
};

module.exports={listCoupons,getCouponById,createCoupon,updateCoupon,changeCouponStatus,deleteCoupon};
