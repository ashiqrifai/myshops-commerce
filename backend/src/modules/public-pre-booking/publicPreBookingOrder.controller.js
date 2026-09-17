const service=require("./publicPreBookingOrder.service");
const code=req=>String(req.headers["x-company-code"]||process.env.SEED_COMPANY_CODE||"MYSHOPS").trim().toUpperCase();
exports.createOrder=async(req,res,next)=>{try{const data=await service.createOrder({companyCode:code(req),publicToken:req.params.publicToken,authenticatedCustomerId:req.customer?.id||null,customer:req.body.customer,shippingAddress:req.body.shippingAddress,paymentMethod:req.body.paymentMethod,notes:req.body.notes||null});return res.status(201).json({success:true,data});}catch(e){next(e);}};
exports.finalizePaidOrder=async(req,res,next)=>{try{const data=await service.finalizePaidOrder({companyCode:code(req),orderId:req.params.orderId});return res.json({success:true,data});}catch(e){next(e);}};
