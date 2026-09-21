const bcrypt=require('bcryptjs');
const {Op}=require('sequelize');
const db=require('../../models');
const AppError=require('../../utils/AppError');
const email=v=>String(v||'').trim().toLowerCase();
const uname=v=>String(v||'').trim().toLowerCase();
const rcode=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const pj=p=>({id:p.id,name:p.name,code:p.code,module:p.module,description:p.description||null,isActive:p.isActive===true});
const rj=r=>({id:r.id,companyId:r.companyId,name:r.name,code:r.code,description:r.description||null,isSystemRole:r.isSystemRole===true,isActive:r.isActive===true,permissions:(r.permissions||[]).map(pj),createdAt:r.createdAt,updatedAt:r.updatedAt});
const uj=u=>({id:u.id,companyId:u.companyId,firstName:u.firstName,lastName:u.lastName||null,fullName:[u.firstName,u.lastName].filter(Boolean).join(' '),email:u.email,username:u.username,mobile:u.mobile||null,avatarUrl:u.avatarUrl||null,status:u.status,isSuperAdmin:u.isSuperAdmin===true,isActive:u.isActive===true,lastLoginAt:u.lastLoginAt||null,roles:(u.roles||[]).map(r=>({id:r.id,name:r.name,code:r.code,isActive:r.isActive===true})),createdAt:u.createdAt,updatedAt:u.updatedAt});
async function roles(companyId,ids0,t){const ids=[...new Set((Array.isArray(ids0)?ids0:[]).filter(Boolean))];if(!ids.length)return[];const x=await db.Role.findAll({where:{companyId,id:{[Op.in]:ids},isActive:true},transaction:t});if(x.length!==ids.length)throw new AppError('One or more selected roles are invalid.',400,'INVALID_ROLE_SELECTION');if(x.some(r=>r.code==='SUPER_ADMIN'||r.isSystemRole===true))throw new AppError('System roles cannot be assigned through user management.',403,'SYSTEM_ROLE_ASSIGNMENT_FORBIDDEN');return x}
async function perms(ids0,t){const ids=[...new Set((Array.isArray(ids0)?ids0:[]).filter(Boolean))];if(!ids.length)return[];const x=await db.Permission.findAll({where:{id:{[Op.in]:ids},isActive:true},transaction:t});if(x.length!==ids.length)throw new AppError('One or more selected permissions are invalid.',400,'INVALID_PERMISSION_SELECTION');return x}
async function role(companyId,id){const x=await db.Role.findOne({where:{id,companyId},include:[{model:db.Permission,as:'permissions',through:{attributes:[]},required:false}]});if(!x)throw new AppError('Role not found.',404,'ROLE_NOT_FOUND');return x}
async function user(companyId,id){const x=await db.User.findOne({where:{id,companyId},attributes:{exclude:['passwordHash']},include:[{model:db.Role,as:'roles',through:{attributes:[]},required:false}]});if(!x)throw new AppError('User not found.',404,'USER_NOT_FOUND');return x}
exports.listPermissions=async()=> (await db.Permission.findAll({where:{isActive:true},order:[['module','ASC'],['name','ASC']]})).map(pj);
exports.listRoles=async({companyId})=>(await db.Role.findAll({where:{companyId},include:[{model:db.Permission,as:'permissions',through:{attributes:[]},required:false}],order:[['isSystemRole','DESC'],['name','ASC']]})).map(rj);
exports.getRole=async({companyId,roleId})=>rj(await role(companyId,roleId));
exports.createRole=async({companyId,payload})=>{const name=String(payload.name||'').trim(),code=rcode(payload.code||name);if(!name||!code)throw new AppError('Role name and code are required.',400,'ROLE_NAME_CODE_REQUIRED');if(code==='SUPER_ADMIN')throw new AppError('SUPER_ADMIN is protected.',403,'SYSTEM_ROLE_FORBIDDEN');const id=await db.sequelize.transaction(async t=>{if(await db.Role.findOne({where:{companyId,code},transaction:t}))throw new AppError('A role with this code already exists.',409,'ROLE_CODE_EXISTS');const ps=await perms(payload.permissionIds,t);const x=await db.Role.create({companyId,name,code,description:payload.description?String(payload.description).trim():null,isSystemRole:false,isActive:payload.isActive!==false},{transaction:t});await x.setPermissions(ps,{transaction:t});return x.id});return exports.getRole({companyId,roleId:id})};
exports.updateRole=async({companyId,roleId,payload})=>{await db.sequelize.transaction(async t=>{const x=await db.Role.findOne({where:{id:roleId,companyId},transaction:t});if(!x)throw new AppError('Role not found.',404,'ROLE_NOT_FOUND');if(x.isSystemRole||x.code==='SUPER_ADMIN')throw new AppError('System roles cannot be modified.',403,'SYSTEM_ROLE_UPDATE_FORBIDDEN');if(payload.name!==undefined){const v=String(payload.name||'').trim();if(!v)throw new AppError('Role name is required.',400,'ROLE_NAME_REQUIRED');x.name=v}if(payload.code!==undefined){const v=rcode(payload.code);if(!v)throw new AppError('Role code is required.',400,'ROLE_CODE_REQUIRED');if(v==='SUPER_ADMIN')throw new AppError('SUPER_ADMIN is protected.',403,'SYSTEM_ROLE_FORBIDDEN');if(await db.Role.findOne({where:{companyId,code:v,id:{[Op.ne]:x.id}},transaction:t}))throw new AppError('A role with this code already exists.',409,'ROLE_CODE_EXISTS');x.code=v}if(payload.description!==undefined)x.description=payload.description?String(payload.description).trim():null;if(payload.isActive!==undefined)x.isActive=payload.isActive===true;await x.save({transaction:t});if(Array.isArray(payload.permissionIds))await x.setPermissions(await perms(payload.permissionIds,t),{transaction:t})});return exports.getRole({companyId,roleId})};
exports.listUsers=async({companyId})=>(await db.User.findAll({where:{companyId},attributes:{exclude:['passwordHash']},include:[{model:db.Role,as:'roles',through:{attributes:[]},required:false}],order:[['firstName','ASC'],['lastName','ASC'],['email','ASC']]})).map(uj);
exports.getUser=async({companyId,userId})=>uj(await user(companyId,userId));
exports.createUser=async({companyId,payload})=>{const firstName=String(payload.firstName||'').trim(),lastName=payload.lastName?String(payload.lastName).trim():null,e=email(payload.email),u=uname(payload.username),password=String(payload.password||'');if(!firstName||!e||!u||!password)throw new AppError('First name, email, username and password are required.',400,'USER_REQUIRED_FIELDS_MISSING');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))throw new AppError('Please enter a valid email address.',400,'INVALID_EMAIL');if(password.length<8)throw new AppError('Password must be at least 8 characters.',400,'PASSWORD_TOO_SHORT');const id=await db.sequelize.transaction(async t=>{if(await db.User.findOne({where:{companyId,[Op.or]:[{email:e},{username:u}]},transaction:t}))throw new AppError('A user with this email or username already exists.',409,'USER_ALREADY_EXISTS');const rs=await roles(companyId,payload.roleIds,t);const x=await db.User.create({companyId,firstName,lastName,email:e,username:u,passwordHash:await bcrypt.hash(password,12),mobile:payload.mobile?String(payload.mobile).trim():null,status:'ACTIVE',isSuperAdmin:false,isActive:true,failedLoginAttempts:0,lockedUntil:null,passwordChangedAt:new Date()},{transaction:t});await x.setRoles(rs,{transaction:t});return x.id});return exports.getUser({companyId,userId:id})};
exports.updateUser=async({companyId,userId,payload})=>{await db.sequelize.transaction(async t=>{const x=await db.User.findOne({where:{id:userId,companyId},transaction:t});if(!x)throw new AppError('User not found.',404,'USER_NOT_FOUND');if(x.isSuperAdmin)throw new AppError('The super administrator cannot be modified through user management.',403,'SUPER_ADMIN_UPDATE_FORBIDDEN');if(payload.firstName!==undefined){const v=String(payload.firstName||'').trim();if(!v)throw new AppError('First name is required.',400,'FIRST_NAME_REQUIRED');x.firstName=v}if(payload.lastName!==undefined)x.lastName=payload.lastName?String(payload.lastName).trim():null;if(payload.email!==undefined){const v=email(payload.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new AppError('Please enter a valid email address.',400,'INVALID_EMAIL');if(await db.User.findOne({where:{companyId,email:v,id:{[Op.ne]:x.id}},transaction:t}))throw new AppError('This email address is already in use.',409,'EMAIL_ALREADY_EXISTS');x.email=v}if(payload.username!==undefined){const v=uname(payload.username);if(!v)throw new AppError('Username is required.',400,'USERNAME_REQUIRED');if(await db.User.findOne({where:{companyId,username:v,id:{[Op.ne]:x.id}},transaction:t}))throw new AppError('This username is already in use.',409,'USERNAME_ALREADY_EXISTS');x.username=v}if(payload.mobile!==undefined)x.mobile=payload.mobile?String(payload.mobile).trim():null;await x.save({transaction:t});if(Array.isArray(payload.roleIds))await x.setRoles(await roles(companyId,payload.roleIds,t),{transaction:t})});return exports.getUser({companyId,userId})};
exports.updateUserStatus=async({companyId,userId,actorUserId,isActive})=>{const x=await db.User.findOne({where:{id:userId,companyId}});if(!x)throw new AppError('User not found.',404,'USER_NOT_FOUND');if(x.isSuperAdmin)throw new AppError('The super administrator cannot be disabled.',403,'SUPER_ADMIN_DISABLE_FORBIDDEN');if(String(x.id)===String(actorUserId))throw new AppError('You cannot disable your own account.',400,'SELF_DISABLE_FORBIDDEN');const active=isActive===true;x.isActive=active;x.status=active?'ACTIVE':'INACTIVE';if(active){x.failedLoginAttempts=0;x.lockedUntil=null}await x.save();if(!active)await db.RefreshToken.update({isActive:false},{where:{userId:x.id,isActive:true}});return exports.getUser({companyId,userId})};

/*
|--------------------------------------------------------------------------
| Reset User Password
|--------------------------------------------------------------------------
*/
exports.resetUserPassword=async({companyId,userId,newPassword})=>{
  const password=String(newPassword||'');
  if(password.length<8)throw new AppError('Password must be at least 8 characters.',400,'PASSWORD_TOO_SHORT');
  if(password.length>128)throw new AppError('Password must not exceed 128 characters.',400,'PASSWORD_TOO_LONG');

  await db.sequelize.transaction(async t=>{
    const x=await db.User.findOne({where:{id:userId,companyId},transaction:t});
    if(!x)throw new AppError('User not found.',404,'USER_NOT_FOUND');
    if(x.isSuperAdmin)throw new AppError('The super administrator password cannot be reset through user management.',403,'SUPER_ADMIN_PASSWORD_RESET_FORBIDDEN');

    x.passwordHash=await bcrypt.hash(password,12);
    x.passwordChangedAt=new Date();
    x.failedLoginAttempts=0;
    x.lockedUntil=null;
    await x.save({transaction:t});

    await db.RefreshToken.update(
      {isActive:false},
      {where:{userId:x.id,isActive:true},transaction:t}
    );
  });

  return exports.getUser({companyId,userId});
};
