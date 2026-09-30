const service=require("./kioskDevice.service");
const getPublicApiBaseUrl=require("../../utils/getPublicApiBaseUrl");
exports.listDevices=async(req,res,next)=>{try{res.json({success:true,data:await service.listDevices({companyId:req.user.companyId})});}catch(e){next(e);}};
exports.createDevice=async(req,res,next)=>{try{res.status(201).json({success:true,message:"Kiosk device created. Save the one-time activation code.",data:await service.createDevice({companyId:req.user.companyId,userId:req.user.id,payload:req.body})});}catch(e){next(e);}};
exports.regenerateActivation=async(req,res,next)=>{try{res.json({success:true,message:"New one-time activation code generated.",data:await service.regenerateActivation({companyId:req.user.companyId,deviceId:req.params.id,userId:req.user.id})});}catch(e){next(e);}};
exports.changeStatus=async(req,res,next)=>{try{res.json({success:true,data:await service.changeStatus({companyId:req.user.companyId,deviceId:req.params.id,userId:req.user.id,status:req.body.status})});}catch(e){next(e);}};
exports.activateDevice=async(req,res,next)=>{try{res.json({success:true,data:await service.activateDevice(req.body)});}catch(e){next(e);}};
exports.bootstrap=async(req,res,next)=>{try{res.json({success:true,data:await service.bootstrap({device:req.kioskDevice,apiBaseUrl:getPublicApiBaseUrl(req)})});}catch(e){next(e);}};
exports.heartbeat=async(req,res,next)=>{try{res.json({success:true,data:await service.heartbeat({device:req.kioskDevice,appVersion:req.body.appVersion})});}catch(e){next(e);}};
