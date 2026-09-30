import { baseApi } from "./baseApi";
import type { KioskDeviceStatus } from "@/types/kiosk";
import type {
  CreateKioskDevicePayload, KioskDeviceActivationResponse,
  KioskDeviceListResponse, KioskDeviceStatusResponse
} from "@/types/kioskDevice";

export const kioskDevicesApi=baseApi.injectEndpoints({
  endpoints:(builder)=>({
    getKioskDevices:builder.query<KioskDeviceListResponse,void>({
      query:()=>({url:"/admin/kiosk/devices"}),
      providesTags:[{type:"KioskDevices",id:"LIST"}],
    }),
    createKioskDevice:builder.mutation<KioskDeviceActivationResponse,CreateKioskDevicePayload>({
      query:(body)=>({url:"/admin/kiosk/devices",method:"POST",body}),
      invalidatesTags:[{type:"KioskDevices",id:"LIST"}],
    }),
    regenerateKioskDeviceActivation:builder.mutation<KioskDeviceActivationResponse,string>({
      query:(id)=>({url:`/admin/kiosk/devices/${id}/regenerate-activation`,method:"POST"}),
      invalidatesTags:[{type:"KioskDevices",id:"LIST"}],
    }),
    changeKioskDeviceStatus:builder.mutation<KioskDeviceStatusResponse,{id:string;status:KioskDeviceStatus}>({
      query:({id,status})=>({url:`/admin/kiosk/devices/${id}/status`,method:"PATCH",body:{status}}),
      invalidatesTags:[{type:"KioskDevices",id:"LIST"}],
    }),
  }),overrideExisting:false,
});
export const {
  useGetKioskDevicesQuery,useCreateKioskDeviceMutation,
  useRegenerateKioskDeviceActivationMutation,useChangeKioskDeviceStatusMutation
}=kioskDevicesApi;
