const {Op}=require("sequelize");
const db=require("../../models");
const AppError=require("../../utils/AppError");
const publicStorefrontService=require("../public-storefront/publicStorefront.service");
const {hashToken,createActivationCode,createDeviceToken}=require("./kioskDevice.utils");
const normalize=(v)=>String(v||"").trim().toUpperCase();

exports.listDevices=({companyId})=>db.KioskDevice.findAll({
 where:{companyId,isActive:true},attributes:{exclude:["activationTokenHash","deviceTokenHash"]},
 include:[{model:db.KioskProfile,as:"kioskProfile",attributes:["id","name","code","inventoryLocationId","isActive"],
 include:[{model:db.InventoryLocation,as:"inventoryLocation",attributes:["id","code","name","locationType","isActive"]}]}],
 order:[["createdAt","DESC"]]
});

exports.createDevice=async({companyId,userId,payload})=>{
 const t=await db.sequelize.transaction();
 try{
  const profile=await db.KioskProfile.findOne({where:{id:payload.kioskProfileId,companyId,isActive:true},transaction:t});
  if(!profile)throw new AppError("Kiosk profile not found.",404,"KIOSK_PROFILE_NOT_FOUND");
  const deviceCode=normalize(payload.deviceCode);
  if(await db.KioskDevice.findOne({where:{companyId,deviceCode},transaction:t}))
   throw new AppError("A kiosk device with this code already exists.",409,"KIOSK_DEVICE_CODE_EXISTS");
  const activationCode=createActivationCode();
  const d=await db.KioskDevice.create({companyId,kioskProfileId:profile.id,deviceCode,
   deviceName:String(payload.deviceName).trim(),activationTokenHash:hashToken(activationCode),
   deviceTokenHash:null,activatedAt:null,status:"PENDING",settings:payload.settings||{},isActive:true,
   createdBy:userId,updatedBy:userId},{transaction:t});
  await t.commit();
  return{device:{id:d.id,kioskProfileId:d.kioskProfileId,deviceCode:d.deviceCode,deviceName:d.deviceName,status:d.status},activationCode};
 }catch(e){if(!t.finished)await t.rollback();throw e;}
};

exports.regenerateActivation=async({companyId,deviceId,userId})=>{
 const d=await db.KioskDevice.findOne({where:{id:deviceId,companyId,isActive:true}});
 if(!d)throw new AppError("Kiosk device not found.",404,"KIOSK_DEVICE_NOT_FOUND");
 const activationCode=createActivationCode();
 await d.update({activationTokenHash:hashToken(activationCode),deviceTokenHash:null,activatedAt:null,status:"PENDING",updatedBy:userId});
 return{device:{id:d.id,deviceCode:d.deviceCode,deviceName:d.deviceName,status:d.status},activationCode};
};

exports.activateDevice=async({deviceCode,activationCode,appVersion})=>{
 const d=await db.KioskDevice.findOne({where:{deviceCode:normalize(deviceCode),activationTokenHash:hashToken(activationCode),status:"PENDING",isActive:true}});
 if(!d)throw new AppError("Device code or activation code is invalid.",401,"INVALID_KIOSK_ACTIVATION");
 const deviceToken=createDeviceToken();
 await d.update({activationTokenHash:null,deviceTokenHash:hashToken(deviceToken),activatedAt:new Date(),lastSeenAt:new Date(),
  appVersion:appVersion||d.appVersion||null,status:"ACTIVE"});
 return{deviceToken,device:{id:d.id,deviceCode:d.deviceCode,deviceName:d.deviceName,status:d.status,activatedAt:d.activatedAt}};
};

exports.changeStatus=async({companyId,deviceId,userId,status})=>{
 const d=await db.KioskDevice.findOne({where:{id:deviceId,companyId,isActive:true}});
 if(!d)throw new AppError("Kiosk device not found.",404,"KIOSK_DEVICE_NOT_FOUND");
 const values={status,updatedBy:userId};
 if(status==="DISABLED")values.deviceTokenHash=null;
 await d.update(values);
 return{id:d.id,deviceCode:d.deviceCode,deviceName:d.deviceName,status:d.status};
};

exports.heartbeat=async({device,appVersion})=>{
 await device.update({lastSeenAt:new Date(),appVersion:appVersion||device.appVersion||null});
 return{id:device.id,deviceCode:device.deviceCode,status:device.status,appVersion:device.appVersion,lastSeenAt:device.lastSeenAt};
};

exports.bootstrap=async({device,apiBaseUrl})=>{
 const profile=await db.KioskProfile.findOne({where:{id:device.kioskProfileId,companyId:device.companyId,isActive:true},
 include:[
  {model:db.InventoryLocation,as:"inventoryLocation",required:true},
  {model:db.KioskProfilePage,as:"pages",required:true,where:{pageType:"HOME",isActive:true},
   include:[{model:db.CmsPage,as:"cmsPage",required:true,where:{isActive:true,channel:{[Op.in]:["KIOSK","BOTH"]}}}]}
 ]});
 if(!profile)throw new AppError("Active kiosk profile or HOME page not found.",404,"KIOSK_PROFILE_HOME_NOT_FOUND");
 const cmsPage=profile.pages[0].cmsPage;
 const company=await db.Company.findByPk(device.companyId,{attributes:["id","code","name"]});
 if(!company)throw new AppError("Company not found.",404,"COMPANY_NOT_FOUND");
 const page=await publicStorefrontService.getPublicStorefrontPage({companyCode:company.code,slug:cmsPage.slug,channel:"KIOSK",apiBaseUrl});
 await device.update({lastSeenAt:new Date()});
 return{
  device:{id:device.id,deviceCode:device.deviceCode,deviceName:device.deviceName,appVersion:device.appVersion,lastSeenAt:device.lastSeenAt},
  profile:{id:profile.id,code:profile.code,name:profile.name,settings:profile.settings||{}},
  store:{id:profile.inventoryLocation.id,code:profile.inventoryLocation.code,name:profile.inventoryLocation.name,locationType:profile.inventoryLocation.locationType},
  page
 };
};
