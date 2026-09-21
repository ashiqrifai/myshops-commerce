const s=require('./accessControl.service');
const cid=req=>req.context.companyId;
const run=fn=>async(req,res,next)=>{try{await fn(req,res)}catch(e){next(e)}};
exports.listPermissions=run(async(req,res)=>res.json({success:true,data:await s.listPermissions()}));
exports.listRoles=run(async(req,res)=>res.json({success:true,data:await s.listRoles({companyId:cid(req)})}));
exports.getRole=run(async(req,res)=>res.json({success:true,data:await s.getRole({companyId:cid(req),roleId:req.params.id})}));
exports.createRole=run(async(req,res)=>res.status(201).json({success:true,data:await s.createRole({companyId:cid(req),payload:req.body||{}}),message:'Role created successfully.'}));
exports.updateRole=run(async(req,res)=>res.json({success:true,data:await s.updateRole({companyId:cid(req),roleId:req.params.id,payload:req.body||{}}),message:'Role updated successfully.'}));
exports.listUsers=run(async(req,res)=>res.json({success:true,data:await s.listUsers({companyId:cid(req)})}));
exports.getUser=run(async(req,res)=>res.json({success:true,data:await s.getUser({companyId:cid(req),userId:req.params.id})}));
exports.createUser=run(async(req,res)=>res.status(201).json({success:true,data:await s.createUser({companyId:cid(req),payload:req.body||{}}),message:'User created successfully.'}));
exports.updateUser=run(async(req,res)=>res.json({success:true,data:await s.updateUser({companyId:cid(req),userId:req.params.id,payload:req.body||{}}),message:'User updated successfully.'}));
exports.updateUserStatus=run(async(req,res)=>{const data=await s.updateUserStatus({companyId:cid(req),userId:req.params.id,actorUserId:req.user.id,isActive:req.body?.isActive===true});res.json({success:true,data,message:data.isActive?'User activated successfully.':'User disabled successfully.'})});
exports.resetUserPassword=run(async(req,res)=>{
  const data=await s.resetUserPassword({
    companyId:cid(req),
    userId:req.params.id,
    newPassword:req.body?.newPassword,
  });
  res.json({
    success:true,
    data,
    message:'User password reset successfully. Existing sessions have been invalidated.',
  });
});
