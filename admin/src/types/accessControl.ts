export interface AccessPermission { id:string; name:string; code:string; module:string; description?:string|null; isActive:boolean; }
export interface AccessRole { id:string; companyId:string; name:string; code:string; description?:string|null; isSystemRole:boolean; isActive:boolean; permissions:AccessPermission[]; createdAt:string; updatedAt:string; }
export interface AccessUserRole { id:string; name:string; code:string; isActive:boolean; }
export interface AccessUser { id:string; companyId:string; firstName:string; lastName?:string|null; fullName:string; email:string; username:string; mobile?:string|null; avatarUrl?:string|null; status:string; isSuperAdmin:boolean; isActive:boolean; lastLoginAt?:string|null; roles:AccessUserRole[]; createdAt:string; updatedAt:string; }
export interface ListResponse<T>{success:boolean;data:T[]}
export interface ItemResponse<T>{success:boolean;data:T;message?:string}
export interface RoleInput{name:string;code:string;description?:string|null;isActive?:boolean;permissionIds:string[]}
export interface UserInput{firstName:string;lastName?:string|null;email:string;username:string;mobile?:string|null;password?:string;roleIds:string[]}
