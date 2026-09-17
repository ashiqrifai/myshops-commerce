const { body,param,query } = require("express-validator");

const TYPES=["PERCENTAGE","FIXED","FREE_SHIPPING"];
const CURRENCIES=["AED","USD","EUR","GBP","SAR","QAR","KWD","OMR","BHD"];
const upper=v=>v===undefined||v===null?v:String(v).trim().toUpperCase();

const couponIdValidation=[
  param("id").trim().notEmpty().withMessage("Coupon ID is required.").bail().isUUID().withMessage("Coupon ID must be a valid UUID.")
];

const listCouponsValidation=[
  query("page").optional().isInt({min:1}).toInt(),
  query("pageSize").optional().isInt({min:1,max:200}).toInt(),
  query("search").optional({checkFalsy:true}).trim().isLength({max:250}),
  query("discountType").optional({checkFalsy:true}).customSanitizer(upper).isIn(TYPES),
  query("channelCode").optional({checkFalsy:true}).trim().isLength({max:100}).customSanitizer(upper),
  query("isActive").optional().isBoolean().toBoolean(),
];

const shared=[
  body("code").optional().trim().isLength({min:2,max:100}).matches(/^[A-Za-z0-9_-]+$/),
  body("name").optional().trim().isLength({min:2,max:250}),
  body("description").optional({nullable:true}).trim().isLength({max:5000}),
  body("discountType").optional().customSanitizer(upper).isIn(TYPES),
  body("discountValue").optional().isFloat({min:0}).toFloat(),
  body("minimumOrderAmount").optional().isFloat({min:0}).toFloat(),
  body("maximumDiscountAmount").optional({nullable:true,checkFalsy:true}).isFloat({min:0}).toFloat(),
  body("currencyCode").optional().customSanitizer(upper).isIn(CURRENCIES),
  body("channelCode").optional().trim().notEmpty().isLength({max:100}).matches(/^[A-Za-z0-9_-]+$/).customSanitizer(upper),
  body("usageLimit").optional({nullable:true,checkFalsy:true}).isInt({min:1}).toInt(),
  body("perCustomerLimit").optional({nullable:true,checkFalsy:true}).isInt({min:1}).toInt(),
  body("firstOrderOnly").optional().isBoolean().toBoolean(),
  body("validFrom").optional({nullable:true,checkFalsy:true}).isISO8601().toDate(),
  body("validUntil").optional({nullable:true,checkFalsy:true}).isISO8601().toDate(),
  body("isActive").optional().isBoolean().toBoolean(),
  body().custom(payload=>{
    if(payload.validFrom&&payload.validUntil&&new Date(payload.validUntil)<new Date(payload.validFrom)) throw new Error("Valid until must be later than or equal to valid from.");
    if(payload.discountType==="PERCENTAGE"&&payload.discountValue!==undefined&&Number(payload.discountValue)>100) throw new Error("Percentage discount cannot exceed 100.");
    return true;
  }),
];

const createCouponValidation=[
  body("code").trim().notEmpty().withMessage("Coupon code is required."),
  body("name").trim().notEmpty().withMessage("Coupon name is required."),
  body("discountType").exists().withMessage("Discount type is required."),
  ...shared,
];

const updateCouponValidation=[...couponIdValidation,...shared];

const changeCouponStatusValidation=[
  ...couponIdValidation,
  body("isActive").exists({checkNull:true}).isBoolean().toBoolean(),
];

module.exports={couponIdValidation,listCouponsValidation,createCouponValidation,updateCouponValidation,changeCouponStatusValidation};
