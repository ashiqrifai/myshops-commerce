"use client";

import Link from "next/link";
import { CheckCircle2, Copy, KeyRound, Plus, RefreshCw, TabletSmartphone, X, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetKioskProfilesQuery } from "@/store/api/kioskProfilesApi";
import {
  useChangeKioskDeviceStatusMutation,
  useCreateKioskDeviceMutation,
  useGetKioskDevicesQuery,
  useRegenerateKioskDeviceActivationMutation,
} from "@/store/api/kioskDevicesApi";
import type { KioskDeviceStatus } from "@/types/kiosk";

type DeviceForm={kioskProfileId:string;deviceName:string;deviceCode:string};
type Activation={deviceName:string;deviceCode:string;activationCode:string};
const empty:DeviceForm={kioskProfileId:"",deviceName:"",deviceCode:""};

function msg(error:unknown,fallback:string){
  if(error&&typeof error==="object"&&"data" in error){
    const d=(error as {data?:{error?:{message?:string};message?:string}}).data;
    return d?.error?.message||d?.message||fallback;
  }
  return fallback;
}
function date(v?:string|null){
  if(!v)return "Never";
  const d=new Date(v); return Number.isNaN(d.getTime())?v:d.toLocaleString();
}

export default function KioskDevicesPage(){
  const [showCreate,setShowCreate]=useState(false);
  const [form,setForm]=useState<DeviceForm>(empty);
  const [activation,setActivation]=useState<Activation|null>(null);

  const profilesQ=useGetKioskProfilesQuery();
  const devicesQ=useGetKioskDevicesQuery();
  const [createDevice,{isLoading:creating}]=useCreateKioskDeviceMutation();
  const [regenerate,{isLoading:regenerating}]=useRegenerateKioskDeviceActivationMutation();
  const [changeStatus,{isLoading:changing}]=useChangeKioskDeviceStatusMutation();

  const profiles=profilesQ.data?.data||[];
  const devices=devicesQ.data?.data||[];

  const chooseProfile=(id:string)=>{
    const p=profiles.find(x=>x.id===id);
    setForm(cur=>({
      ...cur,kioskProfileId:id,
      deviceName:cur.deviceName||(p?`${p.name} 01`:""),
      deviceCode:cur.deviceCode||(p?.code?`${p.code.replace(/_KIOSK$/,"")}_K01`:""),
    }));
  };

  const create=async()=>{
    if(!form.kioskProfileId)return toast.error("Select a kiosk profile.");
    if(!form.deviceName.trim())return toast.error("Device name is required.");
    if(!form.deviceCode.trim())return toast.error("Device code is required.");
    try{
      const r=await createDevice({
        kioskProfileId:form.kioskProfileId,
        deviceName:form.deviceName.trim(),
        deviceCode:form.deviceCode.trim().toUpperCase(),
        settings:{},
      }).unwrap();
      setActivation({
        deviceName:r.data.device.deviceName,
        deviceCode:r.data.device.deviceCode,
        activationCode:r.data.activationCode,
      });
      setForm(empty);setShowCreate(false);toast.success("Kiosk device created.");
    }catch(e){toast.error(msg(e,"Unable to create kiosk device."));}
  };

  const regen=async(id:string)=>{
    if(!window.confirm("Generate a new activation code? The current device token will be revoked immediately."))return;
    try{
      const r=await regenerate(id).unwrap();
      setActivation({deviceName:r.data.device.deviceName,deviceCode:r.data.device.deviceCode,activationCode:r.data.activationCode});
      toast.success("New activation code generated.");
    }catch(e){toast.error(msg(e,"Unable to regenerate activation code."));}
  };

  const status=async(id:string,next:KioskDeviceStatus)=>{
    if(!window.confirm(next==="DISABLED"?"Disable this kiosk? Its device token will stop working immediately.":`Change device status to ${next}?`))return;
    try{await changeStatus({id,status:next}).unwrap();toast.success(`Device status changed to ${next}.`);}
    catch(e){toast.error(msg(e,"Unable to change device status."));}
  };

  const copy=async()=>{
    if(!activation)return;
    try{await navigator.clipboard.writeText(activation.activationCode);toast.success("Activation code copied.");}
    catch{toast.error("Unable to copy activation code.");}
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-3"><TabletSmartphone className="h-7 w-7"/><h1 className="text-2xl font-semibold">Kiosk Devices</h1></div>
        <p className="mt-2 text-sm text-slate-500">Register, activate and manage physical Android kiosks.</p>
        <Link href="/admin/kiosk" className="mt-2 inline-block text-sm font-medium text-blue-600">← Back to Kiosk Profiles</Link>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>devicesQ.refetch()} disabled={devicesQ.isFetching} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${devicesQ.isFetching?"animate-spin":""}`}/>Refresh</button>
        <button onClick={()=>setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"><Plus className="h-4 w-4"/>Add Device</button>
      </div>
    </div>

    {showCreate&&<div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">New Kiosk Device</h2>
      <p className="mt-1 text-sm text-slate-500">Assign this physical unit to a store kiosk profile.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Field label="Kiosk Profile"><select value={form.kioskProfileId} onChange={e=>chooseProfile(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm"><option value="">Select profile</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name} — {p.code}</option>)}</select></Field>
        <Field label="Device Name"><input value={form.deviceName} onChange={e=>setForm({...form,deviceName:e.target.value})} className="w-full rounded-lg border px-3 py-2.5 text-sm" placeholder="Deira City Center Kiosk 01"/></Field>
        <Field label="Device Code"><input value={form.deviceCode} onChange={e=>setForm({...form,deviceCode:e.target.value.toUpperCase()})} className="w-full rounded-lg border px-3 py-2.5 font-mono text-sm" placeholder="DXB_DEIRA_CC_K01"/></Field>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button onClick={()=>{setForm(empty);setShowCreate(false)}} className="rounded-lg border px-4 py-2.5 text-sm">Cancel</button><button onClick={create} disabled={creating} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{creating?"Creating...":"Create Device"}</button></div>
    </div>}

    <div className="rounded-xl border bg-white shadow-sm">
      {devicesQ.isLoading?<div className="p-8 text-sm text-slate-500">Loading kiosk devices...</div>:
      devices.length===0?<div className="flex flex-col items-center px-6 py-16 text-center"><TabletSmartphone className="mb-4 h-10 w-10 text-slate-400"/><h2 className="text-lg font-semibold">No kiosk devices yet</h2><p className="mt-2 text-sm text-slate-500">Register the first physical Android kiosk.</p></div>:
      <div className="divide-y">{devices.map(d=><div key={d.id} className="p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100"><TabletSmartphone className="h-5 w-5"/></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{d.deviceName}</h2><Status status={d.status}/></div><p className="mt-1 font-mono text-xs text-slate-500">{d.deviceCode}</p></div></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Store" value={d.kioskProfile?.inventoryLocation?.name||"—"} sub={d.kioskProfile?.inventoryLocation?.code}/>
              <Info label="Profile" value={d.kioskProfile?.name||"—"} sub={d.kioskProfile?.code}/>
              <Info label="App Version" value={d.appVersion||"Not reported"}/>
              <Info label="Last Seen" value={date(d.lastSeenAt)}/>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>regen(d.id)} disabled={regenerating||changing} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"><KeyRound className="h-4 w-4"/>Regenerate Activation</button>
            {d.status==="ACTIVE"?<button onClick={()=>status(d.id,"DISABLED")} disabled={changing} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50">Disable</button>:
            d.status==="DISABLED"?<button onClick={()=>regen(d.id)} disabled={regenerating} className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">Prepare Re-activation</button>:
            <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Awaiting activation</span>}
          </div>
        </div>
      </div>)}</div>}
    </div>

    {activation&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">One-time Activation Code</h2><p className="mt-1 text-sm text-slate-500">Use this code on the Android kiosk activation screen.</p></div><button onClick={()=>setActivation(null)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5"/></button></div>
        <div className="mt-5 rounded-xl border bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Device</p><p className="mt-1 font-medium">{activation.deviceName}</p><p className="mt-1 font-mono text-xs text-slate-500">{activation.deviceCode}</p></div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-medium text-amber-900">Save this code now</p><p className="mt-1 text-xs text-amber-800">The raw activation code is shown only in this response and cannot be retrieved later.</p></div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border p-3"><code className="min-w-0 flex-1 break-all text-sm font-semibold">{activation.activationCode}</code><button onClick={copy} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"><Copy className="h-4 w-4"/>Copy</button></div>
        <div className="mt-6 flex justify-end"><button onClick={()=>setActivation(null)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">I have saved the code</button></div>
      </div>
    </div>}
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="mb-2 block text-sm font-medium">{label}</label>{children}</div>}
function Info({label,value,sub}:{label:string;value:string;sub?:string|null}){return <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-medium">{value}</p>{sub&&<p className="mt-1 text-xs text-slate-500">{sub}</p>}</div>}
function Status({status}:{status:KioskDeviceStatus}){
  if(status==="ACTIVE")return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5"/>Active</span>;
  if(status==="DISABLED")return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700"><XCircle className="h-3.5 w-3.5"/>Disabled</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><KeyRound className="h-3.5 w-3.5"/>Pending</span>;
}
