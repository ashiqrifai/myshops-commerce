"use client";

import Link from "next/link";
import {
  AlertTriangle, Badge, BadgeDollarSign, CalendarClock, ChevronDown,
  ChevronRight, DollarSign, FileText, FileUp, FolderKanban, FolderTree,
  Grid3X3, Home, Images, KeyRound, Link2, LogOut, Menu, MonitorCog,
  Package, PanelTop, Search, Settings, ShieldCheck, ShoppingBag, Shapes,
  Store, TicketPercent, Truck, UserCog, Users, Warehouse,
} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import {toast} from "sonner";
import {useLogoutMutation} from "@/store/api/authApi";
import {clearCredentials} from "@/store/slices/authSlice";
import {useAppDispatch,useAppSelector} from "@/store/hooks";

interface AdminShellProps { children: React.ReactNode; }
interface NavigationChild { name:string; href:string; icon:React.ElementType; permission?:string; }
interface NavigationItem { name:string; href?:string; icon:React.ElementType; permission?:string; children?:NavigationChild[]; }

const navigation:NavigationItem[]=[
 {name:"Home",href:"/dashboard",icon:Home},
 {name:"Orders",href:"/orders",icon:ShoppingBag,permission:"orders.read"},
 {name:"Payment Exceptions",href:"/admin/payment-exceptions",icon:AlertTriangle,permission:"payment-exceptions.read"},
 {name:"Catalog",icon:Package,children:[
  {name:"Products",href:"/admin/products",icon:Package,permission:"products.read"},
  {name:"Product Import",href:"/admin/products/import",icon:FileUp,permission:"products.import"},
  {name:"Categories",href:"/admin/categories",icon:FolderTree,permission:"categories.read"},
  {name:"Brands",href:"/admin/brands",icon:Badge,permission:"brands.read"},
  {name:"Attributes",href:"/admin/attributes",icon:Shapes,permission:"attributes.read"},
  {name:"Collections",href:"/admin/collections",icon:FolderKanban,permission:"collections.read"},
 ]},
 {name:"Pricing",icon:DollarSign,children:[
  {name:"Price Lists",href:"/admin/price-lists",icon:DollarSign,permission:"pricing.read"},
  {name:"Variant Pricing",href:"/admin/variant-prices",icon:BadgeDollarSign,permission:"variant-pricing.read"},
  {name:"Coupons",href:"/admin/coupons",icon:TicketPercent,permission:"coupons.read"},
  {name:"Gift Voucher Promotions",href:"/admin/gift-voucher-promotions",icon:TicketPercent,permission:"gift-voucher-promotions.read"},
  {name:"Bundle Promotions",href:"/admin/bundle-promotions",icon:Package,permission:"bundle-promotions.read"},
  {name:"Pricing Center",href:"/admin/pricing-center",icon:Grid3X3,permission:"pricing-center.read"},
 ]},
 {name:"Fulfillment",icon:Truck,children:[
  {name:"Suppliers",href:"/admin/suppliers",icon:Truck,permission:"suppliers.read"},
  {name:"Inventory Locations",href:"/admin/inventory-locations",icon:Warehouse,permission:"inventory-locations.read"},
  {name:"Inventory",href:"/admin/inventory",icon:Package,permission:"inventory.read"},
 ]},
 {name:"Media",href:"/media",icon:Images,permission:"media.read"},
 {name:"Content",icon:PanelTop,children:[
  {name:"Pages",href:"/cms/pages",icon:FileText,permission:"cms.pages.read"},
  {name:"Navigation",href:"/admin/cms/navigation",icon:Menu,permission:"cms-navigation.read"},
  {name:"Instagram Gallery",href:"/admin/instagram-posts",icon:Images,permission:"instagram-posts.read"},
 ]},
 {name:"Customers",href:"/customers",icon:Users,permission:"customers.read"},
 {name:"Kiosk",href:"/kiosk",icon:MonitorCog,permission:"kiosk.read"},
 {name:"Product Attachments",href:"/admin/product-attachments",icon:Link2,permission:"product-attachments.read"},
 {name:"Pre-booking",href:"/admin/pre-booking",icon:CalendarClock,permission:"pre-booking.read"},
 {name:"Protection",href:"/admin/protection",icon:ShieldCheck,permission:"protection.read"},
 {name:"Access Control",icon:UserCog,children:[
  {name:"Users",href:"/admin/access-control/users",icon:UserCog,permission:"users.read"},
  {name:"Roles & Permissions",href:"/admin/access-control/roles",icon:KeyRound,permission:"roles.read"},
 ]},
 {name:"Settings",href:"/settings",icon:Settings,permission:"system.settings.read"},
];

export default function AdminShell({children}:AdminShellProps){
 const pathname=usePathname(),router=useRouter(),dispatch=useAppDispatch();
 const user=useAppSelector(state=>state.auth.user);

 const visibleNavigation=useMemo(()=>{
  const can=(permission?:string)=>user?.isSuperAdmin===true||!permission||user?.permissions?.includes(permission)===true;
  return navigation.map(item=>item.children?{...item,children:item.children.filter(child=>can(child.permission))}:item)
   .filter(item=>item.children?item.children.length>0:can(item.permission));
 },[user?.isSuperAdmin,user?.permissions]);

 const groupActive=(name:string)=>{
  const item=visibleNavigation.find(x=>x.name===name);
  return item?.children?.some(child=>pathname===child.href||pathname.startsWith(`${child.href}/`))===true;
 };
 const [expanded,setExpanded]=useState<Record<string,boolean>>({
  Catalog:false,Pricing:false,Fulfillment:false,Content:false,"Access Control":false
 });
 useEffect(()=>{
  setExpanded(current=>{
   const next={...current};
   for(const name of ["Catalog","Pricing","Fulfillment","Content","Access Control"]) if(groupActive(name)) next[name]=true;
   return next;
  });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[pathname,visibleNavigation]);

 const [logout,{isLoading}]=useLogoutMutation();
 const handleLogout=async()=>{
  try{await logout().unwrap()}catch{}
  localStorage.removeItem("myshops.admin.accessToken");
  localStorage.removeItem("myshops.admin.user");
  dispatch(clearCredentials());
  toast.success("Logged out successfully.");
  router.replace("/login");
 };

 return <div className="min-h-screen bg-[#f6f6f7]">
  <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-[#dfe3e8] bg-[#1a1a1a] px-4 text-white">
   <div className="flex w-[230px] items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1a1a1a]"><Store size={18}/></div><div><p className="text-sm font-semibold leading-tight">MyShops</p><p className="text-[11px] text-white/60">Commerce Admin</p></div></div>
   <div className="mx-auto hidden w-full max-w-xl md:block"><div className="flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm text-white/70"><Search size={16}/><span>Search admin</span></div></div>
   <button type="button" className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4fed2] text-sm font-semibold text-[#163b25]">{user?.firstName?.charAt(0)||"M"}</div><div className="hidden text-left lg:block"><p className="text-xs font-medium">{user?.fullName||"Administrator"}</p><p className="text-[10px] text-white/60">{user?.company?.name||"MyShops"}</p></div><ChevronDown size={14} className="hidden lg:block"/></button>
  </header>

  <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-[230px] border-r border-[#dfe3e8] bg-[#ebebeb] px-3 py-4 lg:block">
   <nav className="space-y-1">{visibleNavigation.map(item=>{
    const Icon=item.icon;
    if(item.children&&item.children.length){
     const isExpanded=expanded[item.name]??false;
     const active=item.children.some(child=>pathname===child.href||pathname.startsWith(`${child.href}/`));
     return <div key={item.name}>
      <button type="button" onClick={()=>setExpanded(current=>({...current,[item.name]:!current[item.name]}))} className={["flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition",active?"bg-[#d4d4d4] text-[#202223]":"text-[#4d5156] hover:bg-[#dedede]"].join(" ")}><Icon size={18}/><span className="flex-1 text-left">{item.name}</span>{isExpanded?<ChevronDown size={15}/>:<ChevronRight size={15}/>}</button>
      {isExpanded&&<div className="ml-5 mt-1 space-y-1 border-l border-[#c9cccf] pl-3">{item.children.map(child=>{const ChildIcon=child.icon;const childActive=pathname===child.href||pathname.startsWith(`${child.href}/`);return <Link key={child.href} href={child.href} className={["flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",childActive?"bg-white text-[#202223] shadow-sm":"text-[#5c5f62] hover:bg-[#dedede]"].join(" ")}><ChildIcon size={16}/><span>{child.name}</span></Link>})}</div>}
     </div>
    }
    if(!item.href)return null;
    const active=pathname===item.href||pathname.startsWith(`${item.href}/`);
    return <Link key={`${item.href}-${item.name}`} href={item.href} className={["flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",active?"bg-[#d4d4d4] text-[#202223]":"text-[#4d5156] hover:bg-[#dedede]"].join(" ")}><Icon size={18}/><span>{item.name}</span></Link>
   })}</nav>
   <div className="absolute bottom-4 left-3 right-3"><button type="button" disabled={isLoading} onClick={handleLogout} className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#4d5156] hover:bg-[#dedede] disabled:opacity-50"><LogOut size={18}/><span>{isLoading?"Logging out...":"Log out"}</span></button></div>
  </aside>

  <main className="min-h-screen pt-14 lg:pl-[230px]">{children}</main>
 </div>
}
