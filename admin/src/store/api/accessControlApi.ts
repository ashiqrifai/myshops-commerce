import { baseApi } from "./baseApi";
import type {AccessPermission,AccessRole,AccessUser,ItemResponse,ListResponse,RoleInput,UserInput} from "@/types/accessControl";
export const accessControlApi=baseApi.injectEndpoints({endpoints:(b)=>({
getAccessPermissions:b.query<ListResponse<AccessPermission>,void>({query:()=>"/admin/access-control/permissions"}),
getAccessRoles:b.query<ListResponse<AccessRole>,void>({query:()=>"/admin/access-control/roles",providesTags:[{type:"AccessRoles" as const,id:"LIST"}]}),
createAccessRole:b.mutation<ItemResponse<AccessRole>,RoleInput>({query:(body)=>({url:"/admin/access-control/roles",method:"POST",body}),invalidatesTags:[{type:"AccessRoles" as const,id:"LIST"}]}),
updateAccessRole:b.mutation<ItemResponse<AccessRole>,{id:string;body:Partial<RoleInput>}>({query:({id,body})=>({url:`/admin/access-control/roles/${id}`,method:"PUT",body}),invalidatesTags:[{type:"AccessRoles" as const,id:"LIST"}]}),
getAccessUsers:b.query<ListResponse<AccessUser>,void>({query:()=>"/admin/access-control/users",providesTags:[{type:"AccessUsers" as const,id:"LIST"}]}),
createAccessUser:b.mutation<ItemResponse<AccessUser>,UserInput & {password:string}>({query:(body)=>({url:"/admin/access-control/users",method:"POST",body}),invalidatesTags:[{type:"AccessUsers" as const,id:"LIST"}]}),
updateAccessUser:b.mutation<ItemResponse<AccessUser>,{id:string;body:Partial<UserInput>}>({query:({id,body})=>({url:`/admin/access-control/users/${id}`,method:"PUT",body}),invalidatesTags:[{type:"AccessUsers" as const,id:"LIST"}]}),
changeAccessUserStatus:b.mutation<ItemResponse<AccessUser>,{id:string;isActive:boolean}>({query:({id,isActive})=>({url:`/admin/access-control/users/${id}/status`,method:"PATCH",body:{isActive}}),invalidatesTags:[{type:"AccessUsers" as const,id:"LIST"}]}),
resetAccessUserPassword:b.mutation<ItemResponse<AccessUser>,{id:string;newPassword:string}>({query:({id,newPassword})=>({url:`/admin/access-control/users/${id}/password`,method:"PATCH",body:{newPassword}}),invalidatesTags:[{type:"AccessUsers" as const,id:"LIST"}]})
}),overrideExisting:false});
export const {useGetAccessPermissionsQuery,useGetAccessRolesQuery,useCreateAccessRoleMutation,useUpdateAccessRoleMutation,useGetAccessUsersQuery,useCreateAccessUserMutation,useUpdateAccessUserMutation,useChangeAccessUserStatusMutation,useResetAccessUserPasswordMutation}=accessControlApi;
