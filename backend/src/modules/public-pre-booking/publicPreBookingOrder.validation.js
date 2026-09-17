const{body,param,validationResult}=require("express-validator");
const done=(req,res,next)=>{const e=validationResult(req);if(e.isEmpty())return next();return res.status(400).json({success:false,error:{code:"VALIDATION_ERROR",message:"Request validation failed.",details:e.array()}});};
exports.createOrderValidation=[param("publicToken").isUUID(),body("customer.firstName").trim().notEmpty(),body("customer.email").isEmail(),body("customer.phone").trim().notEmpty(),body("shippingAddress.addressLine1").trim().notEmpty(),body("shippingAddress.emirate").trim().notEmpty(),body("shippingAddress.city").trim().notEmpty(),body("shippingAddress.area").trim().notEmpty(),body("paymentMethod").isIn(["CARD","TABBY","TAMARA"]),done];
exports.finalizeOrderValidation=[param("orderId").isUUID(),done];
