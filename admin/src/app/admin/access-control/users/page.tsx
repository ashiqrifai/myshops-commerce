"use client";
import {FormEvent,useState} from "react";
import {Eye,EyeOff,Pencil,Plus,UserCog,X} from "lucide-react";
import {toast} from "sonner";
import {useChangeAccessUserStatusMutation,useCreateAccessUserMutation,useGetAccessRolesQuery,useGetAccessUsersQuery,useResetAccessUserPasswordMutation,useUpdateAccessUserMutation} from "@/store/api/accessControlApi";
import type {AccessUser} from "@/types/accessControl";

const blank=()=>({firstName:"",lastName:"",email:"",username:"",mobile:"",password:"",confirmPassword:"",roleIds:[] as string[]});
const message=(e:unknown,f:string)=>{const x=e as {data?:{error?:{message?:string};message?:string}};return x?.data?.error?.message||x?.data?.message||f};

export default function UsersPage(){
 const {data,isLoading}=useGetAccessUsersQuery();
 const {data:roleData}=useGetAccessRolesQuery();
 const [createUser,{isLoading:creating}]=useCreateAccessUserMutation();
 const [updateUser,{isLoading:updating}]=useUpdateAccessUserMutation();
 const [changeStatus,{isLoading:changing}]=useChangeAccessUserStatusMutation();
 const [resetPassword,{isLoading:resetting}]=useResetAccessUserPasswordMutation();
 const users=data?.data||[];
 const roles=(roleData?.data||[]).filter(r=>!r.isSystemRole&&r.isActive);
 const [open,setOpen]=useState(false);
 const [editing,setEditing]=useState<AccessUser|null>(null);
 const [form,setForm]=useState(blank());
 const [showPassword,setShowPassword]=useState(false);
 const [showConfirm,setShowConfirm]=useState(false);

 const close=()=>{setOpen(false);setEditing(null);setForm(blank());setShowPassword(false);setShowConfirm(false)};
 const newUser=()=>{close();setOpen(true)};
 const edit=(u:AccessUser)=>{setEditing(u);setForm({firstName:u.firstName,lastName:u.lastName||"",email:u.email,username:u.username,mobile:u.mobile||"",password:"",confirmPassword:"",roleIds:u.roles.map(r=>r.id)});setOpen(true)};
 const roleToggle=(id:string)=>setForm(f=>({...f,roleIds:f.roleIds.includes(id)?f.roleIds.filter(x=>x!==id):[...f.roleIds,id]}));

 const validPassword=()=>{
   if(!editing&&!form.password){toast.error("Password is required.");return false}
   if(editing&&!form.password&&!form.confirmPassword)return true;
   if(form.password.length<8){toast.error("Password must be at least 8 characters.");return false}
   if(form.password.length>128){toast.error("Password must not exceed 128 characters.");return false}
   if(form.password!==form.confirmPassword){toast.error("Password and confirm password do not match.");return false}
   return true;
 };

 const submit=async(e:FormEvent)=>{
   e.preventDefault();
   if(!validPassword())return;
   try{
     if(editing){
       await updateUser({id:editing.id,body:{firstName:form.firstName,lastName:form.lastName||null,email:form.email,username:form.username,mobile:form.mobile||null,roleIds:form.roleIds}}).unwrap();
       if(form.password){
         await resetPassword({id:editing.id,newPassword:form.password}).unwrap();
         toast.success("User updated and password changed successfully.");
       }else toast.success("User updated successfully.");
     }else{
       await createUser({firstName:form.firstName,lastName:form.lastName||null,email:form.email,username:form.username,mobile:form.mobile||null,password:form.password,roleIds:form.roleIds}).unwrap();
       toast.success("User created successfully.");
     }
     close();
   }catch(e){toast.error(message(e,"Unable to save user."))}
 };

 const toggleStatus=async(u:AccessUser)=>{
   try{await changeStatus({id:u.id,isActive:!u.isActive}).unwrap();toast.success(u.isActive?"User disabled successfully.":"User activated successfully.")}
   catch(e){toast.error(message(e,"Unable to change user status."))}
 };

 const busy=creating||updating||resetting;

 return <main className="min-h-screen bg-[#f6f6f7]"><div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
  <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
   <div><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white"><UserCog size={19}/></div><h1 className="text-2xl font-semibold">Users</h1></div><p className="mt-2 text-sm text-[#6d7175]">Create admin users, assign roles, manage access, and reset passwords.</p></div>
   <button onClick={newUser} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"><Plus size={17}/>New user</button>
  </header>

  <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
   {isLoading?<div className="p-8 text-sm">Loading users...</div>:<div className="divide-y">{users.map(u=><div key={u.id} className="flex flex-wrap items-center gap-4 p-5">
    <div className="min-w-[250px] flex-1"><p className="font-semibold">{u.fullName}{u.isSuperAdmin&&<span className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs">Super Admin</span>}</p><p className="text-sm text-gray-500">{u.email} · {u.username}</p><p className="text-xs text-gray-500">{u.roles.map(r=>r.name).join(", ")||"No role assigned"}</p></div>
    <span className={u.isActive?"text-sm text-emerald-700":"text-sm text-red-700"}>{u.isActive?"Active":"Inactive"}</span>
    {!u.isSuperAdmin&&<><button onClick={()=>edit(u)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Pencil size={15}/>Edit</button><button disabled={changing} onClick={()=>void toggleStatus(u)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{u.isActive?"Disable":"Activate"}</button></>}
   </div>)}</div>}
  </section>

  {open&&<div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 pt-10 sm:pt-16"><form onSubmit={submit} className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
   <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-lg font-semibold">{editing?"Edit User":"Create User"}</h2>{editing&&<p className="mt-1 text-xs text-gray-500">Leave password fields blank to keep the current password.</p>}</div><button type="button" onClick={close}><X size={20}/></button></div>
   <div className="grid gap-4 p-5 sm:grid-cols-2">
    <Field label="First Name"><input required className="h-11 w-full rounded-lg border border-[#c9cccf] bg-white px-3 text-sm outline-none focus:border-[#303030]" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></Field>
    <Field label="Last Name"><input className="h-11 w-full rounded-lg border border-[#c9cccf] bg-white px-3 text-sm outline-none focus:border-[#303030]" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></Field>
    <Field label="Email"><input required type="email" className="h-11 w-full rounded-lg border border-[#c9cccf] bg-white px-3 text-sm outline-none focus:border-[#303030]" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
    <Field label="Username"><input required className="h-11 w-full rounded-lg border border-[#c9cccf] bg-white px-3 text-sm outline-none focus:border-[#303030]" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></Field>
    <Field label="Mobile"><input className="h-11 w-full rounded-lg border border-[#c9cccf] bg-white px-3 text-sm outline-none focus:border-[#303030]" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})}/></Field>
    <div className="hidden sm:block"/>
    <Field label={editing?"New Password":"Password"}><PasswordInput value={form.password} show={showPassword} toggle={()=>setShowPassword(v=>!v)} onChange={v=>setForm({...form,password:v})} required={!editing}/></Field>
    <Field label="Confirm Password"><PasswordInput value={form.confirmPassword} show={showConfirm} toggle={()=>setShowConfirm(v=>!v)} onChange={v=>setForm({...form,confirmPassword:v})} required={!editing}/></Field>
   </div>
   <div className="border-t p-5"><p className="mb-3 font-semibold">Roles</p>{roles.length?roles.map(r=><label key={r.id} className="mt-3 flex cursor-pointer gap-3"><input type="checkbox" checked={form.roleIds.includes(r.id)} onChange={()=>roleToggle(r.id)}/><span>{r.name}</span></label>):<p className="text-sm text-gray-500">No assignable roles available.</p>}</div>
   <div className="flex justify-end gap-2 border-t p-5"><button type="button" onClick={close} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={busy} className="rounded-lg bg-[#303030] px-4 py-2 font-semibold text-white disabled:opacity-50">{busy?"Saving...":editing?"Save Changes":"Create User"}</button></div>
  </form></div>}
 </div></main>
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>}
function PasswordInput({value,show,toggle,onChange,required}:{value:string;show:boolean;toggle:()=>void;onChange:(v:string)=>void;required:boolean}){return <div className="relative"><input type={show?"text":"password"} minLength={required?8:undefined} required={required} value={value} onChange={e=>onChange(e.target.value)} className="h-11 w-full rounded-lg border border-[#c9cccf] bg-white px-3 pr-11 text-sm outline-none focus:border-[#303030]" autoComplete="new-password"/><button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>}
