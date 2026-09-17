const service = require("./coupon.service");

exports.listCoupons = async (req,res,next) => {
  try {
    const result = await service.listCoupons({
      companyId:req.user.companyId,
      page:req.query.page||1,
      pageSize:req.query.pageSize||30,
      search:req.query.search,
      discountType:req.query.discountType,
      channelCode:req.query.channelCode,
      isActive:req.query.isActive,
    });
    res.status(200).json({success:true,data:result.rows,pagination:result.pagination});
  } catch(e){ next(e); }
};

exports.getCouponById = async (req,res,next) => {
  try {
    const data = await service.getCouponById({companyId:req.user.companyId,couponId:req.params.id});
    res.status(200).json({success:true,data});
  } catch(e){ next(e); }
};

exports.createCoupon = async (req,res,next) => {
  try {
    const data = await service.createCoupon({companyId:req.user.companyId,userId:req.user.id,payload:req.body});
    res.status(201).json({success:true,message:"Coupon created successfully.",data});
  } catch(e){ next(e); }
};

exports.updateCoupon = async (req,res,next) => {
  try {
    const data = await service.updateCoupon({companyId:req.user.companyId,couponId:req.params.id,userId:req.user.id,payload:req.body});
    res.status(200).json({success:true,message:"Coupon updated successfully.",data});
  } catch(e){ next(e); }
};

exports.changeCouponStatus = async (req,res,next) => {
  try {
    const data = await service.changeCouponStatus({companyId:req.user.companyId,couponId:req.params.id,userId:req.user.id,isActive:req.body.isActive});
    res.status(200).json({success:true,message:req.body.isActive?"Coupon activated successfully.":"Coupon deactivated successfully.",data});
  } catch(e){ next(e); }
};

exports.deleteCoupon = async (req,res,next) => {
  try {
    const data = await service.deleteCoupon({companyId:req.user.companyId,couponId:req.params.id});
    res.status(200).json({success:true,message:"Coupon deleted successfully.",data});
  } catch(e){ next(e); }
};
